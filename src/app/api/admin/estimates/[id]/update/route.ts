import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { sendUpdate } from '@/lib/customer-updates';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

/** Post a quick update (text + photos) to the customer's page and email it. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    const user = await getServerUser(req);
    const who = String(body.sent_by || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RO Unlimited').slice(0, 80);
    const out = await sendUpdate({ estimateId: params.id, body: body.body, photos: Array.isArray(body.photos) ? body.photos : [], sentBy: who, notify: body.notify !== false });
    if (!out.entry) return NextResponse.json({ error: out.error || 'Could not post the update' }, { status: 400 });
    return NextResponse.json({ ok: true, entry: out.entry, emailed: out.emailed, to: out.to, warning: out.skipped });
  } catch (err) {
    console.error('[estimates/update] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
