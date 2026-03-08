'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Shield, User } from 'lucide-react';

export default function JoinPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'success' | 'error'>('loading');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    fetch(`/api/admin/invite-token?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setStatus('valid');
          setRole(data.role);
        } else if (data.error?.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invite-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      // Account created, now sign them in
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        // Account was created but sign-in failed, send them to login
        setStatus('success');
        setTimeout(() => router.push('/admin/login'), 2000);
        return;
      }

      setStatus('success');
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
      </div>
    );
  }

  // Invalid token
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invalid Invite Link</h1>
          <p className="text-sm text-white/30 mb-6">This link is not valid or has already been used. Contact your administrator for a new invite.</p>
          <button onClick={() => router.push('/admin/login')} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors">
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Expired token
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={28} className="text-yellow-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invite Expired</h1>
          <p className="text-sm text-white/30 mb-6">This invite link has expired. Contact your administrator for a new one.</p>
          <button onClick={() => router.push('/admin/login')} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors">
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Account Created</h1>
          <p className="text-sm text-white/30">Signing you in...</p>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C9A84C] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-xl tracking-wider">RoU</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Create Your Account</h1>
          <p className="text-xs text-white/30 mt-1">RO Unlimited Admin Portal</p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {role === 'super_admin' ? <Shield size={12} className="text-[#C9A84C]" /> : <User size={12} className="text-[#C9A84C]" />}
            <span className="text-[10px] text-[#C9A84C] uppercase tracking-wider font-medium">
              {role === 'super_admin' ? 'Developer Access' : 'Admin Access'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
                autoComplete="new-password"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !email || !password || !confirmPassword}
              className="w-full py-3 bg-[#C9A84C] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b55a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : 'Create Account'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/10 text-[10px] mt-6">
          Already have an account?{' '}
          <button onClick={() => router.push('/admin/login')} className="text-[#C9A84C]/40 hover:text-[#C9A84C]/60">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
