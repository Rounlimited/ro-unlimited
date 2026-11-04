import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';
import { emailCustomerFact, fmtDay, logLine } from '@/lib/customer-notify';
import { statusWord } from '@/lib/inspections';
import { SERVICE_SYSTEMS, serviceLabel } from '@/lib/service-systems';

/**
 * Handover and after. A finished job's page becomes the binder a customer
 * keeps: signed contract, final invoices, permits and inspection results,
 * as-built photos, warranty, manuals, and the maintenance schedule — plus
 * the review and referral ask. JR gets a checklist that fills itself from
 * what's already on the job, and one button to send the package.
 */
export const BINDER_KINDS = [
  { id: 'warranty', label: 'Warranty' }, { id: 'manual', label: 'Manual' }, { id: 'permit', label: 'Permit / approval' }, { id: 'asbuilt', label: 'As-built drawing' }, { id: 'other', label: 'Other document' },
] as const;

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await createAdminClient().from('app_settings').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}
export async function setSetting(key: string, value: string | null) {
  await createAdminClient().from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

export async function getBinder(estimateId: string) {
  const supabase = createAdminClient();
  const [estRes, invRes, inspRes, itemsRes, logRes, svcRes, reviewUrl] = await Promise.all([
    supabase.from('estimates').select('id, estimate_number, project_name, project_address, project_city, share_token, signed_at, signed_name, completed_at, completion_note, warranty_months, warranty_notes, photos, show_photos, handover_sent_at, review_requested_at, total, customer_id').eq('id', estimateId).single(),
    supabase.from('invoices').select('invoice_number, total, amount_paid, status, due_date, paid_at, share_token, link_enabled').eq('estimate_id', estimateId).not('status', 'in', '("draft","cancelled")').order('created_at', { ascending: true }),
    supabase.from('job_inspections').select('id, record_type, title, agency, reference, scheduled_on, status, result_on, notes').eq('estimate_id', estimateId).order('scheduled_on', { ascending: true, nullsFirst: false }),
    supabase.from('job_binder_items').select('id, kind, title, url, note, created_at').eq('estimate_id', estimateId).order('created_at', { ascending: true }),
    supabase.from('job_log_entries').select('entry_date, text, photos').eq('estimate_id', estimateId).eq('include_in_report', true).not('photos', 'eq', '[]').order('entry_date', { ascending: true }),
    supabase.from('service_reminders').select('id, system, title, interval_months, next_due, last_done, note, active').eq('estimate_id', estimateId).eq('active', true).order('next_due', { ascending: true }),
    getSetting('google_review_url'),
  ]);
  const est: any = estRes.data;
  if (!est) return null;
  const photos: { url: string; caption: string | null; date: string | null }[] = [];
  if (est.show_photos !== false) {
    for (const p of Array.isArray(est.photos) ? est.photos : []) if (p?.url) photos.push({ url: p.url, caption: p.caption || null, date: null });
    for (const l of logRes.data || []) for (const p of Array.isArray(l.photos) ? l.photos : []) if (p?.url) photos.push({ url: p.url, caption: p.caption || l.text || null, date: l.entry_date });
  }
  const invoices = (invRes.data || []).map((i: any) => ({ number: i.invoice_number, total: Number(i.total || 0), paid: Number(i.amount_paid || 0), status: i.status, paid_at: i.paid_at, href: i.share_token && i.link_enabled !== false ? `/i/${i.share_token}` : null }));
  const balance = invoices.reduce((s, i) => s + Math.max(0, i.total - i.paid), 0);
  const until = est.warranty_months && est.completed_at ? new Date(new Date(est.completed_at).setMonth(new Date(est.completed_at).getMonth() + est.warranty_months)).toISOString().slice(0, 10) : null;
  return {
    estimate: est,
    contract: { signed_at: est.signed_at, signed_name: est.signed_name, pdf_href: est.share_token ? `/api/estimate/${est.share_token}/pdf?mode=download` : null, total: Number(est.total || 0) },
    invoices, balance,
    records: (inspRes.data || []).map((r: any) => ({ ...r, status_word: statusWord(r) })),
    photos,
    warranty: { months: est.warranty_months, notes: est.warranty_notes, until },
    items: itemsRes.data || [],
    services: (svcRes.data || []).map((s: any) => ({ ...s, system_label: serviceLabel(s.system) })),
    completion: { completed_at: est.completed_at, note: est.completion_note, handover_sent_at: est.handover_sent_at, review_requested_at: est.review_requested_at },
    review_url: reviewUrl,
  };
}

export type ChecklistItem = { key: string; label: string; ok: boolean; detail: string; action?: string };
export async function getChecklist(estimateId: string): Promise<{ items: ChecklistItem[]; done: number; total: number } | null> {
  const b = await getBinder(estimateId);
  if (!b) return null;
  const openRecords = b.records.filter((r: any) => !['passed', 'closed', 'cancelled', 'expired'].includes(r.status));
  const manuals = b.items.filter((i: any) => i.kind === 'manual' || i.kind === 'warranty');
  const items: ChecklistItem[] = [
    { key: 'contract', label: 'Contract signed', ok: !!b.contract.signed_at, detail: b.contract.signed_at ? `Signed by ${b.contract.signed_name || 'the customer'} ${String(b.contract.signed_at).slice(0, 10)}` : 'Not signed' },
    { key: 'photos', label: 'As-built photos on the page', ok: b.photos.length >= 3, detail: b.photos.length ? `${b.photos.length} photo${b.photos.length === 1 ? '' : 's'} visible to the customer` : 'None visible — post before-backfill photos from the Job Room', action: 'photos' },
    { key: 'permits', label: 'Permits & inspections closed out', ok: b.records.length > 0 && openRecords.length === 0, detail: b.records.length === 0 ? 'None recorded on this job' : openRecords.length ? `${openRecords.length} still open: ${openRecords.map((r: any) => r.title).join(', ')}` : `${b.records.length} on record, all closed`, action: 'inspections' },
    { key: 'warranty', label: 'Warranty set', ok: !!b.warranty.months, detail: b.warranty.months ? `${b.warranty.months} months${b.warranty.until ? ', through ' + fmtDay(b.warranty.until) : ''}` : 'Set it when you mark the job complete', action: 'complete' },
    { key: 'manuals', label: 'Warranties & manuals attached', ok: manuals.length > 0, detail: manuals.length ? `${manuals.length} attached` : 'Add the manufacturer warranty / manual PDFs (optional for sitework)', action: 'items' },
    { key: 'invoice', label: 'Final invoice paid', ok: b.invoices.length > 0 && b.balance === 0, detail: b.invoices.length === 0 ? 'No invoice issued yet' : b.balance > 0 ? `$${Math.round(b.balance).toLocaleString()} still due` : 'Paid in full', action: 'invoices' },
    { key: 'service', label: 'Maintenance schedule', ok: b.services.length > 0, detail: b.services.length ? b.services.map((s: any) => `${s.title} — ${fmtDay(s.next_due)}`).join('; ') : 'Add one if the job has a system that needs service (septic, grease trap, backflow…)', action: 'service' },
    { key: 'complete', label: 'Marked complete', ok: !!b.completion.completed_at, detail: b.completion.completed_at ? `Completed ${String(b.completion.completed_at).slice(0, 10)}` : 'Mark it complete from Contract & Tabs', action: 'complete' },
    { key: 'handover', label: 'Handover package sent', ok: !!b.completion.handover_sent_at, detail: b.completion.handover_sent_at ? `Sent ${String(b.completion.handover_sent_at).slice(0, 10)} (includes the review ask)` : 'One tap below — emails them their binder and asks for the review', action: 'send' },
  ];
  return { items, done: items.filter((i) => i.ok).length, total: items.length };
}

export async function addBinderItem(args: { estimateId: string; kind: string; title: string; url: string; note?: string | null; by: string }) {
  const kind = BINDER_KINDS.some((k) => k.id === args.kind) ? args.kind : 'other';
  const title = String(args.title || '').trim(), url = String(args.url || '').trim();
  if (!title || !/^https?:\/\//.test(url)) return { error: 'Need a title and an uploaded file' };
  const { data, error } = await createAdminClient().from('job_binder_items').insert({ estimate_id: args.estimateId, kind, title, url, note: args.note || null, created_by: args.by }).select().single();
  return error ? { error: error.message } : { item: data };
}

export async function sendHandover(estimateId: string, by: string) {
  const b = await getBinder(estimateId);
  if (!b) return { error: 'Job not found' };
  if (!b.completion.completed_at) return { error: 'Mark the job complete first (Contract & Tabs) so the warranty clock starts' };
  const supabase = createAdminClient();
  const parts = ['your signed contract', b.invoices.length ? 'invoices' : null, b.records.length ? 'permit and inspection results' : null, b.photos.length ? `${b.photos.length} photos of the finished work` : null, b.warranty.months ? `your ${b.warranty.months}-month warranty` : null, b.items.length ? 'warranties and manuals' : null, b.services.length ? 'your maintenance schedule' : null].filter(Boolean);
  const out = await emailCustomerFact({ estimateId, kind: 'needed', subjectTail: 'your project binder', headline: 'Your project is complete. Everything is in one place on your page.', detail: `Your binder has ${parts.join(', ')}. It stays at this link for as long as you want it.${b.services.length ? ' We will remind you before each service is due.' : ''}\n\nIf we did right by you, a short review helps the next family find us — there is a button for it on the page. Thank you for trusting RO with this.`, anchor: 'binder', button: 'Open Your Binder' });
  const now = new Date().toISOString();
  await supabase.from('estimates').update({ handover_sent_at: now, review_requested_at: b.completion.review_requested_at || now }).eq('id', estimateId);
  await logLine(estimateId, 'milestone', 'Handover package sent — contract, invoices, inspections, photos, warranty and maintenance schedule all on this page.', true, by);
  return { ok: true, emailed: out.emailed, to: out.to, skipped: out.skipped };
}

/* ── Maintenance reminders ─────────────────────────────────────────── */
export async function createServiceReminder(args: { estimateId?: string | null; customerId?: string | null; system: string; title?: string | null; interval_months?: number | null; next_due: string; note?: string | null; by: string }) {
  const supabase = createAdminClient();
  const sys = SERVICE_SYSTEMS.find((s) => s.id === args.system) || SERVICE_SYSTEMS[SERVICE_SYSTEMS.length - 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.next_due)) return { error: 'Pick the first due date' };
  let customerId = args.customerId || null;
  if (!customerId && args.estimateId) { const { data } = await supabase.from('estimates').select('customer_id').eq('id', args.estimateId).maybeSingle(); customerId = data?.customer_id || null; }
  if (!customerId) return { error: 'No customer for this reminder' };
  const { data, error } = await supabase.from('service_reminders').insert({ estimate_id: args.estimateId || null, customer_id: customerId, system: sys.id, title: (args.title || '').trim() || sys.label, interval_months: Number(args.interval_months) || sys.interval, next_due: args.next_due, note: args.note || null, created_by: args.by }).select().single();
  return error ? { error: error.message } : { reminder: data };
}

export async function updateServiceReminder(args: { id: string; done?: boolean; active?: boolean; next_due?: string }) {
  const supabase = createAdminClient();
  const { data: cur } = await supabase.from('service_reminders').select('*').eq('id', args.id).maybeSingle();
  if (!cur) return { error: 'Not found' };
  const patch: any = {};
  if (args.done) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const base = new Date(today + 'T12:00:00'); base.setMonth(base.getMonth() + (cur.interval_months || 12));
    patch.last_done = today; patch.next_due = base.toISOString().slice(0, 10); patch.customer_notified_at = null; patch.team_notified_at = null;
  }
  if (args.active !== undefined) patch.active = !!args.active;
  if (args.next_due && /^\d{4}-\d{2}-\d{2}$/.test(args.next_due)) { patch.next_due = args.next_due; patch.customer_notified_at = null; patch.team_notified_at = null; }
  const { data, error } = await supabase.from('service_reminders').update(patch).eq('id', args.id).select().single();
  return error ? { error: error.message } : { reminder: data };
}

