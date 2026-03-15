'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Search, Users, Phone, Mail, Calendar, UserPlus,
  X, Loader2, ChevronRight, Trash2, Send, Copy, Check, Share2, Link2, Clock,
} from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  department: string | null;
  status: string;
  phone: string | null;
  hire_date: string | null;
  profile_photo_url: string | null;
  employment_type: string | null;
}

const STATUS_TABS = ['all', 'active', 'suspended', 'terminated'] as const;
const DEPARTMENTS = ['Office', 'Residential', 'Commercial', 'Grading', 'Maintenance', 'General / Multi-Division'];
const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: '1099', label: '1099 Contractor' },
  { value: 'temp', label: 'Temp' },
];
const PAY_TYPES = ['hourly', 'salary'] as const;

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    '#C9A84C', '#D4772C', '#4C8BC9', '#4CC97A',
    '#C94C6E', '#8B4CC9', '#C9964C', '#4CC9B8',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active:     { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', label: 'Active' },
    suspended:  { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Suspended' },
    terminated: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: 'Terminated' },
  };
  const s = map[status] || map.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    title: '',
    department: '',
    employment_type: '',
    pay_rate: '',
    pay_type: 'hourly' as 'hourly' | 'salary',
    hire_date: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Intake state
  const [showIntake, setShowIntake] = useState(false);
  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeTitle, setIntakeTitle] = useState('');
  const [intakeLink, setIntakeLink] = useState('');
  const [intakeCopied, setIntakeCopied] = useState(false);
  const [creatingIntake, setCreatingIntake] = useState(false);
  const [intakes, setIntakes] = useState<any[]>([]);

  const fetchEmployees = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'all'
        ? `/api/admin/employees?status=${status}`
        : '/api/admin/employees';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(activeTab);
  }, [activeTab]);

  // Fetch pending intakes
  useEffect(() => {
    fetch('/api/admin/intakes').then(r => r.json()).then(d => { if (Array.isArray(d)) setIntakes(d.filter(i => i.status !== 'approved')); }).catch(() => {});
  }, []);

  const generateIntakeLink = async () => {
    setCreatingIntake(true);
    setIntakeLink('');
    try {
      const res = await fetch('/api/admin/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: intakeName || null,
          candidate_phone: intakePhone || null,
          position_title: intakeTitle || null,
        }),
      });
      const data = await res.json();
      if (data.intake_url) setIntakeLink(data.intake_url);
    } catch {} finally { setCreatingIntake(false); }
  };

  const copyIntakeLink = () => {
    navigator.clipboard.writeText(intakeLink);
    setIntakeCopied(true);
    setTimeout(() => setIntakeCopied(false), 2000);
  };

  const shareIntakeLink = () => {
    const msg = intakeName
      ? `Hey ${intakeName.split(' ')[0]}, fill out this form for RO Unlimited:\n${intakeLink}`
      : `Fill out this onboarding form for RO Unlimited:\n${intakeLink}`;
    if (navigator.share) {
      navigator.share({ title: 'RO Unlimited Onboarding', text: msg, url: intakeLink }).catch(() => {});
    } else {
      window.open(`sms:${intakePhone ? intakePhone : ''}?body=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const deleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  const filtered = employees.filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const full = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return (
      full.includes(q) ||
      (emp.title?.toLowerCase().includes(q)) ||
      (emp.department?.toLowerCase().includes(q))
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          title: formData.title || null,
          department: formData.department || null,
          employment_type: formData.employment_type || null,
          pay_rate: formData.pay_rate ? parseFloat(formData.pay_rate) : null,
          pay_type: formData.pay_type,
          hire_date: formData.hire_date || null,
          notes: formData.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create employee');
      setShowCreate(false);
      setFormData({
        first_name: '', last_name: '', phone: '', title: '',
        department: '', employment_type: '', pay_rate: '',
        pay_type: 'hourly', hire_date: '', notes: '',
      });
      fetchEmployees(activeTab);
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Team" subtitle="Employee Management" backHref="/admin" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <Users size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${filtered.length} Employee${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Manage your team</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowIntake(true); setIntakeLink(''); setIntakeName(''); setIntakePhone(''); setIntakeTitle(''); }}
              className="flex items-center gap-2 px-3 py-2.5 bg-[#D4772C]/15 border border-[#D4772C]/30 text-[#D4772C] text-[13px] font-semibold rounded-xl hover:bg-[#D4772C]/25 transition-colors">
              <Send size={14} /> Intake
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Pending intakes banner */}
        {intakes.filter(i => i.status === 'submitted').length > 0 && (
          <a href="/admin/intakes"
            className="flex items-center justify-between mb-4 px-4 py-3 bg-[#D4772C]/10 border border-[#D4772C]/20 rounded-xl hover:bg-[#D4772C]/15 transition-colors">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-[#D4772C]" />
              <span className="text-[14px] font-semibold text-[#D4772C]">{intakes.filter(i => i.status === 'submitted').length} intake{intakes.filter(i => i.status === 'submitted').length !== 1 ? 's' : ''} waiting for review</span>
            </div>
            <ChevronRight size={16} className="text-[#D4772C]/50" />
          </a>
        )}
        {intakes.filter(i => i.status === 'submitted').length === 0 && intakes.filter(i => i.status === 'pending' || i.status === 'in_progress').length > 0 && (
          <a href="/admin/intakes"
            className="flex items-center justify-between mb-4 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-400/60" />
              <span className="text-[14px] text-blue-400/60">{intakes.filter(i => i.status === 'pending' || i.status === 'in_progress').length} intake{intakes.filter(i => i.status === 'pending' || i.status === 'in_progress').length !== 1 ? 's' : ''} pending</span>
            </div>
            <ChevronRight size={16} className="text-blue-400/30" />
          </a>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 rounded-lg text-[14px] font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search by name, title, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Employee list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30">No employees found</p>
            <p className="text-[13px] text-white/15 mt-1">
              {search ? 'Try a different search term' : 'Add your first team member'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((emp) => {
              const fullName = `${emp.first_name} ${emp.last_name}`;
              return (
                <Link
                  key={emp.id}
                  href={`/admin/employees/${emp.id}`}
                  className="block bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-[#141414] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {emp.profile_photo_url ? (
                      <img
                        src={emp.profile_photo_url}
                        alt={fullName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[16px] font-bold"
                        style={{ backgroundColor: getAvatarColor(fullName) + '20', color: getAvatarColor(fullName) }}
                      >
                        {getInitials(emp.first_name, emp.last_name)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-[16px] font-bold text-white truncate">{fullName}</p>
                        {statusBadge(emp.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {emp.title && (
                          <p className="text-[14px] text-white/50">{emp.title}</p>
                        )}
                        {emp.department && (
                          <p className="text-[13px] text-white/25">{emp.department}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        {emp.hire_date && (
                          <span className="flex items-center gap-1.5 text-[13px] text-white/25">
                            <Calendar size={12} />
                            {formatDate(emp.hire_date)}
                          </span>
                        )}
                        {emp.phone && (
                          <span className="flex items-center gap-1.5 text-[13px] text-white/25">
                            <Phone size={12} />
                            {emp.phone}
                          </span>
                        )}
                        {emp.employment_type && (
                          <span className="text-[13px] text-white/25 capitalize">
                            {emp.employment_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteEmployee(emp.id, fullName); }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                      <ChevronRight size={18} className="text-white/10 group-hover:text-white/30 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CREATE EMPLOYEE MODAL
      ══════════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />

          {/* Modal */}
          <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#111] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-[17px] font-bold text-white">New Employee</h2>
                <p className="text-[13px] text-white/30">Add a team member</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[14px] text-red-400">
                  {error}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Crew Lead, Equipment Operator"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Department</label>
                <select
                  value={DEPARTMENTS.includes(formData.department) || !formData.department ? formData.department : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') setFormData({ ...formData, department: '' });
                    else setFormData({ ...formData, department: e.target.value });
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                >
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>
                {!DEPARTMENTS.includes(formData.department) && formData.department !== '' && (
                  <input
                    type="text"
                    placeholder="Enter custom department..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full mt-2 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40"
                    autoFocus
                  />
                )}
              </div>

              {/* Employment type */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                >
                  <option value="">Select type...</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Pay rate + type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Pay Rate</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-[14px]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pay_rate}
                      onChange={(e) => setFormData({ ...formData, pay_rate: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-7 pr-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Pay Type</label>
                  <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                    {PAY_TYPES.map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setFormData({ ...formData, pay_type: pt })}
                        className={`flex-1 py-2.5 text-[14px] font-medium capitalize transition-colors ${
                          formData.pay_type === pt
                            ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                            : 'text-white/30 hover:text-white/50'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hire date */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Hire Date</label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes about this employee..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 pb-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#C9A84C] text-black text-[15px] font-bold rounded-xl hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Plus size={16} /> Add Employee</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          INTAKE FORM MODAL
      ══════════════════════════════════════════════ */}
      {showIntake && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowIntake(false)} />
          <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-white">Send Intake Form</h3>
                <p className="text-[12px] text-white/25 mt-0.5">Generate a link for a new hire to fill out</p>
              </div>
              <button onClick={() => setShowIntake(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>

            {!intakeLink ? (
              <div className="px-5 py-4 space-y-3">
                <p className="text-[13px] text-white/30">All fields are optional — you can send a blank form and let them fill everything in.</p>
                <div>
                  <label className="block text-[12px] text-white/30 mb-1">Name (optional)</label>
                  <input type="text" placeholder="Their name if you know it" value={intakeName} onChange={e => setIntakeName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4772C]/40" />
                </div>
                <div>
                  <label className="block text-[12px] text-white/30 mb-1">Phone (optional)</label>
                  <input type="tel" placeholder="Their phone number" value={intakePhone} onChange={e => setIntakePhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4772C]/40" />
                </div>
                <div>
                  <label className="block text-[12px] text-white/30 mb-1">Position (optional)</label>
                  <input type="text" placeholder="e.g. Foreman, Laborer" value={intakeTitle} onChange={e => setIntakeTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4772C]/40" />
                </div>
                <div className="pt-2 flex gap-2">
                  <button onClick={generateIntakeLink} disabled={creatingIntake}
                    className="flex-1 py-3 bg-[#D4772C] text-white text-[14px] font-bold rounded-xl hover:bg-[#c06a24] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {creatingIntake ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Link2 size={14} /> Generate Link</>}
                  </button>
                  <button onClick={() => { setIntakeName(''); setIntakePhone(''); setIntakeTitle(''); generateIntakeLink(); }} disabled={creatingIntake}
                    className="py-3 px-4 bg-white/5 border border-white/10 text-white/50 text-[13px] font-medium rounded-xl hover:bg-white/10 disabled:opacity-50 transition-colors"
                    title="Quick send — no info needed">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[12px] text-green-400/60 font-medium">Link ready — expires in 30 days</span>
                </div>
                {intakeName && <p className="text-[13px] text-white/40">For: <span className="text-white/70">{intakeName}</span></p>}
                <div className="flex gap-2">
                  <input type="text" value={intakeLink} readOnly className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white/40 font-mono truncate" />
                  <button onClick={copyIntakeLink} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[12px] text-white/60 hover:bg-white/10 flex items-center gap-1.5 flex-shrink-0">
                    {intakeCopied ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <button onClick={shareIntakeLink}
                  className="w-full py-3 bg-[#D4772C] text-white text-[14px] font-bold rounded-xl hover:bg-[#c06a24] transition-colors flex items-center justify-center gap-2">
                  <Share2 size={14} /> Send via Text
                </button>
                <button onClick={() => { setIntakeLink(''); setShowIntake(false); }}
                  className="w-full py-2 text-white/25 text-[13px] hover:text-white/40 transition-colors">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
