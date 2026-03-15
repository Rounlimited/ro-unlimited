'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Home, Building2, Mountain, Check, Loader2,
  MapPin, Calendar, DollarSign, Ruler, FileText, ChevronRight
} from 'lucide-react';

const DIVISIONS = [
  {
    id: 'residential',
    label: 'Residential',
    icon: Home,
    color: '#2A4A8A',
    neon: 'rgba(68,136,255,0.6)',
    neonSoft: 'rgba(68,136,255,0.15)',
    desc: 'Custom homes, additions, renovations',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: Building2,
    color: '#C9A84C',
    neon: 'rgba(255,208,96,0.6)',
    neonSoft: 'rgba(201,168,76,0.15)',
    desc: 'Offices, retail, industrial builds',
  },
  {
    id: 'grading',
    label: 'Land Grading',
    icon: Mountain,
    color: '#34D399',
    neon: 'rgba(52,211,153,0.6)',
    neonSoft: 'rgba(52,211,153,0.15)',
    desc: 'Site prep, excavation, earthwork',
  },
];

const SCOPE_PLACEHOLDERS: Record<string, string> = {
  residential: 'e.g. 2,400 sqft custom home — slab foundation, framing, roofing, full interior finish...',
  commercial: 'e.g. 8,000 sqft office build-out — steel framing, HVAC rough-in, electrical...',
  grading: 'e.g. 4-acre site prep — clearing, grading, drainage, pad compaction for future build...',
};

type Step = 'job' | 'where' | 'when' | 'scope';
const STEPS: Step[] = ['job', 'where', 'when', 'scope'];

function SectionCard({
  active, done, children, delay = 0
}: {
  active: boolean; done: boolean; children: React.ReactNode; delay?: number;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: active ? '#0F1F3D' : done ? 'rgba(15,31,61,0.5)' : '#0a0d14',
        border: active
          ? '1px solid rgba(68,136,255,0.4)'
          : done
          ? '1px solid rgba(42,74,138,0.25)'
          : '1px solid rgba(255,255,255,0.04)',
        boxShadow: active
          ? '0 0 0 1px rgba(68,136,255,0.1), 0 8px 32px rgba(15,31,61,0.5), inset 0 1px 0 rgba(68,136,255,0.08)'
          : 'none',
        opacity: active ? 1 : done ? 0.8 : 0.35,
        animation: active ? `cardSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` : 'none',
      }}
    >
      {children}
    </div>
  );
}

