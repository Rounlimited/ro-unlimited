'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COMPANY } from '@/lib/constants';
import { LangSwitch } from '@/components/i18n/PageTranslator';

/**
 * PortalGuide — first-visit tour + always-there Help button for the customer
 * pages (estimate link, project page, /my home).
 *
 * - First time on a device: a small welcome card offers a short tour. The tour
 *   walks only the sections that exist on THIS page (dimmed screen, the section
 *   lit up, a card at the bottom with Back / Next / Skip). Finishing, skipping
 *   or saying "No thanks" marks it seen in localStorage — it never pops again.
 * - A floating "? Help" button opens plain-English answers for the page, with
 *   "Show me around again", "Ask us a question" and the phone number.
 * - Hidden when RO opens a customer page from the admin app (hide prop).
 * Customer-copy rules: no labor/schedule promises; dates are estimates; never
 * "JR". Sized for older eyes: 17px+ text, 48px targets.
 */
export type GuideMode = 'proposal' | 'project' | 'home';

type Step = { target?: string; title: string; body: string };
type Faq = { q: string; a: string };

const STEPS: Record<GuideMode, Step[]> = {
  proposal: [
    { title: 'Welcome — this is your estimate', body: 'Everything about your project is on this one page. Here is a quick look at how it works.' },
    { target: '[data-track="scope"]', title: 'What’s included', body: 'This is the work, broken into parts. Tap any part to see the details.' },
    { target: '#doc-options', title: 'Your choices', body: 'Some estimates have options. Pick the ones you want — the total updates as you go.' },
    { target: '[data-track="total"]', title: 'Your total', body: 'The price for everything you’ve chosen, with any payment schedule shown underneath.' },
    { target: '#questions', title: 'Questions before you decide?', body: 'Ask here. Your question comes straight to us, and the answer shows on this page and in your email.' },
    { target: '#accept-sign', title: 'Ready? Sign here', body: 'Type your name and sign with your finger or mouse. After you sign, this same page becomes your project page with progress, schedule and updates.' },
    { target: '#ro-help-btn', title: 'Help is always here', body: 'Tap Help any time for answers, to see this tour again, or to call us.' },
  ],
  project: [
    { title: 'Welcome to your project page', body: 'This is where you follow your job from start to finish. Here is a quick look around.' },
    { target: '#needs-you', title: 'Needs you', body: 'Anything waiting on you shows up here first — a change to approve, a document we asked for, or a payment. Empty means you’re all caught up.' },
    { target: '#doc-progress', title: 'How far along', body: 'Progress for each part of the job. It updates as work gets done.' },
    { target: '#schedule', title: 'Coming up', body: 'What’s planned for the next two weeks. Dates are estimates — weather, inspections and materials can move them, and we’ll note why.' },
    { target: '#inspections', title: 'Permits & inspections', body: 'Each permit and county inspection, and how it went.' },
    { target: '#story', title: 'Updates & photos', body: 'Notes and photos from the job, newest first. Tap a photo to see it bigger.' },
    { target: '#requests', title: 'Things we asked for', body: 'If we need something from you — a document, a photo, a choice — it’s here. You can upload straight from your phone.' },
    { target: '#questions', title: 'Ask us anything', body: 'Your question comes straight to us. The answer shows here and in your email.' },
    { target: '#assistant', title: 'Project assistant', body: 'Quick answers from your project’s own records. If it isn’t sure, it passes your question to us.' },
    { target: '#share', title: 'Share it with your people', body: 'Add your spouse, architect or lender. Each person gets their own link to view the project. Approving and signing stay with you.' },
    { target: '#binder', title: 'Your project binder', body: 'Contract, invoices, permits, warranty and care reminders — kept together for when you need them.' },
    { target: '#ro-help-btn', title: 'Help is always here', body: 'Tap Help any time for answers, to see this tour again, or to call us.' },
  ],
  home: [
    { title: 'Welcome to your RO account', body: 'All of your projects with us, in one place. Here is a quick look around.' },
    { target: '[data-guide="home-needs"]', title: 'Needs you', body: 'Anything waiting on you, across all your projects. Tap one to go straight to it.' },
    { target: '[data-guide="home-projects"]', title: 'Your projects', body: 'Tap a project to open its page — progress, schedule, updates, documents and questions.' },
    { target: '[data-guide="account"]', title: 'Your account', body: 'Set a password so you can sign in without an email link, and choose how often we email you.' },
    { target: '#ro-help-btn', title: 'Help is always here', body: 'Tap Help any time for answers, to see this tour again, or to call us.' },
  ],
};

