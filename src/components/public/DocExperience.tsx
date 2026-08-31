'use client';

import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import {
  CheckCircle2, Check, Loader2, PenLine, CloudRain, Hammer, Flag, ClipboardCheck,
  AlertTriangle, Camera, X, FileText, Receipt, ChevronRight,
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
  story: { entry_date: string; type: string; text: string | null }[];
}) {
  const [showAll, setShowAll] = useState(false);
  if (!story.length) return null;

  const shown = showAll ? story : story.slice(0, 6);
  const icon = (t: string) =>
    t === 'rain' ? CloudRain : t === 'milestone' ? Flag : t === 'inspection' ? ClipboardCheck
      : t === 'delay' ? AlertTriangle : Hammer;
  const color = (t: string) =>
    t === 'rain' ? '#5ba3dc' : t === 'milestone' ? '#187a4b' : t === 'inspection' ? '#7c5cd6'
      : t === 'delay' ? '#c2410c' : '#8a6d20';

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
