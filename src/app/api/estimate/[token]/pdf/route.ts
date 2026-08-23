import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { renderEstimatePdf, pdfHeaders } from '@/lib/estimate-pdf-data';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { token: string } };

/**
 * Customer-facing PDF, gated by the share token (same rules as the live
 * page). The admin PDF route (/api/admin/estimates/[id]/pdf) now requires a
 * signed-in session, so the live link fetches from here instead.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('*, customer:customers(*)')
      .eq('share_token', params.token)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: 'Estimate not found or link expired' }, { status: 404 });
    }
    if (estimate.share_token_expires_at && new Date(estimate.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This estimate link has expired' }, { status: 410 });
    }

    const pdf = await renderEstimatePdf(supabase, estimate);
    return new NextResponse(new Uint8Array(pdf), { headers: pdfHeaders(estimate.estimate_number) });
  } catch (err) {
    console.error('[estimate/pdf] GET error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
