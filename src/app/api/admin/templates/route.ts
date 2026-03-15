import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list all active templates, with optional division & estimate_type filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const division = req.nextUrl.searchParams.get('division');
    const estimateType = req.nextUrl.searchParams.get('estimate_type');
    const includeInactive = req.nextUrl.searchParams.get('include_inactive');

    let query = supabase
      .from('estimate_templates')
      .select('*')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (division) {
      query = query.eq('division', division);
    }

    if (estimateType) {
      query = query.eq('estimate_type', estimateType);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[templates] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new estimate template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('estimate_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        division: body.division || 'general',
        estimate_type: body.estimate_type || 'detailed',
        contract_type: body.contract_type || 'fixed_price',
        default_overhead_percent: body.default_overhead_percent ?? 10,
        default_markup_percent: body.default_markup_percent ?? 15,
        default_tax_percent: body.default_tax_percent ?? 8,
        default_contingency_percent: body.default_contingency_percent ?? 5,
        default_valid_days: body.default_valid_days ?? 30,
        line_items: body.line_items || [],
        payment_schedule: body.payment_schedule || [],
        disclaimers: body.disclaimers || [],
        exclusions: body.exclusions || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: body.created_by || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[templates] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
