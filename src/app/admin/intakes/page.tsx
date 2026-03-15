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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/intakes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setIntakes(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approveIntake = async (id: string) => {
    if (!confirm('Approve this intake and create an employee profile?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/intakes/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (data.employee_id) {
        setIntakes(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
        router.push(`/admin/employees/${data.employee_id}`);
      }
    } catch {} finally { setActionLoading(null); }
  };

  const rejectIntake = async (id: string) => {
    if (!confirm('Reject this intake application?')) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/intakes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      setIntakes(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' } : i));
    } catch {} finally { setActionLoading(null); }
  };

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
    const expanded = expandedId === intake.id;
    const p = intake.personal_info || {};
    const e = intake.employment_info || {};
    const c = intake.certifications_info || {};
    const a = intake.agreements_info || {};

    return (
      <div key={intake.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <button onClick={() => setExpandedId(expanded ? null : intake.id)}
          className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors">
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
          <ChevronRight size={16} className={`text-white/15 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
            {/* Personal Info */}
            {p.first_name && (
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-[12px] text-white/25 uppercase tracking-wider mb-2">Personal Info</p>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div><span className="text-white/30">Name:</span> <span className="text-white/70">{p.first_name} {p.last_name}</span></div>
                  <div><span className="text-white/30">Phone:</span> <span className="text-white/70">{p.phone || intake.candidate_phone || '--'}</span></div>
                  {p.email && <div><span className="text-white/30">Email:</span> <span className="text-white/70">{p.email}</span></div>}
                  {p.date_of_birth && <div><span className="text-white/30">DOB:</span> <span className="text-white/70">{p.date_of_birth}</span></div>}
                  {p.address_city && <div className="col-span-2"><span className="text-white/30">Address:</span> <span className="text-white/70">{p.address_street}, {p.address_city}, {p.address_state} {p.address_zip}</span></div>}
                  {p.emergency_contact_name && <div className="col-span-2"><span className="text-white/30">Emergency:</span> <span className="text-white/70">{p.emergency_contact_name} ({p.emergency_contact_relationship}) — {p.emergency_contact_phone}</span></div>}
                </div>
              </div>
            )}

            {/* Employment */}
            {e.years_experience && (
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-[12px] text-white/25 uppercase tracking-wider mb-2">Employment</p>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div><span className="text-white/30">Experience:</span> <span className="text-white/70">{e.years_experience} years</span></div>
                  {e.trade_primary && <div><span className="text-white/30">Trade:</span> <span className="text-white/70">{e.trade_primary}</span></div>}
                  {e.previous_employer && <div><span className="text-white/30">Previous:</span> <span className="text-white/70">{e.previous_employer}</span></div>}
                  {e.available_start_date && <div><span className="text-white/30">Available:</span> <span className="text-white/70">{e.available_start_date}</span></div>}
                  {e.preferred_pay_rate && <div><span className="text-white/30">Desired pay:</span> <span className="text-white/70">${e.preferred_pay_rate}/hr</span></div>}
                  <div><span className="text-white/30">Transportation:</span> <span className="text-white/70">{e.has_transportation ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {c.drivers_license_number && (
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-[12px] text-white/25 uppercase tracking-wider mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {c.osha_10 && <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[11px]">OSHA 10</span>}
                  {c.osha_30 && <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[11px]">OSHA 30</span>}
                  {c.cpr_first_aid && <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[11px]">CPR/First Aid</span>}
                  {c.forklift_certified && <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[11px]">Forklift</span>}
                </div>
                <div className="text-[13px]">
                  <span className="text-white/30">DL:</span> <span className="text-white/70">{c.drivers_license_number} ({c.drivers_license_state}, {c.drivers_license_class || 'Regular'})</span>
                  {c.drivers_license_expiry && <span className="text-white/30 ml-2">Exp: {c.drivers_license_expiry}</span>}
                </div>
              </div>
            )}

            {/* Agreements */}
            {a.electronic_signature && (
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-[12px] text-white/25 uppercase tracking-wider mb-2">Agreements</p>
                <div className="space-y-1 text-[13px]">
                  {a.safety_policy_acknowledged && <div className="flex items-center gap-2"><Check size={12} className="text-green-400" /><span className="text-white/50">Safety policy acknowledged</span></div>}
                  {a.drug_testing_consent && <div className="flex items-center gap-2"><Check size={12} className="text-green-400" /><span className="text-white/50">Drug testing consent</span></div>}
                  {a.background_check_consent && <div className="flex items-center gap-2"><Check size={12} className="text-green-400" /><span className="text-white/50">Background check consent</span></div>}
                  {a.at_will_acknowledged && <div className="flex items-center gap-2"><Check size={12} className="text-green-400" /><span className="text-white/50">At-will acknowledged</span></div>}
                  {a.info_truthful && <div className="flex items-center gap-2"><Check size={12} className="text-green-400" /><span className="text-white/50">Info truthful</span></div>}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-white/30">E-Signature:</span> <span className="text-white/70 italic">{a.electronic_signature}</span>
                    {a.signature_date && <span className="text-white/25 ml-2">— {a.signature_date}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {intake.status === 'submitted' && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => approveIntake(intake.id)} disabled={actionLoading === intake.id}
                  className="flex-1 py-3 bg-green-500/15 border border-green-500/25 text-green-400 text-[14px] font-bold rounded-xl hover:bg-green-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === intake.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve & Create Employee
                </button>
                <button onClick={() => rejectIntake(intake.id)} disabled={actionLoading === intake.id}
                  className="py-3 px-5 bg-red-500/10 border border-red-500/20 text-red-400 text-[14px] font-semibold rounded-xl hover:bg-red-500/20 disabled:opacity-50">
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Intakes" subtitle="Onboarding Applications" backHref="/admin/employees" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
