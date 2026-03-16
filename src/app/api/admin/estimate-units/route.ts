import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — list all units
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('estimate_units')
      .select('*')
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[estimate-units] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a custom unit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.abbreviation) {
      return NextResponse.json({ error: 'name and abbreviation required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('estimate_units')
      .insert({
        name: body.name,
        abbreviation: body.abbreviation.toLowerCase().replace(/\s+/g, '_'),
        category: body.category || 'custom',
        is_default: false,
        sort_order: 99,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[estimate-units] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
