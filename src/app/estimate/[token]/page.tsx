'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SignaturePad from '@/components/public/SignaturePad';
import {
  useDocIntro, ReadingProgress, OptionsSection, StickyTotalBar, CeremonyDone, SignatureStamp,
  type PublicOptionGroup,
} from '@/components/public/DocExperience';
import PdfPreviewModal from '@/components/admin/PdfPreviewModal';

/* ─── Types ──────────────────────────────────────────────── */

interface Customer {
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
}

interface LineItem {
  id: string;
  phase: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
  total: number;
  sort_order: number;
}

interface Milestone {
  id: string;
  milestone: string;
  percent: number;
  amount: number;
  description: string;
  sort_order: number;
}

interface Disclaimer {
  id: string;
  title: string;
  body: string;
}

interface EstimateData {
  id: string;
  estimate_number: string;
  status: string;
  project_name: string;
  project_address: string | null;
  division: string;
  estimate_type: string | null;
  contract_type: string | null;
  scope_of_work: string | null;
  photos: { url: string; caption?: string }[] | null;
  signed_at?: string | null;
  signed_name?: string | null;
  document_mode?: string | null;
  options?: PublicOptionGroup[];
  selections_total?: number;
  final_total?: number;
  options_materialized_at?: string | null;
  selections_confirmed_at?: string | null;
  project_description: string | null;
  subtotal: number;
  overhead_percent: number;
  overhead_amount: number;
  markup_percent: number;
  markup_amount: number;
  tax_percent: number;
  tax_amount: number;
  contingency_percent: number;
  contingency_amount: number;
  permit_fees: number;
  total: number;
  valid_until: string | null;
  created_at: string;
  sent_at: string | null;
  customer: Customer | null;
  line_items: LineItem[];
  payment_schedule: Milestone[];
  disclaimers: Disclaimer[];
  exclusions: string | null;
}

/* ─── Helpers ──────────────────────────────────────────────── */

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(d: string | null): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',             color: '#666',    bg: '#f0f0f0' },
  sent:     { label: 'Awaiting Approval', color: '#8a6d20', bg: '#fdf6e7' },
  viewed:   { label: 'Awaiting Approval', color: '#8a6d20', bg: '#fdf6e7' },
  accepted: { label: 'Accepted',          color: '#16a34a', bg: '#f0fdf4' },
  declined: { label: 'Declined',          color: '#dc2626', bg: '#fef2f2' },
  expired:  { label: 'Expired',           color: '#666',    bg: '#f0f0f0' },
  revised:  { label: 'Revised',           color: '#7c3aed', bg: '#f5f3ff' },
};

