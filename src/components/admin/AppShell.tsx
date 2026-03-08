'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { gsap } from 'gsap';
// Draggable removed - using touch events instead
import {
  LayoutDashboard, HardHat, MessageCircle, GripHorizontal,
  ClipboardList, Pencil, Camera, BarChart3, Receipt, CalendarDays,
  Users, FileText, Clock, Wrench, Package, TrendingUp,
  Settings, LifeBuoy, Lock, Search, X, ChevronDown,
  Briefcase, Shield, UserPlus, Truck, FileCheck, Target,
  Megaphone, CreditCard, PieChart, Building2, Bell
} from 'lucide-react';

interface AppIcon {
  id: string;
  label: string;
  icon: any;
  href?: string;
  active: boolean;
  color: string;
  bg: string;
  badge?: string;
}

const APP_ICONS: AppIcon[] = [
  // Active
  { id: 'checklist', label: 'Checklist', icon: ClipboardList, href: '/admin/checklist', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', badge: 'NEW' },
  { id: 'editor', label: 'Site Editor', icon: Pencil, href: '/admin/site-editor', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  { id: 'portfolio', label: 'Portfolio', icon: Camera, href: '/admin/projects', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  // CRM
  { id: 'leads', label: 'Leads', icon: Target, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'estimates', label: 'Estimates', icon: FileText, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'proposals', label: 'Proposals', icon: Briefcase, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  // Project Management
  { id: 'jobs', label: 'Jobs', icon: HardHat, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'dailylogs', label: 'Daily Logs', icon: FileCheck, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'documents', label: 'Documents', icon: FileText, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  // Financial
  { id: 'invoicing', label: 'Invoicing', icon: Receipt, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'budgets', label: 'Budgets', icon: BarChart3, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'payments', label: 'Payments', icon: CreditCard, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  // Team
  { id: 'team', label: 'Team', icon: Users, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'timesheets', label: 'Timesheets', icon: Clock, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'safety', label: 'Safety', icon: Shield, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'equipment', label: 'Equipment', icon: Wrench, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  // Vendors
  { id: 'suppliers', label: 'Suppliers', icon: Package, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'subs', label: 'Subs', icon: Truck, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'materials', label: 'Materials', icon: Building2, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  // Reports
  { id: 'reports', label: 'Reports', icon: PieChart, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  // Support
  { id: 'support', label: 'Support', icon: LifeBuoy, href: '/admin', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
];

const TABS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: HardHat },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'menu', label: 'Menu', icon: GripHorizontal },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab from pathname
  useEffect(() => {
    if (pathname === '/admin' || pathname === '/admin/') setActiveTab('dashboard');
    else setActiveTab('dashboard'); // All sub-pages still show dashboard as active
  }, [pathname]);

  // Open drawer with GSAP
  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    gsap.to(drawerRef.current, {
      y: 0, duration: 0.4, ease: 'power3.out',
    });
    gsap.to(backdropRef.current, {
      opacity: 1, duration: 0.3, pointerEvents: 'auto',
    });
  }, []);

  // Close drawer with GSAP
  const closeDrawer = useCallback(() => {
    gsap.to(drawerRef.current, {
      y: '100%', duration: 0.3, ease: 'power3.in',
      onComplete: () => setDrawerOpen(false),
    });
    gsap.to(backdropRef.current, {
      opacity: 0, duration: 0.2, pointerEvents: 'none',
    });
  }, []);

  // Handle tab press
  const handleTab = (tabId: string) => {
    if (tabId === 'menu') {
      if (drawerOpen) closeDrawer();
      else openDrawer();
      return;
    }
    if (drawerOpen) closeDrawer();
    setActiveTab(tabId);
    if (tabId === 'dashboard') router.push('/admin');
  };

  // Handle app icon press
  const handleAppIcon = (app: AppIcon) => {
    if (!app.active) return;
    closeDrawer();
    if (app.href) router.push(app.href);
  };

  // Filter icons by search
  const filtered = drawerSearch
    ? APP_ICONS.filter(a => a.label.toLowerCase().includes(drawerSearch.toLowerCase()))
    : APP_ICONS;

  // Touch handling for drawer swipe-down-to-close
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80) closeDrawer(); // Swipe down > 80px = close
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#0a0a0a] flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      {/* Status bar spacer */}
      <div className="flex-shrink-0 h-[env(safe-area-inset-top)] bg-[#0a0a0a]" />

      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-[#0f0f0f] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C9A84C] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-[10px] tracking-wider">RoU</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">RO Unlimited</h1>
            <p className="text-[9px] text-white/25 uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <Bell size={14} className="text-white/30" />
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 bg-[#0f0f0f] border-t border-white/5 px-2 pb-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
        <div className="flex items-center justify-around py-2">
          {TABS.map(tab => {
            const isActive = tab.id === activeTab || (tab.id === 'menu' && drawerOpen);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className="flex flex-col items-center gap-0.5 px-4 py-1 transition-all"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#C9A84C]/15' : ''
                }`}>
                  <Icon size={20} className={`transition-colors ${
                    isActive ? 'text-[#C9A84C]' : 'text-white/25'
                  }`} />
                </div>
                <span className={`text-[9px] font-medium transition-colors ${
                  isActive ? 'text-[#C9A84C]' : 'text-white/20'
                }`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 opacity-0 pointer-events-none"
        onClick={closeDrawer}
      />

      {/* App Drawer */}
      <div
        ref={drawerRef}
        className="fixed left-0 right-0 bottom-0 z-50 bg-[#141414] rounded-t-3xl border-t border-white/10 shadow-2xl"
        style={{ transform: 'translateY(100%)', maxHeight: '85vh' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer handle */}
        <div ref={handleRef} className="flex justify-center pt-3 pb-2 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={drawerSearch}
              onChange={e => setDrawerSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/30 focus:outline-none"
            />
            {drawerSearch && (
              <button onClick={() => setDrawerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Icon Grid — scrollable */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {/* Active apps section */}
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3 px-1">Available</p>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2 mb-6">
            {filtered.filter(a => a.active).map(app => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppIcon(app)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-active:scale-90"
                    style={{ background: app.bg }}
                  >
                    <Icon size={24} style={{ color: app.color }} />
                    {app.badge && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#C9A84C] text-black text-[7px] font-bold rounded-full">{app.badge}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/50 text-center leading-tight">{app.label}</span>
                </button>
              );
            })}
          </div>

          {/* Coming soon apps */}
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-3 px-1">Coming Soon</p>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {filtered.filter(a => !a.active).map(app => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppIcon(app)}
                  className="flex flex-col items-center gap-1.5 opacity-60"
                >
                  <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <Icon size={24} style={{ color: '#888' }} />
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center translate-x-0.5 translate-y-0.5">
                      <Lock size={7} className="text-white/40" />
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40 text-center leading-tight">{app.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
