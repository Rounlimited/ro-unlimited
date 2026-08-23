'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Eye, Download, FileSignature, Smartphone, Monitor, Tablet, MapPin, Globe, RefreshCw,
  AlertTriangle, ArrowRight, MessageSquare, Mail, Phone, PlayCircle, ExternalLink,
  MousePointerClick, Lightbulb, CheckCircle2, Info, DollarSign, BarChart3,
} from 'lucide-react';
import { eventSentence, deviceLabel, locationLabel, timeAgo, fmtSeconds } from '@/lib/doc-events-summary';
import { computeInsights, type Insight } from '@/lib/analytics-insights';

/* ─── Types (mirror /api/admin/analytics) ───────────────────────── */
interface Funnel { sent: number; opened: number; pdf: number; signed: number; declined: number; value_sent: number; value_signed: number; median_hours_to_open: number | null; median_hours_to_sign: number | null }
interface Stale { id: string; estimate_number: string; project_name: string | null; division: string | null; total: number; customer: any; sent_at: string; last_viewed_at: string | null; view_count: number; days_since_sent: number; days_since_view: number | null }
interface Activity { views: number; pdf_views: number; pdf_downloads: number; signed: number; messages: number; unique_visitors: number; avg_seconds: number | null; reached_total_rate: number | null; by_day: { date: string; views: number; pdfs: number }[]; devices: { device: string; views: number }[]; cities: { city: string; views: number }[]; hours_utc: number[] }
interface Traffic { available: boolean; error?: string; days: { date: string; page_views: number; visits: number }[]; top_pages: { path: string; page_views: number; visits: number }[]; referrers: { host: string; visits: number }[]; countries: { country: string; visits: number }[]; devices: { device: string; visits: number }[]; browsers: { browser: string; visits: number }[]; totals: { page_views: number; visits: number; requests: number; uniques: number } }
interface Posthog { available: boolean; error?: string; project_url: string; totals: { visitors: number; page_views: number; sessions: number; avg_scroll_pct: number | null; avg_seconds_on_page: number | null }; days: { date: string; visitors: number; page_views: number }[]; conversions: { event: string; label: string; count: number; people: number }[]; funnel: { visitors: number; service_page: number; contact_page: number; converted: number }; top_pages: { path: string; page_views: number; visitors: number }[]; entry_pages: { path: string; sessions: number }[]; referrers: { host: string; visitors: number }[]; utm_sources: { source: string; visitors: number }[]; devices: { device: string; visitors: number }[]; browsers: { browser: string; visitors: number }[]; recordings: { id: string; start: string; seconds: number; start_url: string | null; clicks: number; url: string }[] }
interface Data { days: number; funnel: { all: Funnel; by_division: Record<string, Funnel> }; stale: Stale[]; activity: Activity; traffic: Traffic }
interface FeedEvent { id: string; doc_type: string; doc_id: string; event: string; device_type: string | null; os: string | null; browser: string | null; city: string | null; region: string | null; country: string | null; meta: any; created_at: string; doc: { number: string; project_name?: string; division?: string; customer?: any } | null }

/* ─── Section identities — one color per section, used consistently ── */
const SECTIONS = {
  estimates: { color: '#C9A84C', name: 'Estimates & Money' },
  activity: { color: '#D4772C', name: 'Customer Activity' },
  website: { color: '#3b8dd4', name: 'Website Traffic' },
  behaviour: { color: '#2dbfa0', name: 'Visitor Behaviour' },
} as const;

