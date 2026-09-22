'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Link2, X, Pause, Play, RefreshCw, Trash2, Copy, Check, CalendarPlus, Eye } from 'lucide-react';

/**
 * Link Controls — JR's control panel for one customer link.
 * Pause it for a phone call, resume it after (changes or no changes),
 * issue a fresh one (old dies instantly), kill it outright, or extend it.
 * JR-sized: 17px body, 52px+ targets, states carried by words.
 */

interface LinkStatus {
  enabled: boolean; has_link: boolean; expired: boolean;
  url: string | null; expires_at: string | null;
  view_count: number; last_viewed_at: string | null; signed: boolean;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

export default function LinkControlsSheet({ estimateId, onClose }: { estimateId: string; onClose: () => void }) {
  const [s, setS] = useState<LinkStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmArm, setConfirmArm] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/admin/estimates/' + estimateId + '/link').then((r) => r.json());
      if (!d.error) setS(d);
    } catch { /* leave */ }
  }, [estimateId]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string) => {
    // New link and kill are one-way doors — arm on first tap, fire on second.
    if ((action === 'new' || action === 'kill') && confirmArm !== action) {
      setConfirmArm(action);
      return;
    }
    setConfirmArm(null);
    setBusy(action);
    try {
      const d = await fetch('/api/admin/estimates/' + estimateId + '/link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then((r) => r.json());
      if (!d.error) setS(d);
    } catch { /* leave */ }
    setBusy(null);
  };

  const copy = async () => {
    if (!s?.url) return;
    try { await navigator.clipboard.writeText(s.url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* fine */ }
  };

  const pill = !s ? null
    : !s.has_link ? { label: 'No link issued', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' }
    : !s.enabled ? { label: 'PAUSED', color: '#f0a04b', bg: 'rgba(240,160,75,0.15)' }
    : s.expired ? { label: 'EXPIRED', color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
    : { label: 'LIVE', color: '#35d07f', bg: 'rgba(53,208,127,0.15)' };

  const Btn = ({ action, icon: Icon, label, sub, tone }: { action: string; icon: any; label: string; sub?: string; tone?: 'danger' | 'gold' }) => (
    <button onClick={() => act(action)} disabled={busy !== null}
      className="w-full min-h-[56px] rounded-xl px-4 flex items-center gap-3 text-left active:scale-[0.99] disabled:opacity-50"
      style={confirmArm === action
        ? { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.5)' }
        : tone === 'danger'
          ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.25)' }
          : tone === 'gold'
            ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {busy === action ? <Loader2 size={19} className="animate-spin shrink-0 text-white/50" />
        : <Icon size={19} className="shrink-0" style={{ color: confirmArm === action ? '#f87171' : tone === 'danger' ? '#f87171' : tone === 'gold' ? '#D4B965' : 'rgba(255,255,255,0.6)' }} />}
      <span className="min-w-0">
        <span className="block text-[16px] font-bold" style={{ color: confirmArm === action ? '#f87171' : 'rgba(255,255,255,0.85)' }}>
          {confirmArm === action ? 'Tap again to confirm' : label}
        </span>
        {(confirmArm === action ? 'The old link stops working the moment you do.' : sub) && (
          <span className="block text-[13px] text-white/40">{confirmArm === action ? 'The old link stops working the moment you do.' : sub}</span>
        )}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[19px] font-bold flex items-center gap-2"><Link2 size={20} style={{ color: '#D4B965' }} /> Link Controls</p>
          <button onClick={onClose} className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center"><X size={18} className="text-white/50" /></button>
        </div>

        {!s ? (
          <div className="flex items-center gap-3 text-white/40 py-6"><Loader2 size={20} className="animate-spin" /> Checking the link…</div>
        ) : (
          <>
            {/* Status */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="px-3 py-1.5 rounded-full text-[14px] font-bold" style={{ color: pill!.color, background: pill!.bg }}>{pill!.label}</span>
                {s.has_link && s.expires_at && (
                  <span className="text-[14px] text-white/40">good thru {fmtDate(s.expires_at)}</span>
                )}
              </div>
              {s.has_link && (
                <p className="text-[14px] text-white/40 flex items-center gap-1.5">
                  <Eye size={14} /> Opened {s.view_count}{s.view_count === 1 ? ' time' : ' times'}
                  {s.last_viewed_at ? ` · last ${fmtDate(s.last_viewed_at)}` : ''}
                </p>
              )}
              {!s.enabled && (
                <p className="text-[15px] mt-2" style={{ color: '#f0a04b' }}>
                  The customer sees a &ldquo;we&rsquo;re making updates — give us a call&rdquo; page. Nothing on the document works until you turn it back on.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {s.has_link && s.url && (
                <button onClick={copy}
                  className="w-full min-h-[56px] rounded-xl px-4 flex items-center gap-3 text-left active:scale-[0.99]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {copied ? <Check size={19} className="shrink-0 text-[#35d07f]" /> : <Copy size={19} className="shrink-0 text-white/60" />}
                  <span className="min-w-0">
                    <span className="block text-[16px] font-bold text-white/85">{copied ? 'Copied' : 'Copy the Link'}</span>
                    <span className="block text-[13px] text-white/40 truncate">{s.url.replace('https://', '')}</span>
                  </span>
                </button>
              )}

              {s.has_link && s.enabled && (
                <Btn action="off" icon={Pause} label="Pause the Link" sub="For phone calls and edits — same link comes back when you're done" tone="gold" />
              )}
              {s.has_link && !s.enabled && (
                <Btn action="on" icon={Play} label="Turn the Link Back On" sub="Same link the customer already has — changes or no changes" tone="gold" />
              )}
              {!s.has_link && (
                <Btn action="new" icon={RefreshCw} label="Issue a Link" sub="Creates a fresh link, good for 60 days" tone="gold" />
              )}

              {s.has_link && (
                <Btn action="new" icon={RefreshCw} label="Issue a New Link" sub="Fresh link — the one they have stops working" />
              )}
              {s.has_link && s.expires_at && (
                <Btn action="extend" icon={CalendarPlus} label="Extend 60 Days" sub="Pushes the expiration out from today" />
              )}
              {s.has_link && (
                <Btn action="kill" icon={Trash2} label="Kill This Link" sub="Deletes it — nothing works until you issue a new one" tone="danger" />
              )}
            </div>

            <p className="text-[13px] text-white/30 mt-4">
              Pausing beats killing for a quick phone-call fix — the customer keeps the same link and it just comes back on.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
