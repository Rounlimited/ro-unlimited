'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  X, Loader2, Copy, Check, Mail, MessageSquare, Eye, Users, SlidersHorizontal, Activity, MoreHorizontal, Pause, Play,
  RefreshCw, Trash2, CalendarDays, ShieldCheck, Camera, Sparkles, MessageCircle, Star, UserPlus, FileText,
  CheckCircle2, XCircle, Upload, PenLine, ListChecks, Share2, Send, Link2, Clock, KeyRound,
} from 'lucide-react';
import ProjectPeople from '@/components/admin/estimates/ProjectPeople';

/**
 * The Project Page hub — ONE place for everything about a customer's page.
 * Same button on the estimate page and the Job Room.
 *   Share     — status, text / copy / email / see it as the customer, owner sign-in
 *   People    — owner + everyone it's shared with (view / approve), customer invites switch
 *   What they see — every visibility switch + progress-report frequency
 *   Activity  — pulse numbers + one timeline (owner and shared people)
 *   More      — pause, new link, expiration (estimates only), turn off
 * Built for JR: 16–17px text, 52px targets, words over icons, plain consequences.
 */
export type HubTab = 'share' | 'people' | 'see' | 'activity' | 'more';
type Hub = {
  project: { id: string; number: string; name: string; stage: 'estimate' | 'job' | 'complete'; status: string; signed: boolean; sent_at: string | null };
  link: { url: string | null; has_link: boolean; enabled: boolean; expired: boolean; expires_at: string | null; views: number; last_viewed_at: string | null; last_device: string | null };
  owner: { name: string; first: string; email: string | null; phone: string | null; customer_id: string | null; access: 'no_email' | 'password' | 'link' | 'never'; last_sign_in: string | null };
  people: { count: number; approvers: number };
  see: { show_schedule: boolean; show_inspections: boolean; show_photos: boolean; show_assistant: boolean; feedback_enabled: boolean; reviews_enabled: boolean; allow_customer_share: boolean; reporting_cadence: string; reporting_day: string | null };
  pulse: { opens_7d: number; opens_30d: number; avg_seconds: number | null; people: number; top_sections: { section: string; n: number }[] };
  activity: { at: string; who: string; kind: string; what: string; detail?: string | null }[];
};

const GOLD = '#C9A84C';
const ago = (iso: string | null) => {
  if (!iso) return 'never';
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 2) return 'just now'; if (m < 60) return Math.round(m) + ' min ago';
  const h = m / 60; if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : d < 30 ? d + ' days ago' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const stamp = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const SECTION_NAMES: Record<string, string> = { 'needs-you': 'Needs you', story: 'Updates', schedule: 'Coming up', inspections: 'Inspections', requests: 'Requests', questions: 'Questions', assistant: 'Assistant', glossary: 'Glossary', binder: 'Binder', scope: 'Scope', total: 'Total', sign: 'Sign', share: 'Sharing' };
