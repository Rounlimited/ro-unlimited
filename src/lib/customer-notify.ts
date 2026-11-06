import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';
import { shouldEmailCustomer } from '@/lib/customer-auth';

/**
 * One door for the automatic fact emails the portal sends on its own
 * (a date moved, an inspection passed). Plain, short, always linking back
 * to the project page. Honors the customer's email preference:
 *   kind 'needed' = always goes (it affects their plans)
 *   kind 'update' = skipped for customers who chose fewer emails
 */
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
export const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const fmtDay = (d?: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';

export async function emailCustomerFact(args: { estimateId: string; kind: 'needed' | 'update'; subjectTail: string; headline: string; detail?: string | null; anchor?: string; button?: string }) {
  const supabase = createAdminClient();
  const { data: est } = await supabase.from('estimates').select('project_name, estimate_number, share_token, link_enabled, customer:customers(first_name, company_name, email)').eq('id', args.estimateId).single();
  const c: any = est?.customer;
  const to: string | null = c?.email || null;
  if (!est || !to) return { emailed: false, to, skipped: 'no email on file' };
  if (est.link_enabled === false) return { emailed: false, to, skipped: 'link paused' };
  if (!(await shouldEmailCustomer(to, args.kind))) return { emailed: false, to, skipped: 'customer chose fewer emails' };
  try {
    await fetchEmailAccounts();
    const project = est.project_name || est.estimate_number;
    const name = c.first_name || c.company_name || 'there';
    const subject = `${project} — ${args.subjectTail}`;
    const link = `${SITE()}/estimate/${est.share_token}${args.anchor ? '#' + args.anchor : ''}`;
    const bodyHtml = `
      <p style="margin:0 0 16px">Hi ${esc(name)},</p>
      <p style="margin:0 0 12px;font-size:18px;font-weight:bold;color:#222">${esc(args.headline)}</p>
      ${args.detail ? `<p style="margin:0 0 16px;color:#444;white-space:pre-line">${esc(args.detail)}</p>` : ''}
      <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">${esc(args.button || 'Open Your Project Page')}</a></p>
      <p style="margin:0;color:#666">Dates are estimates — weather and inspections move them. Questions any time on your page or (864) 304-0139.</p>`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: getFromHeader(DEFAULT_FROM_EMAIL), to, subject, html: buildEmailHtml(name, bodyHtml, subject, DEFAULT_FROM_EMAIL) });
    if (error) return { emailed: false, to, skipped: 'email failed: ' + error.message };
    await logEmail({ direction: 'outbound', to_email: to, from_email: DEFAULT_FROM_EMAIL, subject, body_text: args.headline + (args.detail ? '\n' + args.detail : ''), folder: 'sent' }).catch(() => {});
    return { emailed: true, to, skipped: null as string | null };
  } catch (e: any) { return { emailed: false, to, skipped: 'email failed: ' + (e?.message || e) }; }
}

/** A customer-visible (or internal) line in the job log, dated today. */
export async function logLine(estimateId: string, type: string, text: string, visible: boolean, by?: string | null) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const { data } = await createAdminClient().from('job_log_entries')
    .insert({ estimate_id: estimateId, entry_date: today, type, text, include_in_report: visible, created_by: by || 'RO Unlimited' }).select().single();
  return data;
}
