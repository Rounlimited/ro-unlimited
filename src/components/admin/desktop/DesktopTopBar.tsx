'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Command, LogOut, Settings, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '../NotificationBell';

const BUILD_TIMESTAMP = new Date().toISOString();

export default function DesktopTopBar() {
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser({
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'admin',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
        });
      }
    });
  }, []);

  // Cmd+K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    if (showUserMenu) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showUserMenu]);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.href = '/admin/login';
  };

  const isDevUser = user?.role === 'super_admin';

  return (
    <header className="flex-shrink-0 h-14 bg-[#0f0f0f] border-b border-white/5 px-6 flex items-center gap-4">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/25 hover:border-white/10 hover:text-white/40 transition-colors"
        >
          <Search size={15} />
          <span className="text-[13px] flex-1 text-left">Search estimates, customers, emails...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/20">
            <Command size={10} /> K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* AI Chat */}
        <button
          id="ai-bubble-header-btn"
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          title="AI Assistant"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2a6aaa, #3b8dd4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
            </svg>
          </div>
        </button>

        {/* Notifications */}
        <NotificationBell buildTimestamp={isDevUser ? BUILD_TIMESTAMP.replace('T', ' ').slice(0, 19) : undefined} />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 flex items-center justify-center">
              <span className="text-[12px] font-bold text-[#C9A84C]">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-left hidden xl:block">
              <p className="text-[12px] font-medium text-white/70 leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{user?.role || 'admin'}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-[13px] font-medium text-white/80">{user?.name}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{user?.email}</p>
              </div>
              <a href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-[13px] text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors">
                <Settings size={14} /> Settings
              </a>
              {isDevUser && (
                <a href="/admin/activity" className="flex items-center gap-3 px-4 py-3 text-[13px] text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/5 transition-colors">
                  <User size={14} /> Activity Monitor
                </a>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-colors border-t border-white/5"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search modal overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search size={18} className="text-white/30 flex-shrink-0" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search estimates, customers, emails, projects..."
                className="flex-1 bg-transparent text-[15px] text-white/80 placeholder-white/25 outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/20">ESC</kbd>
            </div>
            <div className="p-4 text-center">
              <p className="text-[13px] text-white/20">
                {searchQuery ? `Searching for "${searchQuery}"...` : 'Start typing to search across all data'}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