const DIVISION_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  grading: 'Grading',
  utilities: 'Underground Utilities',
  septic: 'Septic',
  grease_traps: 'Grease Traps',
};
/** Internal values like "other:Utility" render as "Utility". */
function divisionLabel(v: string): string {
  if (DIVISION_LABELS[v]) return DIVISION_LABELS[v];
  const raw = v.includes(':') ? v.split(':').pop()! : v;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/* ─── Component ──────────────────────────────────────────── */

export default function PublicEstimatePage() {
  const params = useParams();
  const token = params.token as string;

  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [serverSelections, setServerSelections] = useState<Set<string>>(new Set());
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; expired?: boolean } | null>(null);

  // PDF preview
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Message form
  const [msgName, setMsgName] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await fetch(`/api/estimate/${token}`);
        if (res.status === 410) {
          setError({ message: 'This estimate link has expired. Please contact us for an updated link.', expired: true });
          return;
        }
        if (!res.ok) {
          setError({ message: 'This estimate could not be found.' });
          return;
        }
        const data = await res.json();
        setEstimate(data);
        if (Array.isArray(data.options)) {
          const sel = new Set<string>(data.options.flatMap((g: any) => g.choices.filter((c: any) => c.selected).map((c: any) => c.id)));
          setSelections(sel);
          setServerSelections(new Set(sel));
        }
      } catch {
        setError({ message: 'Something went wrong. Please try again later.' });
      } finally {
        setLoading(false);
      }
    };
    fetchEstimate();
  }, [token]);

  const handlePreviewPdf = async () => {
    if (!estimate) return;
    setPdfLoading(true);
    setShowPdfModal(true);
    try {
      const res = await fetch(`/api/admin/estimates/${estimate.id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch {
      setPdfPreviewUrl(null);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!estimate) return;
    window.open(`/api/admin/estimates/${estimate.id}/pdf`, '_blank');
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      const res = await fetch(`/api/estimate/${token}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName, message: msgText }),
      });
      if (!res.ok) throw new Error('Send failed');
      setMsgSent(true);
      setMsgText('');
      setMsgName('');
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setMsgSending(false);
    }
  };

  useDocIntro(!loading && !!estimate && !error);

  /* ─── Loading State ──────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[15px] text-gray-500">Loading estimate...</p>
        </div>
      </div>
    );
  }

  /* ─── Error State ────────────────────────────────────────── */

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            {error.expired ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">
            {error.expired ? 'Link Expired' : 'Estimate Not Found'}
          </h1>
          <p className="text-[15px] text-gray-500 mb-6">{error.message}</p>
          <a
            href="https://rounlimited.com"
            className="inline-block px-6 py-3 text-[14px] font-semibold text-white rounded-lg"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #b8953f)' }}
          >
            Visit RO Unlimited
          </a>
        </div>
      </div>
    );
  }

  if (!estimate) return null;

  const status = STATUS_LABELS[estimate.status] || STATUS_LABELS.draft;
  const daysLeft = getDaysUntil(estimate.valid_until);
  const customerName = estimate.customer
    ? [estimate.customer.first_name, estimate.customer.last_name].filter(Boolean).join(' ')
    : null;
  const scopeHtml = estimate.scope_of_work || estimate.project_description || '';

  // Group line items by phase
  const phases = estimate.line_items.reduce<Record<string, LineItem[]>>((acc, item) => {
    const phase = item.phase || 'General';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(item);
    return acc;
  }, {});

  const optionGroups: PublicOptionGroup[] = estimate?.options || [];
  const optionsLocked = !!(estimate?.signed_at || estimate?.options_materialized_at);
  const localDelta = optionGroups.reduce(
    (sum, g) => sum + g.choices.filter((c) => selections.has(c.id)).reduce((s2, c) => s2 + Number(c.price_delta), 0),
    0
  );
  const selectionsDirty = (() => {
    if (selections.size !== serverSelections.size) return true;
    return Array.from(selections).some((id) => !serverSelections.has(id));
  })();
  const missingRequired = optionGroups
    .filter((g) => g.selection_type === 'single' && g.required && !g.choices.some((c) => selections.has(c.id)))
    .map((g) => g.label);

  const toggleChoice = (group: PublicOptionGroup, choiceId: string) => {
    if (optionsLocked) return;
    setSelections((prev) => {
      const next = new Set(prev);
      if (group.selection_type === 'single') {
        for (const c of group.choices) next.delete(c.id);
        next.add(choiceId);
      } else if (next.has(choiceId)) next.delete(choiceId);
      else {
        if (group.selection_type === 'addon') for (const c of group.choices) next.delete(c.id);
        next.add(choiceId);
      }
      return next;
    });
  };

  const confirmSelections = async () => {
    if (!estimate) return;
    setConfirmBusy(true);
    try {
      const res = await fetch('/api/estimate/' + token + '/selections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice_ids: Array.from(selections) }),
      });
      const data = await res.json();
      if (res.ok && data.confirmed) {
        setServerSelections(new Set(selections));
        setEstimate({ ...estimate, selections_total: data.selections_total, selections_confirmed_at: new Date().toISOString() } as any);
      } else {
        alert(data.error || 'Could not save selections — try again');
      }
    } catch { alert('Connection problem — try again'); }
    setConfirmBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <ReadingProgress />
      <main id="doc-main" className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-4 pb-32">

        {/* ─── Brand header — same language as the invoice page ── */}
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ro-unlimited-logo.png" alt="RO Unlimited" className="h-10 w-auto" />
          <button
            onClick={() => document.getElementById('accept-sign')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl text-[15px] font-bold text-black shadow-sm active:scale-[0.98] transition-transform"
            style={{ background: estimate.signed_at ? '#e8f8f0' : '#C9A84C', color: estimate.signed_at ? '#187a4b' : '#000' }}
          >
            {estimate.signed_at ? 'Signed ✓' : 'Review & Sign'}
          </button>
        </div>

        {/* ─── Status banner ─────────────────────────────────── */}
        {(() => {
          const signed = !!estimate.signed_at;
          const accepted = estimate.status === 'accepted';
          const b = signed || accepted
            ? { bg: '#e8f8f0', border: '#b5e6cd', color: '#187a4b', text: signed ? `Accepted & signed${estimate.signed_name ? ' by ' + estimate.signed_name : ''} — thank you.` : 'Accepted — thank you.' }
            : ['declined', 'expired'].includes(estimate.status)
              ? { bg: '#f3f4f6', border: '#e5e7eb', color: '#6b7280', text: 'This document is no longer open — call us at (864) 304-0139 for a current version.' }
              : { bg: '#fdf6e7', border: '#ead9ac', color: '#8a6d20', text: `${estimate.document_mode === 'contract' ? 'Contract' : 'Estimate'} ready for your review — ${fmt(estimate.total)}. Sign below when you're ready.` };
          return (
            <div className="rounded-2xl p-4 border" style={{ background: b.bg, borderColor: b.border }}>
              <p className="text-[16px] font-semibold" style={{ color: b.color }}>{b.text}</p>
            </div>
          );
        })()}

        {/* ─── Header Card ───────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="doc-rule h-1" style={{ background: 'linear-gradient(90deg, #C9A84C, #D4772C)' }} />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-[26px] sm:text-[32px] font-bold text-gray-900">{estimate.estimate_number}</h1>
                  <span
                    className="px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wide"
                    style={{ color: status.color, background: status.bg }}
                  >
                    {status.label}
                  </span>
                </div>
                {estimate.project_name && (
                  <p className="text-[16px] text-gray-600 font-medium">{estimate.project_name}</p>
                )}
              </div>
              <div className="text-right text-[13px] text-gray-500 space-y-1 shrink-0">
                <div>Date: <span className="text-gray-700 font-medium">{fmtDate(estimate.sent_at || estimate.created_at)}</span></div>
                {estimate.valid_until && (
                  <div>
                    Valid Until: <span className="text-gray-700 font-medium">{fmtDate(estimate.valid_until)}</span>
                    {daysLeft !== null && daysLeft > 0 && daysLeft <= 14 && (
                      <span className="ml-2 text-[11px] text-amber-600 font-semibold">({daysLeft} days left)</span>
                    )}
                    {daysLeft !== null && daysLeft <= 0 && (
                      <span className="ml-2 text-[11px] text-red-500 font-semibold">(Expired)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Project Summary ───────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Project Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
            {customerName && (
              <div>
                <span className="text-gray-400 text-[12px] uppercase tracking-wide">Prepared For</span>
                <p className="text-gray-900 font-semibold mt-0.5">{customerName}</p>
                {estimate.customer?.company_name && (
                  <p className="text-gray-500 text-[13px]">{estimate.customer.company_name}</p>
                )}
              </div>
            )}
            {estimate.project_address && (
              <div>
                <span className="text-gray-400 text-[12px] uppercase tracking-wide">Address</span>
                <p className="text-gray-900 mt-0.5">{estimate.project_address}</p>
              </div>
            )}
            {estimate.division && (
              <div>
                <span className="text-gray-400 text-[12px] uppercase tracking-wide">Division</span>
                <p className="text-gray-900 mt-0.5">{divisionLabel(estimate.division)}</p>
              </div>
            )}
            {estimate.estimate_type && (
              <div>
                <span className="text-gray-400 text-[12px] uppercase tracking-wide">Type</span>
                <p className="text-gray-900 mt-0.5 capitalize">{estimate.estimate_type.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Scope of Work ──────────────────────────────────── */}
        {scopeHtml && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Scope of Work</h2>
            <div
              className="text-[14px] text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: scopeHtml }}
            />
          </div>
        )}

        {/* ─── Job-Site Photos ────────────────────────────────── */}
        {Array.isArray(estimate.photos) && estimate.photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Job-Site Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {estimate.photos.map((photo, i) => (
                <a
                  key={i}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url.includes('cdn.sanity.io') ? `${photo.url}?w=640&auto=format` : photo.url}
                      alt={photo.caption || `Job-site photo ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-[13px] text-gray-600 mt-1.5 leading-snug">{photo.caption}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── Action Buttons ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePreviewPdf}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-[14px] font-semibold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #b8953f)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            View Full Estimate PDF
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-[14px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={() => document.getElementById('accept-sign')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-[14px] font-bold text-black bg-[#C9A84C] rounded-xl active:scale-[0.98] transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {estimate.signed_at ? 'Signed' : (estimate.document_mode === 'contract' ? 'Accept & Sign Contract' : 'Accept & Sign')}
          </button>
        </div>

        {/* ─── Interactive options ────────────────────────────── */}
        {optionGroups.length > 0 && (
          <OptionsSection
            groups={optionGroups}
            selections={selections}
            onToggle={toggleChoice}
            onConfirm={confirmSelections}
            confirmedAt={estimate.selections_confirmed_at || null}
            locked={optionsLocked}
            busy={confirmBusy}
            dirty={selectionsDirty}
          />
        )}

        {/* ─── Financial Summary ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Financial Summary</h2>
          <div className="doc-rows space-y-2 text-[14px]">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 font-medium">{fmt(estimate.subtotal)}</span>
            </div>
            {estimate.overhead_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Overhead ({estimate.overhead_percent}%)</span>
                <span className="text-gray-900">{fmt(estimate.overhead_amount)}</span>
              </div>
            )}
            {estimate.markup_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Markup ({estimate.markup_percent}%)</span>
                <span className="text-gray-900">{fmt(estimate.markup_amount)}</span>
              </div>
            )}
            {estimate.tax_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tax ({estimate.tax_percent}%)</span>
                <span className="text-gray-900">{fmt(estimate.tax_amount)}</span>
              </div>
            )}
            {estimate.contingency_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Contingency ({estimate.contingency_percent}%)</span>
                <span className="text-gray-900">{fmt(estimate.contingency_amount)}</span>
              </div>
            )}
            {estimate.permit_fees > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Permit Fees</span>
                <span className="text-gray-900">{fmt(estimate.permit_fees)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 mt-2">
              <span className="text-[18px] font-bold text-gray-900">Total</span>
              <span className="text-[22px] font-bold" style={{ color: '#C9A84C' }}>{fmt(estimate.total)}</span>
            </div>
          </div>
        </div>

        {/* ─── Payment Schedule ───────────────────────────────── */}
        {estimate.payment_schedule.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Payment Schedule</h2>
            <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Milestone</th>
                    <th className="text-left py-2.5 text-[12px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Description</th>
                    <th className="text-right py-2.5 text-[12px] font-semibold text-gray-400 uppercase tracking-wide">%</th>
                    <th className="text-right py-2.5 text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.payment_schedule.map((ms) => (
                    <tr key={ms.id} className="border-b border-gray-50">
                      <td className="py-3 text-gray-900 font-medium">{ms.milestone}</td>
                      <td className="py-3 text-gray-500 hidden sm:table-cell">{ms.description}</td>
                      <td className="py-3 text-gray-700 text-right">{ms.percent}%</td>
                      <td className="py-3 text-gray-900 font-medium text-right">{fmt(ms.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Disclaimers ────────────────────────────────────── */}
        {estimate.disclaimers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Terms & Conditions</h2>
            <div className="space-y-4">
              {estimate.disclaimers.map((d) => (
                <div key={d.id}>
                  <h3 className="text-[14px] font-semibold text-gray-800 mb-1">{d.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-wrap">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Exclusions ─────────────────────────────────────── */}
        {estimate.exclusions && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-4">Exclusions</h2>
            <div
              className="text-[14px] text-gray-600 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: estimate.exclusions }}
            />
          </div>
        )}

        {/* ─── Message Section ────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-1">Questions or Changes?</h2>
          <p className="text-[13px] text-gray-400 mb-4">Send us a message about this estimate.</p>

          {msgSent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-[14px] text-green-700 font-semibold">Message sent!</p>
              <p className="text-[13px] text-green-600 mt-1">We&apos;ll get back to you shortly.</p>
              <button
                onClick={() => setMsgSent(false)}
                className="mt-3 text-[13px] text-green-600 underline hover:text-green-800"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-gray-400 uppercase tracking-wide mb-1">Your Name</label>
                <input
                  type="text"
                  value={msgName}
                  onChange={(e) => setMsgName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] text-gray-400 uppercase tracking-wide mb-1">Message</label>
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!msgText.trim() || msgSending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-semibold text-white rounded-lg disabled:opacity-40 transition-all hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #b8953f)' }}
              >
                {msgSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <StickyTotalBar
        baseTotal={Number(estimate.total) || 0}
        delta={optionsLocked ? 0 : localDelta}
        selectionCount={selections.size}
        signed={!!estimate.signed_at}
        hasOptions={optionGroups.length > 0}
      />

      {/* ─── Accept & Sign ──────────────────────────────────── */}
      <div id="accept-sign" className="max-w-2xl mx-auto px-4 pb-4">
        <EstimateSignCard
          token={String(token)}
          estimate={estimate}
          missingRequired={missingRequired}
          selectionsDirty={selectionsDirty && optionGroups.length > 0}
          finalTotal={(Number(estimate.total) || 0) + (optionsLocked ? 0 : localDelta)}
          onSigned={(name, at) => setEstimate({ ...estimate, signed_at: at, signed_name: name, status: 'accepted', options_materialized_at: at } as any)}
        />
      </div>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-[14px] font-semibold text-gray-700">RO Unlimited Construction & Development</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-[13px] text-gray-400">
            <a href="tel:+1" className="hover:text-[#C9A84C] transition-colors">Contact Us</a>
            <span>|</span>
            <a href="https://rounlimited.com" className="hover:text-[#C9A84C] transition-colors">rounlimited.com</a>
          </div>
        </div>
      </footer>

      {/* ─── PDF Preview Modal ────────────────────────────────── */}
      {showPdfModal && (
        <PdfPreviewModal
          pdfUrl={pdfPreviewUrl}
          loading={pdfLoading}
          onClose={() => { setShowPdfModal(false); setPdfPreviewUrl(null); }}
          estimateId={estimate.id}
        />
      )}
    </div>
  );
}


function EstimateSignCard({ token, estimate, missingRequired = [], selectionsDirty = false, finalTotal, onSigned }: { token: string; estimate: any; missingRequired?: string[]; selectionsDirty?: boolean; finalTotal?: number; onSigned: (name: string, at: string) => void }) {
  const [name, setName] = useState('');
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);
  const isContract = estimate.document_mode === 'contract';

  if (estimate.signed_at) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        {justSigned ? (
          <CeremonyDone name={estimate.signed_name || ''} docWord={isContract ? 'contract' : 'estimate'} />
        ) : (
          <>
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">Acceptance</h2>
            <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: '#e8f8f0', border: '1px solid #b5e6cd' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#187a4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <p className="text-[16px] font-semibold" style={{ color: '#187a4b' }}>
                Accepted &amp; signed by {estimate.signed_name} on {new Date(estimate.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {estimate.client_signature && (
              <SignatureStamp
                src={estimate.client_signature}
                name={estimate.signed_name || ''}
                date={new Date(estimate.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              />
            )}
          </>
        )}
      </div>
    );
  }
  if (['declined', 'expired'].includes(estimate.status)) return null;

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) { setError('Enter your full name'); return; }
    if (!sig) { setError('Draw your signature in the box'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/estimate/' + token + '/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), signature_data: sig }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Could not save signature'); setBusy(false); return; }
      setJustSigned(true);
      onSigned(data.signed_name, data.signed_at);
    } catch { setError('Connection problem — try again'); setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-1">
        {isContract ? 'Accept & Sign Contract' : 'Accept & Sign'}
      </h2>
      <p className="text-[15px] text-gray-500 mb-4">
        {isContract
          ? 'Signing below enters a binding construction contract with RO Unlimited for the work described above, subject to the stated terms.'
          : 'Signing below accepts this estimate and authorizes RO Unlimited to begin work as described above, subject to the stated terms.'}
      </p>
      {finalTotal != null && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4" style={{ background: '#fdf6e7', border: '1px solid #ead9ac' }}>
          <span className="text-[15px] font-semibold" style={{ color: '#8a6d20' }}>You&apos;re signing for</span>
          <span className="text-[20px] font-bold" style={{ color: '#8a6d20' }}>
            {'$' + Number(finalTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
      {missingRequired.length > 0 && (
        <button
          onClick={() => document.getElementById('doc-options')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="w-full text-left rounded-xl px-4 py-3.5 mb-4 text-[15px] font-semibold"
          style={{ background: '#fdeeee', border: '1px solid #f5c6c6', color: '#b03434' }}>
          Choose your {missingRequired.join(' and ')} first — tap to jump up.
        </button>
      )}
      {selectionsDirty && missingRequired.length === 0 && (
        <p className="text-[14px] mb-4" style={{ color: '#8a6d20' }}>
          Heads up: you changed selections without confirming — signing uses what&apos;s selected right now.
        </p>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        className="w-full min-h-[52px] px-4 rounded-xl border border-gray-200 bg-white text-[17px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] mb-3"
      />
      <SignaturePad onChange={setSig} />
      {error && <p className="text-[15px] text-[#b03434] mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={busy || missingRequired.length > 0}
        className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[52px] px-8 rounded-xl bg-[#C9A84C] text-black text-[16px] font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {busy ? 'Saving…' : missingRequired.length > 0 ? 'Choose options to continue' : (isContract ? 'Sign Contract' : 'Accept & Sign')}
      </button>
      <p className="text-[13px] text-gray-400 mt-3">Your signature is recorded with a timestamp and appears on the final document.</p>
    </div>
  );
}
