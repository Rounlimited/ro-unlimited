'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, KeyRound, LogOut, Search, ExternalLink, Inbox, MessageCircle, DoorOpen, Copy, Check, Sparkles, BookOpen, Plus, Trash2, Wrench, Star } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AppShell from '@/components/admin/AppShell';

/**
 * Customer Portal — JR's control panel for rounlimited.com/my.
 * Who can get in (needs an email), who has been in, what's waiting on them,
 * and the levers: send a sign-in link, set a temporary password to text them,
 * sign them out everywhere, fix an email. JR-sized: 17px+, 48px targets, words.
 */
type Project = { id: string; name: string; number: string; stage: string; share_href: string | null; requests: { open: number; submitted: number }; questions_waiting: number };
type Customer = { id: string; name: string; company: string | null; email: string | null; phone: string | null; access: 'no_email' | 'password' | 'link' | 'never'; locked: boolean; last_seen: string | null; first_seen: string | null; sessions: number; frequency: string; projects: Project[]; waiting: number; came_back: number; questions_waiting: number };
type Miss = { id: string; question: string; job: string | null; estimate_id: string; when: string; why: string };
type Faq = { id: string; term: string; answer: string; active: boolean; source: string | null };
type Service = { id: string; system_label: string; title: string; next_due: string; overdue: boolean; interval_months: number; estimate: { id: string; project_name: string | null; estimate_number: string } | null; customer: { id: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; phone: string | null } | null };
type Data = { stats: Record<string, number>; customers: Customer[]; misses: Miss[]; faq: Faq[]; service_due: Service[]; review_url: string | null };

const ago = (iso: string | null) => {
  if (!iso) return 'never';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'just now'; if (h < 24) return Math.round(h) + 'h ago';
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : d + ' days ago';
};
const ACCESS: Record<Customer['access'], { label: string; color: string }> = {
  password: { label: 'Has a password', color: '#35d07f' },
  link: { label: 'Signs in by email link', color: '#D4B965' },
  never: { label: 'Has not signed in yet', color: 'rgba(255,255,255,0.55)' },
  no_email: { label: 'No email — cannot sign in', color: '#f87171' },
};

