// NexaBooks adapter data for RO Unlimited. Server-only, read-only (service-role reads, no writes).
//
// RO has no card processor: payments are recorded by hand in the invoice_payments ledger
// (method check | ach | cash | zelle | card | other, paid_date = the day the money came in).
//
// SALES (cash basis): one SalesDay per paid_date per payment method.
//   source 'other', channel 'Invoice payments', orders = number of payments,
//   total_cents = amount received; tax, tips, discounts and service charges are 0 because a
//   payment is money against an invoice, not a sale line. Tenders: card -> card_cents,
//   cash -> cash_cents, check / ACH / Zelle / other -> other_cents. The ledger only accepts
//   positive amounts today; a negative row (a refund) would be reported as refund_cents.
//
// PAYOUTS: always empty (no processor, so no bank deposits to reconcile here).
//
// JOBS: a job is an `estimates` row (RO runs projects off the estimate; /admin/jobs lists
// accepted or signed ones). There is no separate projects table for jobs (/admin/projects is
// the marketing portfolio). Mapping:
//   status     done      = completed_at set
//              open      = signed or status 'accepted', not completed
//              bidding   = status 'sent' or 'viewed' (offered, waiting on the customer);
//                          drafts are not offered yet and 'revised' rows are superseded by
//                          their revision, so both are left out
//              cancelled = status 'declined' / 'expired' / 'lost' / 'cancelled' (declined_at)
//              done/cancelled only when finished in the last 400 days; bidding only when
//              touched in the last 400 days.
//   contract_cents        = estimates.total. That already includes approved change orders
//                           (approving one bumps total_override or adds a 'Change Orders' line
//                           and recalculates) and any credit/charge adjustment, so change orders
//                           are NOT added again here.
//   estimated_cost_cents  = omitted. Estimate line items carry customer prices (unit_cost is
//                           the selling price, markup sits at estimate level), not RO's costs.
//                           Actual spend lives in job_costs, which is not an estimate of cost.
//   invoiced_cents        = sum of invoices.total for the job, excluding draft and cancelled.
//   paid_cents            = sum of invoices.amount_paid for the job (amount_paid is always the
//                           invoice_payments ledger sum, per src/lib/invoices.ts).
//   retainage_held_cents  = omitted; RO has no retainage field.
//   started_on            = project_start_date, else the day it was signed/accepted (open/done only).
//   finished_on           = completed_at (done) or declined_at (cancelled), as an Eastern date.
//   url                   = /admin/jobs/<id> for open/done, /admin/estimates/<id> otherwise.
// Example jobs (estimate number contains DEMO, or project name starts with EXAMPLE) are skipped,
// the same rule the Reviews page and portal reminders use.
import { createAdminClient } from '@/lib/supabase/server';
import type { Job, Payout, SalesDay } from './verify';

const SITE = 'https://rounlimited.com';
const TZ = 'America/New_York';

const cents = (n: unknown) => Math.round(Number(n || 0) * 100);

