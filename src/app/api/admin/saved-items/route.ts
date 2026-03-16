import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — list saved items (search, filter by division/phase)
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const search = req.nextUrl.searchParams.get('search');
    const division = req.nextUrl.searchParams.get('division');
    const phase = req.nextUrl.searchParams.get('phase');

    let query = supabase
      .from('saved_estimate_items')
      .select('*')
      .order('use_count', { ascending: false })
      .order('name');

    if (division) query = query.eq('division', division);
    if (phase) query = query.eq('phase', phase);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let results = data || [];
    if (search) {
      const s = search.toLowerCase();
      results = results.filter((i: any) =>
        (i.name || '').toLowerCase().includes(s) ||
        (i.description || '').toLowerCase().includes(s)
      );
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('[saved-items] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — save an item to the library
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('saved_estimate_items')
      .insert({
        name: body.name,
        description: body.description || null,
        phase: body.phase || null,
        category: body.category || null,
        unit: body.unit || null,
        unit_cost: body.unit_cost || null,
        markup_percent: body.markup_percent || 0,
        division: body.division || null,
        tags: body.tags || [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[saved-items] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove a saved item
export async function DELETE(req: NextRequest) {
  try {
    const itemId = req.nextUrl.searchParams.get('id');
    if (!itemId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('saved_estimate_items')
      .delete()
      .eq('id', itemId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[saved-items] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
