'use client';

import { useState } from 'react';
import { DollarSign, Loader2, Check, X } from 'lucide-react';

/**
 * Set, change, or remove the fixed price on an existing estimate — right on
 * the estimate page, no wizard trip. One number in, saved, done.
 * The server honors total_override through every recalculation.
 */
export default function FixedPriceControl({ estimateId, current, onSaved }: {
  estimateId: string; current: number | null; onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current && current > 0 ? String(current) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = !!current && current > 0;

  const save = async (n: number) => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_override: n > 0 ? n : 0 }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Could not save');
      setEditing(false);
      onSaved();
    } catch (e: any) { setError(e.message || 'Could not save'); }
    setBusy(false);
  };

  if (!editing) {
    return (
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
        style={active
          ? { background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.4)' }
          : { background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
        <div className="min-w-0">
          <p className="text-[15px] font-bold" style={{ color: active ? '#D4B965' : 'rgba(255,255,255,0.7)' }}>
            {active ? 'Fixed Price' : 'One fixed price?'}
          </p>
          <p className="text-[13px] text-white/40">
            {active ? 'This is the customer’s number. Items below are reference only.' : 'Type one number — no items, no markups.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {active && (
            <button onClick={() => save(0)} disabled={busy}
              className="min-h-[44px] px-3 rounded-lg text-[14px] font-semibold text-white/50 bg-white/5 active:scale-95 disabled:opacity-50">
              Remove
            </button>
          )}
          <button onClick={() => { setValue(active ? String(current) : ''); setEditing(true); }}
            className="min-h-[44px] px-4 rounded-lg text-[15px] font-bold text-black active:scale-95 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
            <DollarSign size={16} /> {active ? 'Change' : 'Set Price'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.4)' }}>
      <p className="text-[15px] font-bold mb-2" style={{ color: '#D4B965' }}>Fixed price for this job</p>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] font-bold" style={{ color: '#C9A84C' }}>$</span>
          <input type="number" inputMode="decimal" autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(Number(value)); }}
            placeholder="0"
            className="w-full min-h-[52px] pl-8 pr-3 rounded-xl bg-[#1a1a1a] border-2 border-[#C9A84C]/50 text-[22px] font-bold text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]" />
        </div>
        <button onClick={() => save(Number(value))} disabled={busy || !(Number(value) > 0)}
          className="min-h-[52px] px-5 rounded-xl text-[16px] font-bold text-black active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
          style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Save
        </button>
        <button onClick={() => setEditing(false)} disabled={busy}
          className="w-12 min-h-[52px] rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
          <X size={18} className="text-white/50" />
        </button>
      </div>
      {error && <p className="text-[14px] mt-2" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}
