import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — list default inclusions
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('default_inclusions')
      .select('*')
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[inclusions] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new default inclusion
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('default_inclusions')
      .insert({
        text: body.text,
        is_default: body.is_default ?? true,
        sort_order: body.sort_order ?? 99,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[inclusions] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
