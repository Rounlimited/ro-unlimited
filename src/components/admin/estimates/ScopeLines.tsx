'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ListChecks, Check, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Drafts the price list from the finished scope: the AI reads the scope and splits the work into items to
 * price, grouped by section. It never gives a price; every item arrives at $0 for the contractor to fill in.
 * Nothing is added until he taps Add, and any item can be switched off first.
 */
export type DraftLine = { phase: string; description: string; quantity: number; unit: string; category: string; unit_cost: number; markup_percent: number };

export default function ScopeLines({ scopeHtml, onAdd, onClose }: { scopeHtml: string; onAdd: (items: DraftLine[]) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<'working' | 'done' | 'error'>('working');
  const [items, setItems] = useState<DraftLine[]>([]);
  const [on, setOn] = useState<boolean[]>([]);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  const started = useRef(false);

  const run = async () => {
    setPhase('working'); setError('');
    const ctl = new AbortController(); abort.current = ctl;
    try {
      const r = await fetch('/api/admin/estimates/scope-organize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ action: 'lines', html: scopeHtml }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(d.items)) throw new Error(d.error || 'The AI is unavailable right now.');
      setItems(d.items); setOn(d.items.map(() => true)); setPhase('done');
    } catch (e) {
      if (ctl.signal.aborted) return;
      setError(e instanceof Error && e.message && e.message !== 'Failed to fetch' ? e.message : 'Lost the connection. Try again.');
      setPhase('error');
    }
  };
  useEffect(() => {
    if (!started.current) { started.current = true; run(); }
    return () => abort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const m = new Map<string, number[]>();
    items.forEach((it, i) => { m.set(it.phase, [...(m.get(it.phase) || []), i]); });
    return Array.from(m.entries());
  }, [items]);
  const count = on.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[210] bg-[#0a0a0a] flex flex-col" role="dialog" aria-modal="true" aria-label="Draft the price list">
      <div className="flex items-center gap-3 px-4 border-b border-white/10" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))', paddingBottom: 12 }}>
        <span className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 text-[#D4B965] flex items-center justify-center shrink-0"><ListChecks size={20} /></span>
        <h2 className="flex-1 text-[20px] font-bold text-white leading-tight">Price list from the scope</h2>
        <button type="button" onClick={() => { abort.current?.abort(); onClose(); }} aria-label="Close"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white/80 active:bg-white/10"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto">
          {phase === 'working' && (
            <div className="flex items-center gap-3 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-3.5">
              <Loader2 size={22} className="animate-spin text-[#D4B965] shrink-0" />
              <div><p className="text-[17px] font-semibold text-white">Reading the scope and listing the work to price…</p>
                <p className="text-[15px] text-white/65">This can take a minute on a long scope.</p></div>
            </div>
          )}
          {phase === 'error' && (
            <div className="rounded-xl bg-red-500/12 border border-red-500/40 px-4 py-4 flex items-start gap-3">
              <AlertTriangle size={22} className="text-red-300 shrink-0 mt-0.5" /><p className="text-[17px] text-red-100 leading-snug">{error}</p>
            </div>
          )}
          {phase === 'done' && items.length === 0 && (
            <p className="text-[17px] text-white/85">It did not find separate items to price in this scope.</p>
          )}
          {phase === 'done' && items.length > 0 && (
            <div className="space-y-5">
              <p className="text-[17px] text-white/85 leading-relaxed">
                {items.length} item{items.length === 1 ? '' : 's'} to price, taken from the scope. They come in at $0 for you to price on the next step. Switch off any you don’t want.
              </p>
              {groups.map(([name, idx]) => (
                <div key={name}>
                  <p className="text-[14px] font-bold uppercase tracking-wide text-[#E5C76B] mb-2">{name}</p>
                  <div className="space-y-2">
                    {idx.map((i) => (
                      <button key={i} type="button" role="switch" aria-checked={!!on[i]} onClick={() => setOn((v) => v.map((x, k) => (k === i ? !x : x)))}
                        className={`w-full text-left rounded-xl border px-3.5 py-3 flex items-start gap-3 ${on[i] ? 'border-[#C9A84C]/55 bg-[#C9A84C]/10' : 'border-white/15 bg-white/[0.03]'}`}>
                        <span className={`shrink-0 mt-0.5 w-7 h-7 rounded-md border-2 flex items-center justify-center ${on[i] ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/40 text-transparent'}`}><Check size={18} /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[17px] text-white leading-snug break-words">{items[i].description}</span>
                          <span className="block text-[15px] text-white/65 mt-0.5">{items[i].quantity} {items[i].unit} · {items[i].category}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 bg-[#0d0d0d]" style={{ paddingTop: 12, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2.5">
          {phase === 'working' && <button type="button" onClick={() => { abort.current?.abort(); onClose(); }} className="flex-1 min-h-[56px] rounded-xl border border-white/25 text-white text-[17px] font-semibold">Stop</button>}
          {phase === 'error' && (<>
            <button type="button" onClick={run} className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2"><RotateCcw size={19} /> Try again</button>
            <button type="button" onClick={onClose} className="min-h-[56px] px-5 rounded-xl border border-white/25 text-white text-[17px] font-semibold">Close</button>
          </>)}
          {phase === 'done' && (<>
            {count > 0 && (
              <button type="button" onClick={() => onAdd(items.filter((_, i) => on[i]))}
                className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]">
                <Check size={21} /> Add {count} item{count === 1 ? '' : 's'} to the price list
              </button>
            )}
            <button type="button" onClick={onClose} className={`min-h-[56px] px-5 rounded-xl text-[17px] font-semibold ${count ? 'text-white/85' : 'flex-1 bg-[#C9A84C] text-black font-bold'}`}>{count ? 'Not now' : 'Close'}</button>
          </>)}
        </div>
      </div>
    </div>
  );
}
