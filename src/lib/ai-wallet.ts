import { createHmac, randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Nexa AI module — the prepaid credit wallet.
 *
 * Credit is bought through Nexa Pay (a saved card charged on demand) and
 * recorded in `ai_credits`; every AI message is metered in `ai_usage`.
 * Balance = credit bought minus what has been used since the first purchase.
 * Until the first purchase the wallet is "not started" and nothing is blocked.
 *
 * Money rule used throughout: claim the charge in our table first, then charge,
 * then mark it done. A charge id is never reused for a different charge, and
 * Nexa Pay answers a repeated id with what happened the first time.
 */

const PAY_URL = process.env.NEXA_PAY_URL || 'https://pay.nexavisiongroup.com/api/external/nexa-credit';
export const TOPUP_MIN = 10;
export const TOPUP_MAX = 500;
export const TOPUP_PRESETS = [10, 20, 50, 100];

export type AutoTopUp = { on: boolean; below: number; amount: number; last_error?: string | null };
const DEFAULT_AUTO: AutoTopUp = { on: false, below: 5, amount: 20 };

export const walletConfigured = () => !!process.env.NEXA_CREDIT_KEY && !!process.env.NEXA_CREDIT_CLIENT;

export async function payCall(body: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: any }> {
  const raw = JSON.stringify(body);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = 'sha256=' + createHmac('sha256', process.env.NEXA_CREDIT_KEY || '').update(`${ts}.${raw}`).digest('hex');
  try {
    const r = await fetch(PAY_URL, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Nexa-Client': process.env.NEXA_CREDIT_CLIENT || '', 'X-Nexa-Timestamp': ts, 'X-Nexa-Signature': sig },
      body: raw,
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: 'Could not reach Nexa Pay. Try again.', unknown: true } };
  }
}

export async function getAuto(): Promise<AutoTopUp> {
  const { data } = await createAdminClient().from('app_settings').select('value').eq('key', 'ai_wallet').maybeSingle();
  const a = (data?.value as any)?.auto;
  return a && typeof a === 'object' ? { ...DEFAULT_AUTO, ...a } : DEFAULT_AUTO;
}

export async function setAuto(auto: AutoTopUp) {
  await createAdminClient().from('app_settings').upsert({ key: 'ai_wallet', value: { auto } }, { onConflict: 'key' });
}

/** started=false until the first credit purchase; nothing is blocked before that. */
export async function getBalance(): Promise<{ started: boolean; balance: number }> {
  const supabase = createAdminClient();
  const [{ count }, { data: bal }] = await Promise.all([
    supabase.from('ai_credits').select('id', { count: 'exact', head: true }).eq('status', 'done'),
    supabase.rpc('ai_wallet_balance'),
  ]);
  return { started: (count || 0) > 0, balance: Math.round(Number(bal || 0) * 10000) / 10000 };
}

export type TopUpResult = { ok: true; amount: number } | { ok: false; error: string; declined?: boolean; no_card?: boolean; unknown?: boolean };

/**
 * Charge the saved card and add the credit. `chargeId` makes it safe to retry:
 * the same id can never charge twice (unique here, and unique at Nexa Pay).
 */
export async function topUp(amount: number, by: string | null, opts: { auto?: boolean; chargeId?: string } = {}): Promise<TopUpResult> {
  const supabase = createAdminClient();
  const amt = Math.round(Number(amount) * 100) / 100;
  if (!(amt >= TOPUP_MIN && amt <= TOPUP_MAX)) return { ok: false, error: `Add between $${TOPUP_MIN} and $${TOPUP_MAX} at a time.` };
  const chargeId = opts.chargeId || `m-${randomUUID()}`;

  const { error: claimErr } = await supabase.from('ai_credits').insert({
    amount_usd: amt, kind: opts.auto ? 'auto' : 'topup', status: 'pending', charge_id: chargeId, by_email: by,
  });
  if (claimErr) {
    // Same id already claimed: report what happened to that one, never charge again.
    const { data: row } = await supabase.from('ai_credits').select('status, amount_usd').eq('charge_id', chargeId).maybeSingle();
    if (row?.status === 'done') return { ok: true, amount: Number(row.amount_usd) };
    return { ok: false, error: 'That top-up is already running.', unknown: true };
  }

  const r = await payCall({ action: 'charge', amount: amt, charge_id: chargeId, by, auto: !!opts.auto });
  if (r.ok && r.data?.paid) {
    await supabase.from('ai_credits').update({ status: 'done', payment_id: r.data.payment_id || null }).eq('charge_id', chargeId);
    return { ok: true, amount: amt };
  }
  if (r.data?.unknown || r.status === 0 || r.status >= 500) {
    // We can't tell whether money moved. Leave the claim pending; settlePending() finishes it later.
    return { ok: false, error: r.data?.error || "We couldn't confirm that charge, so no credit was added yet.", unknown: true };
  }
  await supabase.from('ai_credits').update({ status: 'failed', note: String(r.data?.error || r.status).slice(0, 200) }).eq('charge_id', chargeId);
  return { ok: false, error: r.data?.error || 'The top-up did not go through.', declined: !!r.data?.declined, no_card: !!r.data?.no_card };
}

/** Finish top-ups left "pending" (a dropped connection after the card was charged). Safe to call often. */
export async function settlePending() {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: rows } = await supabase.from('ai_credits').select('charge_id, amount_usd, kind, by_email').eq('status', 'pending').lt('at', cutoff).limit(5);
  for (const row of rows || []) {
    const r = await payCall({ action: 'charge', amount: Number(row.amount_usd), charge_id: row.charge_id, by: row.by_email, auto: row.kind === 'auto' });
    if (r.ok && r.data?.paid) await supabase.from('ai_credits').update({ status: 'done', payment_id: r.data.payment_id || null }).eq('charge_id', row.charge_id);
    else if (r.data?.declined || r.data?.no_card || r.data?.no_wallet) await supabase.from('ai_credits').update({ status: 'failed', note: String(r.data?.error || '').slice(0, 200) }).eq('charge_id', row.charge_id);
    // still unknown: leave it pending
  }
}

/**
 * Automatic top-up: when the balance is under the level the admin set, charge
 * the amount they set. One attempt per 10-minute window at most, and a decline
 * turns it off so a bad card is not retried all day.
 */
export async function maybeAutoTopUp(): Promise<TopUpResult | null> {
  if (!walletConfigured()) return null;
  const auto = await getAuto();
  if (!auto.on) return null;
  const { started, balance } = await getBalance();
  if (!started || balance >= auto.below) return null;
  const bucket = Math.floor(Date.now() / 600_000);
  const res = await topUp(auto.amount, 'automatic top-up', { auto: true, chargeId: `auto-${bucket}` });
  if (!res.ok && (res.declined || res.no_card)) await setAuto({ ...auto, on: false, last_error: res.error });
  return res;
}
