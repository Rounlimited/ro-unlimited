'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import {
  LayoutDashboard, HardHat, MessageCircle, GripHorizontal,
  ClipboardList, Pencil, Camera, BarChart3, Receipt, CalendarDays,
  Users, FileText, Clock, Wrench, Package, TrendingUp,
  Settings, LifeBuoy, Lock, Search, X, ChevronDown,
  Briefcase, Shield, UserPlus, Truck, FileCheck, Target,
  Megaphone, CreditCard, PieChart, Building2, Bell, Sparkles, Zap, LogOut
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

// Feature descriptions for every coming soon + active app
const FEATURE_INFO: Record<string, { title: string; headline: string; description: string; bullets: string[]; eta?: string }> = {
  // Active apps
  checklist: {
    title: 'Launch Checklist',
    headline: 'Your Roadmap to Going Live',
    description: 'A step-by-step guided launch system. Upload photos, connect accounts, and track every item needed to make your website a client-winning machine.',
    bullets: ['Smart priority sorting by impact', 'Progress tracking across all logins', 'Built-in upload and credential collection'],
  },
  editor: {
    title: 'Site Editor',
    headline: 'Control Your Website Content',
    description: 'Upload and manage your hero video, division page media, and site-wide content. Drag-and-drop simplicity with real-time preview.',
    bullets: ['Hero video upload with instant preview', 'Division page media management', 'Real-time content updates'],
  },
  portfolio: {
    title: 'Project Portfolio',
    headline: 'Let Your Work Speak',
    description: 'Organize your best projects by division with photos, descriptions, and before/after shots. This is what wins contracts while you sleep.',
    bullets: ['Organize by Residential, Commercial, Grading', 'Before & after photo pairing', 'Drag to reorder project showcase'],
  },
  settings: {
    title: 'Settings',
    headline: 'Team & Access Control',
    description: 'Manage who can access this portal. Generate invite links, control access levels, and keep your admin secure.',
    bullets: ['One-tap invite link generation', 'Admin vs Developer access roles', 'User management and removal'],
  },
  support: {
    title: 'Support',
    headline: 'NexaVision Has Your Back',
    description: 'Direct line to your web team. Questions about the site, need changes, or want to add features? We are one tap away.',
    bullets: ['Direct access to your dev team', 'Feature requests and feedback', 'Priority response for critical issues'],
  },
  // CRM & Sales
  leads: {
    title: 'Lead Management',
    headline: 'Never Lose Another Opportunity',
    description: 'Every phone call, website form, and referral captured in one place. Automatic follow-up reminders so no prospect falls through the cracks. Contractors using lead tracking close 30% more deals.',
    bullets: ['Auto-capture from website contact form', 'Follow-up reminders by text and email', 'Lead source tracking to see what is working', 'Hot, warm, cold lead scoring'],
    eta: 'Q2 2026',
  },
  estimates: {
    title: 'Estimate Builder',
    headline: 'Professional Bids in Minutes',
    description: 'Create branded, itemized estimates right from your phone. Pull from your saved materials and labor rates. Send as PDF. Convert to invoice when the job is done.',
    bullets: ['Saved material and labor rate library', 'Branded PDF estimates with your logo', 'One-tap convert estimate to invoice', 'Track which estimates get accepted'],
    eta: 'Q2 2026',
  },
  proposals: {
    title: 'Proposal Generator',
    headline: 'Win Contracts with Professional Proposals',
    description: 'Go beyond a simple estimate. Generate full project proposals with scope of work, timeline, payment schedule, and terms. Stand out from every other contractor who sends a one-page quote.',
    bullets: ['Professional branded templates', 'Scope, timeline, and payment terms built in', 'Digital signature for instant approval', 'Proposal tracking and analytics'],
    eta: 'Q3 2026',
  },
  pipeline: {
    title: 'Sales Pipeline',
    headline: 'See Every Deal at a Glance',
    description: 'Visual drag-and-drop board showing every opportunity from first contact to signed contract. Know exactly where every deal stands and what needs attention today.',
    bullets: ['Kanban board from lead to close', 'Deal value tracking and forecasting', 'Stage-by-stage conversion metrics', 'Automated stage movement triggers'],
    eta: 'Q2 2026',
  },
  // Project Management
  jobs: {
    title: 'Job Tracker',
    headline: 'Every Project, One Dashboard',
    description: 'Track every active job with real-time status, budget vs actual spend, crew assignments, and timeline. From ground-breaking to final walkthrough, nothing gets missed.',
    bullets: ['Real-time job status dashboard', 'Budget vs actual cost tracking', 'Crew and subcontractor assignments', 'Photo documentation per phase'],
    eta: 'Q3 2026',
  },
  schedule: {
    title: 'Scheduling',
    headline: 'Crews in the Right Place, Every Day',
    description: 'Drag-and-drop calendar for crew scheduling across all your active jobs. No more phone tag trying to figure out who is where. Your crew sees their schedule on their phone.',
    bullets: ['Drag-and-drop crew calendar', 'Multi-job, multi-crew scheduling', 'Weather delay auto-rescheduling', 'Crew mobile app with daily assignments'],
    eta: 'Q3 2026',
  },
  dailylogs: {
    title: 'Daily Logs',
    headline: 'Document Every Day on the Job',
    description: 'Quick daily log entries with photos, weather, crew count, work completed, and any issues. Build an unbreakable record of every project for disputes, insurance, and client confidence.',
    bullets: ['Photo + text daily entries', 'Weather and crew auto-logging', 'Timestamped and tamper-proof', 'Exportable for insurance and legal'],
    eta: 'Q3 2026',
  },
  documents: {
    title: 'Document Vault',
    headline: 'Every Plan, Permit, and Contract in One Place',
    description: 'Store plans, specs, permits, contracts, and change orders organized by project. Access any document from any device, on any job site.',
    bullets: ['Organized by project and type', 'Version control for plan revisions', 'Share documents with clients and subs', 'Search across all projects instantly'],
    eta: 'Q3 2026',
  },
  // Financial
  invoicing: {
    title: 'Invoicing',
    headline: 'Get Paid Faster, Chase Less',
    description: 'Create and send professional invoices in seconds. Automatic payment reminders. Accept credit cards and ACH payments. Contractors using automated invoicing get paid 2x faster.',
    bullets: ['Branded invoices from estimates', 'Automatic overdue reminders', 'Online payment with credit card and ACH', 'Payment tracking and cash flow view'],
    eta: 'Q2 2026',
  },
  budgets: {
    title: 'Budget Tracking',
    headline: 'Know Your Numbers Before They Become Problems',
    description: 'Set budgets per project, track spending in real time, and get alerts before you go over. The difference between a profitable job and a money pit is visibility.',
    bullets: ['Per-project budget setup', 'Real-time spend vs budget tracking', 'Overage alerts before it is too late', 'Profitability analysis per job'],
    eta: 'Q3 2026',
  },
  payments: {
    title: 'Payments',
    headline: 'Money In, Tracked Automatically',
    description: 'Accept deposits, progress payments, and final payments online. Every dollar tracked from invoice to bank account. No more wondering who has paid and who has not.',
    bullets: ['Accept cards, ACH, and checks', 'Deposit and progress payment tracking', 'Automatic receipt generation', 'QuickBooks sync for bookkeeping'],
    eta: 'Q3 2026',
  },
  expenses: {
    title: 'Expense Tracking',
    headline: 'Every Receipt, Every Dollar, Accounted For',
    description: 'Snap a photo of a receipt, assign it to a project, done. No more shoeboxes of receipts at tax time. Know exactly what every job costs in materials, labor, and overhead.',
    bullets: ['Photo receipt capture from phone', 'Auto-assign to projects', 'Category tracking for tax prep', 'Material cost trending over time'],
    eta: 'Q3 2026',
  },
  // Team & HR
  team: {
    title: 'Team Directory',
    headline: 'Your Whole Crew, Organized',
    description: 'Employee and subcontractor profiles with contact info, certifications, pay rates, and availability. Know who you have, what they can do, and when they are free.',
    bullets: ['Employee and sub profiles', 'Certification and license tracking', 'Availability and schedule view', 'Emergency contact information'],
    eta: 'Q4 2026',
  },
  timesheets: {
    title: 'Time Tracking',
    headline: 'Accurate Hours, Fair Pay, Zero Arguments',
    description: 'GPS-verified clock in/out from any phone. Hours automatically sorted by project for job costing. Export to payroll with one tap. No more handwritten timesheets.',
    bullets: ['GPS-verified clock in and out', 'Auto-sort hours by project', 'Overtime calculation built in', 'One-tap payroll export'],
    eta: 'Q4 2026',
  },
  safety: {
    title: 'Safety & Compliance',
    headline: 'Protect Your Crew and Your Business',
    description: 'Digital toolbox talks, incident reporting, OSHA logs, and safety checklists. Stay compliant and keep your crew safe without the paperwork nightmare.',
    bullets: ['Digital toolbox talk sign-offs', 'Incident reporting with photos', 'OSHA log generation', 'Safety checklist templates'],
    eta: 'Q4 2026',
  },
  equipment: {
    title: 'Equipment Tracker',
    headline: 'Know Where Every Machine Is, Always',
    description: 'Track every piece of equipment across all your job sites. Maintenance schedules, usage logs, and GPS location. Stop losing tools and stop missing oil changes.',
    bullets: ['Equipment location tracking', 'Maintenance schedule alerts', 'Usage logs per project', 'Replacement cost tracking'],
    eta: 'Q4 2026',
  },
  // Vendors & Suppliers
  suppliers: {
    title: 'Supplier Directory',
    headline: 'Your Go-To Vendors, One Tap Away',
    description: 'All your supplier contacts, account numbers, pricing agreements, and order history in one place. Compare pricing across vendors. Reorder materials in seconds.',
    bullets: ['Vendor contact and account info', 'Pricing agreement tracking', 'Order history per supplier', 'Quick reorder for common materials'],
    eta: 'Q4 2026',
  },
  subs: {
    title: 'Subcontractor Management',
    headline: 'Manage Every Sub Like a Pro',
    description: 'Track your subcontractors with COI status, payment history, performance ratings, and scheduling. Know who delivers and who does not.',
    bullets: ['COI and insurance tracking', 'Payment history and lien waivers', 'Performance rating system', 'Scheduling and availability'],
    eta: 'Q4 2026',
  },
  materials: {
    title: 'Material Orders',
    headline: 'Order Smart, Build Fast',
    description: 'Create purchase orders, track deliveries, and manage material costs per project. Know exactly what has been ordered, what has arrived, and what is still on the way.',
    bullets: ['Purchase order creation', 'Delivery tracking and confirmation', 'Cost per project allocation', 'Supplier price comparison'],
    eta: 'Q4 2026',
  },
  // Reports
  reports: {
    title: 'Reports & Analytics',
    headline: 'Run Your Business by the Numbers',
    description: 'Revenue trends, job profitability, lead conversion rates, crew productivity, and cash flow forecasting. Stop guessing and start knowing.',
    bullets: ['Revenue and profitability dashboards', 'Lead-to-close conversion tracking', 'Crew productivity analysis', 'Custom report builder'],
    eta: 'Q3 2026',
  },
};

