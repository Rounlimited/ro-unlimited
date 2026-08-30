import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { token: string } };

/** Public read of one sent progress report. Drafts are invisible. */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data: report, error } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('share_token', params.token)
      .single();

    if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    if (report.status !== 'sent') {
      return NextResponse.json({ error: 'This report is not available yet' }, { status: 404 });
    }

    const { data: estimate } = await supabase
      .from('estimates')
      .select('estimate_number, project_name, share_token, customer:customers(first_name, last_name, company_name)')
      .eq('id', report.estimate_id)
      .single();

    supabase
      .from('progress_reports')
      .update({ view_count: (report.view_count || 0) + 1, last_viewed_at: new Date().toISOString() })
      .eq('id', report.id)
      .then(undefined, () => {});

    const customer: any = estimate?.customer;

    // Internal-only fields (schedule/budget flags, billing, who it went to)
    // are deliberately not returned here.
    return NextResponse.json({
      percent: report.percent,
      prev_percent: report.prev_percent,
      phases: report.phases || [],
      completed: report.completed || [],
      photos: report.photos || [],
      summary: report.summary,
      next_up: report.next_up,
      period_start: report.period_start,
      period_end: report.period_end,
      sent_at: report.sent_at,
      project_name: estimate?.project_name || null,
      estimate_number: estimate?.estimate_number || null,
      customer_name: customer?.company_name
        || [customer?.first_name, customer?.last_name].filter(Boolean).join(' ')
        || null,
      contract_link: estimate?.share_token ? `/estimate/${estimate.share_token}` : null,
    });
  } catch (err) {
    console.error('[report/[token]] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
