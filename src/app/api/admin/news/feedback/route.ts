import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** 👍 / not useful / opened — the signals the curator learns from. */
export async function POST(req: NextRequest) {
  try {
    const { item_id, verdict } = await req.json();
    if (!item_id || !['up', 'down', 'opened'].includes(verdict)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    const user = await getServerUser(req).catch(() => null);
    const supabase = createAdminClient();
    await supabase.from('news_feedback').insert({ item_id, verdict, user_email: user?.email || null });
    // "Not useful" also pulls it off the ticker immediately.
    if (verdict === 'down') await supabase.from('news_items').update({ featured: false, hidden: true }).eq('id', item_id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
