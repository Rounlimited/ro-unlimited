import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list cost items with optional filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const category = req.nextUrl.searchParams.get('category');
    const trade = req.nextUrl.searchParams.get('trade');
    const search = req.nextUrl.searchParams.get('search');
    const all = req.nextUrl.searchParams.get('all');

    let query = supabase
      .from('cost_items')
      .select('*')
      .order('name', { ascending: true });

    // Only return active items by default
    if (all !== 'true') {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (trade) {
      query = query.ilike('trade', `%${trade}%`);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,trade.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[cost-library] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new cost item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('cost_items')
      .insert({
        name: body.name,
        description: body.description || null,
        category: body.category,
        trade: body.trade || null,
        unit: body.unit || 'each',
        default_cost: body.default_cost ?? 0,
        default_markup_percent: body.default_markup_percent ?? 0,
        vendor_id: body.vendor_id || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[cost-library] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
