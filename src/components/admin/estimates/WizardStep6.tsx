'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Zap, Calendar, Clock, CloudRain, FileText } from 'lucide-react';

interface Milestone {
  _key: string;
  milestone: string;
  percent: number;
  amount: number;
  description: string;
}

interface TimelineData {
  project_start_date: string;
  project_duration_days: number;
  weather_days: number;
  schedule_notes: string;
}

interface Props {
  milestones: Milestone[];
  grandTotal: number;
  onChange: (milestones: Milestone[]) => void;
  timeline: TimelineData;
  onChangeTimeline: (data: Partial<TimelineData>) => void;
  documentMode: string;
}

let keyCounter = 0;
function nextKey() {
  return `ms_${Date.now()}_${++keyCounter}`;
}

const PRESETS: { label: string; items: { milestone: string; percent: number; description: string }[] }[] = [
  {
    label: 'Single Payment',
    items: [
      { milestone: 'Full Payment', percent: 100, description: 'Due upon project completion' },
    ],
  },
  {
    label: '50 / 50',
    items: [
      { milestone: 'Deposit', percent: 50, description: 'Due upon contract signing' },
      { milestone: 'Completion', percent: 50, description: 'Due upon project completion' },
    ],
  },
  {
    label: '3-Way Split',
    items: [
      { milestone: 'Deposit', percent: 33, description: 'Due upon contract signing' },
      { milestone: 'Midpoint', percent: 33, description: 'Due at project midpoint' },
      { milestone: 'Completion', percent: 34, description: 'Due upon project completion' },
    ],
  },
  {
    label: 'Progress (10/30/30/30)',
    items: [
      { milestone: 'Deposit', percent: 10, description: 'Due upon contract signing' },
      { milestone: 'Phase 1 Complete', percent: 30, description: 'Due upon phase 1 completion' },
      { milestone: 'Phase 2 Complete', percent: 30, description: 'Due upon phase 2 completion' },
      { milestone: 'Final Completion', percent: 30, description: 'Due upon final completion' },
    ],
  },
];