const DIVISION_LABEL: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', utilities: 'Utilities', grading: 'Grading', concrete: 'Concrete', other: 'Other' };
const fmtMoney = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmtHours = (h: number | null) => h == null ? '—' : h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h)} hr` : `${Math.round(h / 24)} days`;

const AUTO_REFRESH_MS = 2 * 60 * 1000; // keep the page current while it's open

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [posthog, setPosthog] = useState<Posthog | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inflight = useRef(false);

  const load = async (d = days, quiet = false) => {
    if (inflight.current) return; inflight.current = true;
    if (!quiet) { setLoading(true); setErr(null); setPosthog(null); }
    // PostHog is the slow one — let the rest of the page paint first.
    fetch(`/api/admin/analytics?days=${d}&section=posthog`, { cache: 'no-store' }).then((r) => r.json()).then((p) => setPosthog(p.posthog || null)).catch(() => { if (!quiet) setPosthog(null); });
    try {
      const [a, f] = await Promise.all([
        fetch(`/api/admin/analytics?days=${d}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/document-events?limit=30', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (a.error) throw new Error(a.error);
      setData(a); setFeed(f.events || []); setUpdatedAt(new Date());
    } catch (e: any) { if (!quiet) setErr(e?.message || 'Could not load analytics'); }
    finally { setLoading(false); inflight.current = false; }
  };

  useEffect(() => { load(days); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  // Live: refresh quietly on an interval and whenever the app comes back to the front.
  useEffect(() => {
    const tick = setInterval(() => { if (document.visibilityState === 'visible') load(days, true); }, AUTO_REFRESH_MS);
    const onVis = () => { if (document.visibilityState === 'visible' && updatedAt && Date.now() - updatedAt.getTime() > 60000) load(days, true); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, updatedAt]);

  const insights = useMemo(() => (data ? computeInsights(data, posthog) : []), [data, posthog]);
  const hero = insights.slice(0, 4);
  const forSection = (s: Insight['section']) => insights.filter((i) => i.section === s && !hero.includes(i)).slice(0, 2);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Analytics" subtitle="What's working" backHref="/admin" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-16">

        {/* ── Page header: range + refresh ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center"><BarChart3 size={20} className="text-[#C9A84C]" /></div>
            <div>
              <h2 className="text-[20px] font-bold leading-tight">Analytics</h2>
              <p className="text-[13px] text-white/35">{updatedAt ? `Live · updated ${timeAgo(updatedAt.toISOString())} · refreshes itself` : 'How estimates, customers and the website are doing'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              {[7, 30, 90].map((d) => (
                <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 text-[14px] font-semibold ${days === d ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-white/40 hover:text-white/70'}`}>{d}d</button>
              ))}
            </div>
            <button onClick={() => load(days)} className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70" title="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[14px] text-red-300">{err}</div>}
        {!data && loading && <div className="text-[14px] text-white/30 py-14 text-center">Loading…</div>}

        {data && (
          <>
            {/* ══ WHAT'S HAPPENING — the read-me-first strip ══ */}
            {hero.length > 0 && (
              <section className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-b from-[#C9A84C]/[0.07] to-transparent p-5">
                <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, #D4772C, transparent)' }} />
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-[#C9A84C]" />
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#C9A84C]">What's happening</h3>
                  <span className="text-[12px] text-white/30">last {data.days} days, in plain English</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {hero.map((i) => <InsightRow key={i.id} insight={i} big />)}
                </div>
              </section>
            )}

            {/* ══ 1 · ESTIMATES & MONEY (gold) ══ */}
            <Section id="estimates" kicker="Section 1" title="Estimates & Money" sub="Are estimates turning into signed work?" icon={<DollarSign size={18} />} insights={forSection('estimates')}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Tile color={SECTIONS.estimates.color} label="Sent" value={data.funnel.all.sent} sub={fmtMoney(data.funnel.all.value_sent)} />
                <Tile color={SECTIONS.estimates.color} label="Opened" value={data.funnel.all.opened} sub={`${pct(data.funnel.all.opened, data.funnel.all.sent)}% of sent`} />
                <Tile color={SECTIONS.estimates.color} label="Signed" value={data.funnel.all.signed} sub={fmtMoney(data.funnel.all.value_signed)} accent />
                <Tile color={SECTIONS.estimates.color} label="Sent → opened" value={fmtHours(data.funnel.all.median_hours_to_open)} sub="typical wait" />
              </div>

              <ChartTitle>The journey of an estimate</ChartTitle>
              <FunnelBars f={data.funnel.all} color={SECTIONS.estimates.color} />

              {Object.keys(data.funnel.by_division).length > 1 && (
                <div className="overflow-x-auto mt-6 -mx-5 px-5">
                  <ChartTitle>By division</ChartTitle>
                  <table className="w-full text-[14px] min-w-[540px]">
                    <thead>
                      <tr className="text-[12px] uppercase tracking-wide text-white/30 border-b border-white/5">
                        <th className="text-left py-2.5 font-semibold">Division</th>
                        <th className="text-right py-2.5 font-semibold">Sent</th><th className="text-right py-2.5 font-semibold">Opened</th>
                        <th className="text-right py-2.5 font-semibold">Signed</th><th className="text-right py-2.5 font-semibold">Sign rate</th>
                        <th className="text-right py-2.5 font-semibold">Value signed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.funnel.by_division).sort((a, b) => b[1].sent - a[1].sent).map(([div, f]) => (
                        <tr key={div} className="border-b border-white/5">
                          <td className="py-2.5 text-white/85 font-semibold">{DIVISION_LABEL[div] || div}</td>
                          <td className="py-2.5 text-right tabular-nums text-white/60">{f.sent}</td>
                          <td className="py-2.5 text-right tabular-nums text-white/60">{f.opened}</td>
                          <td className="py-2.5 text-right tabular-nums text-white/85">{f.signed}</td>
                          <td className="py-2.5 text-right tabular-nums font-semibold" style={{ color: SECTIONS.estimates.color }}>{pct(f.signed, f.sent)}%</td>
                          <td className="py-2.5 text-right tabular-nums text-white/60">{fmtMoney(f.value_signed)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Needs a follow-up lives with the money — it IS the action list */}
              <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
                <h4 className="text-[14px] font-bold text-amber-300 flex items-center gap-2 mb-1"><AlertTriangle size={15} /> Needs a follow-up</h4>
                <p className="text-[13px] text-white/35 mb-2">Open estimates, oldest first. Tap one to open it.</p>
                {data.stale.length === 0 ? <p className="text-[14px] text-white/40 py-2">Nothing waiting — every open estimate is under 3 days old.</p> : (
                  <div className="divide-y divide-white/5">
                    {data.stale.map((s) => {
                      const who = s.customer ? (s.customer.company_name || [s.customer.first_name, s.customer.last_name].filter(Boolean).join(' ')) : '';
                      const neverOpened = !s.view_count;
                      return (
                        <Link key={s.id} href={`/admin/estimates/${s.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[15px] font-bold text-[#C9A84C]">{s.estimate_number}</span>
                              <span className="text-[14px] text-white/75 truncate">{(s.project_name || who || '').trim()}</span>
                              <span className={`text-[12px] px-2 py-0.5 rounded-full border font-medium ${neverOpened ? 'border-red-400/40 text-red-300 bg-red-400/10' : 'border-white/10 text-white/45'}`}>{neverOpened ? 'never opened' : `opened ${s.view_count}× · last ${timeAgo(s.last_viewed_at)}`}</span>
                            </div>
                            <div className="text-[13px] text-white/35 mt-0.5">{who} · sent {s.days_since_sent} days ago · {fmtMoney(s.total)}</div>
                          </div>
                          <ArrowRight size={16} className="text-white/25 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>

            {/* ══ 2 · CUSTOMER ACTIVITY (orange) ══ */}
            <Section id="activity" kicker="Section 2" title="Customer Activity" sub="What customers do with the estimates you send" icon={<Eye size={18} />} insights={forSection('activity')}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Tile color={SECTIONS.activity.color} label="Link opens" value={data.activity.views} sub={`${data.activity.unique_visitors} ${data.activity.unique_visitors === 1 ? 'customer' : 'customers'}`} />
                <Tile color={SECTIONS.activity.color} label="PDF" value={data.activity.pdf_views + data.activity.pdf_downloads} sub={`${data.activity.pdf_downloads} downloaded`} />
                <Tile color={SECTIONS.activity.color} label="Time reading" value={data.activity.avg_seconds != null ? fmtSeconds(data.activity.avg_seconds) : '—'} sub="per visit, average" />
                <Tile color={SECTIONS.activity.color} label="Saw the price" value={data.activity.reached_total_rate != null ? `${data.activity.reached_total_rate}%` : '—'} sub="scrolled to the total" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ChartTitle>Opens by day <Hint>staff previews don't count</Hint></ChartTitle>
                  <DayBars rows={data.activity.by_day.map((d) => ({ date: d.date, value: d.views, extra: d.pdfs }))} label="opens" extraLabel="PDF" color={SECTIONS.activity.color} />
                </div>
                <div className="space-y-5">
                  <div>
                    <ChartTitle>On what</ChartTitle>
                    <Share rows={data.activity.devices.map((d) => ({ label: d.device, value: d.views, icon: d.device === 'Phone' ? <Smartphone size={13} /> : d.device === 'Tablet' ? <Tablet size={13} /> : <Monitor size={13} /> }))} empty="No opens yet — this fills in when a customer opens an estimate" color={SECTIONS.activity.color} />
                  </div>
                  {data.activity.cities.length > 0 && (
                    <div>
                      <ChartTitle>From where</ChartTitle>
                      <div className="space-y-2">
                        {data.activity.cities.map((c) => (
                          <div key={c.city} className="flex items-center justify-between text-[14px]"><span className="flex items-center gap-1.5 text-white/65"><MapPin size={12} className="text-white/30" />{c.city}</span><span className="tabular-nums text-white/40">{c.views}</span></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live feed */}
              <div className="mt-6">
                <ChartTitle>Latest touches <Hint>every open, download, message and signature</Hint></ChartTitle>
                {feed.length === 0 ? <p className="text-[14px] text-white/35">Nothing yet — the first customer open lands here (and pings your phone).</p> : (
                  <ul className="divide-y divide-white/5">
                    {feed.slice(0, 12).map((e) => {
                      const who = e.doc?.customer ? (e.doc.customer.company_name || [e.doc.customer.first_name, e.doc.customer.last_name].filter(Boolean).join(' ')) : 'Customer';
                      const href = e.doc_type === 'estimate' ? `/admin/estimates/${e.doc_id}` : `/admin/invoices/${e.doc_id}`;
                      const Icon = e.event === 'pdf_download' ? Download : e.event === 'signed' ? FileSignature : e.event === 'message_sent' ? MessageSquare : e.event.startsWith('email_') ? Mail : Eye;
                      const loc = locationLabel(e); const dev = deviceLabel(e);
                      return (
                        <li key={e.id}>
                          <Link href={href} className="flex items-start gap-3 py-3 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg">
                            <Icon size={15} className={`mt-0.5 shrink-0 ${e.event === 'signed' ? 'text-emerald-400' : e.event === 'pdf_download' ? 'text-sky-300' : 'text-[#D4772C]'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[14.5px] text-white/85"><span className="font-semibold">{who}</span> · {eventSentence(e as any).toLowerCase()} <span className="font-semibold" style={{ color: SECTIONS.activity.color }}>{e.doc?.number}</span></div>
                              <div className="text-[12.5px] text-white/35 mt-0.5">{[dev, loc].filter(Boolean).join(' · ')}</div>
                            </div>
                            <span className="text-[12px] text-white/35 shrink-0 tabular-nums">{timeAgo(e.created_at)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Section>

            {/* ══ 3 · WEBSITE TRAFFIC (blue) ══ */}
            <Section id="website" kicker="Section 3" title="Website Traffic" sub="Who's finding rounlimited.com, and what they read" icon={<Globe size={18} />} insights={forSection('website')}>
              {!data.traffic.available ? (
                <p className="text-[14px] text-white/35">{data.traffic.error || 'Not connected yet.'}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <Tile color={SECTIONS.website.color} label="Visits" value={data.traffic.totals.visits.toLocaleString()} sub="real people, bots removed" />
                    <Tile color={SECTIONS.website.color} label="Pages read" value={data.traffic.totals.page_views.toLocaleString()} />
                    <Tile color={SECTIONS.website.color} label="Top device" value={data.traffic.devices[0]?.device === 'mobile' ? 'Phone' : (data.traffic.devices[0]?.device || '—')} sub={data.traffic.devices[0] ? `${pct(data.traffic.devices[0].visits, data.traffic.devices.reduce((s, d) => s + d.visits, 0))}% of visits` : undefined} />
                    <Tile color={SECTIONS.website.color} label="From Google" value={(data.traffic.referrers.find((r) => /google/i.test(r.host))?.visits || 0).toLocaleString()} sub="rest is direct / shared links" />
                  </div>
                  <ChartTitle>Visits by day</ChartTitle>
                  <DayBars rows={data.traffic.days.map((d) => ({ date: d.date, value: d.visits, extra: d.page_views }))} label="visits" extraLabel="page views" color={SECTIONS.website.color} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    <div>
                      <ChartTitle>Most-read pages</ChartTitle>
                      <Share rows={data.traffic.top_pages.slice(0, 8).map((p) => ({ label: p.path === '/' ? 'Home page' : p.path.replace(/^\//, '').replace(/-/g, ' '), value: p.visits }))} empty="No page data yet" color={SECTIONS.website.color} />
                    </div>
                    <div>
                      <ChartTitle>Came from</ChartTitle>
                      <Share rows={data.traffic.referrers.map((r) => ({ label: r.host, value: r.visits }))} empty="All direct — people typed it in or tapped a shared link" color={SECTIONS.website.color} />
                    </div>
                  </div>
                </>
              )}
            </Section>

            {/* ══ 4 · VISITOR BEHAVIOUR (teal) ══ */}
            <Section id="behaviour" kicker="Section 4" title="Visitor Behaviour" sub="What visitors actually do — who calls, who fills the form" icon={<MousePointerClick size={18} />} insights={forSection('behaviour')}>
              {!posthog ? (
                <p className="text-[14px] text-white/35 animate-pulse">Crunching visitor behaviour…</p>
              ) : !posthog.available ? (
                <p className="text-[14px] text-white/35">{posthog.error || 'Not connected yet.'}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <Tile color={SECTIONS.behaviour.color} label="Visitors" value={posthog.totals.visitors.toLocaleString()} sub={`${posthog.totals.sessions.toLocaleString()} visits`} />
                    <Tile color={SECTIONS.behaviour.color} label="Tapped call / text / email" value={posthog.conversions.filter((c) => c.event !== 'contact_form_submitted').reduce((s, c) => s + c.people, 0)} sub="people" accent />
                    <Tile color={SECTIONS.behaviour.color} label="Contact forms" value={posthog.conversions.find((c) => c.event === 'contact_form_submitted')?.count || 0} />
                    <Tile color={SECTIONS.behaviour.color} label="Read depth" value={posthog.totals.avg_scroll_pct != null ? `${posthog.totals.avg_scroll_pct}%` : '—'} sub="of a page, average" />
                  </div>

                  <ChartTitle>From visit to reaching out</ChartTitle>
                  <div className="space-y-2.5 mb-6">
                    {[
                      { label: 'Visited the site', n: posthog.funnel.visitors },
                      { label: 'Read a service page', n: posthog.funnel.service_page },
                      { label: 'Reached the contact page', n: posthog.funnel.contact_page },
                      { label: 'Called / wrote', n: posthog.funnel.converted },
                    ].map((st, i, arr) => (
                      <div key={st.label} className="grid grid-cols-[170px_1fr_auto] items-center gap-3 text-[14.5px]">
                        <span className="text-white/65">{st.label}</span>
                        <div className="h-6 rounded-md bg-white/[0.04] overflow-hidden"><div className="h-full rounded-md" style={{ width: `${Math.max(st.n ? 2 : 0, (st.n / Math.max(1, arr[0].n)) * 100)}%`, background: SECTIONS.behaviour.color, opacity: 0.4 + i * 0.2, transition: 'width .4s' }} /></div>
                        <span className="tabular-nums text-white/85 font-semibold w-[90px] text-right">{st.n} <span className="text-white/35 text-[13px] font-normal">{i ? `${pct(st.n, arr[0].n)}%` : ''}</span></span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <ChartTitle>Ways people reached out</ChartTitle>
                      {posthog.conversions.length === 0 ? <p className="text-[14px] text-white/35">None yet — this counts phone taps, texts, emails and forms from the site.</p> : (
                        <div className="space-y-2">
                          {posthog.conversions.map((c) => (
                            <div key={c.event} className="flex items-center justify-between text-[14px]">
                              <span className="flex items-center gap-2 text-white/70">{c.event === 'contact_form_submitted' ? <Mail size={13} className="text-white/35" /> : <Phone size={13} className="text-white/35" />}{c.label}</span>
                              <span className="tabular-nums text-white/45">{c.count} <span className="text-white/25">· {c.people} {c.people === 1 ? 'person' : 'people'}</span></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <ChartTitle>Watch real visits</ChartTitle>
                      {posthog.recordings.length === 0 ? <p className="text-[14px] text-white/35">Screen recordings of visits appear here — like standing behind the visitor.</p> : (
                        <div className="space-y-2">
                          {posthog.recordings.slice(0, 4).map((r) => (
                            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 hover:border-white/20">
                              <PlayCircle size={18} style={{ color: SECTIONS.behaviour.color }} className="shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] text-white/85 truncate">{r.start_url ? (r.start_url.replace(/^https?:\/\/[^/]+/, '') || 'Home page') : 'Visit'}</div>
                                <div className="text-[12px] text-white/35">{timeAgo(r.start)} · {fmtSeconds(r.seconds)} · {r.clicks} taps</div>
                              </div>
                              <ExternalLink size={13} className="text-white/25 shrink-0" />
                            </a>
                          ))}
                          <a href={posthog.project_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-white/35 hover:text-white/60">All recordings in PostHog <ExternalLink size={12} /></a>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ Building blocks ═══════════════════════════════════════════ */

/** A section with its own color identity: icon chip, kicker, accent hairline, its insights. */
function Section({ id, kicker, title, sub, icon, insights, children }: { id: keyof typeof SECTIONS; kicker: string; title: string; sub: string; icon: React.ReactNode; insights: Insight[]; children: React.ReactNode }) {
  const color = SECTIONS[id].color;
  return (
    <section className="relative rounded-2xl border border-white/5 bg-[#101010] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent 70%)` }} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3.5 mb-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}35` }}>{icon}</div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color }}>{kicker}</div>
            <h3 className="text-[19px] font-bold leading-tight text-white">{title}</h3>
            <p className="text-[13.5px] text-white/40">{sub}</p>
          </div>
        </div>
        {insights.length > 0 && (
          <div className="mt-3 mb-4 space-y-2">{insights.map((i) => <InsightRow key={i.id} insight={i} />)}</div>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

function InsightRow({ insight: i, big }: { insight: Insight; big?: boolean }) {
  const Icon = i.tone === 'good' ? CheckCircle2 : i.tone === 'warn' ? AlertTriangle : Info;
  const color = i.tone === 'good' ? '#34d399' : i.tone === 'warn' ? '#fbbf24' : '#8fa3c8';
  const body = (
    <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 border ${big ? 'bg-black/25' : 'bg-white/[0.02]'}`} style={{ borderColor: `${color}30` }}>
      <Icon size={17} style={{ color }} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className={`${big ? 'text-[15.5px]' : 'text-[14.5px]'} text-white/90 leading-snug font-medium`}>{i.text}</p>
        {i.detail && <p className="text-[13px] text-white/45 leading-snug mt-0.5">{i.detail}</p>}
      </div>
      {i.href && <ArrowRight size={14} className="text-white/25 shrink-0 mt-1 ml-auto" />}
    </div>
  );
  return i.href ? <Link href={i.href} className="block hover:opacity-90">{body}</Link> : body;
}

function Tile({ label, value, sub, color, accent }: { label: string; value: string | number; sub?: string; color: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: accent ? `${color}45` : 'rgba(255,255,255,0.06)', background: accent ? `${color}10` : 'rgba(255,255,255,0.02)' }}>
      <div className="text-[12px] uppercase tracking-wide text-white/40 font-semibold">{label}</div>
      <div className="text-[30px] font-bold tabular-nums leading-tight mt-1" style={{ color: accent ? color : '#fff' }}>{value}</div>
      {sub && <div className="text-[13px] text-white/40 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[12.5px] uppercase tracking-[0.1em] text-white/40 font-bold mb-2.5 flex items-baseline gap-2">{children}</h4>;
}
function Hint({ children }: { children: React.ReactNode }) {
  return <span className="normal-case tracking-normal font-normal text-white/25 text-[12px]">{children}</span>;
}

/** Sent → Opened → PDF → Signed. One hue, darkening by stage; counts as text. */
function FunnelBars({ f, color }: { f: Funnel; color: string }) {
  const stages = [
    { label: 'Sent', n: f.sent, note: fmtMoney(f.value_sent) },
    { label: 'Opened', n: f.opened, note: `${pct(f.opened, f.sent)}%` },
    { label: 'Viewed PDF', n: f.pdf, note: `${pct(f.pdf, f.sent)}%` },
    { label: 'Signed', n: f.signed, note: `${pct(f.signed, f.sent)}% · ${fmtMoney(f.value_signed)}` },
  ];
  const max = Math.max(1, f.sent);
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => (
        <div key={s.label} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 text-[14.5px]">
          <span className="text-white/65">{s.label}</span>
          <div className="h-7 rounded-md bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded-md" style={{ width: `${Math.max(s.n ? 2 : 0, (s.n / max) * 100)}%`, background: color, opacity: 0.45 + i * 0.18, transition: 'width .4s' }} />
          </div>
          <span className="tabular-nums text-white/85 font-semibold w-[160px] text-right"><span className="text-white">{s.n}</span> <span className="text-white/35 text-[13px] font-normal">{s.note}</span></span>
        </div>
      ))}
      {f.declined > 0 && <div className="text-[13px] text-white/35 pl-[112px]">{f.declined} declined</div>}
    </div>
  );
}

/** Daily bars with a hover/touch tooltip. Single series (+ muted secondary in the tooltip). */
function DayBars({ rows, label, extraLabel, color }: { rows: { date: string; value: number; extra?: number }[]; label: string; extraLabel?: string; color: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const ticks = useMemo(() => { const n = rows.length; const step = n > 60 ? 14 : n > 20 ? 7 : 2; return rows.map((r, i) => (i % step === 0 || i === n - 1) ? r.date.slice(5).replace('-', '/') : ''); }, [rows]);
  if (!rows.length) return <p className="text-[14px] text-white/35">No data yet.</p>;
  return (
    <div>
      <div className="relative h-40 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {rows.map((r, i) => (
          <div key={r.date} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
            <div className="w-full rounded-t" style={{ height: `${Math.max(r.value ? 4 : 1.5, (r.value / max) * 100)}%`, background: r.value ? color : 'rgba(255,255,255,0.07)', opacity: hover === null || hover === i ? 1 : 0.45, transition: 'opacity .12s' }} />
          </div>
        ))}
        {hover !== null && rows[hover] && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-[#1c1c1c] border border-white/10 text-[13px] whitespace-nowrap pointer-events-none shadow-xl">
            <span className="text-white/40">{new Date(rows[hover].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="text-white font-semibold ml-2">{rows[hover].value} {label}</span>
            {extraLabel != null && rows[hover].extra != null && <span className="text-white/40 ml-2">{rows[hover].extra} {extraLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex gap-[2px] mt-1.5">
        {ticks.map((t, i) => <div key={i} className="flex-1 text-[11px] text-white/25 overflow-visible whitespace-nowrap">{t}</div>)}
      </div>
      <div className="text-[13px] text-white/35 mt-2">{total.toLocaleString()} {label} in this period</div>
    </div>
  );
}

/** Horizontal share bars — label, bar, count. */
function Share({ rows, empty, color }: { rows: { label: string; value: number; icon?: React.ReactNode }[]; empty: string; color: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length || !total) return <p className="text-[14px] text-white/35">{empty}</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="text-[14px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="flex items-center gap-2 text-white/70 truncate capitalize">{r.icon}{r.label}</span>
            <span className="tabular-nums text-white/45 shrink-0">{r.value} <span className="text-white/25">· {pct(r.value, total)}%</span></span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct(r.value, total)}%`, background: color, opacity: 0.85, transition: 'width .4s' }} /></div>
        </div>
      ))}
    </div>
  );
}
