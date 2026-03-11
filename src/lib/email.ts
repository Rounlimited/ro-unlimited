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

// Branded HTML email template — matches rounlimited.com visual identity
export function buildEmailHtml(toName: string, bodyHtml: string, subject: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;min-width:320px;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">

        <!-- Card container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6);">

          <!-- ═══ HEADER — navy with logo ═══ -->
          <tr>
            <td style="background-color:#1B2A4A;background-image:linear-gradient(135deg,#1B2A4A 0%,#0f1d35 100%);padding:0;position:relative;">

              <!-- Top accent bar — orange -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background-color:#D4772C;background-image:linear-gradient(90deg,#D4772C,#e8893a,#D4772C);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Logo row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 36px 24px;">
                    <!-- Logo image — hosted on rounlimited.com CDN -->
                    <img
                      src="https://rounlimited.com/ro-unlimited-logo.png"
                      alt="RO Unlimited Construction &amp; Development"
                      width="200"
                      style="display:block;width:200px;max-width:200px;height:auto;border:0;outline:none;"
                    />
                  </td>
                  <td style="padding:28px 36px 24px;text-align:right;vertical-align:middle;">
                    <span style="display:inline-block;background-color:rgba(212,119,44,0.15);border:1px solid rgba(212,119,44,0.4);border-radius:3px;padding:5px 12px;color:#D4772C;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;white-space:nowrap;">
                      Official Message
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background-color:rgba(255,255,255,0.08);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ SUBJECT BANNER ═══ -->
          <tr>
            <td style="background-color:#162238;padding:20px 36px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 4px;color:rgba(212,119,44,0.8);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Message</p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;line-height:1.3;">${subject}</h1>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 36px 28px;">

              <!-- Greeting -->
              <p style="margin:0 0 20px;color:#1B2A4A;font-size:16px;font-weight:600;line-height:1.5;">Hi ${toName},</p>

              <!-- Message body -->
              <div style="color:#333333;font-size:15px;line-height:1.75;margin:0 0 28px;">
                ${bodyHtml}
              </div>

              <!-- Signature divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 24px;">
                <tr>
                  <td style="height:1px;background-color:#e8e8e8;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Signature block -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;background-color:#D4772C;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 2px;color:#1B2A4A;font-size:15px;font-weight:700;line-height:1.4;">RO Unlimited</p>
                    <p style="margin:0 0 2px;color:#666666;font-size:13px;line-height:1.4;">Construction &amp; Development</p>
                    <p style="margin:0;color:#999999;font-size:12px;line-height:1.4;">Upstate South Carolina · Georgia · North Carolina</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background-color:#1B2A4A;padding:24px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Contact row -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td style="padding-right:20px;">
                          <a href="tel:8643040139" style="color:#D4772C;text-decoration:none;font-size:13px;font-weight:600;">(864) 304-0139</a>
                        </td>
                        <td style="color:rgba(255,255,255,0.2);font-size:13px;padding-right:20px;">|</td>
                        <td>
                          <a href="mailto:build@rounlimited.com" style="color:#D4772C;text-decoration:none;font-size:13px;font-weight:600;">build@rounlimited.com</a>
                        </td>
                        <td style="color:rgba(255,255,255,0.2);font-size:13px;padding:0 20px;">|</td>
                        <td>
                          <a href="https://rounlimited.com" style="color:#D4772C;text-decoration:none;font-size:13px;font-weight:600;">rounlimited.com</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Legal line -->
                    <p style="margin:0;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.5;">
                      This message was sent from RO Unlimited Construction &amp; Development. 864 Area · Upstate SC.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr>
            <td style="height:4px;background-color:#D4772C;background-image:linear-gradient(90deg,#D4772C,#e8893a,#D4772C);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
        <!-- /Card container -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

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
