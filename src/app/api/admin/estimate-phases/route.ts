import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — list phases (optionally filter by division)
export async function GET(req: NextRequest) {
  try {
    const division = req.nextUrl.searchParams.get('division');
    const supabase = createAdminClient();

    let query = supabase
      .from('estimate_phases')
      .select('*')
      .order('sort_order');

    // If division specified, return phases for that division + universal phases (division IS NULL)
    if (division) {
      query = query.or(`division.is.null,division.eq.${division}`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[estimate-phases] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a custom phase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Insert before Cleanup (sort_order 22) by default
    const { data, error } = await supabase
      .from('estimate_phases')
      .insert({
        name: body.name,
        division: body.division || null,
        sort_order: body.sort_order ?? 21,
        is_default: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[estimate-phases] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
