'use client';

import { useState, useEffect } from 'react';
import {
  FileText, User, MapPin, DollarSign, ClipboardList,
  Send, Eye, Save, Loader2, X, CheckCircle2,
} from 'lucide-react';

interface Props {
  estimateId: string;
  step1: any;
  scopeHtml: string;
  lineItems: any[];
  financials: any;
  milestones: any[];
  disclaimerIds: string[];
  exclusions: string;
  subtotal: number;
  grandTotal: number;
  templateName: string | null;
  onSaveDraft: () => Promise<void> | void;
  saving: boolean;
}

interface EmailAccount {
  id: string;
  email: string;
  display_name: string;
}

export default function WizardStep8({
  estimateId,
  step1,
  scopeHtml,
  lineItems,
  financials,
  milestones,
  disclaimerIds,
  exclusions,
  subtotal,
  grandTotal,
  templateName,
  onSaveDraft,
  saving,
}: Props) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [sendForm, setSendForm] = useState({
    to_email: '',
    message: '',
    from_email: '',
  });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [savingForPreview, setSavingForPreview] = useState(false);

  const handlePreviewPdf = async () => {
    setSavingForPreview(true);
    try {
      await onSaveDraft();
    } catch {}
    setSavingForPreview(false);
    window.location.href = `/admin/estimates/${estimateId}/preview`;
  };

  // Load email accounts
  useEffect(() => {
    fetch('/api/admin/email-accounts')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setEmailAccounts(d);
          if (d.length > 0) setSendForm(f => ({ ...f, from_email: d[0].email }));
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill customer email
  useEffect(() => {
    if (step1.customer?.email && !sendForm.to_email) {
      setSendForm(f => ({ ...f, to_email: step1.customer.email }));
    }
  }, [step1.customer]);

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleSend = async () => {
    if (!sendForm.to_email) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: sendForm.to_email,
          message: sendForm.message,
          from_email: sendForm.from_email,
        }),
      });
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => {
          setShowSendModal(false);
          setSendSuccess(false);
        }, 2000);
      }
    } catch {}
    setSending(false);
  };

  // Group line items by phase
  const grouped: Record<string, any[]> = {};
  lineItems.forEach(i => {
    const p = i.phase || 'Other';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(i);
  });

  const overheadAmt = (subtotal * (financials.overhead_percent || 0)) / 100;
  const markupAmt = (subtotal * (financials.markup_percent || 0)) / 100;
  const taxable = subtotal + overheadAmt + markupAmt;
  const taxAmt = (taxable * (financials.tax_percent || 0)) / 100;
  const contingencyAmt = (subtotal * (financials.contingency_percent || 0)) / 100;

  const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
      <Icon size={16} className="text-[#C9A84C]" />
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-white/50">
        Review your estimate before saving or sending.
      </p>

      {/* Customer & Project Info */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-5">
        <SectionTitle icon={User} title="Customer & Project" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[14px]">
          <div>
            <span className="text-white/40">Customer: </span>
            <span className="text-white font-medium">
              {step1.customer ? `${step1.customer.first_name} ${step1.customer.last_name}` : '--'}
              {step1.customer?.company_name ? ` (${step1.customer.company_name})` : ''}
            </span>
          </div>
          <div>
            <span className="text-white/40">Project: </span>
            <span className="text-white font-medium">{step1.project_name || '--'}</span>
          </div>
          <div>
            <span className="text-white/40">Division: </span>
            <span className="text-white capitalize">{step1.division || '--'}</span>
          </div>
          <div>
            <span className="text-white/40">Estimate Type: </span>
            <span className="text-white capitalize">{(step1.estimate_type || '--').replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className="text-white/40">Contract: </span>
            <span className="text-white capitalize">{(step1.contract_type || '--').replace(/_/g, ' ')}</span>
          </div>
          {templateName && (
            <div>
              <span className="text-white/40">Template: </span>
              <span className="text-[#D4772C] font-medium">{templateName}</span>
            </div>
          )}
          {(step1.project_address || step1.project_city) && (
            <div className="sm:col-span-2">
              <span className="text-white/40">Address: </span>
              <span className="text-white">
                {[step1.project_address, step1.project_city, step1.project_state, step1.project_zip]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scope of Work */}
      {scopeHtml && scopeHtml !== '<p></p>' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <SectionTitle icon={ClipboardList} title="Scope of Work" />
          <div
            className="prose prose-invert prose-sm max-w-none text-[14px] text-white/70 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: scopeHtml }}
          />
        </div>
      )}

      {/* Line Items */}
      {lineItems.length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <SectionTitle icon={ClipboardList} title="Line Items" />
          {Object.entries(grouped).map(([phase, items]) => (
            <div key={phase} className="mb-4 last:mb-0">
              <div className="text-[13px] font-semibold text-[#D4772C] mb-2">{phase}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-white/40 border-b border-white/5">
                      <th className="text-left py-1.5 font-medium">Description</th>
                      <th className="text-left py-1.5 font-medium">Category</th>
                      <th className="text-right py-1.5 font-medium">Qty</th>
                      <th className="text-left py-1.5 font-medium pl-2">Unit</th>
                      <th className="text-right py-1.5 font-medium">Unit Cost</th>
                      <th className="text-right py-1.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item._key || item.id} className="border-b border-white/5 last:border-0">
                        <td className="py-1.5 text-white">{item.description || '--'}</td>
                        <td className="py-1.5 text-white/50 capitalize">{item.category}</td>
                        <td className="py-1.5 text-white/70 text-right">{item.quantity}</td>
                        <td className="py-1.5 text-white/50 pl-2">{item.unit}</td>
                        <td className="py-1.5 text-white/70 text-right">{fmt(item.unit_cost)}</td>
                        <td className="py-1.5 text-white font-medium text-right">{fmt(item.total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial Summary */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-5">
        <SectionTitle icon={DollarSign} title="Financial Summary" />
        <div className="space-y-2 text-[14px]">
          <div className="flex justify-between">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white">{fmt(subtotal)}</span>
          </div>
          {financials.overhead_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-white/50">Overhead ({financials.overhead_percent}%)</span>
              <span className="text-white">{fmt(overheadAmt)}</span>
            </div>
          )}
          {financials.markup_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-white/50">Markup ({financials.markup_percent}%)</span>
              <span className="text-white">{fmt(markupAmt)}</span>
            </div>
          )}
          {financials.tax_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-white/50">Tax ({financials.tax_percent}%)</span>
              <span className="text-white">{fmt(taxAmt)}</span>
            </div>
          )}
          {financials.permit_fees > 0 && (
            <div className="flex justify-between">
              <span className="text-white/50">Permit Fees</span>
              <span className="text-white">{fmt(financials.permit_fees)}</span>
            </div>
          )}
          {financials.contingency_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-white/50">Contingency ({financials.contingency_percent}%)</span>
              <span className="text-white">{fmt(contingencyAmt)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-white/10">
            <span className="text-[16px] font-semibold text-white">Grand Total</span>
            <span className="text-[20px] font-bold text-[#C9A84C]">{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      {milestones.length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <SectionTitle icon={DollarSign} title="Payment Schedule" />
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={m._key} className="flex items-center justify-between text-[14px] py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white font-medium">{m.milestone || `Milestone ${i + 1}`}</span>
                  {m.description && (
                    <span className="text-white/40 text-[13px] ml-2">{m.description}</span>
                  )}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className="text-[#C9A84C] font-medium">{fmt(m.amount)}</span>
                  <span className="text-white/40 text-[13px] ml-2">({m.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exclusions */}
      {exclusions && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <SectionTitle icon={FileText} title="Exclusions" />
          <div className="text-[14px] text-white/60 whitespace-pre-wrap leading-relaxed">
            {exclusions}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#111] border border-white/10 text-white text-[15px] font-medium rounded-xl hover:bg-[#1a1a1a] transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save as Draft
        </button>

        <button
          onClick={handlePreviewPdf}
          disabled={savingForPreview}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3b8dd4]/15 border border-[#3b8dd4]/30 text-[#3b8dd4] text-[15px] font-medium rounded-xl hover:bg-[#3b8dd4]/25 transition-colors disabled:opacity-40"
        >
          {savingForPreview ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
          {savingForPreview ? 'Saving...' : 'Preview PDF'}
        </button>

        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A84C] text-black text-[15px] font-semibold rounded-xl hover:bg-[#C9A84C]/90 transition-colors"
        >
          <Send size={18} />
          Send to Customer
        </button>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={() => !sending && setShowSendModal(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-[16px] font-semibold text-white">Send Estimate</h3>
              <button onClick={() => setShowSendModal(false)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {sendSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={48} className="text-green-400 mx-auto mb-3" />
                <div className="text-[16px] font-semibold text-white">Estimate Sent!</div>
                <div className="text-[14px] text-white/50 mt-1">Email delivered to {sendForm.to_email}</div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[14px] font-medium text-white/70 mb-1.5">To Email *</label>
                  <input
                    value={sendForm.to_email}
                    onChange={e => setSendForm(f => ({ ...f, to_email: e.target.value }))}
                    type="email"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-white/70 mb-1.5">From Account</label>
                  <select
                    value={sendForm.from_email}
                    onChange={e => setSendForm(f => ({ ...f, from_email: e.target.value }))}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[15px] focus:outline-none focus:border-[#C9A84C]/50 transition-colors appearance-none cursor-pointer"
                  >
                    {emailAccounts.map(a => (
                      <option key={a.id} value={a.email}>{a.display_name} ({a.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-white/70 mb-1.5">Message (optional)</label>
                  <textarea
                    value={sendForm.message}
                    onChange={e => setSendForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Add a personal message..."
                    rows={4}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-[14px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="px-4 py-2.5 text-[14px] text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !sendForm.to_email}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#C9A84C] text-black text-[14px] font-semibold rounded-lg hover:bg-[#C9A84C]/90 disabled:opacity-40 transition-all"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
