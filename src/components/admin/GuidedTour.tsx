'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, ArrowRight, ArrowLeft, Play, Check, Sparkles } from 'lucide-react';
import { TOURS, tourById, toursForRoute, type Tour, type TourStep } from '@/lib/tours';
import WhatsNewModal, { whatsNewSeen } from '@/components/admin/WhatsNewModal';

/**
 * The app pointing at itself.
 *
 * A dimmed page with a hole cut around the thing being explained, and a bubble
 * next to it. Steps whose target isn't on screen are skipped rather than
 * pointing at nothing, so a tour degrades instead of breaking.
 *
 * Also picks up the `start-tour` event the Help page has always dispatched —
 * those buttons never had anything listening to them.
 *
 * JR-sized: 17-19px body, 48px+ targets, high contrast.
 */

const SEEN_KEY = 'ro-tours-seen';

const seen = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; }
};
const markSeen = (id: string) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify({ ...seen(), [id]: true })); } catch { /* private mode */ }
};

interface Box { top: number; left: number; width: number; height: number }

const findTarget = (target?: string): HTMLElement | null =>
  target ? (document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null) : null;

export default function GuidedTour() {
  const [tour, setTour] = useState<Tour | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [whatsNew, setWhatsNew] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const bubbleRef = useRef<HTMLDivElement>(null);

  const step: TourStep | null = tour ? tour.steps[stepIndex] || null : null;

  /* ── Launching ─────────────────────────────────────────────── */
  const start = useCallback((id: string) => {
    const t = tourById(id);
    if (!t) return;
    setMenuOpen(false);
    setTour(t);
    setStepIndex(0);
    if (t.route && !pathname.startsWith(t.route)) router.push(t.route);
  }, [pathname, router]);

  useEffect(() => {
    const onStart = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (typeof id === 'string') start(id);
    };
    window.addEventListener('start-tour', onStart);
    return () => window.removeEventListener('start-tour', onStart);
  }, [start]);

  /* ── Position the spotlight on the current step ─────────────── */
  useEffect(() => {
    if (!tour || !step) return;
    let cancelled = false;
    let tries = 0;

    const place = () => {
      if (cancelled) return;
      if (!step.target) { setBox(null); setWaiting(false); return; }

      const el = findTarget(step.target);
      if (!el) {
        // Give the page a moment (tab switch, route change), then move on.
        if (tries++ < 12) { setWaiting(true); setTimeout(place, 250); return; }
        setWaiting(false);
        setBox(null);
        return;
      }

      setWaiting(false);
      const r = el.getBoundingClientRect();
      const fullyVisible = r.top >= 60 && r.bottom <= window.innerHeight - 40;
      if (!fullyVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (cancelled) return;
          const r2 = el.getBoundingClientRect();
          setBox({ top: r2.top, left: r2.left, width: r2.width, height: r2.height });
        }, 350);
        return;
      }
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    place();
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [tour, step, stepIndex, pathname]);

  const close = useCallback(() => {
    if (tour) markSeen(tour.id);
    setTour(null);
    setBox(null);
  }, [tour]);

  const next = () => {
    if (!tour) return;
    if (stepIndex >= tour.steps.length - 1) { close(); return; }
    setStepIndex((i) => i + 1);
  };
  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── Bubble placement: below the target, or above if there's no room ── */
  const bubbleStyle = (): React.CSSProperties => {
    const W = Math.min(400, window.innerWidth - 24);
    if (!box) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: W };
    }
    const gap = 14;
    const below = box.top + box.height + gap;
    const roomBelow = window.innerHeight - below;
    const goAbove = roomBelow < 250 && box.top > 260;
    const top = goAbove ? Math.max(12, box.top - gap - 240) : Math.min(below, window.innerHeight - 260);
    const left = Math.max(12, Math.min(box.left + box.width / 2 - W / 2, window.innerWidth - W - 12));
    return { top, left, width: W };
  };

  // First visit after the update: the walkthrough shows itself. It never
  // interrupts twice — closing it stamps the release key.
  useEffect(() => {
    if (tour || whatsNew) return;
    if (!pathname.startsWith('/admin')) return;
    if (pathname.startsWith('/admin/login')) return;
    if (whatsNewSeen()) return;
    // A brand-new account gets the welcome modal first. Wait for it to clear
    // rather than giving up — a one-shot timer would silently never fire.
    let waited = 0;
    const iv = setInterval(() => {
      waited += 700;
      if (document.querySelector('.welcome-modal-backdrop')) {
        if (waited > 90000) clearInterval(iv);
        return;
      }
      clearInterval(iv);
      setWhatsNew(true);
    }, 700);
    return () => clearInterval(iv);
  }, [pathname, tour, whatsNew]);

  // Anywhere can open these:
  //   window.dispatchEvent(new Event('open-whats-new'))
  //   window.dispatchEvent(new Event('open-help-menu'))   ← the header button
  useEffect(() => {
    const openNew = () => { setMenuOpen(false); setWhatsNew(true); };
    const openMenu = () => setMenuOpen((o) => !o);
    window.addEventListener('open-whats-new', openNew);
    window.addEventListener('open-help-menu', openMenu);
    return () => {
      window.removeEventListener('open-whats-new', openNew);
      window.removeEventListener('open-help-menu', openMenu);
    };
  }, []);

  // Mark the header's ? with a dot while this release is unread.
  useEffect(() => {
    const dot = document.querySelector('[data-help-dot]') as HTMLElement | null;
    if (dot) dot.classList.toggle('hidden', whatsNewSeen());
  }, [whatsNew, menuOpen, pathname]);

  const available = toursForRoute(pathname);
  const seenMap = typeof window !== 'undefined' ? seen() : {};

  return (
    <>
      {whatsNew && <WhatsNewModal onClose={() => setWhatsNew(false)} />}

      {/* ── Help panel — drops from the header's ? button ───── */}
      {!tour && menuOpen && (
        <>
          <div className="fixed inset-0 z-[74]" onClick={() => setMenuOpen(false)} />
          <div className="fixed z-[75] w-[310px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-[#151515] shadow-2xl overflow-hidden"
            style={{ right: 12, top: 'calc(64px + env(safe-area-inset-top))' }}>
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <p className="text-[16px] font-bold">Show me how</p>
              <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <X size={15} className="text-white/50" />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-2">
              <button onClick={() => { setMenuOpen(false); setWhatsNew(true); }}
                className="w-full text-left px-3 py-3 rounded-xl mb-1 active:scale-[0.99] transition-all"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={15} style={{ color: '#D4B965' }} />
                  <p className="text-[16px] font-bold" style={{ color: '#D4B965' }}>What&rsquo;s New</p>
                  {!whatsNewSeen() && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#D4772C', color: '#fff' }}>NEW</span>
                  )}
                </div>
                <p className="text-[14px] text-white/45 leading-snug mt-0.5">
                  Everything added this week, one screen at a time
                </p>
              </button>
              {(available.length ? available : TOURS).map((t) => (
                <button key={t.id} onClick={() => start(t.id)}
                  className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/5 active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-bold">{t.title}</p>
                    {seenMap[t.id] && <Check size={14} className="text-[#35d07f]" />}
                  </div>
                  <p className="text-[14px] text-white/45 leading-snug mt-0.5">{t.blurb}</p>
                </button>
              ))}
              <a href="/admin/help"
                className="block px-3 py-3 rounded-xl hover:bg-white/5 text-[15px] font-semibold" style={{ color: '#D4B965' }}>
                Read the help guide →
              </a>
            </div>
          </div>
        </>
      )}

      {/* ── The tour itself ──────────────────────────────────── */}
      {tour && step && (
        <div className="fixed inset-0 z-[210]">
          {/* Dim everything, with a hole cut around the target */}
          {box ? (
            <div
              className="absolute pointer-events-none transition-all duration-300"
              style={{
                top: box.top - 8, left: box.left - 8,
                width: box.width + 16, height: box.height + 16,
                borderRadius: 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.75), 0 0 0 3px #C9A84C',
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-black/75" />
          )}
          {/* Click-through guard so the page underneath isn't tapped by accident */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

          <div ref={bubbleRef}
            className="absolute rounded-2xl border p-5 shadow-2xl"
            style={{ ...bubbleStyle(), background: '#151515', borderColor: 'rgba(201,168,76,0.4)' }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#D4B965' }}>
                {tour.title} · {stepIndex + 1} of {tour.steps.length}
              </p>
              <button onClick={close} className="w-9 h-9 -mt-1.5 -mr-1.5 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            <h3 className="text-[20px] font-bold leading-tight mb-1.5">{step.title}</h3>
            <p className="text-[17px] text-white/70 leading-relaxed">{step.body}</p>

            {waiting && step.hint && (
              <p className="text-[15px] mt-3 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#D4B965' }}>
                {step.hint}
              </p>
            )}
            {!waiting && !box && step.target && step.hint && (
              <p className="text-[15px] mt-3 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#D4B965' }}>
                {step.hint}
              </p>
            )}

            <div className="flex items-center gap-2 mt-5">
              {stepIndex > 0 && (
                <button onClick={back}
                  className="min-h-[52px] px-4 rounded-xl text-[16px] font-bold flex items-center gap-2 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <ArrowLeft size={17} /> Back
                </button>
              )}
              <button onClick={next}
                className="flex-1 min-h-[52px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99]"
                style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)' }}>
                {stepIndex >= tour.steps.length - 1 ? <>Got it <Check size={18} /></> : <>Next <ArrowRight size={18} /></>}
              </button>
            </div>

            <div className="flex justify-center gap-1.5 mt-4">
              {tour.steps.map((_, i) => (
                <span key={i} className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === stepIndex ? 20 : 6,
                    background: i === stepIndex ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                  }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Fire from anywhere: window.dispatchEvent(new CustomEvent('start-tour', { detail: id })) */
export function startTour(id: string) {
  window.dispatchEvent(new CustomEvent('start-tour', { detail: id }));
}

export { TOURS, Play };
