'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Copy, Check, MessageSquare, Users, CalendarClock, Loader2 } from 'lucide-react';
import type { HubTab } from './ProjectPageHub';

/**
 * The Project Page at a glance — lives on the estimate page and in the Job Room.
 * Live status, opens, people, report schedule, one-tap copy/text, and the
 * door into the hub (ProjectPageHub). Re-reads when `refreshKey` changes.
 */
type Lite = {
  link: { url: string | null; has_link: boolean; enabled: boolean; expired: boolean; views: number; last_viewed_at: string | null; last_device: string | null };
  owner: { first: string; phone: string | null };
  people: { count: number };
  see: { reporting_cadence: string; reporting_day: string | null };
  project: { name: string; stage: string };
  activity: { at: string; who: string; what: string }[];
};
const ago = (iso: string | null) => {
  if (!iso) return '';
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 2) return 'just now'; if (m < 60) return Math.round(m) + ' min ago';
  const h = m / 60; if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : d + ' days ago';
};

export default function ProjectPageCard({ estimateId, onOpen, refreshKey = 0 }: { estimateId: string; onOpen: (tab?: HubTab) => void; refreshKey?: number }) {
  const [d, setD] = useState<Lite | null>(null);
  const [copied, setCopied] = useState(false);
  const load = useCallback(async () => { try { const j = await (await fetch(`/api/admin/estimates/${estimateId}/hub`, { cache: 'no-store' })).json(); if (!j.error) setD(j); } catch {} }, [estimateId]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const status = !d ? null : !d.link.has_link ? { t: 'No link yet', c: '#9ca3af' } : !d.link.enabled ? { t: 'Paused', c: '#f0a04b' } : d.link.expired ? { t: 'Expired', c: '#f87171' } : { t: 'Live', c: '#35d07f' };
  const last = d && d.activity[0];
  const copy = async (e: React.MouseEvent) => { e.stopPropagation(); if (!d || !d.link.url) return; try { await navigator.clipboard.writeText(d.link.url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };
  const sms = d && d.link.url ? `sms:${d.owner.phone ? d.owner.phone.replace(/[^0-9+]/g, '') : ''}?&body=${encodeURIComponent(`Hi ${d.owner.first} — here's your RO Unlimited project page for ${d.project.name}: ${d.link.url}`)}` : '';

  return (
    <div className="relative rounded-2xl p-[1px] overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(212,185,101,0.55), rgba(255,255,255,0.06) 45%, rgba(212,185,101,0.25))' }}>
      <style>{`@keyframes ppcPulse { 0% { box-shadow: 0 0 0 0 rgba(53,208,127,0.6);} 70% { box-shadow: 0 0 0 9px rgba(53,208,127,0);} 100% { box-shadow: 0 0 0 0 rgba(53,208,127,0);} } @media (prefers-reduced-motion: reduce) { .ppc-dot { animation: none !important; } }`}</style>
      <div className="rounded-[15px] p-4 sm:p-5" style={{ background: 'linear-gradient(170deg, #17140e, #0f0f0f 60%)' }}>
        <button onClick={() => onOpen('share')} className="w-full text-left flex items-start justify-between gap-3 group">
          <span className="min-w-0">
            <span className="block text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: '#C9A84C' }}>Project Page</span>
            {!d ? <span className="flex items-center gap-2 text-white/40 text-[15px] mt-1"><Loader2 size={15} className="animate-spin" /> Checking…</span> : (
              <span className="flex items-center gap-2 mt-1">
                <span className="ppc-dot w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: status!.c, animation: status!.t === 'Live' ? 'ppcPulse 2s infinite' : 'none' }} />
                <span className="text-[17px] font-bold" style={{ color: status!.c }}>{status!.t}</span>
                <span className="text-[15px] text-white/55 truncate">{d.link.has_link ? (d.link.views ? `· opened ${d.link.views}× · ${ago(d.link.last_viewed_at)}` : '· not opened yet') : ''}</span>
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[15px] font-bold flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" style={{ color: '#D4B965' }}>Open <ChevronRight size={18} /></span>
        </button>
        {d && (
          <>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button onClick={() => onOpen('people')} className="min-h-[38px] px-3 rounded-full text-[14px] font-semibold flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}><Users size={14} /> {d.people.count ? `Shared with ${d.people.count}` : 'Only the owner'}</button>
              <button onClick={() => onOpen('see')} className="min-h-[38px] px-3 rounded-full text-[14px] font-semibold flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}><CalendarClock size={14} /> {d.see.reporting_cadence === 'none' ? 'No reports' : d.see.reporting_cadence === 'weekly' ? `Reports ${String(d.see.reporting_day || 'Friday').slice(0, 3)}` : `Reports ${d.see.reporting_cadence}`}</button>
            </div>
            {last && <button onClick={() => onOpen('activity')} className="block w-full text-left mt-2.5 text-[14px] text-white/50 truncate">Latest: <span className="text-white/75">{last.who} {last.what.charAt(0).toLowerCase() + last.what.slice(1)}</span> · {ago(last.at)}</button>}
            {d.link.has_link && d.link.url && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a href={sms} onClick={(e) => e.stopPropagation()} className="min-h-[48px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition" style={{ background: 'rgba(53,208,127,0.12)', border: '1px solid rgba(53,208,127,0.35)', color: '#5ee09a' }}><MessageSquare size={17} /> Text it</a>
                <button onClick={copy} className="min-h-[48px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition" style={{ background: copied ? 'rgba(53,208,127,0.12)' : 'rgba(201,168,76,0.12)', border: '1px solid ' + (copied ? 'rgba(53,208,127,0.35)' : 'rgba(201,168,76,0.4)'), color: copied ? '#5ee09a' : '#D4B965' }}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy link'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
