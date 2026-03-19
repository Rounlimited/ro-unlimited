"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Activity, User, Bell, Monitor, Clock, ChevronLeft,
  Smartphone, Globe, RefreshCw, Eye, Mail, MousePointerClick,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ActivityEntry {
  id: string;
  user_email: string;
  action: string;
  page: string | null;
  details: Record<string, unknown>;
  user_agent: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string;
  last_sign_in: string | null;
  created_at: string;
}

interface PushSub {
  endpoint: string;
  updated_at: string;
}

function toET(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toETFull(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }) + " ET";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getDevice(ua: string | null): { label: string; icon: React.ElementType } {
  if (!ua) return { label: "Unknown", icon: Globe };
  const lower = ua.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile")) {
    return { label: lower.includes("iphone") ? "iPhone" : "Android", icon: Smartphone };
  }
  return { label: "Desktop", icon: Monitor };
}

function getActionInfo(action: string): { label: string; color: string; icon: React.ElementType } {
  switch (action) {
    case "app_open": return { label: "Opened App", color: "#4CAF50", icon: Smartphone };
    case "page_view": return { label: "Page View", color: "#3b8dd4", icon: Eye };
    case "push_sent": return { label: "Push Sent", color: "#C9A84C", icon: Bell };
    case "notification_click": return { label: "Opened Notification", color: "#ff9800", icon: MousePointerClick };
    default: return { label: action, color: "#888", icon: Activity };
  }
}

