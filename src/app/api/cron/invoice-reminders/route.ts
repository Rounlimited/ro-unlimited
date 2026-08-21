import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL, logEmail } from '@/lib/email';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const fmt$ = (n: any) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Daily invoice reminders (vercel.json cron). Two tracks, both respecting
 * the per-invoice auto_remind switch and skipping anything without an email:
 *
 *  - Heads-up: due in exactly 3 days, never reminded → one friendly note.
 *  - Overdue ladder: past due and (never reminded since due, or last
 *    reminder ≥7 days ago) → escalating copy by how far past due.
 *
 * A reminder is never sent more than once per 7 days per invoice, and only
 * to invoices that were actually sent (sent/partial status).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: candidates } = await supabase
    .from('invoices')
    .select('*, customer:customers(first_name, last_name, company_name, email)')
    .in('status', ['sent', 'partial'])
    .eq('auto_remind', true)
    .not('due_date', 'is', null);

  const results: any[] = [];
  await fetchEmailAccounts();
  const senderEmail = DEFAULT_FROM_EMAIL;
  const fromHeader = getFromHeader(senderEmail);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

  for (const inv of candidates || []) {
    const email = inv.customer?.email || inv.bill_to?.email;
    if (!email || !inv.share_token) continue;

    const due = new Date(inv.due_date + 'T00:00:00');
    const daysUntil = Math.ceil((due.getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    const balance = Number(inv.total) - Number(inv.amount_paid);
    if (balance <= 0) continue;

    const recentlyReminded = inv.last_reminder_at && inv.last_reminder_at > sevenDaysAgo;

    let kind: 'heads_up' | 'overdue' | null = null;
    if (daysUntil === 3 && !inv.last_reminder_at) kind = 'heads_up';
    else if (daysUntil < 0 && !recentlyReminded) kind = 'overdue';
    if (!kind) continue;

    const daysPast = -daysUntil;
    const name = inv.customer
      ? [inv.customer.first_name, inv.customer.last_name].filter(Boolean).join(' ') || inv.customer.company_name
      : inv.bill_to?.name || inv.bill_to?.company;
    const dueStr = due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const viewLink = `${site}/i/${inv.share_token}`;

    let intro: string;
    let subject: string;
    if (kind === 'heads_up') {
      subject = `Reminder: Invoice ${inv.invoice_number} — ${fmt$(balance)} due ${dueStr}`;
      intro = `<p>A quick heads-up — invoice ${inv.invoice_number}${inv.project_name ? ` for ${inv.project_name}` : ''} comes due on <strong>${dueStr}</strong>.</p>`;
    } else if (daysPast <= 10) {
      subject = `Past due: Invoice ${inv.invoice_number} — ${fmt$(balance)}`;
      intro = `<p>Invoice ${inv.invoice_number}${inv.project_name ? ` for ${inv.project_name}` : ''} was due on ${dueStr} and shows an open balance of <strong>${fmt$(balance)}</strong>. If payment is already on the way, thank you — please disregard this note.</p>`;
    } else {
      subject = `Overdue ${daysPast} days: Invoice ${inv.invoice_number} — ${fmt$(balance)}`;
      intro = `<p>Invoice ${inv.invoice_number}${inv.project_name ? ` for ${inv.project_name}` : ''} is now <strong>${daysPast} days past due</strong> with an open balance of <strong>${fmt$(balance)}</strong>. Please give us a call at (864) 304-0139 if anything about this invoice needs discussing — we'd rather talk than send letters.</p>`;
    }

    const bodyContent = `
      ${intro}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
        <tr>
          <td style="background-color:#C9A84C;border-radius:6px;padding:12px 28px;">
            <a href="${viewLink}" style="color:#000;text-decoration:none;font-size:14px;font-weight:700;display:inline-block;">View Invoice</a>
          </td>
        </tr>
      </table>
      <p style="color:#999;font-size:13px;">${inv.payment_instructions || 'Checks payable to RO Unlimited Construction & Development. For ACH or payment questions, call (864) 304-0139.'}</p>
    `;

    const html = buildEmailHtml(name || 'Customer', bodyContent, subject, senderEmail);
    const { error: sendErr } = await resend.emails.send({ from: fromHeader, to: email, subject, html });
    if (sendErr) {
      results.push({ invoice: inv.invoice_number, kind, error: String(sendErr) });
      continue;
    }

    await logEmail({
      direction: 'outbound', from_email: senderEmail, to_email: email, subject,
      body_html: html, body_text: subject, folder: 'sent', has_attachments: false, read: true,
    });
    await supabase.from('invoices').update({
      last_reminder_at: new Date().toISOString(),
      reminders_sent: (inv.reminders_sent || 0) + 1,
    }).eq('id', inv.id);
    results.push({ invoice: inv.invoice_number, kind, to: email });
  }

  return NextResponse.json({ checked: (candidates || []).length, sent: results.filter((r) => !r.error).length, results });
}
