import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getTraffic } from '@/lib/cloudflare-analytics';

export const dynamic = 'force-dynamic';

/**
 * Everything the Analytics page needs in one call.
 *   ?days=30   window for the funnel / activity / traffic sections
 */
export async function GET(req: NextRequest) {
  try {
    const days = Math.min(365, Math.max(7, Number(req.nextUrl.searchParams.get('days')) || 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const supabase = createAdminClient();

    const [{ data: estimates }, { data: events }, trafficRes] = await Promise.all([
      supabase.from('estimates')
        .select('id, estimate_number, project_name, division, status, total, created_at, sent_at, first_viewed_at, last_viewed_at, view_count, pdf_count, signed_at, accepted_at, declined_at, customer:customers(first_name, last_name, company_name)')
        .not('status', 'eq', 'draft')
        .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString()),
      supabase.from('document_events')
        .select('doc_type, doc_id, event, internal, visitor_id, device_type, os, browser, city, region, meta, created_at')
        .eq('internal', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000),
      getTraffic(days),
    ]);

    const all = estimates || [];
    const sentIn = all.filter((e) => (e.sent_at || e.created_at) >= since);

    /* ── Funnel: sent → opened → PDF → signed ─────────────────────── */
    const funnelOf = (list: any[]) => {
      const sent = list.length;
      const opened = list.filter((e) => e.first_viewed_at || ['viewed', 'accepted'].includes(e.status) || e.signed_at).length;
      const pdf = list.filter((e) => (e.pdf_count || 0) > 0).length;
      const signed = list.filter((e) => e.signed_at || e.status === 'accepted').length;
      const declined = list.filter((e) => e.status === 'declined' || e.declined_at).length;
      const value_sent = list.reduce((s, e) => s + (Number(e.total) || 0), 0);
      const value_signed = list.filter((e) => e.signed_at || e.status === 'accepted').reduce((s, e) => s + (Number(e.total) || 0), 0);
      const hours = (a?: string | null, b?: string | null) => (a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 3600000 : null);
      const med = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null && x >= 0).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
      return {
        sent, opened, pdf, signed, declined, value_sent, value_signed,
        median_hours_to_open: med(list.map((e) => hours(e.sent_at || e.created_at, e.first_viewed_at))),
        median_hours_to_sign: med(list.map((e) => hours(e.first_viewed_at || e.sent_at, e.signed_at || e.accepted_at))),
      };
    };
    const divisions = Array.from(new Set(sentIn.map((e) => e.division || 'other')));
    const funnel = {
      all: funnelOf(sentIn),
      by_division: Object.fromEntries(divisions.map((d) => [d, funnelOf(sentIn.filter((e) => (e.division || 'other') === d))])),
    };

    /* ── Needs attention ───────────────────────────────────────────── */
    const now = Date.now();
    const openStatuses = ['sent', 'viewed', 'revised'];
    const stale = all
      .filter((e) => openStatuses.includes(e.status) && !e.signed_at)
      .map((e) => ({
        id: e.id, estimate_number: e.estimate_number, project_name: e.project_name, division: e.division, total: e.total,
        customer: e.customer, sent_at: e.sent_at || e.created_at, last_viewed_at: e.last_viewed_at, view_count: e.view_count || 0,
        days_since_sent: Math.floor((now - new Date(e.sent_at || e.created_at).getTime()) / 86400000),
        days_since_view: e.last_viewed_at ? Math.floor((now - new Date(e.last_viewed_at).getTime()) / 86400000) : null,
      }))
      .filter((e) => e.days_since_sent >= 3)
      .sort((a, b) => b.days_since_sent - a.days_since_sent)
      .slice(0, 20);

    /* ── Document activity (customer only) ─────────────────────────── */
    const ev = events || [];
    const byDay: Record<string, { views: number; pdfs: number }> = {};
    for (let i = days - 1; i >= 0; i--) byDay[new Date(now - i * 86400000).toISOString().slice(0, 10)] = { views: 0, pdfs: 0 };
    const deviceShare: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const hours = new Array(24).fill(0);
    let seconds = 0, timed = 0;
    for (const e of ev) {
      const day = e.created_at.slice(0, 10);
      if (e.event === 'link_view') {
        if (byDay[day]) byDay[day].views++;
        deviceShare[e.device_type || 'Unknown'] = (deviceShare[e.device_type || 'Unknown'] || 0) + 1;
        const c = [e.city, e.region].filter(Boolean).join(', '); if (c) cities[c] = (cities[c] || 0) + 1;
        hours[new Date(e.created_at).getUTCHours()]++;
      }
      if (e.event === 'pdf_view' || e.event === 'pdf_download') { if (byDay[day]) byDay[day].pdfs++; }
      if (e.event === 'time_on_page') { seconds += Number(e.meta?.seconds) || 0; timed++; }
    }
    const activity = {
      views: ev.filter((e) => e.event === 'link_view').length,
      pdf_views: ev.filter((e) => e.event === 'pdf_view').length,
      pdf_downloads: ev.filter((e) => e.event === 'pdf_download').length,
      signed: ev.filter((e) => e.event === 'signed').length,
      messages: ev.filter((e) => e.event === 'message_sent').length,
      unique_visitors: new Set(ev.filter((e) => e.event === 'link_view').map((e) => e.visitor_id || e.doc_id)).size,
      avg_seconds: timed ? Math.round(seconds / timed) : null,
      reached_total_rate: (() => { const docs = new Set(ev.filter((e) => e.event === 'link_view').map((e) => e.doc_id)); const hit = new Set(ev.filter((e) => e.event === 'section_seen' && e.meta?.section === 'total').map((e) => e.doc_id)); return docs.size ? Math.round((Array.from(docs).filter((d) => hit.has(d)).length / docs.size) * 100) : null; })(),
      by_day: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
      devices: Object.entries(deviceShare).map(([device, n]) => ({ device, views: n })).sort((a, b) => b.views - a.views),
      cities: Object.entries(cities).map(([city, n]) => ({ city, views: n })).sort((a, b) => b.views - a.views).slice(0, 8),
      hours_utc: hours,
    };

    return NextResponse.json({ days, since, funnel, stale, activity, traffic: trafficRes });
  } catch (err) {
    console.error('[analytics] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
