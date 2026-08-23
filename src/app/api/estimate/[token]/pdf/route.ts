import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { renderEstimatePdf, pdfHeaders } from '@/lib/estimate-pdf-data';
import { recordDocumentEvent, visitorFromCookies, visitorCookie } from '@/lib/doc-events';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { token: string } };

/**
 * Customer-facing PDF, gated by the share token (same rules as the live
 * page). The admin PDF route (/api/admin/estimates/[id]/pdf) now requires a
 * signed-in session, so the live link fetches from here instead.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
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

    // ?mode=download from the Download button; anything else is an in-page view.
    const mode = req.nextUrl.searchParams.get('mode') === 'download' ? 'pdf_download' : 'pdf_view';
    const visitor = visitorFromCookies();
    await recordDocumentEvent({ req, docType: 'estimate', doc: estimate, event: mode, visitorId: visitor.id });

    const pdf = await renderEstimatePdf(supabase, estimate);
    const headers: Record<string, string> = pdfHeaders(estimate.estimate_number);
    const res = new NextResponse(new Uint8Array(pdf), { headers });
    if (visitor.isNew) res.headers.append('Set-Cookie', visitorCookie(visitor.id));
    return res;
  } catch (err) {
    console.error('[estimate/pdf] GET error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