export async function listServiceDue(days = 60) {
  const supabase = createAdminClient();
  const to = new Date(Date.now() + days * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const { data } = await supabase.from('service_reminders').select('id, system, title, interval_months, next_due, last_done, note, customer_notified_at, estimate:estimates(id, estimate_number, project_name, project_address, project_city), customer:customers(id, first_name, last_name, company_name, email, phone)').eq('active', true).lte('next_due', to).order('next_due', { ascending: true }).limit(100);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return (data || []).map((r: any) => ({ ...r, system_label: serviceLabel(r.system), overdue: r.next_due < today }));
}

/** Cron: 30 days before a service is due → email the customer + alert the team once; on/after the due date → one more email if the first was 25+ days ago. */
export async function runServiceReminders() {
  const supabase = createAdminClient();
  const now = Date.now();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const soon = new Date(now + 30 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const out = { customer_emails: 0, team_alerts: 0 };
  const { data } = await supabase.from('service_reminders').select('id, estimate_id, customer_id, system, title, next_due, customer_notified_at, team_notified_at, customer:customers(first_name, company_name, email)').eq('active', true).lte('next_due', soon).limit(100);
  for (const r of (data || []) as any[]) {
    const overdue = r.next_due < today;
    const lastCust = r.customer_notified_at ? new Date(r.customer_notified_at).getTime() : 0;
    const shouldEmail = !lastCust || (overdue && lastCust < now - 25 * 86400000);
    if (shouldEmail && r.estimate_id) {
      const o = await emailCustomerFact({ estimateId: r.estimate_id, kind: 'needed', subjectTail: overdue ? `${r.title} is due` : `${r.title} coming up ${fmtDay(r.next_due)}`, headline: overdue ? `${r.title} was due ${fmtDay(r.next_due)}.` : `${r.title} is due around ${fmtDay(r.next_due)}.`, detail: 'Want RO to handle it? Reply on your page or call (864) 304-0139 and we will get it scheduled. If you have already had it done, let us know and we will reset the reminder.', anchor: 'binder', button: 'Open Your Binder' });
      if (o.emailed) out.customer_emails++;
      await supabase.from('service_reminders').update({ customer_notified_at: new Date().toISOString() }).eq('id', r.id);
    }
    if (!r.team_notified_at) {
      const c = r.customer || {};
      await notifyTeam({ type: 'service_due', title: `${c.first_name || c.company_name || 'A customer'}: ${r.title} due ${fmtDay(r.next_due)}`, body: 'From the maintenance schedule on their binder. One tap to quote it in Customer Portal → Service due.', url: '/admin/portal', reference_id: r.estimate_id || null, tag: `service-${r.id}` } as any);
      await supabase.from('service_reminders').update({ team_notified_at: new Date().toISOString() }).eq('id', r.id);
      out.team_alerts++;
    }
  }
  return out;
}
