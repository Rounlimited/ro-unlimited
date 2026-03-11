import { createAdminClient } from '@/lib/supabase/server';

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';

export interface EmailMessage {
  id: string;
  thread_id: string;
  lead_id: string | null;
  direction: 'outbound' | 'inbound';
  from_email: string;
  to_email: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  resend_message_id: string | null;
  read: boolean;
  starred: boolean;
  folder: EmailFolder;
  has_attachments: boolean;
  is_draft: boolean;
  cc_emails: string[];
  bcc_emails: string[];
  created_at: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  s3_key: string;
  s3_url: string;
  created_at: string;
}

export interface EmailContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  category: 'customer' | 'vendor' | 'contractor' | 'subcontractor' | 'other';
  notes: string | null;
  starred: boolean;
  created_at: string;
  updated_at: string;
}

export const FROM_EMAIL = 'build@rounlimited.com';
export const FROM_NAME = 'RO Unlimited';

// Log an email to Supabase
export async function logEmail(params: {
  thread_id?: string;
  lead_id?: string | null;
  direction: 'outbound' | 'inbound';
  from_email: string;
  to_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  resend_message_id?: string;
  folder?: EmailFolder;
  is_draft?: boolean;
  has_attachments?: boolean;
  cc_emails?: string[];
  bcc_emails?: string[];
  read?: boolean;
}): Promise<EmailMessage | null> {
  const supabase = createAdminClient();
  const folder = params.folder || (params.is_draft ? 'drafts' : params.direction === 'outbound' ? 'sent' : 'inbox');
  const { data, error } = await supabase
    .from('email_messages')
    .insert({
      thread_id: params.thread_id || undefined,
      lead_id: params.lead_id || null,
      direction: params.direction,
      from_email: params.from_email,
      to_email: params.to_email,
      subject: params.subject,
      body_html: params.body_html || null,
      body_text: params.body_text || null,
      resend_message_id: params.resend_message_id || null,
      read: params.read ?? (params.direction === 'outbound'),
      folder,
      is_draft: params.is_draft || false,
      has_attachments: params.has_attachments || false,
      cc_emails: params.cc_emails || [],
      bcc_emails: params.bcc_emails || [],
    })
    .select()
    .single();
  if (error) { console.error('Failed to log email:', error); return null; }
  return data as EmailMessage;
}

// Branded HTML email template
export function buildEmailHtml(toName: string, bodyHtml: string, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1B2A4A,#243660);padding:28px 32px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">RO Unlimited</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Construction &amp; Development · Upstate South Carolina</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;">
            <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <div style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.7;">${bodyHtml}</div>
            <p style="margin:24px 0 0;color:#333;font-size:15px;line-height:1.6;">
              Best regards,<br>
              <strong style="color:#1B2A4A;">RO Unlimited Construction &amp; Development</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #eee;">
            <p style="margin:0 0 4px;color:#888;font-size:12px;">
              (864) 304-0139 &nbsp;·&nbsp;
              <a href="mailto:build@rounlimited.com" style="color:#D4772C;text-decoration:none;">build@rounlimited.com</a>
            </p>
            <p style="margin:0;color:#aaa;font-size:11px;">Serving Upstate South Carolina · Georgia · North Carolina</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}
