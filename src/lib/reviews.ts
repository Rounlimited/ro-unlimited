import { createAdminClient } from '@/lib/supabase/server';

/**
 * Every piece of customer feedback in one list, wherever it was left:
 *  - job_feedback      (signed-job page "Your Two Cents": stars, notes, check-in answers)
 *  - project_feedback  (estimate/completed-job page feedback card: stars + comment)
 *  - invoice_feedback  (paid-invoice receipt page: stars + comment)
 * Each row is tied back to its customer and job so the admin app can show
 * reviews per customer or per job no matter what status the job is in.
 */
export type ReviewKind = 'stars' | 'comment' | 'checkin';
export type Review = {
  id: string;
  source: 'job' | 'estimate' | 'invoice';
  kind: ReviewKind;
  rating: number | null;
  text: string | null;       // what they wrote / answered
  question: string | null;   // check-in question, when there is one
  name: string | null;       // name they typed, when the form asks
  created_at: string;
  unseen: boolean;
  example: boolean;          // demo / example jobs
  estimate: { id: string; number: string; name: string | null } | null;
  invoice_number: string | null;
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
};

const custName = (c: any) => {
  if (!c) return '';
  const n = [c.first_name, c.last_name].map((x: any) => String(x || '').trim()).filter(Boolean).join(' ');
  return n || String(c.company_name || '').trim() || 'Customer';
};
const isExample = (e: any) => !!e && (/DEMO/i.test(e.estimate_number || '') || /^EXAMPLE/i.test(String(e.project_name || '').trim()));

export async function listReviews(opts: { customerId?: string; estimateId?: string } = {}): Promise<Review[]> {
  const supabase = createAdminClient();
  const [jf, pf, inf] = await Promise.all([
    supabase.from('job_feedback').select('id, estimate_id, kind, rating, body, question, answer, section, seen_at, created_at').order('created_at', { ascending: false }),
    supabase.from('project_feedback').select('id, estimate_id, rating, comment, name, created_at').order('created_at', { ascending: false }),
    supabase.from('invoice_feedback').select('id, invoice_id, rating, comment, name, created_at').order('created_at', { ascending: false }),
  ]);
  const invIds = Array.from(new Set((inf.data || []).map((r: any) => r.invoice_id).filter(Boolean)));
  const invRes = invIds.length ? await supabase.from('invoices').select('id, invoice_number, estimate_id, customer_id').in('id', invIds) : { data: [] as any[] };
  const invMap = new Map((invRes.data || []).map((i: any) => [i.id, i]));

  const estIds = Array.from(new Set([
    ...(jf.data || []).map((r: any) => r.estimate_id),
    ...(pf.data || []).map((r: any) => r.estimate_id),
    ...(invRes.data || []).map((i: any) => i.estimate_id),
  ].filter(Boolean)));
  const estRes = estIds.length ? await supabase.from('estimates').select('id, estimate_number, project_name, customer_id').in('id', estIds) : { data: [] as any[] };
  const estMap = new Map((estRes.data || []).map((e: any) => [e.id, e]));

  const custIds = Array.from(new Set([
    ...(estRes.data || []).map((e: any) => e.customer_id),
    ...(invRes.data || []).map((i: any) => i.customer_id),
  ].filter(Boolean)));
  const custRes = custIds.length ? await supabase.from('customers').select('id, first_name, last_name, company_name, phone, email').in('id', custIds) : { data: [] as any[] };
  const custMap = new Map((custRes.data || []).map((c: any) => [c.id, c]));

  const est = (id: string | null) => { const e = id ? estMap.get(id) : null; return e ? { id: e.id, number: e.estimate_number, name: e.project_name ? String(e.project_name).trim() : null } : null; };
  const cust = (id: string | null) => { const c = id ? custMap.get(id) : null; return c ? { id: c.id, name: custName(c), phone: c.phone || null, email: c.email || null } : null; };

  const out: Review[] = [];
  for (const r of jf.data || []) {
    const e = estMap.get(r.estimate_id);
    const kind: ReviewKind = r.rating != null ? 'stars' : r.kind === 'pulse' ? 'checkin' : 'comment';
    const text = r.kind === 'pulse' ? (r.answer || r.body || null) : (r.body || null);
    if (kind !== 'stars' && !text) continue;
    out.push({ id: 'job:' + r.id, source: 'job', kind, rating: r.rating, text, question: r.kind === 'pulse' ? r.question : r.section ? 'About: ' + r.section : null, name: null, created_at: r.created_at, unseen: !r.seen_at, example: isExample(e), estimate: est(r.estimate_id), invoice_number: null, customer: cust(e?.customer_id) });
  }
  for (const r of pf.data || []) {
    const e = estMap.get(r.estimate_id);
    out.push({ id: 'est:' + r.id, source: 'estimate', kind: r.rating != null ? 'stars' : 'comment', rating: r.rating, text: r.comment || null, question: null, name: r.name || null, created_at: r.created_at, unseen: false, example: isExample(e), estimate: est(r.estimate_id), invoice_number: null, customer: cust(e?.customer_id) });
  }
  for (const r of inf.data || []) {
    const i = invMap.get(r.invoice_id); const e = i?.estimate_id ? estMap.get(i.estimate_id) : null;
    out.push({ id: 'inv:' + r.id, source: 'invoice', kind: r.rating != null ? 'stars' : 'comment', rating: r.rating, text: r.comment || null, question: null, name: r.name || null, created_at: r.created_at, unseen: false, example: isExample(e), estimate: est(i?.estimate_id || null), invoice_number: i?.invoice_number || null, customer: cust(i?.customer_id || e?.customer_id || null) });
  }
  let list = out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  if (opts.customerId) list = list.filter((r) => r.customer?.id === opts.customerId);
  if (opts.estimateId) list = list.filter((r) => r.estimate?.id === opts.estimateId);
  return list;
}
