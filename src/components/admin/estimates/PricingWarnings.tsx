'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, XCircle, X, Shield } from 'lucide-react';

interface Warning {
  code: string;
  name: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

interface Props {
  estimateId: string;
}

const SEVERITY_CONFIG = {
  error: { icon: XCircle, bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Issue' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', label: 'Warning' },
  info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Note' },
};

export default function PricingWarnings({ estimateId }: Props) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estimateId) return;
    fetch(`/api/admin/estimates/${estimateId}/pricing-check`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWarnings(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [estimateId]);

  const visible = warnings.filter(w => !dismissed.has(w.code));

  if (loading || visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={16} className="text-[#C9A84C]" />
        <span className="text-[14px] font-semibold text-white/70">Quality Check</span>
        <span className="text-[12px] text-white/30">({visible.length} item{visible.length !== 1 ? 's' : ''})</span>
      </div>

      {visible.map(w => {
        const cfg = SEVERITY_CONFIG[w.severity];
        const Icon = cfg.icon;
        return (
          <div
            key={w.code}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
          >
            <Icon size={18} className={`${cfg.text} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-semibold ${cfg.text}`}>{w.name}</span>
                <span className="text-[11px] text-white/20">{w.code}</span>
              </div>
              <p className="text-[13px] text-white/50 mt-0.5">{w.message}</p>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set([...prev, w.code]))}
              className="p-1 text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
