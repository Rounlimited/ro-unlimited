'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, CloudLightning, ChevronRight, PlayCircle, MapPin } from 'lucide-react';
import { usePreferences } from '@/components/admin/UserPreferencesProvider';

/**
 * Industry ticker — the live strip across the top of the dashboard.
 * Curated headlines, material price moves and weather alerts scroll
 * right-to-left as glassy chips at a constant speed; the edges fade out
 * with a CSS mask, a light sweep passes every so often, and the LIVE dot
 * breathes. Touch or hover pauses it; reduced-motion gets a swipeable row.
 */
export interface TickerItem { id: string; title: string; url: string; source_name: string; is_local: boolean; ai_tag?: string | null; category?: string }
export interface TickerPulse { materials?: { key: string; label: string; mom_pct: number; period: string }[]; weather?: { id: string; event: string; areas: string }[] }

const TAG: Record<string, { label: string; color: string }> = {
  prices: { label: 'Prices', color: '#D4772C' }, codes: { label: 'Codes', color: '#a78bfa' }, safety: { label: 'Safety', color: '#f87171' },
  local: { label: 'Local', color: '#34d399' }, market: { label: 'Market', color: '#C9A84C' }, tools: { label: 'Trick', color: '#38bdf8' },
  labor: { label: 'Labor', color: '#fbbf24' }, tech: { label: 'Tech', color: '#38bdf8' }, business: { label: 'Business', color: '#C9A84C' },
};
/** Ticker speed presets (px per second). Chosen per login in Settings → Ticker Speed. */
export const TICKER_SPEEDS: { id: string; label: string; pps: number }[] = [
  { id: 'slow', label: 'Slow', pps: 340 }, { id: 'normal', label: 'Normal', pps: 500 }, { id: 'fast', label: 'Fast', pps: 750 }, { id: 'blazing', label: 'Blazing', pps: 1100 },
];
export const DEFAULT_TICKER_SPEED = 'normal';
export function tickerPps(id: unknown): number { return (TICKER_SPEEDS.find((t) => t.id === id) || TICKER_SPEEDS.find((t) => t.id === DEFAULT_TICKER_SPEED)!).pps; }

