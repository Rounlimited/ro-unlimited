'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, CloudRain, Hammer, AlertTriangle, Flag, ClipboardCheck, StickyNote, Trash2, Plus, X,
} from 'lucide-react';
import { STATUS_REASONS } from '@/lib/reporting';

/**
 * Job log — what actually happened on site, typed as it happens.
 * "Rain, no work." "Water line installed." "Inspection passed."
 * The weekly/monthly report is assembled from these lines, so by the time
 * JR presses "Draft the Next Report" the writing is already done.
 */

interface Entry {
  id: string;
  entry_date: string;
  type: string;
  text: string | null;
  reason: string | null;
  include_in_report: boolean;
  created_at: string;
}

const TYPES: { id: string; label: string; icon: any; color: string }[] = [
  { id: 'work',       label: 'Work Done',   icon: Hammer,         color: '#D4B965' },
  { id: 'rain',       label: 'Rain Day',    icon: CloudRain,      color: '#5ba3dc' },
  { id: 'delay',      label: 'Problem',     icon: AlertTriangle,  color: '#f87171' },
  { id: 'milestone',  label: 'Milestone',   icon: Flag,           color: '#35d07f' },
  { id: 'inspection', label: 'Inspection',  icon: ClipboardCheck, color: '#a78bfa' },
  { id: 'note',       label: 'Note',        icon: StickyNote,     color: '#9ca3af' },
];

const META = (t: string) => TYPES.find((x) => x.id === t) || TYPES[5];
const today = () => new Date().toISOString().slice(0, 10);
const dayLabel = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const PLACEHOLDERS: Record<string, string> = {
  work: 'Water line installed from meter to house',
  rain: 'Optional — rained out says it by itself',
  delay: 'Waiting on the county inspector to release the trench',
  milestone: 'Footings poured and passed inspection',
  inspection: 'Plumbing rough-in inspection passed',
  note: 'Owner picked the driveway finish',
};

export default function JobLogPanel({ estimateId }: { estimateId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openType, setOpenType] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/log');
      const d = await res.json();
      if (Array.isArray(d.entries)) setEntries(d.entries);
    } catch { /* keep last */ }
    setLoading(false);
  }, [estimateId]);

  useEffect(() => { load(); }, [load]);

  const open = (type: string) => {
    setOpenType(type); setText(''); setReason(null); setDate(today()); setError(null);
  };

  const submit = async () => {
    if (!openType) return;
    if (!text.trim() && openType !== 'rain') { setError('Say what happened'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: openType, text: text.trim(), entry_date: date, reason }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else { setOpenType(null); setText(''); await load(); }
    } catch { setError('Could not save that'); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this log entry?')) return;
    await fetch('/api/admin/estimates/' + estimateId + '/log?id=' + id, { method: 'DELETE' }).catch(() => {});
    load();
  };

  const toggleInclude = async (e: Entry) => {
    await fetch('/api/admin/estimates/' + estimateId + '/log', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: e.id, include_in_report: !e.include_in_report }),
    }).catch(() => {});
    load();
  };

  if (loading) {
    return <div className="flex items-center gap-3 text-white/40 py-6"><Loader2 size={20} className="animate-spin" /> Loading log…</div>;
  }

  const unreported = entries.filter((e) => e.include_in_report).length;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
      <div className="mb-3">
        <p className="text-[17px] font-bold">Job Log</p>
        <p className="text-[14px] text-white/40 mt-0.5">
          Tap what happened as the week goes. The report writes itself from these.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => open(t.id)}
              className="min-h-[64px] rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Icon size={19} style={{ color: t.color }} />
              <span className="text-[13px] font-semibold text-white/70">{t.label}</span>
            </button>
          );
        })}
      </div>

      {openType && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[15px] font-bold flex items-center gap-2">
              {(() => { const I = META(openType).icon; return <I size={16} style={{ color: META(openType).color }} />; })()}
              {META(openType).label}
            </p>
            <button onClick={() => setOpenType(null)} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <X size={16} className="text-white/50" />
            </button>
          </div>

          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} autoFocus
            placeholder={PLACEHOLDERS[openType]}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50 mb-2.5" />

          {openType === 'delay' && (
            <div className="flex gap-1.5 flex-wrap mb-2.5">
              {STATUS_REASONS.map((r) => (
                <button key={r.id} onClick={() => setReason(reason === r.id ? null : r.id)}
                  className="min-h-[42px] px-3 rounded-full text-[14px] font-semibold active:scale-95"
                  style={reason === r.id
                    ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center mb-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="min-h-[48px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] focus:outline-none focus:border-[#C9A84C]/50" />
            <p className="text-[13px] text-white/30">Change the date to log a day you missed.</p>
          </div>

          {error && <p className="text-[15px] text-[#f87171] mb-2.5">{error}</p>}

          <button onClick={submit} disabled={saving}
            className="w-full min-h-[52px] rounded-xl text-[16px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)' }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={17} />} Add to Log
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-[15px] text-white/35">
          Nothing logged yet. Tap a button above — a rain day takes one tap.
        </p>
      ) : (
        <>
          <p className="text-[13px] text-white/30 mb-2">
            {unreported} {unreported === 1 ? 'entry' : 'entries'} will go in the next report
          </p>
          <div className="space-y-2">
            {entries.slice(0, 25).map((e) => {
              const m = META(e.type);
              const Icon = m.icon;
              return (
                <div key={e.id}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    opacity: e.include_in_report ? 1 : 0.45,
                  }}>
                  <Icon size={17} style={{ color: m.color }} className="shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white/35">{dayLabel(e.entry_date)}</p>
                    <p className="text-[16px] text-white/80 leading-snug">
                      {e.text || (e.type === 'rain' ? 'Rained out, no work.' : '—')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleInclude(e)}
                      title={e.include_in_report ? 'Hide from the report' : 'Include in the report'}
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[12px] font-bold active:scale-95"
                      style={{ color: e.include_in_report ? '#35d07f' : 'rgba(255,255,255,0.3)' }}>
                      {e.include_in_report ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => remove(e.id)}
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center active:scale-95">
                      <Trash2 size={14} className="text-white/35" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
