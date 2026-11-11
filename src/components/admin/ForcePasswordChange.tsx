'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Blocking popup shown after sign-in when the account is flagged
// user_metadata.must_change_password (set when a temporary password is issued).
export default function ForcePasswordChange() {
  const supabase = createClient();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.must_change_password) setShow(true);
    });
  }, [supabase]);

  if (!show) return null;

  const save = async () => {
    setError('');
    if (pw.length < 8) { setError('Use at least 8 characters.'); return; }
    if (pw !== pw2) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, data: { must_change_password: false } });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setShow(false);
  };

  const input = 'w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-base text-white placeholder-white/30 focus:border-[#C9A84C]/50 focus:outline-none';

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Create your new password</h2>
        <p className="text-base text-white/60">You signed in with a temporary password. Pick your own now so only you know it.</p>
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{error}</div>}
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password (8+ characters)" className={input} autoComplete="new-password" />
        <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Type it again" className={input} autoComplete="new-password" />
        <button onClick={save} disabled={busy || !pw || !pw2} className="w-full py-3 bg-[#C9A84C] text-black font-semibold text-base rounded-lg hover:bg-[#d4b55a] disabled:opacity-50">
          {busy ? 'Saving...' : 'Save new password'}
        </button>
      </div>
    </div>
  );
}
