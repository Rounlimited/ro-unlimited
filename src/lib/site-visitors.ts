import { createAdminClient } from '@/lib/supabase/server';

/**
 * Website visitor log: who is on rounlimited.com, and is it a person.
 *
 * Every page view on the public site is recorded by a small script in the
 * page (SiteVisitorBeacon). Robots that only fetch the raw page never run
 * scripts, so most of them never appear here at all; the ones that do are
 * judged by the signals below.
 *
 * Verdicts: staff (signed in to the admin on this device, ever), person,
 * likely_person, unsure, robot. Each comes with the reasons, in plain words.
 */

export type Verdict = 'staff' | 'person' | 'likely_person' | 'unsure' | 'robot';

// ── Who owns the internet address ─────────────────────────────────
const HOSTING = /amazon|aws|google cloud|google llc|microsoft|azure|digitalocean|ovh|hetzner|leaseweb|linode|akamai|vultr|choopa|tencent|alibaba|aliyun|oracle|contabo|scaleway|hostinger|godaddy|ionos|cloudflare|fastly|m247|datacamp|data ?center|datacenter|hosting|host|server|cloud|vps|colo|web2objects|globalhosting|ace data|psychz|quadranet|zenlayer|cogent|hurricane electric|g-core|gcore|packet|equinix|limestone|servers|serverion|frantech|buyvm|ponynet|netcup|ubiquity|wholesale internet|nocix|clouvider|hostroyale|worldstream|stark industries|aeza|pq hosting|vdsina|selectel/i;
const MOBILE = /verizon wireless|cellco|t-mobile|tmobile|at&t mobility|att mobility|sprint|us cellular|cricket|boost|metro ?pcs|visible|mint mobile|tracfone|dish wireless/i;
const RESIDENTIAL = /comcast|xfinity|charter|spectrum|cox|verizon|at&t|att |frontier|centurylink|lumen|windstream|optimum|altice|mediacom|suddenlink|wow|rcn|earthlink|hughes|viasat|starlink|spacex|brightspeed|ziply|tds|google fiber|metronet|wideopenwest|consolidated|cincinnati bell|hargray|wilkes|carolina|truvista|west carolina|piedmont|blue ridge|comporium|horry telephone|htc|rural|telephone coop|electric coop/i;

export function classifyNetwork(org: string | null | undefined): 'mobile' | 'residential' | 'hosting' | 'business' | null {
  if (!org) return null;
  if (MOBILE.test(org)) return 'mobile';
  if (HOSTING.test(org)) return 'hosting';
  if (RESIDENTIAL.test(org)) return 'residential';
  return 'business';
}

