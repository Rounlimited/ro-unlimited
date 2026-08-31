'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/admin/AppShell';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Loader2, HardHat, ChevronRight, AlertTriangle, FileText, CalendarClock,
  Phone, CheckCircle2, CloudRain, Hammer, Sparkles, X, Search,
} from 'lucide-react';
import { SCHEDULE_META, BUDGET_META, cadenceLabel, type ScheduleStatus, type BudgetStatus } from '@/lib/reporting';

/**
 * Jobs — the work that's actually happening.
 *
 * Estimates are where work is won; a job is what it becomes once accepted or
 * signed. The screen opens on what needs him today, and the two things he does
 * every day — log what happened, send the report — are on the card itself so
 * they don't cost four taps and two screens.
 */

interface Job {
  id: string; number: string; project_name: string | null; division: string | null;
  total: number; signed_at: string | null; address: string | null;
  customer_name: string | null; customer_phone: string | null;
  percent: number; phase_count: number; in_progress: string | null; next_up: string | null;
  schedule_status: ScheduleStatus | null; budget_status: BudgetStatus | null;
  reporting_cadence: string | null; reporting_day: string | null;
  report_due: boolean; draft_waiting: boolean; last_report_sent: string | null;
  last_log_at: string | null; stale: boolean;
  earned: number; billed: number; paid: number;
  tracked: boolean; complete: boolean; reasons: string[];
}

type Filter = 'attention' | 'running' | 'behind' | 'complete';