export default function AdminPortalPage() {
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'waiting' | 'no_email' | 'active'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});
  const [tempPw, setTempPw] = useState<Record<string, string>>({});
  const [emailEdit, setEmailEdit] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  // FAQ from the misses
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqTerm, setFaqTerm] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqBusy, setFaqBusy] = useState(false);
  const [faqNote, setFaqNote] = useState('');
  const [showFaq, setShowFaq] = useState(false);
  const addFaq = async () => {
    if (!faqTerm.trim() || !faqAnswer.trim()) { setFaqNote('Need the question and the answer.'); return; }
    setFaqBusy(true); setFaqNote('');
    const d = await fetch('/api/admin/faq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ term: faqTerm.trim(), answer: faqAnswer.trim(), source: 'miss' }) }).then((r) => r.json()).catch(() => null);
    if (d?.ok) { setFaqNote('Added — the assistant uses it on every job from now on ✓'); setFaqTerm(''); setFaqAnswer(''); setFaqOpen(false); await load(); } else setFaqNote(d?.error || 'Could not add it.');
    setFaqBusy(false);
  };
  const [reviewUrl, setReviewUrl] = useState<string>('');
  const [reviewNote, setReviewNote] = useState('');
  const saveReviewUrl = async () => { const d = await fetch('/api/admin/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_review_url', url: reviewUrl }) }).then((r) => r.json()).catch(() => null); setReviewNote(d?.ok ? 'Saved ✓ — completed jobs now show the Google review button.' : d?.error || 'Could not save.'); };
  const serviceDone = async (id: string) => { await fetch('/api/admin/service', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, done: true }) }); await load(); };
  const serviceOff = async (id: string) => { await fetch('/api/admin/service', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: false }) }); await load(); };
  const toggleFaq = async (f: Faq) => { await fetch('/api/admin/faq', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id, active: !f.active }) }); await load(); };
  const deleteFaq = async (f: Faq) => { await fetch('/api/admin/faq?id=' + f.id, { method: 'DELETE' }); await load(); };

  const load = useCallback(async () => {
    try { const d = await (await fetch('/api/admin/portal', { cache: 'no-store' })).json(); setData(d); setReviewUrl(d.review_url || ''); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (c: Customer, action: string, extra: any = {}) => {
    setBusy(c.id + action); setNotice((n) => ({ ...n, [c.id]: '' }));
    try {
      const d = await fetch('/api/admin/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, customer_id: c.id, ...extra }) }).then((r) => r.json());
      if (d.error) setNotice((n) => ({ ...n, [c.id]: d.error }));
      else if (action === 'send_link') setNotice((n) => ({ ...n, [c.id]: 'Sign-in link emailed to ' + d.sent_to + ' ✓' }));
      else if (action === 'set_password') { setTempPw((t) => ({ ...t, [c.id]: d.password })); setNotice((n) => ({ ...n, [c.id]: 'Temporary password set ✓ — text it to them, they can change it under Account.' })); }
      else if (action === 'sign_out') setNotice((n) => ({ ...n, [c.id]: 'Signed out on every device ✓' }));
      else if (action === 'set_email') { setNotice((n) => ({ ...n, [c.id]: 'Email saved ✓' })); setEmailEdit((e) => { const x = { ...e }; delete x[c.id]; return x; }); }
      await load();
    } catch { setNotice((n) => ({ ...n, [c.id]: 'Could not do that — try again.' })); }
    setBusy(null);
  };
  const copy = async (id: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch {} };

  if (!data) return <AppShell><AdminHeader title="Customer Portal" backHref="/admin" /><div className="py-24 flex justify-center"><Loader2 className="animate-spin text-white/40" size={28} /></div></AppShell>;
  const s = data.stats;
  const list = data.customers.filter((c) => {
    if (filter === 'waiting' && !(c.waiting || c.came_back || c.questions_waiting)) return false;
    if (filter === 'no_email' && c.access !== 'no_email') return false;
    if (filter === 'active' && !c.last_seen) return false;
    if (q.trim()) { const t = q.toLowerCase(); return [c.name, c.company, c.email, c.phone, ...c.projects.map((p) => p.name + ' ' + p.number)].join(' ').toLowerCase().includes(t); }
    return true;
  });

  return (
    <AppShell>
      <AdminHeader title="Customer Portal" subtitle="rounlimited.com/my — who's in, what's waiting" backHref="/admin" />
      <div className="px-4 pb-28 max-w-3xl mx-auto w-full min-w-0 overflow-x-hidden space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {[['Signed in this week', s.signed_in_week, '#35d07f'], ['Waiting on customers', s.requests_waiting, '#D4B965'], ['Came back to review', s.came_back, '#6db3f2'], ['Questions waiting', s.questions_waiting, '#D4B965']].map(([l, v, c]) => (
            <div key={String(l)} className="rounded-2xl border border-white/8 bg-[#111] p-4">
              <p className="text-[30px] font-bold leading-none" style={{ color: String(c) }}>{v as number}</p>
              <p className="text-[14px] text-white/50 mt-1">{l}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
          <p className="text-[16px] text-white/70"><strong className="text-white">{s.can_sign_in}</strong> of {s.customers} customers can sign in. <strong className="text-white">{s.have_password}</strong> set a password. <strong style={{ color: s.no_email ? '#f87171' : '#fff' }}>{s.no_email}</strong> have no email on file yet — add one below and send them a link.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href="/my" target="_blank" rel="noreferrer" className="min-h-[44px] px-4 rounded-xl text-[15px] font-bold inline-flex items-center gap-2" style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}><DoorOpen size={16} /> Open the portal sign-in page</a>
            <Link href="/admin/questions" className="min-h-[44px] px-4 rounded-xl text-[15px] font-bold inline-flex items-center gap-2 text-white/75" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}><MessageCircle size={16} /> Questions inbox</Link>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 min-h-[50px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={18} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a customer or job" className="flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/30" />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([['all', 'Everyone'], ['waiting', 'Something waiting'], ['active', 'Has signed in'], ['no_email', 'No email']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className="min-h-[44px] px-4 rounded-full text-[15px] font-bold whitespace-nowrap" style={{ background: filter === k ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.05)', color: filter === k ? '#D4B965' : 'rgba(255,255,255,0.7)', border: '1px solid ' + (filter === k ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.12)') }}>{l}</button>
          ))}
        </div>

        {list.length === 0 && <p className="text-[16px] text-white/50 text-center py-10">Nobody matches that.</p>}
        {list.map((c) => {
          const a = ACCESS[c.access];
          return (
            <div key={c.id} className="rounded-2xl border p-5" style={{ background: '#111', borderColor: c.came_back ? 'rgba(53,208,127,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[19px] font-bold text-white leading-tight">{c.name}{c.company && c.company !== c.name ? <span className="text-white/50 font-semibold"> · {c.company}</span> : null}</p>
                  <p className="text-[15px] mt-1 font-semibold" style={{ color: a.color }}>{a.label}{c.locked ? ' · locked 15 min (too many tries)' : ''}</p>
                  <p className="text-[15px] text-white/50">{c.email || 'no email'}{c.phone ? ' · ' + c.phone : ''}</p>
                  <p className="text-[15px] text-white/50">Last in the portal: <span className="text-white/80">{ago(c.last_seen)}</span>{c.sessions ? ` · ${c.sessions} device${c.sessions === 1 ? '' : 's'}` : ''} · Emails: {c.frequency === 'every' ? 'every update' : c.frequency === 'weekly' ? 'weekly report only' : 'only when needed'}</p>
                </div>
                {(c.waiting || c.came_back || c.questions_waiting) ? (
                  <div className="shrink-0 text-right space-y-1">
                    {c.came_back > 0 && <span className="block px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(53,208,127,0.15)', color: '#35d07f' }}>{c.came_back} came back</span>}
                    {c.waiting > 0 && <span className="block px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(201,168,76,0.18)', color: '#D4B965' }}>{c.waiting} waiting on them</span>}
                    {c.questions_waiting > 0 && <span className="block px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: 'rgba(201,168,76,0.18)', color: '#D4B965' }}>{c.questions_waiting} question{c.questions_waiting === 1 ? '' : 's'}</span>}
                  </div>
                ) : null}
              </div>

              {c.projects.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {c.projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <Link href={'/admin/jobs/' + p.id} className="min-w-0 text-[16px] font-semibold text-white/85 truncate">{p.name} <span className="text-white/40 font-normal">· {p.stage}</span></Link>
                      {p.share_href && <a href={p.share_href + '?from=admin'} target="_blank" rel="noreferrer" className="shrink-0 min-h-[40px] px-3 rounded-lg text-[14px] font-bold inline-flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}><ExternalLink size={14} /> See what they see</a>}
                    </div>
                  ))}
                </div>
              )}

              {c.access === 'no_email' || emailEdit[c.id] !== undefined ? (
                <div className="mt-3 flex gap-2">
                  <input value={emailEdit[c.id] ?? ''} onChange={(e) => setEmailEdit((x) => ({ ...x, [c.id]: e.target.value }))} placeholder="their email address" type="email"
                    className="flex-1 min-h-[48px] rounded-xl px-4 text-[16px] text-white bg-white/5 border border-white/10 outline-none focus:border-[#D4B965]/60" />
                  <button onClick={() => act(c, 'set_email', { email: emailEdit[c.id] })} disabled={busy !== null || !(emailEdit[c.id] || '').includes('@')} className="min-h-[48px] px-4 rounded-xl text-[15px] font-bold text-black disabled:opacity-40" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>Save email</button>
                </div>
              ) : null}

              {c.access !== 'no_email' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  <button onClick={() => act(c, 'send_link')} disabled={busy !== null} className="min-h-[48px] rounded-xl text-[15px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
                    {busy === c.id + 'send_link' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email sign-in link
                  </button>
                  <button onClick={() => act(c, 'set_password')} disabled={busy !== null} className="min-h-[48px] rounded-xl text-[15px] font-bold inline-flex items-center justify-center gap-2 text-white/80 disabled:opacity-50" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {busy === c.id + 'set_password' ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Set temp password
                  </button>
                  <button onClick={() => act(c, 'sign_out')} disabled={busy !== null || !c.sessions} className="min-h-[48px] rounded-xl text-[15px] font-bold inline-flex items-center justify-center gap-2 text-white/60 disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <LogOut size={16} /> Sign out everywhere
                  </button>
                </div>
              )}
              {c.access !== 'no_email' && emailEdit[c.id] === undefined && (
                <button onClick={() => setEmailEdit((x) => ({ ...x, [c.id]: c.email || '' }))} className="mt-2 min-h-[40px] text-[14px] font-semibold text-white/45 underline">Change their email</button>
              )}
              {tempPw[c.id] && (
                <div className="mt-3 rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: 'rgba(53,208,127,0.08)', border: '1px solid rgba(53,208,127,0.3)' }}>
                  <div><p className="text-[13px] text-white/50">Temporary password — text it to them</p><p className="text-[22px] font-bold text-white font-mono tracking-wide">{tempPw[c.id]}</p></div>
                  <button onClick={() => copy(c.id, `Sign in at rounlimited.com/my with ${c.email} and password ${tempPw[c.id]}`)} className="min-h-[44px] px-3 rounded-lg text-[14px] font-bold inline-flex items-center gap-1.5 text-white/85" style={{ background: 'rgba(255,255,255,0.08)' }}>{copied === c.id ? <Check size={16} /> : <Copy size={16} />} {copied === c.id ? 'Copied' : 'Copy text'}</button>
                </div>
              )}
              {notice[c.id] && <p className="text-[15px] mt-2" style={{ color: notice[c.id].includes('✓') ? '#35d07f' : '#f87171' }}>{notice[c.id]}</p>}
            </div>
          );
        })}
        {/* ── After the job: service due across customers, and the review link ── */}
        <div className="rounded-2xl border p-5 mt-6" style={{ background: '#111', borderColor: (data.service_due || []).some((s) => s.overdue) ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.08)' }}>
          <p className="text-[17px] font-bold flex items-center gap-2"><Wrench size={18} style={{ color: '#D4B965' }} /> Service due — next 60 days</p>
          <p className="text-[15px] text-white/50 mt-1 mb-3">Maintenance schedules from finished jobs&rsquo; binders. Customers get an email 30 days out; this is your list to quote.</p>
          {(data.service_due || []).length === 0 ? <p className="text-[15px] text-white/35">Nothing due. Add maintenance reminders from a job&rsquo;s Handover panel.</p> : (
            <div className="space-y-2">
              {data.service_due.map((s) => {
                const name = s.customer ? ([s.customer.first_name, s.customer.last_name].filter(Boolean).join(' ') || s.customer.company_name || 'Customer') : 'Customer';
                return (
                  <div key={s.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (s.overdue ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)') }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold text-white/90">{s.title} <span className="text-white/40 font-normal">· {name}</span></p>
                        <p className="text-[14px]" style={{ color: s.overdue ? '#D4B965' : 'rgba(255,255,255,0.5)' }}>{s.overdue ? 'Overdue — was due ' : 'Due '}{new Date(s.next_due + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}{s.estimate ? ' · ' + (s.estimate.project_name || s.estimate.estimate_number) : ''}{s.customer?.phone ? ' · ' + s.customer.phone : ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.customer && <Link href={'/admin/estimates/new?customer=' + s.customer.id} className="min-h-[40px] px-3 rounded-lg text-[14px] font-bold inline-flex items-center text-black" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>Quote it</Link>}
                      <button onClick={() => serviceDone(s.id)} className="min-h-[40px] px-3 rounded-lg text-[14px] font-bold text-white/80" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>Done — next in {s.interval_months} mo</button>
                      <button onClick={() => serviceOff(s.id)} className="min-h-[40px] px-3 rounded-lg text-[14px] font-bold text-white/50" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Stop reminding</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[15px] font-bold text-white/85 inline-flex items-center gap-2"><Star size={16} style={{ color: '#D4B965' }} /> Google review link</p>
            <p className="text-[14px] text-white/45 mb-2">Paste your Google &ldquo;write a review&rdquo; link once. Every completed job&rsquo;s page and handover email then asks for the review with a button.</p>
            <div className="flex gap-2">
              <input value={reviewUrl} onChange={(e) => setReviewUrl(e.target.value)} placeholder="https://g.page/r/…/review" className="flex-1 min-w-0 min-h-[48px] rounded-xl px-3 text-[15px] text-white bg-white/5 border border-white/10 outline-none" />
              <button onClick={saveReviewUrl} className="min-h-[48px] px-4 rounded-xl text-[15px] font-bold text-black" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>Save</button>
            </div>
            {reviewNote && <p className="text-[14px] mt-2" style={{ color: reviewNote.includes('✓') ? '#35d07f' : '#f87171' }}>{reviewNote}</p>}
          </div>
        </div>

        {/* ── Intelligence: the assistant's record and the FAQ it learns from ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 mt-6">
          <p className="text-[17px] font-bold flex items-center gap-2"><Sparkles size={18} style={{ color: '#D4B965' }} /> Project Assistant — last 30 days</p>
          <p className="text-[15px] text-white/50 mt-1 mb-3">Customers asked <strong className="text-white/85">{s.assistant_asks_30d}</strong> questions. It answered <strong className="text-white/85">{s.assistant_answered_30d}</strong> from the job records and handed <strong className="text-white/85">{s.assistant_handoffs_30d}</strong> to you. Rated helpful {s.assistant_helpful_yes}, not helpful {s.assistant_helpful_no}. Every miss lands in the Questions inbox.</p>
          {(data.misses || []).length === 0 ? <p className="text-[15px] text-white/35">No misses yet.</p> : (
            <div className="space-y-2">
              <p className="text-[13px] font-bold uppercase tracking-wide text-white/40">It couldn&rsquo;t answer these — add the answer once and it never misses again</p>
              {data.misses.slice(0, 12).map((m) => (
                <div key={m.id} className="rounded-xl px-3 py-2.5 flex items-start justify-between gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0"><p className="text-[16px] text-white/85">&ldquo;{m.question}&rdquo;</p><p className="text-[13px] text-white/40">{m.job || 'job'} · {m.why} · {ago(m.when)}</p></div>
                  <button onClick={() => { setFaqOpen(true); setFaqTerm(m.question); setFaqAnswer(''); setFaqNote(''); }} className="shrink-0 min-h-[40px] px-3 rounded-lg text-[14px] font-bold" style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>Add to FAQ</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => { setFaqOpen((v) => !v); setFaqNote(''); }} className="min-h-[44px] px-4 rounded-xl text-[15px] font-bold inline-flex items-center gap-2" style={{ background: 'rgba(201,168,76,0.14)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}><Plus size={16} /> New FAQ entry</button>
            <button onClick={() => setShowFaq((v) => !v)} className="min-h-[44px] px-4 rounded-xl text-[15px] font-bold inline-flex items-center gap-2 text-white/75" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}><BookOpen size={16} /> {showFaq ? 'Hide' : 'Show'} the glossary ({(data.faq || []).length})</button>
          </div>
          {faqOpen && (
            <div className="mt-3 space-y-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input value={faqTerm} onChange={(e) => setFaqTerm(e.target.value)} placeholder="The term or question, as a customer would say it" className="w-full min-h-[48px] rounded-xl px-3 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
              <textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows={3} placeholder="The plain-language answer (no promises, no crew talk, dates are estimates)" className="w-full rounded-xl px-3 py-2 text-[16px] text-white bg-white/5 border border-white/10 outline-none" />
              <button onClick={addFaq} disabled={faqBusy} className="w-full min-h-[48px] rounded-xl text-[15px] font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>{faqBusy ? 'Saving…' : 'Save — the assistant learns it now'}</button>
            </div>
          )}
          {faqNote && <p className="text-[15px] mt-2" style={{ color: faqNote.includes('✓') ? '#35d07f' : '#f87171' }}>{faqNote}</p>}
          {showFaq && (
            <div className="mt-3 space-y-2">
              {(data.faq || []).map((f) => (
                <div key={f.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', opacity: f.active ? 1 : 0.5 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-[16px] font-semibold text-white/90">{f.term}</p><p className="text-[15px] text-white/60 mt-0.5">{f.answer}</p></div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleFaq(f)} className="min-h-[40px] px-3 rounded-lg text-[13px] font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}>{f.active ? 'ON' : 'OFF'}</button>
                      <button onClick={() => deleteFaq(f)} aria-label="Delete" className="min-h-[40px] px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-[14px] text-white/35 inline-flex items-center gap-2 pt-2"><Inbox size={14} /> Requests and updates for a job live in its Job Room.</p>
      </div>
    </AppShell>
  );
}
