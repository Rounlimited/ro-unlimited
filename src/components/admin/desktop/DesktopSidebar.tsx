'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Lock, Sparkles, BarChart3 } from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS, type NavItem } from '../nav-items';
import { createClient } from '@/lib/supabase/client';

export default function DesktopSidebar() {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setIsSuperAdmin(data?.user?.user_metadata?.role === 'super_admin');
    });
  }, []);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ro_sidebar_collapsed') === '1';
    return false;
  });
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    localStorage.setItem('ro_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (!item.href) return false;
    if (item.href === '/admin') return pathname === '/admin';
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  const devItems: NavItem[] = isSuperAdmin ? [
    { id: 'dev-proposals', label: 'Dev Proposals', icon: Sparkles, href: '/admin/dev/proposals', active: true, color: '#D4772C', bg: 'rgba(212,119,44,0.15)', group: 'dev' },
    { id: 'dev-activity', label: 'Activity', icon: BarChart3, href: '/admin/activity', active: true, color: '#D4772C', bg: 'rgba(212,119,44,0.15)', group: 'dev' },
  ] : [];
  const activeItems = [...NAV_ITEMS.filter(i => i.active), ...devItems];
  const navGroups = isSuperAdmin ? [...NAV_GROUPS, { key: 'dev', label: 'NexaVision Dev' }] : NAV_GROUPS;
  const comingSoonItems = NAV_ITEMS.filter(i => !i.active);

  return (
    <div
      className="flex-shrink-0 h-full flex flex-col bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 overflow-hidden"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex-shrink-0 px-3 py-4 flex items-center gap-2 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2 min-w-0">
          <img
            src="/ro-icon.svg"
            alt="RO"
            className="w-8 h-8 flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white/90 leading-none truncate">RO Unlimited</p>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">Admin</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {navGroups.map(group => {
          const items = activeItems.filter(i => i.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="mb-1">
              {group.label && !collapsed && (
                <p className="px-4 pt-4 pb-1 text-[10px] font-semibold text-white/20 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && <div className="mx-3 my-2 h-px bg-white/5" />}
              {items.map(item => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href || '#'}
                    className={`group flex items-center gap-3 mx-2 rounded-xl transition-all relative ${
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                    } ${
                      active
                        ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#C9A84C]" />
                    )}
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-[13px] font-medium truncate">{item.label}</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1a1a] border border-white/10 text-[12px] text-white/70 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 shadow-xl transition-opacity">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* Coming Soon */}
        {comingSoonItems.length > 0 && (
          <div className="mt-2">
            {!collapsed ? (
              <button
                onClick={() => setShowComingSoon(!showComingSoon)}
                className="w-full flex items-center gap-2 px-4 pt-3 pb-1 text-[10px] font-semibold text-white/15 uppercase tracking-widest hover:text-white/25 transition-colors"
              >
                <Lock size={9} />
                Coming Soon {showComingSoon ? '▾' : '▸'}
              </button>
            ) : (
              <div className="mx-3 my-2 h-px bg-white/5" />
            )}
            {(showComingSoon || collapsed) && comingSoonItems.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 mx-2 rounded-xl text-white/15 ${
                    collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-[12px] truncate">{item.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="flex-shrink-0 border-t border-white/5 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-[11px]">Collapse</span></>}
        </button>
      </div>
    </div>
  );
}