const fmt$ = (n: number) => '$' + Math.round(n).toLocaleString();
const shortDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
const daysAgo = (s: string | null) => {
  if (!s) return null;
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState({ all: 0, attention: 0, running: 0, behind: 0, complete: 0 });
  const [money, setMoney] = useState({ contract: 0, earned: 0, billed: 0 });
  const [filter, setFilter] = useState<Filter>('attention');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<Job | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/jobs/list');
      const d = await res.json();
      if (Array.isArray(d.jobs)) setJobs(d.jobs);
      if (d.counts) setCounts(d.counts);
      if (d.money) setMoney(d.money);
    } catch { /* keep last */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Land on whatever actually has something waiting.
  useEffect(() => {
    if (!loading && counts.attention === 0 && filter === 'attention') setFilter('running');
  }, [loading, counts.attention, filter]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filter === 'attention' && (j.complete || !j.reasons.length)) return false;
      if (filter === 'running' && j.complete) return false;
      if (filter === 'behind' && (j.complete || j.schedule_status !== 'behind')) return false;
      if (filter === 'complete' && !j.complete) return false;
      if (!q) return true;
      return [j.project_name, j.customer_name, j.number, j.address].filter(Boolean)
        .join(' ').toLowerCase().includes(q);
    });
  }, [jobs, filter, search]);

  const draftReport = async (j: Job) => {
    setBusy(j.id);
    try {
      const res = await fetch('/api/admin/estimates/' + j.id + '/reports', { method: 'POST' });
      const d = await res.json();
      if (d.error) setToast(d.error);
      else { setToast('Report drafted — opening it'); router.push('/admin/estimates/' + j.id); }
    } catch { setToast('Could not draft that'); }
    setBusy(null);
  };

  const quickLog = async (j: Job, type: string, text?: string) => {
    setBusy(j.id);
    try {
      const res = await fetch('/api/admin/estimates/' + j.id + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: text || '' }),
      });
      const d = await res.json();
      setToast(d.error ? d.error : type === 'rain' ? 'Rain day logged' : 'Added to the log');
      if (!d.error) load();
    } catch { setToast('Could not save that'); }
    setBusy(null);
    setLogFor(null);
  };

  const TABS: { id: Filter; label: string; n: number }[] = [
    { id: 'attention', label: 'Needs You', n: counts.attention },
    { id: 'running', label: 'Running', n: counts.running },
    { id: 'behind', label: 'Behind', n: counts.behind },
    { id: 'complete', label: 'Complete', n: counts.complete },
  ];

  return (
    <AppShell>
      <AdminHeader title="Jobs" subtitle="Work in progress" />
      <div className="px-4 sm:px-6 pb-28 max-w-3xl mx-auto w-full min-w-0 overflow-x-hidden">

        {/* ── Money position across everything running ── */}
        {money.contract > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Under contract', v: money.contract, c: '#D4B965' },
              { label: 'Earned to date', v: money.earned, c: '#35d07f' },
              { label: 'Billed', v: money.billed, c: money.earned - money.billed > 2500 ? '#f87171' : 'rgba(255,255,255,0.6)' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/8 bg-[#111] p-3">
                <p className="text-[12px] uppercase tracking-wide text-white/35">{s.label}</p>
                <p className="text-[19px] font-bold mt-0.5" style={{ color: s.c }}>{fmt$(s.v)}</p>
              </div>
            ))}
          </div>
        )}
        {money.earned - money.billed > 2500 && (
          <p className="text-[15px] mb-4 px-1" style={{ color: '#f87171' }}>
            You&rsquo;ve done {fmt$(money.earned - money.billed)} more work than you&rsquo;ve billed.
          </p>
        )}

        {/* ── Filters ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
          {TABS.map((t) => {
            const on = filter === t.id;
            const urgent = t.id === 'attention' && t.n > 0;
            return (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className="shrink-0 min-h-[48px] px-4 rounded-xl text-[15px] font-bold active:scale-95 whitespace-nowrap"
                style={on
                  ? { background: urgent ? 'rgba(248,113,113,0.16)' : 'rgba(201,168,76,0.18)', color: urgent ? '#f87171' : '#D4B965', border: '1px solid ' + (urgent ? 'rgba(248,113,113,0.45)' : 'rgba(201,168,76,0.45)') }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {t.label}{t.n ? ` · ${t.n}` : ''}
              </button>
            );
          })}
        </div>

        {jobs.length > 4 && (
          <div className="relative mb-3">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a job…"
              className="w-full min-h-[50px] pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-[16px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-white/40 py-8">
            <Loader2 size={20} className="animate-spin" /> Loading jobs…
          </div>
        ) : shown.length === 0 ? (
          <EmptyState filter={filter} anyJobs={jobs.length > 0} onGo={() => router.push('/admin/estimates')} />
        ) : (
          <div className="space-y-2.5">
            {shown.map((j) => (
              <JobCard key={j.id} job={j} busy={busy === j.id}
                onOpen={() => router.push('/admin/estimates/' + j.id)}
                onDraft={() => draftReport(j)}
                onLog={() => setLogFor(j)}
              />
            ))}
          </div>
        )}
      </div>

      {logFor && (
        <QuickLogSheet job={logFor} busy={busy === logFor.id}
          onClose={() => setLogFor(null)}
          onPick={(type, text) => quickLog(logFor, type, text)} />
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-xl text-[16px] font-semibold shadow-2xl"
          style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))', background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.4)', color: '#D4B965' }}>
          {toast}
        </div>
      )}
    </AppShell>
  );
}

/* ── One job ──────────────────────────────────────────────────── */
function JobCard({ job: j, busy, onOpen, onDraft, onLog }: {
  job: Job; busy: boolean; onOpen: () => void; onDraft: () => void; onLog: () => void;
}) {
  const sched = j.schedule_status ? SCHEDULE_META[j.schedule_status] : null;
  const budget = j.budget_status ? BUDGET_META[j.budget_status] : null;
  const cadence = cadenceLabel(j.reporting_cadence, j.reporting_day);
  const flagged = j.reasons.length > 0 && !j.complete;

  return (
    <div className="rounded-2xl border bg-[#111] overflow-hidden"
      style={{ borderColor: flagged ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)' }}>

      <button onClick={onOpen} className="w-full text-left p-4 active:scale-[0.995] transition-transform">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[18px] font-bold truncate">{j.project_name || j.number}</p>
              {j.tracked && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(240,160,75,0.15)', color: '#f0a04b' }}>TRACKED</span>
              )}
              {j.complete && <CheckCircle2 size={16} className="text-[#35d07f]" />}
            </div>
            <p className="text-[14px] text-white/40 truncate mt-0.5">
              {[j.customer_name, j.address].filter(Boolean).join(' · ') || j.number}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[24px] font-bold leading-none"
              style={{ color: j.complete ? '#35d07f' : '#D4B965' }}>{j.percent}%</p>
            {j.total > 0 && <p className="text-[13px] text-white/30 mt-1">{fmt$(j.total)}</p>}
          </div>
        </div>

        <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-2.5">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: j.percent + '%', background: j.complete ? '#35d07f' : 'linear-gradient(90deg, #a8893d, #D4B965)' }} />
        </div>

        {/* Why it wants him — plain words, first reason only */}
        {flagged && (
          <p className="text-[15px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#D4B965' }}>
            <AlertTriangle size={15} /> {j.reasons[0]}
          </p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {sched && (
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: sched.bg, color: sched.color }}>
              {j.schedule_status === 'on' ? 'On Schedule' : j.schedule_status === 'ahead' ? 'Ahead' : 'Behind'}
            </span>
          )}
          {budget && (
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: budget.bg, color: budget.color }}>
              {j.budget_status === 'on' ? 'On Budget' : j.budget_status === 'under' ? 'Under Budget' : 'Over Budget'}
            </span>
          )}
          {cadence && !j.complete && (
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}>
              <CalendarClock size={11} /> {cadence}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-2.5">
          <p className="text-[14px] text-white/35 truncate">
            {j.in_progress ? `Working: ${j.in_progress}` : j.next_up ? `Up next: ${j.next_up}` : 'No phases yet'}
            {j.last_log_at ? ` · logged ${daysAgo(j.last_log_at)}` : ''}
          </p>
          <ChevronRight size={16} className="text-white/20 shrink-0" />
        </div>
      </button>

      {/* The two things done daily, without opening the job */}
      {!j.complete && (
        <div className="grid grid-cols-3 border-t border-white/8">
          <button onClick={onLog} disabled={busy}
            className="min-h-[54px] flex items-center justify-center gap-2 text-[15px] font-bold active:scale-95 disabled:opacity-40"
            style={{ color: '#D4B965' }}>
            <Hammer size={16} /> Log
          </button>
          <button onClick={onDraft} disabled={busy}
            className="min-h-[54px] flex items-center justify-center gap-2 text-[15px] font-bold border-x border-white/8 active:scale-95 disabled:opacity-40"
            style={{ color: j.draft_waiting ? '#35d07f' : '#D4B965' }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {j.draft_waiting ? 'Send' : 'Report'}
          </button>
          {j.customer_phone ? (
            <a href={`tel:${j.customer_phone}`}
              className="min-h-[54px] flex items-center justify-center gap-2 text-[15px] font-bold active:scale-95"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Phone size={16} /> Call
            </a>
          ) : (
            <span className="min-h-[54px] flex items-center justify-center text-[15px] text-white/20">No phone</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Log without leaving the list ─────────────────────────────── */
function QuickLogSheet({ job, busy, onClose, onPick }: {
  job: Job; busy: boolean; onClose: () => void; onPick: (type: string, text?: string) => void;
}) {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10 p-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[20px] font-bold">What happened?</h2>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5">
            <X size={20} className="text-white/60" />
          </button>
        </div>
        <p className="text-[14px] text-white/40 mb-4 truncate">{job.project_name || job.number}</p>

        <button onClick={() => onPick('rain')} disabled={busy}
          className="w-full min-h-[60px] rounded-xl text-[17px] font-bold flex items-center justify-center gap-2.5 mb-3 active:scale-[0.99] disabled:opacity-40"
          style={{ background: 'rgba(91,163,220,0.14)', color: '#5ba3dc', border: '1px solid rgba(91,163,220,0.4)' }}>
          <CloudRain size={20} /> Rained out — no work
        </button>

        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus
          placeholder="Water line installed from the meter to the house"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50 mb-3" />

        <button onClick={() => onPick('work', text)} disabled={busy || !text.trim()}
          className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99]"
          style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)' }}>
          {busy ? <Loader2 size={19} className="animate-spin" /> : <Hammer size={18} />} Add to the Log
        </button>
        <p className="text-[13px] text-white/30 text-center mt-2">
          Goes in the next report to the customer.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ filter, anyJobs, onGo }: { filter: Filter; anyJobs: boolean; onGo: () => void }) {
  const copy: Record<Filter, { title: string; body: string }> = {
    attention: { title: 'Nothing needs you', body: 'Every running job is logged, reported and on track.' },
    running: { title: 'No jobs running', body: 'An estimate becomes a job the moment it’s accepted. Bid something on paper? Track it by hand from the Estimates screen.' },
    behind: { title: 'Nothing behind', body: 'No job is flagged behind schedule.' },
    complete: { title: 'Nothing finished yet', body: 'Jobs move here when every phase hits 100%.' },
  };
  const c = copy[filter];
  return (
    <div className="rounded-2xl border border-white/8 bg-[#111] p-6 text-center">
      {filter === 'attention' ? (
        <Sparkles size={26} className="mx-auto mb-3" style={{ color: '#35d07f' }} />
      ) : (
        <HardHat size={26} className="text-white/20 mx-auto mb-3" />
      )}
      <p className="text-[17px] font-bold mb-1">{c.title}</p>
      <p className="text-[15px] text-white/40 leading-relaxed mb-4">{c.body}</p>
      {!anyJobs && (
        <button onClick={onGo}
          className="min-h-[52px] px-5 rounded-xl text-[16px] font-bold text-black active:scale-[0.99]"
          style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)' }}>
          Go to Estimates
        </button>
      )}
    </div>
  );
}
