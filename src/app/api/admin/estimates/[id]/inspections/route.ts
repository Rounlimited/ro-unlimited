import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { listInspections, createInspection, updateInspection } from '@/lib/inspections';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return NextResponse.json({ records: await listInspections(params.id) });
}

/** Add a permit or inspection. { record_type, title, agency, reference, scheduled_on, time_window, status, notes, internal_notes } */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    const user = await getServerUser(req);
    const who = String(body.created_by || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RO Unlimited').slice(0, 80);
    const out = await createInspection({ estimateId: params.id, ...body, createdBy: who });
    if (!out.record) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json({ ok: true, record: out.record });
  } catch (err) {
    console.error('[inspections] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Record a result / move a date. { record_id, status?, notes?, result_on?, scheduled_on?, reason?, ... } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    if (!body.record_id) return NextResponse.json({ error: 'record_id required' }, { status: 400 });
    const user = await getServerUser(req);
    const who = String(body.by || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RO Unlimited').slice(0, 80);
    const { record_id, reason, by: _b, ...patch } = body;
    const out = await updateInspection({ estimateId: params.id, id: record_id, patch, by: who, reason: reason || null });
    if (!out.record) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json({ ok: true, record: out.record, emailed: out.emailed, to: out.to, warning: out.skipped });
  } catch (err) {
    console.error('[inspections] PATCH', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
