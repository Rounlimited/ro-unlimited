'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Eye, Download, FileSignature, Clock, Smartphone, Monitor, Tablet, MapPin, Globe, RefreshCw,
  AlertTriangle, ArrowRight, MessageSquare, Users, BarChart3, Mail,
} from 'lucide-react';
import { eventSentence, deviceLabel, locationLabel, timeAgo, fmtSeconds } from '@/lib/doc-events-summary';

/* ─── Types (mirror /api/admin/analytics) ───────────────────────── */
interface Funnel { sent: number; opened: number; pdf: number; signed: number; declined: number; value_sent: number; value_signed: number; median_hours_to_open: number | null; median_hours_to_sign: number | null }
interface Stale { id: string; estimate_number: string; project_name: string | null; division: string | null; total: number; customer: any; sent_at: string; last_viewed_at: string | null; view_count: number; days_since_sent: number; days_since_view: number | null }
interface Activity { views: number; pdf_views: number; pdf_downloads: number; signed: number; messages: number; unique_visitors: number; avg_seconds: number | null; reached_total_rate: number | null; by_day: { date: string; views: number; pdfs: number }[]; devices: { device: string; views: number }[]; cities: { city: string; views: number }[]; hours_utc: number[] }
interface Traffic { available: boolean; error?: string; days: { date: string; page_views: number; visits: number }[]; top_pages: { path: string; page_views: number; visits: number }[]; referrers: { host: string; visits: number }[]; countries: { country: string; visits: number }[]; devices: { device: string; visits: number }[]; browsers: { browser: string; visits: number }[]; totals: { page_views: number; visits: number; requests: number; uniques: number } }
interface Data { days: number; funnel: { all: Funnel; by_division: Record<string, Funnel> }; stale: Stale[]; activity: Activity; traffic: Traffic }
interface FeedEvent { id: string; doc_type: string; doc_id: string; event: string; device_type: string | null; os: string | null; browser: string | null; city: string | null; region: string | null; country: string | null; meta: any; created_at: string; doc: { number: string; project_name?: string; division?: string; customer?: any } | null }

