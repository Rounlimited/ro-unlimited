'use client';

import { useState, useEffect } from 'react';
import { FileText, LayoutTemplate, Check, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  division?: string;
  estimate_type?: string;
  default_overhead_percent?: number;
  default_markup_percent?: number;
  default_tax_percent?: number;
  default_contingency_percent?: number;
  default_valid_days?: number;
  line_items?: any[];
  payment_schedule?: any[];
  disclaimers?: string[];
  exclusions?: string;
}

interface Props {
  selectedTemplateId: string | null;
  division: string;
  onSelectTemplate: (template: Template | null) => void;
}

export default function WizardStep2({ selectedTemplateId, division, onSelectTemplate }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (division) params.set('division', division);
    fetch(`/api/admin/templates?${params}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTemplates(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [division]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        <span className="ml-3 text-[15px] text-white/50">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-white/50">
        Select a template to pre-fill line items, payment schedules, and default percentages, or start with a blank estimate.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Start Blank Option */}
        <button
          onClick={() => onSelectTemplate(null)}
          className={`relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all ${
            selectedTemplateId === null
              ? 'border-[#C9A84C] bg-[#C9A84C]/10'
              : 'border-white/10 bg-[#111] hover:border-white/20 hover:bg-[#161616]'
          }`}
        >
          {selectedTemplateId === null && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
              <Check size={14} className="text-black" />
            </div>
          )}
          <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center">
            <FileText size={20} className="text-white/40" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white">Start Blank</div>
            <div className="text-[13px] text-white/40 mt-1">Build your estimate from scratch</div>
          </div>
        </button>

        {/* Template Cards */}
        {templates.map(t => {
          const isSelected = selectedTemplateId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t)}
              className={`relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                  : 'border-white/10 bg-[#111] hover:border-white/20 hover:bg-[#161616]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
                  <Check size={14} className="text-black" />
                </div>
              )}
              <div className="w-11 h-11 rounded-lg bg-[#D4772C]/15 flex items-center justify-center">
                <LayoutTemplate size={20} className="text-[#D4772C]" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-white">{t.name}</div>
                {t.description && (
                  <div className="text-[13px] text-white/40 mt-1 line-clamp-2">{t.description}</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {t.default_overhead_percent != null && t.default_overhead_percent > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                    OH {t.default_overhead_percent}%
                  </span>
                )}
                {t.default_markup_percent != null && t.default_markup_percent > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                    Markup {t.default_markup_percent}%
                  </span>
                )}
                {t.default_tax_percent != null && t.default_tax_percent > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                    Tax {t.default_tax_percent}%
                  </span>
                )}
                {t.line_items && t.line_items.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3b8dd4]/10 text-[#3b8dd4]">
                    {t.line_items.length} items
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-[14px] text-white/40">
          No templates found{division ? ` for "${division}" division` : ''}. You can start blank and save this estimate as a template later.
        </div>
      )}
    </div>
  );
}