/** A timestamp as the Eastern calendar day (YYYY-MM-DD). */
function etDay(ts: string | null | undefined): string | undefined {
  if (!ts) return undefined;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

type Tender = 'card' | 'cash' | 'other';
function tenderOf(method: string | null | undefined): Tender {
  const m = String(method || '').toLowerCase().trim();
  if (m === 'card' || m === 'credit' || m === 'debit' || m === 'credit card') return 'card';
  if (m === 'cash') return 'cash';
  return 'other'; // check, ach, zelle, other, unknown
}

export async function buildSales(from: string, to: string): Promise<SalesDay[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('invoice_payments')
    .select('amount, method, paid_date')
    .gte('paid_date', from)
    .lte('paid_date', to)
    .order('paid_date', { ascending: true })
    .limit(10000);
  if (error) throw new Error(error.message);

  const byKey = new Map<string, SalesDay>();
  for (const p of data || []) {
    const date = String(p.paid_date || '').slice(0, 10);
    if (!date) continue;
    const tender = tenderOf(p.method);
    const method = String(p.method || 'other').toLowerCase();
    const key = `${date}|${method}`;
    let day = byKey.get(key);
    if (!day) {
      day = {
        date, source: 'other', channel: 'Invoice payments', orders: 0,
        total_cents: 0, tax_cents: 0, tip_cents: 0, discount_cents: 0, service_charge_cents: 0, refund_cents: 0,
        tenders: { card_cents: 0, cash_cents: 0, other_cents: 0 },
      };
      byKey.set(key, day);
    }
    const amt = cents(p.amount);
    if (amt < 0) {
      day.refund_cents += -amt;
      continue;
    }
    day.orders += 1;
    day.total_cents += amt;
    day.tenders[`${tender}_cents` as const] += amt;
  }
  return Array.from(byKey.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export async function buildPayouts(_from: string, _to: string): Promise<Payout[]> {
  return [];
}

const isExample = (e: any) => /DEMO/i.test(e.estimate_number || '') || /^EXAMPLE/i.test(String(e.project_name || '').trim());
const CANCELLED = new Set(['declined', 'expired', 'lost', 'cancelled']);
const BIDDING = new Set(['sent', 'viewed']);

export async function buildJobs(): Promise<Job[]> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 400 * 86400000).toISOString();

  const { data: rows, error } = await supabase
    .from('estimates')
    .select(`id, estimate_number, project_name, status, total, signed_at, accepted_at, completed_at,
             declined_at, project_start_date, updated_at, created_at,
             customer:customers(first_name, last_name, company_name)`)
    .limit(5000);
  if (error) throw new Error(error.message);

  const picked: { e: any; status: Job['status'] }[] = [];
  for (const e of (rows || []) as any[]) {
    if (isExample(e)) continue;
    const st = String(e.status || '').toLowerCase();
    let status: Job['status'] | null = null;
    if (CANCELLED.has(st)) {
      if ((e.declined_at || e.updated_at) >= cutoff) status = 'cancelled';
    } else if (e.completed_at) {
      if (e.completed_at >= cutoff) status = 'done';
    } else if (e.signed_at || st === 'accepted') {
      status = 'open';
    } else if (BIDDING.has(st)) {
      if ((e.updated_at || e.created_at) >= cutoff) status = 'bidding';
    }
    if (status) picked.push({ e, status });
  }
  if (!picked.length) return [];

  const ids = picked.map((p) => p.e.id);
  const { data: invs, error: invErr } = await supabase
    .from('invoices')
    .select('estimate_id, total, amount_paid, status')
    .in('estimate_id', ids);
  if (invErr) throw new Error(invErr.message);
  const money = new Map<string, { invoiced: number; paid: number }>();
  for (const i of (invs || []) as any[]) {
    const m = money.get(i.estimate_id) || { invoiced: 0, paid: 0 };
    const st = String(i.status || '').toLowerCase();
    if (st !== 'draft' && st !== 'cancelled') m.invoiced += cents(i.total);
    m.paid += cents(i.amount_paid);
    money.set(i.estimate_id, m);
  }

  return picked.map(({ e, status }) => {
    const c = e.customer || {};
    const person = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
    const customer = String(c.company_name || '').trim() || person || undefined;
    const m = money.get(e.id) || { invoiced: 0, paid: 0 };
    const running = status === 'open' || status === 'done';
    const job: Job = {
      id: e.id,
      name: String(e.project_name || '').trim() || e.estimate_number || 'Job',
      customer,
      status,
      contract_cents: cents(e.total),
      invoiced_cents: m.invoiced,
      paid_cents: m.paid,
      url: running ? `${SITE}/admin/jobs/${e.id}` : `${SITE}/admin/estimates/${e.id}`,
    };
    if (running) job.started_on = e.project_start_date || etDay(e.signed_at) || etDay(e.accepted_at);
    if (status === 'done') job.finished_on = etDay(e.completed_at);
    if (status === 'cancelled') job.finished_on = etDay(e.declined_at || e.updated_at);
    if (!job.started_on) delete job.started_on;
    if (!job.customer) delete job.customer;
    return job;
  });
}
