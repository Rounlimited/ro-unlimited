'use client';

import { useEffect, useState } from 'react';
import { Loader2, ChevronRight, Mail, CalendarDays, Camera, LogOut } from 'lucide-react';

/**
 * rounlimited.com/my — the customer's front door. One email, one link, every
 * project they have with RO: where it stands, the last thing we posted, what
 * we're waiting on them for, what's next. Same type sizes as the project page:
 * 17px+ body, 48px targets, words not colors.
 */
type Project = {
  id: string; number: string; name: string; address: string | null;
  stage: 'proposal' | 'signed' | 'in_progress' | 'complete' | 'closed'; percent: number; total: number;
  href: string | null;
  latest: { date: string; text: string; photos: number } | null;
  needs: string[]; next: { date: string; title: string } | null; questions_waiting: number;
};
type Prefs = { channel: string; frequency: 'every' | 'weekly' | 'needed' };

const STAGE: Record<Project['stage'], { label: string; color: string; bg: string }> = {
  in_progress: { label: 'In progress', color: '#8a6d20', bg: '#fdf6e7' },
  signed: { label: 'Signed — starting soon', color: '#187a4b', bg: '#e9f7ef' },
  proposal: { label: 'Estimate to review', color: '#8a6d20', bg: '#fdf6e7' },
  complete: { label: 'Complete', color: '#187a4b', bg: '#e9f7ef' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6' },
};
const day = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function MyProjectsPage() {
  const [state, setState] = useState<'loading' | 'signed-out' | 'in'>('loading');
  const [email, setEmail] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({ channel: 'email', frequency: 'every' });
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState('');

  const load = async () => {
    try {
      const r = await fetch('/api/my/projects', { cache: 'no-store' });
      if (r.status === 401) { setState('signed-out'); return; }
      const d = await r.json();
      setEmail(d.email); setName(d.name); setProjects(d.projects || []); setPrefs(d.prefs || prefs); setState('in');
    } catch { setState('signed-out'); }
  };
  useEffect(() => {
    try { if (new URLSearchParams(window.location.search).get('expired')) setNotice('That sign-in link has expired or was already used. Enter your email for a fresh one.'); } catch {}
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLink = async () => {
    if (!email.trim()) { setNotice('Enter the email address we have for you.'); return; }
    setBusy(true); setNotice(null);
    try { await fetch('/api/my/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) }); setLinkSent(true); }
    catch { setNotice('Could not send the link — please call (864) 304-0139.'); }
    setBusy(false);
  };
  const savePrefs = async (frequency: Prefs['frequency']) => {
    setPrefs((p) => ({ ...p, frequency })); setSavedNote('');
    const d = await fetch('/api/my/prefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frequency }) }).then((r) => r.json()).catch(() => null);
    setSavedNote(d?.ok ? 'Saved.' : 'Could not save — try again.');
  };
  const signOut = async () => { await fetch('/api/my/logout', { method: 'POST' }); setProjects([]); setLinkSent(false); setState('signed-out'); };

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="inline-flex items-center rounded-xl px-3 py-2" style={{ background: '#0c0c0c' }}>
            <img src="/ro-co-logo-v2.png" alt="RO Unlimited Co." className="h-8 w-auto" />
          </span>
          {state === 'in' && (
            <button onClick={signOut} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-gray-600"><LogOut size={16} /> Sign out</button>
          )}
        </div>

        {state === 'loading' && <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>}

        {state === 'signed-out' && (
          <section className="rounded-2xl border bg-white p-5 sm:p-7" style={{ borderColor: '#f0ece2' }}>
            <h1 className="text-[26px] font-bold text-[#1a1a1a] leading-tight" style={{ textWrap: 'balance' } as any}>Your projects with RO</h1>
            <p className="text-[17px] text-[#4b5563] mt-2">Enter the email address we have for you. We&rsquo;ll send a sign-in link &mdash; no password to remember.</p>
            {linkSent ? (
              <div className="mt-5 rounded-xl p-4" style={{ background: '#e9f7ef', border: '1px solid #bfe6cf' }}>
                <p className="text-[17px] font-semibold" style={{ color: '#187a4b' }}>Check your email.</p>
                <p className="text-[16px] text-[#2a2a2a] mt-1">If <strong>{email.trim()}</strong> is on file with us, a sign-in link is on its way. It works for 30 minutes. Don&rsquo;t see it? Check spam, or call (864) 304-0139.</p>
                <button onClick={() => setLinkSent(false)} className="mt-3 min-h-[44px] text-[15px] font-semibold underline" style={{ color: '#187a4b' }}>Use a different email</button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && requestLink()}
                  placeholder="you@example.com" className="w-full min-h-[52px] rounded-xl border px-4 text-[18px] text-[#1a1a1a] bg-white outline-none focus:border-[#C9A84C]" style={{ borderColor: '#e5e0d2' }} />
                <button onClick={requestLink} disabled={busy} className="w-full min-h-[52px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Email me a sign-in link
                </button>
                {notice && <p className="text-[16px] font-semibold" style={{ color: '#b45309' }}>{notice}</p>}
              </div>
            )}
            <p className="text-[15px] text-gray-500 mt-5">Have a project link from us already? That still works on its own &mdash; this page just puts all of them in one place.</p>
          </section>
        )}

        {state === 'in' && (
          <>
            <h1 className="text-[26px] font-bold text-[#1a1a1a] leading-tight pt-2">{name ? `${name}, here's where things stand.` : 'Here’s where things stand.'}</h1>
            {projects.length === 0 && (
              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: '#f0ece2' }}>
                <p className="text-[17px] text-[#2a2a2a]">We don&rsquo;t have any projects on file under <strong>{email}</strong> yet. If that doesn&rsquo;t sound right, call (864) 304-0139 and we&rsquo;ll fix it.</p>
              </section>
            )}
            {projects.map((p) => {
              const st = STAGE[p.stage];
              const Card: any = p.href ? 'a' : 'div';
              return (
                <Card key={p.id} href={p.href || undefined} className="block rounded-2xl border bg-white p-5 sm:p-6 active:scale-[0.995]" style={{ borderColor: p.needs.length ? '#ead9ac' : '#f0ece2' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[21px] font-bold text-[#1a1a1a] leading-tight">{p.name}</p>
                      {p.address && <p className="text-[15px] text-gray-500 mt-0.5">{p.address}</p>}
                    </div>
                    {p.href && <ChevronRight size={22} className="text-gray-400 shrink-0 mt-1" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full text-[14px] font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {p.stage === 'in_progress' && <span className="text-[15px] font-semibold text-[#2a2a2a]">{p.percent}% complete</span>}
                  </div>
                  {p.stage === 'in_progress' && (
                    <div className="h-2.5 rounded-full mt-2 overflow-hidden" style={{ background: '#f0ece2' }}><div className="h-full rounded-full" style={{ width: p.percent + '%', background: 'linear-gradient(90deg, #D4B965, #a8893d)' }} /></div>
                  )}
                  {p.needs.length > 0 && (
                    <div className="mt-4 rounded-xl p-3" style={{ background: '#fdf6e7', border: '1px solid #ead9ac' }}>
                      <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>Needs you</p>
                      <ul className="mt-1 space-y-1">{p.needs.map((n, i) => <li key={i} className="text-[17px] font-semibold text-[#2a2a2a]">{n}</li>)}</ul>
                    </div>
                  )}
                  {p.latest && (
                    <div className="mt-4">
                      <p className="text-[13px] font-bold uppercase tracking-wide text-gray-400">Latest from RO · {day(p.latest.date)}</p>
                      <p className="text-[17px] text-[#2a2a2a] mt-1 leading-snug">{p.latest.text}{p.latest.photos > 0 && <span className="inline-flex items-center gap-1 ml-2 text-[14px] font-semibold text-gray-500"><Camera size={14} /> {p.latest.photos} photo{p.latest.photos === 1 ? '' : 's'}</span>}</p>
                    </div>
                  )}
                  {p.next && (
                    <p className="mt-3 text-[16px] text-[#4b5563] inline-flex items-center gap-2"><CalendarDays size={16} className="text-gray-400" /> Next up: {p.next.title} &mdash; {day(p.next.date)} (estimated)</p>
                  )}
                  {p.questions_waiting > 0 && <p className="mt-2 text-[15px] font-semibold" style={{ color: '#8a6d20' }}>Your question is with RO &mdash; the answer will post on your project page.</p>}
                </Card>
              );
            })}

            <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
              <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>How often we email you</p>
              <p className="text-[16px] text-[#4b5563] mb-3">Answers to your questions and anything we need from you always come through. This is just the progress news.</p>
              <div className="space-y-2">
                {([['every', 'Every update', 'Each time RO posts progress or photos.'], ['weekly', 'Weekly report only', 'One summary a week, nothing in between.'], ['needed', 'Only when you need me', 'Just questions, approvals and requests. I’ll check the page myself.']] as const).map(([v, l, d]) => (
                  <button key={v} onClick={() => savePrefs(v)} className="w-full text-left rounded-xl px-4 py-3 min-h-[56px] flex items-center gap-3 active:scale-[0.99]" style={{ background: prefs.frequency === v ? '#fdf6e7' : '#fff', border: '1px solid ' + (prefs.frequency === v ? '#C9A84C' : '#e5e0d2') }}>
                    <span className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center" style={{ borderColor: prefs.frequency === v ? '#a8893d' : '#cbd5e1' }}>{prefs.frequency === v && <span className="w-3 h-3 rounded-full" style={{ background: '#a8893d' }} />}</span>
                    <span><span className="block text-[17px] font-semibold text-[#1a1a1a]">{l}</span><span className="block text-[15px] text-gray-500">{d}</span></span>
                  </button>
                ))}
              </div>
              {savedNote && <p className="text-[15px] font-semibold mt-2" style={{ color: savedNote === 'Saved.' ? '#187a4b' : '#b45309' }}>{savedNote}</p>}
              <p className="text-[14px] text-gray-400 mt-3">Signed in as {email}.</p>
            </section>
          </>
        )}
      </main>
      <footer className="border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-[14px] font-semibold text-gray-700">RO Unlimited Construction & Development</p>
          <p className="text-[14px] text-gray-400 mt-1">(864) 304-0139 · rounlimited.com</p>
        </div>
      </footer>
    </div>
  );
}
