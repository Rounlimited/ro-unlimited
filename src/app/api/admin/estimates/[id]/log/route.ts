import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

/**
 * The job log — what actually happened on site, in JR's words.
 * "Rain, no work." "Water line installed." "Inspection passed."
 * The weekly/monthly report is assembled from these entries.
 */

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const since = new URL(req.url).searchParams.get('since');
    let q = supabase
      .from('job_log_entries')
      .select('*')
      .eq('estimate_id', params.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (since) q = q.gte('entry_date', since);

    const { data, error } = await q.limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ entries: data || [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();

    const type = String(body.type || 'work');
    const text = (body.text || '').trim();
    // A rain day says everything by itself; everything else needs words.
    if (!text && type !== 'rain') {
      return NextResponse.json({ error: 'Say what happened' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('job_log_entries')
      .insert({
        estimate_id: params.id,
        entry_date: body.entry_date || new Date().toISOString().slice(0, 10),
        type,
        text: text || null,
        reason: body.reason || null,
        photos: Array.isArray(body.photos) ? body.photos : [],
        include_in_report: body.include_in_report !== false,
        created_by: body.created_by || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ entry: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const fields: Record<string, any> = {};
    for (const k of ['text', 'type', 'entry_date', 'reason', 'include_in_report', 'photos']) {
      if (body[k] !== undefined) fields[k] = body[k];
    }
    const { data, error } = await supabase
      .from('job_log_entries')
      .update(fields)
      .eq('id', body.id)
      .eq('estimate_id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ entry: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase
      .from('job_log_entries').delete().eq('id', id).eq('estimate_id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
