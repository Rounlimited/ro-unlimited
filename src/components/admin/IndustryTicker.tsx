'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Newspaper, TrendingUp, TrendingDown, CloudLightning, ChevronRight } from 'lucide-react';

/**
 * Industry ticker — the strip that scrolls right-to-left across the top of
 * the dashboard: today's AI-picked headlines, material price moves, and any
 * active weather alert for the Upstate. Tap a headline to read it; tap the
 * label to open the full feed. Pauses on hover/touch; honours reduced motion.
 */
export interface TickerItem { id: string; title: string; url: string; source_name: string; is_local: boolean; ai_tag?: string | null }
export interface TickerPulse { materials?: { key: string; label: string; mom_pct: number; period: string }[]; weather?: { id: string; event: string; areas: string }[] }

const TAG_COLORS: Record<string, string> = {
  prices: '#D4772C', codes: '#a78bfa', safety: '#f87171', local: '#34d399', market: '#C9A84C', tools: '#38bdf8', labor: '#fbbf24', tech: '#38bdf8', business: '#C9A84C',
};

export default function IndustryTicker({ items, pulse, onSelect }: { items: TickerItem[]; pulse: TickerPulse | null; onSelect?: (item: TickerItem) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { /* ignore */ }
  }, []);
  // Constant speed regardless of how much text there is (~90px/s).
  useEffect(() => {
    const el = trackRef.current; if (!el) return;
    const w = el.scrollWidth / 2; setDuration(Math.max(30, Math.round(w / 90)));
  }, [items, pulse]);

  const materialMoves = (pulse?.materials || []).filter((m) => Math.abs(m.mom_pct) >= 1).slice(0, 4);
  const weather = pulse?.weather || [];
  if (!items.length && !materialMoves.length && !weather.length) return null;

  const segments: React.ReactNode[] = [];
  weather.forEach((w) => segments.push(
    <span key={`w-${w.id}`} className="inline-flex items-center gap-1.5 text-red-300">
      <CloudLightning size={12} /> <span className="font-semibold">{w.event}</span><span className="text-red-300/60">— {w.areas}</span>
    </span>
  ));
  materialMoves.forEach((m) => segments.push(
    <span key={`m-${m.key}`} className="inline-flex items-center gap-1.5" style={{ color: m.mom_pct > 0 ? '#fbbf24' : '#34d399' }}>
      {m.mom_pct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span className="font-semibold">{m.label}</span> {m.mom_pct > 0 ? '+' : ''}{m.mom_pct}% <span className="opacity-60">m/m</span>
    </span>
  ));
  items.forEach((it) => segments.push(
    onSelect ? (
      <button key={it.id} type="button" onClick={() => onSelect(it)} className="inline-flex items-center gap-2 text-white/80 hover:text-white active:text-[#C9A84C]">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TAG_COLORS[it.ai_tag || ''] || (it.is_local ? TAG_COLORS.local : '#C9A84C') }} />
        <span>{it.title}</span>
        <span className="text-white/30 text-[11px]">{it.source_name}</span>
      </button>
    ) : (
      <a key={it.id} href={it.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TAG_COLORS[it.ai_tag || ''] || (it.is_local ? TAG_COLORS.local : '#C9A84C') }} />
        <span>{it.title}</span>
        <span className="text-white/30 text-[11px]">{it.source_name}</span>
      </a>
    )
  ));

  const sep = <span className="mx-6 text-white/15">◆</span>;
  const run = segments.map((s, i) => <span key={i} className="inline-flex items-center">{s}{sep}</span>);

  return (
    <div className="relative z-10 flex items-stretch rounded-xl border border-white/5 bg-[#0f0f0f] overflow-hidden" data-tour="industry-ticker">
      <Link href="/admin/news" className="flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#C9A84C] bg-[#141414] border-r border-white/5 shrink-0 hover:bg-[#1a1a1a]">
        <Newspaper size={13} /> <span className="hidden sm:inline">Industry</span> <ChevronRight size={12} className="opacity-50" />
      </Link>
      <div
        className="relative flex-1 overflow-hidden"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 1500)}
      >
        {reduced ? (
          <div className="flex items-center gap-0 whitespace-nowrap overflow-x-auto px-3 py-2.5 text-[13px]">{run}</div>
        ) : (
          <div
            ref={trackRef}
            className="flex items-center whitespace-nowrap py-2.5 text-[13px] will-change-transform"
            style={{ animation: `ro-ticker ${duration}s linear infinite`, animationPlayState: paused ? 'paused' : 'running' }}
          >
            <span className="inline-flex items-center pl-3">{run}</span>
            <span className="inline-flex items-center pl-3" aria-hidden="true">{run}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#0f0f0f] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0f0f0f] to-transparent" />
      </div>
      <style jsx global>{`
        @keyframes ro-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
