import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

// DEBUG — returns exact data the PDF route would use
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Exact same query as PDF route
    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();

    if (estErr || !estimate) {
      return NextResponse.json({ error: 'Estimate not found', estErr }, { status: 404 });
    }

    const [{ data: lineItems }, { data: paymentSchedule }] = await Promise.all([
      supabase.from('estimate_line_items').select('*').eq('estimate_id', id).order('phase').order('sort_order'),
      supabase.from('estimate_payment_schedules').select('*').eq('estimate_id', id).order('sort_order'),
    ]);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    return NextResponse.json({
      _debug: 'This returns the exact data the PDF route uses',
      _timestamp: new Date().toISOString(),
      _env_key_prefix: serviceKey.substring(0, 20) + '...',
      _env_key_length: serviceKey.length,
      _env_url: supaUrl,
      customer_id: estimate.customer_id,
      customer: estimate.customer,
      project_name: estimate.project_name,
      project_address: estimate.project_address,
      project_city: estimate.project_city,
      total: estimate.total,
      status: estimate.status,
      line_items_count: (lineItems || []).length,
      line_items: (lineItems || []).map((i: any) => ({
        description: i.description,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        unit: i.unit,
        phase: i.phase,
      })),
      payment_schedule_count: (paymentSchedule || []).length,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
