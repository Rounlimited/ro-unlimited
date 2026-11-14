import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { describeVisitor, visitorCookie } from '@/lib/doc-events';
import { networkFor, sourceOf, judge } from '@/lib/site-visitors';

export const dynamic = 'force-dynamic';

/**
 * Website visitor log intake (public). Two calls per page:
 *   { t: 'view', id, sid, path, ... }  when the page opens
 *   { t: 'end',  id, dur, vis, scroll, inter, clicks } when they leave it
 * The visitor id is the same ro_vid cookie the estimate/invoice links use, so
 * a visitor who also opened an estimate shows up with the customer's name.
 */

const s = (v: unknown, n = 300) => (typeof v === 'string' ? v.slice(0, n) : null);
const int = (v: unknown, max = 1e9) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0; };
const UUID = /^[0-9a-f-]{36}$/i;

async function refreshVisitor(vid: string) {
  const supabase = createAdminClient();
  const [{ data: v }, { data: pvs }] = await Promise.all([
    supabase.from('site_visitors').select('is_staff').eq('visitor_id', vid).maybeSingle(),
    supabase.from('site_pageviews').select('created_at, duration_ms, visible_ms, max_scroll, interactions, webdriver, tz, lang, screen, touch, device_type, user_agent, network_type, country, region, session_id')
      .eq('visitor_id', vid).order('created_at', { ascending: true }).limit(200),
  ]);
  const list = pvs || [];
  const j = judge(list as any, !!v?.is_staff);
  await supabase.from('site_visitors').update({
    pageviews: list.length,
    sessions: new Set(list.map((p: any) => p.session_id)).size || 1,
    total_ms: list.reduce((n: number, p: any) => n + (p.visible_ms || 0), 0),
    interactions: list.reduce((n: number, p: any) => n + (p.interactions || 0), 0),
    verdict: j.verdict, score: j.score, reasons: j.reasons,
  }).eq('visitor_id', vid);
}

