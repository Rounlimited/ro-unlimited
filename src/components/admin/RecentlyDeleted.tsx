'use client';

import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

type Item = { at: string; table: string; label: string };

/** Last 40 deleted customers, letters, schedule items, job costs and tasks, each with a Restore button. */
export default function RecentlyDeleted() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/undo?deleted=1');
      const d = await r.json();
      setItems(d.items || []);
    } catch { setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const restore = async (at: string) => {
    setBusy(at); setMsg('');
    try {
      const r = await fetch('/api/admin/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: at }) });
      const d = await r.json();
      setMsg(r.ok ? `Restored — ${d.restored}` : d.error || 'Could not restore');
    } catch { setMsg('Could not restore'); }
    setBusy(''); load();
  };

  return (
    <section className="bg-[#111] border border-white/5 rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-[15px] font-semibold">Recently Deleted</h2>
        <p className="text-[13px] text-white/50 mt-0.5">Deleted something by accident? Tap Restore.</p>
      </div>
      <div className="p-3 space-y-2">
        {msg && <p className="text-[14px] text-[#35d07f] px-2">{msg}</p>}
        {items === null ? (
          <p className="text-[14px] text-white/40 px-2 py-2">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[14px] text-white/40 px-2 py-2">Nothing deleted recently.</p>
        ) : items.map((it) => (
          <div key={it.at} className="flex items-center justify-between gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[15px] text-white truncate">{it.label}</p>
              <p className="text-[12px] text-white/40">{new Date(it.at).toLocaleString()}</p>
            </div>
            <button onClick={() => restore(it.at)} disabled={busy === it.at}
              className="shrink-0 min-h-[40px] px-3.5 rounded-lg text-[13px] font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/15 flex items-center gap-1.5 disabled:opacity-40">
              <RotateCcw size={14} /> Restore
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
