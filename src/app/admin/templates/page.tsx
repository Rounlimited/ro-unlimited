'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Search, X, Loader2, FileText, Copy, Percent,
  ChevronDown, ChevronRight, Trash2, ToggleLeft, ToggleRight,
  Calendar, DollarSign, ClipboardList, AlertTriangle,
} from 'lucide-react';

/* ──────────────────────────────────────────── Types ── */

interface LineItem {
  phase: string;
  description: string;
  category: string;
  unit: string;
  default_cost: number;
}

interface PaymentMilestone {
  milestone: string;
  percent: number;
}

interface Disclaimer {
  id: string;
  title: string;
  body: string;
  category: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  division: string;
  estimate_type: string;
  contract_type: string;
  default_overhead_percent: number;
  default_markup_percent: number;
  default_tax_percent: number;
  default_contingency_percent: number;
  default_valid_days: number;
  line_items: LineItem[];
  payment_schedule: PaymentMilestone[];
  disclaimers: string[];
  exclusions: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/* ──────────────────────────────────────────── Constants ── */

const DIVISIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'grading', label: 'Grading' },
  { value: 'general', label: 'General' },
];

const ESTIMATE_TYPES = [
  { value: 'quick_quote', label: 'Quick Quote' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'detailed', label: 'Detailed' },
];

const CONTRACT_TYPES = [
  { value: 'fixed_price', label: 'Fixed Price' },
  { value: 'cost_plus', label: 'Cost Plus' },
  { value: 'time_materials', label: 'Time & Materials' },
  { value: 'unit_price', label: 'Unit Price' },
];

const LINE_ITEM_CATEGORIES = [
  'Labor', 'Material', 'Equipment', 'Subcontractor', 'Permit', 'Other',
];

const MODAL_SECTIONS = [
  { key: 'basic', label: 'Basic Info', icon: FileText },
  { key: 'percents', label: 'Percentages', icon: Percent },
  { key: 'lines', label: 'Line Items', icon: ClipboardList },
  { key: 'payments', label: 'Payment Schedule', icon: DollarSign },
  { key: 'disclaimers', label: 'Disclaimers', icon: AlertTriangle },
  { key: 'exclusions', label: 'Exclusions', icon: X },
] as const;

type SectionKey = typeof MODAL_SECTIONS[number]['key'];

/* ──────────────────────────────────────────── Helpers ── */

function divisionBadge(div: string) {
  const map: Record<string, { bg: string; text: string }> = {
    residential:  { bg: 'bg-[#3b8dd4]/10', text: 'text-[#3b8dd4]' },
    commercial:   { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]' },
    grading:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    general:      { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  };
  const s = map[div] || map.general;
  const label = DIVISIONS.find((d) => d.value === div)?.label || div;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${s.bg} ${s.text}`}>
      {label}
    </span>
  );
}

function typeBadge(t: string) {
  const map: Record<string, { bg: string; text: string }> = {
    quick_quote:  { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    preliminary:  { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    detailed:     { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  };
  const s = map[t] || { bg: 'bg-white/5', text: 'text-white/40' };
  const label = ESTIMATE_TYPES.find((e) => e.value === t)?.label || t;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${s.bg} ${s.text}`}>
      {label}
    </span>
  );
}

function contractLabel(c: string) {
  return CONTRACT_TYPES.find((ct) => ct.value === c)?.label || c;
}

const emptyForm = (): Omit<Template, 'id' | 'created_at' | 'updated_at' | 'created_by'> => ({
  name: '',
  description: '',
  division: 'general',
  estimate_type: 'detailed',
  contract_type: 'fixed_price',
  default_overhead_percent: 10,
  default_markup_percent: 15,
  default_tax_percent: 8,
  default_contingency_percent: 5,
  default_valid_days: 30,
  line_items: [],
  payment_schedule: [],
  disclaimers: [],
  exclusions: '',
  is_active: true,
});

