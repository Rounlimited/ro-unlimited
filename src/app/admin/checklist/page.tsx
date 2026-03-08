'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import AdminHeader from '@/components/admin/AdminHeader';
import ProgressRing from '@/components/admin/ProgressRing';
import UploadModal from '@/components/admin/UploadModal';
import TextInputModal from '@/components/admin/TextInputModal';
import InstructionsModal from '@/components/admin/InstructionsModal';
import { Lock } from 'lucide-react';
import { Globe, Camera, MessageSquare, Building2, Zap, ChevronDown, ChevronRight, Check, ExternalLink, Upload, Star } from 'lucide-react';

type Priority = 'critical' | 'important' | 'nice';
type Difficulty = 'easy' | 'medium' | 'hard';
type ActionType = 'link' | 'upload' | 'text' | 'instructions' | 'nexa';
type Status = 'not_started' | 'in_progress' | 'done';
type SortMode = 'impact' | 'ease';

interface ChecklistItem {
  id: string; title: string; why: string; priority: Priority; difficulty: Difficulty;
  actionType: ActionType; actionLabel?: string; actionHref?: string;
  uploadAccept?: string; uploadType?: 'video' | 'image';
  impactScore: number; easeScore: number; status: Status;
}

interface Category { id: string; title: string; icon: any; desc: string; items: ChecklistItem[]; }

