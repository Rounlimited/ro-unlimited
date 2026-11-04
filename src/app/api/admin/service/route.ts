import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { listServiceDue, createServiceReminder, updateServiceReminder } from '@/lib/handover';

export const dynamic = 'force-dynamic';

/** Who's due for what, across customers. ?days=60 */
export async function GET(req: NextRequest) {
  const days = Math.min(365, Number(req.nextUrl.searchParams.get('days')) || 60);
  return NextResponse.json({ due: await listServiceDue(days) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = await getServerUser(req);
  const who = String(body.by || user?.user_metadata?.full_name || 'RO Unlimited').slice(0, 80);
  const out = await createServiceReminder({ estimateId: body.estimate_id || null, customerId: body.customer_id || null, system: body.system, title: body.title, interval_months: body.interval_months, next_due: String(body.next_due || ''), note: body.note, by: who });
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
  return NextResponse.json({ ok: true, reminder: out.reminder });
}

/** { id, done?: true, active?: false, next_due?: 'YYYY-MM-DD' } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const out = await updateServiceReminder({ id: body.id, done: !!body.done, active: body.active, next_due: body.next_due });
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
  return NextResponse.json({ ok: true, reminder: out.reminder });
}
