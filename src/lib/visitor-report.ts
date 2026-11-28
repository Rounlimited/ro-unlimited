/**
 * "Who looked at the website since …" in plain words, for the assistant.
 * Reads the visitor log (site_visitors + site_pageviews) and writes one block
 * per real visitor: when, where the connection shows, what device, how they
 * arrived, and every page with time and scroll depth. Staff and robots are
 * counted but not listed. Read only.
 */

const TZ = 'America/New_York';

/** A time with no zone on it means Eastern (JR says "yesterday at 11"). */
export function parseEastern(v: unknown): Date | null {
  const s = String(v || '').trim();
  if (!s) return null;
  if (/[zZ]$|[+-]\d\d:?\d\d$/.test(s)) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
  const m = s.match(/^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d?):(\d\d))?/);
  if (!m) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  // what Eastern clock shows at that instant, to find the offset for that date
  const shown = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: TZ }));
  const asIfLocal = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(asUtc + (asIfLocal.getTime() - shown.getTime()));
}

const when = (d: string) => new Date(d).toLocaleString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const clock = (d: string) => new Date(d).toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dur = (ms: number) => { const s = Math.round((ms || 0) / 1000); return s < 60 ? `${s} sec` : `${Math.floor(s / 60)} min ${s % 60} sec`; };

function deviceWords(p: any): string {
  const phone = p.device_type === 'Phone';
  let d = phone ? (p.os === 'iOS' ? 'iPhone' : p.os === 'Android' ? 'Android phone' : 'phone') : p.device_type === 'Tablet' ? 'tablet' : `${p.os || ''} computer`.trim();
  // 384x832 is the screen every recent Samsung Galaxy S reports
  if (phone && p.os === 'Android' && /^(384x8(32|54)|360x7(80|40)|412x9(15|14))$/.test(p.screen || '') && p.screen.startsWith('384')) d = 'Android phone (Samsung-sized screen)';
  return [d, p.browser && p.browser !== 'Unknown' ? p.browser : '', p.screen ? `screen ${p.screen}` : ''].filter(Boolean).join(', ');
}
function connectionWords(p: any): string {
  const t = p.network_type;
  const kind = t === 'mobile' ? 'cell data' : t === 'residential' ? 'home internet' : t === 'hosting' ? 'data center' : t === 'vpn' ? 'VPN' : t === 'business' ? 'business network' : 'unknown network';
  return `${p.network || 'unknown provider'} (${kind})`;
}