function StepLabel({ step, active, done, label }: { step: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{
      borderColor: active ? 'rgba(68,136,255,0.2)' : 'rgba(255,255,255,0.04)',
    }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all" style={{
        background: done ? '#C9A84C' : active ? 'rgba(68,136,255,0.3)' : 'rgba(255,255,255,0.05)',
        border: done ? 'none' : active ? '1px solid rgba(68,136,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: done ? '0 0 8px rgba(201,168,76,0.5)' : active ? '0 0 8px rgba(68,136,255,0.4)' : 'none',
        color: done ? '#000' : active ? '#fff' : 'rgba(255,255,255,0.2)',
      }}>
        {done ? <Check size={10} strokeWidth={3} /> : step}
      </div>
      <span className="text-xs font-semibold tracking-wide" style={{
        color: done ? 'rgba(255,255,255,0.5)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
      }}>{label}</span>
    </div>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('job');
  const [creating, setCreating] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [division, setDivision] = useState('residential');
  const [jobStatus, setJobStatus] = useState<'active' | 'complete'>('active');
  const [city, setCity] = useState('Greenville');
  const [state] = useState('SC');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [sqft, setSqft] = useState('');
  const [scopeDesc, setScopeDesc] = useState('');

  const stepIdx = STEPS.indexOf(step);
  const isDone = (s: Step) => STEPS.indexOf(s) < stepIdx;
  const isActive = (s: Step) => s === step;

  const selectedDiv = DIVISIONS.find(d => d.id === division)!;

  const advance = (to: Step) => setStep(to);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          division,
          status: jobStatus,
          address,
          city,
          state,
          startDate: startDate || null,
          completionDate: completionDate || null,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue.replace(/,/g, '')) : null,
          sqft: sqft ? parseInt(sqft) : null,
          scopeDescription: scopeDesc || null,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(`/admin/projects/${data._id}`);
    } catch (e: any) {
      alert(e.message || 'Failed to create project');
      setCreating(false);
    }
  };

  const canAdvanceJob = title.trim().length > 0;
  const canAdvanceWhere = true; // city prefilled
  const canAdvanceWhen = true;  // all optional

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050810' }}>
      <AdminHeader title="New Job File" subtitle="Create a master record" backHref="/admin/projects" />

      {/* Neon grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(42,74,138,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(42,74,138,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        zIndex: 0,
      }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-36 pt-4 space-y-3">

        {/* ── STEP 1: THE JOB ── */}
        <SectionCard active={isActive('job')} done={isDone('job')} delay={0}>
          <StepLabel step={1} active={isActive('job')} done={isDone('job')} label="The Job" />
          {(isActive('job') || isDone('job')) && (
            <div className="px-5 py-4 space-y-4">
              {/* Job name */}
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">Project Name</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Lakeside Custom Home"
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: title ? '1px solid rgba(68,136,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: title ? '0 0 0 3px rgba(68,136,255,0.08)' : 'none',
                  }}
                  autoFocus
                />
              </div>

              {/* Division pills */}
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">Division</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIVISIONS.map(div => {
                    const Icon = div.icon;
                    const sel = division === div.id;
                    return (
                      <button
                        key={div.id}
                        onClick={() => setDivision(div.id)}
                        className="rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                        style={{
                          background: sel ? div.neonSoft : 'rgba(255,255,255,0.03)',
                          border: sel ? `1px solid ${div.neon}` : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: sel ? `0 0 16px ${div.neonSoft}, inset 0 0 8px ${div.neonSoft}` : 'none',
                        }}
                      >
                        <Icon size={18} style={{ color: sel ? div.color : 'rgba(255,255,255,0.25)' }} />
                        <span className="text-[10px] font-semibold" style={{ color: sel ? div.color : 'rgba(255,255,255,0.3)' }}>
                          {div.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active / Complete toggle */}
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">Status</label>
                <div className="flex gap-2">
                  {(['active', 'complete'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setJobStatus(s)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      style={{
                        background: jobStatus === s
                          ? s === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(68,136,255,0.15)'
                          : 'rgba(255,255,255,0.03)',
                        border: jobStatus === s
                          ? s === 'active' ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(68,136,255,0.5)'
                          : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: jobStatus === s
                          ? s === 'active' ? '0 0 12px rgba(52,211,153,0.2)' : '0 0 12px rgba(68,136,255,0.2)'
                          : 'none',
                        color: jobStatus === s
                          ? s === 'active' ? '#34D399' : '#4488FF'
                          : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {s === 'active' ? '⚡ Active' : '✓ Complete'}
                    </button>
                  ))}
                </div>
              </div>

              {isActive('job') && (
                <button
                  onClick={() => canAdvanceJob && advance('where')}
                  disabled={!canAdvanceJob}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: canAdvanceJob ? 'rgba(68,136,255,0.2)' : 'rgba(255,255,255,0.04)',
                    border: canAdvanceJob ? '1px solid rgba(68,136,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    color: canAdvanceJob ? '#4488FF' : 'rgba(255,255,255,0.2)',
                    boxShadow: canAdvanceJob ? '0 0 16px rgba(68,136,255,0.15)' : 'none',
                  }}
                >
                  Next: Location <ChevronRight size={15} />
                </button>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── STEP 2: WHERE ── */}
        <SectionCard active={isActive('where')} done={isDone('where')} delay={50}>
          <StepLabel step={2} active={isActive('where')} done={isDone('where')} label="Location" />
          {(isActive('where') || isDone('where')) && (
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">Street Address</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Main St (optional)"
                    className="w-full rounded-xl pl-9 pr-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">City</label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: city ? '1px solid rgba(68,136,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">State</label>
                  <input
                    value={state}
                    readOnly
                    className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  />
                </div>
              </div>

              {isActive('where') && (
                <button
                  onClick={() => advance('when')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: 'rgba(68,136,255,0.2)',
                    border: '1px solid rgba(68,136,255,0.5)',
                    color: '#4488FF',
                    boxShadow: '0 0 16px rgba(68,136,255,0.15)',
                  }}
                >
                  Next: Timeline & Value <ChevronRight size={15} />
                </button>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── STEP 3: WHEN & WHAT ── */}
        <SectionCard active={isActive('when')} done={isDone('when')} delay={100}>
          <StepLabel step={3} active={isActive('when')} done={isDone('when')} label="Timeline & Value" />
          {(isActive('when') || isDone('when')) && (
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    <Calendar size={9} className="inline mr-1" />Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: startDate ? '1px solid rgba(68,136,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    <Calendar size={9} className="inline mr-1" />Completion
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={e => setCompletionDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: completionDate ? '1px solid rgba(68,136,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    <DollarSign size={9} className="inline mr-0.5" />Est. Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                    <input
                      value={estimatedValue}
                      onChange={e => setEstimatedValue(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl pl-7 pr-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none transition-all"
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: estimatedValue ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        boxShadow: estimatedValue ? '0 0 8px rgba(201,168,76,0.1)' : 'none',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    <Ruler size={9} className="inline mr-1" />Sqft
                  </label>
                  <input
                    value={sqft}
                    onChange={e => setSqft(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: sqft ? '1px solid rgba(68,136,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  />
                </div>
              </div>

              {isActive('when') && (
                <button
                  onClick={() => advance('scope')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: 'rgba(68,136,255,0.2)',
                    border: '1px solid rgba(68,136,255,0.5)',
                    color: '#4488FF',
                    boxShadow: '0 0 16px rgba(68,136,255,0.15)',
                  }}
                >
                  Next: Scope <ChevronRight size={15} />
                </button>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── STEP 4: SCOPE ── */}
        <SectionCard active={isActive('scope')} done={isDone('scope')} delay={150}>
          <StepLabel step={4} active={isActive('scope')} done={isDone('scope')} label="Scope of Work" />
          {isActive('scope') && (
            <div className="px-5 py-4">
              <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2">
                <FileText size={9} className="inline mr-1" />Description
              </label>
              <textarea
                value={scopeDesc}
                onChange={e => setScopeDesc(e.target.value)}
                placeholder={SCOPE_PLACEHOLDERS[division]}
                rows={4}
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none transition-all resize-none"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: scopeDesc ? '1px solid rgba(68,136,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: scopeDesc ? '0 0 0 3px rgba(68,136,255,0.06)' : 'none',
                }}
              />
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── STICKY CREATE BUTTON ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4" style={{
        background: 'linear-gradient(to top, #050810 60%, transparent)',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
      }}>
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || step !== 'scope'}
          className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          style={{
            background: (title.trim() && step === 'scope')
              ? 'linear-gradient(135deg, #d4b55a, #C9A84C, #a8883a)'
              : 'rgba(255,255,255,0.04)',
            color: (title.trim() && step === 'scope') ? '#000' : 'rgba(255,255,255,0.15)',
            border: (title.trim() && step === 'scope')
              ? 'none'
              : '1px solid rgba(255,255,255,0.06)',
            boxShadow: (title.trim() && step === 'scope')
              ? '0 0 0 1px rgba(201,168,76,0.4), 0 8px 32px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.5)'
              : 'none',
            animation: (title.trim() && step === 'scope') ? 'neonGoldPulse 2.2s ease-in-out infinite' : 'none',
          }}
        >
          {creating
            ? <><Loader2 size={16} className="animate-spin" /> Creating Job File...</>
            : step !== 'scope'
            ? `Complete all steps to create`
            : `Create Job File → ${title || ''}`
          }
        </button>
      </div>
    </div>
  );
}
