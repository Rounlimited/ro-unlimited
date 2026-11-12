'use client';

import { useCallback, useEffect, useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';

type S = { canUndo: boolean; canRedo: boolean; undoLabel: string | null; redoLabel: string | null };

/**
 * Undo / Redo for one record (estimate, invoice, customer, ...), backed by
 * /api/admin/undo. Drop it next to Send/Save. `refreshKey` should change
 * whenever the page reloads its data so the buttons re-check; `onChange`
 * is called after an undo/redo so the page can reload.
 */
export default function UndoRedoButtons({ table, id, onChange, refreshKey }: {
  table: string; id: string; onChange: () => void | Promise<void>; refreshKey?: unknown;
}) {
  const [s, setS] = useState<S>({ canUndo: false, canRedo: false, undoLabel: null, redoLabel: null });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/undo?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`);
      if (r.ok) setS(await r.json());
    } catch { /* ignore */ }
  }, [table, id]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const run = async (action: 'undo' | 'redo') => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/undo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, action }),
      });
      if (r.ok) await onChange();
    } catch { /* ignore */ }
    await load();
    setBusy(false);
  };

  const cls = 'flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-[13px] font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed';
  return (
    <>
      <button onClick={() => run('undo')} disabled={!s.canUndo || busy}
        title={s.canUndo ? `Undo: ${s.undoLabel}` : 'Nothing to undo'} className={cls}>
        <Undo2 size={14} /> Undo{s.canUndo && s.undoLabel ? ` ${s.undoLabel}` : ''}
      </button>
      <button onClick={() => run('redo')} disabled={!s.canRedo || busy}
        title={s.canRedo ? `Redo: ${s.redoLabel}` : 'Nothing to redo'} className={cls}>
        <Redo2 size={14} /> Redo
      </button>
    </>
  );
}
