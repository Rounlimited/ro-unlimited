import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser, roleOf } from '@/lib/supabase/server';
import { getAuto, getBalance, payCall, setAuto, settlePending, topUp, walletConfigured, TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS } from '@/lib/ai-wallet';

export const dynamic = 'force-dynamic';

/**
 * The AI credit wallet for the assistant screen.
 * GET  — balance, saved card, automatic top-up settings, recent top-ups.
 * POST — { action: setup | topup | auto | remove_card }  (admins only: it spends the company card)
 */

const canSpend = (user: any) => roleOf(user) !== 'employee';
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!walletConfigured()) return NextResponse.json({ configured: false });

  await settlePending().catch(() => {});
  const [bal, auto, pay, hist] = await Promise.all([
    getBalance(),
    getAuto(),
    payCall({ action: 'status' }),
    createAdminClient().from('ai_credits').select('at, amount_usd, kind, status, by_email').order('at', { ascending: false }).limit(12),
  ]);
  return NextResponse.json({
    configured: true,
    canSpend: canSpend(user),
    started: bal.started,
    balance: Math.round(bal.balance * 100) / 100,
    low: bal.started && bal.balance < 3,
    card: pay.ok ? pay.data.card : null,
    on_hold: pay.ok && pay.data.status === 'on_hold',
    auto,
    presets: TOPUP_PRESETS, min: TOPUP_MIN, max: TOPUP_MAX,
    history: (hist.data || []).map((h: any) => ({ at: h.at, amount: Number(h.amount_usd), kind: h.kind, status: h.status, by: h.by_email })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!walletConfigured()) return NextResponse.json({ error: 'Adding credit is not set up yet.' }, { status: 503 });
  if (!canSpend(user)) return NextResponse.json({ error: 'Only an admin can add credit or change the card.' }, { status: 403 });
  const b = await req.json().catch(() => ({}));

  // Get the secure page where the card is entered (or replaced)
  if (b.action === 'setup') {
    const r = await payCall({
      action: 'ensure',
      customer: { name: 'RO Unlimited', company: 'RO Unlimited', email: user.email },
      return_url: `${SITE()}/admin?ai=wallet`,
    });
    if (!r.ok) return NextResponse.json({ error: r.data?.error || 'Could not start card setup.' }, { status: 502 });
    return NextResponse.json({ card_url: r.data.card_url, card: r.data.card });
  }

  if (b.action === 'topup') {
    const amount = Number(b.amount);
    const rid = typeof b.request_id === 'string' && /^[A-Za-z0-9-]{8,60}$/.test(b.request_id) ? b.request_id : null;
    if (!rid) return NextResponse.json({ error: 'request_id required' }, { status: 400 });
    const res = await topUp(amount, user.email || null, { chargeId: `m-${rid}` });
    if (!res.ok) return NextResponse.json(res, { status: res.unknown ? 502 : 402 });
    const bal = await getBalance();
    return NextResponse.json({ ok: true, amount: res.amount, balance: Math.round(bal.balance * 100) / 100 });
  }

  if (b.action === 'auto') {
    const on = b.on === true;
    const below = Math.round(Number(b.below));
    const amount = Math.round(Number(b.amount));
    if (on && !(below >= 1 && below <= 100)) return NextResponse.json({ error: 'Set the low level between $1 and $100.' }, { status: 400 });
    if (on && !(amount >= TOPUP_MIN && amount <= TOPUP_MAX)) return NextResponse.json({ error: `Set the top-up amount between $${TOPUP_MIN} and $${TOPUP_MAX}.` }, { status: 400 });
    const cur = await getAuto();
    const auto = { on, below: on ? below : cur.below, amount: on ? amount : cur.amount, last_error: null };
    await setAuto(auto);
    return NextResponse.json({ ok: true, auto });
  }

  if (b.action === 'remove_card') {
    const r = await payCall({ action: 'remove_card' });
    if (!r.ok && !r.data?.no_wallet) return NextResponse.json({ error: r.data?.error || 'Could not remove the card.' }, { status: 502 });
    const cur = await getAuto();
    await setAuto({ ...cur, on: false });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
