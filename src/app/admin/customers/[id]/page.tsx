'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Save, Trash2, Loader2, FileText, Mail, Phone, MapPin,
  Building2, Tag, Calendar, MessageSquare, ExternalLink,
} from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  type: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

const CUSTOMER_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'government', label: 'Government' },
];

const CUSTOMER_SOURCES = [
  { value: '', label: 'None' },
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

function formatDate(d: string | null) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setCustomer(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          company_name: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          type: data.type || 'residential',
          source: data.source || '',
          notes: data.notes || '',
        });
      })
      .catch(() => setError('Failed to load customer'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          company_name: form.company_name || null,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          type: form.type,
          source: form.source || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setCustomer(data);
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
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      router.push('/admin/customers');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const inputClass = 'w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 transition-colors';
  const labelClass = 'block text-[13px] text-white/40 mb-1.5';

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Customer" subtitle="Loading..." backHref="/admin/customers" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        </div>
      </div>
    );
  }

  if (!customer && error) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Customer" subtitle="Not Found" backHref="/admin/customers" />
        <div className="text-center py-20">
          <p className="text-[15px] text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader
        title={`${form.first_name} ${form.last_name}`}
        subtitle="Customer Details"
        backHref="/admin/customers"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[14px] text-red-400">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/estimates/new?customer=${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-[13px] font-semibold rounded-xl hover:bg-[#C9A84C]/20 transition-colors"
          >
            <FileText size={14} /> Create Estimate
          </a>
          <a
            href="/admin/inbox"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3b8dd4]/10 border border-[#3b8dd4]/20 text-[#3b8dd4] text-[13px] font-semibold rounded-xl hover:bg-[#3b8dd4]/20 transition-colors"
          >
            <Mail size={14} /> Send Email
          </a>
          {form.phone && (
            <a
              href={`tel:${form.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[13px] font-semibold rounded-xl hover:bg-green-500/20 transition-colors"
            >
              <Phone size={14} /> Call
            </a>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={16} className="text-[#C9A84C]" />
            <h3 className="text-[15px] font-bold text-white">Contact Info</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First Name *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-[#D4772C]" />
            <h3 className="text-[15px] font-bold text-white">Address</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>State</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">--</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className={labelClass}>Zip</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-[#3b8dd4]" />
            <h3 className="text-[15px] font-bold text-white">Classification</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={`${inputClass} appearance-none`}
              >
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className={`${inputClass} appearance-none`}
              >
                {CUSTOMER_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-white/40" />
            <h3 className="text-[15px] font-bold text-white">Notes</h3>
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            placeholder="Any notes about this customer..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Meta info */}
        {customer && (
          <div className="flex items-center gap-4 text-[13px] text-white/20 px-1">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              Created {formatDate(customer.created_at)}
            </span>
            {customer.updated_at && (
              <span>Updated {formatDate(customer.updated_at)}</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 pb-8">
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
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[15px] font-semibold rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-[17px] font-bold text-white mb-2">Delete Customer?</h3>
            <p className="text-[14px] text-white/40 mb-6">
              This will permanently delete <strong className="text-white/70">{form.first_name} {form.last_name}</strong>.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 text-[14px] font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white text-[14px] font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
