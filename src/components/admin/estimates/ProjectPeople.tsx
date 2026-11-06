'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Users, UserPlus, Copy, Check, Mail, MessageSquare, Trash2, RotateCcw, ChevronDown, ChevronUp, Crown } from 'lucide-react';

/**
 * Link Controls → People on this project.
 * The owner (customer on file) plus everyone the Project Page is shared with.
 * Each person has their own link; JR picks "Can view" or "Can approve" per
 * person (approve = change orders, requests, options; signing stays with the
 * owner). Everything they do is tracked under their name. Removing someone
 * kills only their link. JR-sized: 16px+ text, 48px+ targets, words.
 */
type Activity = { at: string; what: string };
type Member = { id: string; added_by: string | null; name: string; email: string | null; phone: string | null; label: string | null; role: 'viewer' | 'approver'; link: string; invited_at: string | null; first_seen_at: string | null; last_seen_at: string | null; view_count: number; revoked_at: string | null; activity: Activity[] };
type Owner = { name: string; email: string | null; phone: string | null; link: string | null; views: number; last_seen: string | null; last_device: string | null } | null;

const LABELS = ['Spouse', 'Architect', 'Engineer', 'Lender', 'Property manager', 'Partner'];
const ago = (iso: string | null) => {
  if (!iso) return 'never';
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 2) return 'just now'; if (m < 60) return Math.round(m) + ' min ago';
  const h = m / 60; if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : d + ' days ago';
};
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
const btn = 'min-h-[48px] px-3 rounded-xl text-[15px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40';
const soft = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' };
const goldSoft = { background: 'rgba(201,168,76,0.16)', border: '1px solid rgba(201,168,76,0.55)', color: '#D4B965' };
const inputCls = 'w-full min-h-[50px] px-4 rounded-xl bg-white/5 border border-white/10 text-[16px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/60';

