'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, HardHat, Receipt, FileText, Loader2 } from 'lucide-react';
import type { Review } from '@/lib/reviews';

/** Shared review display for /admin/reviews and the customer page. JR-sized: 17px+ text, words over icons. */
export const SOURCE_LABEL: Record<Review['source'], string> = { job: 'Job page', estimate: 'Estimate page', invoice: 'Invoice receipt' };

export const fmtWhen = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

export function Stars({ n, size = 20 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= n ? '#F5B83D' : 'transparent'} color={i <= n ? '#F5B83D' : 'rgba(255,255,255,0.25)'} />
      ))}
    </span>
  );
}

export function ReviewRow({ r, showCustomer = true, showJob = true }: { r: Review; showCustomer?: boolean; showJob?: boolean }) {
  const SrcIcon = r.source === 'invoice' ? Receipt : r.source === 'estimate' ? FileText : HardHat;
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (r.unseen ? 'rgba(245,184,61,0.45)' : 'rgba(255,255,255,0.08)') }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {r.kind === 'stars' && r.rating != null ? (
          <span className="flex items-center gap-2"><Stars n={r.rating} /><span className="text-[17px] font-bold text-white">{r.rating} star{r.rating === 1 ? '' : 's'}</span></span>
        ) : (
          <span className="text-[15px] font-bold uppercase tracking-wide" style={{ color: r.kind === 'checkin' ? '#6db3f2' : '#D4B965' }}>{r.kind === 'checkin' ? 'Check-in answer' : 'Comment'}</span>
        )}
        <span className="flex items-center gap-2">
          {r.unseen && <span className="text-[13px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,184,61,0.18)', color: '#F5B83D' }}>NEW</span>}
          {r.example && <span className="text-[13px] font-bold px-2 py-0.5 rounded-full text-white/60" style={{ background: 'rgba(255,255,255,0.08)' }}>EXAMPLE</span>}
          <span className="text-[15px] text-white/55">{fmtWhen(r.created_at)}</span>
        </span>
      </div>
      {r.question && <p className="text-[15px] text-white/50 mt-2">{r.question}</p>}
      {r.text ? <p className="text-[18px] text-white mt-1 leading-snug">&ldquo;{r.text}&rdquo;</p> : r.kind === 'stars' ? <p className="text-[15px] text-white/45 mt-1">No written comment.</p> : null}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
        {showCustomer && r.customer && <Link href={`/admin/customers/${r.customer.id}`} className="font-bold text-[#D4B965] underline-offset-2 hover:underline">{r.customer.name}</Link>}
        {showCustomer && !r.customer && r.name && <span className="font-bold text-white/80">{r.name}</span>}
        {showJob && r.estimate && <Link href={`/admin/jobs/${r.estimate.id}`} className="text-white/75 underline-offset-2 hover:underline">{r.estimate.name || r.estimate.number}</Link>}
        <span className="inline-flex items-center gap-1.5 text-white/45"><SrcIcon size={14} /> {SOURCE_LABEL[r.source]}{r.invoice_number ? ' · ' + r.invoice_number : ''}</span>
      </div>
    </div>
  );
}

export function avgStars(list: Review[]) {
  const rated = list.filter((r) => r.kind === 'stars' && r.rating != null);
  return rated.length ? Math.round((rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length) * 10) / 10 : null;
}

/** Reviews block for the customer detail page. */
export function CustomerReviews({ customerId }: { customerId: string }) {
  const [list, setList] = useState<Review[] | null>(null);
  useEffect(() => {
    fetch(`/api/admin/reviews?customer=${customerId}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => setList(d.reviews || [])).catch(() => setList([]));
  }, [customerId]);
  const avg = list ? avgStars(list) : null;
  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-[#F5B83D]" />
          <h3 className="text-[15px] font-bold text-white">Reviews</h3>
        </div>
        {avg != null && <span className="flex items-center gap-2 text-[15px] text-white/70"><Stars n={Math.round(avg)} size={16} /> {avg} average</span>}
      </div>
      {!list ? (
        <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-white/40" size={20} /></div>
      ) : list.length === 0 ? (
        <p className="text-[16px] text-white/50">No reviews from this customer yet.</p>
      ) : (
        <div className="space-y-3">{list.map((r) => <ReviewRow key={r.id} r={r} showCustomer={false} />)}</div>
      )}
      <Link href="/admin/reviews" className="inline-block mt-4 text-[15px] font-bold text-[#D4B965]">All reviews →</Link>
    </div>
  );
}
