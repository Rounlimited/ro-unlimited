'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Check, Save, LogOut,
  User, LayoutTemplate, FileText, ClipboardList,
  DollarSign, CalendarDays, Shield, Send, Loader2,
} from 'lucide-react';
import WizardStep1 from '@/components/admin/estimates/WizardStep1';
import WizardStep2 from '@/components/admin/estimates/WizardStep2';
import WizardStep3 from '@/components/admin/estimates/WizardStep3';
import WizardStep4 from '@/components/admin/estimates/WizardStep4';
import WizardStep5 from '@/components/admin/estimates/WizardStep5';
import WizardStep6 from '@/components/admin/estimates/WizardStep6';
import WizardStep7 from '@/components/admin/estimates/WizardStep7';
import WizardStep8 from '@/components/admin/estimates/WizardStep8';

/* ─── Types ──────────────────────────────────────────────────── */

interface Step1Data {
  customer_id: string;
  customer?: any;
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

interface LineItem {
  _key: string;
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

interface Milestone {
  _key: string;
  milestone: string;
  percent: number;
  amount: number;
  description: string;
}

/* ─── Constants ──────────────────────────────────────────────── */

const STEPS = [
  { num: 1, label: 'Customer', icon: User },
  { num: 2, label: 'Template', icon: LayoutTemplate },
  { num: 3, label: 'Scope', icon: FileText },
  { num: 4, label: 'Line Items', icon: ClipboardList },
  { num: 5, label: 'Financials', icon: DollarSign },
  { num: 6, label: 'Payments', icon: CalendarDays },
  { num: 7, label: 'Terms', icon: Shield },
  { num: 8, label: 'Review', icon: Send },
];

/* ─── Main Component ─────────────────────────────────────────── */

export default function NewEstimateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer') || undefined;
  const editId = searchParams.get('edit') || null;
  const editStep = searchParams.get('step') ? parseInt(searchParams.get('step')!) : null;

