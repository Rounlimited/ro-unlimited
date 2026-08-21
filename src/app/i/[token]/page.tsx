'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Download, Phone, CheckCircle2, AlertTriangle, Clock, Loader2, Receipt,
  PenLine, MessageSquare, Send as SendIcon, Eraser,
} from 'lucide-react';

/**
 * Public invoice page — what the customer opens from a text or email.
 * Same light document language as /estimate/[token] so RO's customer-facing
 * pages read as one brand. Paid invoices render as receipts and stay up.
 */

interface PublicInvoice {
  invoice_number: string;
  status: string;
  billed_to: string | null;
  project_name: string | null;
  project_address: string | null;
  milestone_label: string | null;
  line_items: { id: string; description: string; quantity: number; unit: string; unit_price: number; amount: number }[];
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  issued_date: string | null;
  due_date: string | null;
  payment_instructions: string | null;
  photos: { url: string; caption?: string }[] | null;
  payments: { amount: number; method: string; paid_date: string }[];
  comments: { author: 'customer' | 'admin'; name: string | null; body: string; created_at: string }[];
  signed_at: string | null;
  signed_name: string | null;
  signature_data: string | null;
}

const fmt$ = (n: number) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string | null) => (d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');

export default function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [inv, setInv] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/invoice/' + token)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) setError(data.error || 'Invoice not found');
        else setInv(data);
      })
      .catch(() => setError('Could not load this invoice — check your connection and try again.'));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <Receipt size={36} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-[20px] font-bold text-gray-800 mb-2">Invoice Unavailable</h1>
          <p className="text-[16px] text-gray-500 mb-6">{error}</p>
          <a href="tel:8643040139" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C9A84C] text-black text-[15px] font-bold">
            <Phone size={17} /> Call (864) 304-0139
          </a>
        </div>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /> Loading invoice…
      </div>
    );
  }

  const balance = Number(inv.total) - Number(inv.amount_paid);
  const isPaid = inv.status === 'paid';
  const isOverdue = inv.status === 'overdue';

  const banner = isPaid
    ? { bg: '#e8f8f0', border: '#b5e6cd', color: '#187a4b', icon: CheckCircle2, text: 'Paid in full — thank you. This page is your receipt.' }
    : isOverdue
      ? { bg: '#fdeeee', border: '#f5c6c6', color: '#b03434', icon: AlertTriangle, text: `Past due — ${fmt$(balance)} was due ${fmtDate(inv.due_date)}.` }
      : { bg: '#fdf6e7', border: '#ead9ac', color: '#8a6d20', icon: Clock, text: `${fmt$(balance)} due ${fmtDate(inv.due_date)}.` };
  const BannerIcon = banner.icon;

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Brand header */}
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ro-unlimited-logo.png" alt="RO Unlimited" className="h-10 w-auto" />
          <a
            href={'/api/invoice/' + token + '/pdf'}
            className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl bg-white border border-gray-200 text-[15px] font-semibold text-gray-700 shadow-sm active:scale-[0.98] transition-transform"
          >
            <Download size={17} /> PDF
          </a>
        </div>

        {/* Status banner */}
        <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: banner.bg, borderColor: banner.border }}>
          <BannerIcon size={22} style={{ color: banner.color }} className="shrink-0" />
          <p className="text-[16px] font-semibold" style={{ color: banner.color }}>{banner.text}</p>
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-1">
                  {isPaid ? 'Receipt' : 'Invoice'}
                </p>
                <h1 className="text-[24px] font-bold text-gray-900 leading-tight">{inv.invoice_number}</h1>
                {inv.billed_to && <p className="text-[16px] text-gray-500 mt-1">Billed to {inv.billed_to}</p>}
                {(inv.project_name || inv.milestone_label) && (
                  <p className="text-[15px] text-gray-400 mt-0.5">
                    {inv.project_name}{inv.milestone_label ? ' · ' + inv.milestone_label : ''}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] text-gray-400 uppercase tracking-wide">{isPaid ? 'Total Paid' : 'Balance Due'}</p>
                <p className="text-[28px] font-bold leading-tight" style={{ color: isPaid ? '#187a4b' : '#1a1a1a' }}>
                  {fmt$(isPaid ? inv.total : balance)}
                </p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-[14px] text-gray-400">
              <span>Issued {fmtDate(inv.issued_date)}</span>
              {inv.due_date && !isPaid && <span className={isOverdue ? 'text-[#b03434] font-semibold' : ''}>Due {fmtDate(inv.due_date)}</span>}
            </div>
          </div>

          {/* Lines */}
          <div className="p-5 sm:p-6">
            <div className="divide-y divide-gray-100">
              {inv.line_items.map((li) => (
                <div key={li.id} className="py-3 flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[16px] text-gray-800">{li.description}</p>
                    {li.quantity !== 1 && (
                      <p className="text-[14px] text-gray-400">{li.quantity}{li.unit && li.unit !== 'each' ? ' ' + li.unit : ''} × {fmt$(li.unit_price)}</p>
                    )}
                  </div>
                  <p className="text-[16px] font-semibold text-gray-900 shrink-0">{fmt$(li.amount)}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t border-gray-200 space-y-1.5">
              {Number(inv.tax_amount) > 0 && (
                <>
                  <div className="flex justify-between text-[15px] text-gray-500"><span>Subtotal</span><span>{fmt$(inv.subtotal)}</span></div>
                  <div className="flex justify-between text-[15px] text-gray-500"><span>Tax ({inv.tax_percent}%)</span><span>{fmt$(inv.tax_amount)}</span></div>
                </>
              )}
              <div className="flex justify-between text-[18px] font-bold text-gray-900"><span>Total</span><span>{fmt$(inv.total)}</span></div>
              {Number(inv.amount_paid) > 0 && (
                <div className="flex justify-between text-[15px] font-semibold" style={{ color: '#187a4b' }}>
                  <span>Payments received</span><span>−{fmt$(inv.amount_paid)}</span>
                </div>
              )}
              {!isPaid && (
                <div className="flex justify-between text-[17px] font-bold pt-1" style={{ color: isOverdue ? '#b03434' : '#1a1a1a' }}>
                  <span>Balance due</span><span>{fmt$(balance)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment history */}
        {inv.payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">Payment History</h2>
            <div className="divide-y divide-gray-100">
              {inv.payments.map((p, i) => (
                <div key={i} className="py-2.5 flex justify-between text-[15px]">
                  <span className="text-gray-500">{fmtDate(p.paid_date)} · <span className="uppercase text-[13px]">{p.method}</span></span>
                  <span className="font-semibold" style={{ color: '#187a4b' }}>{fmt$(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to pay */}
        {!isPaid && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-2">How to Pay</h2>
            <p className="text-[16px] text-gray-600 leading-relaxed">
              {inv.payment_instructions || 'Checks payable to RO Unlimited Construction & Development. For ACH details or any payment questions, call us — we make it easy.'}
            </p>
            <a href="tel:8643040139" className="mt-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[52px] px-8 rounded-xl bg-[#C9A84C] text-black text-[16px] font-bold active:scale-[0.98] transition-transform">
              <Phone size={18} /> (864) 304-0139
            </a>
          </div>
        )}

        {/* Approve & sign — DocuSign-lite */}
        <SignCard inv={inv} token={String(token)} onSigned={(name, at) => setInv({ ...inv, signed_name: name, signed_at: at })} />

        {/* Notes & questions */}
        <CommentsCard inv={inv} token={String(token)} onPosted={(cm) => setInv({ ...inv, comments: [...inv.comments, cm] })} />

        {/* Photos */}
        {Array.isArray(inv.photos) && inv.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">Job-Site Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inv.photos.map((photo, i) => (
                <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url.includes('cdn.sanity.io') ? photo.url + '?w=640&auto=format' : photo.url}
                      alt={photo.caption || 'Job-site photo ' + (i + 1)}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {photo.caption && <p className="text-[13px] text-gray-500 mt-1.5">{photo.caption}</p>}
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[13px] text-gray-400 pt-2 pb-6">
          RO Unlimited Construction &amp; Development · Easley, SC · Licensed in SC, NC &amp; GA
        </p>
      </div>
    </div>
  );
}


/* ── Signature pad — plain canvas, pointer events, touch-first ── */
function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drawing.current = true;
          const ctx = canvasRef.current!.getContext('2d')!;
          const { x, y } = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext('2d')!;
          const { x, y } = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          hasInk.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (hasInk.current) onChange(canvasRef.current!.toDataURL('image/png'));
        }}
      />
      <button
        type="button"
        onClick={() => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasInk.current = false;
          onChange(null);
        }}
        className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold text-gray-400 min-h-[44px] px-2"
      >
        <Eraser size={15} /> Clear
      </button>
    </div>
  );
}

function SignCard({ inv, token, onSigned }: { inv: PublicInvoice; token: string; onSigned: (name: string, at: string) => void }) {
  const [name, setName] = useState('');
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (inv.signed_at) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">Customer Approval</h2>
        <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: '#e8f8f0', border: '1px solid #b5e6cd' }}>
          <CheckCircle2 size={22} style={{ color: '#187a4b' }} className="shrink-0" />
          <p className="text-[16px] font-semibold" style={{ color: '#187a4b' }}>
            Signed by {inv.signed_name} on {new Date(inv.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    );
  }
  if (inv.status === 'paid') return null;

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) { setError('Enter your full name'); return; }
    if (!sig) { setError('Draw your signature in the box'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/invoice/' + token + '/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), signature_data: sig }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Could not save signature'); setBusy(false); return; }
      onSigned(data.signed_name, data.signed_at);
    } catch { setError('Connection problem — try again'); setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-1 flex items-center gap-2">
        <PenLine size={15} /> Approve &amp; Sign
      </h2>
      <p className="text-[15px] text-gray-500 mb-4">
        Sign below to acknowledge this invoice. Your signature is recorded with a timestamp.
      </p>
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
        disabled={busy}
        className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[52px] px-8 rounded-xl bg-[#C9A84C] text-black text-[16px] font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <PenLine size={18} />} Sign Invoice
      </button>
    </div>
  );
}

