'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CalendarClock, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  SCHEDULE_META, BUDGET_META, STATUS_REASONS, cadenceLabel,
  type ScheduleStatus, type BudgetStatus,
} from '@/lib/reporting';

/**
 * Progress tab — phase percentages plus JR's schedule/budget status.
 * He taps everything himself; nothing here is customer-facing.
 * JR-sized: 17px body, 48px+ targets, labels never carried by color alone.
 */

interface PhaseRow { phase: string; value: number; percent: number; earned: number; note: string | null }
interface Data {
  percent: number; total_value: number; earned: number; phases: PhaseRow[];
  schedule_status: ScheduleStatus | null; budget_status: BudgetStatus | null;
  status_reason: string | null; status_note: string | null; status_updated_at: string | null;
  reporting_cadence: string | null; reporting_day: string | null;
}

const fmt$ = (n: number) => '$' + Math.round(n).toLocaleString();
const STEPS = [0, 25, 50, 75, 100];

export default function ProgressPanel({ estimateId }: { estimateId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/progress');
      const d = await res.json();
      if (!d.error) { setData(d); setNote(d.status_note || ''); }
    } catch { /* keep last */ }
    setLoading(false);
  }, [estimateId]);

  useEffect(() => { load(); }, [load]);

  const save = async (body: any, busyKey: string) => {
    setSaving(busyKey);
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/progress', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.error) { setData(d); if (body.status_note === undefined) setNote(d.status_note || ''); }
    } catch { /* leave as-is */ }
    setSaving(null);
  };

  if (loading) {
    return <div className="flex items-center gap-3 text-white/40 py-6"><Loader2 size={20} className="animate-spin" /> Loading progress…</div>;
  }
  if (!data) return <p className="text-[15px] text-white/40 py-6">Could not load progress.</p>;

  const behind = data.schedule_status === 'behind';
  const cadence = cadenceLabel(data.reporting_cadence, data.reporting_day);

  return (
    <div className="space-y-4">
      {/* ── Overall ── */}
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[13px] uppercase tracking-wide text-white/40 mb-1">Overall Complete</p>
            <p className="text-[40px] font-bold leading-none" style={{ color: '#D4B965' }}>{data.percent}%</p>
          </div>
          {data.total_value > 0 && (
            <div className="text-right">
              <p className="text-[13px] uppercase tracking-wide text-white/40 mb-1">Earned to Date</p>
              <p className="text-[20px] font-bold">{fmt$(data.earned)}</p>
              <p className="text-[14px] text-white/35">of {fmt$(data.total_value)}</p>
            </div>
          )}
        </div>
        <div className="h-3 rounded-full bg-white/8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: data.percent + '%', background: 'linear-gradient(90deg, #a8893d, #D4B965)' }} />
        </div>
        <p className="text-[13px] text-white/35 mt-2">Weighted by the dollar value of each phase.</p>
        {cadence && (
          <p className="text-[14px] mt-3 flex items-center gap-2" style={{ color: '#D4B965' }}>
            <CalendarClock size={15} /> Reporting to customer: {cadence}
          </p>
        )}
      </div>

      {/* ── Status flags (internal) ── */}
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-bold">Job Status</p>
          <span className="text-[12px] text-white/30">Internal — not on the customer link</span>
        </div>

        <div>
          <p className="text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <CalendarClock size={14} /> Schedule
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['ahead', 'on', 'behind'] as ScheduleStatus[]).map((s) => {
              const on = data.schedule_status === s;
              const meta = SCHEDULE_META[s];
              return (
                <button key={s} disabled={saving !== null}
                  onClick={() => save({ schedule_status: on ? null : s }, 'sched')}
                  className="min-h-[52px] px-2 rounded-xl text-[15px] font-bold active:scale-95 transition-all disabled:opacity-50"
                  style={on
                    ? { background: meta.bg, color: meta.color, border: '1px solid ' + meta.color }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {s === 'ahead' ? 'Ahead' : s === 'on' ? 'On Schedule' : 'Behind'}
                </button>
              );
            })}
          </div>
        </div>

        {behind && (
          <div>
            <p className="text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Reason
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_REASONS.map((r) => {
                const on = data.status_reason === r.id;
                return (
                  <button key={r.id} disabled={saving !== null}
                    onClick={() => save({ status_reason: on ? null : r.id }, 'reason')}
                    className="min-h-[44px] px-3.5 rounded-full text-[14px] font-semibold active:scale-95 disabled:opacity-50"
                    style={on
                      ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Wallet size={14} /> Budget
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['under', 'on', 'over'] as BudgetStatus[]).map((s) => {
              const on = data.budget_status === s;
              const meta = BUDGET_META[s];
              return (
                <button key={s} disabled={saving !== null}
                  onClick={() => save({ budget_status: on ? null : s }, 'budget')}
                  className="min-h-[52px] px-2 rounded-xl text-[15px] font-bold active:scale-95 transition-all disabled:opacity-50"
                  style={on
                    ? { background: meta.bg, color: meta.color, border: '1px solid ' + meta.color }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {s === 'under' ? 'Under' : s === 'on' ? 'On Budget' : 'Over'}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (data.status_note || '') && save({ status_note: note }, 'note')}
            placeholder="Rain out Tue–Wed, back on grade Thursday"
            className="w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
        </div>

        {data.status_updated_at && (
          <p className="text-[13px] text-white/30">
            Updated {new Date(data.status_updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* ── Phases ── */}
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
        <p className="text-[17px] font-bold mb-1">Phases</p>
        <p className="text-[14px] text-white/40 mb-4">Straight from the line items on this contract.</p>

        {data.phases.length === 0 && (
          <p className="text-[15px] text-white/40">No line items yet — add them and the phases show up here.</p>
        )}

        <div className="space-y-4">
          {data.phases.map((p) => (
            <div key={p.phase}>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <p className="text-[16px] font-semibold truncate flex items-center gap-1.5">
                  {p.percent === 100 && <CheckCircle2 size={16} className="text-[#35d07f] shrink-0" />}
                  {p.phase}
                </p>
                <p className="text-[15px] font-bold shrink-0" style={{ color: p.percent === 100 ? '#35d07f' : '#D4B965' }}>
                  {p.percent}%{p.value > 0 && <span className="text-white/30 font-normal"> · {fmt$(p.value)}</span>}
                </p>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: p.percent + '%', background: p.percent === 100 ? '#35d07f' : 'linear-gradient(90deg, #a8893d, #D4B965)' }} />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {STEPS.map((v) => {
                  const on = p.percent === v;
                  return (
                    <button key={v} disabled={saving !== null}
                      onClick={() => save({ phase: p.phase, percent_complete: v }, p.phase)}
                      className="min-h-[48px] rounded-lg text-[15px] font-bold active:scale-95 transition-all disabled:opacity-50"
                      style={on
                        ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {saving === p.phase && on ? <Loader2 size={15} className="animate-spin mx-auto" /> : v + '%'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