  const [currentStep, setCurrentStep] = useState(editStep || 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [estimateId, setEstimateId] = useState<string | null>(editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(!!editId);

  // Step 1 data
  const [step1, setStep1] = useState<Step1Data>({
    customer_id: '',
    document_mode: 'estimate',
    division: '',
    estimate_type: '',
    contract_type: 'fixed_price',
    project_name: '',
    project_address: '',
    project_city: '',
    project_state: 'SC',
    project_zip: '',
  });

  // Step 2 data
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);

  // Step 3 data
  const [scopeHtml, setScopeHtml] = useState('');

  // Step 4 data
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Step 5 data
  const [financials, setFinancials] = useState({
    overhead_percent: 0,
    markup_percent: 0,
    tax_percent: 0,
    permit_fees: 0,
    contingency_percent: 0,
  });

  // Step 6 data
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Total override
  const [totalOverride, setTotalOverride] = useState<number | null>(null);

  // Timeline data (inside Step 6)
  const [timeline, setTimeline] = useState({
    project_start_date: '',
    project_duration_days: 0,
    weather_days: 0,
    schedule_notes: '',
  });

  // Step 7 data
  const [disclaimerIds, setDisclaimerIds] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState('');
  const [inclusions, setInclusions] = useState('');

  /* ─── Load existing draft ──────────────────────────────────── */

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;

    async function loadDraft() {
      try {
        const res = await fetch(`/api/admin/estimates/${editId}`);
        if (!res.ok) throw new Error('Failed to load estimate');
        const data = await res.json();
        if (cancelled) return;

        // Populate Step 1
        setStep1({
          customer_id: data.customer_id || '',
          customer: data.customer || data.customers || null,
          document_mode: data.document_mode || 'estimate',
          division: data.division || '',
          estimate_type: data.estimate_type || '',
          contract_type: data.contract_type || 'fixed_price',
          project_name: data.project_name || '',
          project_address: data.project_address || '',
          project_city: data.project_city || '',
          project_state: data.project_state || 'SC',
          project_zip: data.project_zip || '',
        });

        // Step 2
        if (data.template_id) setSelectedTemplateId(data.template_id);

        // Step 3
        setScopeHtml(data.scope_of_work || data.project_description || '');

        // Step 4 — line items
        if (data.line_items?.length) {
          setLineItems(data.line_items.map((li: any, idx: number) => ({
            _key: `load_${li.id || idx}`,
            id: li.id,
            phase: li.phase || 'Other',
            description: li.description || '',
            category: li.category || 'material',
            quantity: li.quantity || 1,
            unit: li.unit || 'each',
            unit_cost: li.unit_cost || 0,
            markup_percent: li.markup_percent || 0,
            total: li.total || 0,
            sort_order: li.sort_order || idx,
          })));
        }

        // Step 5 — financials
        setFinancials({
          overhead_percent: data.overhead_percent || 0,
          markup_percent: data.markup_percent || 0,
          tax_percent: data.tax_percent || 0,
          permit_fees: data.permit_fees || 0,
          contingency_percent: data.contingency_percent || 0,
        });

        // Step 6 — payment schedule
        if (data.payment_schedule?.length) {
          setMilestones(data.payment_schedule.map((ps: any, idx: number) => ({
            _key: `load_ps_${ps.id || idx}`,
            milestone: ps.milestone || '',
            percent: ps.percent || 0,
            amount: ps.amount || 0,
            description: ps.due_description || ps.description || '',
          })));
        }

        // Total override
        if (data.total_override != null) setTotalOverride(data.total_override);

        // Timeline
        if (data.project_start_date || data.project_duration_days) {
          setTimeline({
            project_start_date: data.project_start_date || '',
            project_duration_days: data.project_duration_days || 0,
            weather_days: data.weather_days || 0,
            schedule_notes: data.schedule_notes || '',
          });
        }

        // Step 7 — disclaimers, exclusions & inclusions
        if (data.disclaimer_ids?.length) setDisclaimerIds(data.disclaimer_ids);
        if (data.exclusions) setExclusions(data.exclusions);
        if (data.inclusions) setInclusions(data.inclusions);

        // Mark all steps up to current as completed
        const startStep = editStep || 1;
        const completed = new Set<number>();
        for (let i = 1; i < startStep; i++) completed.add(i);
        // If the estimate has data, mark those steps complete
        if (data.customer_id) completed.add(1);
        if (data.template_id) completed.add(2);
        if (data.scope_of_work || data.project_description) completed.add(3);
        if (data.line_items?.length) completed.add(4);
        if (data.overhead_percent || data.markup_percent) completed.add(5);
        if (data.payment_schedule?.length) completed.add(6);
        if (data.disclaimer_ids?.length || data.exclusions) completed.add(7);
        setCompletedSteps(completed);

      } catch (err) {
        console.error('Failed to load draft:', err);
        setError('Failed to load estimate draft');
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    }

    loadDraft();
    return () => { cancelled = true; };
  }, [editId, editStep]);

  /* ─── Calculations ──────────────────────────────────────────── */

  const subtotal = useMemo(
    () => lineItems.reduce((s, i) => s + (i.total || 0), 0),
    [lineItems]
  );

  const grandTotal = useMemo(() => {
    const oh = (subtotal * (financials.overhead_percent || 0)) / 100;
    const mu = (subtotal * (financials.markup_percent || 0)) / 100;
    const taxable = subtotal + oh + mu;
    const tax = (taxable * (financials.tax_percent || 0)) / 100;
    const cont = (subtotal * (financials.contingency_percent || 0)) / 100;
    return subtotal + oh + mu + tax + (financials.permit_fees || 0) + cont;
  }, [subtotal, financials]);

  /* ─── API helpers ───────────────────────────────────────────── */

