'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Mail, LogOut, FolderKanban, UserRound, KeyRound, ChevronLeft } from 'lucide-react';

/**
 * The customer portal shell — rounlimited.com/my.
 * Signed out: the sign-in screen (password, or an emailed link) no matter
 * which /my page they landed on. Signed in: RO header, portal nav, the page.
 * Same sizes as the project page: 17px+ body, 48px targets, words not colors.
 */
type Session = { signed_in: boolean; email?: string };
const Ctx = createContext<{ session: Session; refresh: () => Promise<void> }>({ session: { signed_in: false }, refresh: async () => {} });
export const usePortalSession = () => useContext(Ctx);

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const pathname = usePathname();
  const refresh = useCallback(async () => {
    try { setSession(await (await fetch('/api/my/session', { cache: 'no-store' })).json()); } catch { setSession({ signed_in: false }); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  if (session === null) return <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={30} /></div>;
  if (!session.signed_in) return <SignIn onSignedIn={refresh} />;

  const tabs = [
    { href: '/my', label: 'My Projects', icon: FolderKanban, on: pathname === '/my' || pathname.startsWith('/my/project') },
    { href: '/my/account', label: 'Account', icon: UserRound, on: pathname.startsWith('/my/account') },
  ];
  const signOut = async () => { await fetch('/api/my/logout', { method: 'POST' }); setSession({ signed_in: false }); };
  return (
    <Ctx.Provider value={{ session, refresh }}>
      <div className="min-h-screen bg-[#f8f8f6]">
        <header className="sticky top-0 z-40" style={{ background: '#0c0c0c', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            {pathname.startsWith('/my/project') ? (
              <a href="/my" className="flex items-center gap-1 min-h-[48px] -ml-2 pr-2 text-[17px] font-bold" style={{ color: '#D4B965' }}><ChevronLeft size={24} /> My Projects</a>
            ) : (
              <a href="/my" className="flex items-center gap-3 min-h-[48px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ro-co-logo-v2.png" alt="RO Unlimited Co." className="h-7 w-auto" />
                <span className="text-[13px] font-bold uppercase tracking-wider hidden sm:inline" style={{ color: '#D4B965' }}>Customer Portal</span>
              </a>
            )}
            <nav className="hidden sm:flex items-center gap-1">
              {tabs.map((t) => (
                <a key={t.href} href={t.href} className="min-h-[44px] px-4 rounded-lg inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: t.on ? '#D4B965' : 'rgba(255,255,255,0.7)', background: t.on ? 'rgba(201,168,76,0.14)' : 'transparent' }}><t.icon size={17} /> {t.label}</a>
              ))}
              <button onClick={signOut} className="min-h-[44px] px-4 rounded-lg inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}><LogOut size={17} /> Sign out</button>
            </nav>
            <button onClick={signOut} className="sm:hidden min-h-[44px] px-3 rounded-lg inline-flex items-center gap-1.5 text-[14px] font-bold" style={{ color: 'rgba(255,255,255,0.65)' }}><LogOut size={16} /> Sign out</button>
          </div>
        </header>
        <div className="pb-24 sm:pb-8">{children}</div>
        {/* Mobile tab bar */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t" style={{ background: '#fff', borderColor: '#e8e4da', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="grid grid-cols-2">
            {tabs.map((t) => (
              <a key={t.href} href={t.href} className="min-h-[60px] flex flex-col items-center justify-center gap-0.5 text-[13px] font-bold" style={{ color: t.on ? '#8a6d20' : '#6b7280' }}><t.icon size={22} /> {t.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </Ctx.Provider>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('expired')) setNotice('That sign-in link has expired or was already used. Sign in with your password, or request a fresh link.');
      const saved = localStorage.getItem('ro-portal-email'); if (saved) setEmail(saved);
    } catch {}
  }, []);
  const next = pathname && pathname !== '/my' ? pathname : '/my';

  const submit = async () => {
    if (!email.trim()) { setNotice('Enter the email address we have for you.'); return; }
    if (mode === 'password' && !password) { setNotice('Enter your password, or choose "Email me a sign-in link".'); return; }
    setBusy(true); setNotice(null);
    try {
      const r = await fetch('/api/my/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'password' ? { email: email.trim(), password, next } : { email: email.trim(), next }) });
      const d = await r.json();
      try { localStorage.setItem('ro-portal-email', email.trim()); } catch {}
      if (mode === 'password') {
        if (d.signed_in) { await onSignedIn(); if (next !== pathname) router.push(next); }
        else setNotice(d.error || 'Could not sign in.');
      } else setLinkSent(true);
    } catch { setNotice('Connection problem — try again, or call (864) 304-0139.'); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <main className="max-w-md mx-auto px-4 py-8 sm:py-14">
        <span className="inline-flex items-center rounded-xl px-3 py-2 mb-6" style={{ background: '#0c0c0c' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ro-co-logo-v2.png" alt="RO Unlimited Co." className="h-8 w-auto" />
        </span>
        <section className="rounded-2xl border bg-white p-5 sm:p-7" style={{ borderColor: '#f0ece2' }}>
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>Customer Portal</p>
          <h1 className="text-[26px] font-bold text-[#1a1a1a] leading-tight mt-1">Sign in to your projects</h1>
          {linkSent ? (
            <div className="mt-5 rounded-xl p-4" style={{ background: '#e9f7ef', border: '1px solid #bfe6cf' }}>
              <p className="text-[17px] font-semibold" style={{ color: '#187a4b' }}>Check your email.</p>
              <p className="text-[16px] text-[#2a2a2a] mt-1">If <strong>{email.trim()}</strong> is on file with us, a sign-in link is on its way. It works for 30 minutes. Once you&rsquo;re in, set a password under Account so you never need the email again.</p>
              <button onClick={() => { setLinkSent(false); setMode('password'); }} className="mt-3 min-h-[44px] text-[15px] font-semibold underline" style={{ color: '#187a4b' }}>Back to sign in</button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-[15px] font-semibold text-[#4b5563]">Email</span>
                <input type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="mt-1 w-full min-h-[52px] rounded-xl border px-4 text-[18px] text-[#1a1a1a] bg-white outline-none focus:border-[#C9A84C]" style={{ borderColor: '#e5e0d2' }} />
              </label>
              {mode === 'password' && (
                <label className="block">
                  <span className="text-[15px] font-semibold text-[#4b5563]">Password</span>
                  <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
                    className="mt-1 w-full min-h-[52px] rounded-xl border px-4 text-[18px] text-[#1a1a1a] bg-white outline-none focus:border-[#C9A84C]" style={{ borderColor: '#e5e0d2' }} />
                </label>
              )}
              <button onClick={submit} disabled={busy} className="w-full min-h-[54px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'password' ? <KeyRound size={18} /> : <Mail size={18} />} {mode === 'password' ? 'Sign in' : 'Email me a sign-in link'}
              </button>
              {notice && <p className="text-[16px] font-semibold" style={{ color: '#b45309' }}>{notice}</p>}
              <button onClick={() => { setMode(mode === 'password' ? 'link' : 'password'); setNotice(null); }} className="w-full min-h-[48px] rounded-xl text-[16px] font-bold" style={{ background: '#fdf6e7', color: '#8a6d20', border: '1px solid #ead9ac' }}>
                {mode === 'password' ? 'No password yet, or forgot it? Email me a sign-in link' : 'I have a password'}
              </button>
            </div>
          )}
          <p className="text-[15px] text-gray-500 mt-5">First time here? Use the email address RO has for you and we&rsquo;ll send a sign-in link. Questions: (864) 304-0139.</p>
        </section>
      </main>
    </div>
  );
}
