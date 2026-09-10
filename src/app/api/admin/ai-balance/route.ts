import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Remaining prepaid credit on the xAI (Grok) account — the model behind the
 * app's main AI chat. xAI's Management API returns the balance in USD cents,
 * signed as a liability: a $10 credit comes back as "-1000".
 *
 * Needs two env vars (from console.x.ai): XAI_MANAGEMENT_KEY (a management
 * key with billing read access) and XAI_TEAM_ID (in the console URL).
 * Cached for 30 minutes — a balance doesn't move fast enough to hammer.
 */

let cache: { at: number; body: any } | null = null;

export async function GET() {
  const key = process.env.XAI_MANAGEMENT_KEY;
  const team = process.env.XAI_TEAM_ID;

  if (!key || !team) {
    return NextResponse.json({
      configured: false,
      note: 'Add XAI_MANAGEMENT_KEY and XAI_TEAM_ID to see the live Grok credit balance.',
    });
  }

  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.body);
  }

  try {
    const res = await fetch(`https://management-api.x.ai/v1/billing/teams/${team}/prepaid/balance`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ configured: true, error: `xAI said ${res.status}` });
    }
    const d = await res.json();
    // Liability sign: negative cents = credit remaining.
    const cents = Number(d?.total?.val ?? 0);
    const balance_usd = Math.round(-cents) / 100;
    const body = {
      configured: true,
      provider: 'xAI (Grok — main AI chat)',
      balance_usd,
      low: balance_usd < 5,
      checked_at: new Date().toISOString(),
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ configured: true, error: 'Could not reach xAI' });
  }
}
