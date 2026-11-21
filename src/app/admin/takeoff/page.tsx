'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/admin/AppShell';
import AdminHeader from '@/components/admin/AdminHeader';
import { Loader2, Ruler, Upload, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

/**
 * Bid from Plans: the list of plan sets. Bring in a PDF of the plans, measure right on the sheets, and send
 * the quantities to an estimate.
 */
type Row = { id: string; name: string; file_name: string | null; file_size: number | null; page_count: number | null; item_count: number; sheets_scaled: number; updated_at: string; estimate: { estimate_number: string; project_name: string | null } | null };

const mb = (n: number | null) => (n ? (n / 1_000_000 >= 1 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`) : '');
const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function TakeoffListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [sure, setSure] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/takeoffs').catch(() => null);
    const d = r && r.ok ? await r.json().catch(() => []) : [];
    setRows(Array.isArray(d) ? d : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const bringIn = async (file: File) => {
    setError('');
    if (!/\.pdf$/i.test(file.name)) { setError('Plans need to be a PDF file. If you have them as pictures or CAD files, ask the engineer or architect for the PDF set.'); return; }
    setBusy(`Bringing in ${file.name}…`);
    try {
      const r = await fetch('/api/admin/takeoffs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', file_name: file.name, file_size: file.size }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.id) throw new Error(d.error || 'Could not start that. Try again.');
      const up = await createBrowserSupabase().storage.from(d.bucket).uploadToSignedUrl(d.path, d.token, file, { contentType: 'application/pdf' });
      if (up.error) {
        await fetch('/api/admin/takeoffs/' + d.id, { method: 'DELETE' }).catch(() => null);
        throw new Error('The file did not finish uploading. Check the connection and try again. A very large plan set may need to be split into smaller PDFs.');
      }
      router.push('/admin/takeoff/' + d.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not bring that in.');
      setBusy('');
    }
  };

  const remove = async (id: string) => {
    if (sure !== id) { setSure(id); return; }
    setSure('');
    await fetch('/api/admin/takeoffs/' + id, { method: 'DELETE' }).catch(() => null);
    load();
  };

  return (
    <AppShell>
      <AdminHeader title="Bid from Plans" />
      <div className="px-4 sm:px-6 pb-28 max-w-3xl mx-auto w-full min-w-0">
        <p className="text-[17px] text-white/85 leading-relaxed mb-4">
          Bring in the PDF of the plans. Set the scale on a sheet, then measure lengths, areas and counts right on it. The quantities go to an estimate as priced lines.
        </p>

        <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) bringIn(f); }} />
        <button type="button" disabled={!!busy} onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && !busy) bringIn(f); }}
          className="w-full min-h-[96px] rounded-2xl border-2 border-dashed border-[#C9A84C]/60 bg-[#C9A84C]/10 text-white flex items-center justify-center gap-3 px-4 active:scale-[0.99] disabled:opacity-70">
          {busy ? <Loader2 size={26} className="animate-spin text-[#E5C76B] shrink-0" /> : <Upload size={26} className="text-[#E5C76B] shrink-0" />}
          <span className="text-left">
            <span className="block text-[19px] font-bold leading-snug">{busy || 'Bring in a set of plans'}</span>
            {!busy && <span className="block text-[15px] text-white/75">PDF, up to 50 MB. A big set can take a minute to upload.</span>}
          </span>
        </button>
        {error && (
          <div className="mt-3 rounded-xl bg-red-500/12 border border-red-500/40 px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={22} className="text-red-300 shrink-0 mt-0.5" /><p className="text-[17px] text-red-100 leading-snug">{error}</p>
          </div>
        )}

        <h2 className="text-[15px] font-bold uppercase tracking-wide text-[#E5C76B] mt-7 mb-2">Your plan sets</h2>
        {rows === null && <p className="text-[17px] text-white/75 flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Loading…</p>}
        {rows && rows.length === 0 && <p className="text-[17px] text-white/80">None yet. The first set you bring in shows up here.</p>}
        <div className="space-y-2.5">
          {(rows || []).map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/15 bg-white/[0.04] flex items-stretch">
              <button type="button" onClick={() => router.push('/admin/takeoff/' + t.id)} className="flex-1 min-w-0 text-left px-4 py-3.5 flex items-center gap-3 active:bg-white/5 rounded-l-2xl">
                <span className="w-11 h-11 rounded-xl bg-[#C9A84C]/15 text-[#E5C76B] flex items-center justify-center shrink-0"><Ruler size={22} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[18px] font-bold text-white leading-snug break-words">{t.name}</span>
                  <span className="block text-[15px] text-white/75 leading-snug">
                    {[t.page_count ? `${t.page_count} sheet${t.page_count === 1 ? '' : 's'}` : '', t.item_count ? `${t.item_count} item${t.item_count === 1 ? '' : 's'} measured` : 'Nothing measured yet', mb(t.file_size), day(t.updated_at)].filter(Boolean).join(' · ')}
                  </span>
                  {t.estimate && <span className="block text-[15px] text-[#8fd6a8] leading-snug">Sent to {t.estimate.estimate_number}{t.estimate.project_name ? ` · ${t.estimate.project_name}` : ''}</span>}
                </span>
                <ChevronRight size={22} className="text-white/60 shrink-0" />
              </button>
              <button type="button" onClick={() => remove(t.id)} onBlur={() => setSure('')} aria-label={`Delete ${t.name}`}
                className={`shrink-0 min-w-[56px] px-3 rounded-r-2xl border-l border-white/15 flex items-center justify-center gap-1.5 text-[15px] font-semibold ${sure === t.id ? 'bg-red-500/25 text-red-100' : 'text-white/70'}`}>
                <Trash2 size={20} />{sure === t.id && <span>Tap again</span>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
