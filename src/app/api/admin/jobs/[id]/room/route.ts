import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rollUpProgress } from '@/lib/reporting';

type RouteContext = { params: { id: string } };

/**
 * The Job Room — everything JR knows about a job that the customer never
 * sees, in one payload: progress, money position, real costs and margin,
 * the full log (private entries included), his notes, and how often the
 * customer has actually been looking.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const [estRes, itemsRes, progRes, costsRes, invRes, logRes] = await Promise.all([
      supabase
        .from('estimates')
        .select(`id, estimate_number, project_name, total, division, share_token,
          signed_at, signed_name, completed_at, completion_note, warranty_months,
          schedule_status, budget_status, status_reason, status_note, status_updated_at,
          reporting_cadence, reporting_day, next_report_due, progress_notified_at,
          internal_notes, view_count, first_viewed_at, last_viewed_at, pdf_count,
          project_address, project_city,
          customer:customers(id, first_name, last_name, company_name, email, phone)`)
        .eq('id', id)
        .single(),
      supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', id),
      supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order, custom').eq('estimate_id', id),
      supabase.from('job_costs').select('id, spent_on, category, amount, vendor, note').eq('estimate_id', id)
        .order('spent_on', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('invoices').select('id, invoice_number, total, amount_paid, status, due_date').eq('estimate_id', id),
      supabase.from('job_log_entries').select('id, entry_date, type, text, reason, include_in_report, created_at')
        .eq('estimate_id', id).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(60),
    ]);

    if (estRes.error || !estRes.data) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const est: any = estRes.data;

    const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
    const total = Number(est.total || 0);
    const earned = roll.totalValue > 0 ? roll.earned : total * (roll.percent / 100);

    const costs = costsRes.data || [];
    const spent = costs.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    for (const c of costs) byCategory[c.category] = (byCategory[c.category] || 0) + Number(c.amount || 0);

    const invoices = (invRes.data || []) as any[];
    const billed = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled')
      .reduce((s, i) => s + Number(i.total || 0), 0);
    const paid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);

    const log = logRes.data || [];
    const rainDays = new Set(log.filter((l: any) => l.type === 'rain').map((l: any) => l.entry_date)).size;
    const daysOnJob = est.signed_at
      ? Math.max(0, Math.floor((Date.now() - new Date(est.signed_at).getTime()) / 86400000))
      : 0;

    return NextResponse.json({
      estimate: est,
      progress: {
        percent: roll.percent,
        phases: roll.phases,
        total_value: roll.totalValue,
      },
      money: {
        contract: Math.round(total),
        earned: Math.round(earned),
        spent: Math.round(spent),
        margin: Math.round(earned - spent),
        billed: Math.round(billed),
        paid: Math.round(paid),
        unbilled: Math.round(earned - billed),
        by_category: byCategory,
      },
      costs,
      invoices,
      log,
      rain_days: rainDays,
      days_on_job: daysOnJob,
    });
  } catch (err) {
    console.error('[jobs/room] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
