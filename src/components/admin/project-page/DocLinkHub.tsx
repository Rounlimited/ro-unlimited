'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Loader2, Copy, Check, Mail, MessageSquare, Eye, Activity, MoreHorizontal, Pause, Play, RefreshCw, Trash2, Send, Link2, FileText, Clock, MousePointerClick } from 'lucide-react';
import { Switch, CountUp, useReducedMotion } from './ProjectPageHub';

/**
 * Invoice Page / Report Page hub — the same look and language as the Project
 * Page hub, for the two other customer links JR sends.
 *   Share    — status, text / copy / email / see it as them
 *   Activity — (invoices) count-ups + timeline of opens, PDFs, emails
 *   More     — pause, expiration, new link, turn off — plain consequences, two-tap
 * Talks to the existing /api/admin/{invoices|reports}/[id]/link route.
 */
type Kind = 'invoice' | 'report';
type LinkStatus = { enabled: boolean; has_link: boolean; expired: boolean; url: string | null; expires_at: string | null; view_count: number; last_viewed_at: string | null; sent_at?: string | null };
type Ev = { event: string; created_at: string; device_type?: string; os?: string; city?: string; region?: string; internal?: boolean; meta?: any };
type Tab = 'share' | 'activity' | 'more';

const GOLD = '#C9A84C';
const ago = (iso: string | null | undefined) => {
  if (!iso) return 'never';
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 2) return 'just now'; if (m < 60) return Math.round(m) + ' min ago';
  const h = m / 60; if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : d < 30 ? d + ' days ago' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const stamp = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const dev = (e: Ev) => (e.device_type === 'Phone' ? (e.os === 'iOS' ? 'iPhone' : e.os === 'Android' ? 'Android phone' : 'phone') : e.device_type === 'Tablet' ? 'tablet' : e.device_type ? 'computer' : '');

