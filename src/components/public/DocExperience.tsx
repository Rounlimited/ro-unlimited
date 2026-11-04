'use client';

import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import {
  CheckCircle2, Check, Loader2, PenLine, CloudRain, Hammer, Flag, ClipboardCheck,
  AlertTriangle, Camera, X, FileText, Receipt, ChevronRight,
  FilePlus2, MessageCircle, Send, CreditCard, ShieldCheck, Star, PartyPopper, Upload, Paperclip, CalendarDays, Inbox,
} from 'lucide-react';

/**
 * DocExperience v2 — the animated layer of the customer document links.
 * Spec: memory ro-interactive-docs. Everything transform/opacity, once:true,
 * reduced-motion gated, native scroll, no confetti.
 *
 * v2 adds: per-card cascade inside the options section, slow cinematic zoom
 * on selected photos, a transient delta chip that floats off the sticky bar
 * when a pick changes the price, a first-reveal odometer roll of the total,
 * row-by-row financial stagger (.doc-rows), and a stamp-in for signatures.
 */

/* ── Shine sweep — the admin invoice-button shimmer, document edition ── */
export function ShineStyles() {
  return (
    <style>{`
      .doc-shine-loop { position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
        background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%);
        background-size: 250% 100%; animation: doc-shine-loop 3.2s ease-in-out infinite; }
      @keyframes doc-shine-loop { 0%, 100% { background-position: 200% 0; } 50% { background-position: -50% 0; } }
      .doc-shine-once { position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
        background: linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.5) 50%, transparent 58%);
        background-size: 260% 100%; background-position: 200% 0;
        animation: doc-shine-once 0.85s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes doc-shine-once { from { background-position: 200% 0; } to { background-position: -60% 0; } }
      @media (prefers-reduced-motion: reduce) { .doc-shine-loop, .doc-shine-once { animation: none; opacity: 0; } }
    `}</style>
  );
}

/* ── Entrance + scroll choreography ─────────────────────────── */
export function useDocIntro(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    let ctx: any;
    let cancelled = false;
    (async () => {
      const { gsap, ScrollTrigger } = await import('@/components/animations/GSAPProvider');
      if (cancelled) return;
      const main = document.getElementById('doc-main');
      if (!main) return;
      const sections = Array.from(main.children) as HTMLElement[];
      const aboveFold = sections.slice(0, 4);
      const below = sections.slice(4);

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', () => {
          // Above the fold: rise + settle, <1s total. Brand header (first
          // child) is a trust signal — visible frame 1, never animated.
          gsap.fromTo(aboveFold.slice(1),
            { y: 22, opacity: 0, scale: 0.988 },
            { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' }
          );
          const rule = main.querySelector('.doc-rule');
          if (rule) gsap.fromTo(rule, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.7, delay: 0.15, ease: 'power2.inOut' });

          // Below the fold: batched one-time section reveals
          if (below.length) {
            gsap.set(below, { y: 26, opacity: 0 });
            ScrollTrigger.batch(below, {
              start: 'top 88%',
              once: true,
              onEnter: (els: Element[]) => gsap.to(els, { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', clearProps: 'transform' }),
            });
          }

          // Inner cascades — option cards ripple in after their section lands
          const optCards = gsap.utils.toArray('#doc-options .opt-card') as Element[];
          if (optCards.length) {
            gsap.set(optCards, { y: 18, opacity: 0, scale: 0.96 });
            ScrollTrigger.batch(optCards, {
              start: 'top 92%',
              once: true,
              onEnter: (els: Element[]) => gsap.to(els, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' }),
            });
          }

          // Progress phase bars ripple in the same way option cards do
          const progRows = gsap.utils.toArray('#doc-progress .prog-row') as Element[];
          if (progRows.length) {
            gsap.set(progRows, { y: 14, opacity: 0 });
            ScrollTrigger.batch(progRows, {
              start: 'top 92%',
              once: true,
              onEnter: (els: Element[]) => gsap.to(els, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' }),
            });
          }

          // Financial/payment rows stack in one by one
          (gsap.utils.toArray('.doc-rows') as Element[]).forEach((container) => {
            const rows = Array.from(container.children);
            if (!rows.length) return;
            gsap.set(rows, { x: -14, opacity: 0 });
            ScrollTrigger.create({
              trigger: container,
              start: 'top 88%',
              once: true,
              onEnter: () => gsap.to(rows, { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' }),
            });
          });

          setTimeout(() => ScrollTrigger.refresh(), 600);
        });

        mm.add('(prefers-reduced-motion: reduce)', () => {
          gsap.fromTo(sections, { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.03 });
          gsap.set(['#doc-options .opt-card', '.doc-rows > *', '#doc-progress .prog-row'], { opacity: 1 });
        });
      }, main);
    })();
    return () => { cancelled = true; ctx?.revert?.(); };
  }, [ready]);
}

/* ── Reading progress bar — CSS scroll-driven, zero JS ──────── */
export function ReadingProgress() {
  return (
    <>
      <style>{`
        @supports (animation-timeline: scroll()) {
          .doc-progress { transform-origin: left; transform: scaleX(0); animation: doc-progress-grow linear; animation-timeline: scroll(); }
          @keyframes doc-progress-grow { to { transform: scaleX(1); } }
        }
        @supports not (animation-timeline: scroll()) { .doc-progress { display: none; } }
      `}</style>
      <div className="doc-progress fixed top-0 left-0 right-0 h-[3px] z-50" style={{ background: 'linear-gradient(90deg, #C9A84C, #D4772C)' }} />
    </>
  );
}

/* ── Options configurator ───────────────────────────────────── */
export interface PublicOptionChoice {
  id: string; label: string; description: string | null; image_url: string | null;
  price_delta: number; is_default: boolean; selected: boolean;
}
export interface PublicOptionGroup {
  id: string; label: string; description: string | null;
  selection_type: 'single' | 'multi' | 'addon'; required: boolean;
  choices: PublicOptionChoice[];
}

const fmtDelta = (n: number) =>
  n === 0 ? 'Included' : (n > 0 ? '+' : '−') + '$' + Math.abs(n).toLocaleString();

const thumb = (url: string) => url.includes('cdn.sanity.io') ? url + '?w=640&auto=format' : url;

