import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { listReviews } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

/** GET ?customer=<id> | ?estimate=<id> — all customer reviews/feedback, newest first. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const reviews = await listReviews({ customerId: sp.get('customer') || undefined, estimateId: sp.get('estimate') || undefined });
    return NextResponse.json({ reviews });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

/** POST { action: 'mark_seen', ids: ['job:<uuid>', ...] } — clears the "new" flag (and the Jobs board alert). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'mark_seen') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    const ids = (Array.isArray(body.ids) ? body.ids : []).filter((x: any) => typeof x === 'string' && x.startsWith('job:')).map((x: string) => x.slice(4));
    if (ids.length) await createAdminClient().from('job_feedback').update({ seen_at: new Date().toISOString() }).in('id', ids).is('seen_at', null);
    return NextResponse.json({ ok: true, marked: ids.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
