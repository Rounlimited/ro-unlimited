import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logEmail } from '@/lib/email';

function parseEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : raw.toLowerCase().trim();
}

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3at2yyx0';
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const SANITY_TOKEN = process.env.SANITY_API_WRITE_TOKEN || '';

async function uploadToSanity(buffer: Buffer, contentType: string): Promise<string | null> {
  try {
    const ext = contentType.split('/')[1]?.split('+')[0] || 'bin';
    const isImage = contentType.startsWith('image/');
    const assetType = isImage ? 'images' : 'files';
    const res = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/${assetType}/${SANITY_DATASET}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SANITY_TOKEN}`,
          'Content-Type': contentType,
        },
        body: buffer,
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.document?.url || null;
  } catch {
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
    });

    // Process attachments — download from Resend, upload to Sanity, save to DB
    if (logged?.id && attachmentsMeta.length > 0 && apiKey && SANITY_TOKEN) {
      for (const att of attachmentsMeta) {
        try {
          // Get download URL from Resend
          const attResp = await fetch(
            `https://api.resend.com/emails/receiving/${email_id}/attachments/${att.id}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          if (!attResp.ok) continue;
          const attData = await attResp.json();
          if (!attData.download_url) continue;

          // Download the file
          const fileResp = await fetch(attData.download_url);
          if (!fileResp.ok) continue;
          const buffer = Buffer.from(await fileResp.arrayBuffer());

          // Upload to Sanity
          const sanityUrl = await uploadToSanity(buffer, att.content_type);
          if (!sanityUrl) continue;

          // Save to email_attachments
          await supabase.from('email_attachments').insert({
            message_id: logged.id,
            filename: att.filename,
            content_type: att.content_type,
            size_bytes: att.size || buffer.length,
            s3_key: `sanity:${att.filename}`,
            s3_url: sanityUrl,
          });
        } catch (attErr) {
          console.error(`Failed to process attachment ${att.filename}:`, attErr);
        }
      }
    }

    // Send push notification for new email
    try {
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
      attachments_saved: attachmentsMeta.length,
    });
  } catch (err: unknown) {
    console.error('Inbound route error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Server error', detail: msg }, { status: 500 });
  }
}