  const createEstimate = async (): Promise<string | null> => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: step1.customer_id,
          document_mode: step1.document_mode || 'estimate',
          project_name: step1.project_name,
          project_address: step1.project_address || null,
          project_city: step1.project_city || null,
          project_state: step1.project_state || 'SC',
          project_zip: step1.project_zip || null,
          division: step1.division,
          estimate_type: step1.estimate_type,
          contract_type: step1.contract_type,
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (data?.id) {
        setEstimateId(data.id);
        return data.id;
      }
      setError(data?.error || 'Failed to create estimate');
      return null;
    } catch {
      setError('Network error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const patchEstimate = async (fields: Record<string, any>) => {
    if (!estimateId) return;
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('PATCH estimate failed:', res.status, err);
      }
    } catch (err) {
      console.error('PATCH estimate error:', err);
    }
  };

  const saveLineItems = async () => {
    if (!estimateId) return;
    const items = lineItems.map((item, idx) => ({
      ...(item.id ? { id: item.id } : {}),
      phase: item.phase,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost,
      markup_percent: item.markup_percent,
      sort_order: idx,
    }));
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}/line-items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        console.error('Save line items failed:', res.status, await res.text().catch(() => ''));
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setLineItems(prev =>
          prev.map((item, idx) => ({
            ...item,
            id: data[idx]?.id || item.id,
          }))
        );
      }
    } catch (err) {
      console.error('Save line items error:', err);
    }
  };

  const savePaymentSchedule = async () => {
    if (!estimateId) return;
    const items = milestones.map((m, idx) => ({
      milestone: m.milestone,
      description: m.description,
      percent: m.percent,
      amount: m.amount,
      sort_order: idx,
    }));
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}/payment-schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        console.error('Save payment schedule failed:', res.status, await res.text().catch(() => ''));
      }
    } catch (err) {
      console.error('Save payment schedule error:', err);
    }
  };

  /* ─── Step Navigation ───────────────────────────────────────── */

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(step1.customer_id && step1.division && step1.estimate_type && step1.project_name);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canProceed(currentStep)) return;
    setSaving(true);
    setError('');

    try {
      switch (currentStep) {
        case 1: {
          if (!estimateId) {
            const id = await createEstimate();
            if (!id) return;
          } else {
            await patchEstimate({
              customer_id: step1.customer_id,
              project_name: step1.project_name,
              project_address: step1.project_address || null,
              project_city: step1.project_city || null,
              project_state: step1.project_state || 'SC',
              project_zip: step1.project_zip || null,
              contract_type: step1.contract_type,
              division: step1.division,
              estimate_type: step1.estimate_type,
            });
          }
          break;
        }
        case 2: {
          if (selectedTemplateId) {
            await patchEstimate({ template_id: selectedTemplateId });
          }
          break;
        }
        case 3: {
          await patchEstimate({ scope_of_work: scopeHtml });
          break;
        }
        case 4: {
          await saveLineItems();
          break;
        }
        case 5: {
          await patchEstimate({
            overhead_percent: financials.overhead_percent,
            markup_percent: financials.markup_percent,
            tax_percent: financials.tax_percent,
            permit_fees: financials.permit_fees,
            contingency_percent: financials.contingency_percent,
          });
          break;
        }
        case 6: {
          await savePaymentSchedule();
          await patchEstimate({
            project_start_date: timeline.project_start_date || null,
            project_duration_days: timeline.project_duration_days || null,
            weather_days: timeline.weather_days || 0,
            schedule_notes: timeline.schedule_notes || null,
          });
          break;
        }
        case 7: {
          await patchEstimate({
            disclaimer_ids: disclaimerIds,
            exclusions,
            inclusions,
          });
          break;
        }
      }

      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < 8) setCurrentStep(currentStep + 1);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const saveCurrentStep = async () => {
    if (!estimateId) return;
    try {
      switch (currentStep) {
        case 1:
          await patchEstimate({
            customer_id: step1.customer_id,
            project_name: step1.project_name,
            project_address: step1.project_address || null,
            project_city: step1.project_city || null,
            project_state: step1.project_state || 'SC',
            project_zip: step1.project_zip || null,
            division: step1.division,
            estimate_type: step1.estimate_type,
            contract_type: step1.contract_type,
          });
          break;
        case 3:
          await patchEstimate({ scope_of_work: scopeHtml });
          break;
        case 4:
          await saveLineItems();
          break;
        case 5:
          await patchEstimate({
            overhead_percent: financials.overhead_percent,
            markup_percent: financials.markup_percent,
            tax_percent: financials.tax_percent,
            permit_fees: financials.permit_fees,
            contingency_percent: financials.contingency_percent,
          });
          break;
        case 6:
          await savePaymentSchedule();
          await patchEstimate({
            project_start_date: timeline.project_start_date || null,
            project_duration_days: timeline.project_duration_days || null,
            weather_days: timeline.weather_days || 0,
            schedule_notes: timeline.schedule_notes || null,
          });
          break;
        case 7:
          await patchEstimate({ disclaimer_ids: disclaimerIds, exclusions, inclusions });
          break;
      }
    } catch {}
  };

  const goToStep = async (step: number) => {
    // Can go to completed steps, current step, or one beyond completed
    if (step <= currentStep || completedSteps.has(step) || completedSteps.has(step - 1)) {
      // Auto-save current step before jumping
      await saveCurrentStep();
      setCurrentStep(step);
    }
  };

  const handleSaveAndExit = async () => {
    setSaving(true);
    await saveCurrentStep();
    setSaving(false);
    router.push('/admin/estimates');
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (estimateId) {
        // Save line items & payment schedule FIRST so recalc uses new data
        await saveLineItems();
        await savePaymentSchedule();
        // Then save all estimate fields (financial recalc will use new line items)
        await patchEstimate({
          status: 'draft',
          customer_id: step1.customer_id,
          project_name: step1.project_name,
          project_address: step1.project_address || null,
          project_city: step1.project_city || null,
          project_state: step1.project_state || 'SC',
          project_zip: step1.project_zip || null,
          division: step1.division,
          estimate_type: step1.estimate_type,
          contract_type: step1.contract_type,
          scope_of_work: scopeHtml,
          overhead_percent: financials.overhead_percent,
          markup_percent: financials.markup_percent,
          tax_percent: financials.tax_percent,
          permit_fees: financials.permit_fees,
          contingency_percent: financials.contingency_percent,
          disclaimer_ids: disclaimerIds,
          exclusions,
          inclusions,
          document_mode: step1.document_mode || 'estimate',
          total_override: totalOverride,
          project_start_date: timeline.project_start_date || null,
          project_duration_days: timeline.project_duration_days || null,
          weather_days: timeline.weather_days || 0,
          schedule_notes: timeline.schedule_notes || null,
        });
      }
    } catch (err) {
      console.error('handleSaveDraft error:', err);
    }
    setSaving(false);
  };

  /* ─── Template Selection Handler ────────────────────────────── */

  const handleTemplateSelect = (template: any) => {
    if (!template) {
      setSelectedTemplateId(null);
      setTemplateName(null);
      return;
    }

    setSelectedTemplateId(template.id);
    setTemplateName(template.name);

    // Pre-fill from template
    if (template.default_overhead_percent != null) {
      setFinancials(f => ({ ...f, overhead_percent: template.default_overhead_percent }));
    }
    if (template.default_markup_percent != null) {
      setFinancials(f => ({ ...f, markup_percent: template.default_markup_percent }));
    }
    if (template.default_tax_percent != null) {
      setFinancials(f => ({ ...f, tax_percent: template.default_tax_percent }));
    }
    if (template.default_contingency_percent != null) {
      setFinancials(f => ({ ...f, contingency_percent: template.default_contingency_percent }));
    }

    // Pre-fill line items from template
    if (template.line_items && Array.isArray(template.line_items) && template.line_items.length > 0) {
      const items: LineItem[] = template.line_items.map((ti: any, idx: number) => ({
        _key: `tpl_${Date.now()}_${idx}`,
        phase: ti.phase || 'Other',
        description: ti.description || ti.name || '',
        category: ti.category || 'material',
        quantity: ti.quantity || 1,
        unit: ti.unit || 'each',
        unit_cost: ti.unit_cost || ti.default_cost || 0,
        markup_percent: ti.markup_percent || ti.default_markup_percent || 0,
        total: (ti.quantity || 1) * (ti.unit_cost || ti.default_cost || 0) * (1 + (ti.markup_percent || ti.default_markup_percent || 0) / 100),
        sort_order: idx,
      }));
      setLineItems(items);
    }

    // Pre-fill payment schedule from template
    if (template.payment_schedule && Array.isArray(template.payment_schedule) && template.payment_schedule.length > 0) {
      const ms: Milestone[] = template.payment_schedule.map((ps: any, idx: number) => ({
        _key: `tpl_ms_${Date.now()}_${idx}`,
        milestone: ps.milestone || '',
        percent: ps.percent || 0,
        amount: 0, // Will be recalculated
        description: ps.description || '',
      }));
      setMilestones(ms);
    }

    // Pre-fill disclaimers from template
    if (template.disclaimers && Array.isArray(template.disclaimers) && template.disclaimers.length > 0) {
      setDisclaimerIds(template.disclaimers);
    }

    // Pre-fill exclusions from template
    if (template.exclusions) {
      setExclusions(template.exclusions);
    }
  };

  // Recalculate milestone amounts when grand total changes
  useEffect(() => {
    if (milestones.length > 0) {
      setMilestones(prev =>
        prev.map(m => ({
          ...m,
          amount: (grandTotal * (m.percent || 0)) / 100,
        }))
      );
    }
  }, [grandTotal]);

  /* ─── Render ────────────────────────────────────────────────── */

  if (loadingDraft) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
          <span className="text-[14px] text-white/40">Loading estimate...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/admin/estimates')}
              className="flex items-center gap-1 text-[13px] text-white/40 hover:text-white transition-colors mb-1"
            >
              <ChevronLeft size={14} />
              Estimates
            </button>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-white">
              {editId ? 'Edit Estimate' : 'New Estimate'}
            </h1>
          </div>
          <button
            onClick={handleSaveAndExit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-[14px] text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Save & Exit</span>
          </button>
        </div>

        {/* Step Indicator — Desktop */}
        <div className="hidden md:flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.num;
            const isCompleted = completedSteps.has(step.num);
            const isClickable = step.num <= currentStep || isCompleted || completedSteps.has(step.num - 1);
            const Icon = step.icon;

            return (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => goToStep(step.num)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                      : isCompleted
                      ? 'text-green-400 hover:bg-green-400/10'
                      : isClickable
                      ? 'text-white/40 hover:text-white/60 hover:bg-white/5'
                      : 'text-white/20 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                      isActive
                        ? 'bg-[#C9A84C] text-black'
                        : isCompleted
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : step.num}
                  </div>
                  <span className="text-[13px] font-medium">{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`w-6 h-px mx-0.5 flex-shrink-0 ${
                    completedSteps.has(step.num) ? 'bg-green-500/30' : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Indicator — Mobile */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-[13px] font-bold text-black">
                {currentStep}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-white">{STEPS[currentStep - 1].label}</div>
                <div className="text-[12px] text-white/40">Step {currentStep} of 8</div>
              </div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#D4772C] rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[14px] text-red-400">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <WizardStep1
              data={step1}
              onChange={d => setStep1(prev => ({ ...prev, ...d }))}
              preselectedCustomerId={preselectedCustomerId}
            />
          )}
          {currentStep === 2 && (
            <WizardStep2
              selectedTemplateId={selectedTemplateId}
              division={step1.division}
              onSelectTemplate={handleTemplateSelect}
            />
          )}
          {currentStep === 3 && (
            <WizardStep3
              content={scopeHtml}
              onSave={html => setScopeHtml(html)}
            />
          )}
          {currentStep === 4 && (
            <WizardStep4
              lineItems={lineItems}
              onChange={setLineItems}
            />
          )}
          {currentStep === 5 && (
            <WizardStep5
              subtotal={subtotal}
              grandTotal={grandTotal}
              data={financials}
              onChange={d => setFinancials(prev => ({ ...prev, ...d }))}
              totalOverride={totalOverride}
              onChangeTotalOverride={setTotalOverride}
            />
          )}
          {currentStep === 6 && (
            <WizardStep6
              milestones={milestones}
              grandTotal={grandTotal}
              onChange={setMilestones}
              timeline={timeline}
              onChangeTimeline={(partial) => setTimeline(prev => ({ ...prev, ...partial }))}
              documentMode={step1.document_mode || 'estimate'}
            />
          )}
          {currentStep === 7 && (
            <WizardStep7
              selectedDisclaimerIds={disclaimerIds}
              exclusions={exclusions}
              inclusions={inclusions}
              onChangeDisclaimers={setDisclaimerIds}
              onChangeExclusions={setExclusions}
              onChangeInclusions={setInclusions}
            />
          )}
          {currentStep === 8 && estimateId && (
            <WizardStep8
              estimateId={estimateId}
              step1={step1}
              scopeHtml={scopeHtml}
              lineItems={lineItems}
              financials={financials}
              milestones={milestones}
              disclaimerIds={disclaimerIds}
              exclusions={exclusions}
              subtotal={subtotal}
              grandTotal={grandTotal}
              templateName={templateName}
              onSaveDraft={handleSaveDraft}
              saving={saving}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 text-[15px] text-white/60 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {currentStep < 8 ? (
            <button
              onClick={handleNext}
              disabled={saving || !canProceed(currentStep)}
              className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-black text-[15px] font-semibold rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-40"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          ) : (
            <div /> // Step 8 has its own action buttons
          )}
        </div>
      </div>
    </div>
  );
}
