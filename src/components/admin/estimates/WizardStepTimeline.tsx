'use client';

import { Calendar, Clock, CloudRain, FileText } from 'lucide-react';

interface TimelineData {
  project_start_date: string;
  project_duration_days: number;
  weather_days: number;
  schedule_notes: string;
}

interface Props {
  data: TimelineData;
  onChange: (data: Partial<TimelineData>) => void;
  isContract: boolean;
}

export default function WizardStepTimeline({ data, onChange, isContract }: Props) {
  const startDate = data.project_start_date ? new Date(data.project_start_date) : null;
  const totalDays = (data.project_duration_days || 0) + (data.weather_days || 0);
  const completionDate = startDate && totalDays > 0
    ? new Date(startDate.getTime() + totalDays * 86400000)
    : null;

  const inputClass = 'w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition-colors';
  const labelClass = 'block text-[14px] font-medium text-white/70 mb-1.5';

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-white/50">
        {isContract
          ? 'Set the project timeline. Start date and duration are required for proposals/contracts.'
          : 'Optionally set a project timeline for this estimate.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Start Date */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-white/40" />
              Estimated Start Date {isContract && <span className="text-red-400">*</span>}
            </span>
          </label>
          <input
            type="date"
            value={data.project_start_date || ''}
            onChange={e => onChange({ project_start_date: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Duration */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-white/40" />
              Duration (working days) {isContract && <span className="text-red-400">*</span>}
            </span>
          </label>
          <input
            type="number"
            min={1}
            value={data.project_duration_days || ''}
            onChange={e => onChange({ project_duration_days: parseInt(e.target.value) || 0 })}
            placeholder="e.g. 30"
            className={inputClass}
          />
        </div>

        {/* Weather Days */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1.5">
              <CloudRain size={14} className="text-white/40" />
              Weather Buffer Days
            </span>
          </label>
          <input
            type="number"
            min={0}
            value={data.weather_days || ''}
            onChange={e => onChange({ weather_days: parseInt(e.target.value) || 0 })}
            placeholder="e.g. 5"
            className={inputClass}
          />
          <p className="text-[12px] text-white/25 mt-1">Extra days to account for weather delays</p>
        </div>

        {/* Estimated Completion */}
        <div>
          <label className={labelClass}>Estimated Completion</label>
          <div className="bg-[#111] border border-white/5 rounded-lg px-4 py-3 text-[15px] text-white/50">
            {completionDate
              ? completionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : 'Set start date and duration'}
          </div>
          {totalDays > 0 && (
            <p className="text-[12px] text-white/25 mt-1">
              {data.project_duration_days || 0} working days + {data.weather_days || 0} weather days = {totalDays} total days
            </p>
          )}
        </div>
      </div>

      {/* Schedule Notes */}
      <div>
        <label className={labelClass}>
          <span className="flex items-center gap-1.5">
            <FileText size={14} className="text-white/40" />
            Schedule Notes
          </span>
        </label>
        <textarea
          value={data.schedule_notes || ''}
          onChange={e => onChange({ schedule_notes: e.target.value })}
          placeholder="e.g. Work will begin upon permit approval. Schedule excludes weekends and holidays."
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </div>
    </div>
  );
}
