import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Admin: the website visitor log. ?days=7&filter=people|robots|staff|all
 * Returns visitors (newest first) with their page-by-page trail.
 */
export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 7));
  const filter = req.nextUrl.searchParams.get('filter') || 'people';
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const supabase = createAdminClient();

  let q = supabase.from('site_visitors').select('*').gte('last_seen', since).order('last_seen', { ascending: false }).limit(300);
  if (filter === 'people') q = q.in('verdict', ['person', 'likely_person']);
  else if (filter === 'robots') q = q.eq('verdict', 'robot');
  else if (filter === 'unsure') q = q.eq('verdict', 'unsure');
  else if (filter === 'staff') q = q.eq('verdict', 'staff');
  const { data: visitors, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counts for the filter chips
  const { data: all } = await supabase.from('site_visitors').select('verdict').gte('last_seen', since).limit(5000);
  const counts: Record<string, number> = { people: 0, robots: 0, unsure: 0, staff: 0, all: 0 };
  for (const v of all || []) {
    counts.all++;
    if (v.verdict === 'person' || v.verdict === 'likely_person') counts.people++;
    else if (v.verdict === 'robot') counts.robots++;
    else if (v.verdict === 'staff') counts.staff++;
    else counts.unsure++;
  }

  const ids = (visitors || []).map((v) => v.visitor_id);
  const trails: Record<string, any[]> = {};
  if (ids.length) {
    const { data: pvs } = await supabase.from('site_pageviews')
      .select('visitor_id, created_at, path, title, source, referrer, visible_ms, max_scroll, interactions, clicks, city, region, network, network_type, device_type, os, browser, screen, tz, session_id')
      .in('visitor_id', ids).gte('created_at', since).order('created_at', { ascending: false }).limit(3000);
    for (const p of pvs || []) (trails[p.visitor_id] ||= []).push(p);
  }
  return NextResponse.json({ days, filter, counts, visitors: (visitors || []).map((v) => ({ ...v, trail: (trails[v.visitor_id] || []).slice(0, 60) })) });
}
