/**
 * News curation — how the ticker decides what's worth the owner's glance.
 *
 *  1. Hard filters: people-moves, events/webinars, sponsored content, near-
 *     duplicate headlines and anything the team has hidden never reach the AI.
 *  2. AI ranking against RO's live profile — divisions, the kind of work
 *     currently being estimated (pulled from the estimates table), the region
 *     — with a rubric and a 0-100 score. Only ≥ MIN_SCORE is ever featured.
 *  3. Learning: 👍 / "not useful" / opened signals from news_feedback become
 *     few-shot examples and per-source weights on the next run, so the feed
 *     drifts toward what the team actually reads.
 */
import type { Pulse } from '@/lib/industry-pulse';

export const MIN_SCORE = 65;
export const MAX_FEATURED = 10;
export const MAX_TRICKS = 3;
export const MAX_HEADLINES = 8;   // ticker-only second tier
export const MIN_HEADLINE_SCORE = 45;

export interface Candidate { id: string; source_key: string; source_name: string; category: string; is_local: boolean; title: string; summary: string | null; published_at: string | null }
export interface Pick { id: string; take: string; tag: string; score: number }
export interface FeedbackSignal { item_id: string; verdict: 'up' | 'down' | 'opened'; title?: string; source_key?: string }
export interface CompanyContext { divisions: string[]; recent_projects: string[]; region: string }

/* ── 1. Hard filters ───────────────────────────────────────────── */
const JUNK_TITLE = [
  /^[A-Z][a-z]+ [A-Z]\.? ?[A-Za-z'-]+ \| /,               // "David L. Richter | BE&K" people-moves
  /\b(webinar|register now|registration|save the date|conference|expo|summit|awards?|gala|golf (tournament|outing)|ribbon[- ]cutting)\b/i,
  /\b(sponsored|partner content|advertorial|press release|announces? (partnership|appointment)|names? .* (as )?(ceo|cfo|coo|vp|president|director))\b/i,
  /\b(promoted to|joins .* as|appointed|hires|new hire|welcomes)\b/i,
  /\b(podcast|episode \d+|giveaway|sweepstakes|contest)\b/i,
];
const JUNK_SUMMARY = [/\bsponsored\b/i, /\bpaid (content|post)\b/i];

export function passesHardFilters(c: Candidate): boolean {
  if (JUNK_TITLE.some((re) => re.test(c.title))) return false;
  if (c.summary && JUNK_SUMMARY.some((re) => re.test(c.summary!))) return false;
  if (c.title.length < 18) return false;
  return true;
}

/** Drop near-duplicate headlines (same story syndicated across feeds). */
export function dedupeTitles<T extends { title: string }>(items: T[]): T[] {
  const seen: string[] = []; const out: T[] = [];
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w.length > 3);
  for (const it of items) {
    const words = new Set(norm(it.title));
    const dup = seen.some((s) => { const w2 = s.split(' '); const inter = w2.filter((w) => words.has(w)).length; return inter / Math.max(1, Math.min(words.size, w2.length)) >= 0.7; });
    if (!dup) { seen.push(Array.from(words).join(' ')); out.push(it); }
  }
  return out;
}

/* ── 3. Learning from feedback ─────────────────────────────────── */
export function sourceWeights(signals: FeedbackSignal[]): Record<string, number> {
  const w: Record<string, { score: number; n: number }> = {};
  for (const s of signals) {
    if (!s.source_key) continue;
    const e = (w[s.source_key] ||= { score: 0, n: 0 });
    e.n++; e.score += s.verdict === 'up' ? 2 : s.verdict === 'opened' ? 1 : -2;
  }
  // -1 … +1, pulled toward 0 when there are few signals
  return Object.fromEntries(Object.entries(w).map(([k, e]) => [k, Math.max(-1, Math.min(1, e.score / (e.n + 3)))]));
}

