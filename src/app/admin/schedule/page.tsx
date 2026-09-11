'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Plus, CheckCircle2, Circle, Trash2, X,
  CalendarDays, HardHat, ClipboardCheck, Truck, Users2, Coffee, LayoutList, GanttChartSquare,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AppShell from '@/components/admin/AppShell';

/**
 * The Schedule, built the way supers actually plan: a rolling 3-WEEK
 * LOOK-AHEAD. Slipped work on top, then Today, This Week (the commitment
 * window), Next Week, and Week 3 — the "get ready" window where problems are
 * still cheap. Second tab: a 6-week timeline, jobs as rows.
 * JR-sized: 17px+ body, 48px+ targets, kinds carried by words, never color.
 */

const KINDS = [
  { id: 'work', label: 'Work', icon: HardHat },
  { id: 'pour', label: 'Pour', icon: HardHat },
  { id: 'inspection', label: 'Inspection', icon: ClipboardCheck },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'meeting', label: 'Meeting', icon: Users2 },
  { id: 'other', label: 'Other', icon: Coffee },
];
const kindMeta = (id: string) => KINDS.find((k) => k.id === id) || KINDS[0];

// Job bars cycle these — always paired with the job's name, never alone.
const JOB_COLORS = ['#D4B965', '#6db3f2', '#35d07f', '#f0a04b', '#b78ef0', '#f28fb1'];

