'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  User, Mail, Heart, Briefcase, Shield,
  FileText, CheckCircle2, XCircle, Loader2,
  UserPlus, Key, Copy, Check, ChevronDown, ChevronRight,
} from 'lucide-react';

interface Intake {
  id: string; token: string; status: string;
  candidate_name: string | null; candidate_phone: string | null;
  position_title: string | null; department: string | null; employment_type: string | null;
  personal_info: any; employment_info: any; certifications_info: any;
  documents_info: any; agreements_info: any; uploaded_files: any[];
  current_step: number; employee_id: string | null;
  review_notes: string | null; reviewed_by: string | null;
  submitted_at: string | null; reviewed_at: string | null; created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: 'text-white/40',  bg: 'bg-white/5' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',  bg: 'bg-blue-500/10' },
  submitted:   { label: 'Submitted',   color: 'text-[#D4772C]', bg: 'bg-[#D4772C]/10' },
  reviewed:    { label: 'Reviewed',    color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
  approved:    { label: 'Approved',    color: 'text-green-400', bg: 'bg-green-500/10' },
  rejected:    { label: 'Rejected',    color: 'text-red-400',   bg: 'bg-red-500/10' },
};

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center"><Icon size={16} className="text-[#C9A84C]" /></div>
          <span className="text-[15px] font-bold text-white">{title}</span>
        </div>
        {open ? <ChevronDown size={16} className="text-white/20" /> : <ChevronRight size={16} className="text-white/20" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0 && value !== false) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="py-1.5">
      <p className="text-[12px] text-white/25 uppercase tracking-wider">{label}</p>
      <p className="text-[15px] text-white/80 mt-0.5">{display}</p>
    </div>
  );
}

