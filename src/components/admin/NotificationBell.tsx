'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, FileText, UserPlus, Mail, Check, ChevronRight } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    if (notif.url) window.location.href = notif.url;
    setOpen(false);
  };

  const dropdown = open && mounted ? createPortal(
    <>
      {/* Full-screen backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
      {/* Dropdown */}
      <div style={{
        position: 'fixed', top: 52, right: 12, width: 320, maxHeight: '70vh',
        overflowY: 'auto', zIndex: 99999, background: '#111',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
      }}>
        <div style={{ position: 'sticky', top: 0, background: '#111', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Notifications</p>
          {notifications.length > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 11, color: 'rgba(201,168,76,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Bell size={24} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map(notif => (
              <button key={notif.id} onClick={() => handleClick(notif)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: !notif.read ? 'rgba(201,168,76,0.03)' : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', color: 'white',
                }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.3, fontWeight: !notif.read ? 600 : 400, color: !notif.read ? 'white' : 'rgba(255,255,255,0.6)' }}>{notif.title}</p>
                  {notif.body && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.body}</p>}
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>{timeAgo(notif.created_at)}</p>
                </div>
                {notif.url && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.1)', flexShrink: 0, marginTop: 4 }} />}
              </button>
            ))}
          </div>
        )}
        <a href="/admin/intakes" style={{ display: 'block', padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'rgba(201,168,76,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none' }}>
          View All Intakes
        </a>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
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
      {dropdown}
    </>
  );
}
