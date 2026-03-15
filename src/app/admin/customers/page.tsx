'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Search, Users, Phone, Mail, Building2,
  X, Loader2, ChevronRight, Trash2,
} from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  source: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

const TYPE_TABS = ['all', 'residential', 'commercial', 'government'] as const;

const CUSTOMER_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'government', label: 'Government' },
];

const CUSTOMER_SOURCES = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'drive-by', label: 'Drive-By' },
  { value: 'repeat', label: 'Repeat' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

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

function typeBadge(type: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    residential: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Residential' },
    commercial:  { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]', label: 'Commercial' },
    government:  { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Government' },
  };
  const s = map[type] || map.residential;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function sourceBadge(source: string | null) {
  if (!source) return null;
  const map: Record<string, { bg: string; text: string; label: string }> = {
    referral:  { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Referral' },
    website:   { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Website' },
    'drive-by': { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]', label: 'Drive-By' },
    repeat:    { bg: 'bg-[#C9A84C]/10', text: 'text-[#C9A84C]', label: 'Repeat' },
  };
  const s = map[source];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    type: 'residential',
    source: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = async (type?: string) => {
    setLoading(true);
    try {
      const url = type && type !== 'all'
        ? `/api/admin/customers?type=${type}`
        : '/api/admin/customers';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(activeTab);
  }, [activeTab]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const full = `${c.first_name} ${c.last_name}`.toLowerCase();
    return (
      full.includes(q) ||
      (c.company_name?.toLowerCase().includes(q)) ||
      (c.email?.toLowerCase().includes(q)) ||
      (c.phone?.includes(q))
    );
  });

  const deleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          company_name: formData.company_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          type: formData.type,
          source: formData.source || null,
          notes: formData.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');
      setShowCreate(false);
      setFormData({
        first_name: '', last_name: '', company_name: '', email: '',
        phone: '', address: '', city: '', state: '', zip: '',
        type: 'residential', source: '', notes: '',
      });
      fetchCustomers(activeTab);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Customers" subtitle="Customer Management" backHref="/admin" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <Users size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${filtered.length} Customer${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Manage your customers</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors">
            <Plus size={14} /> New Customer
          </button>
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-4">
          {TYPE_TABS.map((tab) => (
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
            placeholder="Search by name, company, email, or phone..."
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

        {/* Customer list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30">No customers found</p>
            <p className="text-[13px] text-white/15 mt-1">
              {search ? 'Try a different search term' : 'Add your first customer to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((customer) => {
              const fullName = `${customer.first_name} ${customer.last_name}`;
              return (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="block bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-[#141414] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[16px] font-bold"
                      style={{ backgroundColor: getAvatarColor(fullName) + '20', color: getAvatarColor(fullName) }}
                    >
                      {getInitials(customer.first_name, customer.last_name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-[16px] font-bold text-white truncate">{fullName}</p>
                        {typeBadge(customer.type)}
                        {sourceBadge(customer.source)}
                      </div>
                      {customer.company_name && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 size={12} className="text-white/25" />
                          <p className="text-[14px] text-white/50">{customer.company_name}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {customer.phone && (
                          <span className="flex items-center gap-1.5 text-[13px] text-white/25">
                            <Phone size={12} />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1.5 text-[13px] text-white/25">
                            <Mail size={12} />
                            {customer.email}
                          </span>
                        )}
                        {(customer.city || customer.state) && (
                          <span className="text-[13px] text-white/25">
                            {[customer.city, customer.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCustomer(customer.id, fullName); }}
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
          CREATE CUSTOMER MODAL
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
                <h2 className="text-[17px] font-bold text-white">New Customer</h2>
                <p className="text-[13px] text-white/30">Add a customer</p>
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

              {/* Company */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
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
              </div>

              {/* Address */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* City / State / Zip */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2">
                  <label className="block text-[13px] text-white/40 mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] text-white/40 mb-1.5">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    <option value="">--</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[13px] text-white/40 mb-1.5">Zip</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              </div>

              {/* Type & Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    {CUSTOMER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    <option value="">Select source...</option>
                    {CUSTOMER_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes about this customer..."
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
                    <><Plus size={16} /> Add Customer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
