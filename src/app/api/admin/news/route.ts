import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { run as refreshNews } from '@/app/api/cron/news-refresh/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Dashboard + news page data.
 *   GET ?limit=60&category=local   → featured picks, pulse (materials/weather), latest items
 *   POST                           → refresh now (signed-in admin; middleware gates it)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(10, Number(sp.get('limit')) || 60));
    const category = sp.get('category');
    const supabase = createAdminClient();
    let latest = supabase.from('news_items').select('id, source_key, source_name, category, is_local, title, url, summary, image_url, published_at, featured, ai_take, ai_tag').eq('hidden', false).order('published_at', { ascending: false, nullsFirst: false }).limit(limit);
    if (category && category !== 'all') latest = category === 'local' ? latest.eq('is_local', true) : latest.eq('category', category);
    else latest = latest.neq('category', 'tricks'); // the All tab is news; tricks have their own tab
    const [{ data: featured }, { data: tickerRows }, { data: items }, { data: pulseRow }] = await Promise.all([
      supabase.from('news_items').select('id, source_name, category, is_local, title, url, summary, image_url, published_at, ai_take, ai_tag, score').eq('featured', true).eq('hidden', false).order('score', { ascending: false }).limit(10),
      supabase.from('news_items').select('id, source_name, category, is_local, title, url, summary, image_url, published_at, ai_take, ai_tag, score').eq('ticker', true).eq('hidden', false).order('score', { ascending: false }).limit(16),
      latest,
      supabase.from('app_settings').select('value').eq('key', 'news_pulse').maybeSingle(),
    ]);
    const all = featured || [];
    return NextResponse.json({ featured: all.filter((f: any) => f.category !== 'tricks'), tricks: all.filter((f: any) => f.category === 'tricks'), ticker: tickerRows || [], items: items || [], pulse: pulseRow?.value || null });
  } catch (err) {
    console.error('[news] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST() {
  try { return await refreshNews(); }
  catch (err) { console.error('[news] refresh error:', err); return NextResponse.json({ error: 'Refresh failed' }, { status: 500 }); }
}
