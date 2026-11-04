import { createAdminClient } from '@/lib/supabase/server';
import { rollUpProgress } from '@/lib/reporting';
import { statusWord } from '@/lib/inspections';

/**
 * Everything a customer is ALLOWED to know about their job, as plain text
 * facts for the project assistant. Only customer-visible records go in:
 * no internal log lines, costs, margins, status flags or notes.
 */
export async function buildCustomerFacts(estimateId: string): Promise<{ facts: string; est: any } | null> {
  const supabase = createAdminClient();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const [estRes, itemsRes, progRes, logRes, schedRes, inspRes, coRes, reqRes, invRes, msgRes, faqRes, reportRes] = await Promise.all([
    supabase.from('estimates').select('id, estimate_number, project_name, project_address, project_city, document_mode, signed_at, completed_at, completion_note, warranty_months, warranty_notes, project_description, total, show_schedule, show_inspections, show_photos, customer:customers(first_name, company_name)').eq('id', estimateId).single(),
    supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', estimateId),
    supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order, custom').eq('estimate_id', estimateId),
    supabase.from('job_log_entries').select('entry_date, type, text, photos').eq('estimate_id', estimateId).eq('include_in_report', true).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(25),
    supabase.from('job_schedule_items').select('title, kind, starts_on, ends_on').eq('estimate_id', estimateId).is('done_at', null).gte('starts_on', today).order('starts_on', { ascending: true }).limit(10),
    supabase.from('job_inspections').select('record_type, title, agency, reference, scheduled_on, time_window, status, result_on, notes').eq('estimate_id', estimateId).order('scheduled_on', { ascending: false, nullsFirst: false }).limit(15),
    supabase.from('change_orders').select('title, description, amount, days_added, status, approved_at, created_at').eq('estimate_id', estimateId).neq('status', 'draft').order('created_at', { ascending: false }),
    supabase.from('customer_requests').select('kind, title, details, due_on, status, submitted_at').eq('estimate_id', estimateId).neq('status', 'cancelled').order('created_at', { ascending: false }),
    supabase.from('invoices').select('invoice_number, total, amount_paid, status, due_date, paid_at').eq('estimate_id', estimateId).not('status', 'in', '("draft","cancelled")'),
    supabase.from('project_messages').select('author, body, created_at, answered_at').eq('estimate_id', estimateId).order('created_at', { ascending: true }).limit(40),
    supabase.from('portal_faq').select('term, answer').eq('active', true).order('term'),
    supabase.from('progress_reports').select('period_end, percent, sent_at').eq('estimate_id', estimateId).eq('status', 'sent').order('period_end', { ascending: false }).limit(5),
  ]);
  const est: any = estRes.data;
  if (!est) return null;
  const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
  const money = (n: any) => '$' + Math.round(Number(n || 0)).toLocaleString();
  const balance = (invRes.data || []).reduce((s: number, i: any) => s + Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)), 0);
  const L: string[] = [];
  L.push(`TODAY: ${today}`);
  L.push(`PROJECT: ${est.project_name || est.estimate_number}${est.project_address ? ` at ${est.project_address}${est.project_city ? ', ' + est.project_city : ''}` : ''}. ${est.document_mode === 'contract' ? 'Contract' : 'Estimate'}${est.signed_at ? ' signed ' + String(est.signed_at).slice(0, 10) : ' not signed yet'}${est.completed_at ? '; marked complete ' + String(est.completed_at).slice(0, 10) : ''}. Contract total ${money(est.total)}.`);
  L.push(`CUSTOMER: ${est.customer?.first_name || est.customer?.company_name || 'the customer'}`);
  L.push(`SCOPE (from the document): ${String(est.project_description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200)}`);
  if (roll.phases.length) L.push(`PROGRESS: ${roll.percent}% overall — ${roll.phases.map((p) => `${p.phase} ${p.percent}%`).join(', ')}`);
  L.push('TIMELINE (what RO posted for the customer, newest first):');
  for (const l of logRes.data || []) L.push(`  [log ${l.entry_date}] ${l.type}: ${l.text || (l.type === 'rain' ? 'Rained out — no work on site.' : '')}${Array.isArray(l.photos) && l.photos.length ? ` (${l.photos.length} photos)` : ''}`);
  if (est.show_schedule !== false) { L.push('SCHEDULE (every date is an estimate):'); for (const s of schedRes.data || []) L.push(`  [schedule] ${s.starts_on}${s.ends_on ? ' to ' + s.ends_on : ''} — ${s.title} (${s.kind})`); if (!(schedRes.data || []).length) L.push('  (nothing scheduled in the system right now)'); }
  if (est.show_inspections !== false && (inspRes.data || []).length) { L.push('PERMITS & INSPECTIONS:'); for (const r of inspRes.data || []) L.push(`  [inspection] ${r.record_type}: ${r.title} — ${statusWord(r)}${r.scheduled_on ? ', date ' + r.scheduled_on : ''}${r.time_window ? ' ' + r.time_window : ''}${r.agency ? ', ' + r.agency : ''}${r.reference ? ', #' + r.reference : ''}${r.notes ? '. Notes: ' + r.notes : ''}`); }
  if ((coRes.data || []).length) { L.push('CHANGE ORDERS:'); for (const c of coRes.data || []) L.push(`  [change order] ${c.title}: ${Number(c.amount) >= 0 ? '+' : '−'}${money(Math.abs(c.amount))}${c.days_added ? `, ${c.days_added} day(s) added` : ''} — status ${c.status}${c.approved_at ? ' (approved ' + String(c.approved_at).slice(0, 10) + ')' : ''}${c.description ? '. ' + c.description : ''}`); }
  if ((reqRes.data || []).length) { L.push('REQUESTS FROM RO TO THE CUSTOMER:'); for (const r of reqRes.data || []) L.push(`  [request] ${r.title} (${r.kind}) — ${r.status}${r.due_on ? ', needed by ' + r.due_on : ''}${r.details ? '. ' + r.details : ''}`); }
  if ((invRes.data || []).length) { L.push(`MONEY: invoices issued: ${(invRes.data || []).map((i: any) => `Invoice ${i.invoice_number} ${money(i.total)} ${i.status}${i.paid_at ? ' paid ' + String(i.paid_at).slice(0, 10) : i.due_date ? ' due ' + i.due_date : ''}`).join('; ')}. Balance due now: ${money(balance)}.`); }
  else L.push('MONEY: no invoices issued yet; balance due now: $0.');
  if ((reportRes.data || []).length) L.push(`PROGRESS REPORTS SENT: ${(reportRes.data || []).map((r: any) => `${r.period_end} (${r.percent}%)`).join(', ')}`);
  if (est.completed_at) L.push(`COMPLETION: ${est.completion_note || 'marked complete'}. Warranty: ${est.warranty_months ? est.warranty_months + ' months' : 'see contract'}${est.warranty_notes ? ' — ' + est.warranty_notes : ''}`);
  const thread = (msgRes.data || []) as any[];
  if (thread.length) { L.push('QUESTIONS ALREADY ASKED ON THIS PAGE (and RO answers):'); for (const m of thread) L.push(`  [${m.author === 'ro' ? 'RO answer' : 'customer'} ${String(m.created_at).slice(0, 10)}] ${m.body}`); }
  L.push('GLOSSARY (plain-language explanations RO uses):');
  for (const f of faqRes.data || []) L.push(`  [glossary] ${f.term}: ${f.answer}`);
  L.push('CONTACT: RO Unlimited, (864) 304-0139, office hours Mon–Sat 7am–6pm. Questions typed on the page are answered by RO, usually the same business day.');
  return { facts: L.join('\n'), est };
}
