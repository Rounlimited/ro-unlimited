import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyScheduleChange } from '@/lib/schedule-notify';

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

    const { data: before } = patch.starts_on ? await supabase.from('job_schedule_items').select('id, estimate_id, title, kind, starts_on, ends_on').eq('id', params.id).maybeSingle() : { data: null };
    // Moving the start alone keeps the item's length: slide the end by the same number of days.
    if (before && patch.starts_on && body.ends_on === undefined && before.ends_on) {
      const delta = Math.round((new Date(patch.starts_on + 'T12:00:00').getTime() - new Date(before.starts_on + 'T12:00:00').getTime()) / 86400000);
      patch.ends_on = new Date(new Date(before.ends_on + 'T12:00:00').getTime() + delta * 86400000).toISOString().slice(0, 10);
    }
    const { data, error } = await supabase.from('job_schedule_items')
      .update(patch).eq('id', params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // A moved date on a running job: dated line on the customer's page + one email, with the reason JR typed.
    let notified: any = null;
    if (before && patch.starts_on && before.starts_on !== patch.starts_on && before.estimate_id) {
      notified = await notifyScheduleChange({ item: before, oldStart: before.starts_on, newStart: patch.starts_on, reason: body.reason || null, by: body.by || null }).catch(() => null);
    }
    return NextResponse.json({ item: data, notified });
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
