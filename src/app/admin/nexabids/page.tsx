'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/admin/AppShell';
import AdminHeader from '@/components/admin/AdminHeader';
import { Loader2, Upload, Trash2, AlertTriangle, ChevronRight, Lock, Star, FileText, HardHat } from 'lucide-react';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import { BID_STAGES, type BidStage } from '@/lib/nexabids';

/**
 * NexaBids home. A bid starts here: plans in, measured, priced. Once it becomes an estimate it lives in
 * Estimates, and once the customer signs it is a job in Jobs. This screen keeps showing where each bid stands.
 * It is a Nexa module, so it wears Nexa's look (dark glass, blue/violet/cyan) inside RO's admin. Built for a
 * phone in the field first.
 */
type Bid = {
  id: string; name: string; file_size: number | null; page_count: number | null; item_count: number; updated_at: string; stage: BidStage;
  estimate: { id: string; estimate_number: string; project_name: string | null; total: number | null } | null;
};
const mb = (n: number | null) => (n ? (n / 1_000_000 >= 1 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`) : '');
const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const usd = (n: number | null) => (n ? '$' + Math.round(n).toLocaleString('en-US') : '');
const stageOf = (k: BidStage) => BID_STAGES.find((s) => s.key === k)!;

export default function NexaBidsPage() {
  const router = useRouter();
  const [bids, setBids] = useState<Bid[] | null>(null);
  const [locked, setLocked] = useState('');
  const [plan, setPlan] = useState('');
  const [filter, setFilter] = useState<BidStage | 'all'>('all');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [sure, setSure] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/takeoffs').catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r && r.status === 402) { setLocked(d.error || 'NexaBids is not switched on for this account.'); setBids([]); return; }
    setPlan(d.access?.plan || ''); setBids(Array.isArray(d.bids) ? d.bids : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = async (file: File) => {
    setError('');
    if (!/\.pdf$/i.test(file.name)) { setError('Plans need to be a PDF file. If you have them as pictures or CAD files, ask the engineer or architect for the PDF set.'); return; }
    setBusy(`Bringing in ${file.name}…`);
    try {
      const r = await fetch('/api/admin/takeoffs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', file_name: file.name, file_size: file.size }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.id) throw new Error(d.error || 'Could not start that. Try again.');
      let up: { error: unknown } = { error: null };
      if (Array.isArray(d.parts)) {
        // a big set goes up in pieces; a piece that fails is tried once more before giving up
        const sb = createBrowserSupabase();
        for (let i = 0; i < d.parts.length && !up.error; i++) {
          const p = d.parts[i]; setBusy(`Bringing in ${file.name}: part ${i + 1} of ${d.parts.length}. Keep this screen open.`);
          let one = await sb.storage.from(d.bucket).uploadToSignedUrl(p.path, p.token, file.slice(p.from, p.to), { contentType: 'application/octet-stream', upsert: true });
          if (one.error) one = await sb.storage.from(d.bucket).uploadToSignedUrl(p.path, p.token, file.slice(p.from, p.to), { contentType: 'application/octet-stream', upsert: true });
          if (one.error) up = { error: one.error };
        }
      } else up = await createBrowserSupabase().storage.from(d.bucket).uploadToSignedUrl(d.path, d.token, file, { contentType: 'application/pdf' });
      if (up.error) {
        await fetch('/api/admin/takeoffs/' + d.id, { method: 'DELETE' }).catch(() => null);
        throw new Error('The file did not finish uploading. Check the signal and try again. Big plan sets take a few minutes on a phone signal; Wi-Fi is much quicker.');
      }
      router.push('/admin/nexabids/' + d.id);
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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of bids || []) c[b.stage] = (c[b.stage] || 0) + 1;
    return c;
  }, [bids]);
  const shown = (bids || []).filter((b) => filter === 'all' || b.stage === filter);

  return (
    <AppShell>
      <AdminHeader title="NexaBids" />
      <div className="px-4 sm:px-6 pb-28 max-w-3xl mx-auto w-full min-w-0">
        {/* the module's own masthead */}
        <div className="nbd-hero">
          <span className="nbd-aurora" aria-hidden="true"><i /><i /><i /></span>
          <div className="relative z-[1] flex items-center gap-3">
            <span className="nbd-logo" aria-hidden="true">N</span>
            <div className="flex-1 min-w-0">
              <p className="text-[25px] font-extrabold leading-none text-white">Nexa<span className="nbd-grad">Bids</span></p>
              <p className="text-[16px] font-semibold text-[#d6e0f2] leading-snug mt-1">Plans in. Bid out.</p>
            </div>
            <span className="nbd-pill"><Star size={14} fill="currentColor" className="text-[#fde68a]" /> Premium</span>
          </div>
          <p className="relative z-[1] text-[16px] text-[#e6edfb] leading-relaxed mt-3">
            Start a bid from the plans, measure on the sheets, and price it. It becomes an estimate when you are ready, and a job when the customer signs.
          </p>
          {plan === 'preview' && <p className="relative z-[1] text-[15px] text-[#bcd0f5] leading-snug mt-2">Preview: included with your account while it is being built.</p>}
        </div>

        {locked ? (
          <div className="mt-4 rounded-2xl border border-[#a78bfa]/60 bg-[#a78bfa]/10 p-5 flex items-start gap-3">
            <Lock size={26} className="text-[#c4b5fd] shrink-0 mt-0.5" />
            <div>
              <p className="text-[19px] font-bold text-white leading-snug">NexaBids is not switched on</p>
              <p className="text-[17px] text-white/85 leading-relaxed mt-1">{locked} Call or message NexaVision Group to add it.</p>
            </div>
          </div>
        ) : (<>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) start(f); }} />
          <button type="button" disabled={!!busy} onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && !busy) start(f); }}
            className="nbd-start mt-4 w-full min-h-[84px] rounded-2xl flex items-center justify-center gap-3 px-4 active:scale-[0.99] disabled:opacity-70">
            {busy ? <Loader2 size={28} className="animate-spin shrink-0" /> : <Upload size={28} className="shrink-0" />}
            <span className="text-left">
              <span className="block text-[20px] font-extrabold leading-snug">{busy || 'Start a new bid'}</span>
              {!busy && <span className="block text-[15px] font-semibold opacity-80">Pick the PDF of the plans, up to 50 MB</span>}
            </span>
          </button>
          {error && (
            <div className="mt-3 rounded-xl bg-red-500/12 border border-red-500/40 px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={22} className="text-red-300 shrink-0 mt-0.5" /><p className="text-[17px] text-red-100 leading-snug">{error}</p>
            </div>
          )}

          {/* where the bids stand */}
          <div className="mt-6 -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 w-max pb-1">
              <button onClick={() => setFilter('all')} className={`min-h-[52px] px-4 rounded-xl border text-[16px] font-bold whitespace-nowrap ${filter === 'all' ? 'border-[#7dd3fc] bg-[#7dd3fc]/15 text-white' : 'border-white/20 text-white/85'}`}>All · {(bids || []).length}</button>
              {BID_STAGES.map((s) => (
                <button key={s.key} onClick={() => setFilter(s.key)} className={`min-h-[52px] px-4 rounded-xl border text-[16px] font-bold whitespace-nowrap flex items-center gap-2 ${filter === s.key ? 'bg-white/10 text-white' : 'border-white/20 text-white/85'}`} style={filter === s.key ? { borderColor: s.color } : undefined}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />{s.label} · {counts[s.key] || 0}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {bids === null && <p className="text-[17px] text-white/80 flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Loading…</p>}
            {bids && shown.length === 0 && <p className="text-[17px] text-white/85 leading-snug">{bids.length === 0 ? 'No bids yet. Start one with the plans.' : 'None at this stage.'}</p>}
            {shown.map((b) => {
              const s = stageOf(b.stage);
              return (
                <div key={b.id} className="rounded-2xl border border-white/15 bg-white/[0.04] overflow-hidden">
                  <div className="flex items-stretch">
                    <button type="button" onClick={() => router.push('/admin/nexabids/' + b.id)} className="flex-1 min-w-0 text-left px-4 py-3.5 flex items-center gap-3 active:bg-white/5">
                      <span className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-wide" style={{ color: s.color }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}
                        </span>
                        <span className="block text-[18px] font-bold text-white leading-snug break-words mt-0.5">{b.name}</span>
                        <span className="block text-[15px] text-white/75 leading-snug">
                          {[b.page_count ? `${b.page_count} sheet${b.page_count === 1 ? '' : 's'}` : '', b.item_count ? `${b.item_count} measured` : 'Nothing measured yet', mb(b.file_size), day(b.updated_at)].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <ChevronRight size={24} className="text-white/60 shrink-0" />
                    </button>
                    {b.stage === 'working' && (
                      <button type="button" onClick={() => remove(b.id)} onBlur={() => setSure('')} aria-label={`Delete ${b.name}`}
                        className={`shrink-0 min-w-[56px] px-3 border-l border-white/15 flex items-center justify-center gap-1.5 text-[15px] font-semibold ${sure === b.id ? 'bg-red-500/25 text-red-100' : 'text-white/70'}`}>
                        <Trash2 size={20} />{sure === b.id && <span>Tap again</span>}
                      </button>
                    )}
                  </div>
                  {b.estimate && (
                    <button type="button" onClick={() => router.push(b.stage === 'won' ? '/admin/jobs/' + b.estimate!.id : '/admin/estimates/' + b.estimate!.id)}
                      className="w-full min-h-[52px] px-4 py-2.5 border-t border-white/10 bg-black/25 text-left flex items-center gap-2.5 active:bg-white/5">
                      {b.stage === 'won' ? <HardHat size={20} style={{ color: s.color }} className="shrink-0" /> : <FileText size={20} style={{ color: s.color }} className="shrink-0" />}
                      <span className="flex-1 min-w-0 text-[16px] font-semibold text-white leading-snug">
                        {b.stage === 'won' ? 'Open the job' : 'Open the estimate'} · {b.estimate.estimate_number}{usd(b.estimate.total) ? ` · ${usd(b.estimate.total)}` : ''}
                        <span className="block text-[14px] font-normal text-white/70">{s.where}</span>
                      </span>
                      <ChevronRight size={20} className="text-white/60 shrink-0" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>)}
      </div>
      <style>{CSS}</style>
    </AppShell>
  );
}

const CSS = `
.nbd-hero { position: relative; overflow: hidden; isolation: isolate; border-radius: 20px; padding: 18px 16px;
  background: linear-gradient(135deg, #070b16 0%, #0b1022 55%, #071319 100%); border: 1px solid rgba(125, 211, 252, .35);
  box-shadow: 0 12px 34px rgba(37, 99, 235, .22), 0 2px 10px rgba(0, 0, 0, .5); }
.nbd-aurora { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.nbd-aurora i { position: absolute; border-radius: 50%; filter: blur(34px); opacity: .5; animation: nbd-drift 10s ease-in-out infinite; }
.nbd-aurora i:nth-child(1) { width: 170px; height: 170px; left: -40px; top: -70px; background: #2563eb; }
.nbd-aurora i:nth-child(2) { width: 190px; height: 190px; right: 10%; top: -100px; background: #7c3aed; animation-delay: -3s; }
.nbd-aurora i:nth-child(3) { width: 170px; height: 170px; right: -50px; bottom: -100px; background: #06b6d4; animation-delay: -6s; }
.nbd-logo { flex: none; width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center;
  font: 800 24px/1 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #04121f;
  background: linear-gradient(120deg, #7dd3fc, #a78bfa 55%, #22d3ee); box-shadow: 0 0 24px rgba(125, 211, 252, .5); }
.nbd-grad { background: linear-gradient(120deg, #7dd3fc, #c4b5fd 55%, #67e8f9); -webkit-background-clip: text; background-clip: text; color: transparent; }
.nbd-pill { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px;
  font: 800 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #fff;
  background: linear-gradient(120deg, rgba(125, 211, 252, .25), rgba(167, 139, 250, .38) 55%, rgba(34, 211, 238, .25)); border: 1px solid rgba(167, 139, 250, .7); }
.nbd-start { color: #04121f; background: linear-gradient(120deg, #7dd3fc, #a78bfa 55%, #22d3ee); box-shadow: 0 10px 28px rgba(124, 58, 237, .35); }
@keyframes nbd-drift { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(18px, 8px) scale(1.12); } }
@media (prefers-reduced-motion: reduce) { .nbd-aurora i { animation: none; } }
`;
