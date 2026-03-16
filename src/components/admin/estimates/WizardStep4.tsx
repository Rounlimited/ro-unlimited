'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Search,
  ArrowUp, ArrowDown, X, PackageSearch, Loader2, Copy, BookmarkPlus, Sparkles, Undo2,
} from 'lucide-react';
import AiAssistPanel from './AiAssistPanel';

const FALLBACK_PHASES = [
  'Demolition', 'Site Prep', 'Foundation', 'Framing', 'Roofing',
  'Electrical', 'Plumbing', 'HVAC', 'Drywall', 'Painting',
  'Flooring', 'Finish Work', 'Cleanup', 'Other',
];

const CATEGORIES = ['material', 'labor', 'subcontractor', 'equipment', 'rental', 'other'];
const FALLBACK_UNITS = ['each', 'sqft', 'lnft', 'hour', 'day', 'lot', 'cuyd'];

interface LineItem {
  _key: string; // local key for React
  id?: string;
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

interface CostItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  default_cost: number;
  default_markup_percent: number;
  trade?: string;
}

interface Props {
  lineItems: LineItem[];
  onChange: (items: LineItem[]) => void;
  division?: string;
  documentMode?: string;
  projectName?: string;
}

let keyCounter = 0;
function nextKey() {
  return `li_${Date.now()}_${++keyCounter}`;
}

