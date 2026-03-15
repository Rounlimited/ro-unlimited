'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, Loader2 } from 'lucide-react';

interface Disclaimer {
  id: string;
  title: string;
  body: string;
  category?: string;
  is_default?: boolean;
}

interface Props {
  selectedDisclaimerIds: string[];
  exclusions: string;
  onChangeDisclaimers: (ids: string[]) => void;
  onChangeExclusions: (text: string) => void;
}

export default function WizardStep7({
  selectedDisclaimerIds,
  exclusions,
  onChangeDisclaimers,
  onChangeExclusions,
}: Props) {
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/admin/disclaimers')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setDisclaimers(d);
          // Auto-select defaults if no disclaimers selected yet
          if (selectedDisclaimerIds.length === 0) {
            const defaults = d.filter((disc: Disclaimer) => disc.is_default).map((disc: Disclaimer) => disc.id);
            if (defaults.length > 0) onChangeDisclaimers(defaults);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        <span className="ml-3 text-[15px] text-white/50">Loading disclaimers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disclaimers */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-3">Disclaimers</h3>
        <p className="text-[13px] text-white/40 mb-4">
          Select which disclaimers to include with this estimate.
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
                  {/* Checkbox */}
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

                  {/* Title */}
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

      {/* Exclusions */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-1.5">Exclusions</h3>
        <p className="text-[13px] text-white/40 mb-3">
          List what is NOT included in this estimate.
        </p>
        <textarea
          value={exclusions}
          onChange={e => onChangeExclusions(e.target.value)}
          placeholder="e.g. Permits and inspection fees, landscaping, interior furnishings, appliances..."
          rows={6}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors resize-y leading-relaxed"
        />
      </div>
    </div>
  );
}
