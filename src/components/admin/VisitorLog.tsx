'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, ChevronDown, Smartphone, Monitor, Tablet, Bot, UserCheck, HelpCircle, Shield, RefreshCw } from 'lucide-react';

/**
 * Website visitor log for the Analytics page: every visitor, a plain verdict
 * (person / robot / staff / not sure) with the reasons, where they came from,
 * their network, and the page-by-page trail with time and scroll depth.
 */
type Pv = { created_at: string; path: string; title: string | null; source: string | null; visible_ms: number; max_scroll: number; interactions: number; clicks: string[] | null; city: string | null; region: string | null; network: string | null; network_type: string | null; session_id: string | null };
type V = {
  visitor_id: string; first_seen: string; last_seen: string; sessions: number; pageviews: number; total_ms: number; interactions: number;
  verdict: 'staff' | 'person' | 'likely_person' | 'unsure' | 'robot'; score: number; reasons: string[];
  device_type: string | null; os: string | null; browser: string | null; city: string | null; region: string | null; country: string | null;
  network: string | null; network_type: string | null; first_source: string | null; first_landing: string | null; staff_email: string | null;
  known_name: string | null; email_message_id: string | null; trail: Pv[];
};
const VERDICT: Record<V['verdict'], { label: string; color: string; Icon: any }> = {
  person: { label: 'Person', color: '#35d07f', Icon: UserCheck },
  likely_person: { label: 'Probably a person', color: '#9be15d', Icon: UserCheck },
  unsure: { label: 'Not sure', color: '#D4B965', Icon: HelpCircle },
  robot: { label: 'Robot', color: '#ff6b6b', Icon: Bot },
  staff: { label: 'RO staff', color: '#6db3f2', Icon: Shield },
};
const NET: Record<string, string> = { mobile: 'cell network', residential: 'home internet', business: 'business network', hosting: 'data center', vpn: 'VPN / privacy relay' };
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const secs = (ms: number) => ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
const pageName = (p: string) => p === '/' ? 'Home' : p.replace(/^\//, '').replace(/[-/]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function VisitorLog({ days }: { days: number }) {
  const [filter, setFilter] = useState<'people' | 'unsure' | 'robots' | 'staff' | 'all'>('people');
  const [data, setData] = useState<{ counts: Record<string, number>; visitors: V[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(`/api/admin/visitors?days=${days}&filter=${filter}`, { cache: 'no-store' }); if (r.ok) setData(await r.json()); } catch { /* keep old */ }
    setLoading(false);
  }, [days, filter]);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const chips: { k: typeof filter; label: string }[] = [
    { k: 'people', label: 'People' }, { k: 'unsure', label: 'Not sure' }, { k: 'robots', label: 'Robots' }, { k: 'staff', label: 'RO staff' }, { k: 'all', label: 'Everyone' },
  ];

  return (
    <section className="relative rounded-2xl border border-white/5 bg-[#101010] overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#35d07f]/10 flex items-center justify-center shrink-0"><Users size={20} className="text-[#35d07f]" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] uppercase tracking-[0.14em] text-white/40 font-semibold">Website visitors</p>
          <h3 className="text-[19px] font-bold leading-tight">Who is on the site, and is it a real person</h3>
          <p className="text-[14px] text-white/55 mt-1">Every visit to rounlimited.com in the last {days} days, judged person or robot, with the reasons. Your own phones and computers show as RO staff.</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80" title="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="px-4 pt-4 flex gap-2 flex-wrap">
        {chips.map((c) => (
          <button key={c.k} onClick={() => setFilter(c.k)}
            className={`min-h-[44px] px-4 rounded-xl text-[15px] font-semibold border ${filter === c.k ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#D4B965]' : 'border-white/10 text-white/60 hover:text-white/85'}`}>
            {c.label}{data ? <span className="ml-1.5 text-white/45 font-normal">{data.counts[c.k] ?? 0}</span> : null}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {!data && <p className="text-[15px] text-white/45 py-8 text-center">Loading…</p>}
        {data && !data.visitors.length && <p className="text-[15px] text-white/50 py-8 text-center">No {filter === 'all' ? '' : chips.find((c) => c.k === filter)?.label.toLowerCase()} visitors in the last {days} days yet. The log started recording on Nov 14, 2026.</p>}
        {data?.visitors.map((v) => {
          const vd = VERDICT[v.verdict] || VERDICT.unsure;
          const DevIcon = v.device_type === 'Phone' ? Smartphone : v.device_type === 'Tablet' ? Tablet : Monitor;
          const place = [v.city, v.region].filter(Boolean).join(', ') || v.country || 'Unknown place';
          const isOpen = open === v.visitor_id;
          return (
            <div key={v.visitor_id} className="rounded-xl border border-white/8 bg-white/[0.02]">
              <button onClick={() => setOpen(isOpen ? null : v.visitor_id)} className="w-full text-left p-3.5 flex items-start gap-3">
                <span className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-bold" style={{ background: vd.color + '1f', color: vd.color }}><vd.Icon size={14} />{vd.label}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] text-white font-semibold truncate">
                    {v.known_name ? v.known_name : v.verdict === 'staff' ? (v.staff_email || 'RO staff') : place}
                  </span>
                  <span className="block text-[14px] text-white/60 truncate">
                    <DevIcon size={13} className="inline -mt-0.5 mr-1" />{[v.device_type, v.os, v.browser].filter(Boolean).join(' · ')}
                    {v.network ? ` · ${v.network}${v.network_type ? ` (${NET[v.network_type] || v.network_type})` : ''}` : ''}
                  </span>
                  <span className="block text-[14px] text-white/50">
                    {v.known_name ? `${place} · ` : ''}{v.pageviews} page{v.pageviews === 1 ? '' : 's'} · {secs(v.total_ms)} · came from {v.first_source || 'unknown'}{v.sessions > 1 ? ` · ${v.sessions} visits` : ''}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-[13px] text-white/55">{when(v.last_seen)}</span>
                  <ChevronDown size={15} className={`inline text-white/45 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {isOpen && (
                <div className="px-3.5 pb-4 space-y-3">
                  <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                    <p className="text-[13px] uppercase tracking-wider text-white/40 font-semibold mb-1.5">Why: {vd.label.toLowerCase()} (score {v.score})</p>
                    <ul className="space-y-1">{(v.reasons || []).map((r, i) => <li key={i} className="text-[14px] text-white/75">• {r}</li>)}</ul>
                    <p className="text-[13px] text-white/40 mt-2">First seen {when(v.first_seen)} on {pageName(v.first_landing || '/')}.{v.email_message_id ? ' Arrived from a tracked email you sent.' : ''}</p>
                  </div>
                  <div>
                    <p className="text-[13px] uppercase tracking-wider text-white/40 font-semibold mb-1.5">Pages, newest first</p>
                    <div className="space-y-1.5">
                      {v.trail.map((p, i) => (
                        <div key={i} className="flex gap-3 text-[14px]">
                          <span className="text-white/45 w-[112px] shrink-0">{when(p.created_at)}</span>
                          <span className="flex-1 min-w-0">
                            <span className="text-white/90">{pageName(p.path)}</span>
                            <span className="text-white/50"> · {secs(p.visible_ms)} on screen · scrolled {p.max_scroll}%{p.interactions ? ` · ${p.interactions} touches/scrolls` : ' · no touching'}</span>
                            {p.source && p.source !== 'Inside the site' && <span className="block text-[13px] text-white/45">from {p.source}</span>}
                            {!!p.clicks?.length && <span className="block text-[13px] text-white/45">tapped: {p.clicks.slice(0, 5).join(' · ')}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <p className="text-[13px] text-white/40 pt-2">Robots that only grab the bare page without running it never show up here at all. Those are counted in the website traffic numbers above.</p>
      </div>
    </section>
  );
}