export default function ActivityPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pushSubs, setPushSubs] = useState<PushSub[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [viewerEmail, setViewerEmail] = useState("");

  const fetchData = useCallback(async (email: string) => {
    try {
      const params = new URLSearchParams({ viewer_email: email, days: String(days) });
      if (selectedUser) params.set("user_email", selectedUser);
      const res = await fetch(`/api/admin/activity?${params}`);
      if (res.status === 403) { setAuthorized(false); setLoading(false); return; }
      const data = await res.json();
      setActivity(data.activity || []);
      setUsers(data.users || []);
      setPushSubs(data.push_subscriptions || []);
      setAuthorized(true);
    } catch { /* ignore */ }
    setLoading(false);
  }, [days, selectedUser]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.email) { setLoading(false); return; }
      setViewerEmail(session.user.email);
      fetchData(session.user.email);
    });
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <RefreshCw size={24} className="text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <p className="text-white/40 text-[15px]">Access restricted to developer accounts.</p>
      </div>
    );
  }

  const nonSystemUsers = users.filter(u => u.role !== "super_admin");
  const filteredActivity = activity.filter(a => a.user_email !== "system" || a.action === "push_sent");

  // Group activity by user for the summary cards
  const userSummary = nonSystemUsers.map(u => {
    const userActs = activity.filter(a => a.user_email === u.email);
    const lastSeen = userActs[0]?.created_at || u.last_sign_in;
    const pageViews = userActs.filter(a => a.action === "page_view").length;
    const appOpens = userActs.filter(a => a.action === "app_open").length;
    const lastDevice = getDevice(userActs[0]?.user_agent || null);
    return { ...u, lastSeen, pageViews, appOpens, lastDevice, totalActions: userActs.length };
  });

  const pushEvents = activity.filter(a => a.action === "push_sent");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="p-2 -ml-2 rounded-xl hover:bg-white/10">
            <ChevronLeft size={20} className="text-white/60" />
          </button>
          <Activity size={20} className="text-[#C9A84C]" />
          <h1 className="text-[18px] font-bold tracking-tight">User Activity</h1>
          <div className="ml-auto flex items-center gap-2">
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[13px] text-white/70">
              <option value={1}>Last 24h</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button onClick={() => fetchData(viewerEmail)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── User Summary Cards ── */}
        <div>
          <h2 className="text-[15px] font-semibold text-white/50 uppercase tracking-wider mb-3">Team Members</h2>
          <div className="grid gap-3">
            {userSummary.map(u => (
              <button key={u.id} onClick={() => setSelectedUser(selectedUser === u.email ? null : u.email)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedUser === u.email
                    ? "bg-[#C9A84C]/10 border-[#C9A84C]/30"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-white/90">{u.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">{u.role}</span>
                    </div>
                    <span className="text-[13px] text-white/40">{u.email}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {u.lastSeen ? (
                      <>
                        <div className="flex items-center gap-1.5 justify-end text-[13px] text-white/60">
                          <u.lastDevice.icon size={13} className="text-white/30" />
                          {timeAgo(u.lastSeen)}
                        </div>
                        <div className="text-[11px] text-white/25 mt-0.5">{toET(u.lastSeen)}</div>
                      </>
                    ) : (
                      <span className="text-[12px] text-white/20">Never seen</span>
                    )}
                  </div>
                </div>
                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                    <Smartphone size={12} /> {u.appOpens} opens
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                    <Eye size={12} /> {u.pageViews} pages
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                    <Activity size={12} /> {u.totalActions} total
                  </div>
                </div>
              </button>
            ))}
            {userSummary.length === 0 && (
              <p className="text-white/30 text-[14px] text-center py-8">No team members found</p>
            )}
          </div>
        </div>

        {/* ── Push Notification Log ── */}
        {pushEvents.length > 0 && (
          <div>
            <h2 className="text-[15px] font-semibold text-white/50 uppercase tracking-wider mb-3">
              Push Notifications
            </h2>
            <div className="space-y-2">
              {pushEvents.map(evt => {
                const d = evt.details as { title?: string; body?: string; sent?: number; expired?: number; failed?: number; total?: number };
                return (
                  <div key={evt.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[14px] text-white/80 font-medium">{d.title}</p>
                          <p className="text-[12px] text-white/40">{d.body}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-white/25 flex-shrink-0 whitespace-nowrap">{toETFull(evt.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5 text-[12px]">
                      <span className="text-green-400/70">{d.sent || 0} delivered</span>
                      {(d.expired || 0) > 0 && <span className="text-yellow-400/70">{d.expired} expired</span>}
                      {(d.failed || 0) > 0 && <span className="text-red-400/70">{d.failed} failed</span>}
                      <span className="text-white/20 ml-auto">{d.total || 0} total subs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Push Subscriptions ── */}
        <div>
          <h2 className="text-[15px] font-semibold text-white/50 uppercase tracking-wider mb-3">
            Push Subscriptions ({pushSubs.length})
          </h2>
          {pushSubs.length > 0 ? (
            <div className="space-y-2">
              {pushSubs.map((sub, i) => {
                const domain = new URL(sub.endpoint).hostname;
                return (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                    <Bell size={14} className="text-white/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/60 truncate">{domain}</p>
                    </div>
                    <span className="text-[11px] text-white/25">{sub.updated_at ? toET(sub.updated_at) : ""}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/30 text-[14px] text-center py-4">No push subscriptions active</p>
          )}
        </div>

        {/* ── Activity Feed ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-white/50 uppercase tracking-wider">
              Activity Feed {selectedUser && `— ${selectedUser}`}
            </h2>
            {selectedUser && (
              <button onClick={() => setSelectedUser(null)} className="text-[12px] text-[#C9A84C] hover:underline">
                Clear filter
              </button>
            )}
          </div>
          <div className="space-y-1">
            {filteredActivity.map(entry => {
              const info = getActionInfo(entry.action);
              const device = getDevice(entry.user_agent);
              const InfoIcon = info.icon;
              return (
                <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${info.color}15` }}>
                    <InfoIcon size={14} style={{ color: info.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-white/70 font-medium">{entry.user_email === "system" ? "System" : entry.user_email.split("@")[0]}</span>
                      <span className="text-[12px] text-white/30">{info.label}</span>
                      {entry.page && (
                        <span className="text-[12px] text-white/20 font-mono truncate">{entry.page}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <device.icon size={12} className="text-white/20" />
                    <span className="text-[11px] text-white/25 whitespace-nowrap">{toETFull(entry.created_at)}</span>
                  </div>
                </div>
              );
            })}
            {filteredActivity.length === 0 && (
              <p className="text-white/30 text-[14px] text-center py-8">No activity recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
