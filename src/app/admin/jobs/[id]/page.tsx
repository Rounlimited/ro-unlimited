'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, Eye, FileText, ClipboardList, Wallet, Plus, Trash2, CheckCircle2,
  CloudRain, CalendarDays, Lock, Mail, Save, TrendingUp, TrendingDown, ExternalLink,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AppShell from '@/components/admin/AppShell';
import { SCHEDULE_META, BUDGET_META, STATUS_REASONS, cadenceLabel, type ScheduleStatus, type BudgetStatus } from '@/lib/reporting';
import { LOG_TYPES } from '@/lib/progress-reports';

/**
 * The Job Room — JR's behind-the-scenes view of one job. Everything the
 * customer's link deliberately hides lives here: real costs and margin,
 * private log entries, his notes, status flags, and how often the customer
 * has actually looked. JR-sized throughout: 17px+ body, 48px targets.
 */

const fmt$ = (n: number) => '$' + Math.round(n).toLocaleString();

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'materials', label: 'Materials' },
  { id: 'subcontractor', label: 'Sub' },
  { id: 'labor', label: 'Labor' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'hauling', label: 'Hauling' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'permits', label: 'Permits' },
  { id: 'other', label: 'Other' },
];
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label || id;

interface FeedbackRow { id: string; kind: string; section: string | null; question: string | null; answer: string | null; rating: number | null; body: string | null; created_at: string; seen_at: string | null }

interface Room {
  estimate: any;
  feedback: FeedbackRow[];
  feedback_unseen: number;
  upcoming: { id: string; title: string; kind: string; starts_on: string; ends_on: string | null }[];
  progress: { percent: number; phases: { phase: string; percent: number; value: number; earned: number }[]; total_value: number };
  money: { contract: number; earned: number; spent: number; margin: number; billed: number; paid: number; unbilled: number; by_category: Record<string, number> };
  costs: { id: string; spent_on: string; category: string; amount: number; vendor: string | null; note: string | null }[];
  invoices: any[];
  log: { id: string; entry_date: string; type: string; text: string | null; include_in_report: boolean }[];
  rain_days: number;
  days_on_job: number;
}

const fmtDay = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const timeAgo = (iso: string | null) => {
  if (!iso) return null;
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'just now';
  if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : d + ' days ago';
};

