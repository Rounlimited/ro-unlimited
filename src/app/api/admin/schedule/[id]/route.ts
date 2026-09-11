import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

/** Edit one schedule item — mark done/undone, move it, rename it, remove it. */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const patch: any = {};
    if (body.done !== undefined) patch.done_at = body.done ? new Date().toISOString() : null;
    if (body.title !== undefined) patch.title = String(body.title).trim().slice(0, 200);
    if (body.kind !== undefined) patch.kind = String(body.kind);
    if (body.note !== undefined) patch.note = String(body.note || '').trim().slice(0, 1000) || null;
    if (body.starts_on !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(body.starts_on)) patch.starts_on = body.starts_on;
    if (body.ends_on !== undefined) patch.ends_on = /^\d{4}-\d{2}-\d{2}$/.test(String(body.ends_on || '')) ? body.ends_on : null;
    if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 });

    const { data, error } = await supabase.from('job_schedule_items')
      .update(patch).eq('id', params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('job_schedule_items').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
