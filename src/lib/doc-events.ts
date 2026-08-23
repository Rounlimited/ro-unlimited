import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';

/**
 * Document events — the customer-activity log behind the "👁 4 views · ⬇ 1 PDF"
 * pills, the per-estimate timeline, and JR's alerts.
 *
 * Every customer touch on a share link (estimate or invoice) lands here as one
 * row, with device, city/state, a hashed IP and a visitor id so repeat visits
 * from the same phone group together. Staff opening the link (anyone with an
 * admin session) is recorded with internal=true and never counts.
 */

export type DocType = 'estimate' | 'invoice';
export type DocEvent =
  | 'link_view' | 'pdf_view' | 'pdf_download' | 'section_seen' | 'time_on_page'
  | 'options_changed' | 'options_confirmed' | 'message_sent' | 'signed'
  | 'email_sent' | 'email_delivered' | 'email_opened' | 'email_clicked' | 'email_bounced';

export interface Visitor {
  visitor_id: string | null;
  device_type: string; os: string; browser: string;
  city: string | null; region: string | null; country: string | null;
  latitude: number | null; longitude: number | null;
  ip_hash: string | null;
  referrer: string | null;
  user_agent: string;
}

const VISITOR_COOKIE = 'ro_vid';

/* ─── Device / browser from the user agent (no dependency) ─────── */
export function parseUserAgent(ua: string): { device_type: string; os: string; browser: string } {
  const u = ua || '';
  let os = 'Unknown';
  if (/iPhone|iPad|iPod/i.test(u)) os = /iPad/i.test(u) ? 'iPadOS' : 'iOS';
  else if (/Android/i.test(u)) os = 'Android';
  else if (/Windows/i.test(u)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(u)) os = 'macOS';
  else if (/CrOS/i.test(u)) os = 'ChromeOS';
  else if (/Linux/i.test(u)) os = 'Linux';

  let browser = 'Unknown';
  if (/Edg\//i.test(u)) browser = 'Edge';
  else if (/SamsungBrowser/i.test(u)) browser = 'Samsung Internet';
  else if (/OPR\/|Opera/i.test(u)) browser = 'Opera';
  else if (/Chrome\/|CriOS/i.test(u)) browser = 'Chrome';
  else if (/Firefox\/|FxiOS/i.test(u)) browser = 'Firefox';
  else if (/Safari\//i.test(u)) browser = 'Safari';
  // In-app browsers (the link was tapped inside a messaging app)
  if (/FBAN|FBAV|Instagram/i.test(u)) browser = 'Facebook/Instagram app';
  else if (/GSA\//i.test(u)) browser = 'Google app';

  let device_type = 'Desktop';
  if (/iPad/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) device_type = 'Tablet';
  else if (/Mobi|iPhone|iPod|Android/i.test(u)) device_type = 'Phone';
  if (/iPad/i.test(u) || (/Macintosh/i.test(u) && /Mobile/i.test(u))) { device_type = 'Tablet'; os = 'iPadOS'; }

  return { device_type, os, browser };
}

/* ─── Everything we know about the requester ───────────────────── */
export function describeVisitor(req: Request, existingVisitorId?: string | null): Visitor {
  const h = req.headers;
  const ua = (h.get('user-agent') || '').slice(0, 300);
  // The site sits behind Cloudflare, so the connecting IP Vercel sees is a
  // Cloudflare edge. cf-connecting-ip is the real visitor.
  const ip = (h.get('cf-connecting-ip') || h.get('x-real-ip') || h.get('x-forwarded-for') || '').split(',')[0].trim();
  const salt = process.env.ANALYTICS_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ro';
  const dec = (v: string | null) => { if (!v) return null; try { return decodeURIComponent(v); } catch { return v; } };
  const num = (v: string | null) => { const n = v ? Number(v) : NaN; return Number.isFinite(n) ? n : null; };
  const referrer = h.get('referer') || h.get('referrer');
  // Location: Cloudflare's visitor-location headers first (enabled on the
  // zone — true client geo, down to postal code and lat/long), then Vercel's
  // own geo as a fallback for anything that bypasses the proxy.
  const cfCity = dec(h.get('cf-ipcity'));
  return {
    visitor_id: existingVisitorId || null,
    ...parseUserAgent(ua),
    city: cfCity || dec(h.get('x-vercel-ip-city')),
    region: (cfCity ? dec(h.get('cf-region-code')) : null) || dec(h.get('x-vercel-ip-country-region')),
    country: (cfCity ? dec(h.get('cf-ipcountry')) : null) || dec(h.get('x-vercel-ip-country')),
    latitude: num(h.get('cf-iplatitude')) ?? num(h.get('x-vercel-ip-latitude')),
    longitude: num(h.get('cf-iplongitude')) ?? num(h.get('x-vercel-ip-longitude')),
    ip_hash: ip ? crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 32) : null,
    referrer: referrer ? referrer.slice(0, 300) : null,
    user_agent: ua,
  };
}

/** Read the visitor cookie, minting one if absent. Returns {id, isNew}. */
export function visitorFromCookies(): { id: string; isNew: boolean } {
  try {
    const store = cookies();
    const existing = store.get(VISITOR_COOKIE)?.value;
    if (existing && /^[a-f0-9]{24}$/.test(existing)) return { id: existing, isNew: false };
  } catch { /* no cookie store in this context */ }
  return { id: crypto.randomBytes(12).toString('hex'), isNew: true };
}

/** Cookie header value to set on a response so the visitor is recognised next time. */
export function visitorCookie(id: string): string {
  return `${VISITOR_COOKIE}=${id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure; HttpOnly`;
}

export function describeDevice(v: { device_type?: string | null; os?: string | null; browser?: string | null }): string {
  return [v.device_type, v.os, v.browser].filter(Boolean).join(' · ');
}
export function describeLocation(v: { city?: string | null; region?: string | null; country?: string | null }): string {
  const parts = [v.city, v.region].filter(Boolean);
  if (!parts.length) return v.country || '';
  return v.country && v.country !== 'US' ? `${parts.join(', ')} ${v.country}` : parts.join(', ');
}

/* ─── Record ───────────────────────────────────────────────────── */
interface RecordArgs {
  req: Request;
  docType: DocType;
  doc: { id: string; estimate_number?: string; invoice_number?: string; project_name?: string | null; division?: string | null; customer?: any; status?: string | null };
  event: DocEvent;
  meta?: Record<string, unknown>;
  /** Pre-resolved visitor id (from cookie) — optional. */
  visitorId?: string | null;
  /** Force internal (e.g. the PDF is being emailed by staff). */
  internal?: boolean;
}

export interface RecordResult { internal: boolean; visitor: Visitor; isFirstView: boolean }

/**
 * Log one event. For customer (non-internal) events this also bumps the
 * document's counters and fires the alerts JR cares about. Never throws —
 * analytics must not break the customer's page.
 */
export async function recordDocumentEvent(args: RecordArgs): Promise<RecordResult> {
  const { req, docType, doc, event } = args;
  const visitor = describeVisitor(req, args.visitorId);
  let internal = !!args.internal;
  const supabase = createAdminClient();

  try {
    if (!internal) {
      // Staff with a signed-in admin session (dashboard, PWA, native app)
      const user = await getServerUser(req).catch(() => null);
      internal = !!user;
    }

    const h = req.headers;
    const geoExtra: Record<string, string> = {};
    for (const [k, name] of [['cf-postal-code', 'postal_code'], ['cf-metro-code', 'metro_code'], ['cf-timezone', 'timezone'], ['cf-region', 'region_name']] as const) {
      const v = h.get(k); if (v) geoExtra[name] = v;
    }
    await supabase.from('document_events').insert({
      doc_type: docType, doc_id: doc.id, event, internal,
      visitor_id: visitor.visitor_id,
      device_type: visitor.device_type, os: visitor.os, browser: visitor.browser,
      city: visitor.city, region: visitor.region, country: visitor.country,
      latitude: visitor.latitude, longitude: visitor.longitude,
      ip_hash: visitor.ip_hash, referrer: visitor.referrer, user_agent: visitor.user_agent,
      meta: { ...(args.meta || {}), ...(Object.keys(geoExtra).length ? { geo: geoExtra } : {}) },
    });

    if (internal) return { internal, visitor, isFirstView: false };

    const table = docType === 'estimate' ? 'estimates' : 'invoices';
    const isView = event === 'link_view';
    const isPdf = event === 'pdf_view' || event === 'pdf_download';
    let isFirstView = false;

    if (isView || isPdf) {
      const { data: cur } = await supabase.from(table)
        .select('view_count, pdf_count, first_viewed_at').eq('id', doc.id).single();
      const now = new Date().toISOString();
      isFirstView = isView && !cur?.first_viewed_at;
      const patch: Record<string, unknown> = {
        last_viewed_at: now,
        last_viewed_device: describeDevice(visitor) || null,
        last_viewed_location: describeLocation(visitor) || null,
      };
      if (isView) { patch.view_count = (cur?.view_count || 0) + 1; if (!cur?.first_viewed_at) patch.first_viewed_at = now; }
      if (isPdf) patch.pdf_count = (cur?.pdf_count || 0) + 1;
      await supabase.from(table).update(patch).eq('id', doc.id);
    }

    // ── Alerts: first open, PDF download, signature. Once each per document
    // for first-open; PDF downloads alert each time (it's a strong signal).
    const number = doc.estimate_number || doc.invoice_number || '';
    const who = doc.customer
      ? (doc.customer.company_name || [doc.customer.first_name, doc.customer.last_name].filter(Boolean).join(' ').trim())
      : '';
    const where = describeLocation(visitor);
    const device = visitor.device_type === 'Phone' ? (visitor.os === 'iOS' ? 'iPhone' : visitor.os === 'Android' ? 'Android phone' : 'phone') : visitor.device_type.toLowerCase();
    const url = docType === 'estimate' ? `/admin/estimates/${doc.id}` : `/admin/invoices/${doc.id}`;
    const label = docType === 'estimate' ? 'estimate' : 'invoice';
    const tail = [device, where].filter(Boolean).join(' in ');

    if (isFirstView) {
      await notifyTeam({
        type: `${docType}_viewed`, reference_id: doc.id, url, division: doc.division || null,
        title: `${who || 'Customer'} opened ${label} ${number}`.trim(),
        body: `First open${tail ? ' — ' + tail : ''}${doc.project_name ? ` · ${doc.project_name}` : ''}`,
        tag: `${docType}-view-${doc.id}`,
      });
    } else if (event === 'pdf_download') {
      await notifyTeam({
        type: `${docType}_pdf_downloaded`, reference_id: doc.id, url, division: doc.division || null,
        title: `${who || 'Customer'} downloaded the PDF for ${number}`.trim(),
        body: `${tail || 'Customer link'}${doc.project_name ? ` · ${doc.project_name}` : ''}`,
        tag: `${docType}-pdf-${doc.id}`,
      });
    }
    return { internal, visitor, isFirstView };
  } catch (err) {
    console.error('[doc-events] record failed:', err);
    return { internal, visitor, isFirstView: false };
  }
}
