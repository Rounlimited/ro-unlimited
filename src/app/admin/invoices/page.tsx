'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt, Plus, Search, X, ChevronRight, DollarSign, Clock,
  AlertTriangle, CheckCircle2, Loader2, User, Building2, Trash2,
} from 'lucide-react';
import { GENERAL_LINE_PRESETS, searchLinePresets } from '@/lib/line-presets';

/**
 * Invoices — list + AR pulse + create + record payment (Phase 1/2 of the
 * invoice system). Everything JR-sized: 17px body minimum, 48px+ targets.
 *
 * Motion language: staggered card entrance, spring-feel bottom sheets,
 * count-up AR numbers — all CSS/rAF, reduced-motion respected.
 */

interface InvoiceRow {
  id: string;
  invoice_number: string;
  customer: { id: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null } | null;
  bill_to: { name?: string; company?: string; email?: string } | null;
  // email presence drives the receipt toggle default in PaymentSheet
  project_name: string | null;
  milestone_label: string | null;
  total: number;
  amount_paid: number;
  effective_status: string;
  due_date: string | null;
  issued_date: string | null;
  created_at: string;
}

interface Summary {
  outstanding: number;
  overdue: number;
  draft_count: number;
  open_count: number;
  collected_this_month: number;
  aging: { current: number; d1_30: number; d31_60: number; d61_plus: number };
}

interface CustomerLite { id: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null }

/** Built-in line presets — always available; cost-library items merge in on top. */
// Quick chips under the description box: the general set, then anything in the
// division libraries that matches what JR has typed (src/lib/line-presets.ts).
const linePresetChips = (q: string) => {
  const list = q
    ? searchLinePresets(q, undefined, 12)
    : GENERAL_LINE_PRESETS.map((p) => ({ ...p, division: 'general' as const }));
  return list.map((p) => ({
    label: p.description.length > 30 ? p.description.slice(0, 28) + '…' : p.description,
    description: p.description,
    price: p.unit_price || undefined,
  }));
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:     { label: 'Draft',    color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: Clock },
  sent:      { label: 'Sent',     color: '#5ba3dc', bg: 'rgba(59,141,212,0.15)',  icon: Receipt },
  partial:   { label: 'Partial',  color: '#D4B965', bg: 'rgba(201,168,76,0.15)',  icon: DollarSign },
  paid:      { label: 'Paid',     color: '#35d07f', bg: 'rgba(53,208,127,0.15)',  icon: CheckCircle2 },
  overdue:   { label: 'Overdue',  color: '#f87171', bg: 'rgba(248,113,113,0.14)', icon: AlertTriangle },
  cancelled: { label: 'Cancelled',color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: X },
};

const fmt$ = (n: number) => {
  const v = Number(n) || 0;
  const hasCents = Math.abs(v - Math.round(v)) >= 0.005;
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 });
};
const fmtRound$ = (n: number) => '$' + Math.round(Number(n) || 0).toLocaleString();

function customerName(inv: InvoiceRow): string {
  if (inv.customer) {
    return inv.customer.company_name || [inv.customer.first_name, inv.customer.last_name].filter(Boolean).join(' ') || 'Customer';
  }
  return inv.bill_to?.company || inv.bill_to?.name || 'No customer';
}

