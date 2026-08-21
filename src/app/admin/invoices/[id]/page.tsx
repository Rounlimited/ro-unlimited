'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Receipt, DollarSign, Loader2, Trash2, Ban, X,
  CheckCircle2, AlertTriangle, Clock, Eye,
} from 'lucide-react';

/** Invoice detail — status, lines, ledger, record payment. JR-sized. */

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:     { label: 'Draft',     color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: Clock },
  sent:      { label: 'Sent',      color: '#5ba3dc', bg: 'rgba(59,141,212,0.15)',  icon: Receipt },
  partial:   { label: 'Partial',   color: '#D4B965', bg: 'rgba(201,168,76,0.15)',  icon: DollarSign },
  paid:      { label: 'Paid',      color: '#35d07f', bg: 'rgba(53,208,127,0.15)',  icon: CheckCircle2 },
  overdue:   { label: 'Overdue',   color: '#f87171', bg: 'rgba(248,113,113,0.14)', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: Ban },
};

const fmt$ = (n: number) => '$' + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtDate = (d: string | null) => (d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invoices/' + id);
      const data = await res.json();
      if (res.ok) setInv(data);
    } catch { /* noop */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (label: string, fn: () => Promise<Response>) => {
    setBusy(label);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error || 'Failed');
      else if (label === 'delete') { router.push('/admin/invoices'); return; }
      await load();
    } finally { setBusy(null); }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[#0a0a0a] text-white/40"><Loader2 size={26} className="animate-spin mr-3" /> Loading…</div>;
  }
  if (!inv) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white/50 gap-4">
        <p className="text-[18px]">Invoice not found</p>
        <button onClick={() => router.push('/admin/invoices')} className="min-h-[48px] px-6 rounded-xl bg-white/8 text-[16px] font-semibold">Back to Invoices</button>
      </div>
    );
  }

  const meta = STATUS_META[inv.effective_status] || STATUS_META.draft;
  const StatusIcon = meta.icon;
  const balance = Number(inv.total) - Number(inv.amount_paid);
  const who = inv.customer
    ? (inv.customer.company_name || [inv.customer.first_name, inv.customer.last_name].filter(Boolean).join(' '))
    : (inv.bill_to?.company || inv.bill_to?.name || 'No customer');

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white pb-36">
      <div className="max-w-3xl mx-auto px-4 pt-5">
        <button onClick={() => router.push('/admin/invoices')} className="flex items-center gap-2 text-[16px] text-white/50 min-h-[44px] mb-2 active:scale-95 transition-transform">
          <ArrowLeft size={19} /> Invoices
        </button>

        {/* Header card */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-[22px] font-bold leading-tight">{inv.invoice_number}</h1>
              <p className="text-[17px] text-white/60 mt-0.5">{who}</p>
              {(inv.milestone_label || inv.project_name) && (
                <p className="text-[15px] text-white/35 mt-0.5">{inv.milestone_label || inv.project_name}</p>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-[14px] font-bold px-3 py-1.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>
              <StatusIcon size={15} /> {meta.label}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-[14px] text-white/40 space-y-0.5">
              <p>Issued {fmtDate(inv.issued_date)}</p>
              <p>Due {fmtDate(inv.due_date)}</p>
              {inv.view_count > 0 && (
                <p className="flex items-center gap-1.5"><Eye size={13} /> Viewed {inv.view_count}× · last {fmtDate(inv.last_viewed_at)}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[28px] font-bold leading-none" style={{ color: inv.effective_status === 'paid' ? '#35d07f' : '#fff' }}>{fmt$(inv.total)}</p>
              {balance > 0 && Number(inv.amount_paid) > 0 && (
                <p className="text-[15px] text-[#D4B965] mt-1">{fmt$(balance)} remaining</p>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 mb-4">
          <h2 className="text-[15px] font-bold uppercase tracking-wide text-white/40 mb-3">Line Items</h2>
          <div className="divide-y divide-white/6">
            {(inv.line_items || []).map((li: any) => (
              <div key={li.id} className="py-3 flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[17px]">{li.description}</p>
                  {li.quantity !== 1 && <p className="text-[14px] text-white/35">{li.quantity} × {fmt$(li.unit_price)}</p>}
                </div>
                <p className="text-[17px] font-semibold shrink-0">{fmt$(li.amount)}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-1 border-t border-white/10 space-y-1.5">
            {Number(inv.tax_amount) > 0 && (
              <>
                <div className="flex justify-between text-[15px] text-white/50"><span>Subtotal</span><span>{fmt$(inv.subtotal)}</span></div>
                <div className="flex justify-between text-[15px] text-white/50"><span>Tax ({inv.tax_percent}%)</span><span>{fmt$(inv.tax_amount)}</span></div>
              </>
            )}
            <div className="flex justify-between text-[19px] font-bold"><span>Total</span><span>{fmt$(inv.total)}</span></div>
            {Number(inv.amount_paid) > 0 && (
              <div className="flex justify-between text-[16px]" style={{ color: '#35d07f' }}><span>Paid</span><span>−{fmt$(inv.amount_paid)}</span></div>
            )}
          </div>
        </div>

        {/* Payments ledger */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold uppercase tracking-wide text-white/40">Payments</h2>
            {inv.status !== 'cancelled' && balance > 0 && (
              <button onClick={() => setShowPay(true)}
                className="min-h-[44px] px-4 rounded-lg text-[15px] font-bold active:scale-95 transition-transform"
                style={{ background: 'rgba(53,208,127,0.14)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.3)' }}>
                + Record
              </button>
            )}
          </div>
          {(inv.payments || []).length === 0 ? (
            <p className="text-[15px] text-white/30">Nothing recorded yet.</p>
          ) : (
            <div className="divide-y divide-white/6">
              {inv.payments.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[17px] font-semibold" style={{ color: '#35d07f' }}>{fmt$(p.amount)}</p>
                    <p className="text-[14px] text-white/40 capitalize">{p.method}{p.reference ? ' · ' + p.reference : ''} · {fmtDate(p.paid_date)}</p>
                  </div>
                  <button
                    onClick={() => { if (confirm('Remove this payment entry?')) act('rm-payment', () => fetch('/api/admin/invoices/' + id + '/payments?payment_id=' + p.id, { method: 'DELETE' })); }}
                    className="w-11 h-11 rounded-lg bg-white/4 flex items-center justify-center active:scale-95">
                    <Trash2 size={16} className="text-white/35" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger row */}
        <div className="flex gap-2.5">
          {inv.status === 'draft' && !inv.sent_at && (
            <button
              onClick={() => { if (confirm('Delete this draft?')) act('delete', () => fetch('/api/admin/invoices/' + id, { method: 'DELETE' })); }}
              disabled={busy !== null}
              className="flex-1 min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
              <Trash2 size={18} /> Delete Draft
            </button>
          )}
          {!['cancelled', 'paid'].includes(inv.status) && (inv.sent_at || inv.status !== 'draft') && (
            <button
              onClick={() => { if (confirm('Cancel this invoice? The number stays on record.')) act('cancel', () => fetch('/api/admin/invoices/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })); }}
              disabled={busy !== null}
              className="flex-1 min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Ban size={18} /> Cancel Invoice
            </button>
          )}
        </div>
        <p className="text-[13px] text-white/25 text-center mt-4">Send-by-email and the customer link arrive in the next phase.</p>
      </div>

      {showPay && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPay(false)} />
          <QuickPay id={String(id)} balance={balance} onDone={() => { setShowPay(false); load(); }} onClose={() => setShowPay(false)} />
        </div>
      )}
    </div>
  );
}

function QuickPay({ id, balance, onDone, onClose }: { id: string; balance: number; onDone: () => void; onClose: () => void }) {
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState('check');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const inputCls = 'w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#35d07f]/50';

  const submit = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/invoices/' + id + '/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), method, reference: reference || null }),
    });
    if (res.ok) onDone(); else { alert((await res.json()).error || 'Failed'); setSaving(false); }
  };

  return (
    <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10 p-5"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold">Record Payment</h2>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5"><X size={20} className="text-white/60" /></button>
      </div>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" className={inputCls + ' mb-3 text-[22px] font-bold'} />
      <div className="grid grid-cols-3 gap-2 mb-3">
        {['check', 'ach', 'cash', 'zelle', 'card', 'other'].map((m) => (
          <button key={m} onClick={() => setMethod(m)}
            className="min-h-[48px] rounded-xl text-[15px] font-bold capitalize"
            style={method === m
              ? { background: 'rgba(53,208,127,0.15)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {m}
          </button>
        ))}
      </div>
      <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Check # / reference (optional)" className={inputCls + ' mb-4'} />
      <button disabled={saving || !(Number(amount) > 0)} onClick={submit}
        className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(145deg, #35d07f, #22b168)' }}>
        {saving ? <Loader2 size={20} className="animate-spin" /> : <DollarSign size={19} />} Record
      </button>
    </div>
  );
}
