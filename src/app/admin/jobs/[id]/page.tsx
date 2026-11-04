'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, Eye, FileText, ClipboardList, Wallet, Plus, Trash2, CheckCircle2,
  CloudRain, CalendarDays, Lock, Mail, Save, TrendingUp, TrendingDown, ExternalLink, MessagesSquare, Send, Sparkles, Camera, Inbox, Paperclip,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import LinkControlsSheet from '@/components/admin/estimates/LinkControls';
import { Link2 as LinkIcon } from 'lucide-react';
import AppShell from '@/components/admin/AppShell';
import { SCHEDULE_META, BUDGET_META, STATUS_REASONS, cadenceLabel, type ScheduleStatus, type BudgetStatus } from '@/lib/reporting';
import { LOG_TYPES } from '@/lib/progress-reports';
import { REQUEST_KINDS } from '@/lib/customer-request-kinds';
import { INSPECTION_STATUS, PERMIT_STATUS } from '@/lib/inspection-status';

/**
 * The Job Room — JR's behind-the-scenes view of one job. Everything the
 * customer's link deliberately hides lives here: real costs and margin,
 * private log entries, his notes, status flags, and how often the customer
 * has actually looked. JR-sized throughout: 17px+ body, 48px targets.
 */

const fmt$ = (n: number) => '$' + Math.round(n).toLocaleString();

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'materials', label: 'Materials' },
  { id: 'subcontractor', label: 'Sub' },
  { id: 'labor', label: 'Labor' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'hauling', label: 'Hauling' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'permits', label: 'Permits' },
  { id: 'other', label: 'Other' },
];
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label || id;

interface FeedbackRow { id: string; kind: string; section: string | null; question: string | null; answer: string | null; rating: number | null; body: string | null; created_at: string; seen_at: string | null }

interface Room {
  estimate: any;
  messages: { id: string; author: string; author_name: string | null; body: string; created_at: string; answered_at: string | null }[];
  open_questions: number;
  requests: { id: string; kind: string; title: string; details: string | null; due_on: string | null; status: string; response_text: string | null; files: { name: string; url: string }[]; created_at: string; notified_at: string | null; submitted_at: string | null; done_at: string | null }[];
  feedback: FeedbackRow[];
  feedback_unseen: number;
  upcoming: { id: string; title: string; kind: string; starts_on: string; ends_on: string | null }[];
  inspections: { id: string; record_type: string; title: string; agency: string | null; reference: string | null; scheduled_on: string | null; time_window: string | null; status: string; result_on: string | null; notes: string | null; internal_notes: string | null }[];
  portal: { opens_7d: number; opens_30d: number; last_viewed_at: string | null; avg_seconds: number | null; sections: Record<string, number>; questions: { asked: number; answered: number; open: number; avg_answer_hours: number | null }; assistant: { asks_30d: number; answered_30d: number; handoffs_30d: number; helpful_yes: number; helpful_no: number; recent: { question: string; handoff: boolean; helpful: boolean | null }[] }; last_visible_entry: string | null; days_since_update: number | null };
  progress: { percent: number; phases: { phase: string; percent: number; value: number; earned: number }[]; total_value: number };
  money: { contract: number; earned: number; spent: number; margin: number; billed: number; paid: number; unbilled: number; by_category: Record<string, number> };
  costs: { id: string; spent_on: string; category: string; amount: number; vendor: string | null; note: string | null }[];
  invoices: any[];
  log: { id: string; entry_date: string; type: string; text: string | null; include_in_report: boolean }[];
  rain_days: number;
  days_on_job: number;
}

const fmtDay = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const timeAgo = (iso: string | null) => {
  if (!iso) return null;
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'just now';
  if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : d + ' days ago';
};