interface Item { id: string; estimate_id: string | null; title: string; kind: string; phase: string | null; starts_on: string; ends_on: string | null; note: string | null; done_at: string | null }
interface JobRef { id: string; estimate_number: string; project_name: string | null }

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // phone-local day, never UTC
const addDays = (d: string, n: number) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return dayKey(x); };
const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function SchedulePage() {
  const router = useRouter();
  const search = useSearchParams();
  const jobFilter = search.get('job');

  const today = dayKey(new Date());
  const [view, setView] = useState<'ahead' | 'timeline'>('ahead');
  const [items, setItems] = useState<Item[]>([]);
  const [jobs, setJobs] = useState<JobRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ from: addDays(today, -21), to: addDays(today, 56) });
      if (jobFilter) qs.set('estimate_id', jobFilter);
      const d = await fetch('/api/admin/schedule?' + qs).then((r) => r.json());
      if (!d.error) { setItems(d.items); setJobs(d.jobs); }
    } catch { /* keep last */ }
    setLoading(false);
  }, [today, jobFilter]);

  useEffect(() => { load(); }, [load]);

  const jobName = (id: string | null) => {
    if (!id) return null;
    const j = jobs.find((x) => x.id === id);
    return j ? (j.project_name || j.estimate_number).replace(/^EXAMPLE — /, 'EX · ') : null;
  };
  const jobColor = (id: string | null) => {
    if (!id) return 'rgba(255,255,255,0.35)';
    const i = jobs.findIndex((x) => x.id === id);
    return JOB_COLORS[(i < 0 ? 0 : i) % JOB_COLORS.length];
  };

  const toggleDone = async (it: Item) => {
    setBusy(it.id);
    try {
      await fetch('/api/admin/schedule/' + it.id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !it.done_at }),
      });
      await load();
    } catch { /* leave */ }
    setBusy(null);
  };

  const remove = async (it: Item) => {
    if (!confirm('Remove "' + it.title + '" from the schedule?')) return;
    setBusy(it.id);
    try { await fetch('/api/admin/schedule/' + it.id, { method: 'DELETE' }); await load(); } catch { /* leave */ }
    setBusy(null);
  };

  /* ── The look-ahead buckets — how supers actually plan ──
     Slipped (not done, date passed) → Today → rest of this week (commitment)
     → next week (commitment) → week 3 (make-ready) → further out. */
  const active = (d: string, it: Item) => it.starts_on <= d && (it.ends_on || it.starts_on) >= d;
  const startsIn = (a: string, b: string) => (it: Item) =>
    !it.done_at || it.starts_on >= today ? it.starts_on >= a && it.starts_on <= b : false;

  const buckets = useMemo(() => {
    const slipped = items.filter((it) => !it.done_at && (it.ends_on || it.starts_on) < today);
    const todayList = items.filter((it) => active(today, it));
    const week1 = items.filter((it) => it.starts_on > today && it.starts_on <= addDays(today, 6));
    const week2 = items.filter((it) => it.starts_on > addDays(today, 6) && it.starts_on <= addDays(today, 13));
    const week3 = items.filter((it) => it.starts_on > addDays(today, 13) && it.starts_on <= addDays(today, 20));
    const later = items.filter((it) => it.starts_on > addDays(today, 20));
    return { slipped, todayList, week1, week2, week3, later };
  }, [items, today]);

  const SECTIONS: { key: keyof typeof buckets; title: string; hint?: string; color?: string }[] = [
    { key: 'slipped', title: 'Slipped — date passed, not done', color: '#f87171' },
    { key: 'todayList', title: 'Today', color: '#D4B965' },
    { key: 'week1', title: 'Rest of This Week' },
    { key: 'week2', title: 'Next Week' },
    { key: 'week3', title: 'Week 3 — Get Ready', hint: 'Order materials, call for inspections, line up subs now — problems are still cheap this far out.' },
  ];

  /* ── Timeline data: 6 weeks from this Monday ── */
  const tlStart = useMemo(() => {
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dayKey(d);
  }, [today]);
  const TL_DAYS = 42;
  const tlCol = (d: string) => Math.max(0, Math.min(TL_DAYS - 1, Math.round((new Date(d + 'T12:00:00').getTime() - new Date(tlStart + 'T12:00:00').getTime()) / 86400000)));
  const tlJobs = useMemo(() => {
    const ids = Array.from(new Set(items.filter((i) => i.estimate_id).map((i) => i.estimate_id as string)));
    const rows = ids.map((id) => ({ id, name: jobName(id) || '—', color: jobColor(id), items: items.filter((i) => i.estimate_id === id) }));
    const loose = items.filter((i) => !i.estimate_id);
    if (loose.length) rows.push({ id: '', name: 'Not tied to a job', color: 'rgba(255,255,255,0.45)', items: loose });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, jobs]);

  return (
    <AppShell>
      <AdminHeader title="Schedule" subtitle="3-week look-ahead" />
      <div className="px-4 sm:px-6 pt-3 pb-28 max-w-3xl mx-auto w-full min-w-0 overflow-x-hidden">

        {/* ── View switch + add ── */}
        <div className="flex items-center gap-2 mb-3" data-tour="schedule-views">
          {([['ahead', 'Look-Ahead', LayoutList], ['timeline', 'Timeline', GanttChartSquare]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setView(id)}
              className="min-h-[48px] px-4 rounded-xl text-[15px] font-bold flex items-center gap-2 active:scale-95"
              style={view === id
                ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Icon size={17} /> {label}
            </button>
          ))}
          <button onClick={() => setAdding(true)}
            className="ml-auto min-h-[48px] px-4 rounded-xl text-[15px] font-bold text-black flex items-center gap-1.5 active:scale-95"
            style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
            <Plus size={17} /> Add
          </button>
        </div>

        {jobFilter && (
          <button onClick={() => router.push('/admin/schedule')}
            className="mb-3 min-h-[44px] px-4 rounded-full text-[14px] font-semibold flex items-center gap-2"
            style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
            One job only — {jobName(jobFilter) || 'this job'} · tap to see everything <X size={14} />
          </button>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-white/40 py-8"><Loader2 size={20} className="animate-spin" /> Loading the schedule…</div>
        ) : view === 'ahead' ? (
          items.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6 text-center">
              <CalendarDays size={34} className="mx-auto mb-3 text-white/20" />
              <p className="text-[17px] font-bold mb-1">Nothing scheduled yet</p>
              <p className="text-[15px] text-white/40 mb-4">Put the next pour, inspection or delivery on the board — it takes four taps.</p>
              <button onClick={() => setAdding(true)}
                className="min-h-[52px] px-6 rounded-xl text-[16px] font-bold text-black inline-flex items-center gap-2 active:scale-[0.98]"
                style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                <Plus size={18} /> Schedule Something
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {SECTIONS.map(({ key, title, hint, color }) => {
                const list = buckets[key] as Item[];
                if (key === 'slipped' && list.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-[14px] font-bold uppercase tracking-wide mb-1.5 px-0.5" style={{ color: color || 'rgba(255,255,255,0.4)' }}>
                      {title}
                    </p>
                    {hint && list.length > 0 && <p className="text-[13px] text-white/30 mb-2 px-0.5">{hint}</p>}
                    {list.length === 0 ? (
                      <p className="text-[14px] text-white/20 px-0.5">{key === 'todayList' ? 'Nothing on the board today.' : 'Nothing yet.'}</p>
                    ) : (
                      <div className="space-y-2">
                        {list.map((it) => (
                          <ItemRow key={key + it.id} it={it} busy={busy} jobName={jobName(it.estimate_id)} jobColor={jobColor(it.estimate_id)}
                            onDone={() => toggleDone(it)} onRemove={() => remove(it)}
                            showDate={key !== 'todayList'} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {(buckets.later as Item[]).length > 0 && (
                <button onClick={() => setView('timeline')} className="text-[14px] text-white/35 px-0.5 underline underline-offset-4">
                  + {(buckets.later as Item[]).length} more further out — see the Timeline
                </button>
              )}
            </div>
          )
        ) : (
          /* ── Timeline: rows = jobs, the next 6 weeks as columns ── */
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            {tlJobs.length === 0 ? (
              <p className="text-[15px] text-white/40">Nothing on the schedule yet — add the first item and it shows up here as a bar.</p>
            ) : (
              <div className="overflow-x-auto pb-2 -mx-1 px-1">
                <div style={{ minWidth: TL_DAYS * 26 + 120 }}>
                  <div className="flex mb-2" style={{ paddingLeft: 120 }}>
                    {Array.from({ length: 6 }, (_, w) => (
                      <p key={w} className="text-[12px] text-white/30 font-semibold" style={{ width: 7 * 26 }}>
                        {fmtShort(addDays(tlStart, w * 7)).replace(/^\w+, /, '')}
                      </p>
                    ))}
                  </div>
                  {tlJobs.map((row) => (
                    <div key={row.id || 'loose'} className="flex items-center mb-2.5">
                      <button onClick={() => row.id && router.push('/admin/jobs/' + row.id)}
                        className="text-[13px] font-semibold truncate pr-2 text-left" style={{ width: 120, color: row.color }}>
                        {row.name}
                      </button>
                      <div className="relative h-9 rounded-lg" style={{ width: TL_DAYS * 26, background: 'rgba(255,255,255,0.03)' }}>
                        <div className="absolute top-0 bottom-0" style={{ left: tlCol(today) * 26 + 12, width: 2, background: 'rgba(201,168,76,0.5)' }} />
                        {row.items.map((it) => {
                          const a = tlCol(it.starts_on);
                          const b = tlCol(it.ends_on || it.starts_on);
                          return (
                            <div key={it.id} title={it.title}
                              className="absolute top-1.5 h-6 rounded-md flex items-center px-1.5 overflow-hidden"
                              style={{
                                left: a * 26 + 2, width: Math.max(1, b - a + 1) * 26 - 4,
                                background: it.done_at ? 'rgba(255,255,255,0.08)' : row.color,
                                opacity: it.done_at ? 0.6 : 1,
                              }}>
                              {/* A 1-2 day bar can't hold words — it reads as a
                                  clean pill; the Look-Ahead list carries the text. */}
                              {b - a + 1 >= 3 && (
                                <span className="text-[11px] font-bold truncate" style={{ color: it.done_at ? 'rgba(255,255,255,0.5)' : '#000' }}>
                                  {it.done_at ? '✓ ' : ''}{it.title.replace(/^EXAMPLE — /, '')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[13px] text-white/30 mt-2">Slide sideways to see further out. The gold line is today. Tap a job&rsquo;s name to open its Job Room.</p>
          </div>
        )}
      </div>

      {adding && <AddSheet jobs={jobs} defaultJob={jobFilter} onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </AppShell>
  );
}

function ItemRow({ it, busy, jobName, jobColor, onDone, onRemove, showDate }: {
  it: Item; busy: string | null; jobName: string | null; jobColor: string;
  onDone: () => void; onRemove: () => void; showDate?: boolean;
}) {
  const k = kindMeta(it.kind);
  const Icon = k.icon;
  return (
    <div className="rounded-xl border border-white/8 bg-[#111] px-3 py-2.5 flex items-center gap-3">
      <button onClick={onDone} disabled={busy !== null} aria-label={it.done_at ? 'Mark not done' : 'Mark done'}
        className="w-11 h-11 rounded-lg flex items-center justify-center active:scale-90 shrink-0 disabled:opacity-40">
        {busy === it.id ? <Loader2 size={20} className="animate-spin text-white/40" />
          : it.done_at ? <CheckCircle2 size={24} className="text-[#35d07f]" /> : <Circle size={24} className="text-white/25" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={'text-[17px] font-semibold truncate ' + (it.done_at ? 'line-through text-white/35' : '')}>{it.title}</p>
        <p className="text-[14px] text-white/40 flex items-center gap-1.5 flex-wrap">
          <Icon size={13} /> {k.label}
          {jobName && <span className="font-semibold" style={{ color: jobColor }}>· {jobName}</span>}
          {showDate && <span>· {fmtShort(it.starts_on)}</span>}
          {it.ends_on && <span>· thru {fmtShort(it.ends_on).replace(/^\w+, /, '')}</span>}
        </p>
      </div>
      <button onClick={onRemove} disabled={busy !== null}
        className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center active:scale-95 shrink-0 disabled:opacity-40">
        <Trash2 size={14} className="text-white/30" />
      </button>
    </div>
  );
}

function AddSheet({ jobs, defaultJob, onClose, onDone }: {
  jobs: JobRef[]; defaultJob: string | null; onClose: () => void; onDone: () => void;
}) {
  const today = dayKey(new Date());
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('work');
  const [jobId, setJobId] = useState<string>(defaultJob || '');
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim()) { setError('Give it a name — "Pour the footings", "County inspection".'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), kind, estimate_id: jobId || null, starts_on: startsOn, ends_on: endsOn || null }),
      });
      const d = await res.json();
      if (d.error) setError(d.error); else onDone();
    } catch { setError('Could not save — try again.'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[19px] font-bold flex items-center gap-2"><CalendarDays size={20} style={{ color: '#D4B965' }} /> Put It on the Schedule</p>
          <button onClick={onClose} className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center"><X size={18} className="text-white/50" /></button>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
          placeholder='What&apos;s happening? — "Pour the footings"'
          className="w-full min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50 mb-3" />

        <p className="text-[14px] text-white/40 mb-1.5">What kind of thing</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
          {KINDS.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)}
              className="shrink-0 min-h-[46px] px-4 rounded-xl text-[15px] font-semibold active:scale-95 whitespace-nowrap"
              style={kind === k.id
                ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {k.label}
            </button>
          ))}
        </div>

        <p className="text-[14px] text-white/40 mb-1.5">Which job (optional)</p>
        <select value={jobId} onChange={(e) => setJobId(e.target.value)}
          className="w-full min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] focus:outline-none mb-3 appearance-none">
          <option value="" className="bg-[#141414]">Not tied to a job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id} className="bg-[#141414]">{j.project_name || j.estimate_number}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-[14px] text-white/40 mb-1.5">Day</p>
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)}
              className="w-full min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] focus:outline-none" />
          </div>
          <div>
            <p className="text-[14px] text-white/40 mb-1.5">Through (optional)</p>
            <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)}
              className="w-full min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] focus:outline-none" />
          </div>
        </div>

        {error && <p className="text-[15px] mb-3" style={{ color: '#f87171' }}>{error}</p>}

        <button onClick={save} disabled={saving}
          className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
          {saving ? <Loader2 size={19} className="animate-spin" /> : <Plus size={19} />} Add to Schedule
        </button>
      </div>
    </div>
  );
}
