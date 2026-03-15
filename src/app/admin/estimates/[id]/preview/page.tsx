'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Printer, Send, Loader2 } from 'lucide-react';

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
  notes?: string;
}

interface PaymentMilestone {
  id: string;
  milestone: string;
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
  division?: string;
  estimate_type?: string;
  contract_type?: string;
  scope_of_work?: string;
  overhead_percent: number;
  markup_percent: number;
  tax_percent: number;
  contingency_percent: number;
  permit_fees: number;
  subtotal: number;
  overhead_amount: number;
  markup_amount: number;
  tax_amount: number;
  contingency_amount: number;
  total: number;
  valid_until?: string;
  valid_days?: number;
  exclusions?: string;
  disclaimer_ids?: string[];
  notes?: string;
  client_signature?: string;
  client_signed_at?: string;
  created_at: string;
  updated_at: string;
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

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!estimateId) return;

    const load = async () => {
      try {
        const [estRes, discRes] = await Promise.all([
          fetch(`/api/admin/estimates/${estimateId}`),
          fetch('/api/admin/disclaimers'),
        ]);

        if (!estRes.ok) {
          setError('Estimate not found');
          setLoading(false);
          return;
        }

        const estData = await estRes.json();
        setEstimate(estData);

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
        <div className="text-[18px] font-semibold text-red-400 mb-2">
          {error || 'Estimate not found'}
        </div>
        <button
          onClick={() => router.push('/admin/estimates')}
          className="mt-4 px-5 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
        >
          Back to Estimates
        </button>
      </div>
    );
  }

  /* ─── Data prep ──────────────────────────────────────────── */

  const customer = estimate.customer;

  // Group line items by phase
  const grouped: Record<string, LineItem[]> = {};
  (estimate.line_items || []).forEach((item) => {
    const p = item.phase || 'Other';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(item);
  });

  // Recalculate totals from line items for accuracy
  const subtotal = (estimate.line_items || []).reduce(
    (sum, item) =>
      sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100),
    0
  );
  const overheadAmt = (subtotal * (estimate.overhead_percent || 0)) / 100;
  const markupAmt = (subtotal * (estimate.markup_percent || 0)) / 100;
  const taxable = subtotal + overheadAmt + markupAmt;
  const taxAmt = (taxable * (estimate.tax_percent || 0)) / 100;
  const contingencyAmt = (subtotal * (estimate.contingency_percent || 0)) / 100;
  const grandTotal =
    subtotal +
    overheadAmt +
    markupAmt +
    taxAmt +
    (estimate.permit_fees || 0) +
    contingencyAmt;

  // Get selected disclaimers
  const selectedDisclaimers = (estimate.disclaimer_ids || [])
    .map((id) => disclaimers.find((d) => d.id === id))
    .filter(Boolean) as Disclaimer[];

  // Exclusions as array
  const exclusionsList = (estimate.exclusions || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  // Valid days
  const validDays = estimate.valid_until
    ? Math.max(
        0,
        Math.ceil(
          (new Date(estimate.valid_until).getTime() - new Date(estimate.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : estimate.valid_days || 30;

  // Phase subtotals
  const phaseSubtotals: Record<string, number> = {};
  Object.entries(grouped).forEach(([phase, items]) => {
    phaseSubtotals[phase] = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100),
      0
    );
  });

  // Payment schedule with recalculated amounts
  const paymentSchedule = (estimate.payment_schedule || []).map((m) => ({
    ...m,
    amount: (grandTotal * (m.percent || 0)) / 100,
  }));

  /* ─── Line item row counter ─────────────────────────────── */
  let itemCounter = 0;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          .no-print { display: none !important; }

          /* Reset page */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Page setup */
          @page {
            size: letter;
            margin: 0.6in 0.7in;
          }

          /* The document wrapper */
          .print-area {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
          }

          /* Page background */
          .preview-bg {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }

          /* Table handling */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }

          /* Section page breaks */
          .print-section { page-break-inside: avoid; }
          .print-break-before { page-break-before: always; }

          /* Page numbers via CSS counter */
          .print-area {
            counter-reset: page-num;
          }

          .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #999;
            padding: 8px 0;
          }
        }

        /* Screen preview styles */
        @media screen {
          .print-area {
            font-family: 'Georgia', 'Times New Roman', serif;
          }
        }
      `}</style>

      <div className="h-full overflow-y-auto preview-bg bg-[#0a0a0a]">
        {/* ─── Toolbar (hidden in print) ────────────────────── */}
        <div className="no-print sticky top-0 z-50 bg-[#111]/95 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-3">
          <div className="max-w-[900px] mx-auto flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[14px] text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/10 text-white text-[14px] font-medium rounded-lg hover:bg-white/15 transition-colors"
              >
                <Printer size={16} />
                Print / Save PDF
              </button>
              <button
                onClick={() => router.push(`/admin/estimates/${estimateId}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black text-[14px] font-semibold rounded-lg hover:bg-[#C9A84C]/90 transition-colors"
              >
                <Send size={16} />
                Send to Customer
              </button>
            </div>
          </div>
        </div>

        {/* ─── Document Preview ─────────────────────────────── */}
        <div className="no-print py-8" />
        <div className="max-w-[850px] mx-auto px-4 sm:px-0 pb-12">
          <div className="print-area bg-white text-black rounded-lg shadow-2xl overflow-hidden" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            <div className="px-10 sm:px-14 py-10 sm:py-12">

              {/* ═══════════════════════════════════════════════
                  1. HEADER / LETTERHEAD
                  ═══════════════════════════════════════════════ */}
              <div className="print-section flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-gray-800 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/ro-unlimited-logo-transparent.png"
                      alt="RO Unlimited"
                      className="h-14 sm:h-16 w-auto object-contain"
                    />
                  </div>
                  <div className="text-[18px] sm:text-[20px] font-bold text-gray-900 tracking-tight leading-tight">
                    RO Unlimited Construction<br />& Development
                  </div>
                  <div className="mt-3 text-[11px] sm:text-[12px] text-gray-500 leading-relaxed space-y-0.5">
                    <div>Greenville, SC</div>
                    <div>(864) 304-0139</div>
                    <div>rounlimited.com</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-gray-400 font-medium mb-1">
                    Estimate
                  </div>
                  <div className="text-[22px] sm:text-[26px] font-bold text-gray-900 tracking-tight">
                    {estimate.estimate_number}
                  </div>
                  <div className="mt-3 space-y-1 text-[12px] text-gray-600">
                    <div>
                      <span className="text-gray-400">Date: </span>
                      {fmtDate(estimate.created_at)}
                    </div>
                    {estimate.valid_until && (
                      <div>
                        <span className="text-gray-400">Valid Until: </span>
                        {fmtDate(estimate.valid_until)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════
                  2. CLIENT INFORMATION
                  ═══════════════════════════════════════════════ */}
              {customer && (
                <div className="print-section mb-8">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2">
                    Prepared For
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-5 py-4">
                    <div className="text-[15px] font-bold text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </div>
                    {customer.company_name && (
                      <div className="text-[13px] text-gray-600 mt-0.5">
                        {customer.company_name}
                      </div>
                    )}
                    <div className="mt-2 text-[12px] text-gray-500 space-y-0.5">
                      {(customer.address || customer.city) && (
                        <div>
                          {[customer.address, customer.city, customer.state, customer.zip]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      {customer.phone && <div>{customer.phone}</div>}
                      {customer.email && <div>{customer.email}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════
                  3. PROJECT DETAILS
                  ═══════════════════════════════════════════════ */}
              <div className="print-section mb-8">
                <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2">
                  Project Details
                </div>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {estimate.project_name && (
                        <tr className="border-b border-gray-100">
                          <td className="px-5 py-2.5 text-gray-400 font-medium w-[140px]">
                            Project
                          </td>
                          <td className="px-5 py-2.5 text-gray-900 font-semibold">
                            {estimate.project_name}
                          </td>
                        </tr>
                      )}
                      {estimate.project_address && (
                        <tr className="border-b border-gray-100">
                          <td className="px-5 py-2.5 text-gray-400 font-medium">Address</td>
                          <td className="px-5 py-2.5 text-gray-700">
                            {estimate.project_address}
                          </td>
                        </tr>
                      )}
                      {estimate.division && (
                        <tr className="border-b border-gray-100">
                          <td className="px-5 py-2.5 text-gray-400 font-medium">Division</td>
                          <td className="px-5 py-2.5 text-gray-700 capitalize">
                            {estimate.division}
                          </td>
                        </tr>
                      )}
                      {estimate.estimate_type && (
                        <tr className="border-b border-gray-100">
                          <td className="px-5 py-2.5 text-gray-400 font-medium">Estimate Type</td>
                          <td className="px-5 py-2.5 text-gray-700">
                            {humanize(estimate.estimate_type)}
                          </td>
                        </tr>
                      )}
                      {estimate.contract_type && (
                        <tr>
                          <td className="px-5 py-2.5 text-gray-400 font-medium">Contract Type</td>
                          <td className="px-5 py-2.5 text-gray-700">
                            {humanize(estimate.contract_type)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Scope of Work */}
                {estimate.scope_of_work &&
                  estimate.scope_of_work !== '<p></p>' && (
                    <div className="mt-5">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2">
                        Scope of Work
                      </div>
                      <div
                        className="text-[13px] text-gray-700 leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700"
                        dangerouslySetInnerHTML={{ __html: estimate.scope_of_work }}
                      />
                    </div>
                  )}
              </div>

              {/* ═══════════════════════════════════════════════
                  4. ITEMIZED COST BREAKDOWN
                  ═══════════════════════════════════════════════ */}
              {Object.keys(grouped).length > 0 && (
                <div className="print-section mb-8">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">
                    Itemized Cost Breakdown
                  </div>

                  {Object.entries(grouped).map(([phase, items]) => (
                    <div key={phase} className="mb-5 last:mb-0">
                      {/* Phase Header */}
                      <div className="bg-gray-800 text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-t-md">
                        {phase}
                      </div>

                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                            <th className="text-left px-3 py-2 font-semibold w-[40px]">#</th>
                            <th className="text-left px-3 py-2 font-semibold">Description</th>
                            <th className="text-right px-3 py-2 font-semibold w-[55px]">Qty</th>
                            <th className="text-left px-3 py-2 font-semibold w-[55px]">Unit</th>
                            <th className="text-right px-3 py-2 font-semibold w-[90px]">Unit Price</th>
                            <th className="text-right px-3 py-2 font-semibold w-[100px]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => {
                            itemCounter++;
                            const lineTotal =
                              item.quantity *
                              item.unit_cost *
                              (1 + (item.markup_percent || 0) / 100);
                            const isEven = itemCounter % 2 === 0;
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-gray-100 text-[12px] ${
                                  isEven ? 'bg-gray-50' : 'bg-white'
                                }`}
                              >
                                <td className="px-3 py-2 text-gray-400">{itemCounter}</td>
                                <td className="px-3 py-2 text-gray-800 font-medium">
                                  {item.description || '--'}
                                </td>
                                <td className="px-3 py-2 text-gray-600 text-right">
                                  {item.quantity}
                                </td>
                                <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                                <td className="px-3 py-2 text-gray-600 text-right">
                                  {fmt(
                                    item.unit_cost * (1 + (item.markup_percent || 0) / 100)
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-900 font-semibold text-right">
                                  {fmt(lineTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 border-t-2 border-gray-300">
                            <td colSpan={5} className="px-3 py-2 text-[11px] text-gray-500 font-semibold text-right uppercase">
                              {phase} Subtotal
                            </td>
                            <td className="px-3 py-2 text-[13px] text-gray-900 font-bold text-right">
                              {fmt(phaseSubtotals[phase])}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══════════════════════════════════════════════
                  5. FINANCIAL SUMMARY
                  ═══════════════════════════════════════════════ */}
              <div className="print-section mb-8">
                <div className="flex justify-end">
                  <div className="w-full sm:w-[320px] border-2 border-gray-800 rounded-md overflow-hidden">
                    <div className="bg-gray-800 text-white px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold">
                      Financial Summary
                    </div>
                    <div className="px-5 py-3 space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-900 font-medium">{fmt(subtotal)}</span>
                      </div>
                      {estimate.overhead_percent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Overhead ({estimate.overhead_percent}%)
                          </span>
                          <span className="text-gray-900 font-medium">{fmt(overheadAmt)}</span>
                        </div>
                      )}
                      {estimate.markup_percent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Markup ({estimate.markup_percent}%)
                          </span>
                          <span className="text-gray-900 font-medium">{fmt(markupAmt)}</span>
                        </div>
                      )}
                      {estimate.tax_percent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Tax ({estimate.tax_percent}%)
                          </span>
                          <span className="text-gray-900 font-medium">{fmt(taxAmt)}</span>
                        </div>
                      )}
                      {estimate.permit_fees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Permit Fees</span>
                          <span className="text-gray-900 font-medium">
                            {fmt(estimate.permit_fees)}
                          </span>
                        </div>
                      )}
                      {estimate.contingency_percent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Contingency ({estimate.contingency_percent}%)
                          </span>
                          <span className="text-gray-900 font-medium">
                            {fmt(contingencyAmt)}
                          </span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-800 pt-3 mt-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[14px] font-bold text-gray-900 uppercase tracking-wide">
                            Total
                          </span>
                          <span className="text-[22px] font-bold text-gray-900">
                            {fmt(grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════
                  6. PAYMENT SCHEDULE
                  ═══════════════════════════════════════════════ */}
              {paymentSchedule.length > 0 && (
                <div className="print-section mb-8">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">
                    Payment Schedule
                  </div>
                  <table className="w-full border-collapse border border-gray-200 rounded-md overflow-hidden">
                    <thead>
                      <tr className="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                        <th className="text-left px-4 py-2.5 font-semibold">Milestone</th>
                        <th className="text-center px-4 py-2.5 font-semibold w-[70px]">%</th>
                        <th className="text-right px-4 py-2.5 font-semibold w-[120px]">Amount</th>
                        <th className="text-left px-4 py-2.5 font-semibold">When Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((m, i) => (
                        <tr
                          key={m.id || i}
                          className={`border-b border-gray-100 text-[12px] ${
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-2.5 text-gray-800 font-medium">
                            {m.milestone || `Milestone ${i + 1}`}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 text-center">
                            {m.percent}%
                          </td>
                          <td className="px-4 py-2.5 text-gray-900 font-semibold text-right">
                            {fmt(m.amount)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {m.description || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-[11px] text-gray-400 italic">
                    A deposit may be required before work commences. Payment terms are net 15 days
                    from invoice date unless otherwise specified.
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════
                  7. TERMS & CONDITIONS
                  ═══════════════════════════════════════════════ */}
              {selectedDisclaimers.length > 0 && (
                <div className="print-section mb-8">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">
                    Terms & Conditions
                  </div>
                  <div className="space-y-4">
                    {selectedDisclaimers.map((d, i) => (
                      <div key={d.id}>
                        <div className="text-[12px] font-bold text-gray-800 mb-1">
                          {i + 1}. {d.title}
                        </div>
                        <div className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap pl-4">
                          {d.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════
                  8. EXCLUSIONS
                  ═══════════════════════════════════════════════ */}
              {exclusionsList.length > 0 && (
                <div className="print-section mb-8">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">
                    Exclusions
                  </div>
                  <div className="text-[12px] text-gray-600 leading-relaxed">
                    <p className="text-[11px] text-gray-500 italic mb-2">
                      The following items are NOT included in this estimate:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {exclusionsList.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════
                  9. ACCEPTANCE BLOCK
                  ═══════════════════════════════════════════════ */}
              <div className="print-section print-break-before mb-8">
                <div className="border-2 border-gray-800 rounded-md p-6 sm:p-8">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">
                    Acceptance & Authorization
                  </div>
                  <p className="text-[12px] text-gray-600 leading-relaxed mb-6">
                    By signing below, you accept this estimate and authorize RO Unlimited
                    Construction & Development to begin work as described above. This acceptance
                    constitutes a binding agreement subject to the terms and conditions stated
                    herein.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                    {/* Client Signature */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-gray-400 font-semibold mb-2">
                        Client
                      </div>
                      {estimate.client_signature ? (
                        <div className="border-b-2 border-gray-800 pb-1 mb-2 min-h-[48px] flex items-end">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={estimate.client_signature}
                            alt="Client Signature"
                            className="h-12 w-auto"
                          />
                        </div>
                      ) : (
                        <div className="border-b-2 border-gray-800 pb-1 mb-2 min-h-[48px]" />
                      )}
                      <div className="text-[10px] text-gray-400">Signature</div>

                      <div className="mt-4 border-b border-gray-300 pb-1 mb-1 min-h-[20px]">
                        {customer && (
                          <span className="text-[12px] text-gray-700">
                            {customer.first_name} {customer.last_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">Printed Name</div>

                      <div className="mt-4 border-b border-gray-300 pb-1 mb-1 min-h-[20px]">
                        {estimate.client_signed_at && (
                          <span className="text-[12px] text-gray-700">
                            {fmtDate(estimate.client_signed_at)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">Date</div>
                    </div>

                    {/* Contractor Signature */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-gray-400 font-semibold mb-2">
                        Contractor
                      </div>
                      <div className="border-b-2 border-gray-800 pb-1 mb-2 min-h-[48px]" />
                      <div className="text-[10px] text-gray-400">Signature</div>

                      <div className="mt-4 border-b border-gray-300 pb-1 mb-1 min-h-[20px]" />
                      <div className="text-[10px] text-gray-400">Printed Name</div>

                      <div className="mt-4 border-b border-gray-300 pb-1 mb-1 min-h-[20px]" />
                      <div className="text-[10px] text-gray-400">Date</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════
                  10. FOOTER
                  ═══════════════════════════════════════════════ */}
              <div className="print-section border-t-2 border-gray-800 pt-4 mt-8">
                <div className="text-center text-[10px] text-gray-400 space-y-1">
                  <div className="font-semibold text-gray-500">
                    Licensed and Insured | RO Unlimited Construction & Development
                  </div>
                  <div>
                    This estimate is valid for {validDays} days from date of issue.
                  </div>
                  <div className="text-[9px] text-gray-300 mt-2">
                    (864) 304-0139 | rounlimited.com
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <div className="no-print py-8" />
      </div>
    </>
  );
}