/* ── 2. The ranking prompt ─────────────────────────────────────── */
export function buildPrompt(cands: Candidate[], pulse: Pulse | null, ctx: CompanyContext, signals: FeedbackSignal[]): string {
  const list = cands.map((c, i) => `${i + 1}. [${c.id}] (${c.source_name}${c.is_local ? ', LOCAL Upstate SC' : ''} · ${c.category}) ${c.title}${c.summary ? ` — ${String(c.summary).slice(0, 170)}` : ''}`).join('\n');
  const prices = (pulse?.materials || []).map((m) => `${m.label}: ${m.mom_pct > 0 ? '+' : ''}${m.mom_pct}% m/m (${m.period})`).join('; ');
  const liked = signals.filter((s) => s.verdict === 'up' && s.title).slice(0, 8).map((s) => `- ${s.title}`).join('\n');
  const hidden = signals.filter((s) => s.verdict === 'down' && s.title).slice(0, 8).map((s) => `- ${s.title}`).join('\n');
  const opened = signals.filter((s) => s.verdict === 'opened' && s.title).slice(0, 6).map((s) => `- ${s.title}`).join('\n');

  return `You curate the morning industry feed inside the admin app of RO Unlimited, a licensed general contractor in ${ctx.region}. Divisions: ${ctx.divisions.join(', ') || 'residential, commercial, utilities, grading'}. Small company (~10 people); the owner and his foreman read this on their phones between jobs.

What they are estimating or building right now: ${ctx.recent_projects.length ? ctx.recent_projects.join('; ') : 'mixed residential and commercial work'}.
Material prices this month: ${prices || 'n/a'}.

Your job: from the list, choose ONLY items that would give this owner a genuine "huh — good to know" moment. Score each 0-100 for relevance to HIS business, not the industry at large.
Worth featuring (score 70+): material/fuel price moves he should price into bids; code, permit, licensing or inspection changes (SC, ICC, OSHA); OSHA enforcement that shows what small GCs get cited for; Southeast/Upstate market shifts — who's building what nearby, interest rates for his customers; a tool, method or jobsite trick a small crew could use this month; labor/subcontractor availability; scams and cyber incidents hitting contractors.
Not worth it (score under 40): executive appointments, awards, events, vendor puff pieces, national megaprojects with no lesson, stock-market stories, anything he can't act on or retell on a jobsite.
${liked ? `\nThe team marked these as useful before — weight similar stories up:\n${liked}` : ''}${opened ? `\nThey opened these:\n${opened}` : ''}${hidden ? `\nThey hid these — avoid this kind of thing:\n${hidden}` : ''}

Items marked "· tricks" are how-tos and trade videos (YouTube channels the trades watch). Treat them as a separate lane: pick up to ${MAX_TRICKS} of those ONLY if a crew would actually learn a technique, a tool trick, a code gotcha, or a faster way to do the work — tag those "tools". Entertainment, vlogs, product unboxings and DIY-homeowner content score low.

Pick at most ${MAX_FEATURED} in total; fewer is fine — never pad.

SECOND LIST — "headlines": aim for 6 to ${MAX_HEADLINES} MORE items (not already in picks; the ticker needs about ten things scrolling, so fill this list whenever the stories exist) that belong on a scrolling ticker as need-to-know / should-know: proposed or adopted code, permit, licensing and OSHA changes FIRST, then big material/fuel/interest-rate moves, Southeast market trends, major industry news a contractor would be expected to have heard about. Score them too; 45+ makes the ticker. No sentence needed. Prefer 1–2 local items only if they are genuinely useful. For each: the id, a tag from {prices, codes, safety, local, market, tools, labor, tech, business}, the score, and ONE plain sentence (max 26 words) on why it matters to him — concrete, no hype, no "stay informed", no restating the headline.

Return ONLY JSON: {"picks":[{"id":"…","tag":"…","score":0,"take":"…"}],"headlines":[{"id":"…","tag":"…","score":0}]}

Items:
${list}`;
}

export interface Curated { picks: Pick[]; headlines: Pick[] }

export function parseCurated(text: string, cands: Candidate[], weights: Record<string, number>): Curated {
  const picks = parsePicks(text, cands, weights);
  const m = text.match(/\{[\s\S]*\}/); if (!m) return { picks, headlines: [] };
  let parsed: any; try { parsed = JSON.parse(m[0]); } catch { return { picks, headlines: [] }; }
  const byId = new Map(cands.map((c) => [c.id, c]));
  const taken = new Set(picks.map((p) => p.id));
  const headlines: Pick[] = (parsed.headlines || [])
    .filter((h: any) => byId.has(h.id) && !taken.has(h.id))
    .map((h: any) => {
      const c = byId.get(h.id)!;
      const base = Math.max(0, Math.min(100, Number(h.score) || 0));
      return { id: h.id, take: '', tag: String(h.tag || 'market').toLowerCase().slice(0, 20), score: Math.max(0, Math.min(100, Math.round(base + 12 * (weights[c.source_key] || 0)))) };
    })
    .filter((h: Pick) => h.score >= MIN_HEADLINE_SCORE)
    .sort((a: Pick, b: Pick) => b.score - a.score)
    .slice(0, MAX_HEADLINES);
  return { picks, headlines };
}

export function parsePicks(text: string, cands: Candidate[], weights: Record<string, number>): Pick[] {
  const m = text.match(/\{[\s\S]*\}/); if (!m) return [];
  let parsed: any; try { parsed = JSON.parse(m[0]); } catch { return []; }
  const byId = new Map(cands.map((c) => [c.id, c]));
  return (parsed.picks || [])
    .filter((p: any) => byId.has(p.id) && p.take)
    .map((p: any) => {
      const c = byId.get(p.id)!;
      const base = Math.max(0, Math.min(100, Number(p.score) || 0));
      const adj = Math.round(base + 12 * (weights[c.source_key] || 0)); // learned source weight nudges ±12
      return { id: p.id, take: String(p.take).slice(0, 240), tag: String(p.tag || 'market').toLowerCase().slice(0, 20), score: Math.max(0, Math.min(100, adj)) };
    })
    .filter((p: Pick) => p.score >= MIN_SCORE)
    .sort((a: Pick, b: Pick) => b.score - a.score)
    .slice(0, MAX_FEATURED);
}
