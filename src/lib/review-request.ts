import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';
import { shouldEmailCustomer } from '@/lib/customer-auth';
import { esc, logLine } from '@/lib/customer-notify';

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
export const FALLBACK_REVIEW_URL = 'https://g.page/r/CUpIjWaRfx2eEBM/review';

export async function reviewUrl(): Promise<string> {
  const { data } = await createAdminClient().from('app_settings').select('value').eq('key', 'google_review_url').maybeSingle();
  return (typeof data?.value === 'string' && data.value) || FALLBACK_REVIEW_URL;
}

/**
 * The "how did we do?" email after a finished job. One short, personal ask
 * with one big button straight to the Google review form.
 *
 * Google's rules: ask every customer the same way, never pre-screen by
 * satisfaction, and don't offer anything in return or tell people what rating
 * to give. So the email asks for an honest review and nothing more.
 */
export async function sendReviewRequest(estimateId: string, by: string, force = false) {
  const supabase = createAdminClient();
  const { data: est } = await supabase
    .from('estimates')
    .select('id, project_name, estimate_number, share_token, review_requested_at, customer:customers(first_name, company_name, email)')
    .eq('id', estimateId).single();
  if (!est) return { error: 'Job not found' };
  const c: any = est.customer;
  const to: string | null = c?.email || null;
  if (!to) return { error: 'No email on this customer. Add one on the customer file first, or text them the review link.' };
  if (est.review_requested_at && !force) {
    const days = Math.floor((Date.now() - new Date(est.review_requested_at).getTime()) / 86400000);
    if (days < 30) return { error: `Already asked ${days === 0 ? 'today' : days + ' day' + (days === 1 ? '' : 's') + ' ago'}.`, already: true };
  }
  if (!(await shouldEmailCustomer(to, 'update'))) return { error: 'This customer chose fewer emails, so it was not sent.' };

  try {
    await fetchEmailAccounts();
    const name = c.first_name || c.company_name || 'there';
    const project = est.project_name || est.estimate_number;
    const go = `${SITE()}/api/review/go?t=${est.share_token}`;
    const subject = `How did we do on ${project}?`;
    const bodyHtml = `
      <p style="margin:0 0 16px">Hi ${esc(name)},</p>
      <p style="margin:0 0 16px;font-size:17px;color:#222">Thank you for letting RO Unlimited handle <strong>${esc(project)}</strong>. We appreciate the work.</p>
      <p style="margin:0 0 20px;font-size:17px;color:#222">If you have a minute, would you share your honest experience in a Google review? It is how neighbors and other builders find a contractor they can trust, and every review is read by the owner.</p>
      <p style="margin:0 0 24px"><a href="${go}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:bold;font-size:18px">Write a Google review</a></p>
      <p style="margin:0 0 16px;color:#666;font-size:15px">It takes about a minute and works from your phone. If anything about the job was not right, please call us first at (864) 304-0139 so we can make it right.</p>
      <p style="margin:0;color:#222">Thank you,<br>JR &amp; the RO Unlimited team</p>`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: getFromHeader(DEFAULT_FROM_EMAIL), to, subject, html: buildEmailHtml(name, bodyHtml, subject, DEFAULT_FROM_EMAIL) });
    if (error) return { error: 'Email failed: ' + error.message };
    await logEmail({ direction: 'outbound', to_email: to, from_email: DEFAULT_FROM_EMAIL, subject, body_text: `Review request for ${project}: ${go}`, folder: 'sent' }).catch(() => {});
    const now = new Date().toISOString();
    await supabase.from('estimates').update({ review_requested_at: now }).eq('id', estimateId);
    await logLine(estimateId, 'milestone', `Google review request emailed to ${to}.`, false, by);
    return { ok: true, to };
  } catch (e: any) {
    return { error: 'Email failed: ' + (e?.message || e) };
  }
}
