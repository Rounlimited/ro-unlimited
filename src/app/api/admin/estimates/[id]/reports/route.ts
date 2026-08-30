import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { draftReport, newUniqueReportToken } from '@/lib/progress-reports';

type RouteContext = { params: { id: string } };

/** GET — every report for this contract, newest first. */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('estimate_id', params.id)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    return NextResponse.json({
      reports: (data || []).map((r) => ({ ...r, link: r.share_token ? `${siteUrl}/r/${r.share_token}` : null })),
    });
  } catch (err) {
    console.error('[reports] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST — draft the next report. Saved as a draft with a share token ready;
 * it is not visible to the customer until JR sends it.
 */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const drafted = await draftReport(supabase, params.id);
    if ('error' in drafted) return NextResponse.json(drafted, { status: 404 });

    const share_token = await newUniqueReportToken(supabase);
    const { data, error } = await supabase
      .from('progress_reports')
      .insert({ ...drafted, share_token, status: 'draft' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    return NextResponse.json({ report: { ...data, link: `${siteUrl}/r/${data.share_token}` } });
  } catch (err) {
    console.error('[reports] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
