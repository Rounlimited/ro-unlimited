import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logEmail } from '@/lib/email';

function parseEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : raw.toLowerCase().trim();
}

// Attachments live in Supabase Storage (bucket: email-attachments).
// Previously they went to Sanity, but SANITY_API_WRITE_TOKEN is read-only so
// every upload 403'd and attachments were silently dropped (has_attachments
// stayed true with zero rows in email_attachments).
const ATTACHMENT_BUCKET = 'email-attachments';

async function uploadAttachment(
  supabase: ReturnType<typeof createAdminClient>,
  messageId: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  try {
    const safeName = filename.replace(/[^\w.\-]+/g, '_').slice(-100);
    const path = `${messageId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (error) {
      console.error('[inbound] Storage upload failed:', error.message);
      return null;
    }
    const { data } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (err) {
    console.error('[inbound] Storage upload exception:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Resend webhook signature if secret is set
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      const { Webhook } = await import('svix');
      const svixId = req.headers.get('svix-id');
      const svixTimestamp = req.headers.get('svix-timestamp');
      const svixSignature = req.headers.get('svix-signature');
      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }
      try {
        const wh = new Webhook(secret);
        wh.verify(rawBody, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature });
      } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let event;
    try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    if (event.type !== 'email.received') {
      return NextResponse.json({ success: true, skipped: true });
    }

    const { email_id, from, to, subject } = event.data as {
      email_id: string; from: string; to: string | string[]; subject: string;
    };

    const apiKey = process.env.RESEND_API_KEY;

    // Fetch full email body from Resend
    let body_html: string | null = null;
    let body_text: string | null = null;
    let in_reply_to: string | null = null;
    let attachmentsMeta: { id: string; filename: string; content_type: string; size: number; content_disposition: string }[] = [];

    try {
      const resp = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const full = await resp.json();
        body_html = full.html || null;
        body_text = full.text || null;
        const headers = full.headers || {};
        in_reply_to = headers['in-reply-to'] || headers['In-Reply-To'] || null;
        if (in_reply_to) in_reply_to = in_reply_to.replace(/[<>]/g, '').trim();
        attachmentsMeta = (full.attachments || []).filter(
          (a: { content_disposition: string }) => a.content_disposition === 'attachment'
        );
      }
    } catch (err) {
      console.error('Failed to fetch full email from Resend:', err);
    }

    const from_email = parseEmail(typeof from === 'string' ? from : String(from));
    const to_email = parseEmail(typeof to === 'string' ? to : Array.isArray(to) ? to[0] : 'build@rounlimited.com');
    const subjectStr = subject || '(no subject)';

    const supabase = createAdminClient();

    // Check if to_email matches a configured email account — spam if not
    const { data: knownAccounts } = await supabase
      .from('email_accounts')
      .select('email')
      .eq('active', true);
    const knownEmails = (knownAccounts || []).map(a => a.email.toLowerCase());
    const isKnownRecipient = knownEmails.length === 0 || knownEmails.includes(to_email);

    // Auto-purge spam older than 90 days
    if (isKnownRecipient === false) {
      try {
        const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
        await supabase.from('email_messages').delete().eq('folder', 'spam').lt('created_at', cutoff);
      } catch { /* non-critical */ }
    }

    // Try to find existing thread via In-Reply-To
    let threadId: string | undefined;
    if (in_reply_to) {
      const resendUuid = in_reply_to.includes('@') ? in_reply_to.split('@')[0] : in_reply_to;
      const { data: original } = await supabase
        .from('email_messages').select('thread_id')
        .eq('resend_message_id', resendUuid).single();
      if (original) threadId = original.thread_id;
    }

    // Fallback: match by sender + subject
    if (!threadId) {
      const cleanSubject = subjectStr.replace(/^(Re:|Fwd?:)\s*/gi, '').trim();
      const { data: match } = await supabase
        .from('email_messages').select('thread_id')
        .eq('to_email', from_email).ilike('subject', `%${cleanSubject}%`)
        .order('created_at', { ascending: false }).limit(1).single();
      if (match) threadId = match.thread_id;
    }

    const logged = await logEmail({
      thread_id: threadId,
      direction: 'inbound',
      from_email,
      to_email,
      subject: subjectStr,
      body_html: body_html ?? undefined,
      body_text: body_text ?? undefined,
      has_attachments: attachmentsMeta.length > 0,
      folder: isKnownRecipient ? 'inbox' : 'spam',
      read: isKnownRecipient ? false : true,
    });

    // Store the Resend email id — enables attachment re-fetch/recovery and
    // better reply threading (was never saved for inbound before)
    if (logged?.id) {
      await supabase.from('email_messages')
        .update({ resend_message_id: email_id })
        .eq('id', logged.id)
        .then(() => {}, () => {});
    }

    // Process attachments — download from Resend, upload to Supabase Storage, save to DB
    let attachmentsSaved = 0;
    if (logged?.id && attachmentsMeta.length > 0 && apiKey) {
      for (const att of attachmentsMeta) {
        try {
          // Get download URL from Resend
          const attResp = await fetch(
            `https://api.resend.com/emails/receiving/${email_id}/attachments/${att.id}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          if (!attResp.ok) { console.error('[inbound] Resend attachment meta fetch failed:', attResp.status, att.filename); continue; }
          const attData = await attResp.json();
          if (!attData.download_url) { console.error('[inbound] No download_url for attachment:', att.filename); continue; }

          // Download the file
          const fileResp = await fetch(attData.download_url);
          if (!fileResp.ok) { console.error('[inbound] Attachment download failed:', fileResp.status, att.filename); continue; }
          const buffer = Buffer.from(await fileResp.arrayBuffer());

          // Upload to Supabase Storage
          const publicUrl = await uploadAttachment(supabase, logged.id, att.filename, buffer, att.content_type);
          if (!publicUrl) continue;

          // Save to email_attachments
          const { error: insErr } = await supabase.from('email_attachments').insert({
            message_id: logged.id,
            filename: att.filename,
            content_type: att.content_type,
            size_bytes: att.size || buffer.length,
            s3_key: `supabase:${att.filename}`,
            s3_url: publicUrl,
          });
          if (insErr) { console.error('[inbound] email_attachments insert failed:', insErr.message); continue; }
          attachmentsSaved++;
        } catch (attErr) {
          console.error(`Failed to process attachment ${att.filename}:`, attErr);
        }
      }
      // Keep the flag honest if every attachment failed to store
      if (attachmentsSaved === 0) {
        console.error('[inbound] ALL attachments failed to store for message', logged.id);
      }
    }

    // Send push notification for new email (skip spam)
    if (isKnownRecipient) try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      await fetch(`${siteUrl}/api/admin/push-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-push-secret': process.env.PUSH_SECRET || '',
        },
        body: JSON.stringify({
          title: `New Email from ${from_email}`,
          body: subjectStr,
          url: '/admin/inbox',
          tag: 'email-' + (logged?.thread_id || 'new'),
        }),
      });
    } catch (pushErr) {
      console.error('Push notification failed (non-fatal):', pushErr);
    }

    return NextResponse.json({
      success: true,
      message_id: logged?.id,
      thread_id: logged?.thread_id,
      attachments_found: attachmentsMeta.length,
      attachments_saved: attachmentsSaved,
    });
  } catch (err: unknown) {
    console.error('Inbound route error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Server error', detail: msg }, { status: 500 });
  }
}
