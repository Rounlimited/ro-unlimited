'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';

const BLUE = '#00d4ff';
const GLOW = '0 0 6px #00d4ff, 0 0 18px #00aaee, 0 0 40px #0077cc';

export default function AccessPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'signing-in' | 'success' | 'invalid' | 'expired' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;

    const redeem = async () => {
      try {
        // Step 1: Validate token and get the supabase magic token
        const res = await fetch(`/api/admin/access-link?token=${token}`);
        const data = await res.json();

        if (!data.valid) {
          if (data.error?.includes('expired')) { setStatus('expired'); return; }
          setStatus('invalid');
          setErrorMsg(data.error || 'Invalid link');
          return;
        }

        setStatus('signing-in');

        // Step 2: Exchange supabase hashed token for a real session
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: data.supabaseToken,
          type: 'magiclink',
        });

        if (error) {
          // If the supabase magic link itself expired, show that
          setStatus('error');
          setErrorMsg('Session token expired. Please request a new access link.');
          return;
        }

        setStatus('success');
        // Small delay for success state, then redirect
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1200);
      } catch (e: any) {
        setStatus('error');
        setErrorMsg(e.message || 'Something went wrong');
      }
    };

    redeem();
  }, [token, router]);

  // ── Loading / signing in ──────────────────────────────────────────────────
  if (status === 'loading' || status === 'signing-in') {
    return (
      <div className="min-h-screen bg-[#020b12] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }} />
        <div className="relative flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" size={24} style={{ color: BLUE }} />
          <p className="text-[10px] uppercase tracking-widest font-mono" style={{ color: BLUE, opacity: 0.5 }}>
            {status === 'loading' ? 'VALIDATING LINK' : 'ESTABLISHING SESSION'}
          </p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#020b12] flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }} />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(0,212,255,0.08)', border: `1px solid ${BLUE}30` }}>
            <ShieldCheck size={28} style={{ color: BLUE, filter: `drop-shadow(0 0 6px ${BLUE})` }} />
          </div>
          <h1 className="text-lg font-semibold text-white mb-1">Access Granted</h1>
          <p className="text-[10px] font-mono" style={{ color: BLUE, opacity: 0.4 }}>REDIRECTING TO PORTAL...</p>
        </div>
      </div>
    );
  }

  // ── Error / invalid / expired ─────────────────────────────────────────────
  const isExpired = status === 'expired';
  return (
    <div className="min-h-screen bg-[#020b12] flex items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }} />
      <div className="relative text-center max-w-xs">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border"
          style={{
            background: isExpired ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)',
            borderColor: isExpired ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)',
          }}>
          <XCircle size={24} style={{ color: isExpired ? '#eab308' : '#ef4444' }} />
        </div>
        <h1 className="text-lg font-semibold text-white mb-2">
          {isExpired ? 'Link Expired' : 'Link Invalid'}
        </h1>
        <p className="text-xs text-white/30 mb-6 leading-relaxed">
          {isExpired
            ? 'This access link has expired (24-hour limit). Ask for a new one.'
            : errorMsg || 'This link has already been used or is invalid.'}
        </p>
        <button
          onClick={() => router.push('/admin/login')}
          className="px-5 py-2.5 text-xs font-medium rounded-lg border transition-colors"
          style={{ color: BLUE, borderColor: `${BLUE}30`, background: `${BLUE}08` }}>
          Go to Sign In
        </button>
      </div>
    </div>
  );
}