export default function IndustryTicker({ items, pulse, onSelect }: { items: TickerItem[]; pulse: TickerPulse | null; onSelect?: (item: TickerItem) => void }) {
  const { preferences } = usePreferences();
  const speed = tickerPps((preferences?.custom_settings as any)?.ticker_speed);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(40);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => { try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { /* ignore */ } }, []);
  useEffect(() => {
    const el = trackRef.current; if (!el) return;
    const measure = () => setDuration(Math.max(3, Math.round(((el.scrollWidth / 2) / speed) * 10) / 10));
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [items, pulse, speed]);

  const moves = (pulse?.materials || []).filter((m) => Math.abs(m.mom_pct) >= 1).slice(0, 4);
  const weather = pulse?.weather || [];
  if (!items.length && !moves.length && !weather.length) return null;

  const chips: React.ReactNode[] = [];
  weather.forEach((w) => chips.push(
    <span key={`w-${w.id}`} className="ro-chip ro-chip--alert">
      <CloudLightning size={14} /><span className="font-semibold">{w.event}</span><span className="opacity-70">{w.areas}</span>
    </span>
  ));
  moves.forEach((m) => {
    const up = m.mom_pct > 0;
    chips.push(
      <span key={`m-${m.key}`} className="ro-chip" style={{ ['--c' as any]: up ? '#fbbf24' : '#34d399' }}>
        <span className="ro-pill">{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? '+' : ''}{m.mom_pct}%</span>
        <span className="font-medium">{m.label}</span><span className="ro-src">m/m · {m.period.split(' ')[0]}</span>
      </span>
    );
  });
  items.forEach((it) => {
    const tag = TAG[it.ai_tag || ''] || (it.is_local ? TAG.local : TAG.market);
    const video = /youtube\.com|youtu\.be/i.test(it.url);
    const body = (
      <>
        <span className="ro-pill">{video ? <PlayCircle size={12} /> : it.is_local ? <MapPin size={12} /> : null}{tag.label}</span>
        <span className="ro-title">{it.title}</span>
        <span className="ro-src">{it.source_name}</span>
      </>
    );
    chips.push(onSelect
      ? <button key={it.id} type="button" onClick={() => onSelect(it)} className="ro-chip ro-chip--tap" style={{ ['--c' as any]: tag.color }}>{body}</button>
      : <a key={it.id} href={it.url} target="_blank" rel="noopener noreferrer" className="ro-chip ro-chip--tap" style={{ ['--c' as any]: tag.color }}>{body}</a>);
  });

  const run = chips.map((c, i) => <span key={i} className="ro-seg">{c}</span>);

  return (
    <div className="ro-ticker relative z-10" data-tour="industry-ticker">
      <Link href="/admin/news" className="ro-label" aria-label="Open Industry News">
        <span className="ro-live"><span className="ro-live-dot" />LIVE</span>
        <span className="hidden sm:inline">Industry</span>
        <ChevronRight size={13} className="opacity-50" />
      </Link>
      <div
        className="ro-lane"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 2000)}
      >
        {reduced ? (
          <div className="ro-track ro-track--static">{run}</div>
        ) : (
          <div ref={trackRef} className="ro-track" style={{ animationDuration: `${duration}s`, animationPlayState: paused ? 'paused' : 'running' }}>
            <span className="ro-half">{run}</span>
            <span className="ro-half" aria-hidden="true">{run}</span>
          </div>
        )}
        {!reduced && <span className="ro-sweep" aria-hidden="true" />}
      </div>

      <style jsx global>{`
        .ro-ticker {
          display: flex; align-items: stretch; border-radius: 14px; overflow: hidden; isolation: isolate;
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)), #0c0c0c;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 10px 30px -18px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative;
        }
        .ro-ticker::before {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 1px; z-index: 2; pointer-events: none;
          background: linear-gradient(90deg, transparent, #C9A84C 30%, #D4772C 70%, transparent); opacity: .7;
        }
        .ro-label {
          display: flex; align-items: center; gap: 8px; padding: 0 12px; flex: 0 0 auto;
          font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #C9A84C;
          background: linear-gradient(180deg, #161616, #101010); border-right: 1px solid rgba(255,255,255,0.07);
        }
        .ro-label:hover { color: #e2c26a; }
        .ro-live { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: .18em; color: #f87171; }
        .ro-live-dot { width: 6px; height: 6px; border-radius: 999px; background: #f87171; animation: ro-pulse 2s ease-out infinite; }
        .ro-lane {
          position: relative; flex: 1; overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 28px, #000 calc(100% - 36px), transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 28px, #000 calc(100% - 36px), transparent);
        }
        .ro-track {
          display: flex; align-items: center; white-space: nowrap; padding: 8px 0;
          animation-name: ro-scroll; animation-timing-function: linear; animation-iteration-count: infinite; will-change: transform;
        }
        .ro-track--static { overflow-x: auto; padding-left: 10px; scrollbar-width: none; }
        .ro-track--static::-webkit-scrollbar { display: none; }
        .ro-half { display: inline-flex; align-items: center; padding-left: 10px; }
        .ro-seg { display: inline-flex; align-items: center; }
        .ro-seg::after { content: ''; width: 1px; height: 18px; margin: 0 10px; background: rgba(255,255,255,0.08); }
        .ro-chip {
          --c: #C9A84C;
          display: inline-flex; align-items: center; gap: 9px; padding: 6px 12px 6px 6px; border-radius: 999px;
          font-size: 15px; line-height: 1.2; color: rgba(255,255,255,0.88); text-decoration: none;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .ro-chip--tap { cursor: pointer; }
        .ro-chip--tap:hover, .ro-chip--tap:active {
          transform: translateY(-1px) scale(1.02); border-color: color-mix(in srgb, var(--c) 55%, transparent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 25%, transparent), 0 6px 20px -8px color-mix(in srgb, var(--c) 70%, transparent);
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
        }
        .ro-chip--alert { --c: #f87171; color: #fecaca; border-color: rgba(248,113,113,.4); background: rgba(248,113,113,.10); animation: ro-alert 1.8s ease-in-out infinite; }
        .ro-pill {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px;
          font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--c);
          background: color-mix(in srgb, var(--c) 14%, transparent); border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
          text-shadow: 0 0 12px color-mix(in srgb, var(--c) 60%, transparent);
        }
        .ro-title { font-weight: 500; letter-spacing: -.005em; }
        .ro-src { font-size: 12px; color: rgba(255,255,255,0.38); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .02em; }
        .ro-sweep {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
          transform: translateX(-100%); animation: ro-sweep 14s ease-in-out infinite;
        }
        @keyframes ro-scroll { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @keyframes ro-sweep { 0%, 70% { transform: translateX(-100%); } 85%, 100% { transform: translateX(100%); } }
        @keyframes ro-pulse { 0% { box-shadow: 0 0 0 0 rgba(248,113,113,.6); } 70% { box-shadow: 0 0 0 7px rgba(248,113,113,0); } 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); } }
        @keyframes ro-alert { 0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); } 50% { box-shadow: 0 0 14px -2px rgba(248,113,113,.55); } }
        @media (prefers-reduced-motion: reduce) { .ro-live-dot, .ro-chip--alert, .ro-sweep { animation: none; } }
      `}</style>
    </div>
  );
}