export default function JobRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  // Questions from the customer's page — answer right here.
  const [answer, setAnswer] = useState('');
  const [qBusy, setQBusy] = useState<'draft' | 'send' | null>(null);
  const [qNotice, setQNotice] = useState('');
  const draftAnswer = async () => {
    const open = (room?.messages || []).filter((m) => m.author === 'customer' && !m.answered_at);
    const last = open[open.length - 1];
    if (!last) return;
    setQBusy('draft'); setQNotice('');
    try {
      const d = await fetch('/api/admin/questions/' + last.id + '/draft', { method: 'POST' }).then((r) => r.json());
      if (d.draft) setAnswer(d.draft); else setQNotice(d.error || 'Could not draft — write it yourself.');
    } catch { setQNotice('Could not draft — write it yourself.'); }
    setQBusy(null);
  };
  const sendAnswer = async () => {
    if (!answer.trim()) { setQNotice('Write the answer first.'); return; }
    const open = (room?.messages || []).filter((m) => m.author === 'customer' && !m.answered_at);
    setQBusy('send'); setQNotice('');
    try {
      const d = await fetch('/api/admin/estimates/' + id + '/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: answer.trim(), question_id: open[open.length - 1]?.id || null }),
      }).then((r) => r.json());
      if (d.ok) { setQNotice(d.emailed ? 'Posted and emailed ' + d.to : (d.warning || 'Posted on their page')); setAnswer(''); await load(); }
      else setQNotice(d.error || 'Could not send.');
    } catch { setQNotice('Could not send — try again.'); }
    setQBusy(null);
  };
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // cost quick-add
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('materials');
  const [vendor, setVendor] = useState('');
  const [showAllCosts, setShowAllCosts] = useState(false);

  // notes
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState<'idle' | 'saving' | 'saved'>('idle');

  // notify
  const [notifying, setNotifying] = useState(false);
  const [showLinkControls, setShowLinkControls] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  // Quick update to the customer: a couple of lines and some photos.
  const [upText, setUpText] = useState('');
  const [upPhotos, setUpPhotos] = useState<{ url: string; caption: string | null }[]>([]);
  const [upBusy, setUpBusy] = useState<'draft' | 'photo' | 'send' | null>(null);
  const [upNotice, setUpNotice] = useState('');
  const [upOpen, setUpOpen] = useState(false);
  const draftUpdate = async () => {
    setUpBusy('draft'); setUpNotice('');
    try {
      const d = await fetch('/api/admin/estimates/' + id + '/update/draft', { method: 'POST' }).then((r) => r.json());
      if (d.draft) setUpText(d.draft); else setUpNotice(d.error || 'Could not draft — write it yourself.');
    } catch { setUpNotice('Could not draft — write it yourself.'); }
    setUpBusy(null);
  };
  const addUpdatePhotos = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setUpBusy('photo'); setUpNotice('');
    try {
      for (const f of Array.from(list).slice(0, 8)) {
        const fd = new FormData(); fd.append('file', f); fd.append('type', 'jobPhoto');
        const d = await fetch('/api/admin/upload', { method: 'POST', body: fd }).then((r) => r.json());
        if (d.url) setUpPhotos((p) => [...p, { url: d.url, caption: null }]); else setUpNotice(d.error || 'A photo failed to upload.');
      }
    } catch { setUpNotice('Photo upload failed — try again.'); }
    setUpBusy(null);
  };
  const sendUpdate = async () => {
    if (!upText.trim()) { setUpNotice('Write the update first.'); return; }
    setUpBusy('send'); setUpNotice('');
    try {
      const d = await fetch('/api/admin/estimates/' + id + '/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: upText.trim(), photos: upPhotos }),
      }).then((r) => r.json());
      if (d.ok) { setUpNotice(d.emailed ? 'Posted on their page and emailed ' + d.to + ' ✓' : 'Posted on their page ✓' + (d.warning ? ' — ' + d.warning : '')); setUpText(''); setUpPhotos([]); setUpOpen(false); await load(); }
      else setUpNotice(d.error || 'Could not send.');
    } catch { setUpNotice('Could not send — try again.'); }
    setUpBusy(null);
  };
  // Ask the customer for something (document, choice, answer).
  const [rqOpen, setRqOpen] = useState(false);
  const [rqKind, setRqKind] = useState<string>('document');
  const [rqTitle, setRqTitle] = useState('');
  const [rqDetails, setRqDetails] = useState('');
  const [rqDue, setRqDue] = useState('');
  const [rqBusy, setRqBusy] = useState(false);
  const [rqNotice, setRqNotice] = useState('');
  const sendRequest = async () => {
    if (!rqTitle.trim()) { setRqNotice('Say what you need from them.'); return; }
    setRqBusy(true); setRqNotice('');
    try {
      const d = await fetch('/api/admin/estimates/' + id + '/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: rqKind, title: rqTitle.trim(), details: rqDetails.trim() || null, due_on: rqDue || null }),
      }).then((r) => r.json());
      if (d.ok) { setRqNotice(d.emailed ? 'On their page and emailed ✓' : 'On their page ✓ (no email on file — text them their link)'); setRqTitle(''); setRqDetails(''); setRqDue(''); setRqOpen(false); await load(); }
      else setRqNotice(d.error || 'Could not send.');
    } catch { setRqNotice('Could not send — try again.'); }
    setRqBusy(false);
  };
  // Move a schedule item (with the reason the customer will read).
  const [moveId, setMoveId] = useState<string | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveNote, setMoveNote] = useState('');
  const moveItem = async () => {
    if (!moveId || !moveDate) { setMoveNote('Pick the new day.'); return; }
    setMoveBusy(true); setMoveNote('');
    try {
      const d = await fetch('/api/admin/schedule/' + moveId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ starts_on: moveDate, reason: moveReason.trim() || null }) }).then((r) => r.json());
      if (d.error) setMoveNote(d.error);
      else { setMoveNote(d.notified?.emailed ? 'Moved — posted on their page and emailed ✓' : 'Moved — posted on their page ✓' + (d.notified?.skipped ? ' (' + d.notified.skipped + ')' : '')); setMoveId(null); setMoveDate(''); setMoveReason(''); await load(); }
    } catch { setMoveNote('Could not move it — try again.'); }
    setMoveBusy(false);
  };
  // Permits & inspections
  const [inspOpen, setInspOpen] = useState(false);
  const [inspType, setInspType] = useState<'inspection' | 'permit'>('inspection');
  const [inspTitle, setInspTitle] = useState('');
  const [inspAgency, setInspAgency] = useState('');
  const [inspRef, setInspRef] = useState('');
  const [inspDate, setInspDate] = useState('');
  const [inspWindow, setInspWindow] = useState('');
  const [inspBusy, setInspBusy] = useState<string | null>(null);
  const [inspNote, setInspNote] = useState('');
  const [resultFor, setResultFor] = useState<{ id: string; status: string } | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const addInspection = async () => {
    if (!inspTitle.trim()) { setInspNote('Name it — "Final plumbing", "Water tap", "Grading permit".'); return; }
    setInspBusy('add'); setInspNote('');
    try {
      const d = await fetch('/api/admin/estimates/' + id + '/inspections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ record_type: inspType, title: inspTitle.trim(), agency: inspAgency.trim() || null, reference: inspRef.trim() || null, scheduled_on: inspDate || null, time_window: inspWindow.trim() || null }) }).then((r) => r.json());
      if (d.ok) { setInspNote('Added — it\u2019s on their page ✓'); setInspTitle(''); setInspRef(''); setInspDate(''); setInspWindow(''); setInspOpen(false); await load(); }
      else setInspNote(d.error || 'Could not add it.');
    } catch { setInspNote('Could not add it — try again.'); }
    setInspBusy(null);
  };
  const setInspStatus = async (recordId: string, status: string, notes?: string) => {
    setInspBusy(recordId); setInspNote('');
    try {
      const d = await fetch('/api/admin/estimates/' + id + '/inspections', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ record_id: recordId, status, ...(notes !== undefined ? { notes } : {}) }) }).then((r) => r.json());
      if (d.ok) { setInspNote(d.emailed ? 'Recorded — on their page and emailed ✓' : 'Recorded — on their page ✓' + (d.warning ? ' (' + d.warning + ')' : '')); setResultFor(null); setResultNotes(''); await load(); }
      else setInspNote(d.error || 'Could not record that.');
    } catch { setInspNote('Could not record that — try again.'); }
    setInspBusy(null);
  };
  const closeRequest = async (requestId: string, status: 'done' | 'open' | 'cancelled') => {
    await fetch('/api/admin/estimates/' + id + '/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: requestId, status }) });
    await load();
  };
  const [forceNotify, setForceNotify] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/admin/jobs/' + id + '/room').then((r) => r.json());
      if (!d.error) {
        setRoom(d); setNotes(d.estimate.internal_notes || '');
        // Opening the room counts as reading the feedback that was waiting.
        if (d.feedback_unseen > 0) fetch('/api/admin/estimates/' + id + '/feedback-seen', { method: 'POST' }).catch(() => {});
      }
    } catch { /* keep last */ }
    setLoading(false);
  }, [id]);

  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);
  const setFlag = async (field: 'feedback_enabled' | 'reviews_enabled' | 'show_schedule' | 'show_inspections' | 'show_photos' | 'show_assistant', value: boolean) => {
    setTogglingFlag(field);
    try {
      await fetch('/api/admin/estimates/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } catch { /* leave */ }
    setTogglingFlag(null);
  };

  useEffect(() => { load(); }, [load]);

  const addCost = async () => {
    const amt = Number(amount.replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0) return;
    setBusy(true);
    try {
      await fetch('/api/admin/estimates/' + id + '/costs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, category, vendor }),
      });
      setAmount(''); setVendor('');
      await load();
    } catch { /* leave */ }
    setBusy(false);
  };

  const removeCost = async (costId: string, label: string) => {
    if (!confirm('Remove ' + label + '?')) return;
    setBusy(true);
    try {
      await fetch('/api/admin/estimates/' + id + '/costs?id=' + costId, { method: 'DELETE' });
      await load();
    } catch { /* leave */ }
    setBusy(false);
  };

  const saveNotes = async () => {
    setNotesSaved('saving');
    try {
      await fetch('/api/admin/estimates/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_notes: notes }),
      });
      setNotesSaved('saved');
      setTimeout(() => setNotesSaved('idle'), 2500);
    } catch { setNotesSaved('idle'); }
  };

  const notifyCustomer = async () => {
    setNotifying(true);
    try {
      const res = await fetch('/api/admin/estimates/' + id + '/notify-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceNotify }),
      });
      const d = await res.json();
      if (d.warning) { setNotifyMsg(d.warning); setForceNotify(true); }
      else if (d.emailed) { setNotifyMsg('Emailed ' + d.to + ' ✓'); setForceNotify(false); }
      else setNotifyMsg(d.error || 'Could not send.');
    } catch { setNotifyMsg('Could not send — try again.'); }
    setNotifying(false);
  };

  if (loading) {
    return (
      <AppShell>
        <AdminHeader title="Job Room" backHref="/admin/jobs" />
        <div className="flex items-center gap-3 text-white/40 p-6"><Loader2 size={20} className="animate-spin" /> Loading the job…</div>
      </AppShell>
    );
  }
  if (!room) {
    return (
      <AppShell>
        <AdminHeader title="Job Room" backHref="/admin/jobs" />
        <p className="text-[16px] text-white/40 p-6">Could not load this job.</p>
      </AppShell>
    );
  }

  const e = room.estimate;
  const m = room.money;
  const customer = e.customer || {};
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.company_name || null;
  const sched = e.schedule_status ? SCHEDULE_META[e.schedule_status as ScheduleStatus] : null;
  const budget = e.budget_status ? BUDGET_META[e.budget_status as BudgetStatus] : null;
  const reason = STATUS_REASONS.find((r) => r.id === e.status_reason)?.label || null;
  const cadence = cadenceLabel(e.reporting_cadence, e.reporting_day);
  const marginPct = m.earned > 0 ? Math.round((m.margin / m.earned) * 100) : null;
  const spendingAhead = m.spent > m.earned && m.earned > 0;
  const shownCosts = showAllCosts ? room.costs : room.costs.slice(0, 6);
  const done = !!e.completed_at;

  return (
    <AppShell>
      <AdminHeader title={e.project_name || e.estimate_number} subtitle="Job Room — internal only" backHref="/admin/jobs" />
      <div className="px-4 sm:px-6 pt-3 pb-28 max-w-2xl mx-auto w-full min-w-0 overflow-x-hidden space-y-4">

        {/* ── The job at a glance ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-[15px] text-white/40">{e.estimate_number}</p>
              {customerName && <p className="text-[17px] font-semibold mt-0.5">{customerName}</p>}
              {customer.phone && (
                <a href={'tel:' + customer.phone} className="text-[16px] mt-0.5 inline-block" style={{ color: '#D4B965' }}>{customer.phone}</a>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[32px] font-bold leading-none" style={{ color: done ? '#35d07f' : '#D4B965' }}>{room.progress.percent}%</p>
              <p className="text-[13px] text-white/35 mt-1">{done ? 'Complete' : 'of ' + fmt$(m.contract)}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/8 overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: room.progress.percent + '%', background: done ? '#35d07f' : 'linear-gradient(90deg, #a8893d, #D4B965)' }} />
          </div>
          <div className="flex flex-wrap gap-2 text-[14px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60">
              <CalendarDays size={14} /> Day {room.days_on_job}
            </span>
            {room.rain_days > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60">
                <CloudRain size={14} /> {room.rain_days} rain {room.rain_days === 1 ? 'day' : 'days'}
              </span>
            )}
            {sched && <span className="px-3 py-1.5 rounded-full font-semibold" style={{ color: sched.color, background: sched.bg }}>{sched.label}</span>}
            {budget && <span className="px-3 py-1.5 rounded-full font-semibold" style={{ color: budget.color, background: budget.bg }}>{budget.label}</span>}
            {reason && <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/60">{reason}</span>}
          </div>
          {e.status_note && <p className="text-[15px] text-white/50 mt-3">&ldquo;{e.status_note}&rdquo;</p>}
        </div>

        {/* ── Money — the view the customer never gets ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-3 flex items-center gap-2"><Wallet size={18} style={{ color: '#D4B965' }} /> Money</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              ['Contract', m.contract, 'rgba(255,255,255,0.75)'],
              ['Earned', m.earned, '#D4B965'],
              ['Spent', m.spent, m.spent > 0 ? '#f0a04b' : 'rgba(255,255,255,0.4)'],
              ['Billed', m.billed, 'rgba(255,255,255,0.75)'],
              ['Paid', m.paid, '#35d07f'],
              ['Unbilled', m.unbilled, m.unbilled > 2500 ? '#f87171' : 'rgba(255,255,255,0.4)'],
            ].map(([label, v, c]) => (
              <div key={label as string} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[12px] uppercase tracking-wide text-white/35">{label}</p>
                <p className="text-[17px] font-bold mt-0.5" style={{ color: c as string }}>{fmt$(v as number)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: m.margin >= 0 ? 'rgba(53,208,127,0.08)' : 'rgba(248,113,113,0.08)', border: '1px solid ' + (m.margin >= 0 ? 'rgba(53,208,127,0.3)' : 'rgba(248,113,113,0.3)') }}>
            <div>
              <p className="text-[13px] uppercase tracking-wide text-white/40">Margin so far</p>
              <p className="text-[15px] text-white/40 mt-0.5">earned minus spent{marginPct !== null ? ` · ${marginPct}%` : ''}</p>
            </div>
            <p className="text-[26px] font-bold flex items-center gap-2" style={{ color: m.margin >= 0 ? '#35d07f' : '#f87171' }}>
              {m.margin >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}{fmt$(m.margin)}
            </p>
          </div>
          {spendingAhead && (
            <p className="text-[15px] mt-3" style={{ color: '#f87171' }}>
              Spending is ahead of earnings — worth a look at where the money went.
            </p>
          )}
          {m.unbilled > 2500 && !done && (
            <p className="text-[15px] mt-3" style={{ color: '#f0a04b' }}>
              {fmt$(m.unbilled)} of finished work hasn&rsquo;t been billed yet.
            </p>
          )}
        </div>

        {/* ── Costs — tap them in as they happen ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-1">Job Costs</p>
          <p className="text-[14px] text-white/40 mb-4">What you&rsquo;ve actually spent. This is what makes the margin real.</p>

          <div className="flex gap-2 mb-2">
            <input value={amount} onChange={(ev) => setAmount(ev.target.value)} inputMode="decimal" placeholder="$ amount"
              className="w-32 min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[17px] font-bold placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
            <input value={vendor} onChange={(ev) => setVendor(ev.target.value)} placeholder="Who / what (Ferguson — pipe)"
              className="flex-1 min-w-0 min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className="shrink-0 min-h-[44px] px-3.5 rounded-xl text-[15px] font-semibold active:scale-95 whitespace-nowrap"
                style={category === c.id
                  ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {c.label}
              </button>
            ))}
          </div>
          <button onClick={addCost} disabled={busy || !amount.trim()}
            className="w-full min-h-[52px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40"
            style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add Cost
          </button>

          {room.costs.length > 0 && (
            <div className="mt-4 space-y-2">
              {shownCosts.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold truncate">{fmt$(Number(c.amount))} · {catLabel(c.category)}</p>
                    <p className="text-[14px] text-white/40 truncate">{[c.vendor, fmtDay(c.spent_on)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button onClick={() => removeCost(c.id, fmt$(Number(c.amount)) + ' ' + catLabel(c.category))} disabled={busy}
                    className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center active:scale-95 shrink-0 disabled:opacity-40">
                    <Trash2 size={15} className="text-white/35" />
                  </button>
                </div>
              ))}
              {room.costs.length > 6 && (
                <button onClick={() => setShowAllCosts(!showAllCosts)} className="w-full min-h-[48px] rounded-xl text-[15px] font-semibold text-white/50 bg-white/4 active:scale-[0.99]">
                  {showAllCosts ? 'Show less' : `Show all ${room.costs.length}`}
                </button>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(m.by_category).sort((a, b) => b[1] - a[1]).map(([cat, v]) => (
                  <span key={cat} className="text-[13px] px-2.5 py-1 rounded-full bg-white/5 text-white/45">{catLabel(cat)} {fmt$(v)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Job log — private entries included ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[17px] font-bold">Job Log</p>
            <button onClick={() => router.push('/admin/estimates/' + e.id)}
              className="min-h-[44px] px-4 rounded-xl text-[15px] font-semibold active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Add Entry
            </button>
          </div>
          <p className="text-[14px] text-white/40 mb-3">Everything — entries the customer never sees are marked.</p>
          {room.log.length === 0 ? (
            <p className="text-[15px] text-white/35">Nothing logged yet.</p>
          ) : (
            <div className="space-y-2.5">
              {room.log.slice(0, 12).map((l) => {
                const t = LOG_TYPES.find((x) => x.id === l.type);
                return (
                  <div key={l.id} className="flex gap-3">
                    <div className="w-1 rounded-full shrink-0" style={{ background: l.type === 'rain' ? '#60a5fa' : l.type === 'delay' ? '#f87171' : 'rgba(201,168,76,0.5)' }} />
                    <div className="min-w-0 py-0.5">
                      <p className="text-[14px] text-white/35">
                        {fmtDay(l.entry_date)} · {t?.label || l.type}
                        {!l.include_in_report && (
                          <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                            <Lock size={11} /> Internal only
                          </span>
                        )}
                      </p>
                      {l.text && <p className="text-[16px] text-white/75 mt-0.5">{l.text}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Private notes ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-1 flex items-center gap-2"><Lock size={16} className="text-white/40" /> Private Notes</p>
          <p className="text-[14px] text-white/40 mb-3">Yours only — never printed, never sent, never on the customer&rsquo;s page.</p>
          <textarea value={notes} onChange={(ev) => setNotes(ev.target.value)} rows={4}
            placeholder="Locates expire soon… owner wants the extra hydrant priced… don't schedule concrete before the 15th…"
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-[16px] leading-relaxed placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
          <button onClick={saveNotes} disabled={notesSaved === 'saving'}
            className="w-full min-h-[48px] mt-2 rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
            {notesSaved === 'saving' ? <Loader2 size={17} className="animate-spin" /> : notesSaved === 'saved' ? <CheckCircle2 size={17} /> : <Save size={17} />}
            {notesSaved === 'saved' ? 'Saved' : 'Save Notes'}
          </button>
        </div>

        {/* ── Coming up on this job ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[17px] font-bold">Coming Up</p>
            <button onClick={() => router.push('/admin/schedule?job=' + e.id)}
              className="min-h-[44px] px-4 rounded-xl text-[15px] font-semibold active:scale-95"
              style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
              Schedule
            </button>
          </div>
          {room.upcoming.length === 0 ? (
            <p className="text-[15px] text-white/35 mt-1">Nothing scheduled on this job — tap Schedule to put the next pour, inspection or delivery on the board.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {room.upcoming.slice(0, 5).map((s) => {
                const overdue = s.starts_on < `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                return (
                  <div key={s.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[16px] font-semibold truncate">{s.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-[14px] font-semibold" style={{ color: overdue ? '#f87171' : '#D4B965' }}>{overdue ? 'Slipped · ' : ''}{fmtDay(s.starts_on)}</p>
                        <button onClick={() => { setMoveId(moveId === s.id ? null : s.id); setMoveDate(s.starts_on); setMoveReason(''); setMoveNote(''); }} className="min-h-[40px] px-3 rounded-lg text-[14px] font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>Move</button>
                      </div>
                    </div>
                    {moveId === s.id && (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={moveDate} onChange={(ev) => setMoveDate(ev.target.value)} className="min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" style={{ colorScheme: 'dark' }} />
                          <input value={moveReason} onChange={(ev) => setMoveReason(ev.target.value)} placeholder="Why (they will read this)" className="min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
                        </div>
                        <button onClick={moveItem} disabled={moveBusy} className="w-full min-h-[48px] rounded-xl text-[15px] font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>{moveBusy ? 'Moving…' : 'Move it and tell the customer'}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {moveNote && <p className="text-[15px] mt-2" style={{ color: moveNote.includes('✓') ? '#35d07f' : '#D4B965' }}>{moveNote}</p>}
        </div>

        {/* ── Permits & inspections — the county record, feeding the customer's page ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[17px] font-bold">Permits &amp; Inspections</p>
            <button onClick={() => setInspOpen((v) => !v)} className="min-h-[44px] px-4 rounded-xl text-[15px] font-semibold active:scale-95" style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}><Plus size={16} className="inline -mt-0.5" /> Add</button>
          </div>
          <p className="text-[14px] text-white/40 mb-3">Each one shows on the customer&rsquo;s page in plain words. Results post to their timeline and email them.</p>
          {inspOpen && (
            <div className="space-y-2 mb-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-2 gap-2">
                {(['inspection', 'permit'] as const).map((t) => (
                  <button key={t} onClick={() => setInspType(t)} className="min-h-[44px] rounded-xl text-[15px] font-bold capitalize" style={{ background: inspType === t ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.05)', color: inspType === t ? '#D4B965' : 'rgba(255,255,255,0.7)', border: '1px solid ' + (inspType === t ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.12)') }}>{t}</button>
                ))}
              </div>
              <input value={inspTitle} onChange={(ev) => setInspTitle(ev.target.value)} placeholder={inspType === 'permit' ? 'e.g. Grading permit' : 'e.g. County inspection — water tap'} className="w-full min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={inspAgency} onChange={(ev) => setInspAgency(ev.target.value)} placeholder="Agency (Pickens County)" className="min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
                <input value={inspRef} onChange={(ev) => setInspRef(ev.target.value)} placeholder={inspType === 'permit' ? 'Permit #' : 'Ref # (optional)'} className="min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
              </div>
              {inspType === 'inspection' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={inspDate} onChange={(ev) => setInspDate(ev.target.value)} className="min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" style={{ colorScheme: 'dark' }} />
                  <input value={inspWindow} onChange={(ev) => setInspWindow(ev.target.value)} placeholder="Window (8–12)" className="min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
                </div>
              )}
              <button onClick={addInspection} disabled={inspBusy !== null} className="w-full min-h-[48px] rounded-xl text-[15px] font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>{inspBusy === 'add' ? 'Adding…' : 'Add to the job'}</button>
            </div>
          )}
          {room.inspections.length === 0 ? (
            <p className="text-[15px] text-white/35">None recorded yet. Add the permit and the inspections as the county schedules them.</p>
          ) : (
            <div className="space-y-2">
              {room.inspections.map((r) => {
                const words = r.record_type === 'permit' ? PERMIT_STATUS : INSPECTION_STATUS;
                const open = r.record_type === 'permit' ? ['applied', 'issued'].includes(r.status) : ['scheduled', 'reinspection', 'corrections', 'failed'].includes(r.status);
                const nextStatuses = r.record_type === 'permit'
                  ? (r.status === 'applied' ? [['issued', 'Issued']] : r.status === 'issued' ? [['closed', 'Closed out']] : [])
                  : (r.status === 'scheduled' || r.status === 'reinspection' ? [['passed', 'Passed'], ['corrections', 'Corrections'], ['failed', 'Did not pass']] : r.status === 'corrections' || r.status === 'failed' ? [['reinspection', 'Re-inspect'], ['passed', 'Passed']] : []);
                return (
                  <div key={r.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (r.status === 'corrections' || r.status === 'failed' ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.06)') }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold text-white/90">{r.title} <span className="text-white/40 font-normal capitalize">· {r.record_type}</span></p>
                        <p className="text-[14px] text-white/50">{[words[r.status] || r.status, r.scheduled_on ? fmtDay(r.scheduled_on) : null, r.time_window, r.agency, r.reference ? '#' + r.reference : null].filter(Boolean).join(' · ')}</p>
                        {r.notes && <p className="text-[15px] text-white/70 mt-1">{r.notes}</p>}
                      </div>
                    </div>
                    {open && nextStatuses.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {nextStatuses.map(([st, label]) => (
                          <button key={st} onClick={() => (st === 'corrections' || st === 'failed' ? setResultFor({ id: r.id, status: st }) : setInspStatus(r.id, st))} disabled={inspBusy !== null}
                            className="min-h-[40px] px-3 rounded-lg text-[14px] font-bold disabled:opacity-50"
                            style={st === 'passed' || st === 'issued' || st === 'closed' ? { background: 'rgba(53,208,127,0.12)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>{label}</button>
                        ))}
                      </div>
                    )}
                    {resultFor?.id === r.id && (
                      <div className="mt-2 space-y-2">
                        <textarea value={resultNotes} onChange={(ev) => setResultNotes(ev.target.value)} rows={2} placeholder="What the inspector flagged (the customer reads this)" className="w-full rounded-xl px-3 py-2 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setResultFor(null)} className="min-h-[44px] rounded-xl text-[15px] font-bold text-white/70" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>Cancel</button>
                          <button onClick={() => setInspStatus(r.id, resultFor.status, resultNotes.trim())} disabled={inspBusy !== null} className="min-h-[44px] rounded-xl text-[15px] font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>Record it</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {inspNote && <p className="text-[15px] mt-2" style={{ color: inspNote.includes('✓') ? '#35d07f' : '#D4B965' }}>{inspNote}</p>}
        </div>

        {/* ── Questions from their page — answered here, emailed to them ── */}
        <div className="rounded-2xl border p-5" style={{ background: '#111', borderColor: room.open_questions > 0 ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[17px] font-bold flex items-center gap-2"><MessagesSquare size={18} style={{ color: '#6db3f2' }} /> Questions</p>
            {room.open_questions > 0 && (
              <span className="px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(201,168,76,0.18)', color: '#D4B965' }}>{room.open_questions} waiting</span>
            )}
          </div>
          <p className="text-[14px] text-white/40 mb-3">What they asked on their project page. Your answer posts there and emails them.</p>
          {room.messages.length === 0 ? (
            <p className="text-[15px] text-white/35">No questions yet.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {room.messages.slice(-8).map((m) => (
                <div key={m.id} className="rounded-xl px-3.5 py-2.5" style={m.author === 'ro'
                  ? { background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', marginLeft: 16 }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[13px] text-white/40">{m.author === 'ro' ? (m.author_name || 'RO') : (m.author_name || 'Customer')} · {timeAgo(m.created_at)}{m.author === 'customer' && !m.answered_at && <span className="ml-2 font-semibold" style={{ color: '#f0a04b' }}>waiting</span>}</p>
                  <p className="text-[16px] text-white/85 mt-0.5 whitespace-pre-line">{m.body}</p>
                </div>
              ))}
            </div>
          )}
          {room.open_questions > 0 && (
            <>
              <textarea id="job-room-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder="Type the answer, or tap Draft…"
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-[17px] leading-relaxed placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
              {qNotice && <p className="text-[15px] mt-2" style={{ color: /Posted/.test(qNotice) ? '#35d07f' : '#f87171' }}>{qNotice}</p>}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={draftAnswer} disabled={qBusy !== null} className="min-h-[52px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50" style={{ background: 'rgba(59,141,212,0.14)', color: '#6db3f2', border: '1px solid rgba(59,141,212,0.4)' }}>
                  {qBusy === 'draft' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Draft an answer
                </button>
                <button onClick={sendAnswer} disabled={qBusy !== null || !answer.trim()} className="min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                  {qBusy === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send answer
                </button>
              </div>
            </>
          )}
          {room.open_questions === 0 && room.messages.length > 0 && qNotice && <p className="text-[15px] mt-1" style={{ color: '#35d07f' }}>{qNotice}</p>}
        </div>

        {/* ── What the customer had to say ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[17px] font-bold">Customer Feedback</p>
            {room.feedback_unseen > 0 && (
              <span className="px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(201,168,76,0.18)', color: '#D4B965' }}>
                {room.feedback_unseen} new
              </span>
            )}
          </div>
          <p className="text-[14px] text-white/40 mb-3">Notes, quick answers and ratings from their project page — only you see these.</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {([['feedback_enabled', 'Notes & questions'], ['reviews_enabled', 'Star ratings']] as const).map(([field, label]) => {
              const on = e[field] !== false;
              return (
                <button key={field} onClick={() => setFlag(field, !on)} disabled={togglingFlag !== null}
                  className="min-h-[52px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  style={on
                    ? { background: 'rgba(53,208,127,0.12)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {togglingFlag === field ? <Loader2 size={15} className="animate-spin" /> : null}
                  {label}: {on ? 'ON' : 'OFF'}
                </button>
              );
            })}
          </div>

          {room.feedback.length === 0 ? (
            <p className="text-[15px] text-white/35">Nothing yet — when they tap an answer, leave a note or rate the job, it lands here.</p>
          ) : (
            <div className="space-y-2.5">
              {room.feedback.slice(0, 10).map((f) => (
                <div key={f.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[14px] text-white/35 flex items-center gap-2 flex-wrap">
                    {!f.seen_at && <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#D4B965' }} />}
                    {fmtDay(f.created_at.slice(0, 10))}
                    {f.kind === 'review' && f.rating != null && (
                      <span style={{ color: '#D4B965' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                    )}
                    {f.kind === 'pulse' && <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: /concern/i.test(f.answer || '') ? 'rgba(248,113,113,0.15)' : 'rgba(53,208,127,0.12)', color: /concern/i.test(f.answer || '') ? '#f87171' : '#35d07f' }}>{f.answer}</span>}
                    {f.kind === 'comment' && f.section && <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-white/8 text-white/50 capitalize">{f.section}</span>}
                  </p>
                  {f.body && <p className="text-[16px] text-white/75 mt-1">{f.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Send them an update: two lines + photos, straight to their page ── */}
        <div className="rounded-2xl border p-5" style={{ background: '#111', borderColor: 'rgba(201,168,76,0.3)' }}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[17px] font-bold flex items-center gap-2"><Send size={18} style={{ color: '#D4B965' }} /> Send Them an Update</p>
          </div>
          <p className="text-[15px] text-white/50 mb-3">Lands on their project page under &ldquo;What&rsquo;s Been Happening&rdquo;, goes in the next report, and emails them if they want emails. No texting back and forth.</p>
          {!upOpen ? (
            <button onClick={() => { setUpOpen(true); if (!upText) draftUpdate(); }}
              className="w-full min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
              <Sparkles size={18} /> Write an Update
            </button>
          ) : (
            <div className="space-y-3">
              <textarea value={upText} onChange={(e) => setUpText(e.target.value)} rows={4} placeholder={upBusy === 'draft' ? 'Drafting from the log…' : 'What happened, what\u2019s next…'}
                className="w-full rounded-xl px-4 py-3 text-[17px] text-white bg-white/5 border border-white/10 outline-none focus:border-[#D4B965]/60" />
              {upPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {upPhotos.map((p, i) => (
                    <div key={i} className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url.includes('cdn.sanity.io') ? p.url + '?w=240&auto=format' : p.url} alt="" className="w-24 h-20 object-cover rounded-lg" />
                      <button onClick={() => setUpPhotos((a) => a.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -top-2 -right-2 w-8 h-8 rounded-full text-white text-[15px] font-bold" style={{ background: '#333', border: '1px solid rgba(255,255,255,0.2)' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {upBusy === 'photo' ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />} Add Photos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addUpdatePhotos(e.target.files)} />
                </label>
                <button onClick={draftUpdate} disabled={upBusy !== null}
                  className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                  style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
                  {upBusy === 'draft' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Draft It for Me
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setUpOpen(false); setUpNotice(''); }} disabled={upBusy !== null} className="min-h-[52px] rounded-xl text-[16px] font-bold text-white/70" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>Cancel</button>
                <button onClick={sendUpdate} disabled={upBusy !== null || !upText.trim()}
                  className="min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                  {upBusy === 'send' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Send to Customer
                </button>
              </div>
            </div>
          )}
          {upNotice && <p className="text-[15px] mt-2" style={{ color: upNotice.includes('✓') ? '#35d07f' : '#D4B965' }}>{upNotice}</p>}
        </div>

        {/* ── Ask them for something: the county-portal "corrections" list ── */}
        <div className="rounded-2xl border p-5" style={{ background: '#111', borderColor: room.requests.some((r) => r.status === 'submitted') ? 'rgba(53,208,127,0.45)' : 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[17px] font-bold flex items-center gap-2"><Inbox size={18} style={{ color: '#D4B965' }} /> Need Something From Them?</p>
            {room.requests.some((r) => r.status === 'submitted') && (
              <span className="px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(53,208,127,0.15)', color: '#35d07f' }}>{room.requests.filter((r) => r.status === 'submitted').length} came back</span>
            )}
          </div>
          <p className="text-[15px] text-white/50 mb-3">HOA letter, survey, a color choice, a yes or no. It goes under &ldquo;Needs you&rdquo; on their page with an upload button, and you get told when it comes back.</p>
          {room.requests.filter((r) => r.status !== 'cancelled').length > 0 && (
            <div className="space-y-2 mb-3">
              {room.requests.filter((r) => r.status !== 'cancelled').slice(0, 8).map((r) => (
                <div key={r.id} className="rounded-xl px-3 py-2.5" style={{ background: r.status === 'submitted' ? 'rgba(53,208,127,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (r.status === 'submitted' ? 'rgba(53,208,127,0.3)' : 'rgba(255,255,255,0.06)') }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-white/90">{r.title}</p>
                      <p className="text-[14px] text-white/45">
                        {r.status === 'open' ? 'Waiting on them' + (r.due_on ? ' · by ' + fmtDay(r.due_on) : '') + (r.notified_at ? ' · emailed' : '')
                          : r.status === 'submitted' ? 'Came back ' + (r.submitted_at ? timeAgo(r.submitted_at) : '')
                          : 'Done' + (r.done_at ? ' ' + timeAgo(r.done_at) : '')}
                      </p>
                      {r.response_text && <p className="text-[16px] text-white/75 mt-1 whitespace-pre-line">{r.response_text}</p>}
                      {Array.isArray(r.files) && r.files.length > 0 && (
                        <ul className="mt-1 space-y-0.5">{r.files.map((f, i) => <li key={i}><a href={f.url} target="_blank" rel="noreferrer" className="text-[15px] inline-flex items-center gap-1.5 underline" style={{ color: '#D4B965' }}><Paperclip size={14} /> {f.name}</a></li>)}</ul>
                      )}
                    </div>
                    {r.status !== 'done' && (
                      <button onClick={() => closeRequest(r.id, 'done')} className="shrink-0 min-h-[40px] px-3 rounded-lg text-[14px] font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>{r.status === 'submitted' ? 'Got it' : 'Cancel'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!rqOpen ? (
            <button onClick={() => setRqOpen(true)}
              className="w-full min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
              <Plus size={18} /> Ask Them for Something
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {REQUEST_KINDS.map((k) => (
                  <button key={k.id} onClick={() => setRqKind(k.id)} className="min-h-[44px] px-4 rounded-full text-[15px] font-bold"
                    style={{ background: rqKind === k.id ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.05)', color: rqKind === k.id ? '#D4B965' : 'rgba(255,255,255,0.7)', border: '1px solid ' + (rqKind === k.id ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.12)') }}>{k.label}</button>
                ))}
              </div>
              <input value={rqTitle} onChange={(e) => setRqTitle(e.target.value)} placeholder={rqKind === 'document' ? 'e.g. HOA approval letter' : rqKind === 'selection' ? 'e.g. Pick the pipe color' : 'What do you need from them?'}
                className="w-full min-h-[52px] rounded-xl px-4 text-[17px] text-white bg-white/5 border border-white/10 outline-none focus:border-[#D4B965]/60" />
              <textarea value={rqDetails} onChange={(e) => setRqDetails(e.target.value)} rows={2} placeholder="Any details for them (optional)"
                className="w-full rounded-xl px-4 py-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none focus:border-[#D4B965]/60" />
              <label className="block">
                <span className="text-[14px] text-white/50">Needed by (optional)</span>
                <input type="date" value={rqDue} onChange={(e) => setRqDue(e.target.value)} className="mt-1 w-full min-h-[48px] rounded-xl px-4 text-[16px] text-white bg-white/5 border border-white/10 outline-none" style={{ colorScheme: 'dark' }} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setRqOpen(false); setRqNotice(''); }} disabled={rqBusy} className="min-h-[52px] rounded-xl text-[16px] font-bold text-white/70" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>Cancel</button>
                <button onClick={sendRequest} disabled={rqBusy || !rqTitle.trim()}
                  className="min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                  {rqBusy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Send Request
                </button>
              </div>
            </div>
          )}
          {rqNotice && <p className="text-[15px] mt-2" style={{ color: rqNotice.includes('✓') ? '#35d07f' : '#D4B965' }}>{rqNotice}</p>}
        </div>

        {/* ── Portal pulse: are they looking, what do they read, is the assistant helping ── */}
        {room.portal && (() => {
          const pp = room.portal;
          const SEC: Record<string, string> = { 'needs-you': 'Needs you', story: 'Timeline', schedule: 'Schedule', inspections: 'Inspections', requests: 'Requests', questions: 'Questions', assistant: 'Assistant', glossary: 'Glossary', scope: 'Scope', total: 'Price', sign: 'Signature' };
          const secs = Object.entries(pp.sections).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const stale = pp.days_since_update != null && pp.days_since_update >= 7;
          return (
            <div className="rounded-2xl border p-5" style={{ background: '#111', borderColor: stale ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.08)' }}>
              <p className="text-[17px] font-bold mb-1">Portal Pulse</p>
              <p className="text-[15px] text-white/50 mb-3">
                Opened <strong className="text-white/85">{pp.opens_7d}×</strong> this week, {pp.opens_30d}× in 30 days{pp.avg_seconds ? <> · about {pp.avg_seconds >= 90 ? Math.round(pp.avg_seconds / 60) + ' min' : pp.avg_seconds + ' sec'} a visit</> : null}.
                {pp.days_since_update != null && <> Last visible update <strong style={{ color: stale ? '#f87171' : 'rgba(255,255,255,0.85)' }}>{pp.days_since_update === 0 ? 'today' : pp.days_since_update + ' days ago'}</strong>{stale ? ' — silence reads as trouble; post two lines.' : '.'}</>}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}><p className="text-[24px] font-bold leading-none" style={{ color: pp.questions.open ? '#D4B965' : '#fff' }}>{pp.questions.answered}/{pp.questions.asked}</p><p className="text-[13px] text-white/50 mt-1">Questions answered{pp.questions.avg_answer_hours != null ? ` · ${pp.questions.avg_answer_hours}h avg` : ''}</p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}><p className="text-[24px] font-bold leading-none text-white">{pp.assistant.answered_30d}/{pp.assistant.asks_30d}</p><p className="text-[13px] text-white/50 mt-1">Assistant answered · {pp.assistant.handoffs_30d} to you</p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}><p className="text-[24px] font-bold leading-none" style={{ color: pp.assistant.helpful_no ? '#f87171' : '#35d07f' }}>{pp.assistant.helpful_yes}👍 {pp.assistant.helpful_no}👎</p><p className="text-[13px] text-white/50 mt-1">Rated by the customer</p></div>
              </div>
              {secs.length > 0 && (
                <p className="text-[14px] text-white/50">What they read most: {secs.map(([k, v]) => `${SEC[k] || k} (${v})`).join(' · ')}</p>
              )}
              {pp.assistant.recent.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-white/40">They asked the assistant</p>
                  {pp.assistant.recent.map((a, i) => <p key={i} className="text-[15px] text-white/75">&ldquo;{a.question}&rdquo; <span className="text-white/40">— {a.handoff ? 'handed to you' : a.helpful === false ? 'answered, not helpful → handed to you' : a.helpful ? 'answered, helpful' : 'answered'}</span></p>)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── The customer's side of the glass ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
          <p className="text-[17px] font-bold mb-1">The Customer&rsquo;s View</p>
          <p className="text-[15px] text-white/50 mb-3">
            {e.view_count > 0
              ? <>They&rsquo;ve opened their page <strong className="text-white/80">{e.view_count}{e.view_count === 1 ? ' time' : ' times'}</strong>{e.last_viewed_at ? <> — last {timeAgo(e.last_viewed_at)}</> : null}.</>
              : 'They haven’t opened their page yet.'}
            {cadence ? <> Reporting: {cadence}.</> : null}
          </p>
          <p className="text-[14px] text-white/40 mb-2">What they can see on their page:</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {([['show_schedule', 'Schedule'], ['show_inspections', 'Inspections'], ['show_photos', 'Photos'], ['show_assistant', 'Assistant']] as const).map(([field, label]) => {
              const on = (e as any)[field] !== false;
              return (
                <button key={field} onClick={() => setFlag(field, !on)} disabled={togglingFlag !== null}
                  className="min-h-[52px] rounded-xl text-[14px] font-bold flex flex-col items-center justify-center active:scale-[0.98] disabled:opacity-50"
                  style={on ? { background: 'rgba(53,208,127,0.12)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.4)' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span>{label}</span><span className="text-[12px]">{togglingFlag === field ? '…' : on ? 'ON' : 'OFF'}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-2">
            <a href={'/estimate/' + e.share_token} target="_blank" rel="noreferrer"
              className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Eye size={18} /> See What They See
            </a>
            <button onClick={notifyCustomer} disabled={notifying}
              className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
              {notifying ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Email Them an Update
            </button>
            <button onClick={() => setShowLinkControls(true)}
              className="min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <LinkIcon size={18} /> Link Controls
            </button>
          </div>
          {notifyMsg && <p className="text-[14px] mt-2 text-center" style={{ color: notifyMsg.includes('✓') ? '#35d07f' : '#D4B965' }}>{notifyMsg}</p>}
        </div>

        {/* ── Doors to the rest ── */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push('/admin/estimates/' + e.id)}
            className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <FileText size={18} /> Contract &amp; Tabs
          </button>
          <button onClick={() => router.push('/admin/invoices?estimate=' + e.id)}
            className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <ClipboardList size={18} /> Invoices
          </button>
        </div>
      </div>
      {showLinkControls && <LinkControlsSheet estimateId={String(id)} onClose={() => setShowLinkControls(false)} />}
    </AppShell>
  );
}
