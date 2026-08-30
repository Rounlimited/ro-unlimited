import crypto from 'crypto';
import type { createAdminClient } from '@/lib/supabase/server';
import { rollUpProgress, cadenceLabel } from '@/lib/reporting';

/**
 * Progress reports — the weekly/monthly update JR was typing up by hand.
 *
 * The system drafts it from what's already in the system (phase percentages,
 * jobsite photos, what's been invoiced) and hands it to JR. He edits a line
 * and sends. Nothing goes to a customer without him pressing send.
 */

// No look-alike characters — these get read aloud and typed by hand.
const TOKEN_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function newReportToken(): string {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}

export async function newUniqueReportToken(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 4; i++) {
    const t = newReportToken();
    const { data } = await supabase.from('progress_reports').select('id').eq('share_token', t).limit(1);
    if (!data || data.length === 0) return t;
  }
  return crypto.randomBytes(24).toString('base64url');
}

export interface DraftedReport {
  estimate_id: string;
  period_start: string | null;
  period_end: string;
  percent: number;
  prev_percent: number;
  phases: { phase: string; percent: number }[];
  completed: string[];
  photos: { url: string; caption?: string | null }[];
  summary: string;
  next_up: string | null;
  schedule_status: string | null;
  budget_status: string | null;
  status_reason: string | null;
  billed_to_date: number | null;
  contract_total: number | null;
}

const list = (items: string[]) =>
  items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : items[0] || '';

/**
 * Write the summary JR would have typed. Plain, specific, and only about
 * things the system actually knows — never invented detail.
 */
export function draftSummary(d: {
  completed: string[];
  inProgress: { phase: string; percent: number } | null;
  nextUp: string | null;
  percent: number;
  prevPercent: number;
  scheduleStatus: string | null;
  statusReason: string | null;
  statusNote: string | null;
  firstReport: boolean;
}): string {
  const parts: string[] = [];

  if (d.completed.length) {
    parts.push(`${list(d.completed)} ${d.completed.length > 1 ? 'were' : 'was'} completed since the last update.`);
  } else if (d.firstReport) {
    parts.push('Work is underway on your project.');
  } else if (d.percent > d.prevPercent) {
    parts.push('Work continued across the project this period.');
  } else {
    parts.push('No phases changed since the last update.');
  }

  if (d.inProgress) {
    parts.push(`${d.inProgress.phase} is currently ${d.inProgress.percent}% complete.`);
  }
  if (d.nextUp) parts.push(`${d.nextUp} is up next.`);

  if (d.scheduleStatus === 'behind') {
    const why: Record<string, string> = {
      weather: 'weather',
      permits: 'permitting and inspection',
      materials: 'a material delivery',
      owner: 'a pending decision on selections',
      change_order: 'a change order',
      subcontractor: 'subcontractor scheduling',
    };
    const reason = d.statusReason ? why[d.statusReason] : null;
    parts.push(reason
      ? `The schedule has slipped due to ${reason}; we're working to make the time back up.`
      : "We're running behind the original schedule and working to make the time back up.");
  } else if (d.scheduleStatus === 'ahead') {
    parts.push('The job is currently running ahead of schedule.');
  } else if (d.scheduleStatus === 'on') {
    parts.push('The job is on schedule.');
  }

  if (d.statusNote && d.statusNote.trim()) parts.push(d.statusNote.trim());

  parts.push(`The project is ${d.percent}% complete overall.`);
  return parts.join(' ');
}

/** Build (but do not save) the next report for a contract. */
export async function draftReport(
  supabase: ReturnType<typeof createAdminClient>,
  estimateId: string,
): Promise<DraftedReport | { error: string }> {
  const [estRes, itemsRes, progRes, lastRes] = await Promise.all([
    supabase
      .from('estimates')
      .select('id, total, photos, schedule_status, budget_status, status_reason, status_note, reporting_cadence, reporting_day')
      .eq('id', estimateId)
      .single(),
    supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', estimateId),
    supabase.from('estimate_phase_progress').select('phase, percent_complete').eq('estimate_id', estimateId),
    supabase
      .from('progress_reports')
      .select('percent, phases, period_end, created_at')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  if (estRes.error || !estRes.data) return { error: 'Estimate not found' };
  const est = estRes.data;

  const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
  const last = (lastRes.data || [])[0];
  const prevPhases: Record<string, number> = {};
  for (const p of (last?.phases as any[]) || []) prevPhases[p.phase] = Number(p.percent) || 0;

  // A phase "completed" if it reached 100 since the last report went out.
  const completed = roll.phases
    .filter((p) => p.percent >= 100 && (last ? (prevPhases[p.phase] ?? 0) < 100 : true))
    .map((p) => p.phase);

  const inProgress = roll.phases.find((p) => p.percent > 0 && p.percent < 100) || null;
  const nextUp = roll.phases.find((p) => p.percent === 0)?.phase || null;

  // Invoiced against this contract so far.
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('estimate_id', estimateId)
    .neq('status', 'draft')
    .neq('status', 'cancelled');
  const billed = (invoices || []).reduce((s, i) => s + Number(i.total || 0), 0);

  // The most recent jobsite photos already attached to the job.
  const photos = Array.isArray(est.photos)
    ? (est.photos as any[]).slice(-4).map((p) => ({ url: p.url, caption: p.caption || null }))
    : [];

  return {
    estimate_id: estimateId,
    period_start: last?.period_end || null,
    period_end: new Date().toISOString().slice(0, 10),
    percent: roll.percent,
    prev_percent: Number(last?.percent) || 0,
    phases: roll.phases.map((p) => ({ phase: p.phase, percent: p.percent })),
    completed,
    photos,
    summary: draftSummary({
      completed,
      inProgress: inProgress ? { phase: inProgress.phase, percent: inProgress.percent } : null,
      nextUp,
      percent: roll.percent,
      prevPercent: Number(last?.percent) || 0,
      scheduleStatus: est.schedule_status,
      statusReason: est.status_reason,
      statusNote: est.status_note,
      firstReport: !last,
    }),
    next_up: nextUp,
    schedule_status: est.schedule_status || null,
    budget_status: est.budget_status || null,
    status_reason: est.status_reason || null,
    billed_to_date: billed,
    contract_total: Number(est.total) || null,
  };
}

/** When the next report is due, from the cadence on the contract. */
export function nextDueDate(cadence: string | null, day: string | null, from = new Date()): string | null {
  if (!cadence || cadence === 'none' || cadence === 'phase') return null;
  const d = new Date(from);
  if (cadence === 'monthly') {
    const target = day === 'Last' ? 0 : parseInt(day || '1', 10) || 1;
    const next = new Date(d.getFullYear(), d.getMonth() + 1, target === 0 ? 0 : target);
    return next.toISOString().slice(0, 10);
  }
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const want = Math.max(0, names.indexOf(day || 'Friday'));
  const step = cadence === 'biweekly' ? 14 : 7;
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  while (next.getDay() !== want) next.setDate(next.getDate() + 1);
  if (step === 14) next.setDate(next.getDate() + 7);
  return next.toISOString().slice(0, 10);
}

export { cadenceLabel };