export function OptionsSection({
  groups, selections, onToggle, onConfirm, confirmedAt, locked, busy, dirty,
}: {
  groups: PublicOptionGroup[];
  selections: Set<string>;
  onToggle: (group: PublicOptionGroup, choiceId: string) => void;
  onConfirm: () => void;
  confirmedAt: string | null;
  locked: boolean;
  busy: boolean;
  dirty: boolean;
}) {
  // remount key for the tapped card's delta so the pulse replays
  const [pulseId, setPulseId] = useState<string | null>(null);

  if (!groups.length) return null;

  if (locked) {
    const picks = groups.flatMap((g) => g.choices.filter((c) => c.selected).map((c) => ({ g, c })));
    if (!picks.length) return null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">Your Selections</h2>
        <div className="space-y-2 doc-rows">
          {picks.map(({ g, c }) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                {c.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={thumb(c.image_url)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-400">{g.label}</p>
                  <p className="text-[16px] font-semibold text-gray-800 truncate">{c.label}</p>
                </div>
              </div>
              <span className="text-[15px] font-semibold shrink-0" style={{ color: c.price_delta > 0 ? '#8a6d20' : '#9ca3af' }}>
                {fmtDelta(Number(c.price_delta))}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[14px] text-gray-400 mt-3">Locked in with your signature.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6" id="doc-options">
      <ShineStyles />
      <style>{`
        @keyframes badge-pop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .badge-pop { animation: badge-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .opt-img { transition: transform 5s cubic-bezier(0.22, 1, 0.36, 1); transform: scale(1); }
        .opt-card[data-selected="true"] .opt-img { transform: scale(1.09); }
        @keyframes delta-flash { 0% { transform: scale(1); } 35% { transform: scale(1.12); } 100% { transform: scale(1); } }
        .delta-flash { animation: delta-flash 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes title-underline { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) {
          .badge-pop, .delta-flash { animation: none; }
          .opt-img, .opt-card[data-selected="true"] .opt-img { transition: none; transform: none; }
        }
      `}</style>
      <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-1">Build It Your Way</h2>
      <p className="text-[15px] text-gray-500 mb-5">Tap to choose — the total updates as you go.</p>

      <div className="space-y-7">
        {groups.map((g) => (
          <div key={g.id} role={g.selection_type === 'single' ? 'radiogroup' : 'group'} aria-label={g.label}>
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-[18px] font-bold text-gray-900">{g.label}</h3>
              <span className="text-[13px] text-gray-400">
                {g.selection_type === 'single' ? 'Pick one' : g.selection_type === 'addon' ? 'Optional' : 'Pick any'}
              </span>
            </div>
            {g.description && <p className="text-[14px] text-gray-500 mb-3">{g.description}</p>}
            <div className={'grid gap-3 ' + (g.choices.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3')}>
              {g.choices.map((c) => {
                const isSel = selections.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role={g.selection_type === 'single' ? 'radio' : 'checkbox'}
                    aria-checked={isSel}
                    data-selected={isSel}
                    onClick={() => { onToggle(g, c.id); setPulseId(c.id + ':' + Date.now()); }}
                    className="opt-card relative text-left rounded-xl overflow-hidden transition-all duration-150 active:scale-[0.97]"
                    style={{
                      border: isSel ? '2px solid #C9A84C' : '2px solid #e5e7eb',
                      boxShadow: isSel ? '0 6px 20px rgba(201,168,76,0.28)' : 'none',
                    }}
                  >
                    {c.image_url ? (
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(c.image_url)} alt={c.label} loading="lazy" className="opt-img w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                        <span className="text-[26px] font-bold" style={{ color: isSel ? '#C9A84C' : '#d1d5db' }}>
                          {c.label.charAt(0)}
                        </span>
                      </div>
                    )}
                    {isSel && pulseId?.startsWith(c.id + ':') && (
                      <span key={pulseId} className="doc-shine-once z-10" aria-hidden="true" />
                    )}
                    {isSel && (
                      <span className="badge-pop absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: '#C9A84C', boxShadow: '0 2px 8px rgba(201,168,76,0.5)' }}>
                        <Check size={16} className="text-black" strokeWidth={3} />
                      </span>
                    )}
                    <div className="p-2.5">
                      <p className="text-[15px] font-semibold text-gray-900 leading-tight">{c.label}</p>
                      {c.description && <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>}
                      <p
                        key={pulseId?.startsWith(c.id + ':') ? pulseId : c.id}
                        className={'text-[17px] font-bold mt-1 inline-block' + (isSel && pulseId?.startsWith(c.id + ':') ? ' delta-flash' : '')}
                        style={{ color: Number(c.price_delta) > 0 ? '#8a6d20' : '#6b7280' }}
                      >
                        {fmtDelta(Number(c.price_delta))}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {confirmedAt && !dirty ? (
          <div className="flex items-center gap-2.5 rounded-xl p-4" style={{ background: '#e8f8f0', border: '1px solid #b5e6cd' }}>
            <CheckCircle2 size={20} style={{ color: '#187a4b' }} />
            <p className="text-[15px] font-semibold" style={{ color: '#187a4b' }}>
              Selections confirmed — we&apos;ve been notified. Change your mind any time before signing.
            </p>
          </div>
        ) : (
          <button
            onClick={onConfirm}
            disabled={busy}
            className="relative overflow-hidden w-full sm:w-auto min-h-[54px] px-8 rounded-xl bg-[#C9A84C] text-black text-[16px] font-bold disabled:opacity-50 active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
          >
            <span className="doc-shine-loop" aria-hidden="true" />
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
            Confirm My Selections
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Sticky total bar — odometer roll-in + floating delta chips ── */
export function StickyTotalBar({
  baseTotal, delta, selectionCount, signed, hasOptions,
}: {
  baseTotal: number; delta: number; selectionCount: number; signed: boolean; hasOptions: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [chips, setChips] = useState<{ id: number; text: string; up: boolean }[]>([]);
  const prevTotal = useRef<number | null>(null);
  const total = baseTotal + delta;

  // Slide up after the intro settles, then odometer-roll the total in from 0
  // (count-up on FIRST reveal only — after that, digits roll by difference).
  useEffect(() => {
    const t1 = setTimeout(() => setShown(true), 900);
    const t2 = setTimeout(() => { setDisplayTotal(total); prevTotal.current = total; }, 1250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subsequent changes: roll the digits + float a delta chip off the total
  useEffect(() => {
    if (prevTotal.current === null) return;
    if (total === prevTotal.current) return;
    const diff = total - prevTotal.current;
    prevTotal.current = total;
    setDisplayTotal(total);
    const id = Date.now();
    setChips((c) => [...c.slice(-2), { id, text: (diff > 0 ? '+' : '−') + '$' + Math.abs(diff).toLocaleString(), up: diff > 0 }]);
    const t = setTimeout(() => setChips((c) => c.filter((x) => x.id !== id)), 1100);
    return () => clearTimeout(t);
  }, [total]);

  const scrollToSign = () => document.getElementById('accept-sign')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40"
      style={{
        transform: shown ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ShineStyles />
      <style>{`
        @keyframes chip-float { 0% { opacity: 0; transform: translateY(6px) scale(0.9); } 20% { opacity: 1; transform: translateY(0) scale(1); } 75% { opacity: 1; } 100% { opacity: 0; transform: translateY(-22px) scale(0.95); } }
        .chip-float { animation: chip-float 1.05s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .chip-float { animation: none; opacity: 0; } }
      `}</style>
      <div
        className="max-w-4xl mx-auto border-t sm:border sm:rounded-t-2xl border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 backdrop-blur relative"
        style={{ background: 'rgba(255,255,255,0.97)' }}
      >
        <div className="min-w-0 relative">
          <p className="text-[12px] uppercase tracking-wider text-gray-400 leading-none mb-1">
            {signed ? 'Signed total' : hasOptions ? 'Your total' : 'Total'}
          </p>
          <div className="text-[24px] font-bold text-gray-900 leading-none tabular-nums">
            <NumberFlow
              value={displayTotal}
              format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
              transformTiming={{ duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
              spinTiming={{ duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </div>
          {hasOptions && !signed && (
            <p className="text-[12px] text-gray-400 mt-0.5">{selectionCount} selection{selectionCount === 1 ? '' : 's'}</p>
          )}
          {/* floating delta chips */}
          <div className="absolute -top-5 left-0 pointer-events-none">
            {chips.map((ch) => (
              <span key={ch.id} className="chip-float absolute left-0 text-[15px] font-bold whitespace-nowrap px-2 py-0.5 rounded-full"
                style={{ background: ch.up ? 'rgba(201,168,76,0.15)' : 'rgba(24,122,75,0.12)', color: ch.up ? '#8a6d20' : '#187a4b' }}>
                {ch.text}
              </span>
            ))}
          </div>
        </div>
        {signed ? (
          <span className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl text-[15px] font-bold shrink-0" style={{ background: '#e8f8f0', color: '#187a4b' }}>
            <CheckCircle2 size={17} /> Signed
          </span>
        ) : (
          <button
            onClick={scrollToSign}
            className="relative overflow-hidden inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl bg-[#C9A84C] text-black text-[16px] font-bold shrink-0 active:scale-[0.97] transition-transform"
          >
            <span className="doc-shine-loop" aria-hidden="true" />
            <PenLine size={17} /> Review &amp; Sign
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Signature stamp-in (accepted state) ────────────────────── */
export function SignatureStamp({ src, name, date }: { src: string; name: string; date: string }) {
  return (
    <div className="flex items-center gap-4 mt-3">
      <style>{`
        @keyframes stamp-in { 0% { transform: scale(1.25) rotate(-3deg); opacity: 0; } 60% { transform: scale(0.97) rotate(0.5deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        .stamp-in { animation: stamp-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
        @media (prefers-reduced-motion: reduce) { .stamp-in { animation: none; opacity: 1; } }
      `}</style>
      <div className="stamp-in bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Signature" className="h-12 w-auto" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-800">{name}</p>
        <p className="text-[13px] text-gray-400">{date}</p>
      </div>
    </div>
  );
}

/* ── The signing ceremony finish — checkmark draws, gold wash ── */
export function CeremonyDone({ name, docWord }: { name: string; docWord: string }) {
  return (
    <div className="relative text-center py-4 overflow-hidden rounded-xl">
      <style>{`
        .cd-wash { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 60% at 50% 30%, rgba(201,168,76,0.14), transparent 70%); opacity: 0; animation: cd-wash-in 0.9s ease-out 0.5s both; }
        @keyframes cd-wash-in { to { opacity: 1; } }
        .cd-circle { stroke-dasharray: 166; stroke-dashoffset: 166; animation: cd-draw 0.45s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .cd-check { stroke-dasharray: 48; stroke-dashoffset: 48; animation: cd-draw 0.25s 0.45s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .cd-settle { animation: cd-settle 0.3s 0.65s ease-out both; }
        @keyframes cd-draw { to { stroke-dashoffset: 0; } }
        @keyframes cd-settle { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .cd-step { opacity: 0; animation: cd-rise 0.45s cubic-bezier(0.23, 1, 0.32, 1) both; }
        @keyframes cd-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .cd-circle, .cd-check { animation: none; stroke-dashoffset: 0; }
          .cd-settle, .cd-step, .cd-wash { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      <div className="cd-wash" aria-hidden="true" />
      <svg className="cd-settle relative mx-auto mb-4" width="88" height="88" viewBox="0 0 56 56">
        <circle className="cd-circle" cx="28" cy="28" r="26" fill="none" stroke="#187a4b" strokeWidth="2.5" />
        <path className="cd-check" fill="none" stroke="#187a4b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M16 29 l8 8 l16 -17" />
      </svg>
      <h2 className="cd-step relative text-[24px] font-bold text-gray-900 mb-1" style={{ animationDelay: '0.55s' }}>
        You&apos;re all set{name ? ', ' + name.split(' ')[0] : ''}.
      </h2>
      <p className="cd-step relative text-[16px] text-gray-500 mb-5" style={{ animationDelay: '0.62s' }}>
        The {docWord} is signed and on record.
      </p>
      <div className="relative text-left max-w-sm mx-auto space-y-2.5">
        {[
          'We got the signed copy instantly — no need to send anything.',
          'RO will reach out about scheduling and next steps.',
          'Questions any time: (864) 304-0139.',
        ].map((t, i) => (
          <div key={i} className="cd-step flex items-start gap-2.5" style={{ animationDelay: 0.7 + i * 0.06 + 's' }}>
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: '#187a4b' }} />
            <p className="text-[15px] text-gray-600">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Live job progress — the customer's side of JR's Progress tab ──
   Percentages only. His schedule/budget flags never leave the admin. */
export function ProgressSection({ progress, docWord }: {
  progress: { percent: number; phases: { phase: string; percent: number }[]; in_progress?: string | null; next_up: string | null; updated_at: string | null };
  docWord: string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Bars grow and the odometer rolls once the section is actually on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(progress.percent); return; }
    let fired = false;
    const reveal = () => { if (!fired) { fired = true; setShown(progress.percent); } };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { reveal(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    // Belt and braces: the customer must never be shown a stuck 0%.
    const t = setTimeout(reveal, 1400);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [progress.percent]);

  const done = progress.percent >= 100;
  const updated = progress.updated_at
    ? new Date(progress.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <section id="doc-progress" ref={ref} className="rounded-2xl border bg-white p-5 sm:p-6"
      style={{ borderColor: '#ead9ac' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>
            Your Project
          </p>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1a1a1a] mt-0.5">
            {done ? 'Work Complete' : 'Progress to Date'}
          </h2>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[38px] sm:text-[44px] font-bold leading-none tabular-nums"
            style={{ color: done ? '#187a4b' : '#C9A84C' }}>
            <NumberFlow value={shown} suffix="%" />
          </p>
        </div>
      </div>

      <div className="h-3.5 rounded-full overflow-hidden mb-5" style={{ background: '#f0ece2' }}>
        <div className="h-full rounded-full"
          style={{
            width: shown + '%',
            background: done ? '#187a4b' : 'linear-gradient(90deg, #a8893d, #C9A84C)',
            transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
      </div>

      <div className="space-y-3.5">
        {progress.phases.map((p) => (
          <div key={p.phase} className="prog-row">
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className="text-[16px] font-semibold text-[#2a2a2a] truncate flex items-center gap-1.5">
                {p.percent >= 100 && <CheckCircle2 size={16} style={{ color: '#187a4b' }} className="shrink-0" />}
                {p.phase}
              </p>
              <p className="text-[15px] font-bold shrink-0 tabular-nums"
                style={{ color: p.percent >= 100 ? '#187a4b' : p.percent > 0 ? '#8a6d20' : '#9ca3af' }}>
                {p.percent >= 100 ? 'Complete' : p.percent + '%'}
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f0ece2' }}>
              <div className="h-full rounded-full"
                style={{
                  width: (shown ? p.percent : 0) + '%',
                  background: p.percent >= 100 ? '#187a4b' : 'linear-gradient(90deg, #a8893d, #C9A84C)',
                  transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: '#f0ece2' }}>
        {progress.in_progress && !done ? (
          <p className="text-[15px] text-[#4a4a4a]">
            <span className="font-semibold">In progress:</span> {progress.in_progress}
            {progress.next_up && <span className="text-[#9ca3af]"> · up next: {progress.next_up}</span>}
          </p>
        ) : progress.next_up && !done ? (
          <p className="text-[15px] text-[#4a4a4a]">
            <span className="font-semibold">Up next:</span> {progress.next_up}
          </p>
        ) : (
          <p className="text-[15px] text-[#4a4a4a]">
            {done ? 'All phases of this ' + docWord + ' are complete.' : 'Work is underway.'}
          </p>
        )}
        {updated && <p className="text-[14px] text-[#9ca3af]">Updated {updated}</p>}
      </div>
    </section>
  );
}

/* ── The living project: what happened, in order ──────────────────
   Straight from JR's job log — only the entries he's left switched on. */
export function StorySection({ story }: {
  story: { entry_date: string; type: string; text: string | null; photos?: { url: string; caption?: string | null }[] }[];
}) {
  const [showAll, setShowAll] = useState(false);
  const [openPhoto, setOpenPhoto] = useState<{ url: string; caption?: string | null } | null>(null);
  const thumb = (u: string, w: number) => (u.includes('cdn.sanity.io') ? `${u}?w=${w}&auto=format` : u);
  if (!story.length) return null;

  const shown = showAll ? story : story.slice(0, 6);
  const icon = (t: string) =>
    t === 'rain' ? CloudRain : t === 'milestone' ? Flag : t === 'inspection' ? ClipboardCheck
      : t === 'delay' ? AlertTriangle : t === 'schedule' ? CalendarDays : t === 'approval' ? CheckCircle2
      : t === 'payment' ? CreditCard : t === 'request' ? Upload : t === 'update' ? MessageCircle : Hammer;
  const color = (t: string) =>
    t === 'rain' ? '#5ba3dc' : t === 'milestone' ? '#187a4b' : t === 'inspection' ? '#7c5cd6'
      : t === 'delay' ? '#c2410c' : t === 'approval' || t === 'payment' ? '#187a4b' : t === 'request' ? '#5ba3dc' : '#8a6d20';

  const day = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-4" style={{ color: '#8a6d20' }}>
        What&rsquo;s Been Happening
      </p>

      <div className="doc-rows space-y-4">
        {shown.map((e, i) => {
          const Icon = icon(e.type);
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: color(e.type) + '15', border: '1px solid ' + color(e.type) + '35' }}>
                  <Icon size={16} style={{ color: color(e.type) }} />
                </div>
                {i < shown.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: '#f0ece2' }} />}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[14px] text-[#9ca3af]">{day(e.entry_date)}</p>
                <p className="text-[17px] text-[#2a2a2a] leading-snug">
                  {e.text || (e.type === 'rain' ? 'Rained out — no work on site.' : '')}
                </p>
                {Array.isArray(e.photos) && e.photos.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mr-5 pr-5">
                    {e.photos.map((p, j) => (
                      <button key={j} type="button" onClick={() => setOpenPhoto(p)} className="shrink-0 rounded-lg overflow-hidden active:scale-[0.98]" style={{ width: 112, height: 84, background: '#f0ece2' }} aria-label={p.caption || 'Site photo'}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(p.url, 300)} alt={p.caption || 'Site photo'} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {story.length > 6 && (
        <button onClick={() => setShowAll((v) => !v)}
          className="mt-4 min-h-[48px] px-4 rounded-xl text-[15px] font-bold"
          style={{ background: '#fdf6e7', color: '#8a6d20', border: '1px solid #ead9ac' }}>
          {showAll ? 'Show less' : `Show all ${story.length} days`}
        </button>
      )}
      {openPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setOpenPhoto(null)}>
          <button type="button" aria-label="Close" className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)' }}><X size={22} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb(openPhoto.url, 1600)} alt={openPhoto.caption || 'Site photo'} className="max-w-full max-h-[85vh] rounded-xl object-contain" />
          {openPhoto.caption && <p className="absolute bottom-6 left-0 right-0 text-center text-white text-[16px] px-6">{openPhoto.caption}</p>}
        </div>
      )}
    </section>
  );
}

/* ── What's next on the calendar — one line, always "estimated" ──────── */
export function NextUpCard({ item }: { item: { title: string; kind: string; starts_on: string } }) {
  const when = new Date(item.starts_on + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const days = Math.round((new Date(item.starts_on + 'T12:00:00').getTime() - Date.now()) / 86400000);
  return (
    <section className="rounded-2xl border bg-white p-5 flex items-start gap-3" style={{ borderColor: '#f0ece2' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fdf6e7', border: '1px solid #ead9ac' }}><CalendarDays size={18} style={{ color: '#8a6d20' }} /></div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>What&rsquo;s next</p>
        <p className="text-[18px] font-semibold text-[#2a2a2a] leading-snug">{item.title}</p>
        <p className="text-[15px] text-gray-500">{days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`} &mdash; {when} <span className="text-gray-400">(estimated; weather and inspections move dates)</span></p>
      </div>
    </section>
  );
}

/* ── Requests from RO: "we need the HOA letter" with an upload button ──── */
type CustomerRequest = { id: string; kind: string; title: string; details: string | null; due_on: string | null; status: string; response_text: string | null; files: { name: string; url: string }[]; created_at: string; submitted_at: string | null; done_at: string | null };
export function RequestsSection({ token, requests, onDone }: { token: string; requests: CustomerRequest[]; onDone: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const open = requests.filter((r) => r.status === 'open');
  const submitted = requests.filter((r) => r.status === 'submitted');
  const done = requests.filter((r) => r.status === 'done');
  if (!requests.length) return null;
  const due = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : null;
  const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const send = async (r: CustomerRequest) => {
    if (!text.trim() && !files.length) { setError(r.kind === 'document' ? 'Add the file (or a photo of it) first.' : 'Write your answer first.'); return; }
    setError(null);
    try {
      const uploaded: any[] = [];
      for (let i = 0; i < files.length; i++) {
        setBusy(`Sending file ${i + 1} of ${files.length}…`);
        const fd = new FormData(); fd.append('request_id', r.id); fd.append('file', files[i]);
        const res = await fetch('/api/estimate/' + token + '/requests', { method: 'PUT', body: fd });
        const d = await res.json();
        if (!res.ok || d.error) throw new Error(d.error || 'Upload failed');
        uploaded.push(d);
      }
      setBusy('Sending…');
      const res = await fetch('/api/estimate/' + token + '/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: r.id, text: text.trim(), files: uploaded }) });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Could not send');
      setText(''); setFiles([]); setActive(null); onDone();
    } catch (e: any) { setError(e?.message || 'Could not send that — please call us.'); }
    setBusy('');
  };

  return (
    <section id="requests" className="rounded-2xl border bg-white p-5 sm:p-6 scroll-mt-24" style={{ borderColor: open.length ? '#ead9ac' : '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>Requests from RO</p>
      <p className="text-[16px] text-[#4b5563] mb-4">{open.length ? 'Send these right from your phone — a clear photo of a document works fine.' : 'Nothing open right now. Everything you\u2019ve sent is below.'}</p>
      <div className="space-y-3">
        {open.map((r) => (
          <div key={r.id} className="rounded-xl p-4" style={{ background: '#fdf6e7', border: '1px solid #ead9ac' }}>
            <p className="text-[18px] font-bold text-[#2a2a2a] leading-snug">{r.title}</p>
            {r.due_on && <p className="text-[15px] font-semibold mt-0.5" style={{ color: '#8a6d20' }}>Needed by {due(r.due_on)}</p>}
            {r.details && <p className="text-[16px] text-[#4b5563] mt-2 whitespace-pre-line">{r.details}</p>}
            {active === r.id ? (
              <div className="mt-3 space-y-3">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={r.kind === 'document' ? 'Anything we should know about it (optional)' : 'Your answer'}
                  className="w-full rounded-xl border px-4 py-3 text-[17px] text-[#1a1a1a] bg-white outline-none focus:border-[#C9A84C]" style={{ borderColor: '#e5e0d2' }} />
                <label className="flex items-center gap-3 min-h-[52px] rounded-xl px-4 cursor-pointer" style={{ background: '#fff', border: '1px dashed #C9A84C' }}>
                  <Upload size={20} style={{ color: '#8a6d20' }} />
                  <span className="text-[16px] font-semibold text-[#2a2a2a]">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready` : 'Add a photo or PDF'}</span>
                  <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 6))} />
                </label>
                {files.length > 0 && <ul className="text-[15px] text-gray-600 space-y-0.5">{files.map((f, i) => <li key={i} className="flex items-center gap-1.5"><Paperclip size={14} /> {f.name}</li>)}</ul>}
                {error && <p className="text-[16px] font-semibold" style={{ color: '#b45309' }}>{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setActive(null); setFiles([]); setText(''); setError(null); }} disabled={!!busy} className="min-h-[52px] rounded-xl text-[16px] font-bold" style={{ background: '#fff', color: '#4b5563', border: '1px solid #e5e0d2' }}>Cancel</button>
                  <button type="button" onClick={() => send(r)} disabled={!!busy} className="min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                    {busy ? <><Loader2 size={18} className="animate-spin" /> {busy}</> : <><Send size={18} /> Send to RO</>}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => { setActive(r.id); setError(null); }} className="mt-3 w-full min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99]" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                {r.kind === 'document' ? <><Upload size={18} /> Upload it</> : <><Send size={18} /> Answer</>}
              </button>
            )}
          </div>
        ))}
        {submitted.map((r) => (
          <div key={r.id} className="rounded-xl p-4" style={{ background: '#e9f7ef', border: '1px solid #bfe6cf' }}>
            <p className="text-[17px] font-bold text-[#2a2a2a] leading-snug">{r.title}</p>
            <p className="text-[15px] font-semibold mt-0.5" style={{ color: '#187a4b' }}>Received {r.submitted_at ? when(r.submitted_at) : ''} &mdash; thank you. RO will take it from here.</p>
            {r.response_text && <p className="text-[16px] text-[#4b5563] mt-1 whitespace-pre-line">{r.response_text}</p>}
            {r.files.length > 0 && <ul className="mt-1 text-[15px] text-gray-600 space-y-0.5">{r.files.map((f, i) => <li key={i} className="flex items-center gap-1.5"><Paperclip size={14} /> {f.name}</li>)}</ul>}
          </div>
        ))}
        {done.length > 0 && (
          <button type="button" onClick={() => setShowDone((v) => !v)} className="min-h-[44px] text-[15px] font-semibold text-gray-500 inline-flex items-center gap-1.5"><Inbox size={15} /> {showDone ? 'Hide' : 'Show'} {done.length} completed</button>
        )}
        {showDone && done.map((r) => (
          <div key={r.id} className="rounded-xl p-3" style={{ background: '#f7f7f5', border: '1px solid #e8e4da' }}>
            <p className="text-[16px] font-semibold text-gray-600">{r.title} <span className="font-normal text-gray-400">&mdash; done {r.done_at ? when(r.done_at) : ''}</span></p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Coming up: the two-week look-ahead, every date "estimated" ────── */
export function ScheduleSection({ items, rainDays }: { items: { id: string; title: string; kind: string; starts_on: string; ends_on: string | null }[]; rainDays: number }) {
  if (!items.length) return null;
  const today = new Date().toLocaleDateString('en-CA');
  const label = (d: string) => {
    const days = Math.round((new Date(d + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000);
    const when = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return days <= 0 ? `Today — ${when}` : days === 1 ? `Tomorrow — ${when}` : when;
  };
  const kindWord: Record<string, string> = { work: 'Work on site', pour: 'Concrete pour', inspection: 'Inspection', delivery: 'Delivery', meeting: 'Meeting', other: '' };
  return (
    <section id="schedule" className="rounded-2xl border bg-white p-5 sm:p-6 scroll-mt-24" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>Coming Up — next two weeks</p>
      <p className="text-[15px] text-gray-500 mb-4">Every date is estimated. Weather, inspectors and material deliveries move things; when a date moves we post it here and let you know.</p>
      <div className="doc-rows space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fdf6e7', border: '1px solid #ead9ac' }}><CalendarDays size={16} style={{ color: '#8a6d20' }} /></div>
            <div className="min-w-0">
              <p className="text-[14px] text-[#9ca3af]">{label(it.starts_on)}{it.ends_on && it.ends_on > it.starts_on ? ` through ${new Date(it.ends_on + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : ''}</p>
              <p className="text-[17px] text-[#2a2a2a] leading-snug font-semibold">{it.title}{kindWord[it.kind] ? <span className="font-normal text-gray-500"> · {kindWord[it.kind]}</span> : null}</p>
            </div>
          </div>
        ))}
      </div>
      {rainDays > 0 && <p className="text-[15px] text-gray-500 mt-4">Rain days on this job so far: {rainDays}. They don&rsquo;t count against the schedule.</p>}
    </section>
  );
}

/* ── Permits & inspections: the county record, in words ────────────── */
export function InspectionsSection({ records }: { records: { id: string; record_type: string; title: string; agency: string | null; reference: string | null; scheduled_on: string | null; time_window: string | null; status: string; result_on: string | null; notes: string | null }[] }) {
  if (!records.length) return null;
  const WORD: Record<string, string> = { scheduled: 'Scheduled', passed: 'Passed', corrections: 'Corrections needed', failed: 'Did not pass', reinspection: 'Re-inspection scheduled', cancelled: 'Cancelled', applied: 'Applied for', issued: 'Issued', closed: 'Closed out', expired: 'Expired' };
  const tone = (s: string) => s === 'passed' || s === 'issued' || s === 'closed' ? { bg: '#e9f7ef', color: '#187a4b' } : s === 'corrections' || s === 'failed' ? { bg: '#fdf1e7', color: '#b45309' } : { bg: '#fdf6e7', color: '#8a6d20' };
  const day = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : null;
  const permits = records.filter((r) => r.record_type === 'permit'), insp = records.filter((r) => r.record_type !== 'permit');
  const Row = ({ r }: { r: typeof records[number] }) => {
    const t = tone(r.status);
    return (
      <div className="rounded-xl px-4 py-3" style={{ background: '#faf9f6', border: '1px solid #f0ece2' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-[17px] font-semibold text-[#2a2a2a] leading-snug">{r.title}</p>
          <span className="px-3 py-1 rounded-full text-[14px] font-bold shrink-0" style={{ background: t.bg, color: t.color }}>{WORD[r.status] || r.status}</span>
        </div>
        <p className="text-[15px] text-gray-500 mt-1">
          {r.record_type === 'permit'
            ? [r.agency, r.reference ? `Permit #${r.reference}` : null, r.result_on ? `${WORD[r.status] || ''} ${day(r.result_on)}` : null].filter(Boolean).join(' · ')
            : [r.scheduled_on ? `${r.status === 'passed' || r.status === 'failed' || r.status === 'corrections' ? 'Inspected' : 'Estimated'} ${day(r.result_on || r.scheduled_on)}` : 'Date to be set', r.time_window, r.agency, r.reference ? `Ref #${r.reference}` : null].filter(Boolean).join(' · ')}
        </p>
        {r.notes && <p className="text-[16px] text-[#4b5563] mt-1.5 whitespace-pre-line">{r.notes}</p>}
      </div>
    );
  };
  return (
    <section id="inspections" className="rounded-2xl border bg-white p-5 sm:p-6 scroll-mt-24" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>Permits &amp; Inspections</p>
      <p className="text-[15px] text-gray-500 mb-4">The county&rsquo;s record on your job. RO schedules the inspections and handles any corrections; you only need to act if it shows under Needs You.</p>
      <div className="space-y-2">
        {permits.map((r) => <Row key={r.id} r={r} />)}
        {insp.map((r) => <Row key={r.id} r={r} />)}
      </div>
    </section>
  );
}

/* ── Who to reach, and when ────────────────────────────────────────── */
export function TeamCard() {
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: '#8a6d20' }}>Your RO Team</p>
      <p className="text-[17px] text-[#2a2a2a] leading-snug">RO Unlimited is the licensed contractor on this job and the one accountable for it. One number reaches us.</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a href="tel:+18643040139" className="min-h-[52px] rounded-xl px-4 flex items-center gap-3 active:scale-[0.99]" style={{ background: '#fdf6e7', border: '1px solid #ead9ac' }}>
          <span className="text-[17px] font-bold" style={{ color: '#8a6d20' }}>(864) 304-0139</span><span className="text-[15px] text-gray-500">Call or text</span>
        </a>
        <div className="min-h-[52px] rounded-xl px-4 flex items-center" style={{ background: '#faf9f6', border: '1px solid #f0ece2' }}>
          <span className="text-[16px] text-[#2a2a2a]"><strong>Office hours</strong> Mon&ndash;Sat 7am&ndash;6pm</span>
        </div>
      </div>
      <p className="text-[15px] text-gray-500 mt-3">After hours, ask your question right here on this page &mdash; it&rsquo;s answered the next business morning and stays on record. If something on site can&rsquo;t wait, call the number above.</p>
    </section>
  );
}

/* ── Photos from site ─────────────────────────────────────────── */
export function SitePhotos({ photos }: { photos: { url: string; caption?: string | null }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!photos.length) return null;
  const src = (u: string, w: number) => (u.includes('cdn.sanity.io') ? `${u}?w=${w}&auto=format` : u);

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#8a6d20' }}>
        <Camera size={14} /> From the Jobsite
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {photos.map((p, i) => (
          <button key={i} onClick={() => setOpen(p.url)}
            className="rounded-xl overflow-hidden border active:scale-95 transition-transform"
            style={{ borderColor: '#f0ece2' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(p.url, 500)} alt={p.caption || 'Jobsite photo'} loading="lazy"
              className="w-full h-32 sm:h-36 object-cover" />
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85"
          onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(open, 1400)} alt="Jobsite photo" className="max-w-full max-h-full rounded-xl" />
          <button onClick={() => setOpen(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
            <X size={22} className="text-white" />
          </button>
        </div>
      )}
    </section>
  );
}

/* ── Everything to do with this job, in one place ─────────────── */
export function DocumentsSection({ documents }: {
  documents: { kind: string; title: string; date: string | null; detail: string; href: string | null; paid?: boolean }[];
}) {
  if (!documents.length) return null;
  const when = (d: string | null) =>
    d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: '#8a6d20' }}>
        Your Paperwork
      </p>
      <div className="doc-rows space-y-2">
        {documents.map((d, i) => {
          const Icon = d.kind === 'invoice' ? Receipt : FileText;
          const body = (
            <>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: d.kind === 'invoice' ? '#e8f8f0' : '#fdf6e7' }}>
                <Icon size={18} style={{ color: d.kind === 'invoice' ? '#187a4b' : '#8a6d20' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-[#2a2a2a] truncate">{d.title}</p>
                <p className="text-[14px] text-[#6b7280]">
                  {[when(d.date), d.detail].filter(Boolean).join(' · ')}
                </p>
              </div>
              {d.href && <ChevronRight size={18} className="text-[#c9c3b5] shrink-0" />}
            </>
          );
          return d.href ? (
            <a key={i} href={d.href}
              className="flex items-center gap-3 rounded-xl p-3 border transition-colors"
              style={{ borderColor: '#f0ece2' }}>
              {body}
            </a>
          ) : (
            <div key={i} className="flex items-center gap-3 rounded-xl p-3 border" style={{ borderColor: '#f0ece2' }}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}


/* ── Extra work, waiting on them ──────────────────────────────────
   Approved on the same page they signed the contract on, so there's no
   separate paperwork and no "reply to approve" nobody can find later. */
export function ChangeOrders({ token, orders, onDone }: {
  token: string;
  orders: {
    id: string; number: string | null; title: string; description: string | null;
    amount: number; days_added: number; status: string;
    approved_at: string | null; approved_name: string | null;
  }[];
  onDone: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!orders.length) return null;
  const money = (n: number) => (n >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(n)).toLocaleString();
  const waiting = orders.filter((o) => o.status === 'sent');

  const answer = async (id: string, decision: 'approve' | 'decline') => {
    if (decision === 'approve' && !name.trim()) { setError('Please type your name to approve'); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/estimate/' + token + '/change-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_order_id: id, decision, name: name.trim() }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else { setOpenId(null); setName(''); onDone(); }
    } catch { setError('Something went wrong — please call us.'); }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border p-5 sm:p-6"
      style={{ background: waiting.length ? '#fdf6e7' : '#fff', borderColor: waiting.length ? '#ead9ac' : '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5" style={{ color: '#8a6d20' }}>
        <FilePlus2 size={14} /> Extra Work
      </p>
      {waiting.length > 0 && (
        <p className="text-[16px] text-[#4a4a4a] mb-4">
          {waiting.length === 1 ? 'One item needs' : `${waiting.length} items need`} your approval before we go ahead.
        </p>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const open = openId === o.id;
          const done = o.status === 'approved' || o.status === 'declined';
          return (
            <div key={o.id} className="rounded-xl border bg-white p-4" style={{ borderColor: '#f0ece2' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[18px] font-bold text-[#1a1a1a]">{o.title}</p>
                  {o.number && <p className="text-[13px] text-[#9ca3af]">{o.number}</p>}
                </div>
                <p className="text-[19px] font-bold shrink-0" style={{ color: o.amount >= 0 ? '#8a6d20' : '#187a4b' }}>
                  {money(o.amount)}
                </p>
              </div>

              {o.description && (
                <p className="text-[16px] text-[#4a4a4a] leading-relaxed mt-2">{o.description}</p>
              )}
              {o.days_added > 0 && (
                <p className="text-[15px] text-[#6b7280] mt-1.5">
                  Adds about {o.days_added} day{o.days_added === 1 ? '' : 's'} to the schedule.
                </p>
              )}

              {o.status === 'approved' && (
                <p className="text-[15px] font-semibold mt-3" style={{ color: '#187a4b' }}>
                  ✓ Approved{o.approved_name ? ' by ' + o.approved_name : ''}
                </p>
              )}
              {o.status === 'declined' && (
                <p className="text-[15px] font-semibold mt-3 text-[#6b7280]">Declined — we&rsquo;ll leave it out.</p>
              )}

              {!done && !open && (
                <button onClick={() => { setOpenId(o.id); setError(null); }}
                  className="w-full min-h-[52px] mt-3 rounded-xl text-[16px] font-bold text-black active:scale-[0.99]"
                  style={{ background: '#C9A84C' }}>
                  Review &amp; Approve
                </button>
              )}

              {!done && open && (
                <div className="mt-3">
                  <label className="block text-[14px] font-semibold text-[#6b7280] mb-1.5">
                    Type your name to approve
                  </label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                    className="w-full min-h-[52px] px-4 rounded-xl border text-[17px] mb-3"
                    style={{ borderColor: '#e5e0d3', background: '#fff' }} />
                  {error && <p className="text-[15px] mb-2" style={{ color: '#c2410c' }}>{error}</p>}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => answer(o.id, 'decline')} disabled={busy}
                      className="min-h-[52px] rounded-xl text-[16px] font-bold disabled:opacity-40"
                      style={{ background: '#f3f4f6', color: '#6b7280' }}>
                      No thanks
                    </button>
                    <button onClick={() => answer(o.id, 'approve')} disabled={busy}
                      className="min-h-[52px] rounded-xl text-[16px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: '#C9A84C' }}>
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Approve
                    </button>
                  </div>
                  <p className="text-[13px] text-[#9ca3af] mt-2">
                    Approving adds this to your contract total.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Ask us something ─────────────────────────────────────────── */
export function AskSection({ token, messages, onSent }: {
  token: string;
  messages: { id?: string; author: string; author_name: string | null; body: string; created_at: string; answered_at?: string | null }[];
  onSent: () => void;
}) {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) { setError('Write your question first'); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/estimate/' + token + '/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text.trim(), name: name.trim() }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else { setText(''); setSent(true); onSent(); }
    } catch { setError('Could not send that — please call us.'); }
    setBusy(false);
  };

  const when = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <section id="questions" className="rounded-2xl border bg-white p-5 sm:p-6 scroll-mt-24" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5" style={{ color: '#8a6d20' }}>
        <MessageCircle size={14} /> Questions
      </p>
      <p className="text-[15px] text-[#6b7280] mb-3">Ask here and the answer stays on this page. You&rsquo;ll get an email when it&rsquo;s posted — typically the same business day.</p>

      {messages.length > 0 && (
        <div className="doc-rows space-y-2.5 mb-4">
          {messages.map((m, i) => (
            <div key={i} className="rounded-xl p-3.5"
              style={m.author === 'ro'
                ? { background: '#fdf6e7', border: '1px solid #ead9ac' }
                : { background: '#f7f7f5', border: '1px solid #f0ece2' }}>
              <p className="text-[13px] font-bold mb-1 flex items-center gap-2 flex-wrap" style={{ color: m.author === 'ro' ? '#8a6d20' : '#6b7280' }}>
                <span>{m.author === 'ro' ? 'RO Unlimited' : m.author_name || 'You'} · {when(m.created_at)}</span>
                {m.author === 'customer' && (
                  m.answered_at
                    ? <span className="px-2 py-0.5 rounded-full text-[12px] font-bold" style={{ background: '#e8f8f0', color: '#187a4b' }}>Answered</span>
                    : <span className="px-2 py-0.5 rounded-full text-[12px] font-bold" style={{ background: '#fdf6e7', color: '#8a6d20' }}>Received — we&rsquo;ll answer here</span>
                )}
              </p>
              <p className="text-[16px] text-[#2a2a2a] leading-relaxed whitespace-pre-line">{m.body}</p>
            </div>
          ))}
        </div>
      )}

      {sent ? (
        <div className="rounded-xl p-4" style={{ background: '#e8f8f0', border: '1px solid #b5e6cd' }}>
          <p className="text-[16px] font-semibold" style={{ color: '#187a4b' }}>
            Got it — we&rsquo;ll come back to you shortly.
          </p>
          <button onClick={() => setSent(false)} className="text-[15px] font-semibold mt-2" style={{ color: '#8a6d20' }}>
            Ask something else
          </button>
        </div>
      ) : (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
            placeholder="Anything you want to know about the work…"
            className="w-full px-4 py-3 rounded-xl border text-[17px] leading-relaxed mb-2.5"
            style={{ borderColor: '#e5e0d3' }} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            className="w-full min-h-[50px] px-4 rounded-xl border text-[16px] mb-3" style={{ borderColor: '#e5e0d3' }} />
          {error && <p className="text-[15px] mb-2" style={{ color: '#c2410c' }}>{error}</p>}
          <button onClick={send} disabled={busy}
            className="w-full min-h-[52px] rounded-xl text-[16px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: '#C9A84C' }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Send it
          </button>
          <p className="text-[14px] text-[#9ca3af] text-center mt-2">
            Or call <a href="tel:+18643040139" className="font-semibold" style={{ color: '#8a6d20' }}>(864) 304-0139</a>
          </p>
        </>
      )}
    </section>
  );
}

/* ── What's owed, and a way to pay it ─────────────────────────── */
export function BalanceDue({ amount, href }: { amount: number; href: string | null }) {
  if (!amount || amount <= 0) return null;
  return (
    <section className="rounded-2xl border p-5 sm:p-6"
      style={{ background: '#fff', borderColor: '#ead9ac' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>
            Balance Due
          </p>
          <p className="text-[32px] font-bold text-[#1a1a1a] leading-none mt-1">
            ${Math.round(amount).toLocaleString()}
          </p>
        </div>
        {href && (
          <a href={href}
            className="shrink-0 inline-flex items-center gap-2 min-h-[52px] px-5 rounded-xl text-[16px] font-bold text-black"
            style={{ background: '#C9A84C' }}>
            <CreditCard size={18} /> Pay
          </a>
        )}
      </div>
    </section>
  );
}


/* ── The job is finished ──────────────────────────────────────── */
export function CompletionCard({ completedAt, note, phases }: {
  completedAt: string; note: string | null; phases: { phase: string; percent: number }[];
}) {
  const when = new Date(completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <section className="rounded-2xl border p-5 sm:p-6"
      style={{ background: '#e8f8f0', borderColor: '#b5e6cd' }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(24,122,75,0.12)' }}>
          <PartyPopper size={24} style={{ color: '#187a4b' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#187a4b' }}>
            Finished
          </p>
          <h2 className="text-[24px] font-bold text-[#1a1a1a] leading-tight">Your project is complete</h2>
          <p className="text-[16px] text-[#4a6b5a] mt-0.5">Work completed {when}</p>
        </div>
      </div>

      {note && (
        <p className="text-[17px] text-[#2a4a3a] leading-relaxed mt-4 whitespace-pre-line">{note}</p>
      )}

      {phases.length > 0 && (
        <div className="doc-rows mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5">
          {phases.map((p) => (
            <div key={p.phase} className="flex items-center gap-2 text-[16px] text-[#2a4a3a]">
              <CheckCircle2 size={16} style={{ color: '#187a4b' }} className="shrink-0" />
              {p.phase}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── What we stand behind ─────────────────────────────────────── */
export function WarrantyCard({ months, notes, completedAt }: {
  months: number | null; notes: string | null; completedAt: string | null;
}) {
  if (!months && !notes) return null;
  const until = months && completedAt
    ? new Date(new Date(completedAt).setMonth(new Date(completedAt).getMonth() + months))
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#8a6d20' }}>
        <ShieldCheck size={15} /> Your Warranty
      </p>
      {months ? (
        <p className="text-[19px] font-bold text-[#1a1a1a] mb-1">
          {months} month{months === 1 ? '' : 's'} on our workmanship
        </p>
      ) : null}
      {until && <p className="text-[16px] text-[#6b7280] mb-3">Covered through {until}</p>}
      {notes && <p className="text-[17px] text-[#2a2a2a] leading-relaxed whitespace-pre-line">{notes}</p>}
      <p className="text-[16px] text-[#4a4a4a] leading-relaxed mt-3">
        Something not right? Call <a href="tel:+18643040139" className="font-bold" style={{ color: '#8a6d20' }}>(864) 304-0139</a> and
        we&rsquo;ll come look at it.
      </p>
    </section>
  );
}

/* ── How did we do ────────────────────────────────────────────────
   Four or five stars gets pointed at a public review. Anything lower goes
   to the owner instead — a customer who was let down should reach a person,
   not a review form. */
export function FeedbackCard({ token, existingRating, reviewUrl }: {
  token: string; existingRating: number | null; reviewUrl?: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const done = existingRating != null || sent != null;
  const finalRating = sent ?? existingRating ?? 0;

  const submit = async () => {
    if (!rating) { setError('Tap a star rating first'); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/estimate/' + token + '/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim(), name: name.trim() }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else setSent(rating);
    } catch { setError('Could not send that — please call us.'); }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: '#8a6d20' }}>
        How Did We Do?
      </p>

      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => {
          const lit = done ? i <= finalRating : i <= (hover || rating);
          return (
            <button key={i} disabled={done}
              onClick={() => { setRating(i); setError(null); }}
              onMouseEnter={() => !done && setHover(i)}
              onMouseLeave={() => !done && setHover(0)}
              aria-label={`${i} star${i === 1 ? '' : 's'}`}
              className="p-1 disabled:cursor-default active:scale-90 transition-transform">
              <Star size={32} className={lit ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-200'} />
            </button>
          );
        })}
      </div>

      {done ? (
        finalRating >= 4 ? (
          <div>
            <p className="text-[17px] text-[#2a2a2a] mb-3">
              Thank you — that genuinely means a lot to the crew.
            </p>
            {reviewUrl ? (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl text-black text-[16px] font-bold"
                style={{ background: '#C9A84C' }}>
                <Star size={18} /> Share it in a Google review
              </a>
            ) : (
              <p className="text-[16px] text-[#6b7280]">
                If you know someone who needs dirt moved or utilities run — pass our name along.
              </p>
            )}
          </div>
        ) : (
          <p className="text-[17px] text-[#2a2a2a] leading-relaxed">
            Thank you for the honesty. This goes straight to the owner, and you may hear from
            us so we can put it right.
          </p>
        )
      ) : (
        <>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder="Anything you want to tell us (optional)"
            className="w-full px-4 py-3 rounded-xl border text-[17px] leading-relaxed mb-2.5"
            style={{ borderColor: '#e5e0d3' }} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            className="w-full min-h-[50px] px-4 rounded-xl border text-[16px] mb-3" style={{ borderColor: '#e5e0d3' }} />
          {error && <p className="text-[15px] mb-2" style={{ color: '#c2410c' }}>{error}</p>}
          <button onClick={submit} disabled={busy}
            className="w-full min-h-[52px] rounded-xl text-[16px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: '#C9A84C' }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Star size={17} />} Send
          </button>
        </>
      )}
    </section>
  );
}