export default function IntakeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  // Invite link
  const [accountEmail, setAccountEmail] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch(`/api/admin/intakes/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.id) {
          setIntake(d);
          setReviewNotes(d.review_notes || '');
          // Pre-fill account email from personal info
          const p = d.personal_info || {};
          if (p.email) setAccountEmail(p.email);
          else if (p.first_name) setAccountEmail(`${p.first_name.toLowerCase()}@rounlimited.com`);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    if (!confirm('Approve this intake and create an employee profile?')) return;
    setActionLoading(true);
    try {
      // Save review notes first
      await fetch(`/api/admin/intakes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: reviewNotes }),
      });
      const res = await fetch(`/api/admin/intakes/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (data.employee_id) {
        setIntake(prev => prev ? { ...prev, status: 'approved', employee_id: data.employee_id } : prev);
      }
    } catch {} finally { setActionLoading(false); }
  };

  const reject = async () => {
    if (!confirm('Reject this application?')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/intakes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', review_notes: reviewNotes }),
      });
      setIntake(prev => prev ? { ...prev, status: 'rejected' } : prev);
    } catch {} finally { setActionLoading(false); }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) return <div className="h-full overflow-y-auto bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-[#C9A84C]" size={24} /></div>;
  if (!intake) return <div className="h-full overflow-y-auto bg-[#0a0a0a] flex items-center justify-center text-white/30">Intake not found</div>;

  const p = intake.personal_info || {};
  const e = intake.employment_info || {};
  const c = intake.certifications_info || {};
  const d = intake.documents_info || {};
  const a = intake.agreements_info || {};
  const s = STATUS_MAP[intake.status] || STATUS_MAP.pending;
  const name = p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : intake.candidate_name || 'Unknown';

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Intake Review" subtitle={name} backHref="/admin/intakes" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-4">

        {/* Status Header */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#D4772C]/10 flex items-center justify-center">
                <UserPlus size={24} className="text-[#D4772C]" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-white">{name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${s.bg} ${s.color}`}>
                    {s.label}
                  </span>
                  {intake.position_title && <span className="text-[14px] text-white/40">{intake.position_title}</span>}
                  {intake.department && <span className="text-[13px] text-white/25">{intake.department}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-white/25 text-[11px]">Submitted</p>
              <p className="text-white/60 mt-0.5">{intake.submitted_at ? new Date(intake.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not yet'}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-white/25 text-[11px]">Progress</p>
              <p className="text-white/60 mt-0.5">Step {intake.current_step + 1} / 6</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-white/25 text-[11px]">Created</p>
              <p className="text-white/60 mt-0.5">{new Date(intake.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-white/25 text-[11px]">Documents</p>
              <p className="text-white/60 mt-0.5">{[d.drivers_license_front, d.drivers_license_back, d.resume, d.vehicle_insurance].filter(Boolean).length + (d.certification_photos?.length || 0)} uploaded</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <Section title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label="Full Name" value={`${p.first_name || ''} ${p.last_name || ''}`.trim()} />
            <Field label="Phone" value={p.phone || intake.candidate_phone} />
            <Field label="Email" value={p.email} />
            <Field label="Date of Birth" value={p.date_of_birth} />
            <Field label="Address" value={p.address_street} />
            <Field label="City, State, Zip" value={[p.address_city, p.address_state, p.address_zip].filter(Boolean).join(', ')} />
          </div>
          {p.emergency_contact_name && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[13px] text-[#D4772C] font-semibold mb-2 flex items-center gap-2"><Heart size={14} /> Emergency Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
                <Field label="Name" value={p.emergency_contact_name} />
                <Field label="Phone" value={p.emergency_contact_phone} />
                <Field label="Relationship" value={p.emergency_contact_relationship} />
              </div>
            </div>
          )}
        </Section>

        {/* Employment */}
        <Section title="Employment & Skills" icon={Briefcase}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label="Primary Trade" value={e.trade_primary} />
            <Field label="Years Experience" value={e.years_experience} />
            <Field label="Previous Employer" value={e.previous_employer} />
            <Field label="Previous Employer Phone" value={e.previous_employer_phone} />
            <Field label="Available Start Date" value={e.available_start_date} />
            <Field label="Preferred Pay Rate" value={e.preferred_pay_rate ? `$${e.preferred_pay_rate}/hr` : null} />
            <Field label="Has Transportation" value={e.has_transportation} />
            <Field label="Willing to Travel" value={e.willing_to_travel} />
            <Field label="Languages" value={e.languages_spoken?.join(', ')} />
          </div>
          {e.other_skills && <div className="mt-3"><Field label="Other Skills" value={e.other_skills} /></div>}
        </Section>

        {/* Certifications */}
        <Section title="Certifications & Licenses" icon={Shield}>
          <div className="flex flex-wrap gap-2 mb-4">
            {c.osha_10 && <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[13px] font-medium">OSHA 10</span>}
            {c.osha_30 && <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[13px] font-medium">OSHA 30</span>}
            {c.cpr_first_aid && <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[13px] font-medium">CPR / First Aid</span>}
            {c.forklift_certified && <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[13px] font-medium">Forklift</span>}
            {!c.osha_10 && !c.osha_30 && !c.cpr_first_aid && !c.forklift_certified && <span className="text-[13px] text-white/20">No certifications listed</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label="Driver's License #" value={c.drivers_license_number} />
            <Field label="DL State" value={c.drivers_license_state} />
            <Field label="DL Class" value={c.drivers_license_class} />
            <Field label="DL Expiry" value={c.drivers_license_expiry} />
          </div>
          {c.other_certifications && <div className="mt-3"><Field label="Other Certifications" value={c.other_certifications} /></div>}
        </Section>

        {/* Documents */}
        <Section title="Uploaded Documents" icon={FileText}>
          <div className="space-y-2">
            {[
              { key: 'drivers_license_front', label: "Driver's License (Front)", file: d.drivers_license_front },
              { key: 'drivers_license_back', label: "Driver's License (Back)", file: d.drivers_license_back },
              ...(d.certification_photos || []).map((f: string, i: number) => ({ key: `cert_${i}`, label: `Certification #${i + 1}`, file: f })),
              { key: 'resume', label: 'Resume / CV', file: d.resume },
              { key: 'vehicle_insurance', label: 'Vehicle Insurance', file: d.vehicle_insurance },
            ].filter(item => item.file).map(item => {
              const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(item.file);
              const isPdf = /\.pdf$/i.test(item.file);
              return (
                <div key={item.key} className="bg-black/20 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FileText size={16} className={item.key === 'resume' ? 'text-blue-400 flex-shrink-0' : 'text-[#C9A84C] flex-shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-white/70 font-medium">{item.label}</p>
                      <p className="text-[12px] text-white/25 truncate">{item.file}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/20">
                      {isImage ? 'Image' : isPdf ? 'PDF' : 'File'}
                    </span>
                  </div>
                </div>
              );
            })}
            {!d.drivers_license_front && !d.resume && (!d.certification_photos || d.certification_photos.length === 0) && (
              <p className="text-[14px] text-white/20 text-center py-4">No documents uploaded</p>
            )}
          </div>
        </Section>

        {/* Agreements & Signature */}
        <Section title="Agreements & Signature" icon={CheckCircle2}>
          <div className="space-y-2 mb-4">
            {[
              { key: 'safety_policy', label: 'Safety policies acknowledged' },
              { key: 'drug_testing', label: 'Drug testing consent' },
              { key: 'background_check', label: 'Background check authorized' },
              { key: 'at_will_employment', label: 'At-will employment acknowledged' },
              { key: 'truthful_information', label: 'Information truthfulness confirmed' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2.5">
                {a[item.key] ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" /> : <XCircle size={16} className="text-red-400/40 flex-shrink-0" />}
                <span className={`text-[14px] ${a[item.key] ? 'text-white/60' : 'text-white/20'}`}>{item.label}</span>
              </div>
            ))}
          </div>
          {a.electronic_signature && (
            <div className="border-t border-white/5 pt-4">
              <p className="text-[12px] text-white/25 uppercase tracking-wider mb-1">Electronic Signature</p>
              <p className="text-[18px] text-white italic font-serif">{a.electronic_signature}</p>
              {a.drawn_signature && (
                <div className="mt-3">
                  <p className="text-[12px] text-white/25 uppercase tracking-wider mb-1">Drawn Signature</p>
                  <div className="bg-black/20 rounded-lg p-3 inline-block">
                    <img src={a.drawn_signature} alt="Drawn signature" className="h-16 object-contain" />
                  </div>
                </div>
              )}
              <p className="text-[12px] text-white/20 mt-2">Signed on {a.signature_date}</p>
            </div>
          )}
        </Section>

        {/* Admin Review Notes */}
        <Section title="Review Notes" icon={FileText} defaultOpen={intake.status === 'submitted'}>
          <textarea
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            onBlur={() => {
              fetch(`/api/admin/intakes/${id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_notes: reviewNotes }),
              });
            }}
            rows={4}
            placeholder="Add private notes about this application..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/30 resize-none"
          />
        </Section>

        {/* Send Login Link */}
        {(intake.status === 'approved' || intake.status === 'submitted') && (
          <Section title="Employee Login Access" icon={Key} defaultOpen={false}>
            {accountCreated ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
                <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-[16px] text-green-400 font-bold">Invite Link Generated</p>
                <p className="text-[13px] text-white/30 mt-1">Send this link — they'll create their own email and password</p>
                <div className="mt-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={accountEmail} readOnly className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white/40 font-mono truncate" />
                    <button onClick={() => copyText(accountEmail, 'link')} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[12px] text-white/60 hover:bg-white/10 flex items-center gap-1.5 flex-shrink-0">
                      {copied === 'link' ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <button onClick={() => {
                    const msg = `You've been invited to the RO Unlimited admin portal. Create your account here:\n${accountEmail}`;
                    if (navigator.share) {
                      navigator.share({ title: 'RO Unlimited Login', text: msg, url: accountEmail }).catch(() => {});
                    } else {
                      const phone = p.phone || intake?.candidate_phone || '';
                      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, '_blank');
                    }
                  }} className="w-full py-3 bg-[#C9A84C] text-black text-[14px] font-bold rounded-xl hover:bg-[#d4b55a] transition-colors flex items-center justify-center gap-2">
                    <Mail size={16} /> Send via Text
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[14px] text-white/40">Generate an invite link for this employee. They'll open it and create their own email and password to sign into the admin portal.</p>
                <button onClick={async () => {
                  setCreatingAccount(true);
                  try {
                    const res = await fetch('/api/admin/invite-token', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ role: 'employee', label: name }),
                    });
                    const data = await res.json();
                    if (data.inviteLink) {
                      setAccountEmail(data.inviteLink);
                      setAccountCreated(true);
                    } else { alert(data.error || 'Failed to generate link'); }
                  } catch { alert('Failed to generate link'); }
                  finally { setCreatingAccount(false); }
                }} disabled={creatingAccount}
                  className="w-full py-3.5 bg-[#C9A84C] text-black text-[15px] font-bold rounded-xl hover:bg-[#d4b55a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {creatingAccount ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Key size={16} /> Generate Login Link</>}
                </button>
                <p className="text-[12px] text-white/15 text-center">Link expires in 7 days. They create their own password.</p>
              </div>
            )}
          </Section>
        )}

        {/* Action Buttons */}
        {intake.status === 'submitted' && (
          <div className="flex gap-3 pt-2">
            <button onClick={approve} disabled={actionLoading}
              className="flex-1 py-3.5 bg-green-500/15 border border-green-500/25 text-green-400 text-[15px] font-bold rounded-xl hover:bg-green-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Approve & Create Employee
            </button>
            <button onClick={reject} disabled={actionLoading}
              className="py-3.5 px-6 bg-red-500/10 border border-red-500/20 text-red-400 text-[15px] font-semibold rounded-xl hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              <XCircle size={18} /> Reject
            </button>
          </div>
        )}

        {intake.status === 'approved' && intake.employee_id && (
          <a href={`/admin/employees/${intake.employee_id}`}
            className="block py-3.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[15px] font-semibold rounded-xl text-center hover:bg-green-500/15 transition-colors">
            View Employee Profile →
          </a>
        )}
      </div>
    </div>
  );
}
