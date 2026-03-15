'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  ArrowLeft, User, Mail, Shield, FileText, Wrench, BarChart3,
  DollarSign, StickyNote, Activity, Loader2, Phone, Calendar,
  Building2, Clock, AlertTriangle, Upload, Trash2, Plus, X,
  Check, ChevronRight, Edit3, CheckCircle2, XCircle, PauseCircle,
  PlayCircle, AlertCircle, Heart, Construction,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface EmailAccount {
  id: string;
  email: string;
  display_name: string;
  color: string;
  initials: string;
}

interface EmailAccess {
  id: string;
  email_account_id: string;
  email_accounts: EmailAccount;
}

interface Document {
  id: string;
  name: string;
  doc_type: string | null;
  file_url: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  condition: string | null;
  notes: string | null;
  returned_date: string | null;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
}

interface EmployeeDetail {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  department: string | null;
  status: string;
  phone: string | null;
  hire_date: string | null;
  pay_rate: number | null;
  pay_type: string | null;
  employment_type: string | null;
  photo_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  work_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  email_access: EmailAccess[];
  documents: Document[];
  equipment: Equipment[];
  activity_log: ActivityEntry[];
}

// ─── Constants ──────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'email', label: 'Email Access', icon: Mail },
  { key: 'docs', label: 'Certs & Docs', icon: FileText },
  { key: 'equipment', label: 'Equipment', icon: Wrench },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'financial', label: 'Financial', icon: DollarSign },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'activity', label: 'Activity', icon: Activity },
] as const;

