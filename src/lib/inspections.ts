import { createAdminClient } from '@/lib/supabase/server';
import { emailCustomerFact, fmtDay, logLine } from '@/lib/customer-notify';

/**
 * Permits and inspections on a job — the county-portal record a customer
 * would otherwise call about. Every change writes a dated line into the job
 * log (customer-visible when the job's "Inspections" switch is on) so the
 * timeline builds itself; results email the customer as a plain fact.
 */
import { INSPECTION_STATUS, PERMIT_STATUS } from '@/lib/inspection-status';
export { INSPECTION_STATUS, PERMIT_STATUS };
export type InspectionRecord = {
  id: string; estimate_id: string; record_type: 'inspection' | 'permit'; title: string; agency: string | null; reference: string | null;
  scheduled_on: string | null; time_window: string | null; status: string; result_on: string | null; notes: string | null; internal_notes: string | null; created_by: string | null; created_at: string; updated_at: string;
};
export const statusWord = (r: { record_type: string; status: string }) => (r.record_type === 'permit' ? PERMIT_STATUS : INSPECTION_STATUS)[r.status] || r.status;

export async function listInspections(estimateId: string): Promise<InspectionRecord[]> {
  const { data } = await createAdminClient().from('job_inspections').select('*').eq('estimate_id', estimateId)
    .order('scheduled_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  return (data || []) as InspectionRecord[];
}

async function visibleToCustomer(estimateId: string) {
  const { data } = await createAdminClient().from('estimates').select('show_inspections').eq('id', estimateId).maybeSingle();
  return data?.show_inspections !== false;
}

export async function createInspection(args: { estimateId: string; record_type?: string; title: string; agency?: string | null; reference?: string | null; scheduled_on?: string | null; time_window?: string | null; status?: string | null; notes?: string | null; internal_notes?: string | null; createdBy: string }) {
  const supabase = createAdminClient();
  const title = String(args.title || '').trim();
  if (!title) return { error: 'Name the inspection or permit' };
  const record_type = args.record_type === 'permit' ? 'permit' : 'inspection';
  const allowed = record_type === 'permit' ? PERMIT_STATUS : INSPECTION_STATUS;
  const status = args.status && allowed[args.status] ? args.status : record_type === 'permit' ? 'applied' : 'scheduled';
  const date = args.scheduled_on && /^\d{4}-\d{2}-\d{2}$/.test(args.scheduled_on) ? args.scheduled_on : null;
  const { data: row, error } = await supabase.from('job_inspections').insert({
    estimate_id: args.estimateId, record_type, title, agency: args.agency?.trim() || null, reference: args.reference?.trim() || null,
    scheduled_on: date, time_window: args.time_window?.trim() || null, status, notes: args.notes?.trim() || null, internal_notes: args.internal_notes?.trim() || null, created_by: args.createdBy,
  }).select().single();
  if (error) return { error: error.message };
  const visible = await visibleToCustomer(args.estimateId);
  const text = record_type === 'permit'
    ? `${title}: ${PERMIT_STATUS[status].toLowerCase()}${row.reference ? ` (permit #${row.reference})` : ''}${row.agency ? ` — ${row.agency}` : ''}`
    : `${title}${date ? ` scheduled for ${fmtDay(date)} (estimated)` : ' to be scheduled'}${row.time_window ? `, ${row.time_window}` : ''}${row.agency ? ` — ${row.agency}` : ''}`;
  await logLine(args.estimateId, record_type === 'permit' ? 'note' : 'inspection', text, visible, args.createdBy);
  return { record: row as InspectionRecord };
}

/** Record a result or change a date. Results email the customer (fact, honors "fewer emails"). */
export async function updateInspection(args: { estimateId: string; id: string; patch: Partial<Pick<InspectionRecord, 'status' | 'result_on' | 'notes' | 'internal_notes' | 'scheduled_on' | 'time_window' | 'reference' | 'agency' | 'title'>>; by: string; reason?: string | null }) {
  const supabase = createAdminClient();
  const { data: cur } = await supabase.from('job_inspections').select('*').eq('id', args.id).eq('estimate_id', args.estimateId).maybeSingle();
  if (!cur) return { error: 'Record not found' };
  const allowed = cur.record_type === 'permit' ? PERMIT_STATUS : INSPECTION_STATUS;
  const patch: any = { updated_at: new Date().toISOString() };
  for (const k of ['notes', 'internal_notes', 'time_window', 'reference', 'agency', 'title'] as const) if (args.patch[k] !== undefined) patch[k] = String(args.patch[k] || '').trim() || null;
  if (args.patch.scheduled_on !== undefined) patch.scheduled_on = args.patch.scheduled_on && /^\d{4}-\d{2}-\d{2}$/.test(args.patch.scheduled_on) ? args.patch.scheduled_on : null;
  if (args.patch.result_on !== undefined) patch.result_on = args.patch.result_on && /^\d{4}-\d{2}-\d{2}$/.test(args.patch.result_on) ? args.patch.result_on : null;
  if (args.patch.status !== undefined) {
    if (!allowed[args.patch.status]) return { error: 'Unknown status' };
    patch.status = args.patch.status;
    if (['passed', 'corrections', 'failed', 'issued', 'closed'].includes(args.patch.status) && patch.result_on === undefined && !cur.result_on) patch.result_on = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  }
  const { data: row, error } = await supabase.from('job_inspections').update(patch).eq('id', cur.id).select().single();
  if (error) return { error: error.message };

  const visible = await visibleToCustomer(args.estimateId);
  const notes = row.notes ? ` ${row.notes}` : '';
  let emailed: any = null;
  if (patch.status && patch.status !== cur.status) {
    const s = patch.status as string;
    if (cur.record_type === 'permit') {
      await logLine(args.estimateId, 'note', `${row.title}: ${PERMIT_STATUS[s].toLowerCase()}${row.reference ? ` (permit #${row.reference})` : ''}.${notes}`, visible, args.by);
      if (s === 'issued') emailed = await emailCustomerFact({ estimateId: args.estimateId, kind: 'update', subjectTail: `permit issued`, headline: `${row.title} has been issued${row.reference ? ` (permit #${row.reference})` : ''}.`, detail: row.notes, anchor: 'inspections' });
    } else if (s === 'passed') {
      await logLine(args.estimateId, 'inspection', `${row.title} — passed.${notes}`, visible, args.by);
      emailed = await emailCustomerFact({ estimateId: args.estimateId, kind: 'update', subjectTail: 'inspection passed', headline: `${row.title} passed.`, detail: row.notes, anchor: 'inspections' });
    } else if (s === 'corrections') {
      await logLine(args.estimateId, 'inspection', `${row.title} — corrections needed.${notes}`, visible, args.by);
      emailed = await emailCustomerFact({ estimateId: args.estimateId, kind: 'update', subjectTail: 'inspection — corrections needed', headline: `${row.title}: the inspector asked for corrections.`, detail: (row.notes || '') + '\nWe handle the corrections and schedule the re-inspection; nothing is needed from you unless it says so under Needs You.', anchor: 'inspections' });
    } else if (s === 'failed') {
      await logLine(args.estimateId, 'inspection', `${row.title} — did not pass.${notes}`, visible, args.by);
      emailed = await emailCustomerFact({ estimateId: args.estimateId, kind: 'update', subjectTail: 'inspection update', headline: `${row.title} did not pass this time.`, detail: (row.notes || '') + '\nWe fix what was flagged and schedule the re-inspection. Nothing is needed from you unless it says so under Needs You.', anchor: 'inspections' });
    } else if (s === 'reinspection') {
      await logLine(args.estimateId, 'inspection', `${row.title} — re-inspection ${row.scheduled_on ? `set for ${fmtDay(row.scheduled_on)} (estimated)` : 'to be scheduled'}.`, visible, args.by);
    } else if (s === 'cancelled') {
      await logLine(args.estimateId, 'inspection', `${row.title} — cancelled.${args.reason ? ' ' + args.reason : ''}`, false, args.by);
    }
  } else if (patch.scheduled_on !== undefined && patch.scheduled_on !== cur.scheduled_on && cur.record_type === 'inspection') {
    const text = cur.scheduled_on && patch.scheduled_on
      ? `${row.title} moved from ${fmtDay(cur.scheduled_on)} to ${fmtDay(patch.scheduled_on)} (estimated)${args.reason ? ` — ${args.reason}` : ''}`
      : `${row.title} ${patch.scheduled_on ? `scheduled for ${fmtDay(patch.scheduled_on)} (estimated)` : 'date to be set'}${args.reason ? ` — ${args.reason}` : ''}`;
    await logLine(args.estimateId, 'schedule', text, visible, args.by);
    if (visible && cur.scheduled_on && patch.scheduled_on) emailed = await emailCustomerFact({ estimateId: args.estimateId, kind: 'needed', subjectTail: `date change: ${row.title}`, headline: text + '.', anchor: 'inspections' });
  }
  return { record: row as InspectionRecord, emailed: emailed?.emailed || false, to: emailed?.to || null, skipped: emailed?.skipped || null };
}
