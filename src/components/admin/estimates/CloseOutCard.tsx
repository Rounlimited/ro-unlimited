'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

/**
 * Shown on an estimate that went out but never got an answer in the app
 * (status sent/viewed, not signed). Lets JR close it out when the customer
 * said yes or no by phone/in person — before this, the only way an estimate
 * left "Viewed" was the customer signing the link, so verbal deals sat open
 * forever and never reached the Jobs board.
 */
export function daysWaiting(e: { sent_at?: string | null; created_at?: string | null }) {
  const from = e.sent_at || e.created_at;
  if (!from) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 86400000));
}

export default function CloseOutCard({ estimateId, status, sentAt, createdAt, onDone }: { estimateId: string; status: string; sentAt: string | null; createdAt: string | null; onDone: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'accepted' | 'declined' | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  if (status !== 'sent' && status !== 'viewed') return null;
  const days = daysWaiting({ sent_at: sentAt, created_at: createdAt });

  const go = async (to: 'accepted' | 'declined') => {
    setBusy(to); setErr('');
    const notes = (to === 'accepted' ? 'Closed out by RO — customer said yes outside the app' : 'Closed out by RO — customer passed') + (note.trim() ? ': ' + note.trim() : '');
    const r = await fetch(`/api/admin/estimates/${estimateId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: to, notes }) }).then((x) => x.json()).catch(() => null);
    setBusy(null);
    if (!r || r.error) { setErr(r?.error || 'Could not save — try again.'); return; }
    setConfirm(null); setNote(''); onDone();
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.45)' }}>
      <div className="flex items-start gap-3">
        <Clock size={24} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[18px] font-bold text-white leading-tight">Still waiting on an answer{days > 0 ? ` — ${days} day${days === 1 ? '' : 's'}` : ''}</p>
          <p className="text-[16px] text-white/65 mt-1 leading-snug">{status === 'viewed' ? 'They opened it but never signed.' : 'Sent, not opened yet.'} If they said yes or no by phone or in person, close it out here so it moves to Jobs or off your list.</p>
        </div>
      </div>
      {confirm ? (
        <div className="mt-4 space-y-3">
          <p className="text-[17px] font-bold text-white">{confirm === 'accepted' ? 'Mark this as a YES? It moves to the Jobs board.' : 'Mark this as passed? It comes off the waiting list.'}</p>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={confirm === 'accepted' ? 'Optional note — e.g. "agreed by phone, paid deposit"' : 'Optional note — e.g. "went with someone else"'} className="w-full min-h-[50px] rounded-xl px-4 text-[17px] text-white bg-black/30 border border-white/15 outline-none placeholder:text-white/30" />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => go(confirm)} disabled={!!busy} className="min-h-[50px] px-5 rounded-xl text-[17px] font-bold inline-flex items-center gap-2 disabled:opacity-50" style={confirm === 'accepted' ? { background: '#35d07f', color: '#06210f' } : { background: 'rgba(248,113,113,0.2)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.5)' }}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : confirm === 'accepted' ? <CheckCircle2 size={18} /> : <XCircle size={18} />} {confirm === 'accepted' ? 'Yes, they’re in' : 'Yes, they passed'}
            </button>
            <button onClick={() => { setConfirm(null); setErr(''); }} className="min-h-[50px] px-5 rounded-xl text-[17px] font-bold text-white/70" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={() => setConfirm('accepted')} className="min-h-[52px] rounded-xl text-[17px] font-bold inline-flex items-center justify-center gap-2" style={{ background: 'rgba(53,208,127,0.15)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.5)' }}><CheckCircle2 size={19} /> They said yes</button>
          <button onClick={() => setConfirm('declined')} className="min-h-[52px] rounded-xl text-[17px] font-bold inline-flex items-center justify-center gap-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.4)' }}><XCircle size={19} /> They passed</button>
        </div>
      )}
      {err && <p className="text-[16px] text-red-400 mt-3">{err}</p>}
    </div>
  );
}