const KIND: Record<string, { icon: any; color: string }> = {
  open: { icon: Eye, color: '#6db3f2' }, pdf: { icon: FileText, color: '#a78bfa' }, email: { icon: Mail, color: '#6db3f2' },
  question: { icon: MessageCircle, color: '#D4B965' }, approve: { icon: CheckCircle2, color: '#35d07f' }, decline: { icon: XCircle, color: '#f87171' },
  upload: { icon: Upload, color: '#35d07f' }, feedback: { icon: Star, color: '#F5B83D' }, sign: { icon: PenLine, color: '#35d07f' },
  options: { icon: ListChecks, color: '#D4B965' }, share: { icon: Share2, color: '#c084fc' },
};
const TABS: { id: HubTab; label: string; icon: any }[] = [
  { id: 'share', label: 'Share', icon: Send }, { id: 'people', label: 'People', icon: Users },
  { id: 'see', label: 'What they see', icon: SlidersHorizontal }, { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { try { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch {} }, []);
  return r;
}

/* An animated on/off switch */
export function Switch({ on, busy }: { on: boolean; busy?: boolean }) {
  return (
    <span className="relative inline-flex flex-shrink-0 items-center w-[58px] h-[34px] rounded-full transition-colors duration-300" style={{ background: on ? GOLD : 'rgba(255,255,255,0.14)', boxShadow: on ? '0 0 18px rgba(201,168,76,0.35)' : 'none' }}>
      <span className="absolute top-[4px] w-[26px] h-[26px] rounded-full bg-white shadow-md flex items-center justify-center" style={{ left: on ? 28 : 4, transition: 'left 0.32s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {busy ? <Loader2 size={14} className="animate-spin text-black/60" /> : null}
      </span>
    </span>
  );
}

/* A number that counts up when it appears */
export function CountUp({ value, reduced }: { value: number; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (reduced) { ref.current.textContent = String(value); return; }
    const o = { v: 0 };
    const t = gsap.to(o, { v: value, duration: 1.1, ease: 'power3.out', onUpdate: () => { if (ref.current) ref.current.textContent = String(Math.round(o.v)); } });
    return () => { t.kill(); };
  }, [value, reduced]);
  return <span ref={ref}>0</span>;
}

export default function ProjectPageHub({ estimateId, onClose, initialTab = 'share', onSendEstimate, onChanged }: {
  estimateId: string; onClose: () => void; initialTab?: HubTab; onSendEstimate?: () => void; onChanged?: () => void;
}) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [d, setD] = useState<Hub | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [arm, setArm] = useState<string | null>(null);
  const [who, setWho] = useState<string>('all');
  const [customDate, setCustomDate] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/estimates/${estimateId}/hub`, { cache: 'no-store' });
      const j = await r.json(); if (j.error) { setErr(j.error); return; }
      setD(j); setErr('');
    } catch { setErr('Could not load — check your connection.'); }
  }, [estimateId]);
  useEffect(() => { load(); }, [load]);

  // Sheet in
  useLayoutEffect(() => {
    if (reduced || !panelRef.current || !overlayRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
    gsap.fromTo(panelRef.current, { yPercent: 100, opacity: 0.6 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
  }, [reduced]);
  const close = useCallback(() => {
    if (closing.current) return; closing.current = true;
    if (reduced || !panelRef.current || !overlayRef.current) { onClose(); return; }
    gsap.to(panelRef.current, { yPercent: 100, duration: 0.38, ease: 'power3.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.38, ease: 'power1.in', onComplete: onClose });
  }, [onClose, reduced]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [close]);

  // Sliding tab indicator
  const moveIndicator = useCallback((instant = false) => {
    const wrap = tabsRef.current, ind = indRef.current; if (!wrap || !ind) return;
    const btn = wrap.querySelector(`[data-tab="${tab}"]`) as HTMLElement | null; if (!btn) return;
    const vars = { x: btn.offsetLeft, width: btn.offsetWidth };
    if (instant || reduced) gsap.set(ind, vars); else gsap.to(ind, { ...vars, duration: 0.45, ease: 'power3.out' });
    // Scroll ONLY the tab row (scrollIntoView also scrolled the sheet sideways)
    try { wrap.scrollTo({ left: Math.max(0, btn.offsetLeft - wrap.clientWidth / 2 + btn.offsetWidth / 2), behavior: reduced ? 'auto' : 'smooth' }); } catch { wrap.scrollLeft = Math.max(0, btn.offsetLeft - wrap.clientWidth / 2 + btn.offsetWidth / 2); }
  }, [tab, reduced]);
  useLayoutEffect(() => { moveIndicator(); }, [moveIndicator, d]);
  useEffect(() => { const r = () => moveIndicator(true); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, [moveIndicator]);

  // Content in (stagger) on tab change / first data
  useLayoutEffect(() => {
    if (!contentRef.current || reduced || !d) return;
    const items = contentRef.current.querySelectorAll('[data-anim]');
    gsap.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.045, overwrite: true });
    contentRef.current.scrollTop = 0;
  }, [tab, d ? 1 : 0, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text: string, ok = true) => { setNote({ text, ok }); window.setTimeout(() => setNote((n) => (n && n.text === text ? null : n)), 3500); };
  const after = async (msg?: string, ok = true) => { await load(); if (msg) flash(msg, ok); if (onChanged) onChanged(); };

  const linkAct = async (action: string, extra: Record<string, unknown> = {}, ok = 'Done ✓') => {
    setBusy(action); setArm(null);
    const r = await fetch(`/api/admin/estimates/${estimateId}/link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) }).then((x) => x.json()).catch(() => null);
    setBusy(null); await after(r && !r.error ? ok : (r && r.error) || 'Could not do that — try again.', !!(r && !r.error));
  };
  const setFlag = async (field: string, value: boolean) => {
    setBusy(field);
    if (field === 'allow_customer_share') await fetch(`/api/admin/estimates/${estimateId}/people`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allow_customer_share: value }) }).catch(() => null);
    else await fetch(`/api/admin/estimates/${estimateId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) }).catch(() => null);
    setBusy(null); await after();
  };
  const setCadence = async (c: string, day?: string) => {
    setBusy('cadence');
    await fetch(`/api/admin/estimates/${estimateId}/hub`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reporting_cadence: c, reporting_day: day || (d && d.see.reporting_day) || 'Friday' }) }).catch(() => null);
    setBusy(null); await after(c === 'none' ? 'Progress reports off' : 'Report schedule saved ✓');
  };
  const copy = async () => {
    if (!d || !d.link.url) return;
    try { await navigator.clipboard.writeText(d.link.url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { flash(d.link.url); }
  };
  const emailSignIn = async () => {
    if (!d || !d.owner.customer_id) return;
    setBusy('signin');
    const r = await fetch('/api/admin/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_link', customer_id: d.owner.customer_id }) }).then((x) => x.json()).catch(() => null);
    setBusy(null); flash(r && !r.error ? `Sign-in link emailed to ${r.sent_to || d.owner.email} ✓` : (r && r.error) || 'Could not send.', !!(r && !r.error));
  };
  const twoTap = (key: string, run: () => void) => { if (arm === key) run(); else { setArm(key); window.setTimeout(() => setArm((a) => (a === key ? null : a)), 4000); } };

  const status = !d ? null : !d.link.has_link ? { label: 'No link yet', color: '#9ca3af' } : !d.link.enabled ? { label: 'Paused', color: '#f0a04b' } : d.link.expired ? { label: 'Expired', color: '#f87171' } : { label: 'Live', color: '#35d07f' };
  const stageLabel = !d ? '' : d.project.stage === 'complete' ? 'Completed job' : d.project.stage === 'job' ? 'Active job' : 'Estimate';
  const smsHref = d && d.link.url ? `sms:${d.owner.phone ? d.owner.phone.replace(/[^0-9+]/g, '') : ''}?&body=${encodeURIComponent(`Hi ${d.owner.first} — here's your RO Unlimited project page for ${d.project.name}: ${d.link.url}`)}` : '';
  const people = useMemo(() => (d ? Array.from(new Set(d.activity.map((a) => a.who))) : []), [d]);
  const acts = d ? d.activity.filter((a) => who === 'all' || a.who === who) : [];

  const tile = 'relative overflow-hidden rounded-2xl p-4 min-h-[104px] flex flex-col justify-between text-left active:scale-[0.97] transition-transform disabled:opacity-40';
  const card = 'rounded-2xl p-4';
  const glass = { background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)' };

  return (
    <div ref={overlayRef} className="fixed z-[70] flex items-end sm:items-center justify-center" style={{ top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} onClick={close}>
      <style>{`
        @keyframes hubPulse { 0% { box-shadow: 0 0 0 0 var(--c); } 70% { box-shadow: 0 0 0 10px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        @keyframes hubShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
        @keyframes hubPop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .hub-anim { animation: none !important; } }
        .hub-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div ref={panelRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Project Page"
        className="relative w-full sm:max-w-xl flex flex-col text-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden max-h-[92vh]"
        style={{ maxHeight: '92dvh', background: 'linear-gradient(180deg, #171511 0%, #101010 38%, #0c0c0c 100%)', border: '1px solid rgba(201,168,76,0.22)', boxShadow: '0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset' }}>
        {/* top glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-48 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,0.22), transparent)' }} />

        {/* Header */}
        <div className="relative px-5 pt-3">
          <div className="w-11 h-1.5 rounded-full bg-white/15 mx-auto mb-3 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Project Page</p>
              <h2 className="text-[22px] font-bold leading-tight mt-0.5 truncate">{d ? d.project.name : 'Loading…'}</h2>
              {d && <p className="text-[14px] text-white/45 mt-0.5">{d.owner.name} · {stageLabel} · {d.project.number}</p>}
            </div>
            <button onClick={close} aria-label="Close" className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/10 active:scale-90 transition"><X size={20} className="text-white/70" /></button>
          </div>

          {/* Status strip */}
          {d && status && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3" style={glass}>
              <span className="hub-anim relative w-3 h-3 rounded-full flex-shrink-0" style={{ background: status.color, ['--c' as any]: status.color + '99', animation: status.label === 'Live' ? 'hubPulse 2s infinite' : 'none' }} />
              <span className="text-[16px] font-bold" style={{ color: status.color }}>{status.label}</span>
              <span className="text-[15px] text-white/55 truncate">
                {d.link.has_link ? (d.link.views ? `Opened ${d.link.views}× · last ${ago(d.link.last_viewed_at)}${d.link.last_device ? ' · ' + d.link.last_device.split(' · ')[0] : ''}` : 'Not opened yet') : 'Create a link to share it'}
              </span>
            </div>
          )}

          {/* Tabs */}
          <div ref={tabsRef} className="hub-scroll relative mt-3 flex gap-1 overflow-x-auto -mx-5 px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
            <div ref={indRef} className="absolute top-0 left-0 h-[46px] rounded-full pointer-events-none" style={{ background: 'linear-gradient(145deg, rgba(212,185,101,0.28), rgba(168,137,61,0.22))', border: '1px solid rgba(212,185,101,0.55)', boxShadow: '0 4px 20px rgba(201,168,76,0.18)' }} />
            {TABS.map((t) => {
              const on = tab === t.id; const Icon = t.icon;
              const badge = t.id === 'people' && d && d.people.count ? d.people.count : null;
              return (
                <button key={t.id} data-tab={t.id} onClick={() => { setTab(t.id); setArm(null); }}
                  className="relative z-10 flex-shrink-0 h-[46px] px-4 rounded-full flex items-center gap-2 text-[15px] font-bold whitespace-nowrap transition-colors duration-300"
                  style={{ color: on ? '#E9D18A' : 'rgba(255,255,255,0.55)' }}>
                  <Icon size={17} /> {t.label}
                  {badge ? <span className="min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-bold flex items-center justify-center" style={{ background: on ? GOLD : 'rgba(255,255,255,0.14)', color: on ? '#000' : '#fff' }}>{badge}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast */}
        {note && (
          <div className="absolute left-4 right-4 z-20 rounded-xl px-4 py-3 text-[15px] font-bold shadow-2xl hub-anim" style={{ bottom: 'max(18px, calc(10px + env(safe-area-inset-bottom, 0px)))', background: note.ok ? '#123524' : '#3a1414', color: note.ok ? '#7ef0b2' : '#fca5a5', border: '1px solid ' + (note.ok ? 'rgba(53,208,127,0.4)' : 'rgba(248,113,113,0.4)'), animation: 'hubPop 0.35s ease-out' }}>{note.text}</div>
        )}

        {/* Content */}
        <div ref={contentRef} className="relative flex-1 min-h-0 overflow-y-auto px-5 pt-2 space-y-3" style={{ paddingBottom: 'max(40px, calc(24px + env(safe-area-inset-bottom, 0px)))' }}>
          {!d ? (
            <div className="py-16 flex flex-col items-center gap-3 text-white/40">{err ? <p className="text-[16px] text-[#f87171]">{err}</p> : <><Loader2 size={28} className="animate-spin" /> Loading the Project Page…</>}</div>
          ) : tab === 'share' ? (
            <>
              {!d.link.has_link ? (
                <div data-anim className={card} style={glass}>
                  <p className="text-[18px] font-bold">There’s no link yet</p>
                  <p className="text-[16px] text-white/55 mt-1">Create one and {d.owner.first} can open their Project Page.</p>
                  <button onClick={() => linkAct('new', {}, 'Link created ✓')} disabled={!!busy} className="mt-3 w-full min-h-[54px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(145deg, #E2C878, #a8893d)' }}>{busy === 'new' ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />} Create their link</button>
                </div>
              ) : (
                <>
                  {!d.link.enabled && (
                    <div data-anim className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: 'rgba(240,160,75,0.1)', border: '1px solid rgba(240,160,75,0.45)' }}>
                      <p className="text-[16px] text-[#f5c08a] leading-snug"><strong>Paused.</strong> {d.owner.first} sees a “we’re making updates” page.</p>
                      <button onClick={() => linkAct('on', {}, 'Back on ✓')} disabled={!!busy} className="min-h-[48px] px-4 rounded-xl text-[15px] font-bold text-black flex-shrink-0" style={{ background: '#f0a04b' }}>{busy === 'on' ? '…' : 'Turn on'}</button>
                    </div>
                  )}
                  <button data-anim onClick={copy} className="relative overflow-hidden w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition" style={glass}>
                    <span className="hub-anim pointer-events-none absolute inset-y-0 w-1/3" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', animation: 'hubShimmer 3.5s ease-in-out infinite' }} />
                    <Link2 size={19} style={{ color: GOLD }} className="flex-shrink-0" />
                    <span className="min-w-0 flex-1 text-[15px] text-white/75 truncate font-mono">{(d.link.url || '').replace(/^https?:\/\//, '')}</span>
                    <span className="text-[14px] font-bold flex-shrink-0" style={{ color: copied ? '#35d07f' : GOLD }}>{copied ? 'Copied' : 'Tap to copy'}</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <a data-anim href={smsHref} className={tile} style={{ ...glass, background: 'linear-gradient(160deg, rgba(53,208,127,0.16), rgba(53,208,127,0.04))', borderColor: 'rgba(53,208,127,0.3)' }}>
                      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(53,208,127,0.18)' }}><MessageSquare size={21} className="text-[#35d07f]" /></span>
                      <span><span className="block text-[17px] font-bold">Text it</span><span className="block text-[14px] text-white/50">{d.owner.phone ? 'to ' + d.owner.first : 'pick who in Messages'}</span></span>
                    </a>
                    <button data-anim onClick={copy} className={tile} style={glass}>
                      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: copied ? 'rgba(53,208,127,0.2)' : 'rgba(201,168,76,0.16)' }}>{copied ? <Check size={21} className="text-[#35d07f]" style={{ animation: 'hubPop 0.4s ease-out' }} /> : <Copy size={20} style={{ color: GOLD }} />}</span>
                      <span><span className="block text-[17px] font-bold">{copied ? 'Copied!' : 'Copy link'}</span><span className="block text-[14px] text-white/50">paste anywhere</span></span>
                    </button>
                    {d.project.stage === 'estimate' && onSendEstimate ? (
                      <button data-anim onClick={() => { close(); window.setTimeout(onSendEstimate, 420); }} className={tile} style={glass}>
                        <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(109,179,242,0.16)' }}><Send size={20} className="text-[#6db3f2]" /></span>
                        <span><span className="block text-[17px] font-bold">{d.project.sent_at ? 'Email it again' : 'Email the estimate'}</span><span className="block text-[14px] text-white/50">{d.project.sent_at ? 'sent ' + ago(d.project.sent_at) : 'with a message'}</span></span>
                      </button>
                    ) : (
                      <button data-anim onClick={emailSignIn} disabled={!d.owner.email || !!busy} className={tile} style={glass}>
                        <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(109,179,242,0.16)' }}>{busy === 'signin' ? <Loader2 size={20} className="animate-spin text-[#6db3f2]" /> : <Mail size={20} className="text-[#6db3f2]" />}</span>
                        <span><span className="block text-[17px] font-bold">Email sign-in</span><span className="block text-[14px] text-white/50">{d.owner.email ? 'opens their projects' : 'no email on file'}</span></span>
                      </button>
                    )}
                    <a data-anim href={(d.link.url || '') + '?from=admin&tour=1'} target="_blank" rel="noreferrer" className={tile} style={glass}>
                      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.16)' }}><Eye size={20} className="text-[#c084fc]" /></span>
                      <span><span className="block text-[17px] font-bold">See it as them</span><span className="block text-[14px] text-white/50">exactly what they see</span></span>
                    </a>
                  </div>
                </>
              )}

              {/* Owner */}
              <div data-anim className={card + ' flex items-center gap-3'} style={glass}>
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-black flex-shrink-0" style={{ background: 'linear-gradient(145deg, #E2C878, #a8893d)' }}>{initials(d.owner.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold truncate">{d.owner.name}</span>
                  <span className="block text-[14px] text-white/45 truncate">{[d.owner.phone, d.owner.email].filter(Boolean).join(' · ') || 'No phone or email on file'}</span>
                </span>
                <span className="text-[13px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1" style={{
                  background: d.owner.access === 'password' ? 'rgba(53,208,127,0.14)' : d.owner.access === 'link' ? 'rgba(201,168,76,0.16)' : d.owner.access === 'no_email' ? 'rgba(248,113,113,0.14)' : 'rgba(255,255,255,0.08)',
                  color: d.owner.access === 'password' ? '#35d07f' : d.owner.access === 'link' ? '#D4B965' : d.owner.access === 'no_email' ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
                  {d.owner.access === 'password' ? <><KeyRound size={12} /> Password</> : d.owner.access === 'link' ? 'Signs in by link' : d.owner.access === 'no_email' ? 'No email' : 'Not signed in yet'}
                </span>
              </div>
              <p data-anim className="text-[14px] text-white/40 px-1">Want someone else to see it too — a spouse, architect or lender? <button onClick={() => setTab('people')} className="font-bold" style={{ color: GOLD }}>Add them in People →</button></p>
            </>
          ) : tab === 'people' ? (
            <div data-anim><ProjectPeople estimateId={estimateId} embedded onChanged={() => after()} /></div>
          ) : tab === 'see' ? (
            <>
              {d.project.stage === 'estimate' && <p data-anim className="text-[15px] text-white/50 px-1">Most of these show up once it becomes a job — set them now if you like.</p>}
              <p data-anim className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/40 px-1 pt-1">On their page</p>
              {([
                ['show_schedule', 'Coming up', 'Next two weeks of work, inspections and deliveries', CalendarDays, '#6db3f2'],
                ['show_inspections', 'Permits & inspections', 'Each permit and county inspection, with results', ShieldCheck, '#35d07f'],
                ['show_photos', 'Job photos', 'Photos from updates and the job site', Camera, '#c084fc'],
                ['show_assistant', 'Project assistant', 'Answers their questions from the job’s records', Sparkles, '#D4B965'],
              ] as const).map(([k, l, sub, Icon, c]) => (
                <button key={k} data-anim onClick={() => setFlag(k, !(d.see as any)[k])} disabled={!!busy} className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition" style={glass}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c + '22' }}><Icon size={19} style={{ color: c }} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{l}</span><span className="block text-[14px] text-white/45 leading-snug">{sub}</span></span>
                  <Switch on={!!(d.see as any)[k]} busy={busy === k} />
                </button>
              ))}
              <p data-anim className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/40 px-1 pt-2">They can</p>
              {([
                ['feedback_enabled', 'Ask questions & leave notes', 'Notes on any part of the job and the weekly check-in', MessageCircle, '#D4B965'],
                ['reviews_enabled', 'Rate the job', 'Star ratings land in Reviews', Star, '#F5B83D'],
                ['allow_customer_share', 'Invite people', 'Share it with a spouse, architect or lender (view only)', UserPlus, '#c084fc'],
              ] as const).map(([k, l, sub, Icon, c]) => (
                <button key={k} data-anim onClick={() => setFlag(k, !(d.see as any)[k])} disabled={!!busy} className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition" style={glass}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c + '22' }}><Icon size={19} style={{ color: c }} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{l}</span><span className="block text-[14px] text-white/45 leading-snug">{sub}</span></span>
                  <Switch on={!!(d.see as any)[k]} busy={busy === k} />
                </button>
              ))}
              <p data-anim className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/40 px-1 pt-2">Progress reports by email</p>
              <div data-anim className="rounded-2xl p-3" style={glass}>
                <div className="grid grid-cols-4 gap-1.5">
                  {[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['none', 'Off']].map(([v, l]) => {
                    const on = d.see.reporting_cadence === v;
                    return <button key={v} onClick={() => !on && setCadence(v)} disabled={!!busy} className="min-h-[50px] rounded-xl text-[15px] font-bold transition-all duration-300" style={on ? { background: 'linear-gradient(145deg, #E2C878, #a8893d)', color: '#000', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' } : { color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.03)' }}>{busy === 'cadence' && !on ? '…' : l}</button>;
                  })}
                </div>
                {d.see.reporting_cadence === 'weekly' && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto hub-scroll" style={{ scrollbarWidth: 'none' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dy) => (
                      <button key={dy} onClick={() => setCadence('weekly', dy)} disabled={!!busy} className="flex-shrink-0 min-h-[42px] px-3 rounded-lg text-[14px] font-bold" style={(d.see.reporting_day || 'Friday') === dy ? { background: 'rgba(201,168,76,0.2)', color: '#E9D18A', border: '1px solid rgba(201,168,76,0.5)' } : { color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}>{dy.slice(0, 3)}</button>
                    ))}
                  </div>
                )}
                <p className="text-[13px] text-white/40 mt-2 px-1">{d.see.reporting_cadence === 'none' ? 'No scheduled reports — updates you post still reach them.' : `A progress report email goes out ${d.see.reporting_cadence === 'weekly' ? 'every ' + (d.see.reporting_day || 'Friday') : d.see.reporting_cadence}. You review it before it sends.`}</p>
              </div>
            </>
          ) : tab === 'activity' ? (
            <>
              <div data-anim className="grid grid-cols-2 gap-2.5">
                {([
                  ['This week', d.pulse.opens_7d, 'opens', '#6db3f2'], ['Last 30 days', d.pulse.opens_30d, 'opens', '#35d07f'],
                  ['Time on page', d.pulse.avg_seconds != null ? Math.max(1, Math.round(d.pulse.avg_seconds / 60)) : 0, d.pulse.avg_seconds != null ? 'min avg' : 'no data yet', '#D4B965'],
                  ['Shared with', d.pulse.people, d.pulse.people === 1 ? 'person' : 'people', '#c084fc'],
                ] as const).map(([l, v, u, c]) => (
                  <div key={l} className="rounded-2xl p-4 relative overflow-hidden" style={glass}>
                    <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full" style={{ background: c + '1f' }} />
                    <p className="text-[13px] font-bold uppercase tracking-wide text-white/45">{l}</p>
                    <p className="text-[32px] font-bold leading-none mt-1.5 tabular-nums" style={{ color: c }}><CountUp value={Number(v)} reduced={reduced} /></p>
                    <p className="text-[13px] text-white/40 mt-1">{u}</p>
                  </div>
                ))}
              </div>
              {d.pulse.top_sections.length > 0 && (
                <div data-anim className="rounded-2xl p-4" style={glass}>
                  <p className="text-[13px] font-bold uppercase tracking-wide text-white/45 mb-2">What they read most</p>
                  <div className="space-y-2">
                    {d.pulse.top_sections.map((s) => {
                      const max = d.pulse.top_sections[0].n || 1;
                      return (
                        <div key={s.section} className="flex items-center gap-3">
                          <span className="w-28 flex-shrink-0 text-[14px] text-white/70">{SECTION_NAMES[s.section] || s.section}</span>
                          <span className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${Math.max(8, (s.n / max) * 100)}%`, background: 'linear-gradient(90deg, #a8893d, #E2C878)', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }} /></span>
                          <span className="w-8 text-right text-[14px] text-white/50 tabular-nums">{s.n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {people.length > 1 && (
                <div data-anim className="flex gap-1.5 overflow-x-auto hub-scroll -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
                  {['all', ...people].map((p) => (
                    <button key={p} onClick={() => setWho(p)} className="flex-shrink-0 min-h-[42px] px-4 rounded-full text-[14px] font-bold transition-all" style={who === p ? { background: 'rgba(201,168,76,0.2)', color: '#E9D18A', border: '1px solid rgba(201,168,76,0.55)' } : { color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>{p === 'all' ? 'Everyone' : p}</button>
                  ))}
                </div>
              )}
              {acts.length === 0 ? (
                <div data-anim className="rounded-2xl p-6 text-center" style={glass}>
                  <Clock size={26} className="mx-auto text-white/30" />
                  <p className="text-[16px] text-white/55 mt-2">Nothing yet. When {d.owner.first} or anyone shared opens the page, asks or approves something, it shows up here.</p>
                </div>
              ) : (
                <ol className="relative pl-2">
                  <span className="absolute left-[27px] top-3 bottom-3 w-px" style={{ background: 'linear-gradient(180deg, rgba(201,168,76,0.4), rgba(255,255,255,0.05))' }} />
                  {acts.slice(0, 60).map((a, i) => {
                    const k = KIND[a.kind] || KIND.open; const Icon = k.icon;
                    return (
                      <li key={i} data-anim className="relative flex gap-3 py-2.5">
                        <span className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#151515', border: '1px solid ' + k.color + '66', boxShadow: '0 0 14px ' + k.color + '22' }}><Icon size={17} style={{ color: k.color }} /></span>
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span className="block text-[16px] leading-snug"><strong className="text-white">{a.who}</strong> <span className="text-white/75">{a.what.charAt(0).toLowerCase() + a.what.slice(1)}</span></span>
                          {a.detail && <span className="block text-[14px] text-white/45 leading-snug mt-0.5 break-words">{a.detail}</span>}
                          <span className="block text-[13px] text-white/35 mt-0.5">{ago(a.at)} · {stamp(a.at)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          ) : (
            <>
              {d.link.has_link && (
                <button data-anim onClick={() => linkAct(d.link.enabled ? 'off' : 'on', {}, d.link.enabled ? 'Paused — they see “making updates”' : 'Back on ✓')} disabled={!!busy} className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition" style={{ ...glass, borderColor: d.link.enabled ? 'rgba(255,255,255,0.09)' : 'rgba(240,160,75,0.5)' }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(240,160,75,0.15)' }}>{d.link.enabled ? <Pause size={19} className="text-[#f0a04b]" /> : <Play size={19} className="text-[#f0a04b]" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{d.link.enabled ? 'Pause the page' : 'Paused — turn it back on'}</span><span className="block text-[14px] text-white/45 leading-snug">For a phone call or edits. Everyone sees “we’re making updates” until you turn it back on. Same links come back.</span></span>
                  <Switch on={!d.link.enabled} busy={busy === 'off' || busy === 'on'} />
                </button>
              )}

              {d.project.stage === 'estimate' && d.link.has_link && (
                <div data-anim className="rounded-2xl p-4" style={glass}>
                  <p className="text-[16px] font-bold">Offer expires</p>
                  <p className="text-[14px] text-white/45">{d.link.expires_at ? `Good through ${fmtDate(d.link.expires_at)}${d.link.expired ? ' — expired' : ''}.` : 'No expiration.'} Once they sign, it never expires.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[30, 60, 90].map((n) => <button key={n} onClick={() => linkAct('extend', { days: n }, `Good for ${n} more days ✓`)} disabled={!!busy} className="min-h-[46px] px-4 rounded-xl text-[15px] font-bold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>+{n} days</button>)}
                    <input type="date" value={customDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setCustomDate(e.target.value)} className="flex-1 min-w-[140px] min-h-[46px] px-3 rounded-xl bg-white/5 border border-white/10 text-[15px] text-white" />
                    <button onClick={() => customDate ? linkAct('expire_on', { date: customDate }, 'Expiration set ✓') : flash('Pick a day first', false)} disabled={!!busy} className="min-h-[46px] px-4 rounded-xl text-[15px] font-bold text-black" style={{ background: 'linear-gradient(145deg, #E2C878, #a8893d)' }}>Set</button>
                  </div>
                </div>
              )}

              <button data-anim onClick={() => twoTap('new', () => linkAct('new', {}, d.link.has_link ? 'New link ready — the old one is dead ✓' : 'Link created ✓'))} disabled={!!busy} className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition" style={{ ...glass, borderColor: arm === 'new' ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.09)' }}>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.15)' }}>{busy === 'new' ? <Loader2 size={19} className="animate-spin" style={{ color: GOLD }} /> : <RefreshCw size={19} style={{ color: GOLD }} />}</span>
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold" style={{ color: arm === 'new' ? '#E9D18A' : '#fff' }}>{arm === 'new' ? 'Tap again to replace it' : d.link.has_link ? 'Give them a new link' : 'Create their link'}</span><span className="block text-[14px] text-white/45 leading-snug">{d.link.has_link ? `${d.owner.first}’s old link stops working. People you shared with keep their own links.` : 'Makes their Project Page link.'}</span></span>
              </button>

              {d.link.has_link && (
                <button data-anim onClick={() => twoTap('kill', () => linkAct('kill', {}, 'Project Page turned off'))} disabled={!!busy} className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition" style={{ background: arm === 'kill' ? 'rgba(248,113,113,0.12)' : 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,' + (arm === 'kill' ? '0.6' : '0.25') + ')' }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.14)' }}>{busy === 'kill' ? <Loader2 size={19} className="animate-spin text-[#f87171]" /> : <Trash2 size={19} className="text-[#f87171]" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold text-[#fca5a5]">{arm === 'kill' ? 'Tap again — everyone loses access' : 'Turn off the Project Page'}</span><span className="block text-[14px] text-white/45 leading-snug">Nothing works — not {d.owner.first}, not anyone shared — until you create a new link. Pausing is usually better.</span></span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
