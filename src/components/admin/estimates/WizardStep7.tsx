'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, Loader2, Plus, X } from 'lucide-react';

interface Disclaimer {
  id: string;
  title: string;
  body: string;
  category?: string;
  is_default?: boolean;
}

interface DefaultInclusion {
  id: string;
  text: string;
  is_default: boolean;
}

interface Props {
  selectedDisclaimerIds: string[];
  exclusions: string;
  inclusions: string;
  onChangeDisclaimers: (ids: string[]) => void;
  onChangeExclusions: (text: string) => void;
  onChangeInclusions: (text: string) => void;
}

export default function WizardStep7({
  selectedDisclaimerIds,
  exclusions,
  inclusions,
  onChangeDisclaimers,
  onChangeExclusions,
  onChangeInclusions,
}: Props) {
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [defaultInclusions, setDefaultInclusions] = useState<DefaultInclusion[]>([]);

  // Parse inclusions text into array for UI
  const inclusionItems = (inclusions || '').split('\n').filter(s => s.trim());

  const setInclusionItems = (items: string[]) => {
    onChangeInclusions(items.join('\n'));
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/disclaimers').then(r => r.json()),
      fetch('/api/admin/inclusions').then(r => r.json()),
    ])
      .then(([discs, incls]) => {
        if (Array.isArray(discs)) {
          setDisclaimers(discs);
          if (selectedDisclaimerIds.length === 0) {
            const defaults = discs.filter((d: Disclaimer) => d.is_default).map((d: Disclaimer) => d.id);
            if (defaults.length > 0) onChangeDisclaimers(defaults);
          }
        }
        if (Array.isArray(incls)) {
          setDefaultInclusions(incls);
          // Auto-populate inclusions if empty
          if (!inclusions) {
            const defaultTexts = incls.filter((i: DefaultInclusion) => i.is_default).map((i: DefaultInclusion) => i.text);
            if (defaultTexts.length > 0) onChangeInclusions(defaultTexts.join('\n'));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDisclaimer = (id: string) => {
    if (selectedDisclaimerIds.includes(id)) {
      onChangeDisclaimers(selectedDisclaimerIds.filter(d => d !== id));
    } else {
      onChangeDisclaimers([...selectedDisclaimerIds, id]);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addInclusion = () => {
    setInclusionItems([...inclusionItems, '']);
  };

  const updateInclusion = (idx: number, text: string) => {
    const updated = [...inclusionItems];
    updated[idx] = text;
    setInclusionItems(updated);
  };

  const removeInclusion = (idx: number) => {
    setInclusionItems(inclusionItems.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        <span className="ml-3 text-[15px] text-white/50">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disclaimers */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-3">Terms & Conditions</h3>
        <p className="text-[13px] text-white/40 mb-4">
          Select which terms to include with this document.
        </p>

        <div className="space-y-2">
          {disclaimers.length === 0 && (
            <div className="text-center py-8 text-[14px] text-white/40">
              No disclaimers configured. You can add them in Settings.
            </div>
          )}

          {disclaimers.map(d => {
            const isSelected = selectedDisclaimerIds.includes(d.id);
            const isExpanded = expandedIds.has(d.id);

            return (
              <div
                key={d.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  isSelected ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5' : 'border-white/10 bg-[#111]'
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <button
                    onClick={() => toggleDisclaimer(d.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-[#C9A84C] border-[#C9A84C]'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {isSelected && <Check size={13} className="text-black" />}
                  </button>

                  <button
                    onClick={() => toggleExpanded(d.id)}
                    className="flex-1 flex items-center justify-between min-w-0"
                  >
                    <div className="text-left min-w-0">
                      <span className="text-[14px] font-medium text-white truncate block">
                        {d.title}
                      </span>
                      {d.category && (
                        <span className="text-[12px] text-white/30">{d.category}</span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="pl-8 text-[13px] text-white/50 leading-relaxed whitespace-pre-wrap bg-white/5 rounded-lg p-3">
                      {d.body}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inclusions */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-1.5">Inclusions</h3>
        <p className="text-[13px] text-white/40 mb-3">
          What IS included in this scope of work.
        </p>
        <div className="space-y-2">
          {inclusionItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[#22c55e] text-[14px] flex-shrink-0">+</span>
              <input
                value={item}
                onChange={e => updateInclusion(idx, e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[14px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                placeholder="e.g. All labor and materials..."
              />
              <button
                onClick={() => removeInclusion(idx)}
                className="p-1.5 text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addInclusion}
            className="flex items-center gap-1.5 text-[13px] text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors mt-1"
          >
            <Plus size={14} /> Add inclusion
          </button>
        </div>
      </div>

      {/* Exclusions */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-1.5">Exclusions</h3>
        <p className="text-[13px] text-white/40 mb-3">
          What is NOT included in this estimate. One item per line.
        </p>
        <textarea
          value={exclusions}
          onChange={e => onChangeExclusions(e.target.value)}
          placeholder="e.g. Permits and inspection fees&#10;Landscaping&#10;Interior furnishings&#10;Appliances"
          rows={6}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors resize-y leading-relaxed"
        />
      </div>
    </div>
  );
}
