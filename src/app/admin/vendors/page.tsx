'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Search, Building2, Phone, Mail, Star,
  X, Loader2, ChevronRight, Truck, Hammer, Package,
} from 'lucide-react';

interface Vendor {
  id: string;
  company_name: string;
  contact_name: string | null;
  trade: string | null;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  is_preferred: boolean;
  is_active: boolean;
  created_at: string;
}

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'supplier', label: 'Suppliers' },
  { key: 'subcontractor', label: 'Subs' },
  { key: 'rental', label: 'Rental' },
] as const;

const VENDOR_TYPES = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'rental', label: 'Rental' },
];

const COMMON_TRADES = [
  'General', 'Electrical', 'Plumbing', 'HVAC', 'Concrete', 'Framing',
  'Roofing', 'Drywall', 'Painting', 'Flooring', 'Landscaping', 'Grading',
  'Demolition', 'Masonry', 'Insulation', 'Windows & Doors', 'Siding',
  'Gutters', 'Fencing', 'Paving', 'Septic', 'Well', 'Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

function typeBadge(type: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    supplier:      { bg: 'bg-[#3b8dd4]/10', text: 'text-[#3b8dd4]', label: 'Supplier' },
    subcontractor: { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]', label: 'Sub' },
    rental:        { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Rental' },
  };
  const s = map[type] || map.supplier;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function tradeBadge(trade: string) {
  // Generate consistent color from trade name
  const colors = [
    { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    { bg: 'bg-pink-500/10', text: 'text-pink-400' },
    { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { bg: 'bg-lime-500/10', text: 'text-lime-400' },
    { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    { bg: 'bg-teal-500/10', text: 'text-teal-400' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  ];
  let hash = 0;
  for (let i = 0; i < trade.length; i++) hash = trade.charCodeAt(i) + ((hash << 5) - hash);
  const c = colors[Math.abs(hash) % colors.length];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${c.bg} ${c.text}`}>
      {trade}
    </span>
  );
}

function typeIcon(type: string) {
  switch (type) {
    case 'supplier': return <Package size={16} />;
    case 'subcontractor': return <Hammer size={16} />;
    case 'rental': return <Truck size={16} />;
    default: return <Building2 size={16} />;
  }
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    trade: '',
    type: 'supplier',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'SC',
    zip: '',
    notes: '',
    is_preferred: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('type', activeTab);
      if (preferredOnly) params.set('preferred', 'true');
      const qs = params.toString();
      const url = `/api/admin/vendors${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setVendors(data);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [activeTab, preferredOnly]);

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.company_name.toLowerCase().includes(q) ||
      (v.contact_name?.toLowerCase().includes(q)) ||
      (v.trade?.toLowerCase().includes(q)) ||
      (v.email?.toLowerCase().includes(q)) ||
      (v.phone?.includes(q))
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name) {
      setError('Company name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name,
          contact_name: formData.contact_name || null,
          trade: formData.trade || null,
          type: formData.type,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || 'SC',
          zip: formData.zip || null,
          notes: formData.notes || null,
          is_preferred: formData.is_preferred,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create vendor');
      setShowCreate(false);
      setFormData({
        company_name: '', contact_name: '', trade: '', type: 'supplier',
        phone: '', email: '', address: '', city: '', state: 'SC',
        zip: '', notes: '', is_preferred: false,
      });
      fetchVendors();
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Vendors" subtitle="Vendor Directory" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <Building2 size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${filtered.length} Vendor${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Suppliers, subs & rentals</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors"
          >
            <Plus size={14} /> Add Vendor
          </button>
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-4">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + preferred toggle */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search vendors..."
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
          <button
            onClick={() => setPreferredOnly(!preferredOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all flex-shrink-0 ${
              preferredOnly
                ? 'bg-[#C9A84C]/15 border-[#C9A84C]/30 text-[#C9A84C]'
                : 'bg-[#111] border-white/5 text-white/30 hover:text-white/50'
            }`}
          >
            <Star size={14} className={preferredOnly ? 'fill-[#C9A84C]' : ''} />
            Preferred
          </button>
        </div>

        {/* Vendor list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30">No vendors found</p>
            <p className="text-[13px] text-white/15 mt-1">
              {search ? 'Try a different search term' : 'Add your first vendor'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/admin/vendors/${vendor.id}`}
                className="block bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-[#141414] transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    vendor.type === 'supplier' ? 'bg-[#3b8dd4]/10 text-[#3b8dd4]' :
                    vendor.type === 'subcontractor' ? 'bg-[#D4772C]/10 text-[#D4772C]' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {typeIcon(vendor.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[16px] font-bold text-white truncate">{vendor.company_name}</p>
                      {vendor.is_preferred && (
                        <Star size={14} className="text-[#C9A84C] fill-[#C9A84C] flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {typeBadge(vendor.type)}
                      {vendor.trade && tradeBadge(vendor.trade)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {vendor.contact_name && (
                        <span className="text-[14px] text-white/50">{vendor.contact_name}</span>
                      )}
                      {vendor.phone && (
                        <span className="flex items-center gap-1.5 text-[13px] text-white/25">
                          <Phone size={12} />
                          {vendor.phone}
                        </span>
                      )}
                      {vendor.email && (
                        <span className="flex items-center gap-1.5 text-[13px] text-white/25">
                          <Mail size={12} />
                          {vendor.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={18} className="text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CREATE VENDOR MODAL
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
                <h2 className="text-[17px] font-bold text-white">New Vendor</h2>
                <p className="text-[13px] text-white/30">Add a supplier, sub, or rental company</p>
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

              {/* Company Name */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Company Name *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                  required
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* Type + Trade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    {VENDOR_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Trade</label>
                  <select
                    value={COMMON_TRADES.includes(formData.trade) || !formData.trade ? formData.trade : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') setFormData({ ...formData, trade: '' });
                      else setFormData({ ...formData, trade: e.target.value });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    <option value="">Select trade...</option>
                    {COMMON_TRADES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__custom__">Custom...</option>
                  </select>
                  {!COMMON_TRADES.includes(formData.trade) && formData.trade !== '' && (
                    <input
                      type="text"
                      placeholder="Enter custom trade..."
                      value={formData.trade}
                      onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                      className="w-full mt-2 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[13px] text-white/40 mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Zip</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              </div>

              {/* Preferred toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#C9A84C]" />
                  <span className="text-[14px] text-white/60">Preferred Vendor</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_preferred: !formData.is_preferred })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    formData.is_preferred ? 'bg-[#C9A84C]' : 'bg-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.is_preferred ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes about this vendor..."
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
                    <><Plus size={16} /> Add Vendor</>
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