export async function POST(req: NextRequest) {
  let b: any = {};
  try { b = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 204 }); }
  const supabase = createAdminClient();
  const existing = req.cookies.get('ro_vid')?.value;
  const vid = existing && /^[a-f0-9]{24}$/.test(existing) ? existing : (await import('crypto')).randomBytes(12).toString('hex');

  try {
    if (b.t === 'end') {
      if (!UUID.test(String(b.id || ''))) return new NextResponse(null, { status: 204 });
      await supabase.from('site_pageviews').update({
        duration_ms: int(b.dur, 6 * 3600e3), visible_ms: int(b.vis, 6 * 3600e3), max_scroll: int(b.scroll, 100), interactions: int(b.inter, 100000),
        clicks: Array.isArray(b.clicks) ? b.clicks.slice(0, 30).map((c: any) => s(c, 120)) : null,
      }).eq('id', b.id).eq('visitor_id', vid);
      await refreshVisitor(vid);
      return new NextResponse(null, { status: 204 });
    }

    if (b.t !== 'view' || !UUID.test(String(b.id || ''))) return new NextResponse(null, { status: 204 });
    const path = s(b.path, 300) || '/';
    if (path.startsWith('/admin')) return new NextResponse(null, { status: 204 });

    const v = describeVisitor(req);
    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const utm = b.utm && typeof b.utm === 'object' ? Object.fromEntries(Object.entries(b.utm).filter(([k]) => /^utm_|^gclid$|^fbclid$/.test(k)).map(([k, x]) => [k, s(x, 120)])) : null;

    // Staff: signed in to the admin on this device. Once staff, always staff.
    let staffEmail: string | null = null;
    try { const u = await getServerUser(req as any); if (u) staffEmail = u.email || 'staff'; } catch { /* not signed in */ }
    const [{ data: prior }, net] = await Promise.all([
      supabase.from('site_visitors').select('visitor_id, is_staff, email_message_id, known_name').eq('visitor_id', vid).maybeSingle(),
      networkFor(ip, v.ip_hash),
    ]);
    const isStaff = !!staffEmail || !!prior?.is_staff;

    // Arrived from a tracked email?
    let emailMsg: { id: string; to_email: string } | null = null;
    const em = req.cookies.get('ro_em')?.value;
    if (em && /^[a-f0-9]{24}$/.test(em)) {
      const { data } = await supabase.from('email_messages').select('id, to_email').eq('track_token', em).maybeSingle();
      emailMsg = data || null;
    }
    // Ever opened an estimate or invoice link on this device? Then we know who it is.
    let knownName: string | null = prior?.known_name || null;
    if (!knownName && !isStaff) {
      const { data: de } = await supabase.from('document_events').select('doc_type, doc_id').eq('visitor_id', vid).eq('internal', false).limit(1).maybeSingle();
      if (de?.doc_type === 'estimate') {
        const { data: e } = await supabase.from('estimates').select('customer:customers(first_name, last_name, company_name)').eq('id', de.doc_id).maybeSingle();
        const c: any = e?.customer; if (c) knownName = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.company_name || null;
      } else if (de?.doc_type === 'invoice') {
        const { data: i } = await supabase.from('invoices').select('customer:customers(first_name, last_name, company_name)').eq('id', de.doc_id).maybeSingle();
        const c: any = i?.customer; if (c) knownName = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.company_name || null;
      }
    }
    if (!knownName && emailMsg) knownName = emailMsg.to_email;

    const referrer = s(b.ref, 300);
    const source = sourceOf(referrer, utm as any, !!emailMsg && !referrer);
    const row = {
      id: b.id, visitor_id: vid, session_id: s(b.sid, 40), path, title: s(b.title, 200), referrer, source,
      screen: s(b.screen, 20), viewport: s(b.vp, 20), dpr: Number(b.dpr) || null, tz: s(b.tz, 60), lang: s(b.lang, 40),
      touch: !!b.touch, webdriver: !!b.wd, cores: int(b.cores, 512) || null, memory: Number(b.mem) || null, connection: s(b.conn, 20),
      device_type: v.device_type, os: v.os, browser: v.browser, user_agent: v.user_agent,
      city: v.city, region: v.region, country: v.country, latitude: v.latitude, longitude: v.longitude, postal: s(req.headers.get('cf-postal-code'), 12),
      ip_hash: v.ip_hash, network: net.org, network_type: net.type, is_staff: isStaff,
    };
    await supabase.from('site_pageviews').insert(row);
    const now = new Date().toISOString();
    if (!prior) {
      await supabase.from('site_visitors').insert({
        visitor_id: vid, first_seen: now, last_seen: now, is_staff: isStaff, staff_email: staffEmail,
        device_type: v.device_type, os: v.os, browser: v.browser, city: v.city, region: v.region, country: v.country, timezone: row.tz,
        network: net.org, network_type: net.type, first_referrer: referrer, first_source: source, first_landing: path, utm,
        email_message_id: emailMsg?.id || null, known_name: knownName, last_ip_hash: v.ip_hash,
      });
    } else {
      await supabase.from('site_visitors').update({
        last_seen: now, is_staff: isStaff, ...(staffEmail ? { staff_email: staffEmail } : {}),
        device_type: v.device_type, os: v.os, browser: v.browser, city: v.city, region: v.region, country: v.country,
        network: net.org, network_type: net.type, last_ip_hash: v.ip_hash,
        ...(emailMsg && !prior.email_message_id ? { email_message_id: emailMsg.id } : {}),
        ...(knownName && !prior.known_name ? { known_name: knownName } : {}),
      }).eq('visitor_id', vid);
    }
    await refreshVisitor(vid);
  } catch (e) {
    console.error('[visitor-log]', e);
  }
  const res = new NextResponse(null, { status: 204 });
  if (!existing || existing !== vid) res.headers.append('Set-Cookie', visitorCookie(vid));
  return res;
}