export default function WizardStep6({ milestones, grandTotal, onChange, timeline, onChangeTimeline, documentMode }: Props) {
  const isContract = documentMode === 'contract';
  const startDate = timeline.project_start_date ? new Date(timeline.project_start_date) : null;
  const totalCalDays = (timeline.project_duration_days || 0) + (timeline.weather_days || 0);
  const completionDate = startDate && totalCalDays > 0 ? new Date(startDate.getTime() + totalCalDays * 86400000) : null;
  const totalPercent = milestones.reduce((s, m) => s + (m.percent || 0), 0);
  const totalAmount = milestones.reduce((s, m) => s + (m.amount || 0), 0);
  const isValid = Math.abs(totalPercent - 100) < 0.01;

  const addMilestone = () => {
    onChange([
      ...milestones,
      {
        _key: nextKey(),
        milestone: '',
        percent: 0,
        amount: 0,
        description: '',
      },
    ]);
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    const items: Milestone[] = preset.items.map(p => ({
      _key: nextKey(),
      milestone: p.milestone,
      percent: p.percent,
      amount: (grandTotal * p.percent) / 100,
      description: p.description,
    }));
    onChange(items);
  };

  const updateMilestone = (key: string, field: string, value: any) => {
    onChange(
      milestones.map(m => {
        if (m._key !== key) return m;
        const next = { ...m, [field]: value };
        if (field === 'percent') {
          next.amount = (grandTotal * (parseFloat(value) || 0)) / 100;
        }
        return next;
      })
    );
  };

  const deleteMilestone = (key: string) => {
    onChange(milestones.filter(m => m._key !== key));
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const inputClass = 'bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[14px] placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition-colors w-full';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[14px] text-white/50">
          Define payment milestones. Total must equal 100%.
        </p>
        <div className="text-[14px] font-medium text-white/60">
          Project Total: <span className="text-[#C9A84C] font-semibold">{fmt(grandTotal)}</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <Zap size={14} className="text-[#D4772C]" />
        <span className="text-[13px] text-white/40 mr-1">Quick:</span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 text-[13px] bg-[#D4772C]/10 text-[#D4772C] rounded-lg hover:bg-[#D4772C]/20 transition-colors font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        {milestones.length === 0 && (
          <div className="text-center py-12 text-white/30 text-[15px]">
            No milestones yet. Use a preset or add custom milestones.
          </div>
        )}

        {milestones.map((m, idx) => (
          <div key={m._key} className="bg-[#111] border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[13px] font-bold text-[#C9A84C]">{idx + 1}</span>
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_120px] gap-3">
                  <input
                    value={m.milestone}
                    onChange={e => updateMilestone(m._key, 'milestone', e.target.value)}
                    placeholder="Milestone name..."
                    className={inputClass}
                  />
                  <div className="relative">
                    <input
                      type="number"
                      value={m.percent || ''}
                      onChange={e => updateMilestone(m._key, 'percent', parseFloat(e.target.value) || 0)}
                      className={`${inputClass} pr-7`}
                      min={0}
                      max={100}
                      step="any"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">%</span>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-[#C9A84C] font-medium">
                    {fmt(m.amount || 0)}
                  </div>
                </div>
                <input
                  value={m.description}
                  onChange={e => updateMilestone(m._key, 'description', e.target.value)}
                  placeholder="When is this due? e.g. Due upon completion of framing..."
                  className={`${inputClass} text-[13px]`}
                />
              </div>
              <button
                onClick={() => deleteMilestone(m._key)}
                className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 mt-0.5"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Milestone */}
      <button
        onClick={addMilestone}
        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10 rounded-lg transition-colors font-medium"
      >
        <Plus size={16} />
        Add Milestone
      </button>

      {/* Total Bar */}
      {milestones.length > 0 && (
        <div className={`flex items-center justify-between px-5 py-4 rounded-xl border ${
          isValid
            ? 'bg-green-500/5 border-green-500/30'
            : 'bg-yellow-500/5 border-yellow-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {!isValid && <AlertTriangle size={16} className="text-yellow-500" />}
            <span className="text-[15px] font-medium text-white/70">Total</span>
          </div>
          <div className="text-right">
            <span className={`text-[16px] font-bold ${isValid ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalPercent.toFixed(1)}%
            </span>
            <span className="text-[14px] text-white/40 ml-3">{fmt(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* ─── Project Timeline ───────────────────────────────────── */}
      <div className="pt-4 mt-4 border-t border-white/10">
        <h3 className="text-[15px] font-semibold text-white mb-1.5">
          Project Timeline
          {isContract && <span className="text-red-400 text-[12px] ml-2">Required for proposals</span>}
        </h3>
        <p className="text-[13px] text-white/40 mb-4">
          {isContract ? 'Set the project schedule. Start date and duration are required.' : 'Optionally set a project timeline.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-white/70 mb-1.5">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-white/40" /> Start Date {isContract && <span className="text-red-400">*</span>}</span>
            </label>
            <input type="date" value={timeline.project_start_date || ''} onChange={e => onChangeTimeline({ project_start_date: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-white/70 mb-1.5">
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-white/40" /> Duration (days) {isContract && <span className="text-red-400">*</span>}</span>
            </label>
            <input type="number" min={1} value={timeline.project_duration_days || ''} onChange={e => onChangeTimeline({ project_duration_days: parseInt(e.target.value) || 0 })} placeholder="e.g. 30" className={inputClass} />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-white/70 mb-1.5">
              <span className="flex items-center gap-1.5"><CloudRain size={14} className="text-white/40" /> Weather Buffer Days</span>
            </label>
            <input type="number" min={0} value={timeline.weather_days || ''} onChange={e => onChangeTimeline({ weather_days: parseInt(e.target.value) || 0 })} placeholder="e.g. 5" className={inputClass} />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-white/70 mb-1.5">Estimated Completion</label>
            <div className="bg-[#111] border border-white/5 rounded-lg px-3 py-2.5 text-[14px] text-white/50">
              {completionDate ? completionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Set start date and duration'}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[14px] font-medium text-white/70 mb-1.5">
            <span className="flex items-center gap-1.5"><FileText size={14} className="text-white/40" /> Schedule Notes</span>
          </label>
          <textarea value={timeline.schedule_notes || ''} onChange={e => onChangeTimeline({ schedule_notes: e.target.value })} placeholder="e.g. Work begins upon permit approval..." rows={2} className={`${inputClass} resize-y`} />
        </div>
      </div>
    </div>
  );
}
