'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import PdfPreviewModal from '@/components/admin/PdfPreviewModal';
import {
  ArrowLeft, Edit3, Copy, FileText, Send, Trash2, X,
  User, Building2, Mail, Phone, MapPin, Calendar,
  DollarSign, Clock, AlertTriangle, ChevronRight,
  TrendingUp, Percent, Shield, Receipt, CreditCard,
  History, CheckCircle2, XCircle, Eye, Loader2,
  ExternalLink, Home, Mountain, Link2, Check, FileSignature,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */

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
  notes?: string;
  cost_code?: string;
}

interface Milestone {
  id: string;
  milestone: string;
  percent: number;
  amount: number;
  description: string;
  sort_order: number;
}

interface StatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

interface Disclaimer {
  id: string;
  title: string;
  body: string;
  category: string;
}

interface EmailAccount {
  id: string;
  email: string;
  display_name: string;
}

import EstimatePhotos, { EstimatePhoto } from '@/components/admin/estimates/EstimatePhotos';
import OptionsBuilder from '@/components/admin/estimates/OptionsBuilder';

interface Estimate {
  id: string;
  estimate_number: string;
  customer_id: string;
  customer: Customer | null;
  project_name: string;
  project_address: string | null;
  division: string;
  estimate_type: string | null;
  contract_type: string | null;
  status: string;
  version: number;
  scope_of_work: string | null;
  description: string | null;
  photos: EstimatePhoto[] | null;
  overhead_percent: number;
  markup_percent: number;
  tax_percent: number;
  contingency_percent: number;
  permit_fees: number;
  subtotal: number;
  overhead_amount: number;
  markup_amount: number;
  tax_amount: number;
  contingency_amount: number;
  total: number;
  valid_until: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  client_signature: string | null;
  document_mode: string;
  disclaimer_ids: string[] | null;
  exclusions: string | null;
  inclusions: string | null;
  project_start_date: string | null;
  project_duration_days: number | null;
  weather_days: number;
  schedule_notes: string | null;
  total_override: number | null;
  notes: string | null;
  internal_notes: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
  line_items: LineItem[];
  payment_schedule: Milestone[];
  status_history: StatusHistoryEntry[];
}

/* ─── Constants ──────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  draft:    { bg: 'bg-white/5',       text: 'text-white/40',    border: 'border-white/10',    label: 'Draft' },
  sent:     { bg: 'bg-blue-500/10',   text: 'text-blue-400',    border: 'border-blue-500/20', label: 'Sent' },
  viewed:   { bg: 'bg-amber-500/10',  text: 'text-amber-400',   border: 'border-amber-500/20', label: 'Viewed' },
  accepted: { bg: 'bg-green-500/10',  text: 'text-green-400',   border: 'border-green-500/20', label: 'Accepted' },
  declined: { bg: 'bg-red-500/10',    text: 'text-red-400',     border: 'border-red-500/20',  label: 'Declined' },
  expired:  { bg: 'bg-white/5',       text: 'text-white/30',    border: 'border-white/10',    label: 'Expired' },
  revised:  { bg: 'bg-purple-500/10', text: 'text-purple-400',  border: 'border-purple-500/20', label: 'Revised' },
};

const DIVISION_CONFIG: Record<string, { label: string; icon: any; text: string }> = {
  residential: { label: 'Residential', icon: Home,      text: 'text-blue-400' },
  commercial:  { label: 'Commercial',  icon: Building2, text: 'text-[#D4772C]' },
  grading:     { label: 'Grading',     icon: Mountain,  text: 'text-green-400' },
  utilities:   { label: 'Underground Utilities', icon: Mountain, text: 'text-[#F84B0C]' },
  septic:      { label: 'Septic',      icon: Mountain,  text: 'text-green-400' },
  grease_traps: { label: 'Grease Traps', icon: Mountain,  text: 'text-[#D4772C]' },
};

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'line-items', label: 'Line Items' },
  { id: 'options',    label: 'Options' },
  { id: 'financials', label: 'Financials' },
  { id: 'schedule',   label: 'Schedule' },
  { id: 'terms',      label: 'Terms' },
  { id: 'history',    label: 'History' },
] as const;

type TabId = typeof TABS[number]['id'];

const CATEGORY_LABELS: Record<string, string> = {
  labor: 'Labor',
  material: 'Material',
  equipment: 'Equipment',
  subcontractor: 'Subcontractor',
  overhead: 'Overhead',
  other: 'Other',
};

/* ─── Helpers ────────────────────────────────────────────────── */

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtShort(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(d: string | null): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string | null): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function isExpired(validUntil: string | null, status: string): boolean {
  if (!validUntil) return false;
  if (status === 'accepted' || status === 'declined') return false;
  return new Date(validUntil) < new Date();
}

