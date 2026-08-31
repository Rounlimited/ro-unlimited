import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rollUpProgress } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

/**
 * Jobs — work that is actually happening.
 *
 * A job is an estimate that got accepted or signed, plus anything tracked by
 * hand (RO-JOB-…). Estimates are where work is won; this is where it's run,
 * so every row carries percent complete, JR's status flags, the money position,
 * and — the point of the screen — whether it needs him today.
 */

const STALE_DAYS = 7;

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { data: jobs, error } = await supabase
      .from('estimates')
      .select(`id, estimate_number, project_name, division, status, total, signed_at,
               estimate_date, project_address, project_city,
               schedule_status, budget_status, status_reason, status_note, status_updated_at,
               reporting_cadence, reporting_day, next_report_due,
               customer:customers(first_name, last_name, company_name, phone)`)
      .or('status.eq.accepted,signed_at.not.is.null')
      .order('signed_at', { ascending: false, nullsFirst: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const empty = { jobs: [], counts: { all: 0, attention: 0, running: 0, behind: 0, complete: 0 } };
    const ids = (jobs || []).map((j) => j.id);
    if (!ids.length) return NextResponse.json(empty);

    const [itemsRes, progRes, reportsRes, logRes, invRes] = await Promise.all([
      supabase.from('estimate_line_items').select('estimate_id, phase, total, sort_order').in('estimate_id', ids),
      supabase.from('estimate_phase_progress').select('estimate_id, phase, percent_complete, weight, sort_order').in('estimate_id', ids),
      supabase.from('progress_reports').select('estimate_id, status, period_end, sent_at').in('estimate_id', ids),
      supabase.from('job_log_entries').select('estimate_id, entry_date, type, created_at').in('estimate_id', ids),
      supabase.from('invoices').select('estimate_id, total, amount_paid, status').in('estimate_id', ids),
    ]);

    const group = <T extends { estimate_id: string }>(rows: T[] | null) => {
      const m = new Map<string, T[]>();
      for (const r of rows || []) {
        const list = m.get(r.estimate_id) || [];
        list.push(r);
        m.set(r.estimate_id, list);
      }
      return m;
    };

    const items = group(itemsRes.data as any);
    const prog = group(progRes.data as any);
    const reports = group(reportsRes.data as any);
    const logs = group(logRes.data as any);
    const invoices = group(invRes.data as any);

    const today = new Date().toISOString().slice(0, 10);
    const staleCutoff = Date.now() - STALE_DAYS * 86400000;

    const rows = (jobs || []).map((j) => {
      const roll = rollUpProgress((items.get(j.id) || []) as any, (prog.get(j.id) || []) as any);
      const mine = reports.get(j.id) || [];
      const draftWaiting = mine.some((r: any) => r.status === 'draft');
      const lastSent = mine.filter((r: any) => r.status === 'sent').map((r: any) => r.sent_at).sort().reverse()[0] || null;

      const entries = logs.get(j.id) || [];
      const lastLog = entries.map((e: any) => e.created_at).sort().reverse()[0] || null;
      const loggedToday = entries.some((e: any) => e.entry_date === today);
      const stale = !lastLog || new Date(lastLog).getTime() < staleCutoff;

      const inv = invoices.get(j.id) || [];
      const billed = inv.filter((i: any) => i.status !== 'draft' && i.status !== 'cancelled')
        .reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const paid = inv.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);

      const total = Number(j.total || 0);
      const earned = roll.totalValue > 0 ? roll.earned : total * (roll.percent / 100);
      const c: any = j.customer;
      const complete = roll.percent >= 100;
      const reportDue = !!(j.next_report_due && j.next_report_due <= today);
      const noPhases = roll.phases.length === 0;

      // Why this job wants him today — first reason wins, most urgent first.
      const reasons: string[] = [];
      if (draftWaiting) reasons.push('Report written and waiting to send');
      if (!draftWaiting && reportDue) reasons.push('Progress report is due');
      if (j.schedule_status === 'behind') reasons.push('Flagged behind schedule');
      if (j.budget_status === 'over') reasons.push('Flagged over budget');
      if (noPhases) reasons.push('No phases set up yet');
      if (!noPhases && stale && !complete) reasons.push(`Nothing logged in ${STALE_DAYS} days`);
      if (!complete && earned - billed > Math.max(2500, total * 0.15)) {
        reasons.push('More work done than billed');
      }

      return {
        id: j.id,
        number: j.estimate_number,
        project_name: j.project_name,
        division: j.division,
        total,
        signed_at: j.signed_at,
        address: [j.project_address, j.project_city].filter(Boolean).join(', ') || null,
        customer_name: c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || null,
        customer_phone: c?.phone || null,
        percent: roll.percent,
        phase_count: roll.phases.length,
        in_progress: roll.phases.find((p) => p.percent > 0 && p.percent < 100)?.phase || null,
        next_up: roll.phases.find((p) => p.percent === 0)?.phase || null,
        schedule_status: j.schedule_status,
        budget_status: j.budget_status,
        status_reason: j.status_reason,
        reporting_cadence: j.reporting_cadence,
        reporting_day: j.reporting_day,
        report_due: reportDue,
        draft_waiting: draftWaiting,
        last_report_sent: lastSent,
        last_log_at: lastLog,
        logged_today: loggedToday,
        stale,
        earned: Math.round(earned),
        billed: Math.round(billed),
        paid: Math.round(paid),
        tracked: (j.estimate_number || '').startsWith('RO-JOB'),
        complete,
        reasons,
      };
    });

    const open = rows.filter((r) => !r.complete);
    const attention = open.filter((r) => r.reasons.length > 0);

    // Most urgent first: a waiting report beats a due one, a due one beats
    // behind schedule, and anything with a reason beats a quiet job.
    const weight = (r: typeof rows[number]) =>
      (r.draft_waiting ? 100 : 0) + (r.report_due ? 60 : 0) +
      (r.schedule_status === 'behind' ? 40 : 0) + (r.budget_status === 'over' ? 30 : 0) +
      (r.phase_count === 0 ? 20 : 0) + (r.stale ? 10 : 0);

    const sorted = [...rows].sort((a, b) => weight(b) - weight(a));

    return NextResponse.json({
      jobs: sorted,
      today: {
        date: today,
        running: open.length,
        logged: open.filter((r) => r.logged_today).length,
        unlogged: open.filter((r) => !r.logged_today).map((r) => ({
          id: r.id, name: r.project_name || r.number,
        })),
      },
      counts: {
        all: rows.length,
        attention: attention.length,
        running: open.length,
        behind: open.filter((r) => r.schedule_status === 'behind').length,
        complete: rows.length - open.length,
      },
      money: {
        contract: open.reduce((s, r) => s + r.total, 0),
        earned: open.reduce((s, r) => s + r.earned, 0),
        billed: open.reduce((s, r) => s + r.billed, 0),
      },
      needs_attention: attention.length,
    });
  } catch (err) {
    console.error('[jobs/list] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
