'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Building2, Phone, Mail, MapPin, Star, Loader2, Save,
  Trash2, Package, Hammer, Truck, AlertTriangle, X,
  FileText,
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
  updated_at: string | null;
}

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

function formatDate(d: string | null | undefined) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeIcon(type: string) {
  switch (type) {
    case 'supplier': return <Package size={18} />;
    case 'subcontractor': return <Hammer size={18} />;
    case 'rental': return <Truck size={18} />;
    default: return <Building2 size={18} />;
  }
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
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
    is_active: true,
  });

  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/vendors/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setVendor(data);
        setForm({
          company_name: data.company_name || '',
          contact_name: data.contact_name || '',
          trade: data.trade || '',
          type: data.type || 'supplier',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || 'SC',
          zip: data.zip || '',
          notes: data.notes || '',
          is_preferred: data.is_preferred || false,
          is_active: data.is_active !== false,
        });
      } catch {
        setError('Vendor not found');
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  const handleSave = async () => {
    if (!form.company_name) {
      setError('Company name is required');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name,
          contact_name: form.contact_name || null,
          trade: form.trade || null,
          type: form.type,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || 'SC',
          zip: form.zip || null,
          notes: form.notes || null,
          is_preferred: form.is_preferred,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setVendor(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/admin/vendors');
    } catch {
      setError('Failed to delete vendor');
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Vendor" subtitle="Loading..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Vendor" subtitle="Not Found" />
        <div className="text-center py-20">
          <Building2 size={40} className="mx-auto text-white/10 mb-3" />
          <p className="text-[15px] text-white/30">Vendor not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title={form.company_name || 'Vendor'} subtitle="Vendor Details" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Vendor header card */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              form.type === 'supplier' ? 'bg-[#3b8dd4]/10 text-[#3b8dd4]' :
              form.type === 'subcontractor' ? 'bg-[#D4772C]/10 text-[#D4772C]' :
              'bg-emerald-500/10 text-emerald-400'
            }`}>
              {typeIcon(form.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-white truncate">{form.company_name}</h1>
                {form.is_preferred && (
                  <Star size={16} className="text-[#C9A84C] fill-[#C9A84C] flex-shrink-0" />
                )}
              </div>
              {form.contact_name && (
                <p className="text-[14px] text-white/40 mt-0.5">{form.contact_name}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium ${
                  form.type === 'supplier' ? 'bg-[#3b8dd4]/10 text-[#3b8dd4]' :
                  form.type === 'subcontractor' ? 'bg-[#D4772C]/10 text-[#D4772C]' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {VENDOR_TYPES.find(t => t.value === form.type)?.label || form.type}
                </span>
                {!form.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-red-500/10 text-red-400">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[14px] text-red-400">
            {error}
          </div>
        )}

        {/* Company Info */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Building2 size={16} className="text-[#C9A84C]" />
              Company Info
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Company Name *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
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
                  value={COMMON_TRADES.includes(form.trade) || !form.trade ? form.trade : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') setForm({ ...form, trade: '' });
                    else setForm({ ...form, trade: e.target.value });
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                >
                  <option value="">Select trade...</option>
                  {COMMON_TRADES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>
                {!COMMON_TRADES.includes(form.trade) && form.trade !== '' && (
                  <input
                    type="text"
                    placeholder="Enter custom trade..."
                    value={form.trade}
                    onChange={(e) => setForm({ ...form, trade: e.target.value })}
                    className="w-full mt-2 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Phone size={16} className="text-[#3b8dd4]" />
              Contact
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <MapPin size={16} className="text-[#D4772C]" />
              Address
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-[13px] text-white/40 mb-1.5">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">State</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
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
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Star size={16} className="text-[#C9A84C]" />
              Classification
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Preferred toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] text-white/60">Preferred Vendor</p>
                <p className="text-[12px] text-white/25 mt-0.5">Preferred vendors appear at the top of selection lists</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_preferred: !form.is_preferred })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  form.is_preferred ? 'bg-[#C9A84C]' : 'bg-white/10'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  form.is_preferred ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <p className="text-[14px] text-white/60">Active</p>
                <p className="text-[12px] text-white/25 mt-0.5">Inactive vendors are hidden from selection lists</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  form.is_active ? 'bg-green-500' : 'bg-white/10'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  form.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <FileText size={16} className="text-white/40" />
              Notes
            </h2>
          </div>
          <div className="px-5 py-4">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Any notes about this vendor..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 resize-none"
            />
          </div>
        </div>

        {/* Related Cost Items (placeholder) */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Package size={16} className="text-white/40" />
              Related Cost Items
            </h2>
          </div>
          <div className="px-5 py-8 text-center">
            <Package size={28} className="mx-auto text-white/10 mb-2" />
            <p className="text-[14px] text-white/20">Cost items will appear here once estimates reference this vendor</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-[12px] text-white/15 px-1">
          <span>Created {formatDate(vendor.created_at)}</span>
          {vendor.updated_at && <span>Updated {formatDate(vendor.updated_at)}</span>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-[#C9A84C] to-[#d4b55a] text-black text-[15px] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><Save size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[15px] font-semibold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════════ */}
      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-[17px] font-bold text-white mb-2">Delete Vendor?</h3>
              <p className="text-[14px] text-white/40 mb-6">
                This will deactivate <span className="text-white/70 font-medium">{vendor.company_name}</span>. They will no longer appear in vendor lists.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/60 text-[14px] font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[14px] font-bold rounded-xl hover:bg-red-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 size={14} /> Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