const GOLD = '#C9A84C';
const DIVISION_LABEL: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', utilities: 'Utilities', grading: 'Grading', concrete: 'Concrete', other: 'Other' };
const fmtMoney = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmtHours = (h: number | null) => h == null ? '—' : h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h)} hr` : `${Math.round(h / 24)} days`;

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async (d = days) => {
    setLoading(true); setErr(null);
    try {
      const [a, f] = await Promise.all([
        fetch(`/api/admin/analytics?days=${d}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/document-events?limit=40', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (a.error) throw new Error(a.error);
      setData(a); setFeed(f.events || []);
    } catch (e: any) { setErr(e?.message || 'Could not load analytics'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(days); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Analytics" subtitle="What's working" backHref="/admin" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Range + refresh — one row, above everything */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center"><BarChart3 size={18} className="text-[#C9A84C]" /></div>
            <div>
              <h2 className="text-[18px] font-bold">Analytics</h2>
              <p className="text-[12px] text-white/30">Customer activity on estimates, and traffic on the site</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              {[7, 30, 90].map((d) => (
                <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-[13px] font-medium ${days === d ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-white/40 hover:text-white/70'}`}>{d}d</button>
              ))}
            </div>
            <button onClick={() => load(days)} className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white/70" title="Refresh"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-300">{err}</div>}
        {!data && loading && <div className="text-[13px] text-white/30 py-10 text-center">Loading…</div>}

        {data && (
          <>
            {/* ── Headline numbers ─────────────────────────────────── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Tile icon={<Eye size={14} />} label="Link opens" value={data.activity.views} sub={`${data.activity.unique_visitors} ${data.activity.unique_visitors === 1 ? 'customer' : 'customers'}`} />
              <Tile icon={<Download size={14} />} label="PDF" value={data.activity.pdf_views + data.activity.pdf_downloads} sub={`${data.activity.pdf_downloads} downloaded`} />
              <Tile icon={<FileSignature size={14} />} label="Signed" value={data.funnel.all.signed} sub={fmtMoney(data.funnel.all.value_signed)} accent />
              <Tile icon={<Clock size={14} />} label="Avg. time reading" value={data.activity.avg_seconds != null ? fmtSeconds(data.activity.avg_seconds) : '—'} sub={data.activity.reached_total_rate != null ? `${data.activity.reached_total_rate}% saw the total` : undefined} />
            </section>

            {/* ── Funnel ───────────────────────────────────────────── */}
            <Card title="Estimate funnel" sub={`Estimates sent in the last ${data.days} days`}>
              <FunnelBars f={data.funnel.all} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[12px]">
                <Mini label="Open rate" value={`${pct(data.funnel.all.opened, data.funnel.all.sent)}%`} />
                <Mini label="Sign rate" value={`${pct(data.funnel.all.signed, data.funnel.all.sent)}%`} />
                <Mini label="Sent → first open" value={fmtHours(data.funnel.all.median_hours_to_open)} sub="median" />
                <Mini label="Open → signed" value={fmtHours(data.funnel.all.median_hours_to_sign)} sub="median" />
              </div>
              {Object.keys(data.funnel.by_division).length > 1 && (
                <div className="overflow-x-auto mt-5 -mx-5 px-5">
                  <table className="w-full text-[13px] min-w-[520px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-white/30 border-b border-white/5">
                        <th className="text-left py-2 font-medium">Division</th>
                        <th className="text-right py-2 font-medium">Sent</th><th className="text-right py-2 font-medium">Opened</th>
                        <th className="text-right py-2 font-medium">PDF</th><th className="text-right py-2 font-medium">Signed</th>
                        <th className="text-right py-2 font-medium">Sign rate</th><th className="text-right py-2 font-medium">Value signed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.funnel.by_division).sort((a, b) => b[1].sent - a[1].sent).map(([div, f]) => (
                        <tr key={div} className="border-b border-white/5">
                          <td className="py-2 text-white/80 font-medium">{DIVISION_LABEL[div] || div}</td>
                          <td className="py-2 text-right tabular-nums text-white/60">{f.sent}</td>
                          <td className="py-2 text-right tabular-nums text-white/60">{f.opened}</td>
                          <td className="py-2 text-right tabular-nums text-white/60">{f.pdf}</td>
                          <td className="py-2 text-right tabular-nums text-white/80">{f.signed}</td>
                          <td className="py-2 text-right tabular-nums text-[#C9A84C]">{pct(f.signed, f.sent)}%</td>
                          <td className="py-2 text-right tabular-nums text-white/60">{fmtMoney(f.value_signed)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* ── Activity over time + who/where ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card title="Link opens by day" sub="Customer opens (staff previews excluded)" className="lg:col-span-2">
                <DayBars rows={data.activity.by_day.map((d) => ({ date: d.date, value: d.views, extra: d.pdfs }))} label="opens" extraLabel="PDF" />
              </Card>
              <Card title="Devices & places" sub="Where customers open estimates">
                <Share rows={data.activity.devices.map((d) => ({ label: d.device, value: d.views, icon: d.device === 'Phone' ? <Smartphone size={12} /> : d.device === 'Tablet' ? <Tablet size={12} /> : <Monitor size={12} /> }))} empty="No opens yet" />
                {data.activity.cities.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {data.activity.cities.map((c) => (
                      <div key={c.city} className="flex items-center justify-between text-[12.5px]"><span className="flex items-center gap-1.5 text-white/60"><MapPin size={11} className="text-white/30" />{c.city}</span><span className="tabular-nums text-white/40">{c.views}</span></div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* ── Needs attention ──────────────────────────────────── */}
            <Card title="Needs a follow-up" sub="Open estimates, oldest first" icon={<AlertTriangle size={14} className="text-amber-400" />}>
              {data.stale.length === 0 ? <p className="text-[13px] text-white/30">Nothing waiting — every open estimate is under 3 days old.</p> : (
                <div className="divide-y divide-white/5">
                  {data.stale.map((s) => {
                    const who = s.customer ? (s.customer.company_name || [s.customer.first_name, s.customer.last_name].filter(Boolean).join(' ')) : '';
                    const neverOpened = !s.view_count;
                    return (
                      <Link key={s.id} href={`/admin/estimates/${s.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-[#C9A84C]">{s.estimate_number}</span>
                            <span className="text-[13px] text-white/70 truncate">{s.project_name || who}</span>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${neverOpened ? 'border-amber-400/30 text-amber-300' : 'border-white/10 text-white/40'}`}>{neverOpened ? 'never opened' : `opened ${s.view_count}× · last ${timeAgo(s.last_viewed_at)}`}</span>
                          </div>
                          <div className="text-[12px] text-white/30 mt-0.5">{who} · sent {s.days_since_sent} days ago · {fmtMoney(s.total)}</div>
                        </div>
                        <ArrowRight size={14} className="text-white/20 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ── Live feed ────────────────────────────────────────── */}
            <Card title="Customer activity" sub="Latest across all estimates and invoices" icon={<Users size={14} className="text-[#C9A84C]" />}>
              {feed.length === 0 ? <p className="text-[13px] text-white/30">No customer activity recorded yet.</p> : (
                <ul className="divide-y divide-white/5">
                  {feed.map((e) => {
                    const who = e.doc?.customer ? (e.doc.customer.company_name || [e.doc.customer.first_name, e.doc.customer.last_name].filter(Boolean).join(' ')) : 'Customer';
                    const href = e.doc_type === 'estimate' ? `/admin/estimates/${e.doc_id}` : `/admin/invoices/${e.doc_id}`;
                    const Icon = e.event === 'pdf_download' ? Download : e.event === 'signed' ? FileSignature : e.event === 'message_sent' ? MessageSquare : e.event.startsWith('email_') ? Mail : Eye;
                    const loc = locationLabel(e); const dev = deviceLabel(e);
                    return (
                      <li key={e.id}>
                        <Link href={href} className="flex items-start gap-3 py-2.5 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg">
                          <Icon size={14} className={`mt-0.5 shrink-0 ${e.event === 'signed' ? 'text-emerald-400' : e.event === 'pdf_download' ? 'text-sky-300' : 'text-[#C9A84C]'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] text-white/80"><span className="font-medium">{who}</span> · {eventSentence(e as any).toLowerCase()} <span className="text-[#C9A84C]">{e.doc?.number}</span></div>
                            <div className="text-[11.5px] text-white/30 mt-0.5">{[dev, loc].filter(Boolean).join(' · ')}</div>
                          </div>
                          <span className="text-[11px] text-white/30 shrink-0 tabular-nums">{timeAgo(e.created_at)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* ── Site traffic ─────────────────────────────────────── */}
            <Card title="Website traffic" sub={data.traffic.available ? `rounlimited.com · last ${data.days} days · Cloudflare` : 'Cloudflare Web Analytics'} icon={<Globe size={14} className="text-[#3b8dd4]" />}>
              {!data.traffic.available ? (
                <p className="text-[13px] text-white/30">{data.traffic.error || 'Not connected yet.'}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <Mini label="Visits" value={data.traffic.totals.visits.toLocaleString()} />
                    <Mini label="Page views" value={data.traffic.totals.page_views.toLocaleString()} />
                    <Mini label="Unique visitors" value={data.traffic.totals.uniques.toLocaleString()} sub="all requests, incl. bots" />
                    <Mini label="Top device" value={data.traffic.devices[0]?.device || '—'} sub={data.traffic.devices[0] ? `${pct(data.traffic.devices[0].visits, data.traffic.devices.reduce((s, d) => s + d.visits, 0))}% of visits` : undefined} />
                  </div>
                  <DayBars rows={data.traffic.days.map((d) => ({ date: d.date, value: d.visits, extra: d.page_views }))} label="visits" extraLabel="page views" color="#3b8dd4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wide text-white/30 mb-2">Top pages</h4>
                      <Share rows={data.traffic.top_pages.map((p) => ({ label: p.path, value: p.visits }))} empty="No page data yet" color="#3b8dd4" mono />
                    </div>
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wide text-white/30 mb-2">Came from</h4>
                        <Share rows={data.traffic.referrers.map((r) => ({ label: r.host, value: r.visits }))} empty="Direct / unknown only" color="#3b8dd4" />
                      </div>
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wide text-white/30 mb-2">Countries</h4>
                        <Share rows={data.traffic.countries.slice(0, 5).map((c) => ({ label: c.country, value: c.visits }))} empty="—" color="#3b8dd4" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Pieces ────────────────────────────────────────────────────── */
function Card({ title, sub, icon, className = '', children }: { title: string; sub?: string; icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`bg-[#111] border border-white/5 rounded-xl p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">{icon}{title}</h3>
        {sub && <p className="text-[12px] text-white/30 mt-0.5">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Tile({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5' : 'border-white/5 bg-[#111]'}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/30">{icon}{label}</div>
      <div className={`text-[26px] font-bold tabular-nums leading-tight mt-1 ${accent ? 'text-[#C9A84C]' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-[12px] text-white/35 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-white/30">{label}</div>
      <div className="text-[16px] font-semibold tabular-nums text-white">{value}</div>
      {sub && <div className="text-[11px] text-white/30">{sub}</div>}
    </div>
  );
}

/** Sent → Opened → PDF → Signed. One hue, lighter→darker by stage; counts as text. */
function FunnelBars({ f }: { f: Funnel }) {
  const stages = [
    { label: 'Sent', n: f.sent, note: fmtMoney(f.value_sent) },
    { label: 'Opened', n: f.opened, note: `${pct(f.opened, f.sent)}%` },
    { label: 'Viewed PDF', n: f.pdf, note: `${pct(f.pdf, f.sent)}%` },
    { label: 'Signed', n: f.signed, note: `${pct(f.signed, f.sent)}% · ${fmtMoney(f.value_signed)}` },
  ];
  const max = Math.max(1, f.sent);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.label} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-[13px]">
          <span className="text-white/60">{s.label}</span>
          <div className="h-6 rounded bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded" style={{ width: `${Math.max(s.n ? 2 : 0, (s.n / max) * 100)}%`, background: GOLD, opacity: 0.45 + i * 0.18, transition: 'width .4s' }} />
          </div>
          <span className="tabular-nums text-white/80 font-medium w-[150px] text-right"><span className="text-white">{s.n}</span> <span className="text-white/35 text-[12px]">{s.note}</span></span>
        </div>
      ))}
      {f.declined > 0 && <div className="text-[12px] text-white/30 pl-[100px]">{f.declined} declined</div>}
    </div>
  );
}

/** Daily bars with a hover tooltip. Single series (+ a muted secondary count in the tooltip). */
function DayBars({ rows, label, extraLabel, color = GOLD }: { rows: { date: string; value: number; extra?: number }[]; label: string; extraLabel?: string; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const ticks = useMemo(() => { const n = rows.length; const step = n > 60 ? 14 : n > 20 ? 7 : 1; return rows.map((r, i) => (i % step === 0 || i === n - 1) ? r.date.slice(5).replace('-', '/') : ''); }, [rows]);
  if (!rows.length) return <p className="text-[13px] text-white/30">No data yet.</p>;
  return (
    <div>
      <div className="relative h-36 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {rows.map((r, i) => (
          <div key={r.date} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
            <div className="w-full rounded-t" style={{ height: `${Math.max(r.value ? 3 : 1, (r.value / max) * 100)}%`, background: r.value ? color : 'rgba(255,255,255,0.06)', opacity: hover === null || hover === i ? 1 : 0.45 }} />
          </div>
        ))}
        {hover !== null && rows[hover] && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 text-[12px] whitespace-nowrap pointer-events-none">
            <span className="text-white/40">{new Date(rows[hover].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="text-white font-medium ml-2">{rows[hover].value} {label}</span>
            {extraLabel != null && rows[hover].extra != null && <span className="text-white/40 ml-2">{rows[hover].extra} {extraLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex gap-[2px] mt-1">
        {ticks.map((t, i) => <div key={i} className="flex-1 text-[10px] text-white/25 overflow-visible whitespace-nowrap">{t}</div>)}
      </div>
      <div className="text-[12px] text-white/30 mt-2">{total.toLocaleString()} {label} in this period</div>
    </div>
  );
}

/** Horizontal share bars — label, bar, count. */
function Share({ rows, empty, color = GOLD, mono, icon }: { rows: { label: string; value: number; icon?: React.ReactNode }[]; empty: string; color?: string; mono?: boolean; icon?: React.ReactNode }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length || !total) return <p className="text-[13px] text-white/30">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="text-[12.5px]">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`flex items-center gap-1.5 text-white/70 truncate ${mono ? 'font-mono text-[12px]' : ''}`}>{r.icon || icon}{r.label}</span>
            <span className="tabular-nums text-white/40 shrink-0">{r.value} <span className="text-white/25">· {pct(r.value, total)}%</span></span>
          </div>
          <div className="h-1.5 rounded bg-white/[0.05] overflow-hidden"><div className="h-full rounded" style={{ width: `${pct(r.value, total)}%`, background: color, opacity: 0.8 }} /></div>
        </div>
      ))}
    </div>
  );
}
