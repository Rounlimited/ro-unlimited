'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { ScrollText, Loader2, ChevronRight } from 'lucide-react';
import {
  RFP_PROJECT_TYPES,
  RFP_SCOPES,
} from '@/lib/rfp-contact';
import type { CommercialRfpListItem } from '@/lib/sanity/commercial-rfp-admin';

function labelFor<T extends { value: string; label: string }>(list: readonly T[], value: string): string {
  return list.find((x) => x.value === value)?.label || value || '—';
}

function timeAgo(d: string | null) {
  if (!d) return '—';
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

const STATUS_FILTER: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In review' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

export default function CommercialRfpsAdminPage() {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<CommercialRfpListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    fetch(`/api/admin/commercial-rfps${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
        else setRows([]);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <AdminHeader title="Commercial RFPs" subtitle="Website contact submissions" />
      <div className="px-4 pb-8 max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTER.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                status === f.value
                  ? 'bg-[#D4772C]/20 text-[#D4772C]'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#C9A84C]" size={28} />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-white/30 text-[15px] py-12">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Link
                key={r._id}
                href={`/admin/commercial-rfps/${r._id}`}
                className="flex items-center gap-3 bg-[#111] border border-white/5 rounded-xl px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#D4772C]/10 flex items-center justify-center flex-shrink-0">
                  <ScrollText size={18} className="text-[#D4772C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-white truncate">{r.organizationName}</p>
                  <p className="text-[12px] text-white/35 truncate">
                    {r.contactName} · {labelFor(RFP_PROJECT_TYPES, r.projectType)} ·{' '}
                    {labelFor(RFP_SCOPES, r.scope)}
                  </p>
                  <p className="text-[11px] text-white/20 mt-0.5">
                    {timeAgo(r.submittedAt)}
                    {r.submittedFromHost ? ` · ${r.submittedFromHost}` : ''}
                  </p>
                </div>
                <ChevronRight size={18} className="text-white/15 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
