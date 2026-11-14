import crypto from 'crypto';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { describeVisitor, looksLikeDatacenter, describeDevice, describeLocation, AUTO_OPEN_WINDOW_MS } from '@/lib/doc-events';
import { notifyTeam } from '@/lib/alerts';

/**
 * Open, click and website tracking for emails JR sends from the inbox.
 *
 * Built to stay friendly to spam filters (Gmail especially):
 *  - Every tracking address is on rounlimited.com, the same domain the mail is
 *    sent from. No third-party tracking domains, no link shorteners.
 *  - Links keep their real destination; they only pass through our own
 *    /api/t/c redirect, which answers with a plain 302.
 *  - The open pixel is one transparent 1x1 image at the very end, with an
 *    empty alt so nothing shows if images are off.
 *  - The plain-text version (sent alongside the HTML) has no tracking at all.
 *
 * What is stored in the inbox is the untracked HTML, so viewing your own sent
 * mail never counts as the customer opening it.
 */

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
const SECRET = () => process.env.EMAIL_TRACK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ro-track';
export const SITE_COOKIE = 'ro_em';

export const newTrackToken = () => crypto.randomBytes(12).toString('hex');
const sign = (token: string, url: string) => crypto.createHmac('sha256', SECRET()).update(token + '|' + url).digest('hex').slice(0, 16);
export const validSig = (token: string, url: string, sig: string) => {
  const want = Buffer.from(sign(token, url)); const got = Buffer.from(String(sig || ''));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
};

/** Route every web link through our redirect and add the open pixel. */
export function instrumentHtml(html: string, token: string): string {
  const out = html.replace(/(<a\b[^>]*?\bhref\s*=\s*)(["'])(https?:\/\/[^"']+)\2/gi, (_m, pre, q, url) => {
    const real = url.replace(/&amp;/g, '&');
    const u = Buffer.from(real).toString('base64url');
    return `${pre}${q}${SITE()}/api/t/c/${token}?u=${u}&amp;s=${sign(token, real)}${q}`;
  });
  const pixel = `<img src="${SITE()}/api/t/o/${token}.gif" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0" />`;
  return /<\/body>/i.test(out) ? out.replace(/<\/body>/i, pixel + '</body>') : out + pixel;
}

// ── What fetched it ───────────────────────────────────────────────
function mailClient(ua: string): string | null {
  if (/GoogleImageProxy|ggpht\.com/i.test(ua)) return 'Gmail';
  if (/YahooMailProxy/i.test(ua)) return 'Yahoo Mail';
  if (/Outlook|Microsoft Office|ms-office/i.test(ua)) return 'Outlook';
  if (/Thunderbird/i.test(ua)) return 'Thunderbird';
  return null;
}
const SCANNER = /bot|crawl|spider|preview|scanner|proofpoint|mimecast|barracuda|safelinks|symantec|forcepoint|zscaler|python|curl|wget|go-http|java\/|okhttp|headless|facebookexternalhit|slackbot|whatsapp|skypeuripreview|linkedinbot/i;

type Ev = 'open' | 'click' | 'site';

/** Record one event for a tracked email. Never throws. Returns the message's id if found. */
export async function recordEmailEvent(req: Request, token: string, event: Ev, url?: string | null) {
  try {
    if (!/^[a-f0-9]{24}$/.test(token)) return null;
    const supabase = createAdminClient();
    const { data: msg } = await supabase.from('email_messages')
      .select('id, created_at, to_email, subject, from_email, open_count, click_count, site_views, first_opened_at')
      .eq('track_token', token).maybeSingle();
    if (!msg) return null;

    // Someone signed in to the admin (JR looking at it himself) never counts
    try { if (await getServerUser(req as any)) return msg; } catch { /* not signed in */ }

    const v = describeVisitor(req);
    const ua = v.user_agent || '';
    const client = mailClient(ua);
    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    let why = '';
    if (event === 'open') {
      // Gmail fetches images through its proxy only when the person opens the mail, so that one is real.
      if (client === 'Gmail') why = '';
      else if (ageMs < AUTO_OPEN_WINDOW_MS) why = 'opened seconds after sending (a mail scanner or Apple Mail preloading)';
      else if (/^Mozilla\/5\.0$/.test(ua.trim()) || (!client && /AppleWebKit/.test(ua) && !/Safari|Chrome|Mobile/.test(ua))) why = 'Apple Mail privacy preload';
      else if (SCANNER.test(ua)) why = 'security scanner';
    } else {
      if (SCANNER.test(ua)) why = 'link scanner';
      else if (event === 'click' && ageMs < 60_000) why = 'clicked within a minute of sending (a link scanner)';
      else if (looksLikeDatacenter(v)) why = 'came from a data center, not a home or phone';
    }
    const automated = !!why;

    await supabase.from('email_track_events').insert({
      message_id: msg.id, event, url: url ? url.slice(0, 500) : null, automated, why: why || null,
      device_type: client ? null : v.device_type, os: client ? null : v.os, browser: client ? null : v.browser, client,
      city: client === 'Gmail' ? null : v.city, region: client === 'Gmail' ? null : v.region, country: v.country,
      ip_hash: v.ip_hash, visitor_id: null, user_agent: ua.slice(0, 300),
    });
    if (automated) return msg;

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};
    if (event === 'open') { patch.open_count = (msg.open_count || 0) + 1; patch.last_opened_at = now; if (!msg.first_opened_at) patch.first_opened_at = now; }
    if (event === 'click') { patch.click_count = (msg.click_count || 0) + 1; patch.last_clicked_at = now; }
    if (event === 'site') { patch.site_views = (msg.site_views || 0) + 1; patch.last_site_at = now; }
    await supabase.from('email_messages').update(patch).eq('id', msg.id);

    // Tell JR the first time they open it, and the first time they click through
    const firstOpen = event === 'open' && !msg.first_opened_at;
    const firstClick = event === 'click' && !msg.click_count;
    if (firstOpen || firstClick) {
      const where = [client || describeDevice(v), client === 'Gmail' ? '' : describeLocation(v)].filter(Boolean).join(', ');
      await notifyTeam({
        type: firstOpen ? 'email_opened' : 'email_clicked',
        title: firstOpen ? `${msg.to_email} opened your email` : `${msg.to_email} clicked a link in your email`,
        body: `“${msg.subject}”${firstClick && url ? ` → ${url.replace(/^https?:\/\//, '').slice(0, 80)}` : ''}${where ? ` · ${where}` : ''}`,
        url: '/admin/inbox',
        reference_id: msg.id,
      }).catch(() => {});
    }
    return msg;
  } catch (e) {
    console.error('[email-tracking] record failed', e);
    return null;
  }
}

export type TrackedEvent = { at: string; event: Ev; url: string | null; automated: boolean; why: string | null; device: string; place: string };

/** Summary + timeline for the inbox. */
export async function trackingFor(messageIds: string[]): Promise<Record<string, TrackedEvent[]>> {
  if (!messageIds.length) return {};
  const { data } = await createAdminClient().from('email_track_events')
    .select('created_at, message_id, event, url, automated, why, device_type, os, browser, client, city, region, country')
    .in('message_id', messageIds).order('created_at', { ascending: true }).limit(2000);
  const out: Record<string, TrackedEvent[]> = {};
  for (const r of data || []) {
    (out[r.message_id] ||= []).push({
      at: r.created_at, event: r.event, url: r.url, automated: r.automated, why: r.why,
      device: r.client ? r.client : describeDevice(r), place: describeLocation(r),
    });
  }
  return out;
}
