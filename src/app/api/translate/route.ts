import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { translateTexts } from '@/lib/translate';
import { resolveToken } from '@/lib/project-members';
import { getCustomerSession } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST { lang: 'es', texts: string[], token? } → { map: { [english]: spanish } }
 * For the customer pages' Spanish switch. Only for a real customer context —
 * a live Project Page token, or a signed-in portal session — so it can't be
 * used as a free public translator. Size-capped per request.
 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    if (b.lang !== 'es') return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    let ok = false;
    if (typeof b.token === 'string' && b.token) {
      const { token } = await resolveToken(b.token);
      const { data } = await createAdminClient().from('estimates').select('id').eq('share_token', token).maybeSingle();
      ok = !!data;
    }
    if (!ok) ok = !!(await getCustomerSession());
    // Signed out (e.g. the portal sign-in screen): cached phrases only — never a new Claude call.

    const texts: string[] = (Array.isArray(b.texts) ? b.texts : []).filter((t: unknown) => typeof t === 'string').slice(0, 400);
    const total = texts.reduce((n, t) => n + t.length, 0);
    if (total > 80000) return NextResponse.json({ error: 'Too much at once' }, { status: 413 });
    const map = await translateTexts(texts, 'es', { cacheOnly: !ok });
    return NextResponse.json({ map });
  } catch (e: any) {
    console.error('[api/translate]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
