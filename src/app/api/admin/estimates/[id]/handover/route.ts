import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getBinder, getChecklist, addBinderItem, sendHandover, createServiceReminder } from '@/lib/handover';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

/** The binder as the customer will see it, plus JR's checklist. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const [binder, checklist] = await Promise.all([getBinder(params.id), getChecklist(params.id)]);
  if (!binder) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json({ binder, checklist });
}

/** { action: 'send' } | { action: 'add_item', kind, title, url, note } | { action: 'add_service', system, title, interval_months, next_due, note } */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    const user = await getServerUser(req);
    const who = String(body.by || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RO Unlimited').slice(0, 80);
    if (body.action === 'send') {
      const out = await sendHandover(params.id, who);
      if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
      return NextResponse.json(out);
    }
    if (body.action === 'add_item') {
      const out = await addBinderItem({ estimateId: params.id, kind: body.kind, title: body.title, url: body.url, note: body.note, by: who });
      if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
      return NextResponse.json({ ok: true, item: out.item });
    }
    if (body.action === 'add_service') {
      const out = await createServiceReminder({ estimateId: params.id, system: body.system, title: body.title, interval_months: body.interval_months, next_due: String(body.next_due || ''), note: body.note, by: who });
      if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
      return NextResponse.json({ ok: true, reminder: out.reminder });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[handover] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** ?item_id= removes a binder document. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const itemId = req.nextUrl.searchParams.get('item_id');
  if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 });
  await createAdminClient().from('job_binder_items').delete().eq('id', itemId).eq('estimate_id', params.id);
  return NextResponse.json({ ok: true });
}
