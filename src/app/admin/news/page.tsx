'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Newspaper, RefreshCw } from 'lucide-react';
import { useNews, NewsRow, NewsSheet, MaterialsRow, WeatherBanner, type NewsItem } from '@/components/admin/IndustryPulse';

const CATS = [
  { id: 'all', label: 'All' }, { id: 'local', label: 'Upstate' }, { id: 'industry', label: 'Industry' }, { id: 'business', label: 'Business' },
  { id: 'trade', label: 'Trades' }, { id: 'codes', label: 'Codes' }, { id: 'safety', label: 'Safety' }, { id: 'tech', label: 'Tech' }, { id: 'equipment', label: 'Equipment' },
];

export default function NewsPage() {
  const [cat, setCat] = useState('all');
  const { featured, items, pulse, loading, reload, setFeatured, setItems } = useNews(80, cat);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<NewsItem | null>(null);
  const hide = (id: string) => { setFeatured((f) => f.filter((x) => x.id !== id)); setItems((f) => f.filter((x) => x.id !== id)); };
  const refresh = async () => {
    setRefreshing(true);
    try { await fetch('/api/admin/news', { method: 'POST' }); await reload(); } finally { setRefreshing(false); }
  };
  const featuredIds = new Set(featured.map((f) => f.id));

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Industry News" subtitle="Curated for RO" backHref="/admin" />
      <NewsSheet item={open} onClose={() => setOpen(null)} onHide={hide} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center"><Newspaper size={18} className="text-[#C9A84C]" /></div>
            <div>
              <h2 className="text-[18px] font-bold">Industry News</h2>
              <p className="text-[12px] text-white/30">Refreshes daily and whenever it is 6+ hours old · 18 sources · picked for a Greenville GC</p>
            </div>
          </div>
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-[12px] text-white/50 hover:text-white/80 disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>

        {pulse && (
          <div className="space-y-3">
            <WeatherBanner weather={pulse.weather || []} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase tracking-wide text-white/30">Material prices · month over month</span>
                <span className="text-[11px] text-white/25">{pulse.materials?.[0]?.period} · BLS producer price index</span>
              </div>
              <MaterialsRow materials={pulse.materials || []} />
            </div>
          </div>
        )}

        {cat === 'all' && featured.length > 0 && (
          <section className="bg-[#111] border border-[#C9A84C]/20 rounded-xl p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#C9A84C] font-semibold mb-1">Worth your time today</h3>
            <p className="text-[12px] text-white/30 mb-2">Picked by the app from this week's stories for what RO is building right now. Tap 👍 or "not useful" — it learns.</p>
            <div className="divide-y divide-white/5">{featured.map((it) => <NewsRow key={it.id} item={it} onHide={hide} onOpen={setOpen} />)}</div>
          </section>
        )}

        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1">
          {CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap border ${cat === c.id ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30' : 'text-white/40 border-white/10 hover:text-white/70'}`}>{c.label}</button>
          ))}
        </div>

        <section className="bg-[#111] border border-white/5 rounded-xl p-4">
          <h3 className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1">Latest</h3>
          {loading ? <p className="text-[13px] text-white/30 py-4">Loading…</p> : items.length === 0 ? <p className="text-[13px] text-white/30 py-4">Nothing here yet — tap Refresh now.</p> : (
            <div className="divide-y divide-white/5">
              {items.filter((it) => cat !== 'all' || !featuredIds.has(it.id)).map((it) => <NewsRow key={it.id} item={it} onHide={hide} onOpen={setOpen} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
