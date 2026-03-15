import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list disclaimers with optional category filter
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const category = req.nextUrl.searchParams.get('category');

    let query = supabase
      .from('disclaimers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[disclaimers] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new disclaimer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('disclaimers')
      .insert({
        title: body.title,
        body: body.body,
        category: body.category || 'general',
        is_default: body.is_default || false,
        sort_order: body.sort_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[disclaimers] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update an existing disclaimer
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.body !== undefined) updates.body = body.body;
    if (body.category !== undefined) updates.category = body.category;
    if (body.is_default !== undefined) updates.is_default = body.is_default;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('disclaimers')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[disclaimers] PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
