import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { HOSTED_MODELS, DEFAULT_MODEL, AI_MARKUP, rackConfig } from '@/lib/ai-models';

export const dynamic = 'force-dynamic';

/**
 * What the assistant screen needs to draw the model picker and the usage line:
 * the hosted models (prices already include the markup), whether the rack is
 * reachable, and what has been spent this month.
 */
export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hostedReady = !!process.env.OPENROUTER_API_KEY;
  const models = HOSTED_MODELS.map((m) => ({
    key: m.key, label: m.label, short: m.short, group: m.group, best: m.best, vision: m.vision,
    price_in: Math.round(m.in * AI_MARKUP * 100) / 100,
    price_out: Math.round(m.out * AI_MARKUP * 100) / 100,
  }));

  // Rack (self-hosted) models are optional. If the rack is off or not set up,
  // the hosted models above keep working on their own.
  let rack: { configured: boolean; online: boolean; models: any[] } = { configured: false, online: false, models: [] };
  const rc = rackConfig();
  if (rc) {
    rack.configured = true;
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch(`${rc.url}/api/ext/models`, { headers: { Authorization: `Bearer ${rc.token}` }, signal: ctl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (r.ok) { const d = await r.json(); rack.online = true; rack.models = Array.isArray(d.models) ? d.models : []; }
    } catch { /* rack offline */ }
  }

  // Month-to-date spend (what the customer is charged, not our cost)
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  let month = { charged_usd: 0, messages: 0 };
  try {
    const { data } = await createAdminClient().from('ai_usage').select('charged_usd').gte('at', start.toISOString()).limit(5000);
    month = { charged_usd: Math.round((data || []).reduce((s, r: any) => s + Number(r.charged_usd || 0), 0) * 100) / 100, messages: (data || []).length };
  } catch { /* table missing — show zero */ }

  return NextResponse.json({ hostedReady, defaultModel: DEFAULT_MODEL, models, rack, month, user: { email: user.email || null } });
}
