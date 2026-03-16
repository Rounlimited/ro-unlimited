import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

// DEBUG — compares JS client vs raw fetch to find data discrepancy
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Method 1: Supabase JS client (what PDF route uses)
    const supabase = createAdminClient();
    const { data: estimate } = await supabase
      .from('estimates')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();

    const { data: lineItems } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id)
      .order('phase')
      .order('sort_order');

    // Method 2: Raw fetch (like curl)
    const rawEstRes = await fetch(
      `${supaUrl}/rest/v1/estimates?select=customer_id,project_address,project_city,total,status&id=eq.${id}`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      }
    );
    const rawEst = await rawEstRes.json();

    const rawLiRes = await fetch(
      `${supaUrl}/rest/v1/estimate_line_items?select=description,quantity,unit_cost,phase&estimate_id=eq.${id}&order=sort_order`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      }
    );
    const rawLi = await rawLiRes.json();

    return NextResponse.json({
      _timestamp: new Date().toISOString(),
      _env_key_prefix: serviceKey.substring(0, 30) + '...',
      _env_key_length: serviceKey.length,
      _env_url: supaUrl,
      js_client: {
        total: estimate?.total,
        customer_email: estimate?.customer?.email,
        address: estimate?.project_address,
        line_items_count: (lineItems || []).length,
        first_3_items: (lineItems || []).slice(0, 3).map((i: any) => ({
          qty: i.quantity, cost: i.unit_cost, desc: i.description,
        })),
      },
      raw_fetch: {
        total: rawEst?.[0]?.total,
        address: rawEst?.[0]?.project_address,
        status: rawEst?.[0]?.status,
        line_items_count: rawLi?.length,
        first_3_items: (rawLi || []).slice(0, 3).map((i: any) => ({
          qty: i.quantity, cost: i.unit_cost, desc: i.description,
        })),
      },
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
