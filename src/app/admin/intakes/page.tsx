'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Clock, Check, X, Loader2, ChevronRight, UserPlus, FileText, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';

interface Intake {
  id: string;
  token: string;
  status: string;
  candidate_name: string | null;
  candidate_phone: string | null;
  position_title: string | null;
  department: string | null;
  personal_info: any;
  employment_info: any;
  certifications_info: any;
  documents_info: any;
  agreements_info: any;
  uploaded_files: any[];
  current_step: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:      { label: 'Pending',     bg: 'bg-white/5',       text: 'text-white/40',   dot: 'bg-white/20' },
  in_progress:  { label: 'In Progress', bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  submitted:    { label: 'Submitted',   bg: 'bg-[#D4772C]/10',  text: 'text-[#D4772C]',  dot: 'bg-[#D4772C]' },
  reviewed:     { label: 'Reviewed',    bg: 'bg-[#C9A84C]/10',  text: 'text-[#C9A84C]',  dot: 'bg-[#C9A84C]' },
  approved:     { label: 'Approved',    bg: 'bg-green-500/10',   text: 'text-green-400',  dot: 'bg-green-400' },
  rejected:     { label: 'Rejected',    bg: 'bg-red-500/10',     text: 'text-red-400',    dot: 'bg-red-400' },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getName(intake: Intake): string {
  const p = intake.personal_info || {};
  if (p.first_name) return `${p.first_name} ${p.last_name || ''}`.trim();
  return intake.candidate_name || 'Unknown';
}

export default function IntakesPage() {
  const router = useRouter();
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/intakes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setIntakes(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submitted = intakes.filter(i => i.status === 'submitted');
  const inProgress = intakes.filter(i => i.status === 'in_progress' || i.status === 'pending');
  const resolved = intakes.filter(i => i.status === 'approved' || i.status === 'rejected' || i.status === 'reviewed');

  if (loading) return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
    </div>
  );

  const renderIntake = (intake: Intake) => {
    const name = getName(intake);
    const s = STATUS_MAP[intake.status] || STATUS_MAP.pending;

    return (
      <div key={intake.id} className="bg-[#111] border border-white/5 rounded-xl">
        <a href={`/admin/intakes/${intake.id}`}
          className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors block">
          <div className="w-10 h-10 rounded-full bg-[#D4772C]/10 flex items-center justify-center flex-shrink-0">
            <UserPlus size={18} className="text-[#D4772C]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[15px] font-bold text-white truncate">{name}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-white/25">
              {intake.position_title && <span>{intake.position_title}</span>}
              <span>{timeAgo(intake.submitted_at || intake.created_at)}</span>
              <span>Step {intake.current_step + 1}/6</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/15" />
        </a>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Intakes" subtitle="Onboarding Applications" backHref="/admin/employees" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
        {/* Needs Review */}
        {submitted.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-[#D4772C]" />
              <p className="text-[13px] text-[#D4772C] font-semibold uppercase tracking-wider">Needs Review ({submitted.length})</p>
            </div>
            <div className="space-y-2">{submitted.map(renderIntake)}</div>
          </div>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-blue-400" />
              <p className="text-[13px] text-blue-400/70 font-semibold uppercase tracking-wider">In Progress ({inProgress.length})</p>
            </div>
            <div className="space-y-2">{inProgress.map(renderIntake)}</div>
          </div>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <p className="text-[13px] text-white/20 font-semibold uppercase tracking-wider mb-3">Resolved ({resolved.length})</p>
            <div className="space-y-2">{resolved.map(renderIntake)}</div>
          </div>
        )}

        {intakes.length === 0 && (
          <div className="text-center py-16">
            <UserPlus size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-[15px] text-white/25">No intake forms sent yet</p>
            <p className="text-[13px] text-white/15 mt-1">Go to Team → Intake to send one</p>
          </div>
        )}
      </div>
    </div>
  );
}
