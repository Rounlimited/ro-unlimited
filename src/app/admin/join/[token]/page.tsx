'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { gsap } from 'gsap';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Shield, User, Lock } from 'lucide-react';

const BLUE   = '#00d4ff';
const GLOW   = '0 0 6px #00d4ff, 0 0 18px #00aaee, 0 0 40px #0077cc';
const BGLOW  = '0 0 3px #00d4ff, 0 0 10px #00aaee';

export default function JoinPage() {
  const { token } = useParams();
  const router    = useRouter();

  const [status,          setStatus]          = useState<'loading'|'valid'|'invalid'|'expired'|'success'|'error'>('loading');
  const [role,            setRole]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [error,           setError]           = useState('');
  const [submitting,      setSubmitting]      = useState(false);

  // Animation refs
  const wrapRef    = useRef<HTMLDivElement>(null);
  const roRef      = useRef<HTMLImageElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const hL1Ref     = useRef<HTMLDivElement>(null);
  const hL2Ref     = useRef<HTMLDivElement>(null);
  const vL1Ref     = useRef<HTMLDivElement>(null);
  const vL2Ref     = useRef<HTMLDivElement>(null);
  const cTLRef     = useRef<HTMLDivElement>(null);
  const cTRRef     = useRef<HTMLDivElement>(null);
  const cBLRef     = useRef<HTMLDivElement>(null);
  const cBRRef     = useRef<HTMLDivElement>(null);
  const scanRef    = useRef<HTMLDivElement>(null);
  const coordRef   = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);

  // Validate token
  useEffect(() => {
    if (!token) return;
    fetch(`/api/admin/invite-token?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) { setStatus('valid'); setRole(data.role); }
        else if (data.error?.includes('expired')) setStatus('expired');
        else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  // Blueprint entrance animation (fires once status resolves)
  useEffect(() => {
    if (status !== 'valid') return;

    const ctx = gsap.context(() => {
      gsap.set(roRef.current,   { opacity: 0, scale: 0.9 });
      gsap.set(gridRef.current, { opacity: 0 });
      gsap.set([hL1Ref.current, hL2Ref.current], { scaleX: 0, opacity: 0, transformOrigin: 'left center' });
      gsap.set([vL1Ref.current, vL2Ref.current], { scaleY: 0, opacity: 0, transformOrigin: 'center top' });
      gsap.set([cTLRef.current, cTRRef.current, cBLRef.current, cBRRef.current], { opacity: 0, scale: 0.5 });
      gsap.set(scanRef.current,  { opacity: 0, scaleX: 0, transformOrigin: 'left center' });
      gsap.set(coordRef.current, { opacity: 0 });
      gsap.set(cardRef.current,  { opacity: 0, y: 28, scale: 0.97 });
      gsap.set(titleRef.current, { opacity: 0, y: 12 });

      const tl = gsap.timeline();

      // RO backdrop materializes
      tl.to(roRef.current,   { opacity: 0.08, scale: 1, duration: 1.0, ease: 'power2.out' })

      // Grid draws in
      .to(gridRef.current, { opacity: 1, duration: 0.5, ease: 'power1.out' }, '-=0.5')

      // Horizontal laser lines
      .to(hL1Ref.current, { scaleX: 1, opacity: 1, duration: 0.65, ease: 'power2.inOut' }, '-=0.2')
      .to(hL2Ref.current, { scaleX: 1, opacity: 1, duration: 0.65, ease: 'power2.inOut' }, '-=0.5')

      // Vertical laser lines
      .to(vL1Ref.current, { scaleY: 1, opacity: 1, duration: 0.55, ease: 'power2.inOut' }, '-=0.45')
      .to(vL2Ref.current, { scaleY: 1, opacity: 1, duration: 0.55, ease: 'power2.inOut' }, '-=0.4')

      // Corner crosshairs lock in
      .to([cTLRef.current, cBRRef.current], { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.5)', stagger: 0 }, '-=0.2')
      .to([cTRRef.current, cBLRef.current], { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.5)', stagger: 0 }, '-=0.12')

      // Scan line sweeps down
      .to(scanRef.current, { opacity: 0.6, scaleX: 1, duration: 0.38, ease: 'power1.inOut',
        onComplete: () => { gsap.to(scanRef.current, { opacity: 0, duration: 0.35, delay: 0.05 }); }
      }, '-=0.1')

      // Coordinate readout flickers in
      .to(coordRef.current, { opacity: 1, duration: 0.1, ease: 'none',
        onComplete: () => {
          let n = 0;
          const f = setInterval(() => {
            if (coordRef.current) coordRef.current.style.opacity = n++ % 2 === 0 ? '0' : '1';
            if (n > 6) { if (coordRef.current) coordRef.current.style.opacity = '1'; clearInterval(f); }
          }, 70);
        }
      }, '-=0.15')

      // RO breathes once subtly
      .to(roRef.current, { opacity: 0.12, scale: 1.03, duration: 1.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '-=0.2')

      // Title slides up
      .to(titleRef.current, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '-=1.0')

      // Form card rises
      .to(cardRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }, '-=0.3');
    });

    return () => ctx.revert();
  }, [status]);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Email and password are required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setSubmitting(true);
    try {
      const res  = await fetch('/api/admin/invite-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSubmitting(false); return; }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setStatus('success');
      setTimeout(() => { router.push('/admin'); router.refresh(); }, 1600);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  // ── Non-form states ────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#020b12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" size={22} style={{ color: BLUE }} />
          <p className="text-[10px] uppercase tracking-widest font-mono" style={{ color: BLUE, opacity: 0.5 }}>
            VALIDATING TOKEN
          </p>
        </div>
      </div>
    );
  }

  if (status === 'invalid' || status === 'expired') {
    const isExpired = status === 'expired';
    return (
      <div className="min-h-screen bg-[#020b12] flex items-center justify-center px-6">
        {/* Dim grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }} />
        <div className="relative text-center max-w-xs">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border"
            style={{ background: isExpired ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)', borderColor: isExpired ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)' }}>
            <XCircle size={24} style={{ color: isExpired ? '#eab308' : '#ef4444' }} />
          </div>
          <h1 className="text-lg font-semibold text-white mb-2">{isExpired ? 'Link Expired' : 'Invalid Link'}</h1>
          <p className="text-xs text-white/30 mb-6 leading-relaxed">
            {isExpired ? 'This invite link has expired. Ask for a new one.' : 'This link is invalid or already used. Contact your administrator.'}
          </p>
          <button onClick={() => router.push('/admin/login')}
            className="px-5 py-2.5 text-xs font-medium rounded-lg border transition-colors"
            style={{ color: BLUE, borderColor: `${BLUE}30`, background: `${BLUE}08` }}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#020b12] flex items-center justify-center px-6">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }} />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(0,212,255,0.08)', border: `1px solid ${BLUE}30` }}>
            <CheckCircle2 size={28} style={{ color: BLUE, filter: `drop-shadow(${BGLOW})` }} />
          </div>
          <h1 className="text-lg font-semibold text-white mb-2">Access Granted</h1>
          <p className="text-xs font-mono" style={{ color: BLUE, opacity: 0.5 }}>INITIALIZING PORTAL...</p>
        </div>
      </div>
    );
  }

  // ── MAIN FORM ──────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="min-h-screen bg-[#020b12] flex flex-col items-center justify-center px-5 relative overflow-hidden">

      {/* Blueprint grid */}
      <div ref={gridRef} className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,180,255,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.065) 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }} />

      {/* Horizontal laser lines */}
      <div ref={hL1Ref} className="absolute left-0 right-0 pointer-events-none"
        style={{ top: '28%', height: '1px', background: BLUE, boxShadow: GLOW }} />
      <div ref={hL2Ref} className="absolute left-0 right-0 pointer-events-none"
        style={{ top: '72%', height: '1px', background: BLUE, boxShadow: GLOW }} />

      {/* Vertical laser lines */}
      <div ref={vL1Ref} className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: '8%', width: '1px', background: BLUE, boxShadow: GLOW }} />
      <div ref={vL2Ref} className="absolute top-0 bottom-0 pointer-events-none"
        style={{ right: '8%', width: '1px', background: BLUE, boxShadow: GLOW }} />

      {/* Scan line */}
      <div ref={scanRef} className="absolute left-0 right-0 pointer-events-none"
        style={{ top: '50%', height: '2px', background: `linear-gradient(90deg, transparent, ${BLUE}, ${BLUE}, transparent)`, boxShadow: GLOW }} />

      {/* Corner crosshairs */}
      <div ref={cTLRef} className="absolute pointer-events-none" style={{ top: '14%', left: '5%' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L3 3 L3 16" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${BLUE})` }} />
          <circle cx="3" cy="3" r="2.5" fill={BLUE} style={{ filter: `drop-shadow(0 0 5px ${BLUE})` }} />
        </svg>
      </div>
      <div ref={cTRRef} className="absolute pointer-events-none" style={{ top: '14%', right: '5%' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L29 3 L29 16" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${BLUE})` }} />
          <circle cx="29" cy="3" r="2.5" fill={BLUE} style={{ filter: `drop-shadow(0 0 5px ${BLUE})` }} />
        </svg>
      </div>
      <div ref={cBLRef} className="absolute pointer-events-none" style={{ bottom: '14%', left: '5%' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 29 L3 29 L3 16" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${BLUE})` }} />
          <circle cx="3" cy="29" r="2.5" fill={BLUE} style={{ filter: `drop-shadow(0 0 5px ${BLUE})` }} />
        </svg>
      </div>
      <div ref={cBRRef} className="absolute pointer-events-none" style={{ bottom: '14%', right: '5%' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 29 L29 29 L29 16" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${BLUE})` }} />
          <circle cx="29" cy="29" r="2.5" fill={BLUE} style={{ filter: `drop-shadow(0 0 5px ${BLUE})` }} />
        </svg>
      </div>

      {/* RO mark — giant, dim, centered backdrop */}
      <img
        ref={roRef}
        src="/ro-icon.svg"
        alt="" aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          width: '88vw', maxWidth: '420px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) scaleY(1.35)',
          transformOrigin: 'center center',
          objectFit: 'fill',
        }}
      />

      {/* Coordinate readout — top right */}
      <div ref={coordRef} className="absolute top-6 right-5 text-right pointer-events-none select-none font-mono"
        style={{ color: BLUE, textShadow: `0 0 8px ${BLUE}` }}>
        <div style={{ fontSize: '8px', letterSpacing: '0.18em', opacity: 0.55 }}>SECURE · ONBOARDING</div>
        <div style={{ fontSize: '7px', letterSpacing: '0.12em', opacity: 0.3, marginTop: '3px' }}>34.8527° N · 82.3940° W</div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

        {/* Title block */}
        <div ref={titleRef} className="text-center mb-7">
          <img src="/ro-co-logo-v2.png" alt="RO Unlimited"
            className="h-10 w-auto object-contain mx-auto mb-5 opacity-90" />

          <div className="flex items-center justify-center gap-1.5 mb-2">
            {role === 'super_admin'
              ? <Shield size={11} style={{ color: BLUE, filter: `drop-shadow(${BGLOW})` }} />
              : <Lock size={11} style={{ color: BLUE, filter: `drop-shadow(${BGLOW})` }} />
            }
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono"
              style={{ color: BLUE, textShadow: `0 0 8px ${BLUE}` }}>
              {role === 'super_admin' ? 'Developer Access' : 'Admin Access'}
            </span>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">Create Your Account</h1>
          <p className="text-[10px] text-white/25 mt-1">You've been invited to RO Unlimited Admin Portal</p>
        </div>

        {/* Card */}
        <div ref={cardRef}
          className="w-full rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'rgba(10,16,24,0.85)',
            border: `1px solid ${BLUE}22`,
            backdropFilter: 'blur(12px)',
            boxShadow: `0 0 0 1px rgba(0,212,255,0.06), 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,212,255,0.08)`,
          }}>

          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${BLUE}60, transparent)`, boxShadow: BGLOW }} />

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-xs text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] mb-1.5 font-mono"
                style={{ color: BLUE, opacity: 0.6 }}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/15 outline-none transition-all"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid rgba(0,212,255,0.15)`,
                }}
                onFocus={e => e.target.style.borderColor = `${BLUE}55`}
                onBlur={e  => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] mb-1.5 font-mono"
                style={{ color: BLUE, opacity: 0.6 }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-white/15 outline-none transition-all"
                  style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(0,212,255,0.15)` }}
                  onFocus={e => e.target.style.borderColor = `${BLUE}55`}
                  onBlur={e  => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] mb-1.5 font-mono"
                style={{ color: BLUE, opacity: 0.6 }}>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/15 outline-none transition-all"
                style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(0,212,255,0.15)` }}
                onFocus={e => e.target.style.borderColor = `${BLUE}55`}
                onBlur={e  => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
                autoComplete="new-password"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !email || !password || !confirmPassword}
              className="w-full py-3.5 text-sm font-bold rounded-lg transition-all relative overflow-hidden mt-1"
              style={{
                background: submitting ? 'rgba(0,212,255,0.15)' : `rgba(0,212,255,0.12)`,
                border: `1px solid ${BLUE}55`,
                color: BLUE,
                textShadow: `0 0 12px ${BLUE}`,
                boxShadow: submitting ? 'none' : `0 0 20px rgba(0,212,255,0.15), inset 0 1px 0 rgba(0,212,255,0.2)`,
                letterSpacing: '0.15em',
              }}>
              {submitting
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> INITIALIZING...</span>
                : 'ACTIVATE ACCESS'
              }
            </button>
          </div>
        </div>

        <button onClick={() => router.push('/admin/login')}
          className="mt-5 text-[10px] font-mono transition-colors"
          style={{ color: `${BLUE}35` }}>
          Already have an account → Sign in
        </button>
      </div>
    </div>
  );
}
