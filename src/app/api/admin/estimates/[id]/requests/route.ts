import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { listRequests, createRequest, setRequestStatus } from '@/lib/customer-requests';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return NextResponse.json({ requests: await listRequests(params.id) });
}

/** Ask the customer for something. Emails them unless notify:false. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    const user = await getServerUser(req);
    const who = String(body.created_by || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RO Unlimited').slice(0, 80);
    const out = await createRequest({ estimateId: params.id, kind: body.kind, title: body.title, details: body.details, due_on: body.due_on || null, createdBy: who, notify: body.notify !== false });
    if (!out.request) return NextResponse.json({ error: out.error || 'Could not create the request' }, { status: 400 });
    return NextResponse.json({ ok: true, request: out.request, emailed: out.emailed });
  } catch (err) {
    console.error('[estimates/requests] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Close or reopen: { request_id, status: 'done' | 'open' | 'cancelled' } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json();
  if (!body.request_id || !['open', 'done', 'cancelled'].includes(body.status)) return NextResponse.json({ error: 'request_id and status required' }, { status: 400 });
  const out = await setRequestStatus(params.id, body.request_id, body.status);
  if (!out.request) return NextResponse.json({ error: out.error }, { status: 400 });
  return NextResponse.json({ ok: true, request: out.request });
}
