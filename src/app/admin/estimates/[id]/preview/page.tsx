'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Download, Send, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

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

interface LineItem {
  id: string;
  phase: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
  sort_order: number;
}

interface PaymentMilestone {
  id: string;
  milestone: string;
  due_description?: string;
  description?: string;
  percent: number;
  amount: number;
  sort_order: number;
}

interface Disclaimer {
  id: string;
  title: string;
  body: string;
}

interface Estimate {
  id: string;
  estimate_number: string;
  status: string;
  customer_id: string;
  customer?: Customer;
  project_name?: string;
  project_address?: string;
  project_city?: string;
  project_state?: string;
  project_zip?: string;
  division?: string;
  estimate_type?: string;
  contract_type?: string;
  scope_of_work?: string;
  project_description?: string;
  overhead_percent: number;
  markup_percent: number;
  tax_percent: number;
  contingency_percent: number;
  permit_fees: number;
  subtotal: number;
  total: number;
  valid_until?: string;
  exclusions?: string;
  disclaimer_ids?: string[];
  client_signature?: string;
  client_signed_at?: string;
  created_at: string;
  line_items: LineItem[];
  payment_schedule: PaymentMilestone[];
}

/* ─── Helpers ────────────────────────────────────────────────── */

const fmt = (n: number) =>
  (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const fmtDate = (d: string | undefined) => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const humanize = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── Component ──────────────────────────────────────────────── */

export default function EstimatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;
  const docRef = useRef<HTMLDivElement>(null);

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(0.48); // Start zoomed out to fit mobile

  // Auto-detect desktop and zoom appropriately
  useEffect(() => {
    const w = window.innerWidth;
    if (w >= 1024) setZoom(0.85);
    else if (w >= 768) setZoom(0.65);
    else setZoom(0.48);
  }, []);

  useEffect(() => {
    if (!estimateId) return;
    const load = async () => {
      try {
        const [estRes, discRes] = await Promise.all([
          fetch(`/api/admin/estimates/${estimateId}`),
          fetch('/api/admin/disclaimers'),
        ]);
        if (!estRes.ok) { setError('Estimate not found'); setLoading(false); return; }
        setEstimate(await estRes.json());
        const discData = await discRes.json();
        if (Array.isArray(discData)) setDisclaimers(discData);
      } catch {
        setError('Failed to load estimate');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [estimateId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
        <span className="ml-3 text-[16px] text-white/50">Loading estimate...</span>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-[18px] font-semibold text-red-400 mb-2">{error || 'Not found'}</div>
        <button onClick={() => router.push('/admin/estimates')} className="mt-4 px-5 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5">Back</button>
      </div>
    );
  }

  /* ─── Data prep ──────────────────────────────────────────── */

  const customer = estimate.customer;
  const scopeText = estimate.scope_of_work || estimate.project_description || '';
  const projectAddr = [estimate.project_address, estimate.project_city, estimate.project_state, estimate.project_zip].filter(Boolean).join(', ');

  // Group line items by phase
  const grouped: Record<string, LineItem[]> = {};
  (estimate.line_items || []).forEach((item) => {
    const p = item.phase || 'Other';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(item);
  });

  // Calculate totals
  const subtotal = (estimate.line_items || []).reduce(
    (sum, item) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0
  );
  const overheadAmt = (subtotal * (estimate.overhead_percent || 0)) / 100;
  const markupAmt = (subtotal * (estimate.markup_percent || 0)) / 100;
  const taxable = subtotal + overheadAmt + markupAmt;
  const taxAmt = (taxable * (estimate.tax_percent || 0)) / 100;
  const contingencyAmt = (subtotal * (estimate.contingency_percent || 0)) / 100;
  const grandTotal = subtotal + overheadAmt + markupAmt + taxAmt + (estimate.permit_fees || 0) + contingencyAmt;

  // Disclaimers
  const selectedDisclaimers = (estimate.disclaimer_ids || [])
    .map((id) => disclaimers.find((d) => d.id === id))
    .filter(Boolean) as Disclaimer[];

  // Exclusions
  const exclusionsList = (estimate.exclusions || '').split('\n').map((s) => s.trim()).filter(Boolean);

  // Valid days
  const validDays = estimate.valid_until
    ? Math.max(0, Math.ceil((new Date(estimate.valid_until).getTime() - new Date(estimate.created_at).getTime()) / 86400000))
    : 30;

  // Phase subtotals
  const phaseSubtotals: Record<string, number> = {};
  Object.entries(grouped).forEach(([phase, items]) => {
    phaseSubtotals[phase] = items.reduce((sum, item) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0);
  });

  // Payment schedule
  const paymentSchedule = (estimate.payment_schedule || []).map((m) => ({
    ...m,
    amount: (grandTotal * (m.percent || 0)) / 100,
  }));

  let itemCounter = 0;

  /* ─── Save as PDF via hidden iframe print ─────────────── */

  const handleSavePDF = () => {
    if (!docRef.current) return;
    const html = docRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) {
      alert('Please allow popups to save as PDF');
      return;
    }
    printWindow.document.write(`<!DOCTYPE html>
<html><head>
<title>${estimate.estimate_number} - RO Unlimited</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #111; background: white; }
  @page { size: letter; margin: 0.5in 0.6in; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-doc { box-shadow: none !important; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    .print-section { page-break-inside: avoid; }
    .print-break-before { page-break-before: always; }
  }
  .page-doc { max-width: 8.5in; margin: 0 auto; padding: 0.5in 0.6in; }
  table { width: 100%; border-collapse: collapse; }
  .phase-hdr { background: #1f2937; color: white; padding: 6px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .tbl-hdr { background: #f3f4f6; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  .tbl-hdr th { padding: 6px 10px; font-weight: 600; }
  .tbl-row td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #f3f4f6; }
  .tbl-row-alt { background: #fafafa; }
  .tbl-foot td { padding: 6px 10px; font-size: 11px; font-weight: 700; background: #f3f4f6; border-top: 2px solid #d1d5db; }
  .section-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; font-weight: 600; margin-bottom: 8px; }
  .summary-box { border: 2px solid #1f2937; border-radius: 4px; overflow: hidden; }
  .summary-hdr { background: #1f2937; color: white; padding: 6px 16px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 16px; font-size: 12px; }
  .summary-total { border-top: 2px solid #1f2937; padding: 8px 16px; display: flex; justify-content: space-between; align-items: baseline; }
  .sig-block { border: 2px solid #1f2937; border-radius: 4px; padding: 24px; }
  .sig-line { border-bottom: 2px solid #1f2937; min-height: 36px; margin-bottom: 4px; }
  .sig-label { font-size: 9px; color: #9ca3af; }
  .client-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px 16px; }
  .detail-table td { padding: 6px 16px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
  .disclaimer-title { font-size: 11px; font-weight: 700; color: #1f2937; margin-bottom: 2px; }
  .disclaimer-body { font-size: 10px; color: #4b5563; line-height: 1.5; padding-left: 12px; }
</style>
</head><body><div class="page-doc">${html}</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      {/* ─── Toolbar ────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur-sm border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-[14px] text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-1.5">
            {/* Zoom controls */}
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ZoomOut size={16} />
            </button>
            <span className="text-[11px] text-white/30 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1, z + 0.1))} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ZoomIn size={16} />
            </button>

            <button
              onClick={handleSavePDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/10 text-white text-[13px] font-medium rounded-lg hover:bg-white/15 transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Save PDF</span>
            </button>
            <button
              onClick={() => router.push(`/admin/estimates/${estimateId}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-lg hover:bg-[#C9A84C]/90 transition-colors"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Document Preview (zoomable, scrollable) ──── */}
      <div className="overflow-x-auto py-6 px-3">
        <div
          style={{
            width: '8.5in',
            minHeight: '11in',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            marginBottom: `calc(-11in * (1 - ${zoom}))`,
          }}
        >
          <div
            ref={docRef}
            className="bg-white text-black shadow-2xl"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              width: '8.5in',
              minHeight: '11in',
              padding: '0.6in 0.7in',
            }}
          >

            {/* ═══ 1. HEADER / LETTERHEAD ═══ */}
            <div className="print-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 24, borderBottom: '3px solid #1f2937', marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ro-unlimited-logo.png"
                  alt="RO Unlimited"
                  style={{ height: 48, width: 'auto', marginBottom: 8 }}
                />
                <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                  <div>Greenville, SC</div>
                  <div>(864) 304-0139</div>
                  <div>rounlimited.com</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>
                  Estimate
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
                  {estimate.estimate_number}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#6b7280', lineHeight: 1.8 }}>
                  <div><span style={{ color: '#9ca3af' }}>Date: </span>{fmtDate(estimate.created_at)}</div>
                  {estimate.valid_until && (
                    <div><span style={{ color: '#9ca3af' }}>Valid Until: </span>{fmtDate(estimate.valid_until)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ 2. CLIENT INFO ═══ */}
            {customer && (
              <div className="print-section" style={{ marginBottom: 24 }}>
                <div className="section-label" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Prepared For</div>
                <div className="client-box" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{customer.first_name} {customer.last_name}</div>
                  {customer.company_name && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{customer.company_name}</div>}
                  <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                    {(customer.address || customer.city) && (
                      <div>{[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</div>
                    )}
                    {customer.phone && <div>{customer.phone}</div>}
                    {customer.email && <div>{customer.email}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ 3. PROJECT DETAILS ═══ */}
            <div className="print-section" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Project Details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <tbody>
                  {estimate.project_name && (
                    <tr className="detail-table"><td style={{ padding: '6px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 500, width: 130, borderBottom: '1px solid #f3f4f6' }}>Project</td><td style={{ padding: '6px 16px', fontSize: 12, color: '#111', fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{estimate.project_name}</td></tr>
                  )}
                  {projectAddr && (
                    <tr><td style={{ padding: '6px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>Address</td><td style={{ padding: '6px 16px', fontSize: 12, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{projectAddr}</td></tr>
                  )}
                  {estimate.division && (
                    <tr><td style={{ padding: '6px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>Division</td><td style={{ padding: '6px 16px', fontSize: 12, color: '#374151', textTransform: 'capitalize', borderBottom: '1px solid #f3f4f6' }}>{estimate.division}</td></tr>
                  )}
                  {estimate.estimate_type && (
                    <tr><td style={{ padding: '6px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>Type</td><td style={{ padding: '6px 16px', fontSize: 12, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{humanize(estimate.estimate_type)}</td></tr>
                  )}
                  {estimate.contract_type && (
                    <tr><td style={{ padding: '6px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Contract</td><td style={{ padding: '6px 16px', fontSize: 12, color: '#374151' }}>{humanize(estimate.contract_type)}</td></tr>
                  )}
                </tbody>
              </table>

              {scopeText && scopeText !== '<p></p>' && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Scope of Work</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: scopeText }} />
                </div>
              )}
            </div>

            {/* ═══ 4. LINE ITEMS ═══ */}
            {Object.keys(grouped).length > 0 && (
              <div className="print-section" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Itemized Cost Breakdown</div>
                {Object.entries(grouped).map(([phase, items]) => (
                  <div key={phase} style={{ marginBottom: 16 }}>
                    <div className="phase-hdr" style={{ background: '#1f2937', color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 4px 0 0' }}>{phase}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr className="tbl-hdr" style={{ background: '#f3f4f6' }}>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 32 }}>#</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Description</th>
                          <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 50 }}>Qty</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 50 }}>Unit</th>
                          <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 85 }}>Unit Price</th>
                          <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 95 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          itemCounter++;
                          const lineTotal = item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100);
                          return (
                            <tr key={item.id} style={{ background: itemCounter % 2 === 0 ? '#fafafa' : 'white' }}>
                              <td style={{ padding: '5px 10px', fontSize: 11, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>{itemCounter}</td>
                              <td style={{ padding: '5px 10px', fontSize: 11, color: '#1f2937', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>{item.description || '--'}</td>
                              <td style={{ padding: '5px 10px', fontSize: 11, color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{item.quantity}</td>
                              <td style={{ padding: '5px 10px', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{item.unit}</td>
                              <td style={{ padding: '5px 10px', fontSize: 11, color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{fmt(item.unit_cost * (1 + (item.markup_percent || 0) / 100))}</td>
                              <td style={{ padding: '5px 10px', fontSize: 11, color: '#111', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{fmt(lineTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f3f4f6', borderTop: '2px solid #d1d5db' }}>
                          <td colSpan={5} style={{ padding: '6px 10px', fontSize: 10, color: '#6b7280', fontWeight: 600, textAlign: 'right', textTransform: 'uppercase' }}>{phase} Subtotal</td>
                          <td style={{ padding: '6px 10px', fontSize: 12, color: '#111', fontWeight: 700, textAlign: 'right' }}>{fmt(phaseSubtotals[phase])}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ 5. FINANCIAL SUMMARY ═══ */}
            <div className="print-section" style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 300, border: '2px solid #1f2937', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ background: '#1f2937', color: 'white', padding: '6px 16px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Financial Summary</div>
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>Subtotal</span>
                    <span style={{ color: '#111', fontWeight: 500 }}>{fmt(subtotal)}</span>
                  </div>
                  {estimate.overhead_percent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>Overhead ({estimate.overhead_percent}%)</span>
                      <span style={{ color: '#111', fontWeight: 500 }}>{fmt(overheadAmt)}</span>
                    </div>
                  )}
                  {estimate.markup_percent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>Markup ({estimate.markup_percent}%)</span>
                      <span style={{ color: '#111', fontWeight: 500 }}>{fmt(markupAmt)}</span>
                    </div>
                  )}
                  {estimate.tax_percent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>Tax ({estimate.tax_percent}%)</span>
                      <span style={{ color: '#111', fontWeight: 500 }}>{fmt(taxAmt)}</span>
                    </div>
                  )}
                  {(estimate.permit_fees || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>Permit Fees</span>
                      <span style={{ color: '#111', fontWeight: 500 }}>{fmt(estimate.permit_fees)}</span>
                    </div>
                  )}
                  {estimate.contingency_percent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>Contingency ({estimate.contingency_percent}%)</span>
                      <span style={{ color: '#111', fontWeight: 500 }}>{fmt(contingencyAmt)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '2px solid #1f2937', marginTop: 6, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ 6. PAYMENT SCHEDULE ═══ */}
            {paymentSchedule.length > 0 && (
              <div className="print-section" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Payment Schedule</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Milestone</th>
                      <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 60 }}>%</th>
                      <th style={{ textAlign: 'right', padding: '6px 12px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600, width: 110 }}>Amount</th>
                      <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>When Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSchedule.map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#1f2937', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>{m.milestone || `Milestone ${i + 1}`}</td>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#4b5563', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>{m.percent}%</td>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#111', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{fmt(m.amount)}</td>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{m.due_description || m.description || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>
                  A deposit may be required before work commences. Payment terms are net 15 days from invoice date unless otherwise specified.
                </div>
              </div>
            )}

            {/* ═══ 7. TERMS & CONDITIONS ═══ */}
            {selectedDisclaimers.length > 0 && (
              <div className="print-section" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Terms & Conditions</div>
                {selectedDisclaimers.map((d, i) => (
                  <div key={d.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>{i + 1}. {d.title}</div>
                    <div style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.5, paddingLeft: 12 }}>{d.body}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ 8. EXCLUSIONS ═══ */}
            {exclusionsList.length > 0 && (
              <div className="print-section" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Exclusions</div>
                <div style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic', marginBottom: 6 }}>The following items are NOT included in this estimate:</div>
                <ul style={{ paddingLeft: 20, fontSize: 11, color: '#4b5563', lineHeight: 1.6 }}>
                  {exclusionsList.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            {/* ═══ 9. ACCEPTANCE BLOCK ═══ */}
            <div className="print-section print-break-before" style={{ marginBottom: 24 }}>
              <div style={{ border: '2px solid #1f2937', borderRadius: 4, padding: 24 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Acceptance & Authorization</div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, marginBottom: 20 }}>
                  By signing below, you accept this estimate and authorize RO Unlimited Construction & Development to begin work as described above.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Client</div>
                    {estimate.client_signature ? (
                      <div style={{ borderBottom: '2px solid #1f2937', minHeight: 36, marginBottom: 4, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                        <img src={estimate.client_signature} alt="Signature" style={{ height: 40, width: 'auto' }} />
                      </div>
                    ) : (
                      <div style={{ borderBottom: '2px solid #1f2937', minHeight: 36, marginBottom: 4 }} />
                    )}
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Signature</div>
                    <div style={{ borderBottom: '1px solid #d1d5db', minHeight: 18, marginTop: 12, marginBottom: 4 }}>
                      {customer && <span style={{ fontSize: 11, color: '#374151' }}>{customer.first_name} {customer.last_name}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Printed Name</div>
                    <div style={{ borderBottom: '1px solid #d1d5db', minHeight: 18, marginTop: 12, marginBottom: 4 }}>
                      {estimate.client_signed_at && <span style={{ fontSize: 11, color: '#374151' }}>{fmtDate(estimate.client_signed_at)}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Date</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Contractor</div>
                    <div style={{ borderBottom: '2px solid #1f2937', minHeight: 36, marginBottom: 4 }} />
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Signature</div>
                    <div style={{ borderBottom: '1px solid #d1d5db', minHeight: 18, marginTop: 12, marginBottom: 4 }} />
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Printed Name</div>
                    <div style={{ borderBottom: '1px solid #d1d5db', minHeight: 18, marginTop: 12, marginBottom: 4 }} />
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Date</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ 10. FOOTER ═══ */}
            <div style={{ borderTop: '3px solid #1f2937', paddingTop: 12, marginTop: 24, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
              <div style={{ fontWeight: 600, color: '#6b7280' }}>Licensed and Insured | RO Unlimited Construction & Development</div>
              <div style={{ marginTop: 2 }}>This estimate is valid for {validDays} days from date of issue.</div>
              <div style={{ fontSize: 9, color: '#d1d5db', marginTop: 6 }}>(864) 304-0139 | rounlimited.com</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