export default function DocLinkHub({ kind, id, title, who, phone, onClose, onChanged, onSend, sendLabel }: {
  kind: Kind; id: string; title: string; who: string; phone?: string | null;
  onClose: () => void; onChanged?: () => void; onSend?: () => void; sendLabel?: string;
}) {
  const reduced = useReducedMotion();
  const word = kind === 'invoice' ? 'Invoice' : 'Report';
  const api = `/api/admin/${kind === 'invoice' ? 'invoices' : 'reports'}/${id}/link`;
  const tabs: { id: Tab; label: string; icon: any }[] = kind === 'invoice'
    ? [{ id: 'share', label: 'Share', icon: Send }, { id: 'activity', label: 'Activity', icon: Activity }, { id: 'more', label: 'More', icon: MoreHorizontal }]
    : [{ id: 'share', label: 'Share', icon: Send }, { id: 'more', label: 'More', icon: MoreHorizontal }];
  const [tab, setTab] = useState<Tab>('share');
  const [s, setS] = useState<LinkStatus | null>(null);
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [arm, setArm] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const load = useCallback(async () => {
    try { const j = await (await fetch(api, { cache: 'no-store' })).json(); if (!j.error) setS(j); } catch {}
    if (kind === 'invoice') {
      try { const j = await (await fetch(`/api/admin/invoices/${id}/events`, { cache: 'no-store' })).json(); setEvents(((j.events || []) as Ev[]).filter((e) => !e.internal)); } catch { setEvents([]); }
    }
  }, [api, id, kind]);
  useEffect(() => { load(); }, [load]);

  useLayoutEffect(() => {
    if (reduced || !panelRef.current || !overlayRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panelRef.current, { yPercent: 100, opacity: 0.6 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
  }, [reduced]);
  const close = useCallback(() => {
    if (closing.current) return; closing.current = true;
    if (reduced || !panelRef.current || !overlayRef.current) { onClose(); return; }
    gsap.to(panelRef.current, { yPercent: 100, duration: 0.38, ease: 'power3.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.38, onComplete: onClose });
  }, [onClose, reduced]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [close]);

  const moveIndicator = useCallback((instant = false) => {
    const wrap = tabsRef.current, ind = indRef.current; if (!wrap || !ind) return;
    const btn = wrap.querySelector(`[data-tab="${tab}"]`) as HTMLElement | null; if (!btn) return;
    const vars = { x: btn.offsetLeft, width: btn.offsetWidth };
    if (instant || reduced) gsap.set(ind, vars); else gsap.to(ind, { ...vars, duration: 0.45, ease: 'power3.out' });
  }, [tab, reduced]);
  useLayoutEffect(() => { moveIndicator(); }, [moveIndicator, s]);
  useLayoutEffect(() => {
    if (!contentRef.current || reduced || !s) return;
    gsap.fromTo(contentRef.current.querySelectorAll('[data-anim]'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05, overwrite: true });
  }, [tab, s ? 1 : 0, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text: string, ok = true) => { setNote({ text, ok }); window.setTimeout(() => setNote((n) => (n && n.text === text ? null : n)), 3500); };
  const act = async (action: string, extra: Record<string, unknown> = {}, ok = 'Done ✓') => {
    setBusy(action); setArm(null);
    const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) }).then((x) => x.json()).catch(() => null);
    setBusy(null); await load(); if (onChanged) onChanged();
    flash(r && !r.error ? ok : (r && r.error) || 'Could not do that — try again.', !!(r && !r.error));
  };
  const twoTap = (key: string, run: () => void) => { if (arm === key) run(); else { setArm(key); window.setTimeout(() => setArm((a) => (a === key ? null : a)), 4000); } };
  const copy = async () => { if (!s || !s.url) return; try { await navigator.clipboard.writeText(s.url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { flash(s.url); } };
  const first = who.split(' ')[0] || who;
  const sms = s && s.url ? `sms:${phone ? phone.replace(/[^0-9+]/g, '') : ''}?&body=${encodeURIComponent(`Hi ${first} — here's your ${word.toLowerCase()} from RO Unlimited (${title}): ${s.url}`)}` : '';
  const status = !s ? null : !s.has_link ? { label: 'No link yet', color: '#9ca3af' } : !s.enabled ? { label: 'Paused', color: '#f0a04b' } : s.expired ? { label: 'Expired', color: '#f87171' } : { label: 'Live', color: '#35d07f' };

  // Invoice activity
  const opens = (events || []).filter((e) => e.event === 'link_view');
  const pdfs = (events || []).filter((e) => e.event === 'pdf_download' || e.event === 'pdf_view');
  const week = opens.filter((e) => Date.now() - new Date(e.created_at).getTime() < 7 * 86400000).length;
  const timeline = (events || []).filter((e) => ['link_view', 'pdf_view', 'pdf_download', 'email_opened', 'email_clicked', 'email_delivered'].includes(e.event) && !(e.meta && e.meta.automated)).slice(0, 50);
  const evLabel = (e: Ev) => e.event === 'link_view' ? ['Opened the invoice', Eye, '#6db3f2'] : e.event === 'pdf_download' ? ['Downloaded the PDF', FileText, '#a78bfa'] : e.event === 'pdf_view' ? ['Viewed the PDF', FileText, '#a78bfa'] : e.event === 'email_opened' ? ['Opened your email', Mail, '#6db3f2'] : e.event === 'email_clicked' ? ['Clicked the link in your email', MousePointerClick, '#35d07f'] : ['Email delivered', Mail, 'rgba(255,255,255,0.5)'];

  const glass = { background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)' };
  const tile = 'relative overflow-hidden rounded-2xl p-4 min-h-[104px] flex flex-col justify-between text-left active:scale-[0.97] transition-transform disabled:opacity-40';

  return (
    <div ref={overlayRef} className="fixed z-[70] flex items-end sm:items-center justify-center" style={{ top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} onClick={close}>
      <style>{`
        @keyframes hubPulse { 0% { box-shadow: 0 0 0 0 var(--c); } 70% { box-shadow: 0 0 0 10px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        @keyframes hubShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
        @keyframes hubPop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .hub-anim { animation: none !important; } }
      `}</style>
      <div ref={panelRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${word} Page`}
        className="relative w-full sm:max-w-xl flex flex-col text-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden max-h-[92vh]"
        style={{ maxHeight: '92dvh', background: 'linear-gradient(180deg, #171511 0%, #101010 38%, #0c0c0c 100%)', border: '1px solid rgba(201,168,76,0.22)', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}>
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-48 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,0.22), transparent)' }} />
        <div className="relative px-5 pt-3">
          <div className="w-11 h-1.5 rounded-full bg-white/15 mx-auto mb-3 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>{word} Page</p>
              <h2 className="text-[22px] font-bold leading-tight mt-0.5 truncate">{title}</h2>
              <p className="text-[14px] text-white/45 mt-0.5 truncate">{who}</p>
            </div>
            <button onClick={close} aria-label="Close" className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center bg-white/[0.06] active:scale-90 transition"><X size={20} className="text-white/70" /></button>
          </div>
          {s && status && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3" style={glass}>
              <span className="hub-anim w-3 h-3 rounded-full flex-shrink-0" style={{ background: status.color, ['--c' as any]: status.color + '99', animation: status.label === 'Live' ? 'hubPulse 2s infinite' : 'none' }} />
              <span className="text-[16px] font-bold" style={{ color: status.color }}>{status.label}</span>
              <span className="text-[15px] text-white/55 truncate">{s.has_link ? (s.view_count ? `Opened ${s.view_count}× · last ${ago(s.last_viewed_at)}` : 'Not opened yet') : 'Create a link to share it'}</span>
            </div>
          )}
          <div ref={tabsRef} className="relative mt-3 flex gap-1 pb-2">
            <div ref={indRef} className="absolute top-0 left-0 h-[46px] rounded-full pointer-events-none" style={{ background: 'linear-gradient(145deg, rgba(212,185,101,0.28), rgba(168,137,61,0.22))', border: '1px solid rgba(212,185,101,0.55)', boxShadow: '0 4px 20px rgba(201,168,76,0.18)' }} />
            {tabs.map((t) => { const on = tab === t.id; const Icon = t.icon; return (
              <button key={t.id} data-tab={t.id} onClick={() => { setTab(t.id); setArm(null); }} className="relative z-10 h-[46px] px-4 rounded-full flex items-center gap-2 text-[15px] font-bold whitespace-nowrap transition-colors duration-300" style={{ color: on ? '#E9D18A' : 'rgba(255,255,255,0.55)' }}><Icon size={17} /> {t.label}</button>
            ); })}
          </div>
        </div>

        {note && <div className="absolute left-4 right-4 z-20 rounded-xl px-4 py-3 text-[15px] font-bold shadow-2xl hub-anim" style={{ bottom: 'max(18px, calc(10px + env(safe-area-inset-bottom, 0px)))', background: note.ok ? '#123524' : '#3a1414', color: note.ok ? '#7ef0b2' : '#fca5a5', border: '1px solid ' + (note.ok ? 'rgba(53,208,127,0.4)' : 'rgba(248,113,113,0.4)'), animation: 'hubPop 0.35s ease-out' }}>{note.text}</div>}

        <div ref={contentRef} className="relative flex-1 min-h-0 overflow-y-auto px-5 pt-2 space-y-3" style={{ paddingBottom: 'max(40px, calc(24px + env(safe-area-inset-bottom, 0px)))' }}>
          {!s ? <div className="py-16 flex justify-center text-white/40"><Loader2 size={28} className="animate-spin" /></div>
          : tab === 'share' ? (
            !s.has_link ? (
              <div data-anim className="rounded-2xl p-4" style={glass}>
                <p className="text-[18px] font-bold">There’s no link yet</p>
                <p className="text-[16px] text-white/55 mt-1">{kind === 'report' ? 'Send the report to create its link.' : `Create one and ${first} can open the ${word.toLowerCase()}.`}</p>
                {kind === 'invoice' && <button onClick={() => act('new', {}, 'Link created ✓')} disabled={!!busy} className="mt-3 w-full min-h-[54px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(145deg, #E2C878, #a8893d)' }}>{busy === 'new' ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />} Create the link</button>}
              </div>
            ) : (
              <>
                {!s.enabled && (
                  <div data-anim className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: 'rgba(240,160,75,0.1)', border: '1px solid rgba(240,160,75,0.45)' }}>
                    <p className="text-[16px] text-[#f5c08a] leading-snug"><strong>Paused.</strong> {first} sees a “we’re making updates” page.</p>
                    <button onClick={() => act('on', {}, 'Back on ✓')} disabled={!!busy} className="min-h-[48px] px-4 rounded-xl text-[15px] font-bold text-black flex-shrink-0" style={{ background: '#f0a04b' }}>{busy === 'on' ? '…' : 'Turn on'}</button>
                  </div>
                )}
                <button data-anim onClick={copy} className="relative overflow-hidden w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition" style={glass}>
                  <span className="hub-anim pointer-events-none absolute inset-y-0 w-1/3" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', animation: 'hubShimmer 3.5s ease-in-out infinite' }} />
                  <Link2 size={19} style={{ color: GOLD }} className="flex-shrink-0" />
                  <span className="min-w-0 flex-1 text-[15px] text-white/75 truncate font-mono">{(s.url || '').replace(/^https?:\/\//, '')}</span>
                  <span className="text-[14px] font-bold flex-shrink-0" style={{ color: copied ? '#35d07f' : GOLD }}>{copied ? 'Copied' : 'Tap to copy'}</span>
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <a data-anim href={sms} className={tile} style={{ ...glass, background: 'linear-gradient(160deg, rgba(53,208,127,0.16), rgba(53,208,127,0.04))', borderColor: 'rgba(53,208,127,0.3)' }}>
                    <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(53,208,127,0.18)' }}><MessageSquare size={21} className="text-[#35d07f]" /></span>
                    <span><span className="block text-[17px] font-bold">Text it</span><span className="block text-[14px] text-white/50">{phone ? 'to ' + first : 'pick who in Messages'}</span></span>
                  </a>
                  <button data-anim onClick={copy} className={tile} style={glass}>
                    <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: copied ? 'rgba(53,208,127,0.2)' : 'rgba(201,168,76,0.16)' }}>{copied ? <Check size={21} className="text-[#35d07f]" style={{ animation: 'hubPop 0.4s ease-out' }} /> : <Copy size={20} style={{ color: GOLD }} />}</span>
                    <span><span className="block text-[17px] font-bold">{copied ? 'Copied!' : 'Copy link'}</span><span className="block text-[14px] text-white/50">paste anywhere</span></span>
                  </button>
                  {onSend && (
                    <button data-anim onClick={() => { close(); window.setTimeout(onSend, 420); }} className={tile} style={glass}>
                      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(109,179,242,0.16)' }}><Send size={20} className="text-[#6db3f2]" /></span>
                      <span><span className="block text-[17px] font-bold">{sendLabel || 'Email it'}</span><span className="block text-[14px] text-white/50">{s.sent_at ? 'sent ' + ago(s.sent_at) : 'with a message'}</span></span>
                    </button>
                  )}
                  <a data-anim href={(s.url || '') + '?from=admin'} target="_blank" rel="noreferrer" className={tile} style={glass}>
                    <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.16)' }}><Eye size={20} className="text-[#c084fc]" /></span>
                    <span><span className="block text-[17px] font-bold">See it as them</span><span className="block text-[14px] text-white/50">exactly what they see</span></span>
                  </a>
                </div>
              </>
            )
          ) : tab === 'activity' ? (
            <>
              <div data-anim className="grid grid-cols-3 gap-2.5">
                {([['This week', week, 'opens', '#6db3f2'], ['All time', Math.max(opens.length, s ? s.view_count : 0), 'opens', '#35d07f'], ['PDF', pdfs.length, pdfs.length === 1 ? 'download' : 'downloads', '#a78bfa']] as const).map(([l, v, u, c]) => (
                  <div key={l} className="rounded-2xl p-3.5 relative overflow-hidden" style={glass}>
                    <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full" style={{ background: c + '1f' }} />
                    <p className="text-[12px] font-bold uppercase tracking-wide text-white/45">{l}</p>
                    <p className="text-[28px] font-bold leading-none mt-1.5 tabular-nums" style={{ color: c }}><CountUp value={Number(v)} reduced={reduced} /></p>
                    <p className="text-[12px] text-white/40 mt-1">{u}</p>
                  </div>
                ))}
              </div>
              {events === null ? <div className="py-8 flex justify-center text-white/40"><Loader2 className="animate-spin" /></div> : timeline.length === 0 ? (
                <div data-anim className="rounded-2xl p-6 text-center" style={glass}><Clock size={26} className="mx-auto text-white/30" /><p className="text-[16px] text-white/55 mt-2">Nothing yet. When {first} opens it or downloads the PDF, it shows up here.</p></div>
              ) : (
                <ol className="relative pl-2">
                  <span className="absolute left-[27px] top-3 bottom-3 w-px" style={{ background: 'linear-gradient(180deg, rgba(201,168,76,0.4), rgba(255,255,255,0.05))' }} />
                  {timeline.map((e, i) => { const [label, Icon, c] = evLabel(e) as [string, any, string]; return (
                    <li key={i} data-anim className="relative flex gap-3 py-2.5">
                      <span className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#151515', border: '1px solid ' + c + '66', boxShadow: '0 0 14px ' + c + '22' }}><Icon size={17} style={{ color: c }} /></span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block text-[16px] leading-snug"><strong className="text-white">{first}</strong> <span className="text-white/75">{label.charAt(0).toLowerCase() + label.slice(1)}</span></span>
                        {(dev(e) || e.city) && <span className="block text-[14px] text-white/45">{[dev(e), [e.city, e.region].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</span>}
                        <span className="block text-[13px] text-white/35 mt-0.5">{ago(e.created_at)} · {stamp(e.created_at)}</span>
                      </span>
                    </li>
                  ); })}
                </ol>
              )}
            </>
          ) : (
            <>
              {s.has_link && (
                <button data-anim onClick={() => act(s.enabled ? 'off' : 'on', {}, s.enabled ? 'Paused — they see “making updates”' : 'Back on ✓')} disabled={!!busy} className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition" style={{ ...glass, borderColor: s.enabled ? 'rgba(255,255,255,0.09)' : 'rgba(240,160,75,0.5)' }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(240,160,75,0.15)' }}>{s.enabled ? <Pause size={19} className="text-[#f0a04b]" /> : <Play size={19} className="text-[#f0a04b]" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{s.enabled ? 'Pause the page' : 'Paused — turn it back on'}</span><span className="block text-[14px] text-white/45 leading-snug">For a phone call or a fix. They see “we’re making updates” until you turn it back on. Same link comes back.</span></span>
                  <Switch on={!s.enabled} busy={busy === 'off' || busy === 'on'} />
                </button>
              )}
              {s.has_link && (
                <div data-anim className="rounded-2xl p-4" style={glass}>
                  <p className="text-[16px] font-bold">Link expires</p>
                  <p className="text-[14px] text-white/45">{s.expires_at ? `Good through ${fmtDate(s.expires_at)}${s.expired ? ' — expired' : ''}.` : 'No expiration.'}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[30, 60, 90].map((n) => <button key={n} onClick={() => act('extend', { days: n }, `Good for ${n} more days ✓`)} disabled={!!busy} className="min-h-[46px] px-4 rounded-xl text-[15px] font-bold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>+{n} days</button>)}
                    <input type="date" value={customDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setCustomDate(e.target.value)} className="flex-1 min-w-[140px] min-h-[46px] px-3 rounded-xl bg-white/5 border border-white/10 text-[15px] text-white" />
                    <button onClick={() => customDate ? act('expire_on', { date: customDate }, 'Expiration set ✓') : flash('Pick a day first', false)} disabled={!!busy} className="min-h-[46px] px-4 rounded-xl text-[15px] font-bold text-black" style={{ background: 'linear-gradient(145deg, #E2C878, #a8893d)' }}>Set</button>
                  </div>
                </div>
              )}
              <button data-anim onClick={() => twoTap('new', () => act('new', {}, s.has_link ? 'New link ready — the old one is dead ✓' : 'Link created ✓'))} disabled={!!busy} className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition" style={{ ...glass, borderColor: arm === 'new' ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.09)' }}>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.15)' }}>{busy === 'new' ? <Loader2 size={19} className="animate-spin" style={{ color: GOLD }} /> : <RefreshCw size={19} style={{ color: GOLD }} />}</span>
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold" style={{ color: arm === 'new' ? '#E9D18A' : '#fff' }}>{arm === 'new' ? 'Tap again to replace it' : s.has_link ? 'Give them a new link' : 'Create the link'}</span><span className="block text-[14px] text-white/45 leading-snug">{s.has_link ? 'The old link stops working the moment you do.' : `Makes the ${word.toLowerCase()} link.`}</span></span>
              </button>
              {s.has_link && (
                <button data-anim onClick={() => twoTap('kill', () => act('kill', {}, `${word} link turned off`))} disabled={!!busy} className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition" style={{ background: arm === 'kill' ? 'rgba(248,113,113,0.12)' : 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,' + (arm === 'kill' ? '0.6' : '0.25') + ')' }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.14)' }}>{busy === 'kill' ? <Loader2 size={19} className="animate-spin text-[#f87171]" /> : <Trash2 size={19} className="text-[#f87171]" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold text-[#fca5a5]">{arm === 'kill' ? 'Tap again — the link stops working' : `Turn off the ${word.toLowerCase()} link`}</span><span className="block text-[14px] text-white/45 leading-snug">Nothing works until you create a new link. Pausing is usually better.</span></span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
