/**
 * Progress reporting — the pieces JR was typing by hand on every job.
 *
 * Two halves:
 *  1. Reporting cadence chosen in the estimate wizard, which prints its own
 *     clause into the contract terms and PDF (nothing to write in).
 *  2. Per-phase progress + JR-controlled schedule/budget status flags.
 *     Status is internal — it rides on the admin list and the report he
 *     reviews, never on the customer's live contract page.
 */

export type Cadence = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'phase' | 'none';
export type ScheduleStatus = 'ahead' | 'on' | 'behind';
export type BudgetStatus = 'under' | 'on' | 'over';
export type StatusReason = 'weather' | 'permits' | 'materials' | 'owner' | 'change_order' | 'subcontractor';

export const CADENCES: { id: Cadence; label: string; hint: string }[] = [
  { id: 'daily',    label: 'Daily',       hint: 'An update every working day' },
  { id: 'weekly',   label: 'Weekly',      hint: 'A written update every week' },
  { id: 'biweekly', label: 'Every 2 Wks', hint: 'An update every other week' },
  { id: 'monthly',  label: 'Monthly',     hint: 'One update per month' },
  { id: 'phase',    label: 'Each Phase',  hint: 'An update as each phase finishes' },
  { id: 'none',     label: 'None',        hint: 'No scheduled reporting in the contract' },
];

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const REPORT_INCLUDES: { id: string; label: string; clause: string }[] = [
  { id: 'completed', label: 'Work Completed',    clause: 'work completed since the previous report' },
  { id: 'percent',   label: 'Percent Complete',  clause: 'percent complete by phase' },
  { id: 'photos',    label: 'Jobsite Photos',    clause: 'jobsite photographs' },
  { id: 'upcoming',  label: 'What’s Next',  clause: 'work scheduled for the coming period' },
  { id: 'schedule',  label: 'Schedule Outlook',  clause: 'schedule outlook and any delays' },
  { id: 'billing',   label: 'Billed To Date',    clause: 'amounts billed to date against the contract' },
];

export const DEFAULT_INCLUDES = ['completed', 'percent', 'photos', 'upcoming'];

export const SCHEDULE_META: Record<ScheduleStatus, { label: string; color: string; bg: string }> = {
  ahead:  { label: 'Ahead of Schedule', color: '#35d07f', bg: 'rgba(53,208,127,0.15)' },
  on:     { label: 'On Schedule',       color: '#35d07f', bg: 'rgba(53,208,127,0.15)' },
  behind: { label: 'Behind Schedule',   color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
};

export const BUDGET_META: Record<BudgetStatus, { label: string; color: string; bg: string }> = {
  under: { label: 'Under Budget', color: '#35d07f', bg: 'rgba(53,208,127,0.15)' },
  on:    { label: 'On Budget',    color: '#35d07f', bg: 'rgba(53,208,127,0.15)' },
  over:  { label: 'Over Budget',  color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
};

export const STATUS_REASONS: { id: StatusReason; label: string }[] = [
  { id: 'weather',       label: 'Weather' },
  { id: 'permits',       label: 'Permits / Inspection' },
  { id: 'materials',     label: 'Material Delivery' },
  { id: 'owner',         label: 'Owner Decision Pending' },
  { id: 'change_order',  label: 'Change Order' },
  { id: 'subcontractor', label: 'Subcontractor' },
];

/** The contract clause for a cadence — this is what JR stops typing. */
export function reportingClause(cadence?: string | null, day?: string | null, includes?: string[] | null): string | null {
  if (!cadence || cadence === 'none') return null;
  const items = (includes && includes.length ? includes : DEFAULT_INCLUDES)
    .map((id) => REPORT_INCLUDES.find((r) => r.id === id)?.clause)
    .filter(Boolean) as string[];
  const list = items.length > 1
    ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]
    : items[0] || 'a summary of work completed';

  const when = cadence === 'daily'    ? 'each working day'
    : cadence === 'weekly'   ? `each ${day || 'Friday'}`
    : cadence === 'biweekly' ? `every other ${day || 'Friday'}`
    : cadence === 'monthly'  ? `on the ${day || '1st'} of each month`
    : 'as each phase of the work is completed';

  return `Progress Reporting: Owner will receive a written progress report ${when} for the duration of the work, including ${list}. Reports are delivered by text message and email to the contact information on this agreement.`;
}

/** Short human label for chips and report headers. */
export function cadenceLabel(cadence?: string | null, day?: string | null): string | null {
  if (!cadence || cadence === 'none') return null;
  if (cadence === 'daily') return 'Daily';
  if (cadence === 'weekly') return `Weekly · ${day || 'Friday'}`;
  if (cadence === 'biweekly') return `Every 2 Weeks · ${day || 'Friday'}`;
  if (cadence === 'monthly') return `Monthly · ${day || '1st'}`;
  return 'At Each Phase';
}

export interface PhaseRoll {
  phase: string;
  value: number;          // dollar value of the phase's line items
  percent: number;        // 0-100 as set by JR
  earned: number;         // value * percent/100
}

/**
 * Roll line items up by phase and weight the overall percentage by DOLLARS,
 * not by phase count — a lender or GC can defend that number; "3 of 7 phases"
 * they cannot.
 */
export function rollUpProgress(
  lineItems: { phase?: string | null; total?: number | null; sort_order?: number | null }[],
  progress: { phase: string; percent_complete: number; weight?: number | null; sort_order?: number | null; custom?: boolean | null }[],
): { phases: PhaseRoll[]; totalValue: number; earned: number; percent: number } {
  const byPhase = new Map<string, number>();
  // Phases come back in WORK order — the sort order of their line items — not
  // alphabetically. A customer reading "Cleanup" first would be confused.
  const order = new Map<string, number>();
  for (const li of lineItems) {
    const phase = (li.phase || 'Other').trim() || 'Other';
    byPhase.set(phase, (byPhase.get(phase) || 0) + Number(li.total || 0));
    const at = Number(li.sort_order ?? Number.MAX_SAFE_INTEGER);
    if (!order.has(phase) || at < (order.get(phase) as number)) order.set(phase, at);
  }
  const pct = new Map(progress.map((p) => [p.phase, Math.max(0, Math.min(100, Number(p.percent_complete) || 0))]));

  // Lump-sum contracts price the job as one number, so there may be no priced
  // phases at all. JR's hand-added phases carry an optional relative weight
  // ("how big a piece of the job is this"); phases with no weight and no line
  // items simply count equally.
  for (const p of progress) {
    if (byPhase.has(p.phase)) {
      if (!byPhase.get(p.phase) && p.weight) byPhase.set(p.phase, Number(p.weight));
      continue;
    }
    byPhase.set(p.phase, Number(p.weight || 0));
    order.set(p.phase, 1000 + Number(p.sort_order ?? 0));
  }

  const phases: PhaseRoll[] = Array.from(byPhase.entries())
    .sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
    .map(([phase, value]) => {
      const percent = pct.get(phase) ?? 0;
      return { phase, value, percent, earned: value * (percent / 100) };
    });

  const totalValue = phases.reduce((s, p) => s + p.value, 0);
  const earned = phases.reduce((s, p) => s + p.earned, 0);
  // No dollars on the estimate yet (options-only doc): fall back to a plain average.
  const percent = totalValue > 0
    ? Math.round((earned / totalValue) * 100)
    : phases.length ? Math.round(phases.reduce((s, p) => s + p.percent, 0) / phases.length) : 0;

  return { phases, totalValue, earned, percent };
}
