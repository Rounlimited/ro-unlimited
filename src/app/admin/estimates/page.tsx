'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Search, FileText, X, ChevronRight, DollarSign,
  Clock, AlertTriangle, Send, Eye, CheckCircle2, XCircle,
  Home, Building2, Mountain, Filter, Trash2, Loader2, ArrowUpDown,
} from 'lucide-react';
import { useDeviceContext } from '@/components/animations/useMediaQuery';

interface Estimate {
  id: string;
  estimate_number: string;
  customer_id: string;
  project_name: string;
  division: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  total: number;
  valid_until: string | null;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  } | null;
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
  { id: 'expired', label: 'Expired' },
] as const;

const DIVISION_OPTIONS = [
  { value: 'all', label: 'All Divisions' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'grading', label: 'Grading' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'septic', label: 'Septic' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  draft:    { bg: 'bg-white/5',       text: 'text-white/40',    border: 'border-white/10',   label: 'Draft' },
  sent:     { bg: 'bg-blue-500/10',   text: 'text-blue-400',    border: 'border-blue-500/20', label: 'Sent' },
  viewed:   { bg: 'bg-amber-500/10',  text: 'text-amber-400',   border: 'border-amber-500/20', label: 'Viewed' },
  accepted: { bg: 'bg-green-500/10',  text: 'text-green-400',   border: 'border-green-500/20', label: 'Accepted' },
  declined: { bg: 'bg-red-500/10',    text: 'text-red-400',     border: 'border-red-500/20', label: 'Declined' },
  expired:  { bg: 'bg-white/5',       text: 'text-white/30',    border: 'border-white/10',   label: 'Expired' },
};

const DIVISION_CONFIG: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  residential: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    label: 'Residential', icon: Home },
  commercial:  { bg: 'bg-[#D4772C]/10',   text: 'text-[#D4772C]',   label: 'Commercial',  icon: Building2 },
  grading:     { bg: 'bg-green-500/10',    text: 'text-green-400',   label: 'Grading',     icon: Mountain },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isExpired(validUntil: string | null, status: string): boolean {
  if (!validUntil) return false;
  if (status === 'accepted' || status === 'declined') return false;
  return new Date(validUntil) < new Date();
}

