'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Trash2, Copy, Check, Shield, User, Loader2, X, Mail, Clock, ShieldCheck } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string | null;
  lastSignIn: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const supabase = createClient();
  const isNexa = currentUser?.role === 'super_admin';

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ email: user.email || '', role: user.user_metadata?.role || 'admin' });
      }
      // Fetch users list
      try {
        const res = await fetch('/api/admin/invite');
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      } catch (e) {}
      setLoading(false);
    };
    init();
  }, [supabase]);

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteLink('');
    setMessage(null);

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
        setMessage({ type: 'success', text: `Invite created for ${inviteEmail}! Copy the link below and send it to them.` });
      } else {
        setMessage({ type: 'success', text: `Invite sent to ${inviteEmail}` });
      }

      // Refresh user list
      const usersRes = await fetch('/api/admin/invite');
      const usersData = await usersRes.json();
      if (Array.isArray(usersData)) setUsers(usersData);

      setInviteEmail('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to send invite' });
    } finally {
      setInviting(false);
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

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AdminHeader title="Settings" subtitle={isNexa ? 'Developer Controls' : 'Site Configuration'} backHref="/admin" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg border text-sm flex items-center justify-between ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <div className="flex items-center gap-2">{message.type === 'success' ? <Check size={14} /> : <X size={14} />}{message.text}</div>
            <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100"><X size={14} /></button>
          </div>
        )}

        {/* Invite Link Display */}
        {inviteLink && (
          <div className="mb-6 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl p-4">
            <p className="text-[#C9A84C] text-sm font-medium mb-2">Invite Link Ready</p>
            <p className="text-white/40 text-xs mb-3">Copy this link and send it to the person. They will click it to set up their password and access the admin portal.</p>
            <div className="flex gap-2">
              <input type="text" value={inviteLink} readOnly className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 font-mono" />
              <button onClick={copyLink} className="px-4 py-2 bg-[#C9A84C] text-black text-xs font-semibold rounded-lg hover:bg-[#d4b55a] transition-colors flex items-center gap-1.5">
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>
        )}

        {/* User Management — NexaVision only */}
        {isNexa && (
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
                <UserPlus size={12} /> Invite
              </button>
            </div>

            {/* Invite Form */}
            {showInvite && (
              <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                  </div>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#C9A84C]/50 focus:outline-none">
                    <option value="admin">Admin</option>
                    <option value="super_admin">Developer</option>
                  </select>
                  <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()} className="px-4 py-2.5 bg-[#C9A84C] text-black text-xs font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-50 transition-all whitespace-nowrap">
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            )}

            {/* Users List */}
            <div className="divide-y divide-white/[0.03]">
              {users.map(user => (
                <div key={user.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'super_admin' ? 'bg-purple-500/10' : 'bg-white/5'}`}>
                      {user.role === 'super_admin' ? <ShieldCheck size={14} className="text-purple-400" /> : <User size={14} className="text-white/30" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{user.email}</span>
                        {user.role === 'super_admin' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Developer</span>}
                        {user.email === currentUser?.email && <span className="text-[9px] text-white/20">(you)</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-white/20">
                        <span className="flex items-center gap-1"><Clock size={9} /> Last sign in: {formatDate(user.lastSignIn)}</span>
                        <span>Joined: {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {user.email !== currentUser?.email && (
                    <button onClick={() => deleteUser(user.id, user.email || '')} className="p-1.5 text-white/10 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Non-NexaVision users see a simpler view */}
        {!isNexa && (
          <section className="bg-[#111] border border-white/5 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center">
                <User size={16} className="text-white/30" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Your Account</h2>
                <p className="text-[11px] text-white/25">{currentUser?.email}</p>
              </div>
            </div>
            <p className="text-xs text-white/30">Contact NexaVision Group to manage team access or change account settings.</p>
          </section>
        )}

        {/* NexaVision Developer Badge */}
        {isNexa && (
          <div className="text-center py-4">
            <span className="text-[10px] text-purple-400/30 uppercase tracking-widest">NexaVision Developer Mode</span>
          </div>
        )}
      </div>
    </div>
  );
}
