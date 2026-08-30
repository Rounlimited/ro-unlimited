'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, FileText, Send, Copy, Check, ExternalLink, Trash2, Sparkles, Mail, Eye,
} from 'lucide-react';
import JobLogPanel from '@/components/admin/estimates/JobLogPanel';

/**
 * Reports — the weekly/monthly update JR used to type up.
 * "Draft This Week's Report" writes it from the phases, photos and billing;
 * he edits a line and either texts the link or emails it. Nothing reaches a
 * customer until he presses send.
 */

interface Report {
  id: string;
  period_start: string | null;
  period_end: string;
  percent: number;
  prev_percent: number;
  completed: string[];
  photos: { url: string; caption?: string | null }[];
  summary: string | null;
  next_up: string | null;
  status: 'draft' | 'sent';
  sent_at: string | null;
  sent_to: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  link: string | null;
}

const shortDate = (s: string | null) =>
  s ? new Date(s.length === 10 ? s + 'T00:00:00' : s)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function ReportsPanel({ estimateId, cadenceLabel }: { estimateId: string; cadenceLabel?: string | null }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/reports');
      const d = await res.json();
      if (Array.isArray(d.reports)) setReports(d.reports);
    } catch { /* keep last */ }
    setLoading(false);
  }, [estimateId]);

  useEffect(() => { load(); }, [load]);

  const draft = async () => {
    setDrafting(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/reports', { method: 'POST' });
      const d = await res.json();
      if (d.error) setMsg(d.error);
      else { await load(); setEditing(d.report); }
    } catch { setMsg('Could not draft the report'); }
    setDrafting(false);
  };

  const copy = async (r: Report) => {
    if (!r.link) return;
    try {
      await navigator.clipboard.writeText(r.link);
      setCopied(r.id);
      setTimeout(() => setCopied(null), 1800);
    } catch { setMsg('Copy blocked — the link is ' + r.link); }
  };

  if (loading) {
    return <div className="flex items-center gap-3 text-white/40 py-6"><Loader2 size={20} className="animate-spin" /> Loading reports…</div>;
  }

  return (
    <div className="space-y-3">
      {/* The log comes first: it is what the report is written from. */}
      <JobLogPanel estimateId={estimateId} />

      <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[17px] font-bold">Progress Reports</p>
            <p className="text-[14px] text-white/40 mt-0.5">
              {cadenceLabel
                ? `Contract promises: ${cadenceLabel}`
                : 'No reporting cadence set on this contract.'}
            </p>
          </div>
        </div>
        <button onClick={draft} disabled={drafting}
          className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)', boxShadow: '0 4px 18px rgba(201,168,76,0.35)' }}>
          {drafting ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={18} />}
          {drafting ? 'Writing it…' : 'Draft the Next Report'}
        </button>
        <p className="text-[13px] text-white/30 mt-2 text-center">
          Written from the phases, photos and billing. You review it before anyone sees it.
        </p>
        {msg && <p className="text-[15px] mt-3" style={{ color: '#f87171' }}>{msg}</p>}
      </div>

      {reports.length === 0 && (
        <p className="text-[15px] text-white/40 px-1">No reports yet.</p>
      )}

      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl border border-white/8 bg-[#111] p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[16px] font-bold">{shortDate(r.period_end)}</p>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
                  style={r.status === 'sent'
                    ? { background: 'rgba(53,208,127,0.15)', color: '#35d07f' }
                    : { background: 'rgba(156,163,175,0.15)', color: '#9ca3af' }}>
                  {r.status === 'sent' ? 'Sent' : 'Draft'}
                </span>
                {r.status === 'sent' && r.view_count > 0 && (
                  <span className="text-[12px] text-white/35 flex items-center gap-1">
                    <Eye size={12} /> {r.view_count}
                  </span>
                )}
              </div>
              <p className="text-[14px] text-white/40 mt-0.5">
                {r.percent}% complete{r.percent > r.prev_percent ? ` · up ${r.percent - r.prev_percent}%` : ''}
              </p>
            </div>
            <p className="text-[22px] font-bold shrink-0" style={{ color: '#D4B965' }}>{r.percent}%</p>
          </div>

          {r.summary && <p className="text-[15px] text-white/55 leading-relaxed line-clamp-3 mb-3">{r.summary}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setEditing(r)}
              className="min-h-[48px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-95"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.35)' }}>
              <FileText size={16} /> {r.status === 'sent' ? 'View' : 'Review & Send'}
            </button>
            <button onClick={() => copy(r)} disabled={!r.link || r.status !== 'sent'}
              className="min-h-[48px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {copied === r.id ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Link</>}
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <ReportSheet
          report={editing}
          onClose={() => setEditing(null)}
          onChanged={() => { load(); }}
          onSent={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── Review & send sheet ─────────────────────────────────────── */
function ReportSheet({ report, onClose, onChanged, onSent }: {
  report: Report; onClose: () => void; onChanged: () => void; onSent: () => void;
}) {
  const [summary, setSummary] = useState(report.summary || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<'email' | 'link' | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sent = report.status === 'sent';

  const save = async () => {
    if (summary === (report.summary || '')) return;
    setSaving(true);
    await fetch('/api/admin/reports/' + report.id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary }),
    }).catch(() => {});
    setSaving(false);
    onChanged();
  };

  const send = async (mode: 'email' | 'link') => {
    setSending(mode); setResult(null);
    await save();
    try {
      const res = await fetch('/api/admin/reports/' + report.id + '/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip_email: mode === 'link' }),
      });
      const d = await res.json();
      if (d.error && !d.sent) { setResult(d.error); setSending(null); return; }
      if (mode === 'link' && d.link) {
        try { await navigator.clipboard.writeText(d.link); setCopied(true); } catch { /* shown below */ }
      }
      setResult(d.emailed ? `Emailed to ${d.to}` : d.error || 'Link is live — paste it into a text.');
      onChanged();
      if (mode === 'email') setTimeout(onSent, 1200);
    } catch { setResult('Something went wrong sending it.'); }
    setSending(null);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10 p-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[20px] font-bold">{sent ? 'Report' : 'Review & Send'}</h2>
          <p className="text-[24px] font-bold" style={{ color: '#D4B965' }}>{report.percent}%</p>
        </div>
        <p className="text-[14px] text-white/40 mb-4">{shortDate(report.period_end)}</p>

        {report.completed.length > 0 && (
          <div className="rounded-xl p-3.5 mb-4" style={{ background: 'rgba(53,208,127,0.07)', border: '1px solid rgba(53,208,127,0.2)' }}>
            <p className="text-[13px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#35d07f' }}>Completed this period</p>
            <p className="text-[15px] text-white/70">{report.completed.join(' · ')}</p>
          </div>
        )}

        <label className="block text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">
          What the customer reads
        </label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} onBlur={save} rows={7}
          readOnly={sent}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[17px] leading-relaxed placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50 mb-1"
          placeholder="Written for you — edit anything that isn't right." />
        <p className="text-[13px] text-white/30 mb-4">
          {sent ? 'This report has already been sent.' : saving ? 'Saving…' : 'Edit freely — it saves as you go.'}
        </p>

        {report.photos.length > 0 && (
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-2">
              Photos included ({report.photos.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {report.photos.map((p, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={p.url.includes('cdn.sanity.io') ? p.url + '?w=200&auto=format' : p.url}
                  alt="" className="w-24 h-24 object-cover rounded-lg border border-white/10 shrink-0" />
              ))}
            </div>
          </div>
        )}

        {result && (
          <p className="text-[15px] mb-3" style={{ color: result.toLowerCase().includes('fail') || result.toLowerCase().includes('wrong') ? '#f87171' : '#35d07f' }}>
            {result}{copied ? ' (copied)' : ''}
          </p>
        )}

        {!sent ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => send('link')} disabled={sending !== null}
              className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }}>
              {sending === 'link' ? <Loader2 size={18} className="animate-spin" /> : <Copy size={17} />} Copy Link
            </button>
            <button onClick={() => send('email')} disabled={sending !== null}
              className="min-h-[56px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)', boxShadow: '0 4px 18px rgba(201,168,76,0.35)' }}>
              {sending === 'email' ? <Loader2 size={18} className="animate-spin" /> : <Mail size={17} />} Email It
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => { if (report.link) { navigator.clipboard.writeText(report.link).then(() => setCopied(true)).catch(() => {}); } }}
              className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {copied ? <><Check size={17} /> Copied</> : <><Copy size={17} /> Copy Link</>}
            </button>
            <a href={report.link || '#'} target="_blank" rel="noopener noreferrer"
              className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.35)' }}>
              <ExternalLink size={17} /> Open
            </a>
          </div>
        )}

        {!sent && (
          <button
            onClick={async () => {
              if (!confirm('Throw away this draft?')) return;
              await fetch('/api/admin/reports/' + report.id, { method: 'DELETE' }).catch(() => {});
              onChanged(); onClose();
            }}
            className="w-full min-h-[48px] mt-2.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 text-white/40 active:scale-[0.99]">
            <Trash2 size={15} /> Discard draft
          </button>
        )}
      </div>
    </div>
  );
}
