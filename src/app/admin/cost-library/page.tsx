'use client';

import { useState, useEffect, useRef } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Search, X, Loader2, DollarSign, Package,
  Hammer, Truck, Users, Pencil, Trash2,
} from 'lucide-react';

interface CostItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  trade: string | null;
  unit: string;
  default_cost: number;
  default_markup_percent: number;
  vendor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Vendor {
  id: string;
  company_name: string;
}

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'material', label: 'Materials' },
  { key: 'labor', label: 'Labor' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'subcontractor', label: 'Subcontractor' },
] as const;

const CATEGORIES = [
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
];

const TRADES = [
  'Electrical', 'Plumbing', 'Framing', 'Concrete', 'Roofing',
  'Painting', 'Drywall', 'HVAC', 'Flooring', 'General',
];

const UNITS = [
  { value: 'each', label: 'Each' },
  { value: 'sqft', label: 'Sq Ft' },
  { value: 'lnft', label: 'Lin Ft' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'lot', label: 'Lot' },
  { value: 'cubic_yard', label: 'Cu Yd' },
];

function categoryBadge(category: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    material:      { bg: 'bg-[#3b8dd4]/10', text: 'text-[#3b8dd4]', label: 'Material' },
    labor:         { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]', label: 'Labor' },
    equipment:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Equipment' },
    subcontractor: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Subcontractor' },
  };
  const s = map[category] || map.material;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function tradeBadge(trade: string) {
  const colors = [
    { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    { bg: 'bg-pink-500/10', text: 'text-pink-400' },
    { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { bg: 'bg-lime-500/10', text: 'text-lime-400' },
    { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    { bg: 'bg-teal-500/10', text: 'text-teal-400' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
    { bg: 'bg-violet-500/10', text: 'text-violet-400' },
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

function categoryIcon(category: string) {
  switch (category) {
    case 'material': return <Package size={16} />;
    case 'labor': return <Users size={16} />;
    case 'equipment': return <Truck size={16} />;
    case 'subcontractor': return <Hammer size={16} />;
    default: return <Package size={16} />;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function unitLabel(unit: string) {
  const found = UNITS.find((u) => u.value === unit);
  return found ? found.label : unit;
}

export default function CostLibraryPage() {
  const [items, setItems] = useState<CostItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'material',
    trade: '',
    unit: 'each',
    default_cost: '',
    default_markup_percent: '',
    vendor_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'default_cost' | 'default_markup_percent' | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('category', activeTab);
      const qs = params.toString();
      const url = `/api/admin/cost-library${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      if (Array.isArray(data)) setVendors(data);
    } catch {
      setVendors([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  useEffect(() => {
    fetchVendors();
  }, []);

  // Focus inline edit input when activated
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId, editingField]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description?.toLowerCase().includes(q)) ||
      (item.trade?.toLowerCase().includes(q))
    );
  });

  const vendorMap = vendors.reduce<Record<string, string>>((acc, v) => {
    acc[v.id] = v.company_name;
    return acc;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/cost-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          trade: formData.trade || null,
          unit: formData.unit,
          default_cost: formData.default_cost ? parseFloat(formData.default_cost) : 0,
          default_markup_percent: formData.default_markup_percent ? parseFloat(formData.default_markup_percent) : 0,
          vendor_id: formData.vendor_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create cost item');
      setShowCreate(false);
      setFormData({
        name: '', description: '', category: 'material', trade: '',
        unit: 'each', default_cost: '', default_markup_percent: '', vendor_id: '',
      });
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to create cost item');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineEdit = (item: CostItem, field: 'default_cost' | 'default_markup_percent') => {
    setEditingId(item.id);
    setEditingField(field);
    setEditValue(String(item[field]));
  };

  const handleInlineSave = async () => {
    if (!editingId || !editingField) return;
    const numVal = parseFloat(editValue);
    if (isNaN(numVal) || numVal < 0) {
      setEditingId(null);
      setEditingField(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/cost-library/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingField]: numVal }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, [editingField!]: numVal } : item
          )
        );
      }
    } catch {
      // silent fail — revert by refetching
      fetchItems();
    } finally {
      setEditingId(null);
      setEditingField(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cost-library/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Cost Library" subtitle="Estimation Items" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <DollarSign size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${filtered.length} Item${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Materials, labor, equipment & subs</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-4">
          {CATEGORY_TABS.map((tab) => (
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

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search cost items..."
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
        </div>

        {/* Cost items list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-white/5 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30">No cost items found</p>
            <p className="text-[13px] text-white/15 mt-1">
              {search ? 'Try a different search term' : 'Add your first cost item to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-[#141414] transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.category === 'material' ? 'bg-[#3b8dd4]/10 text-[#3b8dd4]' :
                    item.category === 'labor' ? 'bg-[#D4772C]/10 text-[#D4772C]' :
                    item.category === 'equipment' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-violet-500/10 text-violet-400'
                  }`}>
                    {categoryIcon(item.category)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-white truncate mb-1">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {categoryBadge(item.category)}
                      {item.trade && tradeBadge(item.trade)}
                      <span className="text-[12px] text-white/20">/ {unitLabel(item.unit)}</span>
                      {item.vendor_id && vendorMap[item.vendor_id] && (
                        <span className="text-[12px] text-white/20 truncate max-w-[120px]">
                          {vendorMap[item.vendor_id]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost — inline editable */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {editingId === item.id && editingField === 'default_cost' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-white/30 text-[14px]">$</span>
                        <input
                          ref={editInputRef}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineSave();
                            if (e.key === 'Escape') { setEditingId(null); setEditingField(null); }
                          }}
                          onBlur={handleInlineSave}
                          className="w-24 bg-black/60 border border-[#C9A84C]/40 rounded-lg px-2 py-1 text-[14px] text-white text-right focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInlineEdit(item, 'default_cost')}
                        className="flex items-center gap-1 group/edit"
                        title="Click to edit cost"
                      >
                        <span className="text-[16px] font-bold text-white">{formatCurrency(item.default_cost)}</span>
                        <Pencil size={12} className="text-white/0 group-hover/edit:text-white/30 transition-colors" />
                      </button>
                    )}

                    {/* Markup — inline editable */}
                    {editingId === item.id && editingField === 'default_markup_percent' ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={editInputRef}
                          type="number"
                          step="0.1"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineSave();
                            if (e.key === 'Escape') { setEditingId(null); setEditingField(null); }
                          }}
                          onBlur={handleInlineSave}
                          className="w-16 bg-black/60 border border-[#C9A84C]/40 rounded-lg px-2 py-1 text-[14px] text-white text-right focus:outline-none"
                        />
                        <span className="text-white/30 text-[14px]">%</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInlineEdit(item, 'default_markup_percent')}
                        className="flex items-center gap-0.5 group/markup"
                        title="Click to edit markup"
                      >
                        <span className="text-[14px] text-white/40 min-w-[50px] text-right">
                          {Number(item.default_markup_percent).toFixed(1)}%
                        </span>
                        <Pencil size={10} className="text-white/0 group-hover/markup:text-white/30 transition-colors" />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-white/0 group-hover:text-white/20 hover:!text-red-400 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CREATE COST ITEM MODAL
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
                <h2 className="text-[17px] font-bold text-white">New Cost Item</h2>
                <p className="text-[13px] text-white/30">Add a material, labor, equipment, or sub cost</p>
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

              {/* Name */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 resize-none"
                />
              </div>

              {/* Category + Trade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Trade</label>
                  <select
                    value={formData.trade}
                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    <option value="">Select trade...</option>
                    {TRADES.map((t) => (
                      <option key={t} value={t.toLowerCase()}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit + Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Default Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_cost}
                    onChange={(e) => setFormData({ ...formData, default_cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              </div>

              {/* Markup + Vendor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Markup %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.default_markup_percent}
                    onChange={(e) => setFormData({ ...formData, default_markup_percent: e.target.value })}
                    placeholder="0.0"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Vendor</label>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                  >
                    <option value="">No vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.company_name}</option>
                    ))}
                  </select>
                </div>
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
                    <><Plus size={16} /> Add Cost Item</>
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