const FAQ: Record<GuideMode, Faq[]> = {
  proposal: [
    { q: 'How do I accept this estimate?', a: 'Look over the work and the total, pick any options, then scroll to the bottom. Type your name, sign with your finger or mouse, and tap Accept & Sign. We’re notified right away.' },
    { q: 'What are the options?', a: 'Some estimates include choices — materials, add-ons, or alternates. Pick the ones you want and the total updates on the spot.' },
    { q: 'Can I ask a question before I sign?', a: 'Yes. Use the Questions section on this page, or call us. The answer shows up on this page and in your email.' },
    { q: 'What happens after I sign?', a: 'This same link becomes your project page: progress, what’s coming up, updates with photos, and anything we need from you.' },
    { q: 'Can I save or print it?', a: 'Use the PDF button at the top of the page to download a copy.' },
    { q: 'Who can see this page?', a: 'Only people who have your link or your sign-in. Don’t post the link publicly.' },
  ],
  project: [
    { q: 'What needs my attention?', a: 'The Needs You box near the top lists anything waiting on you — a change order to approve, a document we asked for, or a balance due. When it’s empty, you’re all caught up.' },
    { q: 'How do I approve a change?', a: 'Tap it in Needs You. You’ll see what changed, the price and any days added. Approve or decline right there, and we’re notified right away.' },
    { q: 'How do I send you a document or photo?', a: 'In Requests, tap the item we asked for and upload a photo or PDF from your phone or computer.' },
    { q: 'When is work happening?', a: 'Coming Up shows the next two weeks. Dates are estimates — weather, inspections and materials can move them. When a date moves, we note why.' },
    { q: 'How do I ask a question?', a: 'Use Questions near the bottom of the page. It comes straight to us, and the answer shows here and in your email.' },
    { q: 'What is the project assistant?', a: 'It answers from your project’s records — schedule, updates and documents. If it isn’t sure, it hands your question to us.' },
    { q: 'Where are my contract, invoices and warranty?', a: 'They stay with your project. When the job is finished, everything is gathered in your Project Binder on this page.' },
    { q: 'How do I see this on another device?', a: 'Sign in at rounlimited.com/my with your email. Set a password under Account so you don’t need an email link each time.' },
    { q: 'Can I get fewer emails?', a: 'Yes. Sign in at rounlimited.com/my and choose under Account: every update, a weekly summary, or only when something needs you.' },
    { q: 'Can I share this page with someone?', a: 'If you see “People on this project” on your page, tap Share this project — each person gets their own link and can view everything. Approving changes and signing stay with you. Don’t see it? Call us and we’ll add them for you.' },
  ],
  home: [
    { q: 'What is this page?', a: 'Your RO account. Every project you have with us is listed here, with anything that needs you at the top.' },
    { q: 'How do I open a project?', a: 'Tap the project. Its page has progress, what’s coming up, updates with photos, documents and questions.' },
    { q: 'How do I set a password?', a: 'Tap Account, then set a password. After that you can sign in with your email and password — no email link needed.' },
    { q: 'Can I get fewer emails?', a: 'Tap Account and choose: every update, a weekly summary, or only when something needs you.' },
    { q: 'I don’t see my project.', a: 'Projects show up under the email we have on file for you. If one is missing, call us and we’ll link it.' },
  ],
};

const SEEN_KEY = (m: GuideMode) => `ro-guide-${m}-v1`;
const seen = (m: GuideMode) => { try { return !!localStorage.getItem(SEEN_KEY(m)); } catch { return true; } };
const markSeen = (m: GuideMode) => { try { localStorage.setItem(SEEN_KEY(m), new Date().toISOString()); } catch {} };
const pick = (sel?: string): HTMLElement | null => {
  if (!sel) return null;
  const all = Array.prototype.slice.call(document.querySelectorAll(sel)) as HTMLElement[];
  for (const el of all) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return el; }
  return null;
};
const visible = (sel?: string) => !sel || !!pick(sel);

// FORCE_TOUR: ?tour=1 on any customer link replays the tour every time (for demos / showing the team),
// even on a device that has seen it and even when opened from the admin app.
const forced = () => { try { return new URLSearchParams(window.location.search).get('tour') === '1'; } catch { return false; } };

