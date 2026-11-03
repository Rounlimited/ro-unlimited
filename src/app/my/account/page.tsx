'use client';

import { useEffect, useState } from 'react';
import { Loader2, KeyRound, Check } from 'lucide-react';

type Prefs = { channel: string; frequency: 'every' | 'weekly' | 'needed' };

/** Account: password, how often we email, who you are. */
export default function PortalAccount() {
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false); const [pwNote, setPwNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  useEffect(() => {
    fetch('/api/my/projects', { cache: 'no-store' }).then((r) => r.json()).then((d) => { setEmail(d.email || ''); setPrefs(d.prefs || { channel: 'email', frequency: 'every' }); setHasPassword(!!d.has_password); }).catch(() => {});
  }, []);
  const savePrefs = async (frequency: Prefs['frequency']) => {
    setPrefs((p) => ({ ...(p || { channel: 'email', frequency }), frequency })); setSavedNote('');
    const d = await fetch('/api/my/prefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frequency }) }).then((r) => r.json()).catch(() => null);
    setSavedNote(d?.ok ? 'Saved.' : 'Could not save — try again.');
  };
  const savePassword = async () => {
    if (pw.length < 8) { setPwNote('Use at least 8 characters.'); return; }
    if (pw !== pw2) { setPwNote('Those two don’t match.'); return; }
    setPwBusy(true); setPwNote('');
    const d = await fetch('/api/my/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }).then((r) => r.json()).catch(() => null);
    if (d?.ok) { setPwNote('Password saved. Next time, sign in with your email and this password.'); setHasPassword(true); setPw(''); setPw2(''); }
    else setPwNote(d?.error || 'Could not save — try again.');
    setPwBusy(false);
  };
  if (!prefs) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-4">
      <h1 className="text-[26px] font-bold text-[#1a1a1a] leading-tight">Your account</h1>
      <p className="text-[16px] text-gray-500">Signed in as <strong className="text-[#2a2a2a]">{email}</strong>. Need the email changed? Call (864) 304-0139 and we&rsquo;ll update it.</p>

      <section id="password" className="rounded-2xl border bg-white p-5 sm:p-6 scroll-mt-20" style={{ borderColor: hasPassword ? '#f0ece2' : '#ead9ac' }}>
        <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>{hasPassword ? 'Change your password' : 'Set a password'}</p>
        <p className="text-[16px] text-[#4b5563] mb-3">{hasPassword ? 'You sign in with your email and password. Forget it? The sign-in page can email you a link.' : 'With a password you can sign in here any time without waiting on an email link.'}</p>
        <div className="space-y-3">
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (8+ characters)" className="w-full min-h-[52px] rounded-xl border px-4 text-[18px] text-[#1a1a1a] bg-white outline-none focus:border-[#C9A84C]" style={{ borderColor: '#e5e0d2' }} />
          <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Type it again" className="w-full min-h-[52px] rounded-xl border px-4 text-[18px] text-[#1a1a1a] bg-white outline-none focus:border-[#C9A84C]" style={{ borderColor: '#e5e0d2' }} />
          <button onClick={savePassword} disabled={pwBusy} className="w-full min-h-[52px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
            {pwBusy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />} Save password
          </button>
          {pwNote && <p className="text-[16px] font-semibold inline-flex items-center gap-2" style={{ color: /saved/i.test(pwNote) ? '#187a4b' : '#b45309' }}>{/saved/i.test(pwNote) && <Check size={18} />}{pwNote}</p>}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
        <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>How often we email you</p>
        <p className="text-[16px] text-[#4b5563] mb-3">Everything always shows here in the portal. Answers to your questions and anything we need from you always come through by email too. This is just the progress news.</p>
        <div className="space-y-2">
          {([['every', 'Every update', 'Each time RO posts progress or photos.'], ['weekly', 'Weekly report only', 'One summary a week, nothing in between.'], ['needed', 'Only when you need me', 'Just questions, approvals and requests. I’ll check the portal myself.']] as const).map(([v, l, d]) => (
            <button key={v} onClick={() => savePrefs(v)} className="w-full text-left rounded-xl px-4 py-3 min-h-[56px] flex items-center gap-3 active:scale-[0.99]" style={{ background: prefs.frequency === v ? '#fdf6e7' : '#fff', border: '1px solid ' + (prefs.frequency === v ? '#C9A84C' : '#e5e0d2') }}>
              <span className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center" style={{ borderColor: prefs.frequency === v ? '#a8893d' : '#cbd5e1' }}>{prefs.frequency === v && <span className="w-3 h-3 rounded-full" style={{ background: '#a8893d' }} />}</span>
              <span><span className="block text-[17px] font-semibold text-[#1a1a1a]">{l}</span><span className="block text-[15px] text-gray-500">{d}</span></span>
            </button>
          ))}
        </div>
        {savedNote && <p className="text-[15px] font-semibold mt-2" style={{ color: savedNote === 'Saved.' ? '#187a4b' : '#b45309' }}>{savedNote}</p>}
      </section>
    </main>
  );
}