/* ─── Component ──────────────────────────────────────────────── */

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [lineItemSort, setLineItemSort] = useState<'order' | 'phase' | 'category' | 'cost'>('order');
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);

  // Modal states
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Send modal state
  const [sendTo, setSendTo] = useState('');
  const [sendFrom, setSendFrom] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [sending, setSending] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Action states
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [detailLinkCopied, setDetailLinkCopied] = useState(false);

  // PDF preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  /* ─── Data Fetching ──────────────────────────────────────────── */

  const fetchEstimate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/estimates/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEstimate(data);
      // Pre-fill send email from customer
      if (data.customer?.email) {
        setSendTo(data.customer.email);
      }
    } catch {
      setError('Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisclaimers = async () => {
    try {
      const res = await fetch('/api/admin/disclaimers');
      const data = await res.json();
      if (Array.isArray(data)) setDisclaimers(data);
    } catch {}
  };

  const fetchEmailAccounts = async () => {
    try {
      const res = await fetch('/api/admin/email-accounts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmailAccounts(data);
        const def = data.find((a: EmailAccount) => (a as any).is_default);
        if (def) setSendFrom(def.email);
        else if (data.length > 0) setSendFrom(data[0].email);
      }
    } catch {}
  };

  useEffect(() => {
    fetchEstimate();
    fetchDisclaimers();
    fetchEmailAccounts();
  }, [id]);

  /* ─── Actions ────────────────────────────────────────────────── */

  const handleSend = async () => {
    if (!sendTo || !estimate) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: sendTo,
          to_name: estimate.customer
            ? `${estimate.customer.first_name} ${estimate.customer.last_name}`
            : undefined,
          from_email: sendFrom || undefined,
          message: sendMessage || undefined,
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      if (data.share_link) setShareLink(data.share_link);
      setSendMessage('');
      fetchEstimate(); // Refresh to show updated status
    } catch {
      alert('Failed to send estimate. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyingLink(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}/share-link`, { method: 'POST' });
      const data = await res.json();
      if (data?.link) {
        await navigator.clipboard.writeText(data.link);
        setDetailLinkCopied(true);
        setTimeout(() => setDetailLinkCopied(false), 3000);
      }
    } catch {}
    setCopyingLink(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/estimates');
    } catch {
      alert('Failed to delete estimate.');
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!estimate) return;
    setDuplicating(true);
    try {
      // Create new estimate with same data
      const res = await fetch('/api/admin/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: estimate.customer_id,
          project_name: `${estimate.project_name} (Copy)`,
          project_address: estimate.project_address,
          division: estimate.division,
          estimate_type: estimate.estimate_type,
          contract_type: estimate.contract_type,
          scope_of_work: estimate.scope_of_work,
          description: estimate.description,
          photos: estimate.photos || [],
          overhead_percent: estimate.overhead_percent,
          markup_percent: estimate.markup_percent,
          tax_percent: estimate.tax_percent,
          contingency_percent: estimate.contingency_percent,
          permit_fees: estimate.permit_fees,
          valid_until: estimate.valid_until,
          notes: estimate.notes,
          internal_notes: estimate.internal_notes,
          status: 'draft',
        }),
      });
      const newEst = await res.json();
      if (!newEst?.id) throw new Error('Failed');

      // Copy line items
      if (estimate.line_items.length > 0) {
        const items = estimate.line_items.map((li, idx) => ({
          phase: li.phase,
          description: li.description,
          category: li.category,
          quantity: li.quantity,
          unit: li.unit,
          unit_cost: li.unit_cost,
          markup_percent: li.markup_percent,
          sort_order: idx,
        }));
        await fetch(`/api/admin/estimates/${newEst.id}/line-items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      }

      // Copy payment schedule
      if (estimate.payment_schedule.length > 0) {
        const schedItems = estimate.payment_schedule.map((m, idx) => ({
          milestone: m.milestone,
          description: m.description,
          percent: m.percent,
          amount: m.amount,
          sort_order: idx,
        }));
        await fetch(`/api/admin/estimates/${newEst.id}/payment-schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: schedItems }),
        });
      }

      // Copy disclaimers/exclusions
      if (estimate.disclaimer_ids || estimate.exclusions) {
        await fetch(`/api/admin/estimates/${newEst.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disclaimer_ids: estimate.disclaimer_ids,
            exclusions: estimate.exclusions,
          }),
        });
      }

      setShowDuplicateModal(false);
      router.push(`/admin/estimates/${newEst.id}`);
    } catch {
      alert('Failed to duplicate estimate.');
    } finally {
      setDuplicating(false);
    }
  };

  const handlePreviewPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}/pdf`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      setPdfPreviewUrl(URL.createObjectURL(blob));
    } catch {
      alert('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  /* ─── Computed Values ───────────────────────────────────────── */

  const lineItemsByPhase = useMemo(() => {
    if (!estimate) return {};
    const items = [...estimate.line_items];
    // Sort items based on selected sort mode
    if (lineItemSort === 'phase') items.sort((a, b) => (a.phase || 'zzz').localeCompare(b.phase || 'zzz'));
    else if (lineItemSort === 'category') items.sort((a, b) => (a.category || 'zzz').localeCompare(b.category || 'zzz'));
    else if (lineItemSort === 'cost') items.sort((a, b) => (b.quantity * b.unit_cost) - (a.quantity * a.unit_cost));
    // 'order' = default sort_order from API (construction sequence)
    const grouped: Record<string, LineItem[]> = {};
    for (const item of items) {
      const groupKey = lineItemSort === 'category' ? (item.category || 'Other') : (item.phase || 'Other');
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(item);
    }
    return grouped;
  }, [estimate, lineItemSort]);

  const subtotal = useMemo(
    () => estimate?.line_items.reduce((s, i) => s + (i.quantity * i.unit_cost * (1 + (i.markup_percent || 0) / 100)), 0) || 0,
    [estimate]
  );

  const selectedDisclaimers = useMemo(() => {
    if (!estimate?.disclaimer_ids || disclaimers.length === 0) return [];
    return disclaimers.filter(d => estimate.disclaimer_ids!.includes(d.id));
  }, [estimate, disclaimers]);

  const expired = estimate ? isExpired(estimate.valid_until, estimate.status) : false;

  const effectiveMargin = useMemo(() => {
    if (!estimate || !estimate.total || !subtotal) return 0;
    const cost = subtotal / (estimate.line_items.length > 0 ? 1 : 1); // raw cost from line items before markup
    const rawCost = estimate.line_items.reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    if (rawCost === 0) return 0;
    return ((estimate.total - rawCost) / estimate.total) * 100;
  }, [estimate, subtotal]);

  const profit = useMemo(() => {
    if (!estimate) return 0;
    const rawCost = estimate.line_items.reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    return estimate.total - rawCost;
  }, [estimate]);

  const paymentTotal = useMemo(
    () => estimate?.payment_schedule.reduce((s, m) => s + (m.percent || 0), 0) || 0,
    [estimate]
  );

  /* ─── Loading / Error States ──────────────────────────────────── */

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Estimate" subtitle="Loading..." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-white/5 rounded w-1/3 mb-3" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
        <AdminHeader title="Estimate" subtitle="Error" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <FileText size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-[16px] text-white/40 mb-2">{error || 'Estimate not found'}</p>
          <button
            onClick={() => router.push('/admin/estimates')}
            className="text-[14px] text-[#C9A84C] hover:underline"
          >
            Back to Estimates
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[estimate.status] || STATUS_CONFIG.draft;
  const divCfg = DIVISION_CONFIG[estimate.division] || DIVISION_CONFIG.residential;
  const DivIcon = divCfg.icon;
  const customerName = estimate.customer
    ? `${estimate.customer.first_name} ${estimate.customer.last_name}`
    : 'No Customer';

  /* ─── Render ───────────────────────────────────────────────── */

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title={estimate.estimate_number} subtitle="Estimate Detail" backHref="/admin/estimates" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* ─── Header Section ───────────────────────────────────── */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/estimates')}
            className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft size={14} />
            Back to Estimates
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[24px] sm:text-[28px] font-bold text-[#C9A84C]">
                {estimate.estimate_number}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 ${divCfg.text}`}>
                <DivIcon size={11} />
                {divCfg.label}
              </span>
              {estimate.document_mode && estimate.document_mode !== 'estimate' && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  estimate.document_mode === 'contract' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  estimate.document_mode === 'change_order' ? 'bg-[#D4772C]/10 text-[#D4772C] border border-[#D4772C]/20' :
                  estimate.document_mode === 'quick_quote' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  'bg-white/5 text-white/40'
                }`}>
                  {estimate.document_mode === 'contract' ? 'Proposal' :
                   estimate.document_mode === 'change_order' ? 'Change Order' :
                   estimate.document_mode === 'quick_quote' ? 'Quick Quote' :
                   estimate.document_mode}
                </span>
              )}
              {(estimate as any).revision_number > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D4772C]/10 text-[#D4772C] border border-[#D4772C]/20">
                  R{(estimate as any).revision_number}
                </span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[24px] sm:text-[28px] font-bold text-white">{fmtShort(estimate.total || 0)}</p>
              <p className="text-[12px] text-white/30">Total</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/admin/estimates/new?edit=${id}&step=1`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              onClick={() => setShowDuplicateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
            >
              <Copy size={14} /> Duplicate
            </button>
            {(!estimate.document_mode || estimate.document_mode === 'estimate') && (
              <button
                onClick={async () => {
                  await fetch(`/api/admin/estimates/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ document_mode: 'contract' }),
                  });
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-blue-400/70 bg-blue-500/5 border border-blue-500/10 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-all"
              >
                <FileSignature size={14} /> Convert to Proposal
              </button>
            )}
            {estimate.status !== 'draft' && (
              <button
                onClick={async () => {
                  const res = await fetch(`/api/admin/estimates/${id}/revise`, { method: 'POST' });
                  const data = await res.json();
                  if (data?.id) router.push(`/admin/estimates/new?edit=${data.id}&step=1`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#D4772C]/70 bg-[#D4772C]/5 border border-[#D4772C]/10 rounded-lg hover:bg-[#D4772C]/10 hover:text-[#D4772C] transition-all"
              >
                <History size={14} /> Revise
              </button>
            )}
            <button
              onClick={handlePreviewPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Preview
            </button>
            <button
              onClick={handleCopyLink}
              disabled={copyingLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all disabled:opacity-40 ${
                detailLinkCopied
                  ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                  : 'text-[#D4772C] bg-[#D4772C]/10 border border-[#D4772C]/20 hover:bg-[#D4772C]/20'
              }`}
            >
              {copyingLink ? <Loader2 size={14} className="animate-spin" /> : detailLinkCopied ? <Check size={14} /> : <Link2 size={14} />}
              {copyingLink ? '...' : detailLinkCopied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-black rounded-lg hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}
            >
              <Send size={14} /> Send
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-red-400/60 bg-red-500/5 border border-red-500/10 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all ml-auto"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* ─── Tab Navigation ───────────────────────────────────── */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ──────────────────────────────────────── */}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
                  <User size={16} className="text-[#C9A84C]" />
                  Customer
                </h3>
                {estimate.customer && (
                  <button
                    onClick={() => router.push(`/admin/customers/${estimate.customer_id}`)}
                    className="flex items-center gap-1 text-[12px] text-[#C9A84C] hover:underline"
                  >
                    View <ExternalLink size={11} />
                  </button>
                )}
              </div>
              {estimate.customer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-[14px]">
                    <User size={14} className="text-white/20 flex-shrink-0" />
                    <span className="text-white">{customerName}</span>
                  </div>
                  {estimate.customer.company_name && (
                    <div className="flex items-center gap-2 text-[14px]">
                      <Building2 size={14} className="text-white/20 flex-shrink-0" />
                      <span className="text-white/70">{estimate.customer.company_name}</span>
                    </div>
                  )}
                  {estimate.customer.email && (
                    <div className="flex items-center gap-2 text-[14px]">
                      <Mail size={14} className="text-white/20 flex-shrink-0" />
                      <a href={`mailto:${estimate.customer.email}`} className="text-[#3b8dd4] hover:underline">
                        {estimate.customer.email}
                      </a>
                    </div>
                  )}
                  {estimate.customer.phone && (
                    <div className="flex items-center gap-2 text-[14px]">
                      <Phone size={14} className="text-white/20 flex-shrink-0" />
                      <a href={`tel:${estimate.customer.phone}`} className="text-white/70 hover:text-white">
                        {estimate.customer.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[14px] text-white/30">No customer assigned</p>
              )}
            </div>

            {/* Project Info */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-4">
                <FileText size={16} className="text-[#C9A84C]" />
                Project Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow label="Project Name" value={estimate.project_name} />
                {estimate.project_address && (
                  <InfoRow label="Address" value={estimate.project_address} icon={<MapPin size={14} className="text-white/20" />} />
                )}
                <InfoRow label="Division" value={divCfg.label} />
                {estimate.estimate_type && (
                  <InfoRow label="Estimate Type" value={estimate.estimate_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                )}
                {estimate.contract_type && (
                  <InfoRow label="Contract Type" value={estimate.contract_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                )}
                <InfoRow label="Created" value={fmtDate(estimate.created_at)} />
              </div>
            </div>

            {/* Scope of Work */}
            {estimate.scope_of_work && (
              <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                <h3 className="text-[15px] font-semibold text-white mb-3">Scope of Work</h3>
                <div
                  className="prose prose-invert prose-sm max-w-none text-[14px] text-white/70 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: estimate.scope_of_work }}
                />
              </div>
            )}

            {/* Job-Site Photos — editable in place; each change PATCHes
                immediately so nothing is lost on navigation */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <h3 className="text-[17px] font-semibold text-white mb-3">Job-Site Photos</h3>
              <EstimatePhotos
                compact
                photos={estimate.photos || []}
                onChange={async (next) => {
                  setEstimate({ ...estimate, photos: next });
                  try {
                    await fetch(`/api/admin/estimates/${estimate.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ photos: next }),
                    });
                  } catch (e) {
                    console.error('Failed to save photos', e);
                  }
                }}
              />
            </div>

            {/* Quick Financial Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Subtotal', value: estimate.subtotal || subtotal, color: '#6b7280' },
                { label: 'Markup & OH', value: (estimate.overhead_amount || 0) + (estimate.markup_amount || 0), color: '#D4772C' },
                { label: 'Tax', value: estimate.tax_amount || 0, color: '#3b8dd4' },
                { label: 'Total', value: estimate.total || 0, color: '#C9A84C' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#111] border border-white/5 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: stat.color }} />
                  <p className="text-[12px] text-white/30 mb-1">{stat.label}</p>
                  <p className="text-[20px] font-bold" style={{ color: stat.color }}>
                    {fmtShort(stat.value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Valid Until */}
            {estimate.valid_until && (
              <div className={`bg-[#111] border rounded-xl p-4 flex items-center gap-3 ${
                expired ? 'border-red-500/20' : 'border-white/5'
              }`}>
                <Calendar size={18} className={expired ? 'text-red-400' : 'text-white/30'} />
                <div>
                  <p className="text-[14px] font-medium text-white">
                    Valid until {fmtDate(estimate.valid_until)}
                  </p>
                  {expired && (
                    <p className="text-[13px] text-red-400 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={12} /> This estimate has expired
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LINE ITEMS TAB */}
        {activeTab === 'line-items' && (
          <div className="space-y-4">
            {estimate.line_items.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-white/30 font-medium">Sort by</span>
                {(['order', 'phase', 'category', 'cost'] as const).map(mode => (
                  <button key={mode} onClick={() => setLineItemSort(mode)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${lineItemSort === mode ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30' : 'text-white/30 border-white/5 hover:border-white/10 hover:text-white/50'}`}>
                    {mode === 'order' ? 'Construction Order' : mode === 'phase' ? 'Phase (A-Z)' : mode === 'category' ? 'Category' : 'Highest Cost'}
                  </button>
                ))}
              </div>
            )}
            {estimate.line_items.length === 0 ? (
              <EmptyState
                icon={<Receipt size={40} className="text-white/10" />}
                message="No line items yet"
                sub="Add line items using the estimate wizard"
              />
            ) : (
              <>
                {Object.entries(lineItemsByPhase).map(([phase, items]) => {
                  const phaseTotal = items.reduce((s, i) => s + (i.quantity * i.unit_cost * (1 + (i.markup_percent || 0) / 100)), 0);
                  return (
                    <div key={phase} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                        <h4 className="text-[14px] font-semibold text-[#C9A84C]">{phase}</h4>
                        <span className="text-[14px] font-semibold text-white/60">{fmt(phaseTotal)}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="text-white/30 text-left">
                              <th className="px-5 py-2.5 font-medium">Description</th>
                              <th className="px-3 py-2.5 font-medium">Category</th>
                              <th className="px-3 py-2.5 font-medium text-right">Qty</th>
                              <th className="px-3 py-2.5 font-medium">Unit</th>
                              <th className="px-3 py-2.5 font-medium text-right">Unit Cost</th>
                              <th className="px-3 py-2.5 font-medium text-right">Markup</th>
                              <th className="px-3 py-2.5 font-medium text-right pr-5">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => {
                              const lineTotal = item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100);
                              return (
                                <tr key={item.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                                  <td className="px-5 py-3 text-white/80 max-w-[200px]">
                                    <span className="block truncate">{item.description}</span>
                                  </td>
                                  <td className="px-3 py-3 text-white/40">
                                    {CATEGORY_LABELS[item.category] || item.category}
                                  </td>
                                  <td className="px-3 py-3 text-white/60 text-right">{item.quantity}</td>
                                  <td className="px-3 py-3 text-white/40">{item.unit}</td>
                                  <td className="px-3 py-3 text-white/60 text-right">{fmt(item.unit_cost)}</td>
                                  <td className="px-3 py-3 text-white/40 text-right">
                                    {item.markup_percent > 0 ? `${item.markup_percent}%` : '--'}
                                  </td>
                                  <td className="px-3 py-3 text-white font-medium text-right pr-5">
                                    {fmt(lineTotal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* Grand Subtotal */}
                <div className="bg-[#111] border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-white">Line Items Subtotal</span>
                  <span className="text-[18px] font-bold text-[#C9A84C]">{fmt(subtotal)}</span>
                </div>

                <EditInWizardButton step={4} estimateId={id} label="Edit Line Items" />
              </>
            )}
          </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'options' && (
          <div className="space-y-4">
            <p className="text-[15px] text-white/40 leading-relaxed">
              Customer-selectable options for this document — photos, price differences, live total
              on their link. Their picks lock in when they sign.
            </p>
            <OptionsBuilder estimateId={String(estimate.id)} />
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-5">
                <DollarSign size={16} className="text-[#C9A84C]" />
                Financial Breakdown
              </h3>
              <div className="space-y-3">
                <FinancialRow
                  label="Subtotal (Line Items)"
                  amount={estimate.subtotal || subtotal}
                />
                <FinancialRow
                  label={`+ Overhead (${estimate.overhead_percent || 0}%)`}
                  amount={estimate.overhead_amount || 0}
                  sub
                />
                <FinancialRow
                  label={`+ Markup (${estimate.markup_percent || 0}%)`}
                  amount={estimate.markup_amount || 0}
                  sub
                />
                <div className="border-t border-white/5 pt-3">
                  <FinancialRow
                    label="Subtotal After Markup"
                    amount={(estimate.subtotal || subtotal) + (estimate.overhead_amount || 0) + (estimate.markup_amount || 0)}
                  />
                </div>
                <FinancialRow
                  label={`+ Tax (${estimate.tax_percent || 0}%)`}
                  amount={estimate.tax_amount || 0}
                  sub
                />
                <FinancialRow
                  label="+ Permit Fees"
                  amount={estimate.permit_fees || 0}
                  sub
                />
                <FinancialRow
                  label={`+ Contingency (${estimate.contingency_percent || 0}%)`}
                  amount={estimate.contingency_amount || 0}
                  sub
                />
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[18px] font-bold text-[#C9A84C]">TOTAL</span>
                    <span className="text-[24px] font-bold text-[#C9A84C]">{fmt(estimate.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Margin Analysis */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-green-400" />
                Margin Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] text-white/30 mb-1">Effective Margin</p>
                  <p className="text-[22px] font-bold text-green-400">{effectiveMargin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[12px] text-white/30 mb-1">Gross Profit</p>
                  <p className="text-[22px] font-bold text-green-400">{fmt(profit)}</p>
                </div>
              </div>
            </div>

            <EditInWizardButton step={5} estimateId={id} label="Edit Financials" />
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {estimate.payment_schedule.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={40} className="text-white/10" />}
                message="No payment schedule set"
                sub="Add payment milestones using the estimate wizard"
              />
            ) : (
              <>
                <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5">
                    <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
                      <CreditCard size={16} className="text-[#C9A84C]" />
                      Payment Schedule
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-white/30 text-left">
                          <th className="px-5 py-2.5 font-medium">Milestone</th>
                          <th className="px-3 py-2.5 font-medium text-right">%</th>
                          <th className="px-3 py-2.5 font-medium text-right">Amount</th>
                          <th className="px-3 py-2.5 font-medium pr-5">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimate.payment_schedule.map((m) => (
                          <tr key={m.id} className="border-t border-white/5">
                            <td className="px-5 py-3 text-white/80 font-medium">{m.milestone}</td>
                            <td className="px-3 py-3 text-[#C9A84C] font-semibold text-right">{m.percent}%</td>
                            <td className="px-3 py-3 text-white font-medium text-right">{fmt(m.amount)}</td>
                            <td className="px-3 py-3 text-white/40 pr-5">{m.description || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={`px-5 py-3 border-t border-white/5 flex items-center justify-between ${
                    paymentTotal !== 100 ? 'bg-red-500/5' : 'bg-green-500/5'
                  }`}>
                    <span className="text-[14px] font-semibold text-white">Total</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-[14px] font-bold ${paymentTotal === 100 ? 'text-green-400' : 'text-red-400'}`}>
                        {paymentTotal}%
                        {paymentTotal !== 100 && (
                          <span className="ml-2 text-[12px] font-normal">
                            ({paymentTotal < 100 ? 'Under' : 'Over'} by {Math.abs(100 - paymentTotal)}%)
                          </span>
                        )}
                      </span>
                      <span className="text-[14px] font-bold text-white">
                        {fmt(estimate.payment_schedule.reduce((s, m) => s + m.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <EditInWizardButton step={6} estimateId={id} label="Edit Payment Schedule" />
              </>
            )}
          </div>
        )}

        {/* TERMS TAB */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            {/* Disclaimers */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-4">
                <Shield size={16} className="text-[#C9A84C]" />
                Disclaimers & Terms
              </h3>
              {selectedDisclaimers.length === 0 ? (
                <p className="text-[14px] text-white/30">No disclaimers selected</p>
              ) : (
                <div className="space-y-4">
                  {selectedDisclaimers.map((d) => (
                    <div key={d.id} className="border-l-2 border-[#C9A84C]/30 pl-4">
                      <h4 className="text-[14px] font-semibold text-white mb-1">{d.title}</h4>
                      <p className="text-[13px] text-white/50 leading-relaxed">{d.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exclusions */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
              <h3 className="text-[15px] font-semibold text-white mb-3">Exclusions</h3>
              {estimate.exclusions ? (
                <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap">{estimate.exclusions}</p>
              ) : (
                <p className="text-[14px] text-white/30">No exclusions specified</p>
              )}
            </div>

            <EditInWizardButton step={7} estimateId={id} label="Edit Terms & Disclaimers" />
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {estimate.status_history.length === 0 ? (
              <EmptyState
                icon={<History size={40} className="text-white/10" />}
                message="No status changes recorded"
                sub="Status transitions will appear here"
              />
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-5">
                  <History size={16} className="text-[#C9A84C]" />
                  Status History
                </h3>
                <div className="space-y-0">
                  {estimate.status_history.map((entry, idx) => {
                    const fromCfg = entry.from_status ? STATUS_CONFIG[entry.from_status] : null;
                    const toCfg = STATUS_CONFIG[entry.to_status] || STATUS_CONFIG.draft;
                    const isLast = idx === estimate.status_history.length - 1;

                    return (
                      <div key={entry.id} className="flex gap-4">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full border-2 ${toCfg.border} ${toCfg.bg} flex-shrink-0`} />
                          {!isLast && <div className="w-px h-full bg-white/10 min-h-[40px]" />}
                        </div>
                        {/* Content */}
                        <div className="pb-5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {fromCfg && (
                              <>
                                <span className={`text-[12px] font-medium ${fromCfg.text}`}>
                                  {fromCfg.label}
                                </span>
                                <ChevronRight size={12} className="text-white/20" />
                              </>
                            )}
                            <span className={`text-[13px] font-semibold ${toCfg.text}`}>
                              {toCfg.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-white/30">
                            {fmtDateTime(entry.created_at)}
                            {entry.changed_by && <span className="ml-2">by {entry.changed_by}</span>}
                          </p>
                          {entry.notes && (
                            <p className="text-[13px] text-white/50 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Client Signature */}
            {estimate.client_signature && (
              <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                <h3 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} className="text-green-400" />
                  Client Signature
                </h3>
                <div className="bg-white/5 rounded-lg p-4 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={estimate.client_signature}
                    alt="Client signature"
                    className="max-h-[100px] w-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SEND MODAL ───────────────────────────────────────── */}
      {showSendModal && (
        <ModalBackdrop onClose={() => { setShowSendModal(false); setShareLink(null); setLinkCopied(false); }}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-white flex items-center gap-2">
                <Send size={18} className="text-[#C9A84C]" />
                {shareLink ? 'Estimate Sent!' : 'Send Estimate'}
              </h3>
              <button onClick={() => { setShowSendModal(false); setShareLink(null); setLinkCopied(false); }} className="text-white/30 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {shareLink ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                  <p className="text-[14px] text-green-400">
                    Estimate sent to <span className="font-semibold text-green-300">{sendTo}</span>!
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5 flex items-center gap-1.5">
                    <ExternalLink size={12} />
                    Copy link to send via text
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white/70 focus:outline-none truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="px-4 py-2.5 text-[13px] font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5"
                      style={{
                        background: linkCopied ? 'rgba(34,197,94,0.2)' : 'rgba(201,168,76,0.15)',
                        border: linkCopied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(201,168,76,0.3)',
                        color: linkCopied ? '#4ade80' : '#C9A84C',
                      }}
                    >
                      {linkCopied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setShowSendModal(false); setShareLink(null); setLinkCopied(false); }}
                  className="w-full px-4 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] text-white/40 mb-1.5">To Email</label>
                    <input
                      type="email"
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      placeholder="customer@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] text-white/40 mb-1.5">From Account</label>
                    <select
                      value={sendFrom}
                      onChange={(e) => setSendFrom(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none cursor-pointer"
                    >
                      {emailAccounts.map((acc) => (
                        <option key={acc.id} value={acc.email}>
                          {acc.display_name} ({acc.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] text-white/40 mb-1.5">Message (optional)</label>
                    <textarea
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 px-4 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!sendTo || sending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-black rounded-lg disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}
                  >
                    {sending ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={14} /> Send Estimate</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalBackdrop>
      )}

      {/* ─── DELETE MODAL ──────────────────────────────────────── */}
      {showDeleteModal && (
        <ModalBackdrop onClose={() => setShowDeleteModal(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h3 className="text-[17px] font-bold text-white mb-1">Delete Estimate?</h3>
              <p className="text-[14px] text-white/40">
                This will permanently delete <span className="text-white/70 font-medium">{estimate.estimate_number}</span> and all related data. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {deleting ? (
                  <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 size={14} /> Delete</>
                )}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* ─── DUPLICATE MODAL ───────────────────────────────────── */}
      {showDuplicateModal && (
        <ModalBackdrop onClose={() => setShowDuplicateModal(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-3">
                <Copy size={22} className="text-[#C9A84C]" />
              </div>
              <h3 className="text-[17px] font-bold text-white mb-1">Duplicate Estimate?</h3>
              <p className="text-[14px] text-white/40">
                This will create a copy of <span className="text-white/70 font-medium">{estimate.estimate_number}</span> with a new estimate number and draft status. All line items, payment schedule, and terms will be copied.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-black rounded-lg disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}
              >
                {duplicating ? (
                  <><Loader2 size={16} className="animate-spin" /> Duplicating...</>
                ) : (
                  <><Copy size={14} /> Duplicate</>
                )}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* PDF Preview Modal */}
      {(pdfPreviewUrl || pdfLoading) && (
        <PdfPreviewModal
          pdfUrl={pdfPreviewUrl}
          loading={pdfLoading}
          onClose={() => { setPdfPreviewUrl(null); setPdfLoading(false); }}
          filename={estimate ? `${estimate.estimate_number}.pdf` : 'estimate.pdf'}
          estimateId={id}
        />
      )}
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────────────────── */

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-white/30 mb-0.5">{label}</p>
      <p className="text-[14px] text-white/70 flex items-center gap-1.5">
        {icon}
        {value || '--'}
      </p>
    </div>
  );
}

function FinancialRow({ label, amount, sub }: { label: string; amount: number; sub?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[14px] ${sub ? 'text-white/40 pl-4' : 'text-white/70 font-medium'}`}>
        {label}
      </span>
      <span className={`text-[14px] ${sub ? 'text-white/50' : 'text-white font-medium'}`}>
        {fmt(amount)}
      </span>
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub: string }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto mb-3">{icon}</div>
      <p className="text-[15px] text-white/30 mb-1">{message}</p>
      <p className="text-[13px] text-white/15">{sub}</p>
    </div>
  );
}

function EditInWizardButton({ step, estimateId, label }: { step: number; estimateId: string; label: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/admin/estimates/new?edit=${estimateId}&step=${step}`)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-medium text-[#C9A84C] bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-xl hover:bg-[#C9A84C]/10 transition-all"
    >
      <Edit3 size={14} />
      {label}
    </button>
  );
}