export default function ProjectPeople({ estimateId, embedded = false, onChanged }: { estimateId: string; embedded?: boolean; onChanged?: () => void }) {
  const api = `/api/admin/estimates/${estimateId}/people`;
  const [owner, setOwner] = useState<Owner>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [share, setShare] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [arm, setArm] = useState<string | null>(null);
  // add form
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', label: '', email: '', phone: '', role: 'viewer' as 'viewer' | 'approver', invite: true });
  const [addErr, setAddErr] = useState('');

  const load = useCallback(async () => {
    try { const d = await (await fetch(api, { cache: 'no-store' })).json(); setOwner(d.owner || null); setMembers(d.members || []); setShare(!!d.allow_customer_share); } catch { setMembers([]); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const patch = async (m: Member, body: any, key: string, ok: string) => {
    setBusy(m.id + key); setNote((n) => ({ ...n, [m.id]: '' }));
    const d = await fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: m.id, ...body }) }).then((r) => r.json()).catch(() => null);
    setNote((n) => ({ ...n, [m.id]: d && !d.error ? ok : (d && d.error) || 'Could not do that — try again.' }));
    setBusy(null); setArm(null); await load(); if (onChanged) onChanged();
  };
  const copy = async (id: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch {} };
  const sms = (m: Member) => `sms:${m.phone ? m.phone.replace(/[^0-9+]/g, '') : ''}?&body=${encodeURIComponent(`Hi ${m.name.split(' ')[0]} — here's your link to the RO Unlimited project page: ${m.link}`)}`;

  const add = async () => {
    setAddErr('');
    if (!f.name.trim()) { setAddErr('Type their name.'); return; }
    setBusy('add');
    const d = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, invite: f.invite && !!f.email.trim() }) }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    if (!d || d.error) { setAddErr((d && d.error) || 'Could not add them.'); return; }
    const sent = d.invited && d.invited.ok;
    setNote((n) => ({ ...n, [d.member.id]: sent ? `Added — link emailed to ${d.member.email} ✓` : 'Added ✓ — copy or text them their link below.' }));
    setF({ name: '', label: '', email: '', phone: '', role: 'viewer', invite: true }); setAdding(false); setOpen(d.member.id);
    await load(); if (onChanged) onChanged();
  };

  const active = (members || []).filter((m) => !m.revoked_at);
  const removed = (members || []).filter((m) => m.revoked_at);

  return (
    <div className={embedded ? '' : 'mt-5 pt-5 border-t border-white/10'}>
      {!embedded && <p className="text-[18px] font-bold flex items-center gap-2"><Users size={19} style={{ color: '#D4B965' }} /> People on this project</p>}
      <p className="text-[14px] text-white/45 mt-0.5 mb-3">Everyone gets their own link, and what they do is tracked under their name. You choose who can approve.</p>

      {/* OWNER_SHARE_TOGGLE: whether the customer can invite people from their own page */}
      <button disabled={shareBusy || !members} onClick={async () => {
          setShareBusy(true);
          const d = await fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allow_customer_share: !share }) }).then((r) => r.json()).catch(() => null);
          if (d && d.ok) setShare(!!d.allow_customer_share); setShareBusy(false);
        }}
        className="w-full mb-3 min-h-[56px] px-4 rounded-xl flex items-center justify-between gap-3 text-left disabled:opacity-60" style={share ? goldSoft : soft}>
        <span className="min-w-0">
          <span className="block text-[16px] font-bold">Let the customer invite people</span>
          <span className="block text-[13px]" style={{ color: share ? 'rgba(212,185,101,0.8)' : 'rgba(255,255,255,0.45)' }}>{share ? 'On — they see “Share this project” on their page. Their invites are view-only.' : 'Off — only you can add people.'}</span>
        </span>
        <span className="flex-shrink-0 relative inline-flex items-center w-14 h-8 rounded-full" style={{ background: share ? '#C9A84C' : 'rgba(255,255,255,0.15)' }}>
          {shareBusy ? <Loader2 size={16} className="animate-spin mx-auto text-black" /> : <span className="absolute w-6 h-6 rounded-full bg-white shadow" style={{ left: share ? 28 : 4, transition: 'left 0.2s' }} />}
        </span>
      </button>

      {!members ? <div className="py-4 flex items-center gap-2 text-white/40"><Loader2 size={18} className="animate-spin" /> Loading…</div> : (
        <div className="space-y-2">
          {owner && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-white flex items-center gap-1.5"><Crown size={15} style={{ color: '#D4B965' }} /> {owner.name}</p>
                  <p className="text-[14px] text-white/50">Owner · can approve and sign</p>
                  <p className="text-[14px] text-white/40">Opened {owner.views} time{owner.views === 1 ? '' : 's'} · last {ago(owner.last_seen)}{owner.last_device ? ' · ' + owner.last_device : ''}</p>
                </div>
              </div>
            </div>
          )}

          {active.map((m) => {
            const isOpen = open === m.id;
            return (
              <div key={m.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (m.role === 'approver' ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)') }}>
                <button onClick={() => setOpen(isOpen ? null : m.id)} className="w-full text-left flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[16px] font-bold text-white">{m.name}{m.label ? <span className="text-white/50 font-semibold"> · {m.label}</span> : null}</span>
                    <span className="block text-[14px] font-semibold" style={{ color: m.role === 'approver' ? '#D4B965' : 'rgba(255,255,255,0.55)' }}>{m.role === 'approver' ? 'Can approve' : 'Can view'}{m.added_by === 'owner' ? <span className="text-white/45 font-normal"> · added by the customer</span> : null}</span>
                    <span className="block text-[14px] text-white/40">{m.view_count ? `Opened ${m.view_count} time${m.view_count === 1 ? '' : 's'} · last ${ago(m.last_seen_at)}` : m.invited_at ? `Invited ${ago(m.invited_at)} · hasn’t opened it yet` : 'Hasn’t opened it yet'}</span>
                  </span>
                  {isOpen ? <ChevronUp size={20} className="text-white/40 mt-1" /> : <ChevronDown size={20} className="text-white/40 mt-1" />}
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-3">
                    {/* role */}
                    <div className="grid grid-cols-2 gap-2">
                      {(['viewer', 'approver'] as const).map((r) => (
                        <button key={r} disabled={busy !== null} onClick={() => m.role !== r && patch(m, { role: r }, 'role', r === 'approver' ? 'Can approve now ✓' : 'View only now ✓')} className={btn} style={m.role === r ? goldSoft : soft}>
                          {busy === m.id + 'role' && m.role !== r ? <Loader2 size={15} className="animate-spin" /> : null}{r === 'viewer' ? 'Can view' : 'Can approve'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[13px] text-white/40">{m.role === 'approver' ? 'Can approve or decline changes, send documents you ask for, and pick options. Only the owner signs the contract.' : 'Sees the whole page and can ask questions. Can’t approve or send documents.'}</p>
                    {(m.email || m.phone) && <p className="text-[14px] text-white/55 break-all">{[m.email, m.phone].filter(Boolean).join(' · ')}</p>}

                    {/* their link */}
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => copy(m.id, m.link)} className={btn} style={copied === m.id ? goldSoft : soft}>{copied === m.id ? <Check size={16} /> : <Copy size={16} />} {copied === m.id ? 'Copied' : 'Copy'}</button>
                      <a href={sms(m)} className={btn} style={soft}><MessageSquare size={16} /> Text</a>
                      <button disabled={!m.email || busy !== null} onClick={() => patch(m, { invite: true }, 'invite', `Link emailed to ${m.email} ✓`)} className={btn} style={soft}>{busy === m.id + 'invite' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email</button>
                    </div>

                    {/* activity */}
                    <div>
                      <p className="text-[13px] font-bold uppercase tracking-wide text-white/40 mb-1">What they’ve done</p>
                      {m.activity.length === 0 ? <p className="text-[14px] text-white/40">Nothing yet.</p> : (
                        <ul className="space-y-1">{m.activity.slice(0, 8).map((a, i) => <li key={i} className="text-[14px] text-white/70"><span className="text-white/40">{when(a.at)}</span> — {a.what}</li>)}</ul>
                      )}
                    </div>

                    <button onClick={() => { if (arm === m.id) patch(m, { revoke: true }, 'revoke', 'Removed — their link no longer works.'); else { setArm(m.id); setTimeout(() => setArm(null), 4000); } }} disabled={busy !== null} className={btn + ' w-full'}
                      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', color: '#fca5a5' }}>
                      {busy === m.id + 'revoke' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} {arm === m.id ? 'Tap again — their link stops working' : 'Remove from this project'}
                    </button>
                  </div>
                )}
                {note[m.id] && <p className="text-[14px] mt-2" style={{ color: /✓|Removed/.test(note[m.id]) ? '#35d07f' : '#f87171' }}>{note[m.id]}</p>}
              </div>
            );
          })}

          {removed.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p className="text-[13px] font-bold uppercase tracking-wide text-white/35 mb-1">Removed</p>
              {removed.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-[15px] text-white/45 line-through">{m.name}{m.label ? ' · ' + m.label : ''}</span>
                  <button onClick={() => patch(m, { restore: true }, 'restore', 'Back on the project with a new link ✓')} disabled={busy !== null} className="min-h-[44px] px-3 rounded-lg text-[14px] font-bold inline-flex items-center gap-1 text-white/60"><RotateCcw size={14} /> Add back</button>
                </div>
              ))}
            </div>
          )}

          {!adding ? (
            <button onClick={() => setAdding(true)} className={btn + ' w-full min-h-[52px] text-[16px]'} style={goldSoft}><UserPlus size={18} /> Add a person</button>
          ) : (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.35)' }}>
              <p className="text-[16px] font-bold text-white">Add a person</p>
              <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Their name" className={inputCls} />
              <div className="flex flex-wrap gap-1.5">
                {LABELS.map((l) => <button key={l} onClick={() => setF({ ...f, label: f.label === l ? '' : l })} className="min-h-[40px] px-3 rounded-full text-[14px] font-bold" style={f.label === l ? goldSoft : soft}>{l}</button>)}
              </div>
              <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" inputMode="email" placeholder="Email (they can also sign in at rounlimited.com/my)" className={inputCls} />
              <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} type="tel" inputMode="tel" placeholder="Mobile (to text them the link)" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setF({ ...f, role: 'viewer' })} className={btn} style={f.role === 'viewer' ? goldSoft : soft}>Can view</button>
                <button onClick={() => setF({ ...f, role: 'approver' })} className={btn} style={f.role === 'approver' ? goldSoft : soft}>Can approve</button>
              </div>
              <p className="text-[13px] text-white/45">{f.role === 'approver' ? 'They can approve or decline changes, send documents and pick options. Only the owner signs.' : 'They see the page and can ask questions — no approving.'}</p>
              {f.email.trim() && (
                <button onClick={() => setF({ ...f, invite: !f.invite })} className="w-full min-h-[48px] px-3 rounded-xl text-left text-[15px] font-bold flex items-center gap-2" style={f.invite ? goldSoft : soft}>
                  <span className="w-5 h-5 rounded border flex items-center justify-center" style={{ borderColor: 'currentColor' }}>{f.invite ? <Check size={14} /> : null}</span> Email them their link now
                </button>
              )}
              {addErr && <p className="text-[14px] text-[#f87171]">{addErr}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setAdding(false); setAddErr(''); }} className={btn} style={soft}>Cancel</button>
                <button onClick={add} disabled={busy === 'add'} className={btn + ' text-black'} style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>{busy === 'add' ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Add</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