/** Look up (and cache) who owns an IP address. Never throws, never slow (2.5 s cap). */
export async function networkFor(ip: string, ipHash: string | null): Promise<{ org: string | null; type: string | null }> {
  if (!ip || !ipHash) return { org: null, type: null };
  const supabase = createAdminClient();
  try {
    const { data: hit } = await supabase.from('ip_networks').select('org, network_type, checked_at').eq('ip_hash', ipHash).maybeSingle();
    if (hit && Date.now() - new Date(hit.checked_at).getTime() < 30 * 86400000) return { org: hit.org, type: hit.network_type };
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const tokenQ = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : '';
    const r = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json${tokenQ}`, { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!r.ok) return { org: null, type: null };
    const d = await r.json();
    const rawOrg = String(d.org || d.asn?.name || '');
    const asn = (rawOrg.match(/^AS\d+/) || [null])[0];
    const org = rawOrg.replace(/^AS\d+\s*/, '') || null;
    // Paid ipinfo plans say outright whether it's a VPN / proxy / hosting address
    const privacy = d.privacy || {};
    let type: string | null = classifyNetwork(org);
    if (privacy.hosting) type = 'hosting';
    if (privacy.vpn || privacy.proxy || privacy.tor || privacy.relay) type = type === 'mobile' ? 'mobile' : 'vpn';
    await supabase.from('ip_networks').upsert({ ip_hash: ipHash, checked_at: new Date().toISOString(), org, asn, network_type: type, city: d.city || null, region: d.region || null, country: d.country || null }, { onConflict: 'ip_hash' });
    return { org, type };
  } catch { return { org: null, type: null }; }
}

// ── Where they came from ──────────────────────────────────────────
export function sourceOf(referrer: string | null, utm: Record<string, string> | null, fromEmail: boolean): string {
  if (fromEmail) return 'Email from RO';
  if (utm?.utm_source) return `${utm.utm_source}${utm.utm_medium ? ' / ' + utm.utm_medium : ''}`;
  if (!referrer) return 'Typed in / bookmark / app';
  let host = '';
  try { host = new URL(referrer).hostname.replace(/^www\./, ''); } catch { return 'Other site'; }
  if (/rounlimited\.com$/.test(host)) return 'Inside the site';
  if (/google\./.test(host)) return 'Google search';
  if (/bing\.com/.test(host)) return 'Bing search';
  if (/duckduckgo/.test(host)) return 'DuckDuckGo';
  if (/yahoo\./.test(host)) return 'Yahoo search';
  if (/facebook|fb\.|messenger/.test(host)) return 'Facebook';
  if (/instagram/.test(host)) return 'Instagram';
  if (/linkedin/.test(host)) return 'LinkedIn';
  if (/(^|\.)x\.com|twitter|t\.co/.test(host)) return 'X / Twitter';
  if (/mail\.|outlook|gmail/.test(host)) return 'An email';
  if (/nextdoor/.test(host)) return 'Nextdoor';
  if (/yelp/.test(host)) return 'Yelp';
  if (/chatgpt|openai|perplexity|claude|copilot|gemini/.test(host)) return 'AI assistant (' + host + ')';
  return host;
}

// ── Person or robot ───────────────────────────────────────────────
type PV = {
  created_at: string; duration_ms: number; visible_ms: number; max_scroll: number; interactions: number;
  webdriver: boolean | null; tz: string | null; lang: string | null; screen: string | null; touch: boolean | null;
  device_type: string | null; user_agent: string | null; network_type: string | null; country: string | null; region: string | null;
};
const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|selenium|lighthouse|pingdom|uptime|monitor|python|curl|wget|java\/|okhttp|go-http|preview|scan/i;
const US_TZ = /^America\/(New_York|Detroit|Indiana|Kentucky|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Boise|Menominee|North_Dakota)|^Pacific\/Honolulu|^US\//;

export function judge(pvs: PV[], staff: boolean): { verdict: Verdict; score: number; reasons: string[] } {
  if (staff) return { verdict: 'staff', score: 100, reasons: ['Signed in to the RO admin on this device'] };
  if (!pvs.length) return { verdict: 'unsure', score: 0, reasons: [] };
  const reasons: string[] = [];
  let s = 10; // ran the page's scripts at all: most robots never do
  const ua = pvs[0].user_agent || '';
  const interacted = pvs.reduce((n, p) => n + (p.interactions || 0), 0);
  const visible = pvs.reduce((n, p) => n + (p.visible_ms || 0), 0);
  const deepest = Math.max(...pvs.map((p) => p.max_scroll || 0));
  const net = pvs.find((p) => p.network_type)?.network_type || null;

  if (pvs.some((p) => p.webdriver)) { s -= 80; reasons.push('Browser says it is being driven by automation software'); }
  if (BOT_UA.test(ua)) { s -= 70; reasons.push('Browser name says it is a robot or monitor'); }
  if (net === 'hosting') { s -= 35; reasons.push('Internet address belongs to a data center, not a home or phone'); }
  if (net === 'vpn') { s -= 10; reasons.push('Using a VPN or privacy relay'); }
  if (net === 'mobile') { s += 25; reasons.push('On a cell phone network'); }
  if (net === 'residential') { s += 20; reasons.push('On a home internet provider'); }
  if (net === 'business') { s += 5; reasons.push('On a business network'); }

  if (interacted >= 3) { s += 35; reasons.push(`Touched, scrolled or moved the mouse (${interacted} times)`); }
  else if (interacted > 0) { s += 15; reasons.push('Some scrolling or touching'); }
  else { s -= 15; reasons.push('Never scrolled, touched or moved the mouse'); }
  if (deepest >= 40) { s += 10; reasons.push(`Scrolled ${deepest}% down a page`); }
  if (visible >= 20000) { s += 15; reasons.push(`Spent ${Math.round(visible / 1000)} seconds looking`); }
  else if (visible < 3000) { s -= 10; reasons.push('Left within 3 seconds'); }

  // Many pages in a few seconds: a script walking the menu, not a reader
  if (pvs.length >= 5) {
    const t = pvs.map((p) => new Date(p.created_at).getTime()).sort();
    const span = (t[t.length - 1] - t[0]) / 1000;
    if (span / (pvs.length - 1) < 2.5) { s -= 40; reasons.push(`Opened ${pvs.length} pages ${Math.round(span)} seconds apart — faster than anyone reads`); }
  }
  const tz = pvs.find((p) => p.tz)?.tz || '';
  if (tz && pvs[0].country === 'US' && !US_TZ.test(tz)) { s -= 20; reasons.push(`Clock set to ${tz} but the address is in the US`); }
  if (pvs.some((p) => p.screen === '0x0' || p.screen === '800x600')) { s -= 15; reasons.push('Unusual screen size (common for robots)'); }
  if (!pvs.some((p) => p.lang)) { s -= 10; reasons.push('No language set in the browser'); }

  s = Math.max(-100, Math.min(100, s));
  const verdict: Verdict = s >= 45 ? 'person' : s >= 20 ? 'likely_person' : s <= -15 ? 'robot' : 'unsure';
  return { verdict, score: s, reasons };
}
