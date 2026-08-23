import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAllSources } from '@/lib/news-feeds';
import { buildPulse } from '@/lib/industry-pulse';
import { buildPrompt, parsePicks, passesHardFilters, dedupeTitles, sourceWeights, type Candidate, type CompanyContext, type FeedbackSignal } from '@/lib/news-curator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Vercel cron, daily 10:30 UTC (6:30am ET) — Hobby plan allows once a day.
// The app also refreshes itself from the client whenever the data is >6h old
// (see useNews), and a signed-in admin can POST /api/admin/news any time.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return run();
}

export async function run() {
  const supabase = createAdminClient();
  const started = Date.now();

  // 1) Pull every feed, upsert by URL (new rows only get inserted; existing keep their AI take)
  const { items, failed } = await fetchAllSources();
  let inserted = 0;
  if (items.length) {
    const { data: existing } = await supabase.from('news_items').select('url').in('url', items.map((i) => i.url));
    const have = new Set((existing || []).map((r: any) => r.url));
    const fresh = items.filter((i) => !have.has(i.url));
    for (let i = 0; i < fresh.length; i += 100) {
      const { error } = await supabase.from('news_items').insert(fresh.slice(i, i + 100));
      if (!error) inserted += Math.min(100, fresh.length - i);
    }
  }
  // Keep 45 days
  await supabase.from('news_items').delete().lt('fetched_at', new Date(Date.now() - 45 * 86400000).toISOString());

  // 2) Pulse numbers (materials + weather) → app_settings
  const pulse = await buildPulse();
  await supabase.from('app_settings').upsert({ key: 'news_pulse', value: pulse }, { onConflict: 'key' });

  // 3) Curate — hard filters → AI ranking against RO's live profile → threshold.
  let featured = 0; let considered = 0;
  try {
    const since4d = new Date(Date.now() - 4 * 86400000).toISOString();
    const since60d = new Date(Date.now() - 60 * 86400000).toISOString();
    const [{ data: rows }, { data: fb }, { data: recentEst }] = await Promise.all([
      supabase.from('news_items').select('id, source_key, source_name, category, is_local, title, summary, published_at, hidden').gte('published_at', since4d).eq('hidden', false).order('published_at', { ascending: false }).limit(120),
      supabase.from('news_feedback').select('item_id, verdict, item:news_items(title, source_key)').gte('created_at', since60d).order('created_at', { ascending: false }).limit(300),
      supabase.from('estimates').select('project_name, division, estimate_type, created_at').order('created_at', { ascending: false }).limit(12),
    ]);
    const signals: FeedbackSignal[] = (fb || []).map((f: any) => ({ item_id: f.item_id, verdict: f.verdict, title: f.item?.title, source_key: f.item?.source_key }));
    const cands: Candidate[] = dedupeTitles((rows || []).filter(passesHardFilters));
    considered = cands.length;
    if (cands.length) {
      const divisions = Array.from(new Set((recentEst || []).map((e: any) => String(e.division || '').toLowerCase().replace(/[^a-z_]/g, '')).filter(Boolean)));
      const recent_projects = Array.from(new Set((recentEst || []).map((e: any) => [e.project_name, e.estimate_type ? `(${String(e.estimate_type).replace(/_/g, ' ')})` : ''].filter(Boolean).join(' ')).filter(Boolean))).slice(0, 8);
      const ctx: CompanyContext = { divisions, recent_projects, region: 'Greenville, South Carolina (Upstate; serves SC, GA, NC)' };
      const text = await askModel(buildPrompt(cands, pulse, ctx, signals));
      const picks = parsePicks(text, cands, sourceWeights(signals));
      await supabase.from('news_items').update({ featured: false }).eq('featured', true);
      for (const p of picks) {
        await supabase.from('news_items').update({ featured: true, featured_at: new Date().toISOString(), ai_take: p.take, ai_tag: p.tag, score: p.score }).eq('id', p.id);
      }
      featured = picks.length;
    }
  } catch (e) { console.error('[news-refresh] curation failed', e); }

  return NextResponse.json({ ok: true, sources: { fetched: items.length, inserted, failed }, considered, featured, materials: pulse.materials.length, weather: pulse.weather.length, ms: Date.now() - started });
}

async function askModel(prompt: string): Promise<string> {
  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${groq}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 1800, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }),
      });
      if (res.ok) { const d = await res.json(); const t = d.choices?.[0]?.message?.content; if (t) return t; }
    } catch { /* fall through */ }
  }
  const claude = process.env.ANTHROPIC_API_KEY;
  if (claude) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': claude, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1800, messages: [{ role: 'user', content: prompt }] }),
      });
      if (res.ok) { const d = await res.json(); return d.content?.[0]?.text || ''; }
    } catch { /* ignore */ }
  }
  return '';
}
