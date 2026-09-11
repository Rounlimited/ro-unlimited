import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { todayET } from '@/lib/dates';

/**
 * The schedule — what's supposed to happen when, across every running job.
 * Items are simple: a title, a kind, a day (or a span), optionally pinned to
 * a job. Done is a tap. Nothing here is customer-facing.
 */

const KINDS = ['work', 'pour', 'inspection', 'delivery', 'meeting', 'other'];

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || todayET();
    const to = url.searchParams.get('to') || new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10);
    const estimateId = url.searchParams.get('estimate_id');

    let q = supabase
      .from('job_schedule_items')
      .select('id, estimate_id, title, kind, phase, starts_on, ends_on, note, done_at')
      .lte('starts_on', to)
      .or(`ends_on.gte.${from},and(ends_on.is.null,starts_on.gte.${from})`)
      .order('starts_on', { ascending: true });
    if (estimateId) q = q.eq('estimate_id', estimateId);
    const { data: items, error } = await q.limit(400);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Running jobs for the picker and for naming items' chips.
    const { data: jobs } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, completed_at')
      .not('signed_at', 'is', null)
      .is('completed_at', null)
      .order('signed_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ items: items || [], jobs: jobs || [], from, to });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const title = String(body.title || '').trim().slice(0, 200);
    const starts_on = String(body.starts_on || '').slice(0, 10);
    if (!title) return NextResponse.json({ error: 'Give it a name' }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(starts_on)) return NextResponse.json({ error: 'Pick a day' }, { status: 400 });

    const { data, error } = await supabase.from('job_schedule_items').insert({
      estimate_id: body.estimate_id || null,
      title,
      kind: KINDS.includes(body.kind) ? body.kind : 'work',
      phase: (body.phase || '').trim() || null,
      starts_on,
      ends_on: /^\d{4}-\d{2}-\d{2}$/.test(String(body.ends_on || '')) && body.ends_on > starts_on ? body.ends_on : null,
      note: String(body.note || '').trim().slice(0, 1000) || null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
