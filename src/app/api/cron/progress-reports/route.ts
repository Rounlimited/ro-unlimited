import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { draftReport, newUniqueReportToken, nextDueDate } from '@/lib/progress-reports';
import { notifyTeam } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Daily: for every signed contract whose reporting cadence has come due,
 * draft the report and tell JR it's waiting.
 *
 * It never sends. A customer-facing update always passes through him first —
 * the draft is the chore, not the judgment.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: contracts } = await supabase
    .from('estimates')
    .select('id, estimate_number, project_name, reporting_cadence, reporting_day, next_report_due, signed_at')
    .not('signed_at', 'is', null)
    .not('reporting_cadence', 'is', null)
    .neq('reporting_cadence', 'none');

  const results: any[] = [];

  for (const c of contracts || []) {
    try {
      // First time we've seen this contract: schedule it, don't draft yet.
      if (!c.next_report_due) {
        const due = nextDueDate(c.reporting_cadence, c.reporting_day, new Date(c.signed_at));
        await supabase.from('estimates').update({ next_report_due: due }).eq('id', c.id);
        results.push({ estimate: c.estimate_number, scheduled: due });
        continue;
      }
      if (c.next_report_due > today) continue;

      // Don't stack drafts — if one is already waiting, just push the date.
      const { data: pending } = await supabase
        .from('progress_reports')
        .select('id')
        .eq('estimate_id', c.id)
        .eq('status', 'draft')
        .limit(1);

      if (pending && pending.length) {
        await supabase.from('estimates')
          .update({ next_report_due: nextDueDate(c.reporting_cadence, c.reporting_day) })
          .eq('id', c.id);
        results.push({ estimate: c.estimate_number, skipped: 'draft already waiting' });
        continue;
      }

      const drafted = await draftReport(supabase, c.id);
      if ('error' in drafted) { results.push({ estimate: c.estimate_number, error: drafted.error }); continue; }

      const share_token = await newUniqueReportToken(supabase);
      const { data: saved } = await supabase
        .from('progress_reports')
        .insert({ ...drafted, share_token, status: 'draft' })
        .select('id, percent')
        .single();

      await supabase.from('estimates')
        .update({ next_report_due: nextDueDate(c.reporting_cadence, c.reporting_day) })
        .eq('id', c.id);

      await notifyTeam({
        type: 'progress_report_ready',
        title: `Progress report ready — ${c.project_name || c.estimate_number}`,
        body: `${drafted.percent}% complete. Review and send when you're ready.`,
        url: `/admin/estimates/${c.id}`,
        reference_id: saved?.id || c.id,
        tag: 'progress-report',
      } as any);

      results.push({ estimate: c.estimate_number, drafted: true, percent: drafted.percent });
    } catch (err: any) {
      results.push({ estimate: c.estimate_number, error: err?.message || 'failed' });
    }
  }

  return NextResponse.json({ ran: today, contracts: (contracts || []).length, results });
}
