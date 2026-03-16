'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, User, Building2, MapPin, FileText, FileSignature, FileDiff, Zap } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Step1Data {
  customer_id: string;
  customer?: Customer;
  document_mode: string;
  division: string;
  estimate_type: string;
  contract_type: string;
  project_name: string;
  project_address: string;
  project_city: string;
  project_state: string;
  project_zip: string;
}

interface Props {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
  preselectedCustomerId?: string;
}

export default function WizardStep1({ data, onChange, preselectedCustomerId }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '', last_name: '', company_name: '', email: '', phone: '',
  });
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load customers
  useEffect(() => {
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setCustomers(d);
      })
      .catch(() => {});
  }, []);

  // Pre-select customer from URL param
  useEffect(() => {
    if (preselectedCustomerId && customers.length > 0 && !data.customer_id) {
      const c = customers.find(c => c.id === preselectedCustomerId);
      if (c) {
        onChange({
          customer_id: c.id,
          customer: c,
          project_address: c.address || '',
          project_city: c.city || '',
          project_state: c.state || 'SC',
          project_zip: c.zip || '',
        });
      }
    }
  }, [preselectedCustomerId, customers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const company = (c.company_name || '').toLowerCase();
    return name.includes(q) || company.includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  const selectCustomer = (c: Customer) => {
    // Always overwrite address fields when switching customers
    onChange({
      customer_id: c.id,
      customer: c,
      project_address: c.address || '',
      project_city: c.city || '',
      project_state: c.state || 'SC',
      project_zip: c.zip || '',
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const createCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.last_name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      const created = await res.json();
      if (created?.id) {
        setCustomers(prev => [created, ...prev]);
        selectCustomer(created);
        setShowNewForm(false);
        setNewCustomer({ first_name: '', last_name: '', company_name: '', email: '', phone: '' });
      }
    } catch {}
    setCreating(false);
  };

  const selectedCustomer = data.customer || customers.find(c => c.id === data.customer_id);

  const inputClass = 'w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition-colors';
  const labelClass = 'block text-[14px] font-medium text-white/70 mb-1.5';
  const selectClass = 'w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[15px] focus:outline-none focus:border-[#C9A84C]/50 transition-colors appearance-none cursor-pointer';

  const DOC_MODES = [
    { id: 'estimate', label: 'Estimate', desc: 'Non-binding cost estimate', icon: FileText, color: '#C9A84C' },
    { id: 'contract', label: 'Proposal', desc: 'Binding contract upon signature', icon: FileSignature, color: '#3b8dd4' },
    { id: 'change_order', label: 'Change Order', desc: 'Modify an existing contract', icon: FileDiff, color: '#D4772C' },
    { id: 'quick_quote', label: 'Quick Quote', desc: 'Simple quote for small jobs', icon: Zap, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Document Type */}
      <div>
        <label className={labelClass}>Document Type *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DOC_MODES.map((mode) => {
            const Icon = mode.icon;
            const selected = (data.document_mode || 'estimate') === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ document_mode: mode.id })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  selected
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/5 bg-[#111] hover:border-white/10'
                }`}
                style={selected ? { borderColor: `${mode.color}40`, boxShadow: `0 0 12px ${mode.color}15` } : undefined}
              >
                <Icon size={20} style={{ color: selected ? mode.color : 'rgba(255,255,255,0.3)' }} />
                <span className={`text-[13px] font-semibold ${selected ? 'text-white' : 'text-white/40'}`}>{mode.label}</span>
                <span className="text-[11px] text-white/25 leading-tight">{mode.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Selection */}
      <div>
        <label className={labelClass}>Customer *</label>
        {selectedCustomer ? (
          <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#C9A84C]/30 rounded-lg p-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-[#C9A84C]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-white truncate">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </div>
              {selectedCustomer.company_name && (
                <div className="text-[13px] text-white/50 truncate">{selectedCustomer.company_name}</div>
              )}
            </div>
            <button
              onClick={() => onChange({ customer_id: '', customer: undefined })}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search customers..."
                className={`${inputClass} pl-10`}
              />
            </div>
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl max-h-[280px] overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="px-4 py-3 text-[14px] text-white/40">No customers found</div>
                )}
                {filtered.slice(0, 20).map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D4772C]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[12px] font-bold text-[#D4772C]">
                        {c.first_name[0]}{c.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-white truncate">
                        {c.first_name} {c.last_name}
                      </div>
                      {c.company_name && (
                        <div className="text-[12px] text-white/40 truncate">{c.company_name}</div>
                      )}
                    </div>
                  </button>
                ))}
                <div className="border-t border-white/10">
                  <button
                    onClick={() => { setShowNewForm(true); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-[#3b8dd4] hover:bg-[#3b8dd4]/10 transition-colors text-[14px] font-medium"
                  >
                    <Plus size={16} />
                    Add New Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline New Customer Form */}
      {showNewForm && (
        <div className="bg-[#111] border border-[#3b8dd4]/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[15px] font-semibold text-[#3b8dd4]">New Customer</h4>
            <button onClick={() => setShowNewForm(false)} className="text-white/40 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                value={newCustomer.first_name}
                onChange={e => setNewCustomer(p => ({ ...p, first_name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                value={newCustomer.last_name}
                onChange={e => setNewCustomer(p => ({ ...p, last_name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input
                value={newCustomer.company_name}
                onChange={e => setNewCustomer(p => ({ ...p, company_name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-[14px] text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createCustomer}
              disabled={creating || !newCustomer.first_name || !newCustomer.last_name}
              className="px-5 py-2 bg-[#3b8dd4] text-white text-[14px] font-medium rounded-lg hover:bg-[#3b8dd4]/80 disabled:opacity-40 transition-all"
            >
              {creating ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </div>
      )}

      {/* Project Type & Estimate Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Division *</label>
          <div className="relative">
            <select
              value={data.division}
              onChange={e => onChange({ division: e.target.value })}
              className={selectClass}
            >
              <option value="">Select Division</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="grading">Grading</option>
            </select>
            <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Estimate Type *</label>
          <select
            value={data.estimate_type}
            onChange={e => onChange({ estimate_type: e.target.value })}
            className={selectClass}
          >
            <option value="">Select Type</option>
            <option value="quick_quote">Quick Quote</option>
            <option value="preliminary">Preliminary</option>
            <option value="detailed">Detailed</option>
            <option value="change_order">Change Order</option>
            <option value="time_materials">Time & Materials</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Contract Type</label>
          <select
            value={data.contract_type}
            onChange={e => onChange({ contract_type: e.target.value })}
            className={selectClass}
          >
            <option value="fixed_price">Fixed Price</option>
            <option value="cost_plus">Cost Plus</option>
            <option value="time_materials">Time & Materials</option>
            <option value="unit_price">Unit Price</option>
          </select>
        </div>
      </div>

      {/* Project Name */}
      <div>
        <label className={labelClass}>Project Name *</label>
        <input
          value={data.project_name}
          onChange={e => onChange({ project_name: e.target.value })}
          placeholder="e.g. Kitchen Renovation, New Deck Build..."
          className={inputClass}
        />
      </div>

      {/* Address */}
      <div>
        <label className={labelClass}>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-white/40" />
            Project Address
          </span>
        </label>
        <input
          value={data.project_address}
          onChange={e => onChange({ project_address: e.target.value })}
          placeholder="Street address..."
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input
            value={data.project_city}
            onChange={e => onChange({ project_city: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            value={data.project_state}
            onChange={e => onChange({ project_state: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>ZIP</label>
          <input
            value={data.project_zip}
            onChange={e => onChange({ project_zip: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
