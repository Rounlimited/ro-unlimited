'use client';

import { useState, useMemo } from 'react';
import { Calculator, ArrowRightLeft, DollarSign, ListPlus } from 'lucide-react';

/**
 * Pricing step — with two front doors, because JR prices two ways:
 *
 *   ONE FIXED PRICE  — he types the number. That's the customer's price.
 *                      No markups, no margins, no math. (How he usually bids.)
 *   BUILD IT UP      — the itemized calculator: line items + overhead,
 *                      markup, tax, contingency.
 *
 * Fixed price rides on total_override, which the server now honors through
 * every recalculation — line-item edits, option changes, signing.
 */

interface FinancialData {
  overhead_percent: number;
  markup_percent: number;
  tax_percent: number;
  permit_fees: number;
  contingency_percent: number;
}

interface Props {
  subtotal: number;
  grandTotal: number;
  data: FinancialData;
  onChange: (data: Partial<FinancialData>) => void;
  totalOverride: number | null;
  onChangeTotalOverride: (val: number | null) => void;
}

export default function WizardStep5({ subtotal, grandTotal, data, onChange, totalOverride, onChangeTotalOverride }: Props) {
  const [converterMode, setConverterMode] = useState<'margin' | 'markup'>('markup');
  const [converterValue, setConverterValue] = useState('');
  const fixed = totalOverride !== null;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const overheadAmt = (subtotal * (data.overhead_percent || 0)) / 100;
  const markupAmt = (subtotal * (data.markup_percent || 0)) / 100;
  const taxable = subtotal + overheadAmt + markupAmt;
  const taxAmt = (taxable * (data.tax_percent || 0)) / 100;
  const contingencyAmt = (subtotal * (data.contingency_percent || 0)) / 100;

  // Margin <-> Markup converter
  const converted = useMemo(() => {
    const v = parseFloat(converterValue);
    if (isNaN(v) || v <= 0) return null;
    if (converterMode === 'markup') {
      const margin = (v / (100 + v)) * 100;
      return { label: 'Margin', value: margin.toFixed(2) };
    } else {
      if (v >= 100) return { label: 'Markup', value: 'N/A' };
      const markup = (v / (100 - v)) * 100;
      return { label: 'Markup', value: markup.toFixed(2) };
    }
  }, [converterMode, converterValue]);

  const inputClass = 'bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition-colors w-full';
  const labelClass = 'block text-[14px] font-medium text-white/70 mb-1.5';

  const PercentField = ({
    label,
    value,
    amount,
    field,
  }: {
    label: string;
    value: number;
    amount: number;
    field: keyof FinancialData;
  }) => (
    <div className="flex items-start gap-4 py-4 border-b border-white/5">
      <div className="flex-1">
        <label className={labelClass}>{label}</label>
        <div className="relative max-w-[160px]">
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange({ [field]: parseFloat(e.target.value) || 0 })}
            className={`${inputClass} pr-8`}
            min={0}
            step="any"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">%</span>
        </div>
      </div>
      <div className="text-right pt-7">
        <div className="text-[16px] font-medium text-white/80">{fmt(amount)}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ─── How do you want to price this job? ───────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { if (!fixed) onChangeTotalOverride(grandTotal > 0 ? Math.round(grandTotal) : 0); }}
          className="min-h-[64px] rounded-xl text-[16px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] transition-all"
          style={fixed
            ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '2px solid rgba(201,168,76,0.6)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="flex items-center gap-2"><DollarSign size={17} /> One Fixed Price</span>
          <span className="text-[12px] font-normal opacity-70">Type the number — done</span>
        </button>
        <button
          onClick={() => onChangeTotalOverride(null)}
          className="min-h-[64px] rounded-xl text-[16px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] transition-all"
          style={!fixed
            ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '2px solid rgba(201,168,76,0.6)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="flex items-center gap-2"><ListPlus size={17} /> Build It Up</span>
          <span className="text-[12px] font-normal opacity-70">Items, markup &amp; margins</span>
        </button>
      </div>

      {fixed ? (
        /* ─── ONE FIXED PRICE ─────────────────────────────────── */
        <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#D4772C]/10 border border-[#C9A84C]/40 rounded-xl p-6">
          <label className="block text-[16px] font-semibold text-white mb-2">Your contract price</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A84C] text-[24px] font-bold">$</span>
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              value={totalOverride || ''}
              onChange={e => onChangeTotalOverride(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full min-h-[64px] pl-10 pr-4 rounded-xl bg-[#1a1a1a] border-2 border-[#C9A84C]/50 text-[26px] font-bold text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]"
              min={0}
              step="0.01"
            />
          </div>
          <p className="text-[14px] text-white/60 mt-3">
            That&rsquo;s the number the customer sees — no markups, no math. Line items are
            optional on a fixed-price job; the scope of work carries the description.
          </p>
          {subtotal > 0 && (
            <p className="text-[13px] text-white/40 mt-2">
              For your reference only: the items you entered add up to {fmt(grandTotal)}.
            </p>
          )}
        </div>
      ) : (
        /* ─── BUILD IT UP — the itemized calculator ───────────── */
        <>
          {/* Subtotal (read-only) */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-white/60">Line Items Subtotal</span>
              <span className="text-[18px] font-semibold text-white">{fmt(subtotal)}</span>
            </div>
          </div>

          {/* Financial Fields */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-5">
            <PercentField label="Overhead" value={data.overhead_percent} amount={overheadAmt} field="overhead_percent" />
            <PercentField label="Markup" value={data.markup_percent} amount={markupAmt} field="markup_percent" />
            <PercentField label="Tax" value={data.tax_percent} amount={taxAmt} field="tax_percent" />

            {/* Permit Fees (flat dollar) */}
            <div className="flex items-start gap-4 py-4 border-b border-white/5">
              <div className="flex-1">
                <label className={labelClass}>Permit Fees</label>
                <div className="relative max-w-[160px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">$</span>
                  <input
                    type="number"
                    value={data.permit_fees || ''}
                    onChange={e => onChange({ permit_fees: parseFloat(e.target.value) || 0 })}
                    className={`${inputClass} pl-7`}
                    min={0}
                    step="any"
                  />
                </div>
              </div>
              <div className="text-right pt-7">
                <div className="text-[16px] font-medium text-white/80">{fmt(data.permit_fees || 0)}</div>
              </div>
            </div>

            <PercentField label="Contingency" value={data.contingency_percent} amount={contingencyAmt} field="contingency_percent" />
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#D4772C]/10 border border-[#C9A84C]/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold text-white">Grand Total</span>
              <span className="text-[28px] font-bold text-[#C9A84C]">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Margin vs Markup Converter */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-[#3b8dd4]" />
              <h4 className="text-[15px] font-semibold text-white">Margin / Markup Converter</h4>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[13px] text-white/50 mb-1">
                  {converterMode === 'markup' ? 'Markup %' : 'Margin %'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={converterValue}
                    onChange={e => setConverterValue(e.target.value)}
                    placeholder="Enter value..."
                    className={`${inputClass} pr-8`}
                    min={0}
                    step="any"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">%</span>
                </div>
              </div>
              <button
                onClick={() => setConverterMode(m => m === 'markup' ? 'margin' : 'markup')}
                className="mt-5 p-2.5 rounded-lg bg-white/5 text-[#3b8dd4] hover:bg-[#3b8dd4]/10 transition-colors"
                title="Swap"
              >
                <ArrowRightLeft size={18} />
              </button>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[13px] text-white/50 mb-1">
                  {converted?.label || (converterMode === 'markup' ? 'Margin %' : 'Markup %')}
                </label>
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-[15px] text-[#C9A84C] font-medium">
                  {converted ? `${converted.value}%` : '--'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
