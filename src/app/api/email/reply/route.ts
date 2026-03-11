import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { logEmail, buildEmailHtml, stripHtml } from '@/lib/email';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { thread_id, to_email, to_name, subject, reply_body, reply_html, lead_id } = body;

  if (!thread_id || !to_email || (!reply_body && !reply_html)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const customerName = to_name || to_email.split('@')[0];
  const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your inquiry'}`;
  const plainText = reply_body || stripHtml(reply_html || '');
  const html = buildEmailHtml(customerName, reply_html || reply_body.replace(/\n/g, '<br>'), subject || 'Your inquiry');

  // Get In-Reply-To for email threading
  let inReplyToHeader: string | undefined;
  const { data: lastMsg } = await supabase
    .from('email_messages')
    .select('resend_message_id')
    .eq('thread_id', thread_id)
    .not('resend_message_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (lastMsg?.resend_message_id) {
    inReplyToHeader = `<${lastMsg.resend_message_id}@resend.dev>`;
  }

  let resendMessageId: string | undefined;
  try {
    const r = getResend();
    const params: Parameters<typeof r.emails.send>[0] = {
      from: 'RO Unlimited <noreply@rounlimited.com>',
      to: [to_email],
      subject: replySubject,
      html,
    };
    if (inReplyToHeader) {
      params.headers = { 'In-Reply-To': inReplyToHeader, 'References': inReplyToHeader };
    }

    const { data, error } = await r.emails.send(params);
    if (error) { console.error('Resend error:', error); return NextResponse.json({ error: 'Failed to send' }, { status: 500 }); }
    resendMessageId = data?.id;
  } catch (err) {
    console.error('Resend exception:', err);
    return NextResponse.json({ error: 'Email service error' }, { status: 500 });
  }

  const logged = await logEmail({
    thread_id,
    lead_id: lead_id || null,
    direction: 'outbound',
    from_email: 'noreply@rounlimited.com',
    to_email,
    subject: replySubject,
    body_html: html,
    body_text: plainText,
    resend_message_id: resendMessageId,
    folder: 'sent',
  });

  return NextResponse.json({ success: true, message_id: logged?.id, resend_id: resendMessageId });
}
