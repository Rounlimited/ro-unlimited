'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageCircle, Send, Sparkles, Phone, CheckCircle2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AppShell from '@/components/admin/AppShell';

/**
 * Questions — every customer question from every project page, newest first.
 * Answer from the phone: the reply lands in the thread on their page and
 * they get an email that it's there. JR-sized: 17px+ body, 48px targets,
 * words not colors. "Draft an answer" writes one from the job's records;
 * he edits it or sends it.
 */

interface Q {
  id: string; estimate_id: string; body: string; author_name: string | null; created_at: string;
  answered_at: string | null; answered_by: string | null;
  estimate: { id: string; estimate_number: string; project_name: string | null; share_token: string | null; customer: { first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; phone: string | null } | null };
  answer?: { body: string; author_name: string | null; created_at: string } | null;
}

const ago = (iso: string) => {
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 60) return Math.max(1, Math.round(m)) + ' min ago';
  const h = m / 60;
  if (h < 24) return Math.round(h) + ' hr ago';
  const d = h / 24;
  if (d < 7) return Math.round(d) + (Math.round(d) === 1 ? ' day ago' : ' days ago');
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const who = (c: Q['estimate']['customer'], fallback: string | null) =>
  fallback || c?.first_name || c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Customer';

export default function QuestionsPage() {
  const [open, setOpen] = useState<Q[]>([]);
  const [answered, setAnswered] = useState<Q[]>([]);
  const [stats, setStats] = useState<{ avg: number | null; oldest: number }>({ avg: null, oldest: 0 });
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});
  const [showAnswered, setShowAnswered] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/admin/questions').then((r) => r.json());
      if (!d.error) { setOpen(d.open); setAnswered(d.answered); setStats({ avg: d.avg_answer_hours, oldest: d.oldest_open_hours }); }
    } catch { /* keep last */ }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const draft = async (q: Q) => {
    setBusy('draft:' + q.id); setNotice((n) => ({ ...n, [q.id]: '' }));
    try {
      const d = await fetch('/api/admin/questions/' + q.id + '/draft', { method: 'POST' }).then((r) => r.json());
      if (d.draft) setDrafts((x) => ({ ...x, [q.id]: d.draft }));
      else setNotice((n) => ({ ...n, [q.id]: d.error || 'Could not draft — write it yourself.' }));
    } catch { setNotice((n) => ({ ...n, [q.id]: 'Could not draft — write it yourself.' })); }
    setBusy(null);
  };

  const send = async (q: Q) => {
    const text = (drafts[q.id] || '').trim();
    if (!text) { setNotice((n) => ({ ...n, [q.id]: 'Write the answer first.' })); return; }
    setBusy('send:' + q.id);
    try {
      const d = await fetch('/api/admin/estimates/' + q.estimate_id + '/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, question_id: q.id }),
      }).then((r) => r.json());
      if (d.ok) {
        setNotice((n) => ({ ...n, [q.id]: d.emailed ? 'Answered — emailed ' + d.to : (d.warning || 'Answered — on their page (no email on file)') }));
        setDrafts((x) => { const y = { ...x }; delete y[q.id]; return y; });
        await load();
      } else setNotice((n) => ({ ...n, [q.id]: d.error || 'Could not send.' }));
    } catch { setNotice((n) => ({ ...n, [q.id]: 'Could not send — try again.' })); }
    setBusy(null);
  };

  const oldestLabel = stats.oldest >= 48 ? Math.round(stats.oldest / 24) + ' days' : stats.oldest >= 1 ? stats.oldest + ' hr' : open.length ? 'under 1 hr' : '—';

  return (
    <AppShell>
      <AdminHeader title="Questions" subtitle="From customers' project pages" backHref="/admin" />
      <div className="px-4 pb-28 max-w-3xl mx-auto space-y-4">

        {/* The numbers that matter */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: open.length ? '#D4B965' : '#35d07f' }}>{open.length}</p>
            <p className="text-[14px] text-white/50 mt-1">Waiting</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <p className="text-[28px] font-bold leading-none text-white">{open.length ? oldestLabel : '—'}</p>
            <p className="text-[14px] text-white/50 mt-1">Oldest waiting</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <p className="text-[28px] font-bold leading-none text-white">{stats.avg == null ? '—' : stats.avg < 1 ? Math.round(stats.avg * 60) + 'm' : stats.avg + 'h'}</p>
            <p className="text-[14px] text-white/50 mt-1">Typical answer</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-white/40" /></div>
        ) : open.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-[#111] p-6 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: '#35d07f' }} />
            <p className="text-[18px] font-bold">Nothing waiting</p>
            <p className="text-[15px] text-white/50 mt-1">When a customer asks something on their project page, it shows up here and you get a push.</p>
          </div>
        ) : open.map((q) => {
          const c = q.estimate?.customer;
          const name = who(c, q.author_name);
          const project = q.estimate?.project_name || q.estimate?.estimate_number;
          const hours = (Date.now() - new Date(q.created_at).getTime()) / 3600000;
          return (
            <div key={q.id} className="rounded-2xl border p-4" style={{ background: '#111', borderColor: hours > 4 ? 'rgba(240,160,75,0.5)' : 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={'/admin/jobs/' + q.estimate_id} className="text-[17px] font-bold text-white truncate block">{project}</Link>
                  <p className="text-[15px] text-white/55">{name} · {ago(q.created_at)}{hours > 4 && <span className="ml-2 font-semibold" style={{ color: '#f0a04b' }}>waiting {Math.round(hours)} hr</span>}</p>
                </div>
                {c?.phone && (
                  <a href={'tel:' + c.phone.replace(/[^0-9+]/g, '')} className="min-h-[44px] px-3 rounded-xl flex items-center gap-1.5 text-[14px] font-semibold shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>
                    <Phone size={15} /> Call
                  </a>
                )}
              </div>

              <p className="text-[18px] text-white leading-relaxed mt-3 whitespace-pre-line rounded-xl px-4 py-3" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>{q.body}</p>

              <textarea
                id={'answer-' + q.id}
                value={drafts[q.id] || ''}
                onChange={(e) => setDrafts((x) => ({ ...x, [q.id]: e.target.value }))}
                rows={4}
                placeholder="Type the answer, or tap Draft an answer…"
                className="w-full mt-3 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-[17px] leading-relaxed placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50"
              />
              {notice[q.id] && <p className="text-[15px] mt-2" style={{ color: /Answered/.test(notice[q.id]) ? '#35d07f' : '#f87171' }}>{notice[q.id]}</p>}

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => draft(q)} disabled={busy !== null}
                  className="min-h-[52px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'rgba(59,141,212,0.14)', color: '#6db3f2', border: '1px solid rgba(59,141,212,0.4)' }}>
                  {busy === 'draft:' + q.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Draft an answer
                </button>
                <button onClick={() => send(q)} disabled={busy !== null || !(drafts[q.id] || '').trim()}
                  className="min-h-[52px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                  {busy === 'send:' + q.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send answer
                </button>
              </div>
              <p className="text-[13px] text-white/35 mt-2">Posts on their project page{c?.email ? ' and emails ' + c.email : ' (no email on file — call them)'}.</p>
            </div>
          );
        })}

        {/* Answered, folded away */}
        {answered.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <button onClick={() => setShowAnswered((v) => !v)} className="w-full min-h-[44px] flex items-center justify-between text-left">
              <span className="text-[16px] font-bold text-white/80 flex items-center gap-2"><MessageCircle size={16} className="text-white/40" /> Answered recently ({answered.length})</span>
              {showAnswered ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
            </button>
            {showAnswered && (
              <div className="space-y-3 mt-3">
                {answered.map((q) => (
                  <div key={q.id} className="rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[14px] text-white/45">{q.estimate?.project_name || q.estimate?.estimate_number} · {who(q.estimate?.customer, q.author_name)} · {ago(q.created_at)}
                      {q.estimate?.share_token && <a href={'/estimate/' + q.estimate.share_token + '?from=admin#questions'} target="_blank" rel="noopener" className="ml-2 inline-flex items-center gap-1" style={{ color: '#D4B965' }}>page <ExternalLink size={12} /></a>}
                    </p>
                    <p className="text-[16px] text-white/85 mt-1">{q.body}</p>
                    {q.answer && <p className="text-[16px] mt-2 pl-3 border-l-2" style={{ borderColor: '#C9A84C', color: 'rgba(255,255,255,0.7)' }}>{q.answer.body}<span className="block text-[13px] text-white/35 mt-1">{q.answer.author_name || 'RO'} · {ago(q.answer.created_at)}</span></p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
