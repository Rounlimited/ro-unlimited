'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Two modes in one page: request a reset email, or (arriving from the email
// link with a recovery session) choose a new password.
export default function ResetPage() {
  const supabase = createClient();
  const [recovering, setRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    const hasLink = /code=|type=recovery|access_token=/.test(window.location.search + window.location.hash);
    if (hasLink) setRecovering(true);
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const sendLink = async () => {
    setBusy(true); setError(''); setMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/login/reset`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setMsg('If that email has an account, a reset link is on its way. Open it on this same phone or computer.');
  };

  const save = async () => {
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setMsg('Password changed. Taking you to the admin...');
    setTimeout(() => { window.location.href = '/admin'; }, 1200);
  };

  const input = 'w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-base text-white placeholder-white/30 focus:border-[#C9A84C]/50 focus:outline-none';
  const btn = 'w-full py-3 bg-[#C9A84C] text-black font-semibold text-base rounded-lg hover:bg-[#d4b55a] disabled:opacity-50';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/ro-co-logo-v2.png" alt="RO Unlimited" className="h-14 w-auto object-contain mx-auto mb-4" style={{ maxWidth: '260px' }} />
          <p className="text-sm text-white/50">{recovering ? 'Choose a new password' : 'Reset your password'}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{error}</div>}
          {msg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">{msg}</div>}
          {recovering ? (
            <>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (6+ characters)" className={input} autoComplete="new-password" />
              <button onClick={save} disabled={busy || password.length < 6} className={btn}>{busy ? 'Saving...' : 'Save new password'}</button>
            </>
          ) : (
            <>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className={input} autoComplete="email" />
              <button onClick={sendLink} disabled={busy || !email} className={btn}>{busy ? 'Sending...' : 'Email me a reset link'}</button>
            </>
          )}
          <a href="/admin/login" className="block text-center text-sm text-white/50 hover:text-white/80">Back to sign in</a>
        </div>
      </div>
    </div>
  );
}
