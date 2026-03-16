import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateEstimatePDF } from '@/lib/estimate-pdf';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch estimate with customer
    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();

    if (estErr || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Add scope_of_work mapping
    estimate.scope_of_work = estimate.project_description;

    // Fetch related data
    const [{ data: lineItems }, { data: paymentSchedule }] = await Promise.all([
      supabase.from('estimate_line_items').select('*').eq('estimate_id', id).order('phase').order('sort_order'),
      supabase.from('estimate_payment_schedules').select('*').eq('estimate_id', id).order('sort_order'),
    ]);

    // Fetch disclaimers
    let selectedDisclaimers: any[] = [];
    if (estimate.disclaimer_ids?.length) {
      const { data } = await supabase.from('disclaimers').select('*').in('id', estimate.disclaimer_ids);
      selectedDisclaimers = data || [];
    }

    // Generate PDF
    const pdfBuffer = await generateEstimatePDF(estimate, lineItems || [], paymentSchedule || [], selectedDisclaimers);

    // Return as PDF binary — no caching so edits always reflect
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${estimate.estimate_number.replace(/\s/g, '_')}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('[estimates/pdf] GET error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