/* ──────────────────────────────────────────── Component ── */

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('basic');
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Disclaimers from DB
  const [availableDisclaimers, setAvailableDisclaimers] = useState<Disclaimer[]>([]);

  /* ── Fetch templates ── */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('include_inactive', '1');
      if (divisionFilter !== 'all') params.set('division', divisionFilter);
      if (typeFilter !== 'all') params.set('estimate_type', typeFilter);
      const res = await fetch(`/api/admin/templates?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [divisionFilter, typeFilter]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  /* ── Fetch disclaimers for checklist ── */
  useEffect(() => {
    fetch('/api/admin/disclaimers')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAvailableDisclaimers(d); })
      .catch(() => {});
  }, []);

  /* ── Client-side search filter ── */
  const filtered = templates.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q))
    );
  });

  /* ── Open modal for create / edit ── */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveSection('basic');
    setError('');
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description || '',
      division: t.division,
      estimate_type: t.estimate_type,
      contract_type: t.contract_type,
      default_overhead_percent: t.default_overhead_percent,
      default_markup_percent: t.default_markup_percent,
      default_tax_percent: t.default_tax_percent,
      default_contingency_percent: t.default_contingency_percent,
      default_valid_days: t.default_valid_days,
      line_items: t.line_items || [],
      payment_schedule: t.payment_schedule || [],
      disclaimers: t.disclaimers || [],
      exclusions: t.exclusions || '',
      is_active: t.is_active,
    });
    setActiveSection('basic');
    setError('');
    setShowModal(true);
  };

  /* ── Save (create or update) ── */
  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Template name is required');
      setActiveSection('basic');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        division: form.division,
        estimate_type: form.estimate_type,
        contract_type: form.contract_type,
        default_overhead_percent: Number(form.default_overhead_percent),
        default_markup_percent: Number(form.default_markup_percent),
        default_tax_percent: Number(form.default_tax_percent),
        default_contingency_percent: Number(form.default_contingency_percent),
        default_valid_days: Number(form.default_valid_days),
        line_items: form.line_items,
        payment_schedule: form.payment_schedule,
        disclaimers: form.disclaimers,
        exclusions: form.exclusions || null,
        is_active: form.is_active,
      };

      const url = editingId
        ? `/api/admin/templates/${editingId}`
        : '/api/admin/templates';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template');

      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  /* ── Duplicate ── */
  const handleDuplicate = async (t: Template) => {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${t.name} (Copy)`,
          description: t.description,
          division: t.division,
          estimate_type: t.estimate_type,
          contract_type: t.contract_type,
          default_overhead_percent: t.default_overhead_percent,
          default_markup_percent: t.default_markup_percent,
          default_tax_percent: t.default_tax_percent,
          default_contingency_percent: t.default_contingency_percent,
          default_valid_days: t.default_valid_days,
          line_items: t.line_items,
          payment_schedule: t.payment_schedule,
          disclaimers: t.disclaimers,
          exclusions: t.exclusions,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to duplicate');
      fetchTemplates();
    } catch {
      // silent fail
    }
  };

  /* ── Toggle active ── */
  const handleToggleActive = async (t: Template) => {
    try {
      await fetch(`/api/admin/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !t.is_active }),
      });
      fetchTemplates();
    } catch {
      // silent fail
    }
  };

  /* ── Delete (soft) ── */
  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this template? It can be re-activated later.')) return;
    try {
      await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch {
      // silent fail
    }
  };

  /* ── Line item helpers ── */
  const addLineItem = () => {
    setForm({
      ...form,
      line_items: [
        ...form.line_items,
        { phase: '', description: '', category: 'Labor', unit: 'ea', default_cost: 0 },
      ],
    });
  };

  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const items = [...form.line_items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, line_items: items });
  };

  const removeLineItem = (idx: number) => {
    setForm({ ...form, line_items: form.line_items.filter((_, i) => i !== idx) });
  };

  /* ── Payment schedule helpers ── */
  const addMilestone = () => {
    setForm({
      ...form,
      payment_schedule: [
        ...form.payment_schedule,
        { milestone: '', percent: 0 },
      ],
    });
  };

  const updateMilestone = (idx: number, field: keyof PaymentMilestone, value: string | number) => {
    const items = [...form.payment_schedule];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, payment_schedule: items });
  };

  const removeMilestone = (idx: number) => {
    setForm({ ...form, payment_schedule: form.payment_schedule.filter((_, i) => i !== idx) });
  };

  /* ── Disclaimer toggle ── */
  const toggleDisclaimer = (id: string) => {
    const current = form.disclaimers || [];
    if (current.includes(id)) {
      setForm({ ...form, disclaimers: current.filter((d) => d !== id) });
    } else {
      setForm({ ...form, disclaimers: [...current, id] });
    }
  };

  /* ── Shared input class ── */
  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40';
  const labelCls = 'block text-[13px] text-white/40 mb-1.5';
  const selectCls = `${inputCls} appearance-none`;

  /* ──────────────────────────────────────────── Render ── */

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Templates" subtitle="Estimate Templates" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <FileText size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${filtered.length} Template${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Pre-built estimate configurations</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors"
          >
            <Plus size={14} /> Create Template
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Division filter */}
          <div className="relative">
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-[#111] border border-white/5 rounded-xl pl-3.5 pr-8 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/30 appearance-none"
            >
              <option value="all">All Divisions</option>
              {DIVISIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          </div>

          {/* Estimate type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#111] border border-white/5 rounded-xl pl-3.5 pr-8 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/30 appearance-none"
            >
              <option value="all">All Types</option>
              {ESTIMATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Template cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30">No templates found</p>
            <p className="text-[13px] text-white/15 mt-1">
              {search ? 'Try a different search' : 'Create your first estimate template'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`bg-[#111] border rounded-xl p-4 hover:border-white/15 hover:bg-[#141414] transition-all group relative ${
                  tmpl.is_active ? 'border-white/5' : 'border-red-500/15 opacity-60'
                }`}
              >
                {/* Inactive label */}
                {!tmpl.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Inactive
                  </div>
                )}

                {/* Clickable body */}
                <button
                  onClick={() => openEdit(tmpl)}
                  className="text-left w-full"
                >
                  <p className="text-[16px] font-bold text-white mb-1 truncate pr-16">{tmpl.name}</p>
                  {tmpl.description && (
                    <p className="text-[13px] text-white/30 mb-3 line-clamp-2">{tmpl.description}</p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {divisionBadge(tmpl.division)}
                    {typeBadge(tmpl.estimate_type)}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-white/30">
                      {contractLabel(tmpl.contract_type)}
                    </span>
                  </div>

                  {/* Percentage stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-[#C9A84C]">{tmpl.default_overhead_percent}%</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wide">OH</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-[#D4772C]">{tmpl.default_markup_percent}%</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wide">Markup</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-[#3b8dd4]">{tmpl.default_tax_percent}%</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wide">Tax</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-emerald-400">{tmpl.default_contingency_percent}%</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wide">Conting.</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <span className="text-[12px] text-white/20 flex items-center gap-1">
                      <Calendar size={11} /> {tmpl.default_valid_days}d valid
                    </span>
                    {tmpl.line_items?.length > 0 && (
                      <span className="text-[12px] text-white/20">
                        {tmpl.line_items.length} line item{tmpl.line_items.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {tmpl.payment_schedule?.length > 0 && (
                      <span className="text-[12px] text-white/20">
                        {tmpl.payment_schedule.length} milestone{tmpl.payment_schedule.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleDuplicate(tmpl)}
                    title="Duplicate"
                    className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(tmpl)}
                    title={tmpl.is_active ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
                  >
                    {tmpl.is_active ? <ToggleRight size={14} className="text-emerald-400" /> : <ToggleLeft size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    title="Delete"
                    className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-colors ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          {/* Modal */}
          <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[17px] font-bold text-white">
                  {editingId ? 'Edit Template' : 'New Estimate Template'}
                </h2>
                <p className="text-[13px] text-white/30">
                  {editingId ? 'Update template configuration' : 'Create a reusable estimate template'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Section tabs */}
            <div className="border-b border-white/5 px-6 flex gap-1 overflow-x-auto flex-shrink-0">
              {MODAL_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.key}
                    onClick={() => setActiveSection(sec.key)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeSection === sec.key
                        ? 'border-[#C9A84C] text-[#C9A84C]'
                        : 'border-transparent text-white/30 hover:text-white/50'
                    }`}
                  >
                    <Icon size={14} />
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[14px] text-red-400">
                  {error}
                </div>
              )}

              {/* ── BASIC INFO ── */}
              {activeSection === 'basic' && (
                <>
                  <div>
                    <label className={labelCls}>Template Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Division</label>
                      <select
                        value={form.division}
                        onChange={(e) => setForm({ ...form, division: e.target.value })}
                        className={selectCls}
                      >
                        {DIVISIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Estimate Type</label>
                      <select
                        value={form.estimate_type}
                        onChange={(e) => setForm({ ...form, estimate_type: e.target.value })}
                        className={selectCls}
                      >
                        {ESTIMATE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Contract Type</label>
                      <select
                        value={form.contract_type}
                        onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
                        className={selectCls}
                      >
                        {CONTRACT_TYPES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active toggle (edit only) */}
                  {editingId && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[14px] text-white/60">Active</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_active: !form.is_active })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          form.is_active ? 'bg-[#C9A84C]' : 'bg-white/10'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          form.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── PERCENTAGES ── */}
              {activeSection === 'percents' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Overhead %</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={form.default_overhead_percent}
                        onChange={(e) => setForm({ ...form, default_overhead_percent: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Markup %</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={form.default_markup_percent}
                        onChange={(e) => setForm({ ...form, default_markup_percent: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Tax %</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="100"
                        value={form.default_tax_percent}
                        onChange={(e) => setForm({ ...form, default_tax_percent: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Contingency %</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={form.default_contingency_percent}
                        onChange={(e) => setForm({ ...form, default_contingency_percent: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Valid Days</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={form.default_valid_days}
                      onChange={(e) => setForm({ ...form, default_valid_days: parseInt(e.target.value) || 30 })}
                      className={`${inputCls} max-w-[200px]`}
                    />
                    <p className="text-[12px] text-white/20 mt-1">Number of days the estimate is valid after creation</p>
                  </div>
                </>
              )}

              {/* ── LINE ITEMS ── */}
              {activeSection === 'lines' && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] text-white/50">
                      {form.line_items.length} line item{form.line_items.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={addLineItem}
                      className="flex items-center gap-1.5 text-[13px] text-[#C9A84C] hover:text-[#d4b55a] transition-colors"
                    >
                      <Plus size={14} /> Add Line Item
                    </button>
                  </div>

                  {form.line_items.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                      <ClipboardList size={28} className="mx-auto text-white/10 mb-2" />
                      <p className="text-[13px] text-white/20">No line items yet</p>
                      <button
                        onClick={addLineItem}
                        className="mt-2 text-[13px] text-[#C9A84C] hover:underline"
                      >
                        Add your first line item
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {form.line_items.map((item, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-white/20 font-medium">Item #{idx + 1}</span>
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="text-white/15 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-white/25 mb-1">Phase</label>
                            <input
                              type="text"
                              value={item.phase}
                              onChange={(e) => updateLineItem(idx, 'phase', e.target.value)}
                              placeholder="e.g. Foundation"
                              className={`${inputCls} !py-2 !text-[13px]`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/25 mb-1">Category</label>
                            <select
                              value={item.category}
                              onChange={(e) => updateLineItem(idx, 'category', e.target.value)}
                              className={`${selectCls} !py-2 !text-[13px]`}
                            >
                              {LINE_ITEM_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/25 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                            placeholder="Line item description"
                            className={`${inputCls} !py-2 !text-[13px]`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-white/25 mb-1">Unit</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                              placeholder="ea, sqft, lf..."
                              className={`${inputCls} !py-2 !text-[13px]`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/25 mb-1">Default Cost ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.default_cost}
                              onChange={(e) => updateLineItem(idx, 'default_cost', parseFloat(e.target.value) || 0)}
                              className={`${inputCls} !py-2 !text-[13px]`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── PAYMENT SCHEDULE ── */}
              {activeSection === 'payments' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] text-white/50">
                        {form.payment_schedule.length} milestone{form.payment_schedule.length !== 1 ? 's' : ''}
                      </p>
                      {form.payment_schedule.length > 0 && (
                        <p className="text-[12px] text-white/20">
                          Total: {form.payment_schedule.reduce((s, m) => s + (Number(m.percent) || 0), 0)}%
                          {form.payment_schedule.reduce((s, m) => s + (Number(m.percent) || 0), 0) !== 100 && (
                            <span className="text-amber-400 ml-1">(should equal 100%)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={addMilestone}
                      className="flex items-center gap-1.5 text-[13px] text-[#C9A84C] hover:text-[#d4b55a] transition-colors"
                    >
                      <Plus size={14} /> Add Milestone
                    </button>
                  </div>

                  {form.payment_schedule.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                      <DollarSign size={28} className="mx-auto text-white/10 mb-2" />
                      <p className="text-[13px] text-white/20">No payment milestones defined</p>
                      <button
                        onClick={addMilestone}
                        className="mt-2 text-[13px] text-[#C9A84C] hover:underline"
                      >
                        Add your first milestone
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {form.payment_schedule.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-xl px-3 py-2.5">
                        <span className="text-[12px] text-white/20 w-6 text-center flex-shrink-0">{idx + 1}.</span>
                        <input
                          type="text"
                          value={m.milestone}
                          onChange={(e) => updateMilestone(idx, 'milestone', e.target.value)}
                          placeholder="e.g. Upon signing, Foundation complete..."
                          className="flex-1 bg-transparent border-none text-[14px] text-white placeholder:text-white/15 focus:outline-none"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            step="5"
                            min="0"
                            max="100"
                            value={m.percent}
                            onChange={(e) => updateMilestone(idx, 'percent', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[13px] text-white text-right focus:outline-none focus:border-[#C9A84C]/40"
                          />
                          <span className="text-[13px] text-white/30">%</span>
                        </div>
                        <button
                          onClick={() => removeMilestone(idx)}
                          className="text-white/15 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── DISCLAIMERS ── */}
              {activeSection === 'disclaimers' && (
                <>
                  <p className="text-[14px] text-white/50 mb-2">
                    Select disclaimers to auto-include with estimates using this template.
                  </p>
                  {availableDisclaimers.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                      <AlertTriangle size={28} className="mx-auto text-white/10 mb-2" />
                      <p className="text-[13px] text-white/20">No disclaimers found</p>
                      <p className="text-[12px] text-white/10 mt-1">Create disclaimers in the system first</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableDisclaimers.map((d) => {
                        const checked = (form.disclaimers || []).includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDisclaimer(d.id)}
                            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                              checked
                                ? 'bg-[#C9A84C]/5 border-[#C9A84C]/20'
                                : 'bg-black/20 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              checked ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-white/20'
                            }`}>
                              {checked && (
                                <svg viewBox="0 0 12 12" className="w-3 h-3 text-black">
                                  <path d="M2.5 6l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-white">{d.title}</p>
                              <p className="text-[12px] text-white/25 mt-0.5 line-clamp-2">{d.body}</p>
                              <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] text-white/20 bg-white/5">
                                {d.category}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── EXCLUSIONS ── */}
              {activeSection === 'exclusions' && (
                <>
                  <div>
                    <label className={labelCls}>Default Exclusion Text</label>
                    <textarea
                      value={form.exclusions || ''}
                      onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                      rows={10}
                      placeholder="Enter default exclusions for estimates using this template...&#10;&#10;e.g.&#10;- Permits and inspections&#10;- Utility connections&#10;- Unforeseen site conditions"
                      className={`${inputCls} resize-none`}
                    />
                    <p className="text-[12px] text-white/20 mt-1">This text will be pre-filled when creating an estimate from this template</p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-[14px] text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#C9A84C] text-black text-[14px] font-bold rounded-xl hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <>{editingId ? 'Update Template' : 'Create Template'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
