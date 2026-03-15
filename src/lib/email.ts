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

// --- Multi-Account Configuration ---
export interface EmailAccount {
  email: string;
  display_name: string;
  color: string;       // avatar/badge color
  initials: string;    // 2-char badge
}

export const EMAIL_ACCOUNTS: EmailAccount[] = [
  { email: 'build@rounlimited.com', display_name: 'RO Unlimited', color: '#D4772C', initials: 'RO' },
  { email: 'jr@rounlimited.com', display_name: 'JR — RO Unlimited', color: '#1B2A4A', initials: 'JR' },
  { email: 'info@rounlimited.com', display_name: 'RO Unlimited Info', color: '#2a6a4a', initials: 'IN' },
  { email: 'sarah@rounlimited.com', display_name: 'Sarah — RO Unlimited', color: '#7C3AED', initials: 'SA' },
  { email: 'david@rounlimited.com', display_name: 'David — RO Unlimited', color: '#0891B2', initials: 'DA' },
];

export const DEFAULT_FROM_EMAIL = 'build@rounlimited.com';

export function getAccountConfig(email: string): EmailAccount {
  return EMAIL_ACCOUNTS.find(a => a.email === email) || EMAIL_ACCOUNTS[0];
}

export function getFromHeader(fromEmail: string): string {
  const account = getAccountConfig(fromEmail);
  return `${account.display_name} <${account.email}>`;
}

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

// Branded HTML email template — RO Unlimited identity
// Colors: black #1A1A1A, gold #C9A84C, white #FFFFFF, navy #0F1F3D
// Dark mode safe: all sections use explicit background-color with !important
export function buildEmailHtml(toName: string, bodyHtml: string, subject: string, fromEmail?: string): string {
  const account = getAccountConfig(fromEmail || DEFAULT_FROM_EMAIL);
  const sigEmail = account.email;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    body { margin: 0 !important; padding: 0 !important; background-color: #1A1A1A !important; }
    * { -webkit-text-size-adjust: none; text-size-adjust: none; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #1A1A1A !important; }
      .outer-wrap { background-color: #1A1A1A !important; }
      .body-cell { background-color: #111111 !important; color: #ffffff !important; }
      .body-text { color: #e0e0e0 !important; }
      .greeting { color: #ffffff !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#1A1A1A;font-family:Arial,Helvetica,sans-serif;">

<table class="outer-wrap" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;">
  <tr>
    <td align="center" style="padding:32px 12px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="height:3px;background-color:#C9A84C;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="background-color:#0F1F3D;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:24px 32px 20px;">
                  <img src="https://rounlimited.com/ro-unlimited-logo-transparent.png" alt="RO Unlimited — Contractor &amp; Developer" width="190" style="display:block;border:0;width:190px;max-width:190px;height:auto;" />
                </td>
                <td style="padding:24px 32px 20px;text-align:right;vertical-align:middle;white-space:nowrap;">
                  <span style="display:inline-block;border:1px solid #C9A84C;padding:4px 10px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Official Message</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="height:1px;background-color:#C9A84C;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="background-color:#111827;padding:20px 32px 18px;">
            <p style="margin:0 0 5px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Message</p>
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;letter-spacing:-0.2px;">${subject}</p>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="background-color:#111111;padding:36px 32px 28px;">
            <p class="greeting" style="margin:0 0 18px;color:#ffffff;font-size:16px;font-weight:600;">Hi ${toName},</p>
            <div class="body-text" style="color:#cccccc;font-size:15px;line-height:1.75;margin:0 0 28px;">${bodyHtml}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="width:40px;height:2px;background-color:#C9A84C;font-size:0;line-height:0;">&nbsp;</td>
                <td style="height:1px;background-color:#2a2a2a;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:3px;background-color:#C9A84C;border-radius:2px;">&nbsp;</td>
                <td style="padding-left:12px;">
                  <p style="margin:0 0 2px;color:#ffffff;font-size:14px;font-weight:700;">RO Unlimited</p>
                  <p style="margin:0 0 1px;color:#999999;font-size:12px;">Contractor &amp; Developer</p>
                  <p style="margin:0;color:#666666;font-size:11px;">SC &nbsp;&middot;&nbsp; GA &nbsp;&middot;&nbsp; NC</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0F1F3D;padding:20px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:10px;">
                  <a href="tel:8643040139" style="color:#C9A84C;text-decoration:none;font-size:13px;font-weight:600;">(864) 304-0139</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:10px;">
                  <a href="mailto:${sigEmail}" style="color:#C9A84C;text-decoration:none;font-size:13px;font-weight:600;">${sigEmail}</a>
                  <span style="color:#2a3a5a;font-size:13px;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                  <a href="https://rounlimited.com" style="color:#C9A84C;text-decoration:none;font-size:13px;font-weight:600;">rounlimited.com</a>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">RO Unlimited Contractor &amp; Developer &nbsp;&middot;&nbsp; SC &nbsp;&middot;&nbsp; GA &nbsp;&middot;&nbsp; NC</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="height:3px;background-color:#C9A84C;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
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