const DATA: Category[] = [
  { id: 'domain', title: 'Get Us Connected', icon: Globe, desc: 'Domain & account access so we can put your site on the map.', items: [
    { id: 'domain_login', title: 'Domain Login for rounlimited.com', why: "We need this to connect your website to your actual web address. Right now people can only find the site through a temporary link. Once we have this, your site goes live at rounlimited.com.", priority: 'critical', difficulty: 'easy', actionType: 'text', actionLabel: 'Enter GoDaddy Login', impactScore: 10, easeScore: 8, status: 'not_started' },
    { id: 'google_biz', title: 'Google Business Profile', why: "When someone Googles \"RO Unlimited\" or \"contractor near me\" this is what shows up with the map and reviews. We need to connect it to your website.", priority: 'critical', difficulty: 'medium', actionType: 'instructions', actionLabel: 'How To Do This', impactScore: 9, easeScore: 5, status: 'not_started' },
    { id: 'gbp_login', title: 'Google Business Profile Login', why: "If you already have a Google Business Profile, give us the login so we can manage your listing, update your hours, and respond to reviews.", priority: 'important', difficulty: 'easy', actionType: 'text', actionLabel: 'Enter Google Login', impactScore: 8, easeScore: 8, status: 'not_started' },
        { id: 'facebook', title: 'Facebook Page Access', why: "So we can link your website and Facebook page together. When someone visits your Facebook, they see a link to your professional website.", priority: 'important', difficulty: 'easy', actionType: 'instructions', actionLabel: 'How To Do This', impactScore: 5, easeScore: 7, status: 'not_started' },
  ]},
  { id: 'photos', title: 'Show Your Work', icon: Camera, desc: "Project photos are the #1 thing that wins commercial contracts.", items: [
    { id: 'project_photos', title: 'Completed Project Photos', why: "This is the single most important thing on your website. When a commercial developer is deciding who to hire, they want to SEE what you've built.", priority: 'critical', difficulty: 'medium', actionType: 'link', actionLabel: 'Upload Project Photos', actionHref: '/admin/checklist/projects', impactScore: 10, easeScore: 5, status: 'not_started' },
    { id: 'before_after', title: 'Before & After Shots', why: "Nothing sells construction work like seeing the transformation. Empty lot to finished building. Gutted interior to luxury finish.", priority: 'critical', difficulty: 'medium', actionType: 'link', actionLabel: 'Add Before & After', actionHref: '/admin/checklist/projects', impactScore: 9, easeScore: 5, status: 'not_started' },
    { id: 'jobsite', title: 'Job Site & Equipment Photos', why: "Shows you have real crews and real equipment. Commercial clients want to know you can handle big jobs.", priority: 'important', difficulty: 'easy', actionType: 'upload', actionLabel: 'Upload Photos', uploadAccept: 'image/*', uploadType: 'image', impactScore: 6, easeScore: 8, status: 'not_started' },
    { id: 'drone', title: 'Drone or Aerial Footage', why: "Aerial views of job sites look incredible and instantly set you apart from every other contractor.", priority: 'nice', difficulty: 'hard', actionType: 'upload', actionLabel: 'Upload Video', uploadAccept: 'video/*', uploadType: 'video', impactScore: 7, easeScore: 3, status: 'not_started' },
  ]},
  { id: 'testimonials', title: 'Let Your Clients Sell For You', icon: MessageSquare, desc: '92% of people read reviews before hiring a contractor.', items: [
    { id: 'written_test', title: 'Client Testimonials (3-5)', why: "A few short quotes from happy clients make a massive difference. Even something simple like \"RO built our building on time and on budget\" works.", priority: 'critical', difficulty: 'easy', actionType: 'link', actionLabel: 'Add Testimonials', actionHref: '/admin/checklist/testimonials', impactScore: 9, easeScore: 7, status: 'not_started' },
    { id: 'screenshots', title: 'Screenshots of Texts or Emails', why: "If a client ever texted or emailed something nice about your work, screenshot it and upload it. Real messages feel more authentic.", priority: 'important', difficulty: 'easy', actionType: 'upload', actionLabel: 'Upload Screenshots', uploadAccept: 'image/*', uploadType: 'image', impactScore: 7, easeScore: 9, status: 'not_started' },
    { id: 'video_test', title: 'Video Testimonial', why: "A 30-second iPhone video of a happy client is worth more than any ad you could buy.", priority: 'nice', difficulty: 'hard', actionType: 'upload', actionLabel: 'Upload Video', uploadAccept: 'video/*', uploadType: 'video', impactScore: 8, easeScore: 3, status: 'not_started' },
    { id: 'google_reviews', title: 'Google Reviews', why: "Reviews on Google help you show up in local searches. We\u2019ll give you the exact text to send past clients.", priority: 'important', difficulty: 'medium', actionType: 'instructions', actionLabel: 'Get the Template', impactScore: 8, easeScore: 5, status: 'not_started' },
  ]},
  { id: 'company', title: 'Tell Your Story', icon: Building2, desc: "People hire people they trust. Your 25+ year story IS your selling point.", items: [
    { id: 'story', title: 'Your Story \u2014 How RO Got Started', why: "Commercial clients are not just hiring a company \u2014 they are hiring YOU. Your experience and reputation need to be on the site.", priority: 'important', difficulty: 'easy', actionType: 'link', actionLabel: 'Tell Your Story', actionHref: '/admin/checklist/company', impactScore: 7, easeScore: 6, status: 'not_started' },
    { id: 'team_photo', title: 'Team Photo or Headshot', why: "Puts a face to the name. Developers want to know who they are working with.", priority: 'important', difficulty: 'easy', actionType: 'upload', actionLabel: 'Upload Photo', uploadAccept: 'image/*', uploadType: 'image', impactScore: 6, easeScore: 8, status: 'not_started' },
    { id: 'licenses', title: 'Licenses & Certifications', why: "Shows you are legit and insured. Commercial developers require this.", priority: 'important', difficulty: 'easy', actionType: 'link', actionLabel: 'Enter Credentials', actionHref: '/admin/checklist/company', impactScore: 7, easeScore: 8, status: 'not_started' },
    { id: 'service_area', title: 'Service Area Details', why: "Which cities and counties you cover. Helps people in your area find you.", priority: 'important', difficulty: 'easy', actionType: 'link', actionLabel: 'Set Service Area', actionHref: '/admin/checklist/company', impactScore: 6, easeScore: 9, status: 'not_started' },
  ]},
  { id: 'nexa', title: 'NexaVision Is On It', icon: Zap, desc: "We're building these. No action needed from you.", items: [
    { id: 'n1', title: 'SEO Optimization', why: 'Making sure you show up on Google.', priority: 'critical', difficulty: 'easy', actionType: 'nexa', impactScore: 9, easeScore: 10, status: 'in_progress' },
    { id: 'n2', title: 'Mobile Optimization', why: 'Site looks perfect on phones.', priority: 'critical', difficulty: 'easy', actionType: 'nexa', impactScore: 8, easeScore: 10, status: 'done' },
    { id: 'n3', title: 'SSL / Security', why: 'Padlock in browser, site is secure.', priority: 'critical', difficulty: 'easy', actionType: 'nexa', impactScore: 7, easeScore: 10, status: 'done' },
    { id: 'n4', title: 'Hero Video Background', why: 'Cinematic video on homepage.', priority: 'important', difficulty: 'easy', actionType: 'nexa', impactScore: 8, easeScore: 10, status: 'done' },
    { id: 'n5', title: 'Scroll Animations', why: 'Smooth building animations.', priority: 'important', difficulty: 'easy', actionType: 'nexa', impactScore: 7, easeScore: 10, status: 'done' },
    { id: 'n6', title: 'Admin Dashboard', why: 'This portal you are using now.', priority: 'important', difficulty: 'easy', actionType: 'nexa', impactScore: 6, easeScore: 10, status: 'done' },
    { id: 'n7', title: 'Portfolio Gallery', why: 'Building once photos come in.', priority: 'critical', difficulty: 'easy', actionType: 'nexa', impactScore: 9, easeScore: 10, status: 'not_started' },
    { id: 'n8', title: 'Contact Form \u2192 Leads', why: 'Submissions flow to your admin.', priority: 'important', difficulty: 'easy', actionType: 'nexa', impactScore: 7, easeScore: 10, status: 'in_progress' },
    { id: 'n9', title: 'Domain Connection', why: 'Waiting on GoDaddy credentials.', priority: 'critical', difficulty: 'easy', actionType: 'nexa', impactScore: 10, easeScore: 10, status: 'not_started' },
  ]},
];

