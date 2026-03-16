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

    console.log('[PDF] Generating for estimate:', id);
    console.log('[PDF] customer_id:', estimate.customer_id, 'customer:', estimate.customer?.first_name, estimate.customer?.last_name);
    console.log('[PDF] project_address:', estimate.project_address, estimate.project_city);
    console.log('[PDF] total:', estimate.total);

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

    console.log('[PDF] line_items count:', (lineItems || []).length, 'payment_schedules:', (paymentSchedule || []).length, 'disclaimers:', selectedDisclaimers.length);
    if (lineItems?.length) {
      const liTotal = lineItems.reduce((s: number, i: any) => s + i.quantity * i.unit_cost * (1 + (i.markup_percent || 0) / 100), 0);
      console.log('[PDF] line items calculated subtotal:', liTotal);
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
