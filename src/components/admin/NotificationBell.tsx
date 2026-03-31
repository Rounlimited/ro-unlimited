'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, FileText, UserPlus, Mail, Check, ChevronRight, AlertCircle, Zap } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  created_at: string;
}

interface BriefingItem {
  type: string;
  icon: string;
  text: string;
  link?: string;
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

export default function NotificationBell({ buildTimestamp }: { buildTimestamp?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [briefing, setBriefing] = useState<BriefingItem[]>([]);
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

  // Fetch briefing once
  useEffect(() => {
    fetch('/api/admin/briefing')
      .then(r => r.json())
      .then(d => setBriefing(d.briefing || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    let interval = setInterval(fetchNotifications, 30000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchNotifications();
        interval = setInterval(fetchNotifications, 30000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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

  const totalBadge = unreadCount;

  const dropdown = open && mounted ? createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
      <div style={{
        position: 'fixed', top: 52, right: 12, width: 340, maxHeight: '75vh',
        overflowY: 'auto', zIndex: 99999, background: '#111',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
      }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#111', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Notifications</p>
          {notifications.length > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 11, color: 'rgba(201,168,76,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
          )}
        </div>

        {/* Briefing Section */}
        {briefing.length > 0 && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Zap size={11} style={{ color: '#C9A84C' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today&apos;s Briefing</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {briefing.map((item, i) => {
                const el = (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 10,
                    background: item.type === 'alert' ? 'rgba(212,119,44,0.06)' : item.type === 'action' ? 'rgba(59,141,212,0.06)' : 'rgba(255,255,255,0.02)',
                    border: item.type === 'alert' ? '1px solid rgba(212,119,44,0.1)' : item.type === 'action' ? '1px solid rgba(59,141,212,0.1)' : '1px solid transparent',
                    cursor: item.link ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (item.link) { window.location.href = item.link; setOpen(false); } }}
                  >
                    <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}
                      dangerouslySetInnerHTML={{
                        __html: item.text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:white;font-weight:600">$1</strong>')
                      }}
                    />
                    {item.link && <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, marginTop: 2 }} />}
                  </div>
                );
                return el;
              })}
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length === 0 && briefing.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Bell size={24} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No notifications yet</p>
          </div>
        ) : notifications.length > 0 ? (
          <div>
            {briefing.length > 0 && (
              <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.03)' }} />
              </div>
            )}
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
        ) : null}
        {buildTimestamp && (
          <div style={{ padding: '6px 16px 8px', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>Build: {buildTimestamp}</span>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        data-tour="notification-bell"
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <Bell size={16} className={totalBadge > 0 ? 'text-[#C9A84C]' : 'text-white/30'} />
        {totalBadge > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1"
              style={{ boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>
              {totalBadge > 9 ? '9+' : totalBadge}
            </span>
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 animate-ping opacity-30" />
          </>
        )}
      </button>
      {dropdown}
    </>
  );
}
