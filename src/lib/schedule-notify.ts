import { createAdminClient } from '@/lib/supabase/server';
import { emailCustomerFact, fmtDay, logLine } from '@/lib/customer-notify';

/**
 * A schedule item on a job moved. Write the dated line the customer sees
 * ("County inspection moved from Friday to Monday — rain") and email them
 * once. Always sends: a moved date changes their plans.
 */
export async function notifyScheduleChange(args: { item: { id: string; estimate_id: string | null; title: string; kind: string }; oldStart: string; newStart: string; reason?: string | null; by?: string | null }) {
  if (!args.item.estimate_id || args.oldStart === args.newStart) return { emailed: false, skipped: 'no job or no change' };
  const supabase = createAdminClient();
  const { data: est } = await supabase.from('estimates').select('signed_at, show_schedule').eq('id', args.item.estimate_id).maybeSingle();
  if (!est?.signed_at) return { emailed: false, skipped: 'not a running job' };
  const visible = est.show_schedule !== false;
  const reason = String(args.reason || '').trim();
  const text = `${args.item.title} moved from ${fmtDay(args.oldStart)} to ${fmtDay(args.newStart)} (estimated)${reason ? ` — ${reason}` : ''}`;
  await logLine(args.item.estimate_id, 'schedule', text, visible, args.by);
  if (!visible) return { emailed: false, skipped: 'schedule hidden on this job' };
  const out = await emailCustomerFact({ estimateId: args.item.estimate_id, kind: 'needed', subjectTail: `date change: ${args.item.title}`, headline: text + '.', anchor: 'schedule', button: 'See the Schedule' });
  return out;
}