export default function JobRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // cost quick-add
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('materials');
  const [vendor, setVendor] = useState('');
  const [showAllCosts, setShowAllCosts] = useState(false);

  // notes
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState<'idle' | 'saving' | 'saved'>('idle');

  // notify
  const [notifying, setNotifying] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [forceNotify, setForceNotify] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/admin/jobs/' + id + '/room').then((r) => r.json());
      if (!d.error) {
        setRoom(d); setNotes(d.estimate.internal_notes || '');
        // Opening the room counts as reading the feedback that was waiting.
        if (d.feedback_unseen > 0) fetch('/api/admin/estimates/' + id + '/feedback-seen', { method: 'POST' }).catch(() => {});
      }
    } catch { /* keep last */ }
    setLoading(false);
  }, [id]);

  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);
  const setFlag = async (field: 'feedback_enabled' | 'reviews_enabled', value: boolean) => {
    setTogglingFlag(field);
    try {
      await fetch('/api/admin/estimates/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } catch { /* leave */ }
    setTogglingFlag(null);
  };

  useEffect(() => { load(); }, [load]);

  const addCost = async () => {
    const amt = Number(amount.replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0) return;
    setBusy(true);
    try {
      await fetch('/api/admin/estimates/' + id + '/costs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, category, vendor }),
      });
      setAmount(''); setVendor('');
      await load();
    } catch { /* leave */ }
    setBusy(false);
  };

  const removeCost = async (costId: string, label: string) => {
    if (!confirm('Remove ' + label + '?')) return;
    setBusy(true);
    try {
      await fetch('/api/admin/estimates/' + id + '/costs?id=' + costId, { method: 'DELETE' });
      await load();
    } catch { /* leave */ }
    setBusy(false);
  };

  const saveNotes = async () => {
    setNotesSaved('saving');
    try {
      await fetch('/api/admin/estimates/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_notes: notes }),
      });
      setNotesSaved('saved');
      setTimeout(() => setNotesSaved('idle'), 2500);
    } catch { setNotesSaved('idle'); }
  };

  const notifyCustomer = async () => {
    setNotifying(true);
    try {
      const res = await fetch('/api/admin/estimates/' + id + '/notify-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceNotify }),
      });
      const d = await res.json();
      if (d.warning) { setNotifyMsg(d.warning); setForceNotify(true); }
      else if (d.emailed) { setNotifyMsg('Emailed ' + d.to + ' ✓'); setForceNotify(false); }
      else setNotifyMsg(d.error || 'Could not send.');
    } catch { setNotifyMsg('Could not send — try again.'); }
    setNotifying(false);
  };

  if (loading) {
    return (
      <AppShell>
        <AdminHeader title="Job Room" backHref="/admin/jobs" />
        <div className="flex items-center gap-3 text-white/40 p-6"><Loader2 size={20} className="animate-spin" /> Loading the job…</div>
      </AppShell>
    );
  }
  if (!room) {
    return (
      <AppShell>
        <AdminHeader title="Job Room" backHref="/admin/jobs" />
        <p className="text-[16px] text-white/40 p-6">Could not load this job.</p>
      </AppShell>
    );
  }

  const e = room.estimate;
  const m = room.money;
  const customer = e.customer || {};
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.company_name || null;
  const sched = e.schedule_status ? SCHEDULE_META[e.schedule_status as ScheduleStatus] : null;
  const budget = e.budget_status ? BUDGET_META[e.budget_status as BudgetStatus] : null;
  const reason = STATUS_REASONS.find((r) => r.id === e.status_reason)?.label || null;
  const cadence = cadenceLabel(e.reporting_cadence, e.reporting_day);
  const marginPct = m.earned > 0 ? Math.round((m.margin / m.earned) * 100) : null;
  const spendingAhead = m.spent > m.earned && m.earned > 0;
  const shownCosts = showAllCosts ? room.costs : room.costs.slice(0, 6);
  const done = !!e.completed_at;

  return (
    <AppShell>
      <AdminHeader title={e.project_name || e.estimate_number} subtitle="Job Room — internal only" backHref="/admin/jobs" />
      <div className="px-4 sm:px-6 pt-3 pb-28 max-w-2xl mx-auto w-full min-w-0 overflow-x-hidden space-y-4">

        {/* ── The job at a glance ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-[15px] text-white/40">{e.estimate_number}</p>
              {customerName && <p className="text-[17px] font-semibold mt-0.5">{customerName}</p>}
              {customer.phone && (
                <a href={'tel:' + customer.phone} className="text-[16px] mt-0.5 inline-block" style={{ color: '#D4B965' }}>{customer.phone}</a>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[32px] font-bold leading-none" style={{ color: done ? '#35d07f' : '#D4B965' }}>{room.progress.percent}%</p>
              <p className="text-[13px] text-white/35 mt-1">{done ? 'Complete' : 'of ' + fmt$(m.contract)}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/8 overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: room.progress.percent + '%', background: done ? '#35d07f' : 'linear-gradient(90deg, #a8893d, #D4B965)' }} />
          </div>
          <div className="flex flex-wrap gap-2 text-[14px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60">
              <CalendarDays size={14} /> Day {room.days_on_job}
            </span>
            {room.rain_days > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60">
                <CloudRain size={14} /> {room.rain_days} rain {room.rain_days === 1 ? 'day' : 'days'}
              </span>
            )}
            {sched && <span className="px-3 py-1.5 rounded-full font-semibold" style={{ color: sched.color, background: sched.bg }}>{sched.label}</span>}
            {budget && <span className="px-3 py-1.5 rounded-full font-semibold" style={{ color: budget.color, background: budget.bg }}>{budget.label}</span>}
            {reason && <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/60">{reason}</span>}
          </div>
          {e.status_note && <p className="text-[15px] text-white/50 mt-3">&ldquo;{e.status_note}&rdquo;</p>}
        </div>

        {/* ── Money — the view the customer never gets ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-3 flex items-center gap-2"><Wallet size={18} style={{ color: '#D4B965' }} /> Money</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              ['Contract', m.contract, 'rgba(255,255,255,0.75)'],
              ['Earned', m.earned, '#D4B965'],
              ['Spent', m.spent, m.spent > 0 ? '#f0a04b' : 'rgba(255,255,255,0.4)'],
              ['Billed', m.billed, 'rgba(255,255,255,0.75)'],
              ['Paid', m.paid, '#35d07f'],
              ['Unbilled', m.unbilled, m.unbilled > 2500 ? '#f87171' : 'rgba(255,255,255,0.4)'],
            ].map(([label, v, c]) => (
              <div key={label as string} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[12px] uppercase tracking-wide text-white/35">{label}</p>
                <p className="text-[17px] font-bold mt-0.5" style={{ color: c as string }}>{fmt$(v as number)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: m.margin >= 0 ? 'rgba(53,208,127,0.08)' : 'rgba(248,113,113,0.08)', border: '1px solid ' + (m.margin >= 0 ? 'rgba(53,208,127,0.3)' : 'rgba(248,113,113,0.3)') }}>
            <div>
              <p className="text-[13px] uppercase tracking-wide text-white/40">Margin so far</p>
              <p className="text-[15px] text-white/40 mt-0.5">earned minus spent{marginPct !== null ? ` · ${marginPct}%` : ''}</p>
            </div>
            <p className="text-[26px] font-bold flex items-center gap-2" style={{ color: m.margin >= 0 ? '#35d07f' : '#f87171' }}>
              {m.margin >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}{fmt$(m.margin)}
            </p>
          </div>
          {spendingAhead && (
            <p className="text-[15px] mt-3" style={{ color: '#f87171' }}>
              Spending is ahead of earnings — worth a look at where the money went.
            </p>
          )}
          {m.unbilled > 2500 && !done && (
            <p className="text-[15px] mt-3" style={{ color: '#f0a04b' }}>
              {fmt$(m.unbilled)} of finished work hasn&rsquo;t been billed yet.
            </p>
          )}
        </div>

        {/* ── Costs — tap them in as they happen ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-1">Job Costs</p>
          <p className="text-[14px] text-white/40 mb-4">What you&rsquo;ve actually spent. This is what makes the margin real.</p>

          <div className="flex gap-2 mb-2">
            <input value={amount} onChange={(ev) => setAmount(ev.target.value)} inputMode="decimal" placeholder="$ amount"
              className="w-32 min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[17px] font-bold placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
            <input value={vendor} onChange={(ev) => setVendor(ev.target.value)} placeholder="Who / what (Ferguson — pipe)"
              className="flex-1 min-w-0 min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className="shrink-0 min-h-[44px] px-3.5 rounded-xl text-[15px] font-semibold active:scale-95 whitespace-nowrap"
                style={category === c.id
                  ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {c.label}
              </button>
            ))}
          </div>
          <button onClick={addCost} disabled={busy || !amount.trim()}
            className="w-full min-h-[52px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40"
            style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add Cost
          </button>

          {room.costs.length > 0 && (
            <div className="mt-4 space-y-2">
              {shownCosts.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold truncate">{fmt$(Number(c.amount))} · {catLabel(c.category)}</p>
                    <p className="text-[14px] text-white/40 truncate">{[c.vendor, fmtDay(c.spent_on)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button onClick={() => removeCost(c.id, fmt$(Number(c.amount)) + ' ' + catLabel(c.category))} disabled={busy}
                    className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center active:scale-95 shrink-0 disabled:opacity-40">
                    <Trash2 size={15} className="text-white/35" />
                  </button>
                </div>
              ))}
              {room.costs.length > 6 && (
                <button onClick={() => setShowAllCosts(!showAllCosts)} className="w-full min-h-[48px] rounded-xl text-[15px] font-semibold text-white/50 bg-white/4 active:scale-[0.99]">
                  {showAllCosts ? 'Show less' : `Show all ${room.costs.length}`}
                </button>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(m.by_category).sort((a, b) => b[1] - a[1]).map(([cat, v]) => (
                  <span key={cat} className="text-[13px] px-2.5 py-1 rounded-full bg-white/5 text-white/45">{catLabel(cat)} {fmt$(v)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Job log — private entries included ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[17px] font-bold">Job Log</p>
            <button onClick={() => router.push('/admin/estimates/' + e.id)}
              className="min-h-[44px] px-4 rounded-xl text-[15px] font-semibold active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Add Entry
            </button>
          </div>
          <p className="text-[14px] text-white/40 mb-3">Everything — entries the customer never sees are marked.</p>
          {room.log.length === 0 ? (
            <p className="text-[15px] text-white/35">Nothing logged yet.</p>
          ) : (
            <div className="space-y-2.5">
              {room.log.slice(0, 12).map((l) => {
                const t = LOG_TYPES.find((x) => x.id === l.type);
                return (
                  <div key={l.id} className="flex gap-3">
                    <div className="w-1 rounded-full shrink-0" style={{ background: l.type === 'rain' ? '#60a5fa' : l.type === 'delay' ? '#f87171' : 'rgba(201,168,76,0.5)' }} />
                    <div className="min-w-0 py-0.5">
                      <p className="text-[14px] text-white/35">
                        {fmtDay(l.entry_date)} · {t?.label || l.type}
                        {!l.include_in_report && (
                          <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                            <Lock size={11} /> Internal only
                          </span>
                        )}
                      </p>
                      {l.text && <p className="text-[16px] text-white/75 mt-0.5">{l.text}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Private notes ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-1 flex items-center gap-2"><Lock size={16} className="text-white/40" /> Private Notes</p>
          <p className="text-[14px] text-white/40 mb-3">Yours only — never printed, never sent, never on the customer&rsquo;s page.</p>
          <textarea value={notes} onChange={(ev) => setNotes(ev.target.value)} rows={4}
            placeholder="Locates expire soon… owner wants the extra hydrant priced… don't schedule concrete before the 15th…"
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-[16px] leading-relaxed placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
          <button onClick={saveNotes} disabled={notesSaved === 'saving'}
            className="w-full min-h-[48px] mt-2 rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
            {notesSaved === 'saving' ? <Loader2 size={17} className="animate-spin" /> : notesSaved === 'saved' ? <CheckCircle2 size={17} /> : <Save size={17} />}
            {notesSaved === 'saved' ? 'Saved' : 'Save Notes'}
          </button>
        </div>

        {/* ── Coming up on this job ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[17px] font-bold">Coming Up</p>
            <button onClick={() => router.push('/admin/schedule?job=' + e.id)}
              className="min-h-[44px] px-4 rounded-xl text-[15px] font-semibold active:scale-95"
              style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
              Schedule
            </button>
          </div>
          {room.upcoming.length === 0 ? (
            <p className="text-[15px] text-white/35 mt-1">Nothing scheduled on this job — tap Schedule to put the next pour, inspection or delivery on the board.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {room.upcoming.slice(0, 5).map((s) => {
                const overdue = s.starts_on < `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[16px] font-semibold truncate">{s.title}</p>
                    <p className="text-[14px] font-semibold shrink-0" style={{ color: overdue ? '#f87171' : '#D4B965' }}>
                      {overdue ? 'Slipped · ' : ''}{fmtDay(s.starts_on)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── What the customer had to say ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[17px] font-bold">Customer Feedback</p>
            {room.feedback_unseen > 0 && (
              <span className="px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(201,168,76,0.18)', color: '#D4B965' }}>
                {room.feedback_unseen} new
              </span>
            )}
          </div>
          <p className="text-[14px] text-white/40 mb-3">Notes, quick answers and ratings from their project page — only you see these.</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {([['feedback_enabled', 'Notes & questions'], ['reviews_enabled', 'Star ratings']] as const).map(([field, label]) => {
              const on = e[field] !== false;
              return (
                <button key={field} onClick={() => setFlag(field, !on)} disabled={togglingFlag !== null}
                  className="min-h-[52px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  style={on
                    ? { background: 'rgba(53,208,127,0.12)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {togglingFlag === field ? <Loader2 size={15} className="animate-spin" /> : null}
                  {label}: {on ? 'ON' : 'OFF'}
                </button>
              );
            })}
          </div>

          {room.feedback.length === 0 ? (
            <p className="text-[15px] text-white/35">Nothing yet — when they tap an answer, leave a note or rate the job, it lands here.</p>
          ) : (
            <div className="space-y-2.5">
              {room.feedback.slice(0, 10).map((f) => (
                <div key={f.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[14px] text-white/35 flex items-center gap-2 flex-wrap">
                    {!f.seen_at && <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#D4B965' }} />}
                    {fmtDay(f.created_at.slice(0, 10))}
                    {f.kind === 'review' && f.rating != null && (
                      <span style={{ color: '#D4B965' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                    )}
                    {f.kind === 'pulse' && <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: /concern/i.test(f.answer || '') ? 'rgba(248,113,113,0.15)' : 'rgba(53,208,127,0.12)', color: /concern/i.test(f.answer || '') ? '#f87171' : '#35d07f' }}>{f.answer}</span>}
                    {f.kind === 'comment' && f.section && <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-white/8 text-white/50 capitalize">{f.section}</span>}
                  </p>
                  {f.body && <p className="text-[16px] text-white/75 mt-1">{f.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── The customer's side of the glass ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-1">The Customer&rsquo;s View</p>
          <p className="text-[15px] text-white/50 mb-3">
            {e.view_count > 0
              ? <>They&rsquo;ve opened their page <strong className="text-white/80">{e.view_count}{e.view_count === 1 ? ' time' : ' times'}</strong>{e.last_viewed_at ? <> — last {timeAgo(e.last_viewed_at)}</> : null}.</>
              : 'They haven’t opened their page yet.'}
            {cadence ? <> Reporting: {cadence}.</> : null}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <a href={'/estimate/' + e.share_token} target="_blank" rel="noreferrer"
              className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Eye size={18} /> See What They See
            </a>
            <button onClick={notifyCustomer} disabled={notifying}
              className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
              {notifying ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Email Them an Update
            </button>
          </div>
          {notifyMsg && <p className="text-[14px] mt-2 text-center" style={{ color: notifyMsg.includes('✓') ? '#35d07f' : '#D4B965' }}>{notifyMsg}</p>}
        </div>

        {/* ── Doors to the rest ── */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push('/admin/estimates/' + e.id)}
            className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <FileText size={18} /> Contract &amp; Tabs
          </button>
          <button onClick={() => router.push('/admin/invoices?estimate=' + e.id)}
            className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <ClipboardList size={18} /> Invoices
          </button>
        </div>
      </div>
    </AppShell>
  );
}
