'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, EyeOff, ExternalLink, TrendingUp, TrendingDown, Minus, CloudLightning, Newspaper, ChevronRight, MapPin, X } from 'lucide-react';
import IndustryTicker, { type TickerItem, type TickerPulse } from '@/components/admin/IndustryTicker';

export interface NewsItem extends TickerItem { summary?: string | null; image_url?: string | null; published_at?: string | null; ai_take?: string | null; category?: string; score?: number; featured?: boolean }
export interface PulseData { generated_at: string; materials: { key: string; label: string; period: string; value: number; prev: number; mom_pct: number }[]; weather: { id: string; event: string; severity: string; headline: string; areas: string; ends: string | null; url: string }[] }

export function useNews(limit = 60, category = 'all') {
  const [featured, setFeatured] = useState<NewsItem[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshingRef = useRef(false);
  const load = async () => {
    try {
      const r = await fetch(`/api/admin/news?limit=${limit}&category=${category}`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      setFeatured(d.featured || []); setItems(d.items || []); setPulse(d.pulse || null);
      // Self-refresh: the daily cron is the floor; if what we have is older than
      // 6 hours (or there's nothing yet), pull fresh feeds in the background.
      const age = d.pulse?.generated_at ? Date.now() - new Date(d.pulse.generated_at).getTime() : Infinity;
      if (age > 6 * 3600000 && !refreshingRef.current) {
        refreshingRef.current = true;
        fetch('/api/admin/news', { method: 'POST' }).then(async (res) => {
          if (!res.ok) return;
          const r2 = await fetch(`/api/admin/news?limit=${limit}&category=${category}`, { cache: 'no-store' });
          if (r2.ok) { const d2 = await r2.json(); setFeatured(d2.featured || []); setItems(d2.items || []); setPulse(d2.pulse || null); }
        }).catch(() => {}).finally(() => { refreshingRef.current = false; });
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [limit, category]);
  return { featured, items, pulse, loading, reload: load, setFeatured, setItems };
}

export function sendFeedback(item_id: string, verdict: 'up' | 'down' | 'opened') {
  try {
    const body = JSON.stringify({ item_id, verdict });
    if (verdict === 'opened' && navigator.sendBeacon) { navigator.sendBeacon('/api/admin/news/feedback', new Blob([body], { type: 'application/json' })); return; }
    fetch('/api/admin/news/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* ignore */ }
}

export const TAG_LABEL: Record<string, string> = { prices: 'Prices', codes: 'Codes', safety: 'Safety', local: 'Local', market: 'Market', tools: 'Tools', labor: 'Labor', tech: 'Tech', business: 'Business' };
export const TAG_COLOR: Record<string, string> = { prices: '#D4772C', codes: '#a78bfa', safety: '#f87171', local: '#34d399', market: '#C9A84C', tools: '#38bdf8', labor: '#fbbf24', tech: '#38bdf8', business: '#C9A84C' };

/** One curated story with the vote buttons. */
export function NewsRow({ item, onHide, compact, onOpen }: { item: NewsItem; onHide?: (id: string) => void; compact?: boolean; onOpen?: (item: NewsItem) => void }) {
  const [voted, setVoted] = useState<'up' | null>(null);
  const tag = item.ai_tag || (item.is_local ? 'local' : '');
  return (
    <div className="group flex gap-3 py-3">
      {item.image_url && !compact && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-white/5" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div className="min-w-0 flex-1">
        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (onOpen) { e.preventDefault(); onOpen(item); } else sendFeedback(item.id, 'opened'); }} className="block">
          <div className="flex items-center gap-2 mb-0.5">
            {tag && <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TAG_COLOR[tag] || '#C9A84C' }}>{TAG_LABEL[tag] || tag}</span>}
            <span className="text-[11px] text-white/30 flex items-center gap-1">{item.is_local && <MapPin size={10} />}{item.source_name}{item.published_at ? ` · ${ago(item.published_at)}` : ''}</span>
          </div>
          <p className="text-[14px] font-medium text-white/90 leading-snug group-hover:text-white">{item.title} <ExternalLink size={11} className="inline text-white/20 ml-0.5" /></p>
          {item.ai_take && <p className="text-[13px] text-white/50 leading-snug mt-1">{item.ai_take}</p>}
        </a>
        <div className="flex items-center gap-1 mt-1.5 -ml-1">
          <button type="button" onClick={() => { setVoted('up'); sendFeedback(item.id, 'up'); }} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] ${voted === 'up' ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-white/30 hover:text-white/70 hover:bg-white/5'}`} title="Useful — show me more like this">
            <ThumbsUp size={12} /> {voted === 'up' ? 'Noted' : 'Useful'}
          </button>
          <button type="button" onClick={() => { sendFeedback(item.id, 'down'); onHide?.(item.id); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-white/30 hover:text-white/70 hover:bg-white/5" title="Not useful — hide and show fewer like this">
            <EyeOff size={12} /> Not useful
          </button>
        </div>
      </div>
    </div>
  );
}

export function MaterialsRow({ materials }: { materials: PulseData['materials'] }) {
  if (!materials?.length) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
      {materials.map((m) => {
        const up = m.mom_pct > 0.05, down = m.mom_pct < -0.05;
        const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
        const color = up ? '#fbbf24' : down ? '#34d399' : 'rgba(255,255,255,0.4)';
        return (
          <div key={m.key} className="rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-2" title={`Producer Price Index · ${m.period} · ${m.value} (was ${m.prev})`}>
            <div className="text-[10px] uppercase tracking-wide text-white/30 truncate">{m.label}</div>
            <div className="flex items-center gap-1 text-[14px] font-semibold tabular-nums" style={{ color }}><Icon size={13} />{up ? '+' : ''}{m.mom_pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

export function WeatherBanner({ weather }: { weather: PulseData['weather'] }) {
  if (!weather?.length) return null;
  return (
    <div className="space-y-1.5">
      {weather.map((w) => (
        <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px]">
          <CloudLightning size={14} className="text-red-300 mt-0.5 shrink-0" />
          <div><span className="font-semibold text-red-200">{w.event}</span> <span className="text-red-200/70">— {w.areas}</span>{w.ends && <span className="text-red-200/50"> · until {new Date(w.ends).toLocaleString('en-US', { weekday: 'short', hour: 'numeric' })}</span>}</div>
        </a>
      ))}
    </div>
  );
}

/** Tap-to-expand: the story in-app, with the original a button away. */
export function NewsSheet({ item, onClose, onHide }: { item: NewsItem | null; onClose: () => void; onHide?: (id: string) => void }) {
  const [voted, setVoted] = useState<'up' | null>(null);
  useEffect(() => { setVoted(null); }, [item?.id]);
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [item, onClose]);
  if (!item) return null;
  const tag = item.ai_tag || (item.is_local ? 'local' : '');
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-white/15" />
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white/60 hover:text-white" aria-label="Close"><X size={16} /></button>
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="w-full max-h-56 object-cover sm:rounded-t-2xl" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-[11px]">
            {tag && <span className="font-semibold uppercase tracking-wider" style={{ color: TAG_COLOR[tag] || '#C9A84C' }}>{TAG_LABEL[tag] || tag}</span>}
            <span className="text-white/35 flex items-center gap-1">{item.is_local && <MapPin size={10} />}{item.source_name}{item.published_at ? ` · ${ago(item.published_at)}` : ''}</span>
          </div>
          <h3 className="text-[19px] font-bold text-white leading-snug">{item.title}</h3>
          {item.ai_take && (
            <div className="rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/5 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-[#C9A84C] font-semibold mb-0.5">Why it matters to RO</div>
              <p className="text-[14px] text-white/85 leading-snug">{item.ai_take}</p>
            </div>
          )}
          {item.summary && <p className="text-[14px] text-white/60 leading-relaxed">{item.summary}</p>}
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => sendFeedback(item.id, 'opened')} className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-[#C9A84C] text-black font-bold text-[15px] active:scale-[0.98]">
            Read the full article <ExternalLink size={15} />
          </a>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button type="button" onClick={() => { setVoted('up'); sendFeedback(item.id, 'up'); }} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] ${voted === 'up' ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-white/50 hover:text-white/80 bg-white/5'}`}>
              <ThumbsUp size={14} /> {voted === 'up' ? 'Noted — more like this' : 'Useful'}
            </button>
            <button type="button" onClick={() => { sendFeedback(item.id, 'down'); onHide?.(item.id); onClose(); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] text-white/50 hover:text-white/80 bg-white/5">
              <EyeOff size={14} /> Not useful
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dashboard: ticker + "Good to know today" card. */
export default function IndustryPulse() {
  const { featured, pulse, loading, setFeatured } = useNews(10);
  const [open, setOpen] = useState<NewsItem | null>(null);
  const hide = (id: string) => setFeatured((f) => f.filter((x) => x.id !== id));
  if (loading) return null;
  const top = featured.slice(0, 4);
  return (
    <>
      <IndustryTicker items={featured} pulse={pulse as TickerPulse | null} onSelect={(it) => setOpen(featured.find((f) => f.id === it.id) || (it as NewsItem))} />
      <NewsSheet item={open} onClose={() => setOpen(null)} onHide={hide} />
      {(top.length > 0 || pulse?.weather?.length || pulse?.materials?.length) ? (
        <div className="relative z-10 bg-[#111] border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-white flex items-center gap-2"><Newspaper size={14} className="text-[#C9A84C]" /> Good to know today</h3>
            <Link href="/admin/news" className="text-[12px] text-white/40 hover:text-white/70 flex items-center gap-0.5">All news <ChevronRight size={12} /></Link>
          </div>
          <WeatherBanner weather={pulse?.weather || []} />
          <MaterialsRow materials={pulse?.materials || []} />
          {top.length > 0 && (
            <div className="divide-y divide-white/5 -mb-2">
              {top.map((it) => <NewsRow key={it.id} item={it} onHide={hide} compact onOpen={setOpen} />)}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'just now'; if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d === 1 ? 'yesterday' : `${d}d ago`;
}
