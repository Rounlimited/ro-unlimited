/**
 * Industry news for the admin dashboard — free RSS/Atom sources, no keys.
 * Parsed with a small dependency-free reader (RSS 2.0 + Atom). Probed
 * 2026-08-23: every source below returned items; dead ones were dropped.
 */
export interface NewsSource { key: string; name: string; url: string; category: NewsCategory; local?: boolean }
export type NewsCategory = 'industry' | 'local' | 'codes' | 'safety' | 'trade' | 'tech' | 'equipment' | 'business';

export const NEWS_SOURCES: NewsSource[] = [
  // National industry
  { key: 'constructiondive', name: 'Construction Dive', url: 'https://www.constructiondive.com/feeds/news/', category: 'industry' },
  { key: 'constructiondive-commercial', name: 'Construction Dive', url: 'https://www.constructiondive.com/feeds/topic/commercial-building/', category: 'industry' },
  { key: 'constructiondive-labor', name: 'Construction Dive', url: 'https://www.constructiondive.com/feeds/topic/labor/', category: 'business' },
  { key: 'constructiondive-tech', name: 'Construction Dive', url: 'https://www.constructiondive.com/feeds/topic/technology/', category: 'tech' },
  { key: 'constructionexec', name: 'Construction Executive', url: 'https://www.constructionexec.com/rss', category: 'business' },
  { key: 'cbo', name: 'Construction Business Owner', url: 'https://www.constructionbusinessowner.com/rss.xml', category: 'business' },
  { key: 'agc', name: 'AGC of America', url: 'https://www.agc.org/rss.xml', category: 'industry' },
  { key: 'constructconnect', name: 'ConstructConnect', url: 'https://www.constructconnect.com/blog/rss.xml', category: 'industry' },
  { key: 'constructionjunkie', name: 'Construction Junkie', url: 'https://www.constructionjunkie.com/blog?format=rss', category: 'tech' },
  // Trades
  { key: 'contractormag', name: 'Contractor Magazine', url: 'https://www.contractormag.com/rss.xml', category: 'trade' },
  { key: 'plumbermag', name: 'Plumber Magazine', url: 'https://www.plumbermag.com/rss', category: 'trade' },
  { key: 'finehomebuilding', name: 'Fine Homebuilding', url: 'https://www.finehomebuilding.com/feed', category: 'trade' },
  { key: 'equipmentworld', name: 'Equipment World', url: 'https://feeds.feedburner.com/EquipmentWorld', category: 'equipment' },
  // Codes & safety
  { key: 'icc', name: 'ICC (building codes)', url: 'https://www.iccsafe.org/feed/', category: 'codes' },
  { key: 'osha', name: 'OSHA', url: 'https://www.osha.gov/news/newsreleases.xml', category: 'safety' },
  // Upstate South Carolina
  { key: 'gsabusiness', name: 'GSA Business Report', url: 'https://gsabusiness.com/feed/', category: 'local', local: true },
  { key: 'upstatebiz', name: 'Upstate Business Journal', url: 'https://upstatebusinessjournal.com/feed/', category: 'local', local: true },
  { key: 'scbiz', name: 'SC Biz News', url: 'https://www.scbiznews.com/feed/', category: 'local', local: true },
];

export interface FeedItem {
  source_key: string; source_name: string; category: NewsCategory; is_local: boolean;
  title: string; url: string; summary: string | null; image_url: string | null; published_at: string | null;
}

/* ─── Tiny XML helpers ──────────────────────────────────────────── */
const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, '&');
const stripTags = (s: string) => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1].trim() : null;
}
function attr(block: string, name: string, attrName: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*\\s${attrName}=["']([^"']+)["'][^>]*\\/?>`, 'i'));
  return m ? m[1] : null;
}
function firstImage(block: string): string | null {
  return attr(block, 'media:content', 'url') || attr(block, 'media:thumbnail', 'url') || attr(block, 'enclosure', 'url')
    || (block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null);
}
function toIso(s: string | null): string | null {
  if (!s) return null; const d = new Date(decode(s).trim()); return isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml: string, src: NewsSource): FeedItem[] {
  const out: FeedItem[] = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = stripTags(tag(b, 'title') || '');
    let url = isAtom ? (attr(b, 'link', 'href') || '') : decode(tag(b, 'link') || '').trim();
    if (!url) url = decode(tag(b, 'guid') || '').trim();
    if (!title || !/^https?:\/\//i.test(url)) continue;
    const rawSummary = tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content') || '';
    const summary = stripTags(rawSummary).slice(0, 400) || null;
    const published_at = toIso(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    out.push({
      source_key: src.key, source_name: src.name, category: src.category, is_local: !!src.local,
      title: title.slice(0, 300), url: url.split('#')[0], summary, image_url: firstImage(b), published_at,
    });
  }
  return out;
}

export async function fetchSource(src: NewsSource, timeoutMs = 12000): Promise<FeedItem[]> {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0 (RO Unlimited admin news; build@rounlimited.com)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }, signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return [];
    return parseFeed(await res.text(), src);
  } catch { return []; }
  finally { clearTimeout(t); }
}

export async function fetchAllSources(): Promise<{ items: FeedItem[]; failed: string[] }> {
  const results = await Promise.all(NEWS_SOURCES.map(async (s) => ({ key: s.key, items: await fetchSource(s) })));
  const failed = results.filter((r) => r.items.length === 0).map((r) => r.key);
  const seen = new Set<string>();
  const items: FeedItem[] = [];
  for (const r of results) for (const it of r.items) { if (!seen.has(it.url)) { seen.add(it.url); items.push(it); } }
  return { items, failed };
}