export default function WizardStep4({ lineItems, onChange, division, documentMode, projectName }: Props) {
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleAiAddItems = (aiItems: any[]) => {
    const newItems: LineItem[] = aiItems.map((item, idx) => ({
      _key: nextKey(),
      phase: item.phase || 'Other',
      description: item.description || '',
      category: item.category || 'material',
      quantity: item.quantity || 1,
      unit: item.unit || 'each',
      unit_cost: item.unit_cost || 0,
      markup_percent: item.markup_percent || 0,
      total: (item.quantity || 1) * (item.unit_cost || 0) * (1 + (item.markup_percent || 0) / 100),
      sort_order: lineItems.length + idx,
    }));
    onChange([...lineItems, ...newItems]);
  };
  const [deletedItem, setDeletedItem] = useState<{ item: LineItem; index: number } | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryPhase, setLibraryPhase] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);
  const [dbPhases, setDbPhases] = useState<string[]>([]);
  const [dbUnits, setDbUnits] = useState<{ name: string; abbreviation: string }[]>([]);
  const [customPhase, setCustomPhase] = useState('');
  const [showCustomPhase, setShowCustomPhase] = useState(false);

  // Load phases and units from DB
  useEffect(() => {
    fetch('/api/admin/estimate-phases')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDbPhases(d.map((p: any) => p.name)); })
      .catch(() => {});
    fetch('/api/admin/estimate-units')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDbUnits(d.map((u: any) => ({ name: u.name, abbreviation: u.abbreviation }))); })
      .catch(() => {});
  }, []);

  const PHASES = dbPhases.length > 0 ? dbPhases : FALLBACK_PHASES;
  const UNITS = dbUnits.length > 0 ? dbUnits.map(u => u.abbreviation) : FALLBACK_UNITS;

  // Group items by phase
  const grouped: Record<string, LineItem[]> = {};
  lineItems.forEach(item => {
    const phase = item.phase || 'Other';
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(item);
  });
  const phases = Object.keys(grouped);

  const togglePhase = (phase: string) => {
    setCollapsedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const addPhase = (phase: string) => {
    if (grouped[phase]) {
      // Phase already exists, just expand it
      setCollapsedPhases(prev => { const n = new Set(prev); n.delete(phase); return n; });
    } else {
      // Add a blank item under this phase
      const item: LineItem = {
        _key: nextKey(),
        phase,
        description: '',
        category: 'material',
        quantity: 1,
        unit: 'each',
        unit_cost: 0,
        markup_percent: 0,
        total: 0,
        sort_order: lineItems.length,
      };
      onChange([...lineItems, item]);
    }
    setShowPhaseMenu(false);
  };

  const addItem = (phase: string) => {
    const item: LineItem = {
      _key: nextKey(),
      phase,
      description: '',
      category: 'material',
      quantity: 1,
      unit: 'each',
      unit_cost: 0,
      markup_percent: 0,
      total: 0,
      sort_order: lineItems.length,
    };
    onChange([...lineItems, item]);
  };

  const updateItem = (key: string, field: string, value: any) => {
    const updated = lineItems.map(item => {
      if (item._key !== key) return item;
      const next = { ...item, [field]: value };
      // Recalculate total
      const qty = field === 'quantity' ? Number(value) : next.quantity;
      const cost = field === 'unit_cost' ? Number(value) : next.unit_cost;
      const markup = field === 'markup_percent' ? Number(value) : next.markup_percent;
      next.total = qty * cost * (1 + markup / 100);
      return next;
    });
    onChange(updated);
  };

  const deleteItem = (key: string) => {
    const idx = lineItems.findIndex(i => i._key === key);
    const item = lineItems[idx];
    if (!item) return;

    // Save for undo
    setDeletedItem({ item, index: idx });
    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => setDeletedItem(null), 5000);
    setUndoTimer(timer);

    onChange(lineItems.filter(i => i._key !== key));
  };

  const undoDelete = () => {
    if (!deletedItem) return;
    const arr = [...lineItems];
    arr.splice(deletedItem.index, 0, deletedItem.item);
    onChange(arr);
    setDeletedItem(null);
    if (undoTimer) clearTimeout(undoTimer);
  };

  const duplicateItem = (key: string) => {
    const source = lineItems.find(i => i._key === key);
    if (!source) return;
    const idx = lineItems.findIndex(i => i._key === key);
    const copy: LineItem = {
      ...source,
      _key: nextKey(),
      id: undefined,
      description: source.description ? `${source.description} (copy)` : '',
      sort_order: lineItems.length,
    };
    const arr = [...lineItems];
    arr.splice(idx + 1, 0, copy);
    onChange(arr.map((item, i) => ({ ...item, sort_order: i })));
  };

  const saveItemToLibrary = async (key: string) => {
    const item = lineItems.find(i => i._key === key);
    if (!item) return;
    try {
      await fetch('/api/admin/saved-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.description,
          description: item.description,
          phase: item.phase,
          category: item.category,
          unit: item.unit,
          unit_cost: item.unit_cost,
          markup_percent: item.markup_percent,
        }),
      });
    } catch {}
  };

  const addCustomPhase = () => {
    if (!customPhase.trim()) return;
    addPhase(customPhase.trim());
    // Also save to DB for future use
    fetch('/api/admin/estimate-phases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customPhase.trim() }),
    }).catch(() => {});
    setDbPhases(prev => [...prev.filter(p => p !== 'Other'), customPhase.trim(), 'Other']);
    setCustomPhase('');
    setShowCustomPhase(false);
  };

  const moveItem = (key: string, direction: 'up' | 'down') => {
    const idx = lineItems.findIndex(i => i._key === key);
    if (idx < 0) return;
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= lineItems.length) return;
    const arr = [...lineItems];
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    onChange(arr.map((item, i) => ({ ...item, sort_order: i })));
  };

  // Cost Library modal
  const openLibrary = (phase: string) => {
    setLibraryPhase(phase);
    setShowLibrary(true);
    setLibrarySearch('');
    setLoadingLibrary(true);
    fetch('/api/admin/cost-library')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCostItems(d); })
      .catch(() => {})
      .finally(() => setLoadingLibrary(false));
  };

  const addFromLibrary = (ci: CostItem) => {
    const item: LineItem = {
      _key: nextKey(),
      phase: libraryPhase,
      description: ci.name + (ci.description ? ` - ${ci.description}` : ''),
      category: ci.category,
      quantity: 1,
      unit: ci.unit,
      unit_cost: ci.default_cost,
      markup_percent: ci.default_markup_percent,
      total: ci.default_cost * (1 + ci.default_markup_percent / 100),
      sort_order: lineItems.length,
    };
    onChange([...lineItems, item]);
  };

  const filteredCostItems = costItems.filter(ci => {
    if (!librarySearch) return true;
    const q = librarySearch.toLowerCase();
    return (
      ci.name.toLowerCase().includes(q) ||
      (ci.description || '').toLowerCase().includes(q) ||
      (ci.trade || '').toLowerCase().includes(q)
    );
  });

  const subtotal = lineItems.reduce((sum, i) => sum + (i.total || 0), 0);
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const inputClass = 'bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-[14px] placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition-colors w-full';
  const smallSelect = 'bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-2 text-white text-[13px] focus:outline-none focus:border-[#C9A84C]/50 transition-colors appearance-none cursor-pointer w-full';

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[14px] text-white/50">
          Add line items organized by construction phase.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
              color: '#000',
              boxShadow: '0 0 16px rgba(201,168,76,0.25)',
            }}
          >
            <Sparkles size={16} />
            AI Assist
          </button>
          <div className="relative">
          <button
            onClick={() => setShowPhaseMenu(!showPhaseMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white text-[14px] font-medium rounded-lg hover:bg-white/15 transition-colors border border-white/10"
          >
            <Plus size={16} />
            Add Phase
          </button>
          {showPhaseMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPhaseMenu(false)} />
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-52 max-h-[320px] overflow-y-auto">
                {PHASES.map(p => (
                  <button
                    key={p}
                    onClick={() => addPhase(p)}
                    className={`w-full text-left px-4 py-2.5 text-[14px] hover:bg-white/5 transition-colors ${
                      grouped[p] ? 'text-[#C9A84C]' : 'text-white'
                    }`}
                  >
                    {p} {grouped[p] ? `(${grouped[p].length})` : ''}
                  </button>
                ))}
                <div className="border-t border-white/10 p-2">
                  {showCustomPhase ? (
                    <div className="flex gap-1">
                      <input
                        value={customPhase}
                        onChange={e => setCustomPhase(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomPhase()}
                        placeholder="Phase name..."
                        className="flex-1 bg-[#111] border border-white/10 rounded px-2 py-1.5 text-white text-[13px] focus:outline-none focus:border-[#C9A84C]/50"
                        autoFocus
                      />
                      <button onClick={addCustomPhase} className="px-2 py-1.5 text-[#C9A84C] text-[13px] font-medium">Add</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomPhase(true)}
                      className="w-full text-left px-2 py-1.5 text-[13px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10 rounded transition-colors"
                    >
                      + Custom Phase
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Phase Sections */}
      {phases.length === 0 && (
        <div className="text-center py-16 text-white/30 text-[15px]">
          No line items yet. Click &quot;Add Phase&quot; to get started.
        </div>
      )}

      {phases.map(phase => {
        const items = grouped[phase];
        const collapsed = collapsedPhases.has(phase);
        const phaseTotal = items.reduce((s, i) => s + (i.total || 0), 0);

        return (
          <div key={phase} className="border border-white/10 rounded-xl bg-[#111] overflow-hidden">
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phase)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                {collapsed ? <ChevronRight size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-[#C9A84C]" />}
                <span className="text-[15px] font-semibold text-white">{phase}</span>
                <span className="text-[13px] text-white/40 ml-1">({items.length} items)</span>
              </div>
              <span className="text-[14px] font-medium text-[#C9A84C]">{fmt(phaseTotal)}</span>
            </button>

            {!collapsed && (
              <div className="border-t border-white/10">
                {/* Desktop Table Header (hidden on mobile) */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_120px_80px_80px_100px_90px_100px_40px_40px] gap-2 px-4 py-2 text-[12px] text-white/40 uppercase tracking-wider border-b border-white/5">
                  <div>Description</div>
                  <div>Category</div>
                  <div>Qty</div>
                  <div>Unit</div>
                  <div>Unit Cost</div>
                  <div>Markup %</div>
                  <div className="text-right">Total</div>
                  <div></div>
                  <div></div>
                </div>

                {/* Line Items */}
                {items.map((item, idx) => (
                  <div
                    key={item._key}
                    className="border-b border-white/5 last:border-b-0 px-4 py-3"
                  >
                    {/* Desktop layout */}
                    <div className="hidden lg:grid lg:grid-cols-[1fr_120px_80px_80px_100px_90px_100px_40px_40px] gap-2 items-center">
                      <input
                        value={item.description}
                        onChange={e => updateItem(item._key, 'description', e.target.value)}
                        placeholder="Item description..."
                        className={inputClass}
                      />
                      <select
                        value={item.category}
                        onChange={e => updateItem(item._key, 'category', e.target.value)}
                        className={smallSelect}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={e => updateItem(item._key, 'quantity', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        min={0}
                        step="any"
                      />
                      <select
                        value={item.unit}
                        onChange={e => updateItem(item._key, 'unit', e.target.value)}
                        className={smallSelect}
                      >
                        {UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">$</span>
                        <input
                          type="number"
                          value={item.unit_cost || ''}
                          onChange={e => updateItem(item._key, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className={`${inputClass} pl-6`}
                          min={0}
                          step="any"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.markup_percent || ''}
                          onChange={e => updateItem(item._key, 'markup_percent', parseFloat(e.target.value) || 0)}
                          className={`${inputClass} pr-6`}
                          min={0}
                          step="any"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">%</span>
                      </div>
                      <div className="text-right text-[14px] font-medium text-white/80">
                        {fmt(item.total || 0)}
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => moveItem(item._key, 'up')} className="p-0.5 text-white/20 hover:text-white transition-colors"><ArrowUp size={14} /></button>
                        <button onClick={() => moveItem(item._key, 'down')} className="p-0.5 text-white/20 hover:text-white transition-colors"><ArrowDown size={14} /></button>
                      </div>
                      <button onClick={() => duplicateItem(item._key)} className="p-1.5 text-white/20 hover:text-[#3b8dd4] hover:bg-[#3b8dd4]/10 rounded-lg transition-colors" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => saveItemToLibrary(item._key)} className="p-1.5 text-white/20 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-lg transition-colors" title="Save to Library">
                        <BookmarkPlus size={14} />
                      </button>
                      <button onClick={() => deleteItem(item._key)} className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Mobile layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start gap-2">
                        <input
                          value={item.description}
                          onChange={e => updateItem(item._key, 'description', e.target.value)}
                          placeholder="Item description..."
                          className={`${inputClass} flex-1`}
                        />
                        <button onClick={() => deleteItem(item._key)} className="p-2 text-red-400/50 hover:text-red-400 flex-shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={item.category} onChange={e => updateItem(item._key, 'category', e.target.value)} className={smallSelect}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                        <select value={item.unit} onChange={e => updateItem(item._key, 'unit', e.target.value)} className={smallSelect}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-white/40 mb-1 block">Qty</label>
                          <input type="number" value={item.quantity || ''} onChange={e => updateItem(item._key, 'quantity', parseFloat(e.target.value) || 0)} className={inputClass} min={0} step="any" />
                        </div>
                        <div>
                          <label className="text-[11px] text-white/40 mb-1 block">Unit Cost</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30 text-[12px]">$</span>
                            <input type="number" value={item.unit_cost || ''} onChange={e => updateItem(item._key, 'unit_cost', parseFloat(e.target.value) || 0)} className={`${inputClass} pl-5`} min={0} step="any" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-white/40 mb-1 block">Markup</label>
                          <div className="relative">
                            <input type="number" value={item.markup_percent || ''} onChange={e => updateItem(item._key, 'markup_percent', parseFloat(e.target.value) || 0)} className={`${inputClass} pr-5`} min={0} step="any" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-[12px]">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[14px] font-semibold text-[#C9A84C]">
                        {fmt(item.total || 0)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Phase Actions */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#0d0d0d]">
                  <button
                    onClick={() => addItem(phase)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10 rounded-lg transition-colors font-medium"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                  <button
                    onClick={() => openLibrary(phase)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[#D4772C] hover:bg-[#D4772C]/10 rounded-lg transition-colors font-medium"
                  >
                    <PackageSearch size={14} />
                    From Library
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Subtotal Bar */}
      {lineItems.length > 0 && (
        <div className="flex items-center justify-between px-5 py-4 bg-[#111] border border-white/10 rounded-xl">
          <span className="text-[15px] font-medium text-white/60">Line Items Subtotal</span>
          <span className="text-[18px] font-bold text-[#C9A84C]">{fmt(subtotal)}</span>
        </div>
      )}

      {/* Cost Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowLibrary(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-[16px] font-semibold text-white">Cost Library</h3>
              <button onClick={() => setShowLibrary(false)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-white/10">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  placeholder="Search items..."
                  className={`${inputClass} pl-10`}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loadingLibrary ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
                </div>
              ) : filteredCostItems.length === 0 ? (
                <div className="text-center py-12 text-[14px] text-white/40">No items found</div>
              ) : (
                filteredCostItems.map(ci => (
                  <button
                    key={ci.id}
                    onClick={() => addFromLibrary(ci)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-white font-medium truncate">{ci.name}</div>
                      <div className="text-[12px] text-white/40 truncate">
                        {ci.category} &middot; {ci.unit} &middot; {ci.trade || 'General'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-[14px] font-medium text-white">{fmt(ci.default_cost)}/{ci.unit}</div>
                      {ci.default_markup_percent > 0 && (
                        <div className="text-[12px] text-white/40">+{ci.default_markup_percent}% markup</div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-white/10 text-[13px] text-white/40">
              Adding to: <span className="text-[#C9A84C] font-medium">{libraryPhase}</span>
            </div>
          </div>
        </div>
      )}

      {/* Undo Delete Toast */}
      {deletedItem && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-[#111] border border-white/10 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4">
          <span className="text-[14px] text-white/70">
            Deleted <span className="text-white font-medium">{deletedItem.item.description || 'item'}</span>
          </span>
          <button
            onClick={undoDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10 rounded-lg hover:bg-[#C9A84C]/20 transition-colors"
          >
            <Undo2 size={14} /> Undo
          </button>
        </div>
      )}

      {/* AI Assist Panel */}
      <AiAssistPanel
        open={showAiPanel}
        onClose={() => setShowAiPanel(false)}
        onAddItems={handleAiAddItems}
        context={{ division, document_mode: documentMode, project_name: projectName, existing_items: lineItems }}
      />
    </div>
  );
}
