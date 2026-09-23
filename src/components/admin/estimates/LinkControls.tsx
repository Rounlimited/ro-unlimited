'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Link2, X, Pause, Play, RefreshCw, Trash2, Copy, Check, Eye, ExternalLink } from 'lucide-react';

/**
 * Link Controls — the ONE place for everything about a customer link.
 * (The page header keeps only Send / PDF / Revise / Delete; open, copy,
 * pause, replace, expiration and kill all live here.)
 *
 * Pause it for a phone call, resume after (changes or no changes), issue a
 * fresh one (old dies instantly), set exactly when it expires, or kill it.
 * JR-sized: 16px+ text, 52px+ targets, states carried by words.
 */

interface LinkStatus {
  enabled: boolean; has_link: boolean; expired: boolean;
  url: string | null; expires_at: string | null;
  view_count: number; last_viewed_at: string | null; signed: boolean;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

export default function LinkControlsSheet({ estimateId, kind = 'estimate', onClose }: { estimateId: string; kind?: 'estimate' | 'invoice' | 'report'; onClose: () => void }) {
  const apiBase = '/api/admin/' + ({ estimate: 'estimates', invoice: 'invoices', report: 'reports' }[kind]) + '/' + estimateId + '/link';
  const [s, setS] = useState<LinkStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmArm, setConfirmArm] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [dateMsg, setDateMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await fetch(apiBase).then((r) => r.json());
      if (!d.error) setS(d);
    } catch { /* leave */ }
  }, [estimateId]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, extra: any = {}, busyKey?: string) => {
    if ((action === 'new' || action === 'kill') && confirmArm !== action) {
      setConfirmArm(action);
      return;
    }
    setConfirmArm(null);
    setBusy(busyKey || action);
    setDateMsg('');
    try {
      const d = await fetch(apiBase, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      }).then((r) => r.json());
      if (d.error) setDateMsg(d.error);
      else {
        setS(d);
        if (action === 'extend' || action === 'expire_on') {
          setDateMsg('Set — good thru ' + fmtDate(d.expires_at));
          setCustomDate('');
        }
      }
    } catch { setDateMsg('Could not save — try again.'); }
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
            {/* ── Status + the two quick reads ── */}
            <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="px-3 py-1.5 rounded-full text-[14px] font-bold" style={{ color: pill!.color, background: pill!.bg }}>{pill!.label}</span>
                {s.has_link && s.expires_at && (
                  <span className="text-[14px] text-white/40">good thru {fmtDate(s.expires_at)}</span>
                )}
              </div>
              {s.has_link && (
                <p className="text-[14px] text-white/40 flex items-center gap-1.5 mt-2">
                  <Eye size={14} /> Opened {s.view_count}{s.view_count === 1 ? ' time' : ' times'}
                  {s.last_viewed_at ? ` · last ${fmtDate(s.last_viewed_at)}` : ''}
                </p>
              )}
              {!s.enabled && (
                <p className="text-[15px] mt-2" style={{ color: '#f0a04b' }}>
                  The customer sees a &ldquo;we&rsquo;re making updates — give us a call&rdquo; page until you turn it back on.
                </p>
              )}
            </div>

            {/* ── Open + Copy, side by side ── */}
            {s.has_link && s.url && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <a href={s.url.replace('https://rounlimited.com', '')} target="_blank" rel="noreferrer"
                  className="min-h-[52px] rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold active:scale-[0.98]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  <ExternalLink size={17} /> Open It
                </a>
                <button onClick={copy}
                  className="min-h-[52px] rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold active:scale-[0.98]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#35d07f' : 'rgba(255,255,255,0.8)' }}>
                  {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy It'}
                </button>
              </div>
            )}

            {/* ── The switch ── */}
            <div className="space-y-2">
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

              {/* ── Expiration, one block: quick chips or an exact day ── */}
              {s.has_link && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-[16px] font-bold text-white/85 mb-2">Expiration</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {[30, 60, 90].map((n) => (
                      <button key={n} onClick={() => act('extend', { days: n }, 'extend' + n)} disabled={busy !== null}
                        className="min-h-[48px] px-4 rounded-xl text-[15px] font-bold active:scale-95 disabled:opacity-50"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                        {busy === 'extend' + n ? <Loader2 size={15} className="animate-spin" /> : `+${n} days`}
                      </button>
                    ))}
                    <input type="date" value={customDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => { setCustomDate(e.target.value); setDateMsg(''); }}
                      className="flex-1 min-w-[150px] min-h-[48px] px-3 rounded-xl bg-white/5 border border-white/10 text-[15px] text-white focus:outline-none focus:border-[#C9A84C]/50" />
                    <button
                      onClick={() => { if (!customDate) { setDateMsg('Pick a day first'); return; } act('expire_on', { date: customDate }); }}
                      disabled={busy !== null}
                      className="min-h-[48px] px-5 rounded-xl text-[15px] font-bold text-black active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                      {busy === 'expire_on' ? <Loader2 size={15} className="animate-spin" /> : 'Set Day'}
                    </button>
                  </div>
                  <p className="text-[13px] text-white/35 mt-2">Tap +30, +60 or +90 to give the link that many more days. Or pick a date — after that day, the link stops working.</p>
                  {dateMsg && <p className="text-[14px] mt-1.5" style={{ color: dateMsg.startsWith('Set —') ? '#35d07f' : '#f87171' }}>{dateMsg}</p>}
                </div>
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
