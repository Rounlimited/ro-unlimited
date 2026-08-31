'use client';

import { useEffect, useState } from 'react';
import WhatsNewModal, { whatsNewSeen } from '@/components/admin/WhatsNewModal';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Search, ChevronDown, ChevronUp, LayoutDashboard, Compass,
  Settings, FileText, Layers, Send, Users, Building2,
  Library, FileStack, Printer, Calculator, Percent,
  Shield, Zap, HelpCircle, Play, Mail, BookOpen,
} from 'lucide-react';

/* ─── Types ─── */
interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: React.ReactNode;
  tourId?: string;
}

/* ─── Category config ─── */
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'getting-started', label: 'Getting Started' },
  { key: 'estimates', label: 'Estimates' },
  { key: 'customers-vendors', label: 'Customers & Vendors' },
  { key: 'templates-cost-library', label: 'Templates & Cost Library' },
  { key: 'pdf-documents', label: 'PDF & Documents' },
  { key: 'tips', label: 'Tips & Best Practices' },
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'getting-started':        { bg: 'bg-[#3b8dd4]/10', text: 'text-[#3b8dd4]', border: 'border-[#3b8dd4]/20' },
  'estimates':              { bg: 'bg-[#C9A84C]/10', text: 'text-[#C9A84C]', border: 'border-[#C9A84C]/20' },
  'customers-vendors':      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'templates-cost-library': { bg: 'bg-[#D4772C]/10', text: 'text-[#D4772C]', border: 'border-[#D4772C]/20' },
  'pdf-documents':          { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  'tips':                   { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

/* ─── Article data ─── */
const ARTICLES: Article[] = [
  // Getting Started
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    content: 'Your dashboard shows key stats at a glance. The top cards display your estimate counts by status. The app drawer (swipe up or tap menu) gives you access to all features.',
    category: 'getting-started',
    icon: <LayoutDashboard size={20} />,
    tourId: 'tour-dashboard',
  },
  {
    id: 'navigating-admin',
    title: 'Navigating the Admin Portal',
    content: 'Use the bottom tab bar to switch between main sections: Dashboard, Email, Team, and Portfolio. The app drawer contains all other features including Estimates, Customers, Vendors, Cost Library, and Templates.',
    category: 'getting-started',
    icon: <Compass size={20} />,
    tourId: 'tour-navigation',
  },
  {
    id: 'setting-up-account',
    title: 'Setting Up Your Account',
    content: 'Start by adding your customers, vendors, and cost library items. These will save you time when creating estimates later. Go to Settings to manage email accounts and team access.',
    category: 'getting-started',
    icon: <Settings size={20} />,
  },

  // Estimates
  {
    id: 'creating-first-estimate',
    title: 'Creating Your First Estimate',
    content: 'Go to Estimates → New Estimate. The 8-step wizard walks you through: selecting a customer, choosing a template, writing scope, adding line items, setting financials, payment schedule, terms, and review. Your estimate auto-saves as a draft.',
    category: 'estimates',
    icon: <FileText size={20} />,
    tourId: 'tour-estimates',
  },
  {
    id: 'estimate-wizard',
    title: 'Understanding the Estimate Wizard',
    content: 'Step 1: Pick or create a customer. Step 2: Choose a template (or start blank). Step 3: Write scope of work with the rich text editor. Step 4: Add line items grouped by phase. Step 5: Set markup, overhead, tax, contingency. Step 6: Define payment milestones. Step 7: Select disclaimers and exclusions. Step 8: Review and send.',
    category: 'estimates',
    icon: <Layers size={20} />,
    tourId: 'tour-estimate-wizard',
  },
  {
    id: 'estimate-status-workflow',
    title: 'Estimate Status Workflow',
    content: 'Estimates move through these statuses: Draft → Sent → Viewed → Accepted/Declined/Expired. Each status change is logged in the History tab. You can resend or revise estimates at any time.',
    category: 'estimates',
    icon: <BookOpen size={20} />,
  },
  {
    id: 'sending-estimates',
    title: 'Sending Estimates to Customers',
    content: 'From the estimate detail page, click Send. Choose which email account to send from, add an optional message, and the customer receives a professional email with your estimate details.',
    category: 'estimates',
    icon: <Send size={20} />,
  },

  // Customers & Vendors
  {
    id: 'managing-customers',
    title: 'Managing Customers',
    content: 'Add customers from the Customers page. Include their name, company, contact info, and type (residential/commercial/government). When creating an estimate, you can select an existing customer or create one on the fly.',
    category: 'customers-vendors',
    icon: <Users size={20} />,
    tourId: 'tour-customers',
  },
  {
    id: 'vendor-directory',
    title: 'Vendor Directory',
    content: 'Track your suppliers, subcontractors, and rental companies. Mark preferred vendors with a gold star. Vendors can be linked to cost library items for quick reference when building estimates.',
    category: 'customers-vendors',
    icon: <Building2 size={20} />,
  },

  // Templates & Cost Library
  {
    id: 'cost-library',
    title: 'Building Your Cost Library',
    content: 'The cost library stores your commonly used materials, labor rates, equipment, and subcontractor items. Each item has a default cost, unit, and markup percentage. When adding line items to an estimate, use \'Add from Library\' to pull items in instantly.',
    category: 'templates-cost-library',
    icon: <Library size={20} />,
    tourId: 'tour-cost-library',
  },
  {
    id: 'estimate-templates',
    title: 'Creating Estimate Templates',
    content: 'Templates pre-fill your estimates with default line items, percentages, payment schedules, and disclaimers. Create templates for common job types (Kitchen Remodel, Roof Replacement, etc.) to speed up estimate creation.',
    category: 'templates-cost-library',
    icon: <FileStack size={20} />,
  },

  // PDF & Documents
  {
    id: 'previewing-printing',
    title: 'Previewing and Printing Estimates',
    content: 'Click \'Preview PDF\' from any estimate to see a professional print-ready view. Use your browser\'s Print function (Ctrl+P or Cmd+P) to save as PDF. The preview includes your letterhead, itemized costs, payment schedule, and signature block.',
    category: 'pdf-documents',
    icon: <Printer size={20} />,
  },

  // Tips & Best Practices
  {
    id: 'markup-vs-margin',
    title: 'Markup vs. Margin Explained',
    content: 'Markup is added ON TOP of cost: 25% markup on $100 = $125. Margin is the percentage of the SALE PRICE that is profit: $25 profit on $125 sale = 20% margin. Use the converter in the Financials step to switch between them.',
    category: 'tips',
    icon: <Calculator size={20} />,
  },
  {
    id: 'setting-right-markup',
    title: 'Setting the Right Markup',
    content: 'Industry standard markups: Materials 30-50%, Labor 25%+, Overall GC 20-40%. Your effective margin should be 8-15% for healthy profitability. The Financials step shows your effective margin in real-time.',
    category: 'tips',
    icon: <Percent size={20} />,
  },
  {
    id: 'managing-disclaimers',
    title: 'Managing Disclaimers',
    content: '14 standard construction disclaimers are pre-loaded. 5 are auto-included by default (Non-Binding, Validity, Scope, Materials, Payment). You can add custom disclaimers and set which ones auto-include from the Disclaimers page.',
    category: 'tips',
    icon: <Shield size={20} />,
  },
  {
    id: 'quick-quote-vs-detailed',
    title: 'Quick Quote vs Detailed Estimate',
    content: 'Use Quick Quote for phone/email inquiries where you just need customer + description + total. Use Detailed for full proposals with line items, markup, terms, and payment schedule. You can always upgrade a Quick Quote to Detailed later.',
    category: 'tips',
    icon: <Zap size={20} />,
  },
];

/* ─── Tour definitions ─── */
const TOURS = [
  { id: 'tour-dashboard', label: 'Dashboard Tour' },
  { id: 'tour-navigation', label: 'Navigation Tour' },
  { id: 'tour-estimates', label: 'Estimates Tour' },
  { id: 'tour-estimate-wizard', label: 'Estimate Wizard Tour' },
  { id: 'tour-customers', label: 'Customers Tour' },
  { id: 'tour-cost-library', label: 'Cost Library Tour' },
];

/* ─── Helpers ─── */
function categoryBadge(category: string) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS['getting-started'];
  const label = CATEGORIES.find(cat => cat.key === category)?.label || category;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${c.bg} ${c.text}`}>
      {label}
    </span>
  );
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

/* ─── Page Component ─── */
export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [unseen, setUnseen] = useState(false);
  useEffect(() => { setUnseen(!whatsNewSeen()); }, [showWhatsNew]);

  const filtered = ARTICLES.filter(a => {
    const matchesCategory = activeTab === 'all' || a.category === activeTab;
    const q = search.toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Help Center" subtitle="Learn how to use every feature" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">


        {/* ── What's new in this release ── */}
        <button
          onClick={() => setShowWhatsNew(true)}
          className="relative w-full text-left rounded-2xl overflow-hidden p-5 active:scale-[0.995] transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(212,119,44,0.10))',
            border: '1px solid rgba(201,168,76,0.4)',
          }}
        >
          <style>{`
            @keyframes hp-shine { from { background-position: 200% 0; } to { background-position: -60% 0; } }
            .hp-shine { position: absolute; inset: 0; pointer-events: none;
              background: linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.22) 50%, transparent 58%);
              background-size: 260% 100%; animation: hp-shine 2.6s cubic-bezier(0.22,1,0.36,1) infinite; }
            @media (prefers-reduced-motion: reduce) { .hp-shine { animation: none; } }
          `}</style>
          <span className="hp-shine" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.45)' }}>
              <Zap size={22} style={{ color: '#D4B965' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[18px] font-bold text-white">What&rsquo;s New</p>
                {unseen && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#D4772C', color: '#fff' }}>NEW</span>
                )}
              </div>
              <p className="text-[15px] text-white/55 leading-snug mt-0.5">
                Progress tracking, the job log, reports that write themselves, and letters on
                your letterhead &mdash; walked through one at a time.
              </p>
            </div>
            <Play size={20} style={{ color: '#D4B965' }} className="shrink-0" />
          </div>
        </button>

        {/* ── Search ── */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111] border border-white/10 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
          />
        </div>

        {/* ── Category Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map(cat => {
            const isActive = activeTab === cat.key;
            const colors = cat.key === 'all' ? null : CATEGORY_COLORS[cat.key];
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? cat.key === 'all'
                      ? 'bg-white text-black'
                      : `${colors!.bg} ${colors!.text} ring-1 ${colors!.border}`
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Articles ── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <HelpCircle size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-[15px]">No articles found</p>
              <p className="text-[13px] mt-1">Try a different search term or category</p>
            </div>
          )}

          {filtered.map(article => {
            const isExpanded = expandedId === article.id;
            const colors = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['getting-started'];

            return (
              <button
                key={article.id}
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
                className="w-full text-left bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group"
              >
                {/* Collapsed header */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                    {article.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-[15px] font-semibold text-white group-hover:text-[#C9A84C] transition-colors">
                        {article.title}
                      </h3>
                      {categoryBadge(article.category)}
                    </div>
                    {!isExpanded && (
                      <p className="text-[14px] text-white/40 leading-relaxed">
                        {truncate(article.content, 90)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-1 text-white/20 group-hover:text-white/40 transition-colors">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 ml-[52px]">
                    <p className="text-[14px] text-white/60 leading-relaxed">
                      {article.content}
                    </p>
                    {article.tourId && (
                      <div
                        className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-[13px] font-medium ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
                        onClick={e => {
                          e.stopPropagation();
                          // Store tourId for the walkthrough system to pick up
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('start-tour', { detail: article.tourId }));
                          }
                        }}
                      >
                        <Play size={14} />
                        Take the Tour
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Replay Walkthroughs ── */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <h3 className="text-[15px] font-semibold text-white mb-1">Replay Walkthroughs</h3>
          <p className="text-[13px] text-white/40 mb-4">Restart any guided tour to refresh your memory</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TOURS.map(tour => (
              <button
                key={tour.id}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('start-tour', { detail: tour.id }));
                  }
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-[#C9A84C]/10 text-white/60 hover:text-[#C9A84C] text-[13px] font-medium transition-all"
              >
                <Play size={14} />
                {tour.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Support Footer ── */}
        <div className="text-center py-6 border-t border-white/5">
          <p className="text-[14px] text-white/40 mb-2">Can&apos;t find what you need?</p>
          <a
            href="mailto:build@rounlimited.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C] text-[14px] font-medium hover:bg-[#C9A84C]/20 transition-colors"
          >
            <Mail size={16} />
            Email Support — build@rounlimited.com
          </a>
        </div>

        {/* Bottom spacing for tab bar */}
        <div className="h-4" />
      </div>

      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
    </div>
  );
}
