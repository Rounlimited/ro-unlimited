import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — fetch all memories (loaded into AI context)
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ai_memories')
      .select('*')
      .order('category')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[ai-memories] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — save a new memory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ai_memories')
      .insert({
        content: body.content,
        category: body.category || 'general',
        source: body.source || 'user',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[ai-memories] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove a memory
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from('ai_memories').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ai-memories] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