function CommentsCard({ inv, token, onPosted }: { inv: PublicInvoice; token: string; onPosted: (cm: PublicInvoice['comments'][0]) => void }) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!body.trim()) { setError('Write a note first'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/invoice/' + token + '/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Could not post'); setBusy(false); return; }
      onPosted(data.comment);
      setBody('');
      setBusy(false);
    } catch { setError('Connection problem — try again'); setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <h2 className="text-[13px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3 flex items-center gap-2">
        <MessageSquare size={15} /> Notes &amp; Questions
      </h2>
      {inv.comments.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {inv.comments.map((cm, i) => (
            <div key={i} className="rounded-xl p-3.5"
              style={cm.author === 'admin'
                ? { background: '#fdf6e7', border: '1px solid #ead9ac' }
                : { background: '#f4f5f7', border: '1px solid #e5e7eb' }}>
              <p className="text-[13px] font-bold mb-1" style={{ color: cm.author === 'admin' ? '#8a6d20' : '#4b5563' }}>
                {cm.author === 'admin' ? (cm.name || 'RO Unlimited') : (cm.name || 'You')}
                <span className="font-normal text-gray-400"> · {new Date(cm.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </p>
              <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">{cm.body}</p>
            </div>
          ))}
        </div>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full min-h-[48px] px-4 rounded-xl border border-gray-200 bg-white text-[16px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] mb-2.5"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Question about a line item? Note for the crew? Write it here…"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[16px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] mb-2.5"
      />
      {error && <p className="text-[15px] text-[#b03434] mb-2">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl border border-gray-200 bg-gray-50 text-[15px] font-bold text-gray-700 disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {busy ? <Loader2 size={17} className="animate-spin" /> : <SendIcon size={16} />} Send Note
      </button>
    </div>
  );
}