export default function PortalGuide({ mode, hide: hideProp = false }: { mode: GuideMode; hide?: boolean }) {
  const [force, setForce] = useState(false);
  useEffect(() => { setForce(forced()); }, []);
  const hide = hideProp && !force;
  const [phase, setPhase] = useState<'off' | 'welcome' | 'tour'>('off');
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [dock, setDock] = useState(16);
  const raf = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Keep the Help button above whatever bottom bar is showing (sticky total, portal tab bar).
  useEffect(() => {
    if (hide) return;
    const measure = () => {
      let h = 0;
      document.querySelectorAll('[data-bottom-dock]').forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.height > 0 && r.top < window.innerHeight) h = Math.max(h, window.innerHeight - r.top);
      });
      setDock(Math.round(h) + 14);
    };
    measure();
    const t = window.setInterval(measure, 700);
    window.addEventListener('resize', measure);
    return () => { window.clearInterval(t); window.removeEventListener('resize', measure); };
  }, [hide]);

  // First visit: offer the tour once the page has settled.
  useEffect(() => {
    if (hide || (seen(mode) && !force)) return;
    const t = window.setTimeout(() => setPhase('welcome'), 1400);
    return () => window.clearTimeout(t);
  }, [hide, mode, force]);

  const start = useCallback(() => {
    const list = STEPS[mode].filter((s, n) => n === 0 || visible(s.target));
    setSteps(list.slice(1)); setI(0); setPhase('tour'); setHelpOpen(false);
  }, [mode]);
  const finish = useCallback(() => { markSeen(mode); setPhase('off'); setRect(null); }, [mode]);

  // Follow the current step's section: scroll to it and track its box.
  useEffect(() => {
    if (phase !== 'tour') return;
    const step = steps[i]; if (!step) { finish(); return; }
    const el = pick(step.target);
    if (!el) { setRect(null); return; }
    const r0 = el.getBoundingClientRect();
    const target = window.scrollY + r0.top - Math.max(72, (window.innerHeight - 260 - Math.min(r0.height, window.innerHeight - 330)) / 2);
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    const track = () => {
      const r = el.getBoundingClientRect(); const pad = 8;
      setRect({ top: r.top - pad, left: Math.max(4, r.left - pad), width: Math.min(window.innerWidth - 8, r.width + pad * 2), height: r.height + pad * 2 });
      raf.current = window.requestAnimationFrame(track);
    };
    track();
    return () => { if (raf.current) window.cancelAnimationFrame(raf.current); };
  }, [phase, i, steps, finish]);

  // Escape closes whatever is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (phase !== 'off') finish(); setHelpOpen(false); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [phase, finish]);

  if (hide || !mounted) return null;
  const step = steps[i];
  const askQuestion = () => { setHelpOpen(false); const el = document.getElementById('questions'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const tel = 'tel:' + COMPANY.phone.replace(/[^0-9]/g, '');
  const hasQuestions = typeof document !== 'undefined' && !!document.getElementById('questions');
  const gold = '#C9A84C';

  // Rendered straight into <body>: an animated (transformed) ancestor would
  // otherwise turn position:fixed into position-relative-to-that-ancestor.
  return createPortal(
    <>
      {/* Floating help button */}
      <button id="ro-help-btn" type="button" onClick={() => { setHelpOpen(true); setOpenQ(null); }} aria-label="Help"
        className="fixed z-[45] inline-flex items-center gap-2 min-h-[52px] pl-3 pr-4 rounded-full text-[17px] font-bold shadow-lg active:scale-95 transition-transform"
        style={{ right: 'max(14px, env(safe-area-inset-right, 0px))', bottom: `calc(${dock}px + env(safe-area-inset-bottom, 0px))`, background: '#1a1a1a', color: '#fff', border: '2px solid ' + gold, transition: 'bottom 0.3s ease' }}>
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[18px] font-black" style={{ background: gold, color: '#1a1a1a' }}>?</span>
        Help
      </button>

      {/* Welcome card */}
      {phase === 'welcome' && (
        <div className="fixed z-[96] flex items-end sm:items-center justify-center p-3" style={{ top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)' }} onClick={finish}>
          <div role="dialog" aria-modal="true" aria-labelledby="ro-guide-welcome" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>First time here?</p>
            <h2 id="ro-guide-welcome" className="text-[22px] font-bold text-[#1a1a1a] mt-1 leading-tight">{STEPS[mode][0].title}</h2>
            <p className="text-[17px] text-[#3a3a3a] mt-2 leading-snug">{STEPS[mode][0].body}</p>
            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={start} className="min-h-[52px] px-6 rounded-xl text-[17px] font-bold text-black" style={{ background: gold }}>Show me around</button>
              <button type="button" onClick={finish} className="min-h-[52px] px-6 rounded-xl text-[17px] font-bold text-[#3a3a3a] bg-[#f1efe8]">No thanks</button>
            </div>
            <p className="text-[15px] text-[#6b7280] mt-3">You can always tap <strong>Help</strong> at the bottom of the screen.</p>
          </div>
        </div>
      )}

      {/* Tour */}
      {phase === 'tour' && step && (
        <div className="fixed z-[96]" style={{ top: 0, left: 0, right: 0, bottom: 0 }} aria-live="polite">
          {rect ? (
            <div className="absolute rounded-2xl pointer-events-none" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.58)', border: '3px solid ' + gold, transition: 'all 0.25s ease' }} />
          ) : (
            <div className="absolute" style={{ top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.58)' }} />
          )}
          <div className="absolute p-3 flex justify-center" style={{ left: 0, right: 0, bottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-bold" style={{ color: '#8a6d20' }}>Step {i + 1} of {steps.length}</p>
                <button type="button" onClick={finish} className="min-h-[44px] px-2 text-[16px] font-bold text-[#6b7280]">Skip tour</button>
              </div>
              <h3 className="text-[20px] font-bold text-[#1a1a1a] leading-tight">{step.title}</h3>
              <p className="text-[17px] text-[#3a3a3a] mt-1.5 leading-snug">{step.body}</p>
              <div className="mt-4 flex gap-2">
                {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="min-h-[52px] px-5 rounded-xl text-[17px] font-bold text-[#3a3a3a] bg-[#f1efe8]">Back</button>}
                <button type="button" onClick={() => (i + 1 < steps.length ? setI(i + 1) : finish())} className="flex-1 min-h-[52px] px-5 rounded-xl text-[17px] font-bold text-black" style={{ background: gold }}>{i + 1 < steps.length ? 'Next' : 'Got it'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help sheet */}
      {helpOpen && (
        <div className="fixed z-[96] flex items-end sm:items-center justify-center" style={{ top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setHelpOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ro-help-title" className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '88vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 border-b" style={{ borderColor: '#efece4' }}>
              <div className="min-w-0"><h2 id="ro-help-title" className="text-[22px] font-bold text-[#1a1a1a]">How can we help?</h2><LangSwitch className="mt-2" /></div>
              <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close help" className="min-w-[48px] min-h-[48px] rounded-full text-[26px] leading-none text-[#4b5563] bg-[#f1efe8]">×</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-2">
              {FAQ[mode].map((f, n) => (
                <div key={n} className="rounded-xl border" style={{ borderColor: openQ === n ? '#e3cf96' : '#ebe7dc', background: openQ === n ? '#fdf8ea' : '#fff' }}>
                  <button type="button" onClick={() => setOpenQ(openQ === n ? null : n)} aria-expanded={openQ === n} className="w-full min-h-[56px] px-4 py-3 text-left flex items-center justify-between gap-3">
                    <span className="text-[17px] font-bold text-[#1a1a1a] leading-snug">{f.q}</span>
                    <span className="text-[22px] font-bold flex-shrink-0" style={{ color: '#8a6d20' }}>{openQ === n ? '−' : '+'}</span>
                  </button>
                  {openQ === n && <p className="px-4 pb-4 -mt-1 text-[17px] text-[#3a3a3a] leading-relaxed">{f.a}</p>}
                </div>
              ))}
            </div>
            <div className="px-5 pt-3 pb-5 border-t space-y-2" style={{ borderColor: '#efece4' }}>
              <button type="button" onClick={start} className="w-full min-h-[52px] rounded-xl text-[17px] font-bold text-black" style={{ background: gold }}>Show me around this page</button>
              <div className="grid grid-cols-2 gap-2">
                {hasQuestions ? (
                  <button type="button" onClick={askQuestion} className="min-h-[52px] rounded-xl text-[16px] font-bold text-[#1a1a1a] bg-[#f1efe8]">Ask us a question</button>
                ) : (
                  <a href="/my" className="min-h-[52px] rounded-xl text-[16px] font-bold text-[#1a1a1a] bg-[#f1efe8] inline-flex items-center justify-center">My projects</a>
                )}
                <a href={tel} className="min-h-[52px] rounded-xl text-[16px] font-bold text-white inline-flex items-center justify-center" style={{ background: '#187a4b' }}>Call {COMPANY.phone}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
