'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, FileText, UserPlus, Mail, Check, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getIcon(type: string) {
  switch (type) {
    case 'intake_submitted': return <UserPlus size={14} className="text-[#D4772C]" />;
    case 'intake_approved': return <Check size={14} className="text-green-400" />;
    case 'email_received': return <Mail size={14} className="text-[#3b8dd4]" />;
    default: return <FileText size={14} className="text-[#C9A84C]" />;
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?unread=false&limit=15');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
      if (data.unread_count !== undefined) setUnreadCount(data.unread_count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = (notif: Notification) => {
    if (notif.url) {
      window.location.href = notif.url;
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <Bell size={16} className={unreadCount > 0 ? 'text-[#C9A84C]' : 'text-white/30'} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1"
              style={{ boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 animate-ping opacity-30" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-[200]"
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
          <div className="sticky top-0 bg-[#111] px-4 py-3 border-b border-white/5 flex items-center justify-between z-10">
            <p className="text-[14px] font-bold text-white">Notifications</p>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-[#C9A84C]/60 hover:text-[#C9A84C]">Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-[13px] text-white/20">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors ${!notif.read ? 'bg-[#C9A84C]/[0.03]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-tight ${!notif.read ? 'text-white font-semibold' : 'text-white/60'}`}>{notif.title}</p>
                    {notif.body && <p className="text-[12px] text-white/25 mt-0.5 truncate">{notif.body}</p>}
                    <p className="text-[11px] text-white/15 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  {notif.url && <ChevronRight size={14} className="text-white/10 flex-shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
