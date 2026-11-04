'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, Phone } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AppShell from '@/components/admin/AppShell';
import { ReviewRow, Stars, avgStars } from '@/components/admin/ReviewItems';
import type { Review } from '@/lib/reviews';

/**
 * Reviews — every star rating, comment and check-in answer customers leave,
 * from the job page, the estimate page and invoice receipts. Grouped by
 * customer or by job, whatever status the job is in (a review on a job that
 * never got marked signed used to be reachable only from its notification).
 */
type View = 'customer' | 'job' | 'newest';
type Kind = 'all' | 'stars' | 'words';

export default function ReviewsPage() {
  const [all, setAll] = useState<Review[] | null>(null);
  const [view, setView] = useState<View>('customer');
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const [examples, setExamples] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await (await fetch('/api/admin/reviews', { cache: 'no-store' })).json();
      const list: Review[] = d.reviews || [];
      setAll(list);
      // Opening this page counts as seeing them — keep the NEW tag on screen this visit, clear it for next time.
      const unseen = list.filter((r) => r.unseen).map((r) => r.id);
      if (unseen.length) fetch('/api/admin/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_seen', ids: unseen }) }).catch(() => {});
    } catch { setAll([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => (all || []).filter((r) => {
    if (!examples && r.example) return false;
    if (kind === 'stars' && r.kind !== 'stars') return false;
    if (kind === 'words' && !r.text) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      return [r.customer?.name, r.customer?.phone, r.name, r.text, r.estimate?.name, r.estimate?.number, r.invoice_number].join(' ').toLowerCase().includes(t);
    }
    return true;
  }), [all, examples, kind, q]);

  const groups = useMemo(() => {
    if (view === 'newest') return [];
    const m = new Map<string, { key: string; title: string; href: string | null; sub: string | null; phone: string | null; items: Review[] }>();
    for (const r of list) {
      const key = view === 'customer' ? (r.customer?.id || 'none:' + (r.name || r.id)) : (r.estimate?.id || 'none:' + r.id);
      const g = m.get(key) || (view === 'customer'
        ? { key, title: r.customer?.name || r.name || 'Unknown customer', href: r.customer ? `/admin/customers/${r.customer.id}` : null, sub: null, phone: r.customer?.phone || null, items: [] }
        : { key, title: r.estimate?.name || r.estimate?.number || 'No job attached', href: r.estimate ? `/admin/jobs/${r.estimate.id}` : null, sub: r.customer?.name || null, phone: r.customer?.phone || null, items: [] });
      g.items.push(r); m.set(key, g);
    }
    return Array.from(m.values());
  }, [list, view]);

  if (!all) return <AppShell><AdminHeader title="Reviews" backHref="/admin" /><div className="py-24 flex justify-center"><Loader2 className="animate-spin text-white/40" size={28} /></div></AppShell>;

  const visible = all.filter((r) => examples || !r.example);
  const rated = visible.filter((r) => r.kind === 'stars');
  const avg = avgStars(visible);
  const fives = rated.filter((r) => r.rating === 5).length;
  const words = visible.filter((r) => r.text).length;
  const exampleCount = all.filter((r) => r.example).length;
  const chip = (on: boolean) => ({ background: on ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.05)', color: on ? '#D4B965' : 'rgba(255,255,255,0.7)', border: '1px solid ' + (on ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.12)') });

  return (
    <AppShell>
      <AdminHeader title="Reviews" subtitle="What customers said — by customer or job" backHref="/admin" />
      <div className="px-4 pb-28 max-w-3xl mx-auto w-full min-w-0 overflow-x-hidden space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <p className="text-[30px] font-bold leading-none text-[#F5B83D]">{avg ?? '—'}</p>
            <p className="text-[14px] text-white/50 mt-1">Average stars</p>
          </div>
          {[['Star ratings', rated.length, '#fff'], ['5-star', fives, '#35d07f'], ['Written / answers', words, '#6db3f2']].map(([l, v, c]) => (
            <div key={String(l)} className="rounded-2xl border border-white/8 bg-[#111] p-4">
              <p className="text-[30px] font-bold leading-none" style={{ color: String(c) }}>{v as number}</p>
              <p className="text-[14px] text-white/50 mt-1">{l}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl px-3 min-h-[50px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search size={18} className="text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a customer, job or words" className="flex-1 min-w-0 bg-transparent text-[17px] text-white outline-none placeholder:text-white/30" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <span className="self-center text-[15px] text-white/45 pr-1 whitespace-nowrap">Show by</span>
          {([['customer', 'Customer'], ['job', 'Job'], ['newest', 'Newest first']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} className="min-h-[44px] px-4 rounded-full text-[15px] font-bold whitespace-nowrap" style={chip(view === k)}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([['all', 'Everything'], ['stars', 'Star ratings'], ['words', 'With words']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} className="min-h-[44px] px-4 rounded-full text-[15px] font-bold whitespace-nowrap" style={chip(kind === k)}>{l}</button>
          ))}
          {exampleCount > 0 && (
            <button onClick={() => setExamples(!examples)} className="min-h-[44px] px-4 rounded-full text-[15px] font-bold whitespace-nowrap" style={chip(examples)}>{examples ? 'Hide examples' : `Show examples (${exampleCount})`}</button>
          )}
        </div>

        {list.length === 0 && (
          <p className="text-[17px] text-white/50 text-center py-10">{visible.length === 0 ? 'No reviews yet. When a customer leaves stars or a comment on their job page, estimate or invoice receipt, it lands here.' : 'Nothing matches that.'}</p>
        )}

        {view === 'newest' ? (
          <div className="space-y-3">{list.map((r) => <ReviewRow key={r.id} r={r} />)}</div>
        ) : groups.map((g) => {
          const ga = avgStars(g.items);
          return (
            <div key={g.key} className="rounded-2xl border border-white/8 bg-[#111] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  {g.href ? <Link href={g.href} className="text-[19px] font-bold text-white leading-tight hover:underline underline-offset-2">{g.title}</Link> : <p className="text-[19px] font-bold text-white leading-tight">{g.title}</p>}
                  {g.sub && <p className="text-[15px] text-white/55 mt-0.5">{g.sub}</p>}
                  <p className="text-[15px] text-white/50 mt-0.5">{g.items.length} item{g.items.length === 1 ? '' : 's'}{ga != null ? <> · <span className="text-white/80">{ga} stars avg</span></> : null}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {ga != null && <Stars n={Math.round(ga)} size={18} />}
                  {g.phone && <a href={`tel:${g.phone.replace(/[^0-9+]/g, '')}`} className="min-h-[44px] px-3 rounded-xl text-[15px] font-bold inline-flex items-center gap-1.5 text-green-400" style={{ background: 'rgba(53,208,127,0.1)', border: '1px solid rgba(53,208,127,0.3)' }}><Phone size={15} /> Call</a>}
                </div>
              </div>
              <div className="space-y-3">{g.items.map((r) => <ReviewRow key={r.id} r={r} showCustomer={view !== 'customer'} showJob={view !== 'job'} />)}</div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
