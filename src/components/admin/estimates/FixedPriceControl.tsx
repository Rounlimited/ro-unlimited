'use client';

import { useState } from 'react';
import { DollarSign, Loader2, Check, X, MinusCircle, PlusCircle, Tag } from 'lucide-react';

/**
 * The price, right on the estimate page — three plain moves:
 *   SET THE TOTAL   — one number, that's the customer's price (fixed price)
 *   ADD A CREDIT    — takes money off, shows as its own line ("Permit fees paid by owner  −$3,300")
 *   ADD A CHARGE    — adds money, same way
 * No wizard trip, no line items, no markups. Works on signed contracts too
 * (the customer's page and PDF update — say so in the note).
 */
export default function FixedPriceControl({ estimateId, current, adjustment, adjustmentLabel, total, signed, onSaved }: {
  estimateId: string; current: number | null; adjustment?: number | null; adjustmentLabel?: string | null;
  total?: number | null; signed?: boolean; onSaved: () => void;
}) {
  const [mode, setMode] = useState<null | 'total' | 'credit' | 'charge'>(null);
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fixed = !!current && current > 0;
  const adj = Number(adjustment || 0);

  const patch = async (body: any) => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Could not save');
      setMode(null); setValue(''); setLabel('');
      onSaved();
    } catch (e: any) { setError(e.message || 'Could not save'); }
    setBusy(false);
  };

  const fmt = (n: number) => '$' + Math.abs(Math.round(n)).toLocaleString();
  const open = (m: 'total' | 'credit' | 'charge') => {
    setMode(m); setError('');
    setValue(m === 'total' ? (fixed ? String(current) : '') : '');
    setLabel(m === 'credit' ? 'Credit' : m === 'charge' ? 'Additional work' : '');
  };

  if (!mode) {
    return (
      <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold" style={{ color: '#D4B965' }}>
              {fixed ? `Fixed price · ${fmt(Number(current))}` : `Price${total != null ? ` · ${fmt(Number(total))}` : ''}`}
            </p>
            {adj !== 0 ? (
              <p className="text-[14px] text-white/70 mt-0.5">
                {adjustmentLabel || (adj < 0 ? 'Credit' : 'Additional charge')}: <span className="font-semibold" style={{ color: adj < 0 ? '#35d07f' : '#f0a04b' }}>{adj < 0 ? '−' : '+'}{fmt(adj)}</span>
                {total != null && <span className="text-white/90"> → total {fmt(Number(total))}</span>}
                <button onClick={() => patch({ adjustment_amount: 0, adjustment_label: null })} disabled={busy} className="ml-2 text-white/60 underline underline-offset-2">remove</button>
              </p>
            ) : (
              <p className="text-[13px] text-white/40 mt-0.5">{fixed ? 'This is the customer’s number — items are reference only.' : 'Set one number, or give a credit, without touching line items.'}</p>
            )}
          </div>
          {fixed && (
            <button onClick={() => patch({ total_override: 0 })} disabled={busy}
              className="min-h-[40px] px-3 rounded-lg text-[13px] font-semibold text-white/45 bg-white/5 active:scale-95 shrink-0 disabled:opacity-50">
              Un-fix
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => open('total')} className="min-h-[48px] rounded-lg text-[14px] font-bold text-black active:scale-95 flex items-center justify-center gap-1"
            style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
            <DollarSign size={15} /> {fixed ? 'Change Total' : 'Set Total'}
          </button>
          <button onClick={() => open('credit')} className="min-h-[48px] rounded-lg text-[14px] font-bold active:scale-95 flex items-center justify-center gap-1"
            style={{ background: 'rgba(53,208,127,0.12)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.35)' }}>
            <MinusCircle size={15} /> Credit
          </button>
          <button onClick={() => open('charge')} className="min-h-[48px] rounded-lg text-[14px] font-bold active:scale-95 flex items-center justify-center gap-1"
            style={{ background: 'rgba(240,160,75,0.12)', color: '#f0a04b', border: '1px solid rgba(240,160,75,0.35)' }}>
            <PlusCircle size={15} /> Charge
          </button>
        </div>
        {signed && <p className="text-[13px] text-white/60 mt-2">This contract is signed — any change here shows on the customer&rsquo;s page and PDF right away.</p>}
        {error && <p className="text-[14px] mt-2" style={{ color: '#f87171' }}>{error}</p>}
      </div>
    );
  }

  const title = mode === 'total' ? 'The customer pays' : mode === 'credit' ? 'Take off the total' : 'Add to the total';
  const n = Number(value);
  const save = () => {
    if (!(n > 0)) { setError('Enter an amount'); return; }
    if (mode === 'total') return patch({ total_override: n });
    return patch({ adjustment_amount: mode === 'credit' ? -n : n, adjustment_label: label.trim() || (mode === 'credit' ? 'Credit' : 'Additional work') });
  };

  return (
    <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.4)' }}>
      <p className="text-[15px] font-bold mb-2" style={{ color: '#D4B965' }}>{title}</p>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] font-bold" style={{ color: '#C9A84C' }}>{mode === 'credit' ? '−$' : mode === 'charge' ? '+$' : '$'}</span>
          <input type="number" inputMode="decimal" autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }} placeholder="0"
            className="w-full min-h-[52px] pr-3 rounded-xl bg-[#1a1a1a] border-2 border-[#C9A84C]/50 text-[22px] font-bold text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]"
            style={{ paddingLeft: mode === 'total' ? 32 : 48 }} />
        </div>
        <button onClick={() => setMode(null)} disabled={busy} className="w-12 min-h-[52px] rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
          <X size={18} className="text-white/50" />
        </button>
      </div>
      {mode !== 'total' && (
        <div className="relative mt-2">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={mode === 'credit' ? 'What for — "Permit fees paid by owner"' : 'What for — "Extra rock removal"'}
            className="w-full min-h-[48px] pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-[16px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
        </div>
      )}
      <button onClick={save} disabled={busy || !(n > 0)}
        className="w-full min-h-[52px] mt-2 rounded-xl text-[16px] font-bold text-black active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-1.5"
        style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
        {mode === 'total' ? 'Save Total' : mode === 'credit' ? 'Apply Credit' : 'Add Charge'}
      </button>
      {error && <p className="text-[14px] mt-2" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}
