'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Loader2,
  ChevronLeft,
  Save,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import {
  RFP_PROJECT_TYPES,
  RFP_SCOPES,
  RFP_BUDGET_RANGES,
  RFP_REFERRAL_SOURCES,
} from '@/lib/rfp-contact';
import {
  COMMERCIAL_RFP_STATUSES,
  type CommercialRfpDetail,
} from '@/lib/sanity/commercial-rfp-admin';

function labelFor<T extends { value: string; label: string }>(list: readonly T[], value: string): string {
  return list.find((x) => x.value === value)?.label || value || '—';
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <p className="text-[11px] text-white/25 uppercase tracking-wider">{label}</p>
      <p className="text-[15px] text-white/85 mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function CommercialRfpDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const rid = typeof id === 'string' ? id : id?.[0] ?? '';

  const [doc, setDoc] = useState<CommercialRfpDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!rid) return;
    setLoading(true);
    fetch(`/api/admin/commercial-rfps/${rid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d._id) {
          setDoc(d);
          setStatus(d.status || 'new');
          setNotes(d.notes || '');
        } else {
          setDoc(null);
        }
      })
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [rid]);

  const save = async () => {
    if (!rid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/commercial-rfps/${rid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      const d = await res.json();
      if (d._id) setDoc(d);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#C9A84C]" size={28} />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] px-4 py-8">
        <button
          type="button"
          onClick={() => router.push('/admin/commercial-rfps')}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[14px] mb-6"
        >
          <ChevronLeft size={18} /> Back to RFPs
        </button>
        <p className="text-white/40">Not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <AdminHeader title={doc.organizationName} subtitle="Commercial RFP" />
      <div className="px-4 pb-10 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.push('/admin/commercial-rfps')}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[14px] mb-6"
        >
          <ChevronLeft size={18} /> All RFPs
        </button>

        <div className="bg-[#111] border border-white/5 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 text-[#C9A84C]">
            <Building2 size={18} />
            <span className="text-[13px] font-semibold uppercase tracking-wider">Organization</span>
          </div>
          <Field label="Name" value={doc.organizationName} />
        </div>

        <div className="bg-[#111] border border-white/5 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 text-[#C9A84C]">
            <User size={18} />
            <span className="text-[13px] font-semibold uppercase tracking-wider">Contact</span>
          </div>
          <Field label="Contact name" value={doc.contactName} />
          <div className="flex items-start gap-2 py-2 border-b border-white/5">
            <Mail size={16} className="text-white/25 mt-1 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-white/25 uppercase tracking-wider">Email</p>
              <a href={`mailto:${doc.email}`} className="text-[15px] text-[#3b8dd4] mt-1 inline-block">
                {doc.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-2 py-2">
            <Phone size={16} className="text-white/25 mt-1 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-white/25 uppercase tracking-wider">Phone</p>
              <a href={`tel:${doc.phone}`} className="text-[15px] text-white/85 mt-1 inline-block">
                {doc.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 text-[#C9A84C]">
            <FileText size={18} />
            <span className="text-[13px] font-semibold uppercase tracking-wider">Project</span>
          </div>
          <Field label="Type" value={labelFor(RFP_PROJECT_TYPES, doc.projectType)} />
          <Field label="Scope" value={labelFor(RFP_SCOPES, doc.scope)} />
          <Field label="Est. square footage" value={doc.squareFootage} />
          <Field label="Location" value={doc.locationCityState} />
          <Field label="Desired start" value={doc.desiredStartDate} />
          <Field label="Budget" value={labelFor(RFP_BUDGET_RANGES, doc.budgetRange || '')} />
          <Field label="How they heard about us" value={labelFor(RFP_REFERRAL_SOURCES, doc.referralSource || '')} />
          <Field label="Description" value={doc.description} />
        </div>

        <div className="bg-[#111] border border-white/5 rounded-xl p-5 mb-4">
          <p className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">Internal</p>
          <label className="block text-[12px] text-white/35 mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-[15px] text-white mb-4"
          >
            {COMMERCIAL_RFP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <label className="block text-[12px] text-white/35 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-[15px] text-white placeholder:text-white/20 resize-y min-h-[100px]"
            placeholder="Internal notes…"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#C9A84C]/20 text-[#C9A84C] font-semibold text-[15px] hover:bg-[#C9A84C]/30 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save
          </button>
        </div>

        <p className="text-[11px] text-white/20 text-center">
          Submitted {doc.submittedAt ? new Date(doc.submittedAt).toLocaleString() : '—'}
          {doc.submittedFromHost ? ` · ${doc.submittedFromHost}` : ''}
        </p>
      </div>
    </div>
  );
}
