'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * System Status row: how much prepaid credit the AI (Grok) has left.
 * Self-contained — fetches once on mount, shows a quiet setup hint until
 * the management key is configured.
 */
export default function AiCreditsRow() {
  const [state, setState] = useState<{ configured?: boolean; balance_usd?: number; low?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/ai-balance').then((r) => r.json()).then(setState).catch(() => setState({ error: 'unreachable' }));
  }, []);

  const balance = state?.balance_usd;
  const low = !!state?.low;
  const right = state === null ? '…'
    : state.error ? 'Check failed'
    : !state.configured ? 'Setup needed'
    : low ? 'Top up soon'
    : 'Funded';
  const rightColor = low ? 'rgba(248,113,113,0.8)' : state?.configured && balance !== undefined ? 'rgba(53,208,127,0.6)' : 'rgba(255,255,255,0.25)';
  const sub = state === null ? 'Checking…'
    : state.error ? 'Could not reach xAI'
    : !state.configured ? 'Add the xAI management key'
    : `$${(balance ?? 0).toFixed(2)} credit remaining`;

  return (
    <div className="bg-[#141414]/40 border border-white/5 rounded-lg px-3 py-2.5 flex items-center gap-2.5 backdrop-blur-sm">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,133,255,0.1)' }}>
        <Sparkles size={13} style={{ color: '#a885ff' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-white/60 leading-tight">AI Credits</p>
        <p className="text-[12px] text-white/20">{sub}</p>
      </div>
      <span className="text-[11px] flex-shrink-0" style={{ color: rightColor }}>{right}</span>
    </div>
  );
}