export default function EstimatesPage() {
  const router = useRouter();
  const { isDesktop } = useDeviceContext();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Estimate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'total' | 'estimate_number' | 'project_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/estimates/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEstimates(prev => prev.filter(e => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {}
    setDeleting(false);
  };

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (divisionFilter !== 'all') params.set('division', divisionFilter);
      if (search) params.set('search', search);

      const url = `/api/admin/estimates${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setEstimates(data);
    } catch {
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [activeTab, divisionFilter]);

  // Client-side search filtering
  const filtered = useMemo(() => {
    if (!search) return estimates;
    const q = search.toLowerCase();
    return estimates.filter((e) => {
      const customerName = e.customer
        ? `${e.customer.first_name} ${e.customer.last_name}`.toLowerCase()
        : '';
      const companyName = e.customer?.company_name?.toLowerCase() || '';
      return (
        e.estimate_number.toLowerCase().includes(q) ||
        e.project_name.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        companyName.includes(q)
      );
    });
  }, [estimates, search]);

  // Compute stats from all estimates (not filtered)
  const stats = useMemo(() => {
    const all = estimates;
    const drafts = all.filter((e) => e.status === 'draft');
    const pending = all.filter((e) => e.status === 'sent' || e.status === 'viewed');
    const accepted = all.filter((e) => e.status === 'accepted');
    const sum = (arr: Estimate[]) => arr.reduce((s, e) => s + (e.total || 0), 0);
    return {
      total:        { count: all.length,      value: sum(all) },
      drafts:       { count: drafts.length,   value: sum(drafts) },
      pending:      { count: pending.length,  value: sum(pending) },
      accepted:     { count: accepted.length, value: sum(accepted) },
    };
  }, [estimates]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: estimates.length };
    for (const e of estimates) {
      counts[e.status] = (counts[e.status] || 0) + 1;
    }
    return counts;
  }, [estimates]);

  // Sorted list for desktop table
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'total': cmp = (a.total || 0) - (b.total || 0); break;
        case 'estimate_number': cmp = a.estimate_number.localeCompare(b.estimate_number); break;
        case 'project_name': cmp = a.project_name.localeCompare(b.project_name); break;
        default: cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white pb-32">
      <AdminHeader title="Estimates" subtitle="Estimation System" backHref="/admin" />

      <div className="max-w-4xl lg:max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <FileText size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${filtered.length} Estimate${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Create and manage estimates</p>
            </div>
          </div>
          <Link
            href="/admin/estimates/new"
            className="flex items-center gap-2 px-4 py-2.5 text-black text-[13px] font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
              boxShadow: '0 0 16px rgba(201,168,76,0.3)',
            }}
          >
            <Plus size={14} /> New Estimate
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Estimates', count: stats.total.count, value: stats.total.value, color: '#C9A84C' },
            { label: 'Drafts', count: stats.drafts.count, value: stats.drafts.value, color: '#6b7280' },
            { label: 'Sent / Pending', count: stats.pending.count, value: stats.pending.value, color: '#3b8dd4' },
            { label: 'Accepted', count: stats.accepted.count, value: stats.accepted.value, color: '#22c55e' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111] border border-white/5 rounded-xl p-4 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: stat.color }}
              />
              <p className="text-[12px] text-white/30 mb-1 font-medium">{stat.label}</p>
              <p className="text-[22px] font-bold text-white leading-tight">
                {loading ? '--' : stat.count}
              </p>
              <p className="text-[13px] font-medium mt-0.5" style={{ color: stat.color }}>
                {loading ? '--' : formatCurrency(stat.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-4 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tabCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {tab.label}
                {!loading && count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/20'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Division filter */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search by estimate #, project, or customer..."
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
          <div className="relative flex-shrink-0">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-[#111] border border-white/5 rounded-xl pl-9 pr-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/30 transition-colors appearance-none cursor-pointer min-w-[140px]"
            >
              {DIVISION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estimate list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-5 bg-white/5 rounded w-24" />
                    <div className="h-4 bg-white/5 rounded-full w-16" />
                  </div>
                  <div className="h-6 bg-white/5 rounded w-20" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30 mb-1">
              {search || activeTab !== 'all' || divisionFilter !== 'all'
                ? 'No estimates match your filters'
                : 'No estimates yet'}
            </p>
            <p className="text-[13px] text-white/15 mb-5">
              {search || activeTab !== 'all' || divisionFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first estimate to get started'}
            </p>
            {!search && activeTab === 'all' && divisionFilter === 'all' && (
              <Link
                href="/admin/estimates/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-black text-[13px] font-bold rounded-xl hover:opacity-90 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
                  boxShadow: '0 0 16px rgba(201,168,76,0.3)',
                }}
              >
                <Plus size={14} /> Create First Estimate
              </Link>
            )}
          </div>
        ) : isDesktop ? (
          /* ── Desktop Table View ── */
          <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[12px] text-white/30 uppercase tracking-wider">
                  {([
                    { key: 'estimate_number' as const, label: 'Estimate #', w: 'w-36' },
                    { key: 'project_name' as const, label: 'Project', w: '' },
                    { key: null, label: 'Customer', w: '' },
                    { key: null, label: 'Division', w: 'w-28' },
                    { key: null, label: 'Status', w: 'w-28' },
                    { key: 'total' as const, label: 'Total', w: 'w-32' },
                    { key: 'created_at' as const, label: 'Date', w: 'w-28' },
                    { key: null, label: '', w: 'w-20' },
                  ]).map((col, i) => (
                    <th key={i} className={`px-4 py-3 font-semibold ${col.w}`}>
                      {col.key ? (
                        <button onClick={() => toggleSort(col.key!)} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                          {col.label}
                          <ArrowUpDown size={11} className={sortBy === col.key ? 'text-[#C9A84C]' : 'opacity-30'} />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(estimate => {
                  const statusCfg = STATUS_CONFIG[estimate.status] || STATUS_CONFIG.draft;
                  const divCfg = DIVISION_CONFIG[estimate.division] || DIVISION_CONFIG.residential;
                  const DivIcon = divCfg.icon;
                  const customerName = estimate.customer ? `${estimate.customer.first_name} ${estimate.customer.last_name}` : 'No Customer';
                  const href = estimate.status === 'draft' ? `/admin/estimates/new?edit=${estimate.id}` : `/admin/estimates/${estimate.id}`;
                  return (
                    <tr key={estimate.id} onClick={() => router.push(href)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group">
                      <td className="px-4 py-3.5 text-[14px] font-bold text-[#C9A84C]">{estimate.estimate_number}</td>
                      <td className="px-4 py-3.5 text-[14px] text-white/80 font-medium truncate max-w-[200px]">{estimate.project_name}</td>
                      <td className="px-4 py-3.5 text-[13px] text-white/40">{customerName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${divCfg.bg} ${divCfg.text}`}>
                          <DivIcon size={10} /> {divCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[15px] font-bold text-white tabular-nums">{formatCurrency(estimate.total || 0)}</td>
                      <td className="px-4 py-3.5 text-[12px] text-white/25">{formatDate(estimate.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(estimate); }}
                          className="p-2 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Mobile Card View ── */
          <div className="space-y-2">
            {filtered.map((estimate) => {
              const statusCfg = STATUS_CONFIG[estimate.status] || STATUS_CONFIG.draft;
              const divCfg = DIVISION_CONFIG[estimate.division] || DIVISION_CONFIG.residential;
              const DivIcon = divCfg.icon;
              const customerName = estimate.customer
                ? `${estimate.customer.first_name} ${estimate.customer.last_name}`
                : 'No Customer';
              const companyName = estimate.customer?.company_name;
              const expired = isExpired(estimate.valid_until, estimate.status);

              return (
                <div key={estimate.id} className="relative group">
                <Link
                  href={estimate.status === 'draft' ? `/admin/estimates/new?edit=${estimate.id}` : `/admin/estimates/${estimate.id}`}
                  className="block bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-[#141414] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[16px] font-bold text-[#C9A84C]">{estimate.estimate_number}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>{statusCfg.label}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${divCfg.bg} ${divCfg.text}`}><DivIcon size={10} />{divCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[18px] font-bold text-white">{formatCurrency(estimate.total || 0)}</span>
                      <ChevronRight size={16} className="text-white/10 group-hover:text-white/30 transition-colors" />
                    </div>
                  </div>
                  <p className="text-[15px] font-medium text-white/80 mb-1 truncate">{estimate.project_name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-[13px] text-white/30">{customerName}{companyName && <span className="text-white/15"> &mdash; {companyName}</span>}</span>
                    <span className="flex items-center gap-1 text-[12px] text-white/20"><Clock size={11} />{formatDate(estimate.created_at)}</span>
                    {estimate.valid_until && (
                      <span className={`flex items-center gap-1 text-[12px] ${expired ? 'text-red-400' : 'text-white/20'}`}>
                        {expired ? <AlertTriangle size={11} /> : <Clock size={11} />}{expired ? 'Expired ' : 'Valid until '}{formatDate(estimate.valid_until)}
                      </span>
                    )}
                  </div>
                </Link>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(estimate); }}
                  className="absolute top-3 right-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-colors z-10"
                  title="Delete estimate"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={22} className="text-red-400" />
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-2">Delete Estimate?</h3>
                <p className="text-[14px] text-white/50 mb-1">
                  <span className="text-[#C9A84C] font-semibold">{deleteTarget.estimate_number}</span>
                </p>
                <p className="text-[13px] text-white/30">
                  {deleteTarget.project_name}
                </p>
                <p className="text-[13px] text-red-400/70 mt-3">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex border-t border-white/10">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-3.5 text-[14px] text-white/60 font-medium hover:bg-white/5 transition-colors rounded-bl-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3.5 text-[14px] text-red-400 font-semibold hover:bg-red-500/10 transition-colors border-l border-white/10 rounded-br-2xl flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
