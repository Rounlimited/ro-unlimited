'use client';

import { useEffect, useState } from 'react';
import { Eye, Download, Smartphone, Monitor, Tablet, MapPin, Clock, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { summarizeVisits, eventSentence, fmtSeconds, timeAgo, type DocEventRow, type Summary, type Visit } from '@/lib/doc-events-summary';

/**
 * Customer Activity — what the customer actually did with the link.
 * `compact` = the summary strip on Overview; full = the visit timeline.
 */
export default function CustomerActivity({ estimateId, compact = false }: { estimateId: string; compact?: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<DocEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInternal, setShowInternal] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}/events`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events || []);
      setSummary(data.summary || summarizeVisits(data.events || []));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [estimateId]);

  if (loading) return <div className="text-[13px] text-white/30 py-2">Loading activity…</div>;
  if (!summary) return null;

  const nothingYet = summary.views === 0 && summary.pdf_views === 0 && summary.pdf_downloads === 0 && !summary.email.sent;

  if (compact) {
    return (
      <div className="bg-[#111] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Eye size={16} className="text-[#C9A84C]" /> Customer Activity
          </h3>
          <button onClick={load} className="text-white/30 hover:text-white/60" title="Refresh"><RefreshCw size={14} /></button>
        </div>
        {nothingYet ? (
          <p className="text-[13px] text-white/30">Not opened yet. You'll get a notification the first time the customer opens it.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <Stat label="Link opens" value={summary.views} sub={summary.unique_visitors > 1 ? `${summary.unique_visitors} devices` : undefined} />
              <Stat label="PDF" value={summary.pdf_views + summary.pdf_downloads} sub={summary.pdf_downloads ? `${summary.pdf_downloads} downloaded` : undefined} />
              <Stat label="Time reading" value={summary.total_seconds ? fmtSeconds(summary.total_seconds) : '—'} />
              <Stat label="Last seen" value={summary.last_view ? timeAgo(summary.last_view) : '—'} sub={summary.last_device || undefined} />
            </div>
            <div className="flex flex-wrap gap-2 text-[12px]">
              <Flag on={summary.email.sent} label={summary.email.opened ? 'Email opened' : summary.email.delivered ? 'Email delivered' : summary.email.bounced ? 'Email bounced' : 'Emailed'} bad={summary.email.bounced} />
              <Flag on={summary.reached_total} label="Saw the total" />
              <Flag on={summary.reached_sign} label="Reached the sign block" />
              {summary.last_location && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 text-white/40"><MapPin size={11} />{summary.last_location}</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  const visits = summary.visits.filter((v) => showInternal || !v.internal);
  const emailEvents = events.filter((e) => e.event.startsWith('email_')).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const internalCount = summary.visits.filter((v) => v.internal).length;

  return (
    <div className="bg-[#111] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
          <Eye size={16} className="text-[#C9A84C]" /> Customer Activity
        </h3>
        <div className="flex items-center gap-3">
          {internalCount > 0 && (
            <label className="flex items-center gap-1.5 text-[12px] text-white/30 cursor-pointer">
              <input type="checkbox" checked={showInternal} onChange={(e) => setShowInternal(e.target.checked)} className="accent-[#C9A84C]" />
              Show staff previews ({internalCount})
            </label>
          )}
          <button onClick={load} className="text-white/30 hover:text-white/60" title="Refresh"><RefreshCw size={14} /></button>
        </div>
      </div>

      {visits.length === 0 && emailEvents.length === 0 ? (
        <p className="text-[13px] text-white/30">No customer activity yet.</p>
      ) : (
        <div className="space-y-3">
          {emailEvents.length > 0 && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-[12px] text-white/40 mb-1.5"><Mail size={12} /> Email</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-white/60">
                {emailEvents.map((e) => (
                  <span key={e.id}>{eventSentence(e)} <span className="text-white/25">· {fmtWhen(e.created_at)}</span></span>
                ))}
              </div>
            </div>
          )}
          {visits.map((v, i) => <VisitCard key={v.started_at + i} visit={v} />)}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit: v }: { visit: Visit }) {
  const Icon = v.device.startsWith('iPhone') || v.device.startsWith('Android') || v.device.startsWith('Phone') ? Smartphone : v.device.startsWith('iPad') || v.device.startsWith('Tablet') ? Tablet : Monitor;
  const notable = v.events.filter((e) => e.event !== 'time_on_page');
  return (
    <div className={`rounded-lg border p-3 ${v.internal ? 'border-white/5 bg-white/[0.01] opacity-60' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-[13px] text-white/80">
          <Icon size={14} className="text-[#C9A84C]" />
          <span className="font-medium">{v.device || 'Unknown device'}</span>
          {v.location && <span className="text-white/40 flex items-center gap-1"><MapPin size={11} />{v.location}</span>}
          {v.internal ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">staff preview</span>
            : v.visit_number > 1 ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C]">visit #{v.visit_number}</span> : null}
        </div>
        <div className="flex items-center gap-3 text-[12px] text-white/35">
          {v.seconds != null && <span className="flex items-center gap-1"><Clock size={11} />{fmtSeconds(v.seconds)}</span>}
          <span>{fmtWhen(v.started_at)}</span>
        </div>
      </div>
      <ul className="space-y-1">
        {notable.map((e) => (
          <li key={e.id} className="flex items-center gap-2 text-[12.5px] text-white/60">
            {e.event === 'pdf_download' ? <Download size={12} className="text-sky-300" /> : e.event === 'signed' ? <CheckCircle2 size={12} className="text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-white/20 ml-[3px] mr-[3px]" />}
            {eventSentence(e)}
            <span className="text-white/20 text-[11px]">{new Date(e.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </li>
        ))}
        {v.seconds != null && v.max_scroll != null && (
          <li className="text-[12px] text-white/35 pl-5">Read {v.max_scroll}% of the page</li>
        )}
      </ul>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/30">{label}</div>
      <div className="text-[18px] font-bold text-white tabular-nums leading-tight mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-white/35 truncate">{sub}</div>}
    </div>
  );
}

function Flag({ on, label, bad }: { on: boolean; label: string; bad?: boolean }) {
  if (!on) return <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-white/5 text-white/20">{label}</span>;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${bad ? 'border-red-400/30 text-red-300' : 'border-emerald-400/30 text-emerald-300'}`}><CheckCircle2 size={11} />{label}</span>;
}

function fmtWhen(iso: string): string {
  const d = new Date(iso); const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today ${t}`;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${t}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${t}`;
}