const DEPARTMENTS = ['Office', 'Residential', 'Commercial', 'Grading', 'Maintenance'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Seasonal', '1099 Contractor'];
const DOC_CATEGORIES = ['Certification', 'License', 'ID', 'Insurance', 'Contract', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Poor'];

// ─── Helpers ────────────────────────────────────────────────
function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = ['#C9A84C', '#D4772C', '#4C8BC9', '#4CC97A', '#C94C6E', '#8B4CC9', '#C9964C', '#4CC9B8'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(d: string | null | undefined) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function statusConfig(status: string) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active:     { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', label: 'Active' },
    suspended:  { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Suspended' },
    terminated: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: 'Terminated' },
  };
  return map[status] || map.active;
}

function daysUntil(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Component ──────────────────────────────────────────────
export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // ── Fetch employee ──
  const fetchEmployee = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/employees/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setEmployee(data);
    } catch {
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Employee" subtitle="Not Found" backHref="/admin/employees" />
        <div className="text-center py-20">
          <User size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-[16px] text-white/30">Employee not found</p>
          <Link href="/admin/employees" className="text-[14px] text-[#C9A84C] mt-3 inline-block hover:underline">
            Back to team
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const sc = statusConfig(employee.status);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title={fullName} subtitle={employee.title || 'Team Member'} backHref="/admin/employees" />

      {/* Tab bar */}
      <div className="border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium whitespace-nowrap transition-all ${
                  activeTab === key
                    ? 'bg-white/10 text-white'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && <OverviewTab employee={employee} onUpdate={fetchEmployee} id={id} />}
        {activeTab === 'email' && <EmailTab employee={employee} onUpdate={fetchEmployee} id={id} />}
        {activeTab === 'docs' && <DocsTab employee={employee} onUpdate={fetchEmployee} id={id} />}
        {activeTab === 'equipment' && <EquipmentTab employee={employee} onUpdate={fetchEmployee} id={id} />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'financial' && <FinancialTab employee={employee} />}
        {activeTab === 'notes' && <NotesTab employee={employee} id={id} onUpdate={fetchEmployee} />}
        {activeTab === 'activity' && <ActivityTab employee={employee} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ══════════════════════════════════════════════════════════════
function OverviewTab({ employee, onUpdate, id }: { employee: EmployeeDetail; onUpdate: () => void; id: string }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: employee.first_name,
    last_name: employee.last_name,
    title: employee.title || '',
    department: employee.department || '',
    phone: employee.phone || '',
    employment_type: employee.employment_type || '',
    work_email: employee.work_email || '',
    hire_date: employee.hire_date || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_phone: employee.emergency_contact_phone || '',
    emergency_contact_relationship: employee.emergency_contact_relationship || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditing(false);
      onUpdate();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true);
    try {
      await fetch(`/api/admin/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setConfirmAction(null);
      onUpdate();
    } catch {} finally {
      setStatusChanging(false);
    }
  };

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const sc = statusConfig(employee.status);

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <div className="flex items-start gap-5">
          {employee.photo_url ? (
            <img src={employee.photo_url} alt={fullName} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 text-[24px] font-bold"
              style={{ backgroundColor: getAvatarColor(fullName) + '20', color: getAvatarColor(fullName) }}
            >
              {getInitials(employee.first_name, employee.last_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[20px] font-bold text-white">{fullName}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
            {employee.title && <p className="text-[16px] text-white/60">{employee.title}</p>}
            {employee.department && <p className="text-[14px] text-white/30 mt-0.5">{employee.department}</p>}
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-white/40 hover:text-white border border-white/5 hover:border-white/10 rounded-xl transition-all flex-shrink-0"
          >
            <Edit3 size={14} />
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {editing ? (
        /* ── Edit form ── */
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-white mb-2">Edit Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">First Name</label>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Last Name</label>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-white/40 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none">
                <option value="">--</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Employment Type</label>
              <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none">
                <option value="">--</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Work Email</label>
              <input type="email" value={form.work_email} onChange={(e) => setForm({ ...form, work_email: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-white/40 mb-1.5">Hire Date</label>
            <input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
          </div>

          {/* Emergency contact */}
          <div className="border-t border-white/5 pt-4 mt-4">
            <h4 className="text-[14px] font-semibold text-white/60 mb-3 flex items-center gap-2">
              <Heart size={14} /> Emergency Contact
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Name</label>
                <input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Phone</label>
                <input type="tel" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Relationship</label>
                <input value={form.emergency_contact_relationship} onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-white/10 text-white/40 rounded-xl text-[14px] hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-[#C9A84C] text-black font-semibold rounded-xl text-[14px] hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      ) : (
        /* ── Info display ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard icon={Building2} label="Department" value={employee.department || '--'} />
          <InfoCard icon={Shield} label="Employment Type" value={employee.employment_type || '--'} />
          <InfoCard icon={Calendar} label="Hire Date" value={formatDate(employee.hire_date)} />
          <InfoCard icon={Phone} label="Phone" value={employee.phone || '--'} />
          <InfoCard icon={Mail} label="Work Email" value={employee.work_email || '--'} />
          <InfoCard icon={Clock} label="Updated" value={formatDate(employee.updated_at)} />
        </div>
      )}

      {/* Emergency contact display (when not editing) */}
      {!editing && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <h3 className="text-[14px] font-semibold text-white/60 mb-3 flex items-center gap-2">
            <Heart size={14} /> Emergency Contact
          </h3>
          {employee.emergency_contact_name ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[13px] text-white/25">Name</p>
                <p className="text-[15px] text-white mt-0.5">{employee.emergency_contact_name}</p>
              </div>
              <div>
                <p className="text-[13px] text-white/25">Phone</p>
                <p className="text-[15px] text-white mt-0.5">{employee.emergency_contact_phone || '--'}</p>
              </div>
              <div>
                <p className="text-[13px] text-white/25">Relationship</p>
                <p className="text-[15px] text-white mt-0.5">{employee.emergency_contact_relationship || '--'}</p>
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-white/20">No emergency contact on file</p>
          )}
        </div>
      )}

      {/* Status actions */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
        <h3 className="text-[14px] font-semibold text-white/60 mb-3">Status Actions</h3>
        <div className="flex flex-wrap gap-2">
          {employee.status !== 'active' && (
            <button
              onClick={() => setConfirmAction('active')}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[14px] font-medium hover:bg-green-500/20 transition-colors"
            >
              <PlayCircle size={16} /> Activate
            </button>
          )}
          {employee.status !== 'suspended' && (
            <button
              onClick={() => setConfirmAction('suspended')}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl text-[14px] font-medium hover:bg-yellow-500/20 transition-colors"
            >
              <PauseCircle size={16} /> Suspend
            </button>
          )}
          {employee.status !== 'terminated' && (
            <button
              onClick={() => setConfirmAction('terminated')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[14px] font-medium hover:bg-red-500/20 transition-colors"
            >
              <XCircle size={16} /> Terminate
            </button>
          )}
        </div>

        {/* Confirmation */}
        {confirmAction && (
          <div className="mt-4 bg-black/40 border border-white/10 rounded-xl p-4">
            <p className="text-[14px] text-white mb-3">
              Are you sure you want to change status to <strong className="capitalize">{confirmAction}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-white/10 text-white/40 rounded-lg text-[14px] hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleStatusChange(confirmAction)} disabled={statusChanging}
                className="px-4 py-2 bg-[#C9A84C] text-black font-semibold rounded-lg text-[14px] hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center gap-2">
                {statusChanging ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-white/30" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-white/25">{label}</p>
        <p className="text-[15px] text-white truncate">{value}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2: EMAIL ACCESS
// ══════════════════════════════════════════════════════════════
function EmailTab({ employee, onUpdate, id }: { employee: EmployeeDetail; onUpdate: () => void; id: string }) {
  const [allAccounts, setAllAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/email-accounts')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllAccounts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const assignedIds = new Set(employee.email_access.map((a) => a.email_account_id));

  const handleToggle = async (accountId: string, currentlyActive: boolean) => {
    setToggling(accountId);
    try {
      if (currentlyActive) {
        await fetch(`/api/admin/employees/${id}/email-access?email_account_id=${accountId}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/admin/employees/${id}/email-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email_account_id: accountId }),
        });
      }
      onUpdate();
    } catch {} finally {
      setToggling(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[16px] font-bold text-white">Email Accounts</h3>
          <p className="text-[13px] text-white/30">Toggle access to @rounlimited.com email accounts</p>
        </div>
        <span className="text-[13px] text-white/20">{assignedIds.size} active</span>
      </div>

      {allAccounts.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-xl p-8 text-center">
          <Mail size={32} className="mx-auto text-white/10 mb-3" />
          <p className="text-[14px] text-white/30">No email accounts configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allAccounts.map((account) => {
            const isActive = assignedIds.has(account.id);
            const isToggling = toggling === account.id;
            return (
              <div key={account.id} className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isActive && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                  {!isActive && <span className="w-2 h-2 rounded-full bg-white/10 flex-shrink-0" />}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: account.color + '30', color: account.color }}
                  >
                    {account.initials}
                  </div>
                  <div>
                    <p className="text-[15px] text-white font-medium">{account.email}</p>
                    <p className="text-[13px] text-white/25">{account.display_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(account.id, isActive)}
                  disabled={isToggling}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    isActive ? 'bg-green-500' : 'bg-white/10'
                  } ${isToggling ? 'opacity-50' : ''}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    isActive ? 'left-[22px]' : 'left-0.5'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3: CERTIFICATIONS & DOCS
// ══════════════════════════════════════════════════════════════
function DocsTab({ employee, onUpdate, id }: { employee: EmployeeDetail; onUpdate: () => void; id: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', doc_type: '', expiry_date: '', file_url: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/employees/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          doc_type: form.doc_type || null,
          expiry_date: form.expiry_date || null,
          file_url: form.file_url || null,
        }),
      });
      setForm({ name: '', doc_type: '', expiry_date: '', file_url: '' });
      setShowAdd(false);
      onUpdate();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    setDeleting(docId);
    try {
      await fetch(`/api/admin/employees/${id}/documents?doc_id=${docId}`, { method: 'DELETE' });
      onUpdate();
    } catch {} finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[16px] font-bold text-white">Certifications & Documents</h3>
          <p className="text-[13px] text-white/30">Licenses, IDs, insurance, and other documents</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/20 rounded-xl transition-all"
        >
          <Plus size={14} /> Add Document
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#111] border border-[#C9A84C]/20 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Document Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. CDL License"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40" required />
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Category</label>
              <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none">
                <option value="">Select...</option>
                {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">File URL</label>
              <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-white/10 text-white/40 rounded-lg text-[14px] hover:border-white/20 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#C9A84C] text-black font-semibold rounded-lg text-[14px] hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      {employee.documents.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-xl p-8 text-center">
          <FileText size={32} className="mx-auto text-white/10 mb-3" />
          <p className="text-[14px] text-white/30">No documents on file</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employee.documents.map((doc) => {
            const days = doc.expiry_date ? daysUntil(doc.expiry_date) : null;
            const isExpired = days !== null && days < 0;
            const isExpiring = days !== null && days >= 0 && days <= 30;
            return (
              <div key={doc.id} className={`bg-[#111] border rounded-xl p-4 flex items-center justify-between ${
                isExpired ? 'border-red-500/30' : isExpiring ? 'border-yellow-500/30' : 'border-white/5'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isExpired ? 'bg-red-500/10' : isExpiring ? 'bg-yellow-500/10' : 'bg-white/5'
                  }`}>
                    <FileText size={16} className={isExpired ? 'text-red-400' : isExpiring ? 'text-yellow-400' : 'text-white/30'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] text-white font-medium truncate">{doc.name}</p>
                      {doc.doc_type && (
                        <span className="text-[12px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{doc.doc_type}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {doc.expiry_date && (
                        <span className={`text-[13px] flex items-center gap-1 ${
                          isExpired ? 'text-red-400' : isExpiring ? 'text-yellow-400' : 'text-white/25'
                        }`}>
                          {isExpired && <AlertTriangle size={12} />}
                          {isExpiring && <AlertCircle size={12} />}
                          {isExpired ? 'Expired' : isExpiring ? `Expires in ${days} days` : `Expires ${formatDate(doc.expiry_date)}`}
                        </span>
                      )}
                      <span className="text-[12px] text-white/15">Added {formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="p-2 text-white/10 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  {deleting === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4: EQUIPMENT
// ══════════════════════════════════════════════════════════════
function EquipmentTab({ employee, onUpdate, id }: { employee: EmployeeDetail; onUpdate: () => void; id: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', serial_number: '', condition: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/employees/${id}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          serial_number: form.serial_number || null,
          condition: form.condition || null,
        }),
      });
      setForm({ name: '', description: '', serial_number: '', condition: '' });
      setShowAdd(false);
      onUpdate();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleReturn = async (equipId: string) => {
    setReturning(equipId);
    try {
      await fetch(`/api/admin/employees/${id}/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equip_id: equipId, returned_date: new Date().toISOString().split('T')[0] }),
      });
      onUpdate();
    } catch {} finally {
      setReturning(null);
    }
  };

  const handleDelete = async (equipId: string) => {
    if (!confirm('Remove this equipment record?')) return;
    setDeleting(equipId);
    try {
      await fetch(`/api/admin/employees/${id}/equipment?equip_id=${equipId}`, { method: 'DELETE' });
      onUpdate();
    } catch {} finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[16px] font-bold text-white">Assigned Equipment</h3>
          <p className="text-[13px] text-white/30">Track company equipment assigned to this employee</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/20 rounded-xl transition-all"
        >
          <Plus size={14} /> Add Equipment
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#111] border border-[#C9A84C]/20 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Equipment Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Company Truck #3"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40" required />
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Serial Number</label>
              <input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Condition</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none">
                <option value="">Select...</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-white/10 text-white/40 rounded-lg text-[14px] hover:border-white/20 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#C9A84C] text-black font-semibold rounded-lg text-[14px] hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
            </button>
          </div>
        </form>
      )}

      {/* Equipment list */}
      {employee.equipment.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-xl p-8 text-center">
          <Wrench size={32} className="mx-auto text-white/10 mb-3" />
          <p className="text-[14px] text-white/30">No equipment assigned</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employee.equipment.map((eq) => {
            const isReturned = !!eq.returned_date;
            return (
              <div key={eq.id} className={`bg-[#111] border rounded-xl p-4 ${isReturned ? 'border-white/5 opacity-60' : 'border-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Wrench size={16} className="text-white/30" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] text-white font-medium truncate">{eq.name}</p>
                        {eq.condition && (
                          <span className="text-[12px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{eq.condition}</span>
                        )}
                        {isReturned && (
                          <span className="text-[12px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Returned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {eq.description && <span className="text-[13px] text-white/25">{eq.description}</span>}
                        {eq.serial_number && <span className="text-[12px] text-white/15 font-mono">S/N: {eq.serial_number}</span>}
                      </div>
                      {isReturned && eq.returned_date && (
                        <p className="text-[12px] text-white/15 mt-0.5">Returned {formatDate(eq.returned_date)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isReturned && (
                      <button
                        onClick={() => handleReturn(eq.id)}
                        disabled={returning === eq.id}
                        className="px-3 py-1.5 text-[13px] text-white/30 hover:text-green-400 border border-white/5 hover:border-green-500/20 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {returning === eq.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Return
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(eq.id)}
                      disabled={deleting === eq.id}
                      className="p-2 text-white/10 hover:text-red-400 transition-colors"
                    >
                      {deleting === eq.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 5: PERFORMANCE (Coming Soon)
// ══════════════════════════════════════════════════════════════
function PerformanceTab() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-[#111] border border-white/5 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D4772C]/10 flex items-center justify-center mx-auto mb-5">
          <Construction size={28} className="text-[#D4772C]" />
        </div>
        <h3 className="text-[18px] font-bold text-white mb-2">In Development</h3>
        <p className="text-[14px] text-white/40 mb-6">
          The performance module is being built and will include powerful tools to track and improve your team.
        </p>
        <div className="space-y-3 text-left">
          {[
            { label: 'Performance Reviews', desc: 'Regular evaluations with scoring' },
            { label: 'Skills Matrix', desc: 'Track certifications and competencies' },
            { label: 'Training Records', desc: 'Log completed training and courses' },
            { label: 'Goal Tracking', desc: 'Set and monitor employee goals' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="w-2 h-2 rounded-full bg-[#D4772C]/40 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[14px] text-white/60 font-medium">{item.label}</p>
                <p className="text-[13px] text-white/20">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 6: FINANCIAL
// ══════════════════════════════════════════════════════════════
function FinancialTab({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="space-y-5">
      {/* Current pay info */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-[16px] font-bold text-white mb-4">Compensation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-xl p-4">
            <p className="text-[13px] text-white/25 mb-1">Pay Rate</p>
            <p className="text-[22px] font-bold text-[#C9A84C]">
              {employee.pay_rate ? `$${Number(employee.pay_rate).toFixed(2)}` : '--'}
            </p>
          </div>
          <div className="bg-black/30 rounded-xl p-4">
            <p className="text-[13px] text-white/25 mb-1">Pay Type</p>
            <p className="text-[18px] font-semibold text-white capitalize">{employee.pay_type || '--'}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-4">
            <p className="text-[13px] text-white/25 mb-1">Employment Type</p>
            <p className="text-[18px] font-semibold text-white">{employee.employment_type || '--'}</p>
          </div>
        </div>
      </div>

      {/* Coming soon */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#D4772C]/10 flex items-center justify-center">
            <Construction size={18} className="text-[#D4772C]" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white">Coming Soon</h3>
            <p className="text-[13px] text-white/25">Additional financial features in development</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Payroll History', 'Tax Documents', 'Benefits', 'Reimbursements'].map((item) => (
            <div key={item} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4772C]/30 flex-shrink-0" />
              <span className="text-[14px] text-white/30">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 7: NOTES
// ══════════════════════════════════════════════════════════════
function NotesTab({ employee, id, onUpdate }: { employee: EmployeeDetail; id: string; onUpdate: () => void }) {
  const [notes, setNotes] = useState(employee.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate();
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[16px] font-bold text-white">Admin Notes</h3>
          <p className="text-[13px] text-white/30">Private notes about this employee (auto-saves on blur)</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-[13px] text-green-400">
            <Check size={14} /> Saved
          </span>
        )}
        {saving && (
          <span className="flex items-center gap-1.5 text-[13px] text-white/30">
            <Loader2 size={14} className="animate-spin" /> Saving...
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleSave}
        rows={16}
        placeholder="Add notes about this employee... performance observations, conversations, reminders, etc."
        className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-[15px] text-white leading-relaxed placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/20 resize-none"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 8: ACTIVITY
// ══════════════════════════════════════════════════════════════
function ActivityTab({ employee }: { employee: EmployeeDetail }) {
  const actionIcons: Record<string, { icon: any; color: string; bg: string }> = {
    status_change: { icon: Shield, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
    email_access: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    document: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    equipment: { icon: Wrench, color: 'text-green-400', bg: 'bg-green-500/10' },
  };

  const getActionConfig = (action: string) => {
    return actionIcons[action] || { icon: Activity, color: 'text-white/40', bg: 'bg-white/5' };
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-[16px] font-bold text-white">Activity Timeline</h3>
        <p className="text-[13px] text-white/30">Recent actions and changes</p>
      </div>

      {employee.activity_log.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-xl p-8 text-center">
          <Activity size={32} className="mx-auto text-white/10 mb-3" />
          <p className="text-[14px] text-white/30">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {employee.activity_log.map((entry, idx) => {
            const config = getActionConfig(entry.action);
            const Icon = config.icon;
            const isLast = idx === employee.activity_log.length - 1;
            return (
              <div key={entry.id} className="flex gap-3">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={config.color} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-white/5 my-1" />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-[#111] border border-white/5 rounded-xl p-3.5">
                    <p className="text-[14px] text-white/60 capitalize font-medium">
                      {entry.action.replace(/_/g, ' ')}
                    </p>
                    {entry.details && (
                      <p className="text-[14px] text-white/30 mt-0.5">{entry.details}</p>
                    )}
                    <p className="text-[12px] text-white/15 mt-1.5 flex items-center gap-1.5">
                      <Clock size={11} />
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