const pBadge: Record<Priority, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-500/20 text-red-300 border-red-500/30 font-semibold' },
  important: { label: 'Important', cls: 'bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30 font-semibold' },
  nice: { label: 'Nice to Have', cls: 'bg-white/5 text-white/40 border-white/10' },
};
const dBadge: Record<Difficulty, string> = { easy: '\u2705 Easy', medium: '\ud83d\udcaa Some Effort', hard: '\ud83d\udee0\ufe0f Takes Work' };

export default function ChecklistPage() {
  const [cats, setCats] = useState(DATA);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ domain: true, photos: true, testimonials: true, company: true, nexa: false });
  const [sort, setSort] = useState<SortMode>('impact');
  const [modal, setModal] = useState<{ title: string; description: string; accept: string; type: 'video' | 'image'; itemId: string } | null>(null);
  const [textModal, setTextModal] = useState<{ itemId: string; title: string; description: string; fields: { id: string; label: string; placeholder: string; type?: 'text' | 'password' | 'email' }[] } | null>(null);
  const [instructionsModal, setInstructionsModal] = useState<{ itemId: string; title: string; description: string; steps: { text: string; link?: string; copyText?: string }[] } | null>(null);


  // Load saved statuses from Sanity on mount
  useEffect(() => {
    fetch('/api/admin/checklist')
      .then(r => r.json())
      .then(data => {
        if (data?.statuses) {
          setCats(prev => prev.map(c => ({
            ...c,
            items: c.items.map(i => ({
              ...i,
              status: (data.statuses[i.id]) || i.status,
            })),
          })));
        }
      })
      .catch(() => {});
  }, []);
  const actionable = cats.filter(c => c.id !== 'nexa').flatMap(c => c.items);
  const doneCount = actionable.filter(i => i.status === 'done').length;
  const percent = actionable.length > 0 ? (doneCount / actionable.length) * 100 : 0;
  const nexaItems = cats.find(c => c.id === 'nexa')?.items || [];
  const nexaDone = nexaItems.filter(i => i.status === 'done').length;

  const toggle = (catId: string, itemId: string) => {
    let newStatus = 'not_started';
    setCats(prev => prev.map(c => c.id !== catId ? c : {
      ...c, items: c.items.map(i => {
        if (i.id !== itemId || i.actionType === 'nexa') return i;
        newStatus = i.status === 'done' ? 'not_started' : 'done';
        return { ...i, status: newStatus as Status };
      })
    }));
    // Persist to Sanity
    fetch('/api/admin/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, status: newStatus }),
    }).catch(() => {});
  };

  const sorted = (items: ChecklistItem[]) => [...items].sort((a, b) => sort === 'impact' ? b.impactScore - a.impactScore : b.easeScore - a.easeScore);

  // Modal configurations per item
  const textConfigs: Record<string, { title: string; description: string; fields: { id: string; label: string; placeholder: string; type?: 'text' | 'password' | 'email' }[] }> = {
    gbp_login: {
      title: 'Google Business Profile Login',
      description: "Your Google account credentials for the Business Profile. We use this to manage your listing, respond to reviews, and keep your business info up to date.",
      fields: [
        { id: 'email', label: 'Google Email', placeholder: 'your@gmail.com', type: 'email' },
        { id: 'password', label: 'Password', placeholder: 'Your Google password', type: 'password' },
      ],
    },
        domain_login: {
      title: 'GoDaddy Login',
      description: "We will use this to connect rounlimited.com to your website.",
      fields: [
        { id: 'provider', label: 'Where did you buy the domain?', placeholder: 'GoDaddy, Google Domains, etc.', type: 'text' },
        { id: 'email', label: 'Login Email or Username', placeholder: 'your@email.com', type: 'email' },
        { id: 'password', label: 'Password', placeholder: 'Your login password', type: 'password' },
      ],
    },
  };

  const instructionConfigs: Record<string, { title: string; description: string; steps: { text: string; link?: string; copyText?: string }[] }> = {
    google_biz: {
      title: 'Google Business Profile',
      description: 'Follow these steps to give us access.',
      steps: [
        { text: 'Open Google Business Profile Manager on your phone or computer.', link: 'https://business.google.com' },
        { text: 'If you don\u2019t have one yet, tap "Add your business" and follow the steps to create one. Use "RO Unlimited Contractor & Developer" as the business name.' },
        { text: 'Once you\u2019re in, tap the three dots menu (top right) and select "Business Profile settings".' },
        { text: 'Tap "Managers" then "Add" and type in this email:', copyText: 'admin@nexavisiongroup.com' },
        { text: 'Select "Manager" as the role and send the invite. That\u2019s it! We\u2019ll handle everything from there.' },
      ],
    },
    facebook: {
      title: 'Facebook Page Access',
      description: 'Share your Facebook page so we can link it.',
      steps: [
        { text: 'Open your RO Unlimited Facebook page on your phone.' },
        { text: 'Tap the three dots (...) at the top and select "Page Settings".' },
        { text: 'Tap "Page Access" or "New Pages Experience" then "Add New".' },
        { text: 'Search for and add this email as an Admin:', copyText: 'admin@nexavisiongroup.com' },
        { text: 'Confirm the invite. We\u2019ll connect it to your website.' },
      ],
    },
    google_reviews: {
      title: 'Get Google Reviews',
      description: 'Send this text to 3-5 past clients. It takes them 60 seconds.',
      steps: [
        { text: 'Copy the message below and text it to a few past clients who were happy with your work.' },
        { text: 'Here\u2019s what to send them:', copyText: 'Hey! Quick favor  -  would you mind leaving us a quick Google review? It really helps us out. Just click this link and tap the stars: [We\u2019ll add your Google review link here once your Business Profile is set up]. Thanks!' },
        { text: 'Even 3-5 reviews makes a huge difference for showing up in local searches.' },
        { text: 'Once your Google Business Profile is connected (Step 1 above), we\u2019ll give you the exact link to include in that message.' },
      ],
    },
  };

  const saveTextData = async (itemId: string, values: Record<string, string>) => {
    try {
      await fetch('/api/admin/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: itemId, value: values }),
      });
      // Mark as done and persist
      setCats(prev => prev.map(c => ({
        ...c, items: c.items.map(i => i.id === itemId ? { ...i, status: 'done' as Status } : i)
      })));
      fetch('/api/admin/checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status: 'done' }),
      }).catch(() => {});
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const progressRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Progress section slides in
      if (progressRef.current) {
        gsap.fromTo(progressRef.current,
          { y: 30, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 }
        );
      }

      // Category cards stagger in with a construction-style clip reveal
      if (categoriesRef.current) {
        const cards = categoriesRef.current.children;
        gsap.fromTo(cards,
          { y: 50, opacity: 0, clipPath: 'inset(10% 0% 10% 0%)' },
          { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.3 }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Launch Checklist</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Get your site 100% ready</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Progress */}
        <div ref={progressRef} className="flex items-center gap-8 mb-10 bg-[#111] border border-white/5 rounded-xl p-6">
          <ProgressRing percent={percent} />
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{percent === 100 ? 'Launch Ready!' : percent > 50 ? 'Getting There!' : "Let's Get Started"}</h2>
            <p className="text-white/60 text-sm mb-3">{doneCount} of {actionable.length} items from you. NexaVision: {nexaDone}/{nexaItems.length} done.</p>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-white/30">{actionable.filter(i => i.priority === 'critical' && i.status !== 'done').length} critical left</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C9A84C]" /><span className="text-white/30">{actionable.filter(i => i.priority === 'important' && i.status !== 'done').length} important left</span></span>
            </div>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/20 text-xs uppercase tracking-wider">Your checklist</p>
          <div className="flex gap-0.5 bg-[#111] border border-white/5 rounded-lg p-0.5">
            <button onClick={() => setSort('impact')} className={`px-3 py-1.5 text-xs rounded transition-all ${sort === 'impact' ? 'bg-[#C9A84C]/25 text-[#C9A84C] font-semibold' : 'text-white/40'}`}><Star size={10} className="inline mr-1" />Most Important</button>
            <button onClick={() => setSort('ease')} className={`px-3 py-1.5 text-xs rounded transition-all ${sort === 'ease' ? 'bg-[#C9A84C]/25 text-[#C9A84C] font-semibold' : 'text-white/40'}`}><Zap size={10} className="inline mr-1" />Easiest First</button>
          </div>
        </div>

        {/* Categories */}
        <div ref={categoriesRef} className="space-y-4">
          {cats.map(cat => {
            const open = expanded[cat.id] ?? false;
            const done = cat.items.filter(i => i.status === 'done').length;
            const isNexa = cat.id === 'nexa';
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(p => ({ ...p, [cat.id]: !open }))} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isNexa ? 'bg-green-500/10' : 'bg-[#C9A84C]/10'}`}>
                      <Icon size={16} className={isNexa ? 'text-green-400' : 'text-[#C9A84C]'} />
                    </div>
                    <div className="text-left"><h3 className="text-base font-bold text-white">{cat.title}</h3><p className="text-xs text-white/40">{cat.desc}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 font-mono">{done}/{cat.items.length}</span>
                    {open ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />}
                  </div>
                </button>
                {open && (
                  <div className="border-t border-white/5">
                    {sorted(cat.items).map(item => {
                      const isDone = item.status === 'done';
                      const isN = item.actionType === 'nexa';
                      return (
                        <div key={item.id} className={`px-4 sm:px-6 py-4 border-b border-white/[0.03] last:border-0 ${isDone ? 'opacity-40' : ''}`}>
                          <div className="flex gap-3">
                            <button onClick={() => !isN && toggle(cat.id, item.id)} className={`mt-1 flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center ${isDone ? 'bg-[#C9A84C] border-[#C9A84C]' : isN && item.status === 'in_progress' ? 'border-blue-400/30 bg-blue-400/10' : 'border-white/15 hover:border-white/30'}`}>
                              {isDone && <Check size={12} className={isN ? 'text-white' : 'text-black'} />}
                              {isN && item.status === 'in_progress' && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[15px] font-semibold ${isDone ? 'line-through text-white/40' : 'text-white'}`}>{item.title}</span>
                                {!isN && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${pBadge[item.priority].cls}`}>{pBadge[item.priority].label}</span>}
                                {!isN && <span className="text-[10px] text-white/40">{dBadge[item.difficulty]}</span>}
                                {isN && item.status === 'in_progress' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">In Progress</span>}
                              </div>
                              <p className="text-[13px] text-white/50 leading-relaxed mt-1">{item.why}</p>
                              {!isDone && !isN && (
                                <div className="mt-3">
                              {item.actionType === 'link' && item.actionHref && (
                                <Link href={item.actionHref} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 border border-[#C9A84C]/30 rounded-lg py-2 px-3.5 transition-all whitespace-nowrap">
                                  {item.actionLabel} <ExternalLink size={10} />
                                </Link>
                              )}
                              {item.actionType === 'upload' && (
                                <button onClick={() => setModal({ title: item.title, description: item.why.slice(0, 60), accept: item.uploadAccept || '', type: item.uploadType || 'image', itemId: item.id })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 border border-[#C9A84C]/30 rounded-lg py-2 px-3.5 transition-all whitespace-nowrap">
                                  <Upload size={10} /> {item.actionLabel}
                                </button>
                              )}
                              {item.actionType === 'text' && textConfigs[item.id] && (
                                <button
                                  onClick={() => setTextModal({ itemId: item.id, ...textConfigs[item.id] })}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 border border-[#C9A84C]/30 rounded-lg py-2 px-3.5 transition-all whitespace-nowrap">{item.actionLabel}</button>
                              )}
                              {item.actionType === 'instructions' && instructionConfigs[item.id] && (
                                <button
                                  onClick={() => setInstructionsModal({ itemId: item.id, ...instructionConfigs[item.id] })}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 border border-[#C9A84C]/30 rounded-lg py-2 px-3.5 transition-all whitespace-nowrap">{item.actionLabel}</button>
                              )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center py-6">
          <p className="text-white/15 text-xs">Questions? Text or call NexaVision Group anytime.</p>
        </div>
      </div>

      {modal && (
        <UploadModal isOpen onClose={() => setModal(null)} title={modal.title} description={modal.description} accept={modal.accept} type={modal.type}
          onUploadComplete={() => { setCats(prev => prev.map(c => ({ ...c, items: c.items.map(i => i.id === modal.itemId ? { ...i, status: 'done' as Status } : i) }))); }}
        />
      )}

      {textModal && (
        <TextInputModal
          isOpen
          onClose={() => setTextModal(null)}
          title={textModal.title}
          description={textModal.description}
          fields={textModal.fields}
          icon={<Lock size={16} className="text-[#C9A84C]" />}
          onSubmit={async (values) => { await saveTextData(textModal.itemId, values); }}
          submitLabel="Send to NexaVision"
        />
      )}

      {instructionsModal && (
        <InstructionsModal
          isOpen
          onClose={() => setInstructionsModal(null)}
          title={instructionsModal.title}
          description={instructionsModal.description}
          steps={instructionsModal.steps}
          onComplete={() => {
            setCats(prev => prev.map(c => ({
              ...c, items: c.items.map(i => i.id === instructionsModal.itemId ? { ...i, status: 'done' as Status } : i)
            })));
          }}
        />
      )}
    </div>
  );
}




