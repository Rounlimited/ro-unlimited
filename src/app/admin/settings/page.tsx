'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Trash2, Copy, Check, Shield, User, Loader2, X, Clock, ShieldCheck, Link2, Share2, Zap, Mail, Plus, Edit3 } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string | null;
  lastSignIn: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; email_str: string } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  // Access link state
  const [generatingAccess, setGeneratingAccess] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [accessLinkExpiry, setAccessLinkExpiry] = useState('');
  const [copiedAccess, setCopiedAccess] = useState(false);

  // Email accounts state
  const [emailAccounts, setEmailAccounts] = useState<{ id: string; email: string; display_name: string; color: string; initials: string; active: boolean }[]>([]);
  const [showCreateEmail, setShowCreateEmail] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDisplayName, setEmailDisplayName] = useState('');
  const [emailColor, setEmailColor] = useState('#C9A84C');
  const [emailInitials, setEmailInitials] = useState('');
  const [creatingEmail, setCreatingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);

  const supabase = createClient();
  const isNexa = currentUser?.role === 'super_admin';

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({
          email: user.email || '',
          role: user.user_metadata?.role || 'admin',
          email_str: user.email || '',
        });
      }
      try {
        const res = await fetch('/api/admin/invite');
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      } catch (e) {}
      setLoading(false);
    };
    init();
    // Fetch email accounts
    fetch('/api/admin/email-accounts').then(r => r.json()).then(d => { if (Array.isArray(d)) setEmailAccounts(d); }).catch(() => {});
  }, [supabase]);

  // Generate invite link (for adding new users)
  const generateInviteLink = async () => {
    setInviting(true);
    setInviteLink('');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/invite-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInviteLink(data.inviteLink);
      setMessage({ type: 'success', text: 'Invite link created! Send it and they will create their own account.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to create invite link' });
    } finally {
      setInviting(false);
    }
  };

  // Generate a 24-hour access link for yourself (logs in immediately on click)
  const generateAccessLink = async () => {
    if (!currentUser?.email_str) return;
    setGeneratingAccess(true);
    setAccessLink('');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/access-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email_str }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAccessLink(data.accessLink);
      setAccessLinkExpiry(new Date(data.expiresAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      }));
      setMessage({ type: 'success', text: 'Access link ready — single use, expires in 24 hours.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to generate access link' });
    } finally {
      setGeneratingAccess(false);
    }
  };

  const copyAccessLink = () => {
    navigator.clipboard.writeText(accessLink);
    setCopiedAccess(true);
    setTimeout(() => setCopiedAccess(false), 2000);
  };

  const shareAccessLink = () => {
    const msg = `RO Unlimited admin access link (expires in 24 hours — single use):\n${accessLink}`;
    if (navigator.share) {
      navigator.share({ title: 'RO Unlimited Admin Access', text: msg, url: accessLink }).catch(() => {});
    } else {
      window.open(`sms:?body=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the admin portal? They will no longer be able to sign in.`)) return;
    try {
      await fetch(`/api/admin/invite?id=${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
      setMessage({ type: 'success', text: `${email} removed.` });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to remove user' });
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInviteLink = () => {
    const msg = `You have been invited to the RO Unlimited admin portal. Create your account here:\n${inviteLink}`;
    if (navigator.share) {
      navigator.share({ title: 'RO Unlimited Admin Invite', text: msg, url: inviteLink }).catch(() => {});
    } else {
      window.open(`sms:?body=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Settings" subtitle={isNexa ? 'Developer Controls' : 'Site Configuration'} backHref="/admin" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg border text-sm flex items-center justify-between ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <div className="flex items-center gap-2">{message.type === 'success' ? <Check size={14} /> : <X size={14} />}{message.text}</div>
            <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100"><X size={14} /></button>
          </div>
        )}

        {/* ── DEVELOPER ONLY: 24-hr Access Link ───────────────────────────── */}
        {isNexa && (
          <section className="bg-[#0d0d14] border border-purple-500/15 rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-purple-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Quick Access Link</h2>
                  <p className="text-[11px] text-white/25">One-click sign-in for your account · expires in 24 hours · single use</p>
                </div>
              </div>
              <button
                onClick={generateAccessLink}
                disabled={generatingAccess}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all disabled:opacity-50"
              >
                {generatingAccess
                  ? <><Loader2 size={11} className="animate-spin" /> Generating...</>
                  : <><Zap size={11} /> Generate Link</>
                }
              </button>
            </div>

            {accessLink && (
              <div className="px-6 py-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/30 font-mono">READY · EXPIRES {accessLinkExpiry.toUpperCase()}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text" value={accessLink} readOnly
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 font-mono truncate"
                  />
                  <button
                    onClick={copyAccessLink}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:bg-white/10 transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    {copiedAccess ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <button
                  onClick={shareAccessLink}
                  className="w-full py-2.5 bg-purple-500/15 text-purple-300 font-semibold text-xs rounded-lg hover:bg-purple-500/25 border border-purple-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={13} /> Send via Text
                </button>
                <p className="text-[10px] text-white/15 text-center mt-2">Whoever opens this link is signed in as you. Single use only.</p>
              </div>
            )}
          </section>
        )}

        {/* ── Invite Link Display (for new user invites) ───────────────────── */}
        {inviteLink && (
          <div className="mb-6 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl p-4">
            <p className="text-[#C9A84C] text-sm font-medium mb-2">Invite Link Ready</p>
            <p className="text-white/40 text-xs mb-3">Send this link. They will create their own email and password to access the admin portal.</p>
            <div className="flex gap-2 mb-3">
              <input type="text" value={inviteLink} readOnly className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 font-mono truncate" />
              <button onClick={copyInviteLink} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:bg-white/10 transition-colors flex items-center gap-1.5 flex-shrink-0">
                {copied ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <button onClick={shareInviteLink} className="w-full py-2.5 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg hover:bg-[#d4b55a] transition-colors flex items-center justify-center gap-2">
              <Share2 size={14} /> Send via Text
            </button>
          </div>
        )}

        {/* ── User Management (all admins can invite) ─────────────────────── */}
        <section className="bg-[#111] border border-white/5 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-[#C9A84C]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Team & Access</h2>
                <p className="text-[11px] text-white/25">Manage who can access this admin portal</p>
              </div>
            </div>
            <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/20 rounded-lg transition-all">
              <UserPlus size={12} /> Invite New User
            </button>
          </div>

          {showInvite && (
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
              <p className="text-xs text-white/30 mb-3">Generate an invite link and send it to anyone. They will create their own email and password to access the admin portal.</p>
              <div className="flex gap-3">
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#C9A84C]/50 focus:outline-none">
                  <option value="employee">Employee (Restricted)</option>
                  <option value="admin">Admin (Full Access)</option>
                  {isNexa && <option value="super_admin">Developer (NexaVision)</option>}
                </select>
                <button onClick={generateInviteLink} disabled={inviting} className="flex-1 px-4 py-2.5 bg-[#C9A84C] text-black text-xs font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {inviting ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <><Link2 size={12} /> Generate Invite Link</>}
                </button>
              </div>
            </div>
          )}

          {/* Current user info */}
          <div className="px-6 py-3 border-b border-white/[0.03] bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isNexa ? 'bg-purple-500/10' : 'bg-[#C9A84C]/10'}`}>
                {isNexa ? <ShieldCheck size={14} className="text-purple-400" /> : <User size={14} className="text-[#C9A84C]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{currentUser?.email}</span>
                  <span className="text-[9px] text-white/20">(you)</span>
                  {isNexa && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Developer</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {users.filter(u => u.email !== currentUser?.email).map(user => (
              <div key={user.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'super_admin' ? 'bg-purple-500/10' : user.role === 'employee' ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                    {user.role === 'super_admin' ? <ShieldCheck size={14} className="text-purple-400" /> : user.role === 'employee' ? <User size={14} className="text-blue-400" /> : <Shield size={14} className="text-[#C9A84C]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{user.email}</span>
                      {user.role === 'super_admin' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Developer</span>}
                      {user.role === 'employee' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Employee</span>}
                      {user.role === 'admin' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">Admin</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/20">
                      <span className="flex items-center gap-1"><Clock size={9} /> Last sign in: {formatDate(user.lastSignIn)}</span>
                      <span>Joined: {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {(isNexa || currentUser?.role === 'admin') && (
                  <button onClick={() => deleteUser(user.id, user.email || '')} className="p-1.5 text-white/10 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Email Accounts ──────────────────────────────────────────── */}
        <section className="bg-[#111] border border-white/5 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#3b8dd4]/10 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-[#3b8dd4]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Email Accounts</h2>
                <p className="text-[11px] text-white/25">Manage @rounlimited.com email addresses</p>
              </div>
            </div>
            <button onClick={() => { setShowCreateEmail(true); setEmailPrefix(''); setEmailDisplayName(''); setEmailColor('#C9A84C'); setEmailInitials(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#3b8dd4] bg-[#3b8dd4]/10 hover:bg-[#3b8dd4]/20 border border-[#3b8dd4]/20 rounded-lg transition-all">
              <Plus size={12} /> New Account
            </button>
          </div>

          {/* Create email form */}
          {showCreateEmail && (
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
              <p className="text-xs text-white/30 mb-3">Create a new @rounlimited.com email. No DNS changes needed — it works instantly.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] text-white/30 mb-1">Email Address</label>
                  <div className="flex items-center gap-0">
                    <input type="text" placeholder="name" value={emailPrefix} onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                      setEmailPrefix(val);
                      if (val && !emailInitials) setEmailInitials(val.slice(0, 2).toUpperCase());
                      if (val && !emailDisplayName) setEmailDisplayName(val.charAt(0).toUpperCase() + val.slice(1) + ' — RO Unlimited');
                    }} className="flex-1 bg-black/50 border border-white/10 rounded-l-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b8dd4]/50" />
                    <span className="bg-black/30 border border-l-0 border-white/10 rounded-r-lg px-3 py-2.5 text-sm text-white/30">@rounlimited.com</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] text-white/30 mb-1">Display Name</label>
                    <input type="text" placeholder="Display name" value={emailDisplayName} onChange={e => setEmailDisplayName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b8dd4]/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] text-white/30 mb-1">Initials</label>
                      <input type="text" maxLength={2} placeholder="SA" value={emailInitials} onChange={e => setEmailInitials(e.target.value.toUpperCase())} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-[#3b8dd4]/50" />
                    </div>
                    <div>
                      <label className="block text-[12px] text-white/30 mb-1">Color</label>
                      <div className="flex gap-1.5 flex-wrap py-1">
                        {['#D4772C', '#1B2A4A', '#2a6a4a', '#7C3AED', '#0891B2', '#C9A84C', '#dc2626', '#4ade80'].map(c => (
                          <button key={c} onClick={() => setEmailColor(c)} className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: emailColor === c ? 'white' : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Preview */}
                {emailPrefix && (
                  <div className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: emailColor }}>{emailInitials || '??'}</div>
                    <div>
                      <p className="text-sm text-white">{emailDisplayName || emailPrefix}</p>
                      <p className="text-xs text-white/30">{emailPrefix}@rounlimited.com</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={async () => {
                    if (!emailPrefix) { setMessage({ type: 'error', text: 'Enter an email address' }); return; }
                    setCreatingEmail(true);
                    try {
                      const res = await fetch('/api/admin/email-accounts', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: `${emailPrefix}@rounlimited.com`, display_name: emailDisplayName || emailPrefix, color: emailColor, initials: emailInitials || emailPrefix.slice(0, 2).toUpperCase() }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setEmailAccounts(prev => [...prev, data]);
                      setShowCreateEmail(false);
                      setMessage({ type: 'success', text: `${emailPrefix}@rounlimited.com created! It's ready to use in the inbox.` });
                    } catch (e: any) {
                      setMessage({ type: 'error', text: e.message || 'Failed to create email account' });
                    } finally { setCreatingEmail(false); }
                  }} disabled={creatingEmail || !emailPrefix}
                    className="flex-1 py-2.5 bg-[#3b8dd4] text-white text-xs font-semibold rounded-lg hover:bg-[#2a7bc4] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {creatingEmail ? <><Loader2 size={12} className="animate-spin" /> Creating...</> : <><Plus size={12} /> Create Email Account</>}
                  </button>
                  <button onClick={() => setShowCreateEmail(false)} className="px-4 py-2.5 text-white/30 text-xs hover:text-white/60 transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Account list */}
          <div className="divide-y divide-white/[0.03]">
            {emailAccounts.map(acct => (
              <div key={acct.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: acct.color }}>
                    {acct.initials}
                  </div>
                  <div>
                    <p className="text-sm text-white">{acct.display_name}</p>
                    <p className="text-[11px] text-white/25">{acct.email}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  if (!confirm(`Deactivate ${acct.email}? It will be removed from the inbox.`)) return;
                  await fetch(`/api/admin/email-accounts?id=${acct.id}`, { method: 'DELETE' });
                  setEmailAccounts(prev => prev.filter(a => a.id !== acct.id));
                  setMessage({ type: 'success', text: `${acct.email} deactivated` });
                }} className="p-1.5 text-white/10 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {emailAccounts.length === 0 && (
              <div className="px-6 py-6 text-center text-[13px] text-white/20">No email accounts configured</div>
            )}
          </div>
        </section>

        {isNexa && (
          <div className="text-center py-4">
            <span className="text-[10px] text-purple-400/30 uppercase tracking-widest">NexaVision Developer Mode</span>
          </div>
        )}
      </div>
    </div>
  );
}