const APP_ICONS: AppIcon[] = [
  { id: 'checklist', label: 'Checklist', icon: ClipboardList, href: '/admin/checklist', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', badge: 'NEW' },
  { id: 'editor', label: 'Site Editor', icon: Pencil, href: '/admin/site-editor', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  { id: 'portfolio', label: 'Portfolio', icon: Camera, href: '/admin/projects', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  { id: 'leads', label: 'Inbox', icon: MessageCircle, href: '/admin/inbox', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', badge: 'NEW' },
  { id: 'estimates', label: 'Estimates', icon: FileText, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'proposals', label: 'Proposals', icon: Briefcase, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'jobs', label: 'Jobs', icon: HardHat, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'dailylogs', label: 'Daily Logs', icon: FileCheck, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'documents', label: 'Documents', icon: FileText, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'invoicing', label: 'Invoicing', icon: Receipt, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'budgets', label: 'Budgets', icon: BarChart3, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'payments', label: 'Payments', icon: CreditCard, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'team', label: 'Team', icon: Users, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'timesheets', label: 'Timesheets', icon: Clock, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'safety', label: 'Safety', icon: Shield, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'equipment', label: 'Equipment', icon: Wrench, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'suppliers', label: 'Suppliers', icon: Package, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'subs', label: 'Subs', icon: Truck, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'materials', label: 'Materials', icon: Building2, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'reports', label: 'Reports', icon: PieChart, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)' },
  { id: 'support', label: 'Support', icon: LifeBuoy, href: '/admin', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
];

const TABS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: HardHat },
  { id: 'menu', label: 'Menu', icon: GripHorizontal },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
];

// Feature Info Modal Component
function FeatureModal({ appId, onClose }: { appId: string; onClose: () => void }) {
  const info = FEATURE_INFO[appId];
  const app = APP_ICONS.find(a => a.id === appId);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalRef.current || !contentRef.current) return;
    // Entrance animation
    gsap.fromTo(modalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(contentRef.current,
      { y: 60, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
    );
    // Stagger the bullets
    const bullets = contentRef.current.querySelectorAll('.bullet-item');
    gsap.fromTo(bullets,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.08, duration: 0.3, ease: 'power2.out', delay: 0.25 }
    );
    // Shimmer on the icon
    const iconEl = contentRef.current.querySelector('.modal-icon');
    if (iconEl) {
      gsap.fromTo(iconEl,
        { scale: 0, rotation: -20 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }
      );
    }
  }, []);

  const handleClose = () => {
    if (!modalRef.current || !contentRef.current) { onClose(); return; }
    gsap.to(contentRef.current, { y: 40, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in' });
    gsap.to(modalRef.current, { opacity: 0, duration: 0.15, delay: 0.1, onComplete: onClose });
  };

  if (!info || !app) return null;
  const Icon = app.icon;
  const isActive = app.active;

  return (
    <div ref={modalRef} className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 pb-8" style={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
      <div ref={contentRef} className="relative w-full max-w-sm bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" style={{ opacity: 0 }}>
        {/* Glow effect at top */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: isActive
            ? 'radial-gradient(ellipse at 50% -20%, rgba(201,168,76,0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.06) 0%, transparent 70%)'
        }} />

        {/* Close button */}
        <button onClick={handleClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 z-10 transition-colors">
          <X size={14} />
        </button>

        {/* Content */}
        <div className="relative px-6 pt-6 pb-5">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="modal-icon w-12 h-12 rounded-2xl flex items-center justify-center" style={{
              background: isActive ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)',
            }}>
              <Icon size={24} style={{ color: isActive ? '#C9A84C' : '#888' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{info.title}</h3>
              {info.eta && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 font-medium">
                  Coming {info.eta}
                </span>
              )}
              {isActive && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Headline */}
          <p className="text-sm font-semibold text-white/80 mb-2">{info.headline}</p>

          {/* Description */}
          <p className="text-xs text-white/40 leading-relaxed mb-4">{info.description}</p>

          {/* Bullets */}
          <div className="space-y-2 mb-5">
            {info.bullets.map((b, i) => (
              <div key={i} className="bullet-item flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: isActive ? '#C9A84C' : '#555' }} />
                <span className="text-xs text-white/50">{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {isActive && app.href ? (
            <button
              onClick={() => { handleClose(); }}
              className="w-full py-2.5 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg hover:bg-[#d4b55a] transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={14} /> Open {info.title}
            </button>
          ) : (
            <div className="w-full py-2.5 bg-white/[0.03] border border-white/5 rounded-lg flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-[#C9A84C]/50" />
              <span className="text-xs text-white/30 font-medium">In Development</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [featureModal, setFeatureModal] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin' || pathname === '/admin/') setActiveTab('dashboard');
    else setActiveTab('dashboard');
  }, [pathname]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    if (backdropRef.current) backdropRef.current.style.backdropFilter = 'none';
    gsap.to(drawerRef.current, { y: 0, duration: 0.35, ease: 'power3.out', force3D: true, onComplete: () => {
      if (backdropRef.current) backdropRef.current.style.backdropFilter = 'blur(6px)';
    }});
    gsap.to(backdropRef.current, { opacity: 1, duration: 0.25, pointerEvents: 'auto' });
  }, []);

  const closeDrawer = useCallback(() => {
    if (backdropRef.current) backdropRef.current.style.backdropFilter = 'none';
    gsap.to(drawerRef.current, { y: '100%', duration: 0.28, ease: 'power3.in', force3D: true, onComplete: () => setDrawerOpen(false) });
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, pointerEvents: 'none' });
  }, []);

  const handleTab = (tabId: string) => {
    if (tabId === 'menu') {
      if (drawerOpen) closeDrawer(); else openDrawer();
      return;
    }
    if (drawerOpen) closeDrawer();
    setActiveTab(tabId);
    if (tabId === 'dashboard') router.push('/admin');
    else if (tabId === 'messages') router.push('/admin/inbox');
  };

  const handleAppIcon = (app: AppIcon) => {
    if (!app.active) {
      // Show feature info modal for coming soon apps
      setFeatureModal(app.id);
      return;
    }
    closeDrawer();
    if (app.href) router.push(app.href);
  };

  // Long press for active apps to show info
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const handleLongPressStart = (app: AppIcon) => {
    longPressTimer.current = setTimeout(() => {
      setFeatureModal(app.id);
    }, 500);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const filtered = drawerSearch
    ? APP_ICONS.filter(a => a.label.toLowerCase().includes(drawerSearch.toLowerCase()))
    : APP_ICONS;

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80) closeDrawer();
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#0a0a0a] flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      <div className="flex-shrink-0 h-[env(safe-area-inset-top)] bg-[#0a0a0a] relative z-10" />

      <header data-admin-header className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between bg-[#0f0f0f] border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <img
            src="/ro-unlimited-logo.svg"
            alt="RO Unlimited"
            className="w-48 h-auto object-contain"
          />
          <span className="text-[9px] text-white/20 uppercase tracking-wider border-l border-white/10 pl-2">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <Bell size={14} className="text-white/30" />
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden relative z-10 flex flex-col"
        onTouchStart={(e) => { (window as any)._swipeStartY = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          const startY = (window as any)._swipeStartY || 0;
          const dy = startY - e.changedTouches[0].clientY;
          if (dy > 50 && !tabBarVisible) setTabBarVisible(true);
          if (dy < -50 && tabBarVisible && pathname && pathname.startsWith("/admin/inbox")) setTabBarVisible(false);
        }}>
        {children}
      </main>

      <nav ref={navRef} className="flex-shrink-0 bg-[#0f0f0f] border-t border-white/5 px-2 pb-2"
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))",
          transform: tabBarVisible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}>
        <div className="flex items-center py-2">
          {/* Left side tabs */}
          <div className="flex flex-1 items-center justify-around">
            {TABS.filter(t => t.id !== 'menu').slice(0, 2).map(tab => {
              const isActive = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => handleTab(tab.id)} className="flex flex-col items-center gap-0.5 px-4 py-1 transition-all">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-[#C9A84C]/15' : ''}`}>
                    <Icon size={20} className={`transition-colors ${isActive ? 'text-[#C9A84C]' : 'text-white/25'}`} />
                  </div>
                  <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-[#C9A84C]' : 'text-white/20'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
          {/* Center - menu button dead center */}
          <div className="flex-shrink-0 flex items-center justify-center px-2">
            <button onClick={() => handleTab('menu')} className="flex flex-col items-center gap-0.5 py-1 relative">
              <span className="absolute rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(201,168,76,0.35) 0%, transparent 70%)',
                animation: 'menuPulse 2.4s ease-in-out infinite',
                top: '-6px', left: '-6px', right: '-6px', bottom: '-6px',
              }} />
              <div style={{
                width: 52, height: 52, borderRadius: '9999px',
                background: drawerOpen ? '#b8942e' : 'linear-gradient(145deg, #d4b55a, #C9A84C, #a8883a)',
                boxShadow: drawerOpen
                  ? '0 0 0 2px rgba(201,168,76,0.6), 0 4px 20px rgba(201,168,76,0.5)'
                  : '0 0 0 1.5px rgba(201,168,76,0.4), 0 4px 24px rgba(201,168,76,0.4), 0 1px 4px rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', position: 'relative',
              }}>
                <GripHorizontal size={22} color="#0a0a0a" strokeWidth={2.2} style={{
                  transform: drawerOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }} />
              </div>
              <span className="text-[9px] font-semibold" style={{ color: '#C9A84C' }}>Menu</span>
              <style>{`
                @keyframes menuPulse {
                  0%, 100% { opacity: 0.5; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.18); }
                }
              `}</style>
            </button>
          </div>
          {/* Right side tabs */}
          <div className="flex flex-1 items-center justify-around">
            {TABS.filter(t => t.id !== 'menu').slice(2).map(tab => {
              const isActive = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => handleTab(tab.id)} className="flex flex-col items-center gap-0.5 px-4 py-1 transition-all">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-[#C9A84C]/15' : ''}`}>
                    <Icon size={20} className={`transition-colors ${isActive ? 'text-[#C9A84C]' : 'text-white/25'}`} />
                  </div>
                  <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-[#C9A84C]' : 'text-white/20'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div ref={backdropRef} className="fixed inset-0 bg-black/60 z-40 opacity-0 pointer-events-none" onClick={closeDrawer} />

      {/* App Drawer */}
      <div ref={drawerRef} className="fixed left-0 right-0 bottom-0 z-50 bg-[#141414] rounded-t-3xl border-t border-white/10 shadow-2xl" style={{ transform: 'translateY(100%)', maxHeight: '85vh' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* RO watermark locked to drawer, icons scroll over it */}
        <img src="/ro-icon.svg" alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ opacity: 0.12, width: '90%', left: '5%', top: '50%', transform: 'translateY(-50%) scaleY(1.4)', transformOrigin: 'center center', objectFit: 'fill', zIndex: 1 }} />
        <div ref={handleRef} className="flex justify-center pt-3 pb-2 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input type="text" value={drawerSearch} onChange={e => setDrawerSearch(e.target.value)} placeholder="Search" className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/30 focus:outline-none" />
            {drawerSearch && (
              <button onClick={() => setDrawerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"><X size={14} /></button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-8 relative" style={{ maxHeight: 'calc(85vh - 100px)', zIndex: 2 }}>
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3 px-1">Available</p>
          <div className="relative">
          <div className="grid grid-cols-4 gap-y-5 gap-x-2 mb-6 relative">
            {filtered.filter(a => a.active).map(app => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppIcon(app)}
                  onTouchStart={() => handleLongPressStart(app)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(app)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-active:scale-90" style={{ background: app.bg }}>
                    <img src="/ro-icon.svg" alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ opacity: 0.08 }} />
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

          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-3 px-1">Coming Soon</p>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2 relative" style={{ zIndex: 1 }}>
            {filtered.filter(a => !a.active).map(app => {
              const Icon = app.icon;
              return (
                <button key={app.id} onClick={() => handleAppIcon(app)} className="flex flex-col items-center gap-1.5 opacity-80">
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>                    <Icon size={24} style={{ color: '#888' }} />
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center translate-x-0.5 translate-y-0.5">
                      <Lock size={7} className="text-white/40" />
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40 text-center leading-tight">{app.label}</span>
                </button>
              );
            })}
          </div>
          </div>{/* end relative wrapper */}
        </div>
      </div>

      {/* Feature Info Modal */}
      {featureModal && (
        <FeatureModal appId={featureModal} onClose={() => setFeatureModal(null)} />
      )}
    </div>
  );
}

