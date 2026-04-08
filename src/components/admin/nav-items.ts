import {
  LayoutDashboard, HardDrive, ClipboardList, Pencil, Camera, Settings,
  MessageCircle, FileText, Users, LifeBuoy, Briefcase, TrendingUp,
  HardHat, CalendarDays, FileCheck, Receipt, BarChart3, CreditCard,
  Clock, Shield, Wrench, Package, Truck, Building2, PieChart, Mail,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  active: boolean;
  color: string;
  bg: string;
  badge?: string;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  // Main
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'main' },
  { id: 'leads', label: 'Inbox', icon: Mail, href: '/admin/inbox', active: true, color: '#3b8dd4', bg: 'rgba(59,141,212,0.15)', group: 'main' },
  { id: 'estimates', label: 'Estimates', icon: FileText, href: '/admin/estimates', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'main' },
  { id: 'portfolio', label: 'Projects', icon: Camera, href: '/admin/projects', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'main' },

  // Files & Data
  { id: 'drive', label: 'RO Drive', icon: HardDrive, href: '/admin/drive', active: true, color: '#3b8dd4', bg: 'rgba(59,141,212,0.15)', group: 'files' },
  { id: 'documents', label: 'Documents', icon: FileText, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'files' },
  { id: 'materials', label: 'Cost Library', icon: Building2, href: '/admin/cost-library', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'files' },
  { id: 'suppliers', label: 'Vendors', icon: Package, href: '/admin/vendors', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'files' },

  // Team
  { id: 'team', label: 'Team', icon: Users, href: '/admin/employees', active: true, color: '#D4772C', bg: 'rgba(212,119,44,0.15)', group: 'team' },
  { id: 'timesheets', label: 'Timesheets', icon: Clock, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'team' },
  { id: 'safety', label: 'Safety', icon: Shield, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'team' },

  // Operations (coming soon)
  { id: 'proposals', label: 'Proposals', icon: Briefcase, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'operations' },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'operations' },
  { id: 'jobs', label: 'Jobs', icon: HardHat, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'operations' },
  { id: 'invoicing', label: 'Invoicing', icon: Receipt, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'operations' },
  { id: 'payments', label: 'Payments', icon: CreditCard, active: false, color: '#666', bg: 'rgba(255,255,255,0.05)', group: 'operations' },

  // Config
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'config' },
  { id: 'checklist', label: 'Checklist', icon: ClipboardList, href: '/admin/checklist', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'config' },
  { id: 'editor', label: 'Site Editor', icon: Pencil, href: '/admin/site-editor', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'config' },
  { id: 'service-media', label: 'Service Media', icon: Camera, href: '/admin/service-media', active: true, color: '#F97316', bg: 'rgba(249,115,22,0.15)', group: 'config' },
  { id: 'support', label: 'Help', icon: LifeBuoy, href: '/admin/help', active: true, color: '#C9A84C', bg: 'rgba(201,168,76,0.15)', group: 'config' },
];

export const NAV_GROUPS = [
  { key: 'main', label: '' },
  { key: 'files', label: 'Files & Data' },
  { key: 'team', label: 'Team' },
  { key: 'operations', label: 'Operations' },
  { key: 'config', label: 'Configuration' },
];
