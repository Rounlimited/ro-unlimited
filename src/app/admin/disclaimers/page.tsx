'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Star, Loader2, X, ChevronDown, ChevronUp,
  FileText, GripVertical, Shield,
} from 'lucide-react';

interface Disclaimer {
  id: string;
  title: string;
  body: string;
  category: string;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'payment', label: 'Payment' },
  { key: 'warranty', label: 'Warranty' },
  { key: 'liability', label: 'Liability' },
  { key: 'sc_specific', label: 'SC Specific' },
] as const;

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'payment', label: 'Payment' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'liability', label: 'Liability' },
  { value: 'sc_specific', label: 'SC Specific' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  general:     { bg: 'bg-[#3b8dd4]/10', text: 'text-[#3b8dd4]', label: 'General' },
  payment:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Payment' },
  warranty:    { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]', label: 'Warranty' },
  liability:   { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Liability' },
  sc_specific: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'SC Specific' },
};

function categoryBadge(category: string) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export default function DisclaimersPage() {
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'general',
    is_default: false,
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Edit state for expanded card
  const [editData, setEditData] = useState<Partial<Disclaimer> | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Toggle default saving state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchDisclaimers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('category', activeTab);
      const qs = params.toString();
      const url = `/api/admin/disclaimers${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setDisclaimers(data);
    } catch {
      setDisclaimers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisclaimers();
  }, [activeTab]);

  const toggleDefault = async (d: Disclaimer) => {
    setTogglingId(d.id);
    try {
      const res = await fetch('/api/admin/disclaimers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id, is_default: !d.is_default }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setDisclaimers((prev) =>
        prev.map((item) =>
          item.id === d.id ? { ...item, is_default: !d.is_default } : item
        )
      );
    } catch {
      // silently fail
    } finally {
      setTogglingId(null);
    }
  };

  const handleExpand = (d: Disclaimer) => {
    if (expandedId === d.id) {
      setExpandedId(null);
      setEditData(null);
      setEditError('');
    } else {
      setExpandedId(d.id);
      setEditData({
        title: d.title,
        body: d.body,
        category: d.category,
        is_default: d.is_default,
        sort_order: d.sort_order,
      });
      setEditError('');
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editData) return;
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/admin/disclaimers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setDisclaimers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      setExpandedId(null);
      setEditData(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      setError('Title and body are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/disclaimers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          category: formData.category,
          is_default: formData.is_default,
          sort_order: formData.sort_order,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create disclaimer');
      setShowCreate(false);
      setFormData({ title: '', body: '', category: 'general', is_default: false, sort_order: 0 });
      fetchDisclaimers();
    } catch (err: any) {
      setError(err.message || 'Failed to create disclaimer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Disclaimers" subtitle="Estimate Disclaimers" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                {loading ? '...' : `${disclaimers.length} Disclaimer${disclaimers.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[13px] text-white/30">Auto-included & optional terms</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors"
          >
            <Plus size={14} /> Add Disclaimer
          </button>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/5 rounded-xl p-1 mb-5 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-[14px] font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Disclaimer list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : disclaimers.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-[15px] text-white/30">No disclaimers found</p>
            <p className="text-[13px] text-white/15 mt-1">Add your first disclaimer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {disclaimers.map((d) => {
              const isExpanded = expandedId === d.id;
              return (
                <div
                  key={d.id}
                  className="bg-[#111] border border-white/5 rounded-xl hover:border-white/10 transition-all"
                >
                  {/* Card header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => handleExpand(d)}
                  >
                    {/* Sort order indicator */}
                    <div className="flex items-center gap-1 text-white/15 flex-shrink-0">
                      <GripVertical size={14} />
                      <span className="text-[12px] font-mono w-5 text-center">{d.sort_order}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[15px] font-bold text-white truncate">{d.title}</p>
                        {d.is_default && (
                          <Star size={14} className="text-[#C9A84C] fill-[#C9A84C] flex-shrink-0" />
                        )}
                        {d.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#C9A84C]/10 text-[#C9A84C] flex-shrink-0">
                            Auto-included
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {categoryBadge(d.category)}
                      </div>
                      {!isExpanded && (
                        <p className="text-[14px] text-white/40 line-clamp-2">{d.body}</p>
                      )}
                    </div>

                    {/* Default toggle + expand arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDefault(d);
                        }}
                        disabled={togglingId === d.id}
                        className={`p-2 rounded-lg transition-all ${
                          d.is_default
                            ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                            : 'bg-white/5 text-white/20 hover:text-white/40'
                        }`}
                        title={d.is_default ? 'Remove from auto-include' : 'Set as auto-included'}
                      >
                        {togglingId === d.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Star size={16} className={d.is_default ? 'fill-[#C9A84C]' : ''} />
                        )}
                      </button>
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-white/30" />
                      ) : (
                        <ChevronDown size={18} className="text-white/15" />
                      )}
                    </div>
                  </div>

                  {/* Expanded edit area */}
                  {isExpanded && editData && (
                    <div className="border-t border-white/5 px-4 py-4 space-y-4">
                      {editError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[14px] text-red-400">
                          {editError}
                        </div>
                      )}

                      {/* Title */}
                      <div>
                        <label className="block text-[13px] text-white/40 mb-1.5">Title</label>
                        <input
                          type="text"
                          value={editData.title || ''}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                        />
                      </div>

                      {/* Body */}
                      <div>
                        <label className="block text-[13px] text-white/40 mb-1.5">Body</label>
                        <textarea
                          value={editData.body || ''}
                          onChange={(e) => setEditData({ ...editData, body: e.target.value })}
                          rows={5}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 resize-none"
                        />
                      </div>

                      {/* Category + Sort Order */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[13px] text-white/40 mb-1.5">Category</label>
                          <select
                            value={editData.category || 'general'}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-white/40 mb-1.5">Sort Order</label>
                          <input
                            type="number"
                            value={editData.sort_order ?? 0}
                            onChange={(e) => setEditData({ ...editData, sort_order: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                          />
                        </div>
                      </div>

                      {/* Default toggle */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-[#C9A84C]" />
                          <span className="text-[14px] text-white/60">Auto-include in estimates</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, is_default: !editData.is_default })}
                          className={`w-11 h-6 rounded-full transition-colors relative ${
                            editData.is_default ? 'bg-[#C9A84C]' : 'bg-white/10'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            editData.is_default ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleEditSave(d.id)}
                          disabled={editSaving}
                          className="flex-1 py-2.5 bg-[#C9A84C] text-black text-[14px] font-bold rounded-xl hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {editSaving ? (
                            <><Loader2 size={14} className="animate-spin" /> Saving...</>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setExpandedId(null);
                            setEditData(null);
                            setEditError('');
                          }}
                          className="px-4 py-2.5 bg-white/5 text-white/40 text-[14px] font-medium rounded-xl hover:bg-white/10 hover:text-white/60 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CREATE DISCLAIMER MODAL
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
                <h2 className="text-[17px] font-bold text-white">New Disclaimer</h2>
                <p className="text-[13px] text-white/30">Add a disclaimer for estimates</p>
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

              {/* Title */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[13px] text-white/40 mb-1.5">Body *</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={5}
                  placeholder="Enter the disclaimer text..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 resize-none"
                  required
                />
              </div>

              {/* Category + Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">Category</label>
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
                  <label className="block text-[13px] text-white/40 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              </div>

              {/* Default toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#C9A84C]" />
                  <span className="text-[14px] text-white/60">Auto-include in estimates</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    formData.is_default ? 'bg-[#C9A84C]' : 'bg-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.is_default ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`} />
                </button>
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
                    <><Plus size={16} /> Add Disclaimer</>
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