export async function visitorReport(supabase: any, sinceIn: unknown, untilIn?: unknown, includeUnsure = true): Promise<string> {
  const since = parseEastern(sinceIn) || new Date(Date.now() - 24 * 3600e3);
  const until = parseEastern(untilIn) || new Date();
  if (until.getTime() - since.getTime() > 31 * 86400e3) return 'That window is too long. Ask for 31 days or less.';
  const { data: pvs, error } = await supabase.from('site_pageviews')
    .select('visitor_id, created_at, path, source, referrer, visible_ms, max_scroll, interactions, clicks, city, region, country, network, network_type, device_type, os, browser, screen')
    .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()).order('created_at', { ascending: true }).limit(4000);
  if (error) return `Could not read the visitor log: ${error.message}`;
  const list: any[] = pvs || [];
  const ids = Array.from(new Set(list.map((p) => p.visitor_id)));
  const V: Record<string, any> = {};
  for (let i = 0; i < ids.length; i += 150) {
    const { data } = await supabase.from('site_visitors').select('visitor_id, verdict, reasons, known_name, is_staff, staff_email, first_seen, email_message_id').in('visitor_id', ids.slice(i, i + 150));
    for (const v of data || []) V[v.visitor_id] = v;
  }
  const by: Record<string, any[]> = {};
  for (const p of list) (by[p.visitor_id] ||= []).push(p);

  let robots = 0; const staff: string[] = []; const people: string[] = []; const unsure: string[] = [];
  for (const id of ids) {
    const v = V[id] || {}; const L = by[id]; const f = L[0];
    if (v.verdict === 'robot') { robots++; continue; }
    const total = L.reduce((n, p) => n + (p.visible_ms || 0), 0);
    const pages = L.map((p) => {
      const taps = Array.isArray(p.clicks) ? p.clicks.filter((c: string) => c && c.trim()).slice(0, 6) : [];
      return `   ${clock(p.created_at)}  ${p.path}  (${dur(p.visible_ms)}, scrolled ${p.max_scroll || 0}%)${taps.length ? `  tapped: ${taps.join('; ')}` : ''}`;
    });
    const head = `${when(f.created_at)} | shows as ${[f.city, f.region].filter(Boolean).join(', ') || f.country || 'unknown place'} | ${connectionWords(f)} | ${deviceWords(f)} | arrived by: ${f.source || 'unknown'}`;
    const extra = [
      v.known_name ? `This device has opened an estimate or invoice link before: ${v.known_name}.` : '',
      v.first_seen && new Date(v.first_seen).getTime() < since.getTime() - 3600e3 ? `Has been on the site before (first seen ${when(v.first_seen)}).` : 'First time this device has been on the site.',
      `${L.length} page${L.length === 1 ? '' : 's'}, ${dur(total)} of actual reading.`,
    ].filter(Boolean).join(' ');
    const block = `${head}\n   ${extra}\n${pages.slice(0, 25).join('\n')}`;
    if (v.verdict === 'staff' || v.is_staff) staff.push(`${when(f.created_at)}: ${v.staff_email || 'staff'}${Array.isArray(v.reasons) && /marked by hand/.test(v.reasons.join(' ')) ? ` (${v.reasons[0]})` : ''}, ${deviceWords(f)}, shows as ${[f.city, f.region].filter(Boolean).join(', ')} on ${f.network || 'unknown'}`);
    else if (v.verdict === 'unsure') unsure.push(block);
    else people.push(block);
  }

  const out: string[] = [];
  out.push(`Website visitors from ${when(since.toISOString())} to ${when(until.toISOString())} (Eastern time).`);
  out.push(`Real people: ${people.length}. Not sure: ${unsure.length}. Staff devices (not customers): ${staff.length}. Robots left out: ${robots}.`);
  out.push('');
  out.push(people.length ? 'REAL PEOPLE\n' + people.map((b, i) => `${i + 1}. ${b}`).join('\n\n') : 'REAL PEOPLE: none in this window.');
  if (includeUnsure && unsure.length) out.push('\nNOT SURE (usually robots: no scrolling, a few seconds, foreign or business networks)\n' + unsure.slice(0, 8).map((b, i) => `${i + 1}. ${b}`).join('\n\n'));
  if (staff.length) out.push('\nSTAFF DEVICES (leave these out when looking for a customer)\n' + staff.slice(0, 12).map((s) => ' - ' + s).join('\n'));
  out.push(`
HOW TO READ THIS (use these when answering)
- The place is where the internet connection shows, not where the person stands. Home internet is usually within a town or two: Spectrum/Charter customers in Easley, Pickens or Powdersville often show as Greenville or Anderson.
- Cell data is far off: a phone on Verizon, AT&T or T-Mobile in upstate SC often shows as Charlotte or Atlanta. So a cell-data visit from Charlotte or Atlanta can be a local person.
- "Typed in / bookmark / app" means they typed the address or tapped it from a text message or a business card QR code. Someone handed a business card arrives this way. "Google search" means they searched, so that is less likely to be the person holding the card.
- "Email from RO" means they tapped a link in an email sent from the inbox.
- A visit of a few seconds with 0% scroll is a bounce. Reading several pages for a minute or more is real interest.
- This log cannot name a person. It can only narrow it down by time, place, connection, device and how they arrived. Say which visit fits best and why, and say plainly when none fits.
- If nobody fits, the person has not looked at the site yet. That is not the website losing them.`);
  return out.join('\n');
}