/** Count-up number — rAF, settles in ~0.8s, skips animation under reduced motion. */
function CountUp$({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 800);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className} style={style}>{fmtRound$(display)}</span>;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('open');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [payTarget, setPayTarget] = useState<InvoiceRow | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invoices');
      const data = await res.json();
      if (Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
        setSummary(data.summary);
      }
    } catch { /* keep last state */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Opening the invoices screen clears the activity badge: fetch unread
  // invoice_* notifications and mark just those read.
  useEffect(() => {
    fetch('/api/admin/notifications?unread=true&limit=50')
      .then((r) => r.json())
      .then((d) => {
        const ids = (d?.notifications || [])
          .filter((x: any) => String(x.type || '').startsWith('invoice_'))
          .map((x: any) => x.id);
        if (ids.length) {
          fetch('/api/admin/notifications', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter === 'open') list = list.filter((i) => !['paid', 'cancelled'].includes(i.effective_status));
    else if (filter !== 'all') list = list.filter((i) => i.effective_status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        [i.invoice_number, i.project_name, i.milestone_label, customerName(i)]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, filter, search]);

  const filters = [
    { id: 'open', label: 'Open' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'draft', label: 'Drafts' },
    { id: 'paid', label: 'Paid' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white pb-36">
      <style>{`
        @keyframes inv-card-in { from { opacity: 0; transform: translateY(14px) scale(0.985); } to { opacity: 1; transform: none; } }
        @keyframes inv-sheet-up { from { transform: translateY(100%); } to { transform: none; } }
        .inv-card-in { animation: inv-card-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
        .inv-sheet-up { animation: inv-sheet-up 0.38s cubic-bezier(0.22, 1.2, 0.36, 1) backwards; }
        @media (prefers-reduced-motion: reduce) { .inv-card-in, .inv-sheet-up { animation: none; } }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, #35d07f, #1e9e5c)', boxShadow: '0 4px 18px rgba(53,208,127,0.35)' }}>
              <Receipt size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-tight">Invoices</h1>
              <p className="text-[14px] text-white/40">Get paid. Chase less.</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 min-h-[48px] px-5 rounded-xl text-[16px] font-bold text-black active:scale-[0.97] transition-transform"
            style={{ background: 'linear-gradient(145deg, #35d07f, #22b168)', boxShadow: '0 4px 18px rgba(53,208,127,0.4)' }}
          >
            <Plus size={20} /> New
          </button>
        </div>

        {/* AR pulse strip */}
        {summary && (
          <div className="grid grid-cols-3 gap-2.5 mb-5 inv-card-in">
            <div className="rounded-2xl p-3.5 border border-white/8" style={{ background: 'linear-gradient(145deg, #101d15, #0a130d)' }}>
              <p className="text-[12px] uppercase tracking-wider text-white/40 mb-1">Outstanding</p>
              <CountUp$ value={summary.outstanding} className="text-[20px] font-bold" style={{ color: '#35d07f' }} />
            </div>
            <div className="rounded-2xl p-3.5 border border-white/8" style={{ background: 'linear-gradient(145deg, #1d1010, #130a0a)' }}>
              <p className="text-[12px] uppercase tracking-wider text-white/40 mb-1">Overdue</p>
              <CountUp$ value={summary.overdue} className="text-[20px] font-bold" style={{ color: summary.overdue > 0 ? '#f87171' : '#ffffff66' }} />
            </div>
            <div className="rounded-2xl p-3.5 border border-white/8" style={{ background: 'linear-gradient(145deg, #16130a, #0f0d06)' }}>
              <p className="text-[12px] uppercase tracking-wider text-white/40 mb-1">This Month</p>
              <CountUp$ value={summary.collected_this_month} className="text-[20px] font-bold text-[#D4B965]" />
            </div>
          </div>
        )}

        {/* Aging bar — one glance at where the money sits */}
        {summary && summary.outstanding > 0 && (
          <div className="mb-5 inv-card-in" style={{ animationDelay: '0.06s' }}>
            <div className="flex h-2.5 rounded-full overflow-hidden border border-white/5">
              {([['current', '#35d07f'], ['d1_30', '#D4B965'], ['d31_60', '#D4772C'], ['d61_plus', '#f87171']] as const).map(([k, color]) => {
                const v = summary.aging[k];
                const pct = summary.outstanding > 0 ? (v / summary.outstanding) * 100 : 0;
                return pct > 0 ? <div key={k} style={{ width: pct + '%', background: color, opacity: 0.85 }} /> : null;
              })}
            </div>
            <div className="flex justify-between mt-1.5 text-[12px] text-white/35">
              <span>Current {fmtRound$(summary.aging.current)}</span>
              <span>1–30 {fmtRound$(summary.aging.d1_30)}</span>
              <span>31–60 {fmtRound$(summary.aging.d31_60)}</span>
              <span className={summary.aging.d61_plus > 0 ? 'text-[#f87171]' : ''}>60+ {fmtRound$(summary.aging.d61_plus)}</span>
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 min-h-[48px] px-4 rounded-xl bg-white/5 border border-white/8 focus-within:border-[#35d07f]/40 transition-colors">
            <Search size={18} className="text-white/30 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices…"
              className="flex-1 bg-transparent text-[17px] placeholder:text-white/25 focus:outline-none"
            />
            {search && <button onClick={() => setSearch('')} className="p-2 -m-1"><X size={16} className="text-white/40" /></button>}
          </div>
        </div>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="min-h-[42px] px-4 rounded-full text-[15px] font-semibold whitespace-nowrap transition-all active:scale-95"
              style={filter === f.id
                ? { background: 'rgba(53,208,127,0.18)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {f.label}
              {f.id === 'overdue' && summary && summary.overdue > 0 && (
                <span className="ml-1.5 text-[12px] text-[#f87171]">●</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading invoices…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 inv-card-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(53,208,127,0.1)' }}>
              <Receipt size={28} style={{ color: '#35d07f' }} />
            </div>
            <p className="text-[18px] font-semibold text-white/70 mb-1">
              {invoices.length === 0 ? 'No invoices yet' : 'Nothing matches'}
            </p>
            <p className="text-[15px] text-white/35 mb-6">
              {invoices.length === 0 ? 'Create the first one — from scratch or straight off an estimate.' : 'Try a different filter or search.'}
            </p>
            {invoices.length === 0 && (
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-[16px] font-bold text-black"
                style={{ background: 'linear-gradient(145deg, #35d07f, #22b168)' }}>
                <Plus size={19} /> New Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((inv, idx) => {
              const meta = STATUS_META[inv.effective_status] || STATUS_META.draft;
              const StatusIcon = meta.icon;
              const balance = Number(inv.total) - Number(inv.amount_paid);
              return (
                <div
                  key={inv.id}
                  className="inv-card-in rounded-2xl border border-white/8 bg-[#111] overflow-hidden active:scale-[0.995] transition-transform"
                  style={{ animationDelay: Math.min(idx * 0.045, 0.4) + 's' }}
                >
                  <button
                    onClick={() => router.push('/admin/invoices/' + inv.id)}
                    className="w-full text-left p-4 flex items-center gap-3"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                      <StatusIcon size={19} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[17px] font-bold truncate">{customerName(inv)}</p>
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[14px] text-white/40 truncate mt-0.5">
                        {inv.invoice_number}
                        {inv.milestone_label ? ' · ' + inv.milestone_label : inv.project_name ? ' · ' + inv.project_name : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[18px] font-bold" style={{ color: inv.effective_status === 'paid' ? '#35d07f' : '#fff' }}>
                        {fmt$(inv.total)}
                      </p>
                      {balance > 0 && Number(inv.amount_paid) > 0 && (
                        <p className="text-[13px] text-[#D4B965]">{fmt$(balance)} left</p>
                      )}
                      {inv.due_date && !['paid', 'cancelled'].includes(inv.effective_status) && (
                        <p className="text-[13px]" style={{ color: inv.effective_status === 'overdue' ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
                          Due {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-white/25 shrink-0" />
                  </button>
                  {!['paid', 'cancelled', 'draft'].includes(inv.effective_status) && (
                    <div className="border-t border-white/6 px-4 py-2 flex justify-end">
                      <button
                        onClick={() => setPayTarget(inv)}
                        className="min-h-[42px] px-4 rounded-lg text-[15px] font-bold active:scale-95 transition-transform"
                        style={{ background: 'rgba(53,208,127,0.14)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.3)' }}
                      >
                        Record Payment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <CreateSheet onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); router.push('/admin/invoices/' + id); }} />}
      {payTarget && <PaymentSheet invoice={payTarget} onClose={() => setPayTarget(null)} onDone={() => { setPayTarget(null); load(); }} />}
    </div>
  );
}

/* ── Bottom sheet shell ─────────────────────────────────────── */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="inv-sheet-up relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10 p-5 pb-8"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 active:scale-95">
            <X size={20} className="text-white/60" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#35d07f]/50 transition-colors';
const inputNarrowCls = 'min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#35d07f]/50 transition-colors';
const labelCls = 'block text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-1.5';

/* ── Create sheet: existing customer OR blank bill-to ───────── */
function CreateSheet({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [mode, setMode] = useState<'customer' | 'blank'>('customer');
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customerQ, setCustomerQ] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ first_name: '', last_name: '', company_name: '', email: '', phone: '' });
  const [creatingCust, setCreatingCust] = useState(false);
  const [billTo, setBillTo] = useState({ name: '', company: '', email: '', phone: '' });
  const [projectName, setProjectName] = useState('');
  const [lines, setLines] = useState([{ description: '', quantity: 1, unit_price: '' }]);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [costItems, setCostItems] = useState<{ name: string; unit_cost?: number }[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/customers').then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : d.customers;
      if (Array.isArray(list)) setCustomers(list);
    }).catch(() => {});
    fetch('/api/admin/cost-library').then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : d.items;
      if (Array.isArray(list)) setCostItems(list);
    }).catch(() => {});
  }, []);

  const matches = useMemo(() => {
    if (!customerQ.trim()) return customers.slice(0, 6);
    const q = customerQ.toLowerCase();
    return customers.filter((cst) =>
      [cst.company_name, cst.first_name, cst.last_name, cst.email].filter(Boolean).join(' ').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [customers, customerQ]);

  const selected = customers.find((cst) => cst.id === customerId) || null;
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 1) * (Number(l.unit_price) || 0), 0);

  const createCustomer = async () => {
    setError(null);
    if (!newCust.first_name.trim() || !newCust.last_name.trim()) { setError('First and last name are required'); return; }
    setCreatingCust(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newCust.first_name.trim(), last_name: newCust.last_name.trim(),
          company_name: newCust.company_name.trim() || null,
          email: newCust.email.trim() || null, phone: newCust.phone.trim() || null,
          type: newCust.company_name.trim() ? 'commercial' : 'residential', source: 'invoice',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Could not create customer'); setCreatingCust(false); return; }
      const created = data.customer || data;
      setCustomers([created, ...customers]);
      setCustomerId(created.id);
      setShowNewCustomer(false);
    } catch { setError('Network error'); }
    setCreatingCust(false);
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const body: any = {
        project_name: projectName || null,
        due_date: dueDate || null,
        line_items: lines
          .filter((l) => l.description.trim() && Number(l.unit_price) > 0)
          .map((l) => ({ description: l.description.trim(), quantity: Number(l.quantity) || 1, unit: 'each', unit_price: Number(l.unit_price) })),
      };
      if (mode === 'customer') body.customer_id = customerId;
      else body.bill_to = { ...billTo };
      const res = await fetch('/api/admin/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Failed to create'); setSaving(false); return; }
      onCreated(data.id);
    } catch {
      setError('Network error — try again');
      setSaving(false);
    }
  };

  const canSubmit = (mode === 'customer' ? !!customerId : !!(billTo.name.trim() || billTo.company.trim()))
    && lines.some((l) => l.description.trim() && Number(l.unit_price) > 0);

  return (
    <Sheet title="New Invoice" onClose={onClose}>
      {/* who */}
      <div className="flex gap-2 mb-4">
        {([['customer', 'Existing Customer', User], ['blank', 'Quick Bill-To', Building2]] as const).map(([m, label, Icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className="flex-1 min-h-[52px] rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold transition-all active:scale-[0.98]"
            style={mode === m
              ? { background: 'rgba(53,208,127,0.15)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {mode === 'customer' ? (
        <div className="mb-4">
          {selected ? (
            <div className="flex items-center justify-between min-h-[52px] px-4 rounded-xl" style={{ background: 'rgba(53,208,127,0.1)', border: '1px solid rgba(53,208,127,0.35)' }}>
              <span className="text-[17px] font-semibold">{selected.company_name || [selected.first_name, selected.last_name].filter(Boolean).join(' ')}</span>
              <button onClick={() => setCustomerId(null)} className="p-2 -m-1"><X size={18} className="text-white/50" /></button>
            </div>
          ) : (
            <>
              {showNewCustomer ? (
                <div className="rounded-xl border border-[#35d07f]/30 p-3.5 space-y-2.5" style={{ background: 'rgba(53,208,127,0.05)' }}>
                  <p className="text-[15px] font-bold" style={{ color: '#35d07f' }}>New Customer</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input value={newCust.first_name} onChange={(e) => setNewCust({ ...newCust, first_name: e.target.value })} placeholder="First name *" className={inputCls} />
                    <input value={newCust.last_name} onChange={(e) => setNewCust({ ...newCust, last_name: e.target.value })} placeholder="Last name *" className={inputCls} />
                  </div>
                  <input value={newCust.company_name} onChange={(e) => setNewCust({ ...newCust, company_name: e.target.value })} placeholder="Company (optional)" className={inputCls} />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} placeholder="Email" type="email" className={inputCls} />
                    <input value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} placeholder="Phone" type="tel" className={inputCls} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={createCustomer} disabled={creatingCust}
                      className="flex-1 min-h-[48px] rounded-xl text-[15px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(145deg, #35d07f, #22b168)' }}>
                      {creatingCust ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} Create & Use
                    </button>
                    <button onClick={() => setShowNewCustomer(false)}
                      className="min-h-[48px] px-4 rounded-xl text-[15px] font-semibold bg-white/5 text-white/60 border border-white/10">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input value={customerQ} onChange={(e) => setCustomerQ(e.target.value)} placeholder="Search customers…" className={inputCls} />
                  <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto">
                    {matches.map((cst) => (
                      <button key={cst.id} onClick={() => setCustomerId(cst.id)}
                        className="w-full text-left min-h-[52px] px-4 rounded-xl bg-white/4 border border-white/8 flex items-center justify-between active:scale-[0.99]">
                        <span className="text-[16px]">{cst.company_name || [cst.first_name, cst.last_name].filter(Boolean).join(' ')}</span>
                        <ChevronRight size={16} className="text-white/25" />
                      </button>
                    ))}
                    {matches.length === 0 && <p className="text-[15px] text-white/35 px-1 py-2">No matches yet.</p>}
                  </div>
                  <button onClick={() => { setShowNewCustomer(true); if (customerQ.trim()) { const parts = customerQ.trim().split(/\s+/); setNewCust({ ...newCust, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') }); } }}
                    className="mt-2 w-full min-h-[48px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
                    style={{ background: 'rgba(53,208,127,0.1)', color: '#35d07f', border: '1px dashed rgba(53,208,127,0.4)' }}>
                    <Plus size={17} /> Create New Customer
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <input value={billTo.name} onChange={(e) => setBillTo({ ...billTo, name: e.target.value })} placeholder="Contact name" className={inputCls} />
          <input value={billTo.company} onChange={(e) => setBillTo({ ...billTo, company: e.target.value })} placeholder="Company" className={inputCls} />
          <input value={billTo.email} onChange={(e) => setBillTo({ ...billTo, email: e.target.value })} placeholder="Email" type="email" className={inputCls} />
          <input value={billTo.phone} onChange={(e) => setBillTo({ ...billTo, phone: e.target.value })} placeholder="Phone" type="tel" className={inputCls} />
        </div>
      )}

      <div className="mb-4">
        <label className={labelCls}>Project (optional)</label>
        <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Miller site — storm package" className={inputCls} />
      </div>

      {/* lines */}
      <label className={labelCls}>Line Items</label>
      <div className="space-y-2 mb-2">
        {lines.map((l, i) => {
          const q = l.description.trim().toLowerCase();
          const librarySugg = costItems
            .filter((ci) => ci.name && (!q || ci.name.toLowerCase().includes(q)))
            .slice(0, 4)
            .map((ci) => ({ label: ci.name, description: ci.name, price: (ci as any).unit_cost }));
          const presetSugg = linePresetChips(q).slice(0, 8 - librarySugg.length);
          const suggestions = [...librarySugg, ...presetSugg];
          return (
            <div key={i}>
              <div className="flex gap-2 min-w-0">
                <input
                  value={l.description}
                  onFocus={() => setActiveLine(i)}
                  onBlur={() => setTimeout(() => setActiveLine((a) => (a === i ? null : a)), 150)}
                  onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  placeholder="Description"
                  className={inputNarrowCls + ' flex-1 min-w-0'}
                />
                <input
                  value={l.unit_price}
                  onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))}
                  placeholder="$" type="number" inputMode="decimal" step="0.01"
                  className={inputNarrowCls + ' w-24 shrink-0 text-right'}
                />
                {lines.length > 1 && (
                  <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="w-12 shrink-0 rounded-xl bg-white/4 flex items-center justify-center active:scale-95">
                    <Trash2 size={17} className="text-white/40" />
                  </button>
                )}
              </div>
              {activeLine === i && suggestions.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto py-2 -mx-1 px-1">
                  {suggestions.map((sg, k) => (
                    <button
                      key={k}
                      onMouseDown={(e) => e.preventDefault() /* keep input focus */}
                      onClick={() => setLines(lines.map((x, j) => j === i
                        ? { ...x, description: sg.description, unit_price: sg.price != null ? String(sg.price) : x.unit_price }
                        : x))}
                      className="shrink-0 min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
                      style={{ background: 'rgba(53,208,127,0.1)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.3)' }}
                    >
                      {sg.label}{sg.price != null ? ' · $' + Number(sg.price).toLocaleString() : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => setLines([...lines, { description: '', quantity: 1, unit_price: '' }])}
        className="text-[15px] font-semibold mb-4 min-h-[44px] px-1" style={{ color: '#35d07f' }}>
        + Add line
      </button>

      <div className="grid grid-cols-2 gap-2.5 mb-5 items-end">
        <div>
          <label className={labelCls}>Due date</label>
          <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className={inputCls} />
        </div>
        <div className="text-right pb-2">
          <p className="text-[13px] uppercase tracking-wide text-white/40">Total</p>
          <p className="text-[24px] font-bold" style={{ color: '#35d07f' }}>{fmt$(total)}</p>
        </div>
      </div>

      {error && <p className="text-[15px] text-[#f87171] mb-3">{error}</p>}

      <button disabled={!canSubmit || saving} onClick={submit}
        className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(145deg, #35d07f, #22b168)', boxShadow: '0 4px 18px rgba(53,208,127,0.35)' }}>
        {saving ? <Loader2 size={20} className="animate-spin" /> : <Receipt size={19} />} Create Draft
      </button>
      <p className="text-[13px] text-white/30 text-center mt-3">Creates a draft — review it before sending.</p>
    </Sheet>
  );
}

/* ── Record payment sheet ───────────────────────────────────── */
function PaymentSheet({ invoice, onClose, onDone }: { invoice: InvoiceRow; onClose: () => void; onDone: () => void }) {
  const balance = Number(invoice.total) - Number(invoice.amount_paid);
  const hasEmail = !!(invoice.customer?.email || invoice.bill_to?.email);
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState('check');
  const [reference, setReference] = useState('');
  const [sendReceipt, setSendReceipt] = useState(hasEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null); setSaving(true);
    try {
      const res = await fetch('/api/admin/invoices/' + invoice.id + '/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), method, reference: reference || null, send_receipt: sendReceipt }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Failed'); setSaving(false); return; }
      onDone();
    } catch { setError('Network error'); setSaving(false); }
  };

  return (
    <Sheet title={'Payment — ' + invoice.invoice_number} onClose={onClose}>
      <p className="text-[16px] text-white/50 mb-4">
        {customerName(invoice)} · balance <span className="font-bold text-white">{fmt$(balance)}</span>
      </p>
      <label className={labelCls}>Amount</label>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" step="0.01" className={inputCls + ' mb-4 text-[22px] font-bold'} />
      <label className={labelCls}>Method</label>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['check', 'ach', 'cash', 'zelle', 'card', 'other'].map((m) => (
          <button key={m} onClick={() => setMethod(m)}
            className="min-h-[48px] rounded-xl text-[15px] font-bold capitalize transition-all active:scale-95"
            style={method === m
              ? { background: 'rgba(53,208,127,0.15)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {m}
          </button>
        ))}
      </div>
      <label className={labelCls}>Reference (check # etc, optional)</label>
      <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="#1042" className={inputCls + ' mb-4'} />
      {hasEmail && (
        <button onClick={() => setSendReceipt(!sendReceipt)}
          className="w-full min-h-[52px] px-4 rounded-xl mb-5 flex items-center justify-between text-[16px] font-semibold active:scale-[0.99] transition-all"
          style={sendReceipt
            ? { background: 'rgba(53,208,127,0.1)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.35)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span>Email receipt to customer</span>
          <span className="text-[14px]">{sendReceipt ? 'ON' : 'OFF'}</span>
        </button>
      )}
      {error && <p className="text-[15px] text-[#f87171] mb-3">{error}</p>}
      <button disabled={saving || !(Number(amount) > 0)} onClick={submit}
        className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        style={{ background: 'linear-gradient(145deg, #35d07f, #22b168)', boxShadow: '0 4px 18px rgba(53,208,127,0.35)' }}>
        {saving ? <Loader2 size={20} className="animate-spin" /> : <DollarSign size={19} />} Record {fmt$(Number(amount) || 0)}
      </button>
    </Sheet>
  );
}
