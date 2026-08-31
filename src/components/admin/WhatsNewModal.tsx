'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ArrowRight, ArrowLeft, Sparkles, Check, Play,
  Percent, ClipboardList, FileText, HardHat, CalendarClock, Layers, PenTool, Eye,
} from 'lucide-react';

/**
 * What's New — the release walkthrough.
 *
 * A page per feature: what it is, why it exists, and a button that either
 * takes you straight there or runs the pointing tour for it. Sits in the Help
 * Center and offers itself once after the update.
 */

export const RELEASE_KEY = 'ro-whatsnew-2026-08';

interface Feature {
  icon: any;
  color: string;
  tag: string;
  title: string;
  body: string;
  points: string[];
  tourId?: string;
  route?: string;
  cta?: string;
}

const FEATURES: Feature[] = [
  {
    icon: Percent, color: '#D4B965', tag: 'On every contract',
    title: 'Percent Complete',
    body: "Open any job and tap the Progress tab. Your phases are already there, pulled from the line items you priced. Tap each one along as you go — 0, 25, 50, 75, 100.",
    points: [
      'Weighted by the dollar value of each phase, so the number holds up if an owner or bank asks',
      'Lump sum job? Add your own phases by hand and give the big ones a bigger share',
      'No more working it out on paper for every project',
    ],
    tourId: 'tour-progress', cta: 'Show me the Progress tab',
  },
  {
    icon: ClipboardList, color: '#5ba3dc', tag: 'Reports tab',
    title: 'The Job Log',
    body: "Six buttons for what actually happened. Rain Day is one tap — no typing at all. Work Done, Problem, Milestone, Inspection and Note take a line of text.",
    points: [
      'Log a day you missed by changing the date',
      'Switch any entry OFF to keep it out of the customer’s copy',
      'This is what the weekly report gets written from',
    ],
    tourId: 'tour-log-reports', cta: 'Show me the log buttons',
  },
  {
    icon: FileText, color: '#35d07f', tag: 'One button',
    title: 'Reports That Write Themselves',
    body: "Press Draft the Next Report and your week comes back already written — day by day, rain days counted, which phases finished, and the percent complete.",
    points: [
      'Change any word before it goes out',
      'Copy Link to text it, or Email It',
      'Nothing reaches a customer until you press send',
    ],
    tourId: 'tour-log-reports', cta: 'Show me the report button',
  },
  {
    icon: CalendarClock, color: '#a78bfa', tag: 'Terms step',
    title: 'Reporting Written Into the Contract',
    body: "When you build an estimate, pick how often the customer hears from you — daily, weekly, every two weeks, monthly, or at each phase. The paragraph writes itself into the contract and the PDF.",
    points: [
      'You never type that promise in again',
      'On your schedule, the app drafts the report and tells you it’s waiting',
      'It still never sends without you',
    ],
    tourId: 'tour-reporting-clause', cta: 'How it works',
  },
  {
    icon: HardHat, color: '#f0a04b', tag: 'Estimates screen',
    title: 'Track a Job You Bid on Paper',
    body: "Work that never went through the estimator still gets everything. Name the job and the customer, list your phases, pick how often to report.",
    points: [
      'Same progress tracking, same customer reports',
      'Lump sum is fine — no line items required',
      'Old contracts and handshake jobs both work',
    ],
    tourId: 'tour-whats-new', cta: 'Show me the button',
  },
  {
    icon: Eye, color: '#C9A84C', tag: 'Customer side',
    title: 'They Can See Their Own Progress',
    body: "The contract link they signed now shows how far along their job is — the overall percentage and a bar for every phase, updating as you tap.",
    points: [
      'Nothing new to send; the link they already have keeps working',
      'Your schedule and budget buttons stay private to you',
      'Fewer “how’s it coming?” calls',
    ],
    route: '/admin/estimates', cta: 'Open Estimates',
  },
  {
    icon: PenTool, color: '#e8734a', tag: 'New in the menu',
    title: 'Letters on Company Letterhead',
    body: "Tell it what you need in plain words — \"letter to the county asking them to release the trench\" — and it writes it. Prints with your logo, contact details and all seven licenses.",
    points: [
      'Notices of delay, change order requests, warranties, completion letters',
      'It never invents a date or an amount — it leaves [BRACKETS] to fill in',
      'Edit every word, then download the PDF',
    ],
    tourId: 'tour-letters', route: '/admin/letters', cta: 'Try it',
  },
  {
    icon: Layers, color: '#7dd3fc', tag: 'Options tab',
    title: 'Ready-Made Options & Photos',
    body: "Building customer choices got faster — hundreds of ready groups across every division we do, already priced, most with a photo attached.",
    points: [
      'Roof colors, driveway finishes, septic tank sizes, fence styles',
      'Pick a photo from the library or upload your own',
      'Their picks update the total live on their link',
    ],
    tourId: 'tour-options', cta: 'Show me',
  },
];

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [entered, setEntered] = useState(false);
  const router = useRouter();

  // Let the panel spring in before the first page animates.
  useEffect(() => { const t = setTimeout(() => setEntered(true), 30); return () => clearTimeout(t); }, []);

  const go = (n: number) => { setDir(n > i ? 1 : -1); setI(n); };
  const intro = i === 0;
  const feature = intro ? null : FEATURES[i - 1];
  const total = FEATURES.length + 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') { setDir(1); setI((n) => Math.min(total - 1, n + 1)); }
      if (e.key === 'ArrowLeft') { setDir(-1); setI((n) => Math.max(0, n - 1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, total]);

  const done = () => {
    try { localStorage.setItem(RELEASE_KEY, '1'); } catch { /* private mode */ }
    onClose();
  };

  const act = () => {
    if (!feature) return;
    done();
    if (feature.tourId) {
      if (feature.route) router.push(feature.route);
      setTimeout(() => window.dispatchEvent(new CustomEvent('start-tour', { detail: feature.tourId })), 500);
    } else if (feature.route) {
      router.push(feature.route);
    }
  };

  const Icon = feature?.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center sm:justify-center">
      <style>{`
        /* Panel arrival */
        @keyframes wn-rise { from { opacity: 0; transform: translateY(34px) scale(0.97); } to { opacity: 1; transform: none; } }
        .wn-panel { animation: wn-rise 0.46s cubic-bezier(0.22,1,0.36,1) both; }

        /* Page turn, direction aware */
        @keyframes wn-next { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: none; } }
        @keyframes wn-prev { from { opacity: 0; transform: translateX(-26px); } to { opacity: 1; transform: none; } }
        .wn-page-next { animation: wn-next 0.36s cubic-bezier(0.22,1,0.36,1) both; }
        .wn-page-prev { animation: wn-prev 0.36s cubic-bezier(0.22,1,0.36,1) both; }

        /* Slow aurora behind the header band */
        @keyframes wn-aurora { 0% { transform: translate3d(-12%,0,0) scale(1.1); } 50% { transform: translate3d(12%,4%,0) scale(1.25); } 100% { transform: translate3d(-12%,0,0) scale(1.1); } }
        .wn-aurora { position: absolute; inset: -40%; pointer-events: none; opacity: 0.55;
          background: radial-gradient(38% 55% at 30% 40%, rgba(201,168,76,0.42), transparent 70%),
                      radial-gradient(34% 50% at 72% 60%, rgba(212,119,44,0.34), transparent 72%);
          filter: blur(6px); animation: wn-aurora 13s ease-in-out infinite; }

        /* One-pass shine */
        @keyframes wn-shine { from { background-position: 200% 0; } to { background-position: -60% 0; } }
        .wn-shine { position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
          background: linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.3) 50%, transparent 58%);
          background-size: 260% 100%; animation: wn-shine 1.15s cubic-bezier(0.22,1,0.36,1) both; }

        /* Icon springs in with a soft halo */
        @keyframes wn-pop { 0% { opacity: 0; transform: scale(0.6) rotate(-8deg); } 62% { transform: scale(1.09) rotate(2deg); } 100% { opacity: 1; transform: none; } }
        .wn-pop { animation: wn-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes wn-halo { 0%,100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.16); } }
        .wn-halo { position: absolute; inset: -6px; border-radius: 20px; animation: wn-halo 3.4s ease-in-out infinite; }

        /* Text and bullets cascade */
        @keyframes wn-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .wn-stagger > * { animation: wn-up 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        .wn-stagger > *:nth-child(1) { animation-delay: 0.05s; }
        .wn-stagger > *:nth-child(2) { animation-delay: 0.12s; }
        .wn-stagger > *:nth-child(3) { animation-delay: 0.19s; }
        .wn-stagger > *:nth-child(4) { animation-delay: 0.26s; }
        .wn-stagger > *:nth-child(5) { animation-delay: 0.33s; }

        /* Tiles on the intro page pour in */
        .wn-tiles > * { animation: wn-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .wn-tiles > *:nth-child(1){animation-delay:.06s}.wn-tiles > *:nth-child(2){animation-delay:.12s}
        .wn-tiles > *:nth-child(3){animation-delay:.18s}.wn-tiles > *:nth-child(4){animation-delay:.24s}
        .wn-tiles > *:nth-child(5){animation-delay:.30s}.wn-tiles > *:nth-child(6){animation-delay:.36s}
        .wn-tiles > *:nth-child(7){animation-delay:.42s}.wn-tiles > *:nth-child(8){animation-delay:.48s}

        /* Progress through the walkthrough */
        .wn-bar { transition: width 0.45s cubic-bezier(0.22,1,0.36,1); }

        @media (prefers-reduced-motion: reduce) {
          .wn-panel, .wn-page-next, .wn-page-prev, .wn-shine, .wn-pop,
          .wn-halo, .wn-aurora, .wn-stagger > *, .wn-tiles > * { animation: none !important; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={done} />

      <div className={'relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t sm:border ' + (entered ? 'wn-panel' : 'opacity-0')}
        style={{
          background: '#121212', borderColor: 'rgba(201,168,76,0.35)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>

        {/* Header band */}
        <div className="relative px-5 pt-5 pb-4 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(212,119,44,0.10))' }}>
          <div className="wn-aurora" />
          <div className="wn-shine" />
          <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} style={{ color: '#D4B965' }} />
              <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#D4B965' }}>
                What&rsquo;s New {intro ? '' : `· ${i} of ${FEATURES.length}`}
              </p>
            </div>
            <button onClick={done} className="w-10 h-10 -mt-1.5 -mr-1.5 rounded-xl bg-black/25 flex items-center justify-center shrink-0">
              <X size={18} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* How far through the walkthrough */}
        <div className="h-1 bg-white/5">
          <div className="h-full wn-bar"
            style={{ width: ((i + 1) / total) * 100 + '%', background: 'linear-gradient(90deg, #a8893d, #D4B965)' }} />
        </div>

        <div className={'p-5 ' + (dir >= 0 ? 'wn-page-next' : 'wn-page-prev')} key={i}>
          {intro ? (
            <div className="wn-stagger">
              <h2 className="text-[26px] font-bold leading-tight mb-2">Your jobs now run themselves</h2>
              <p className="text-[17px] text-white/65 leading-relaxed mb-5">
                Eight things were added this week — all of them aimed at the paperwork you were
                doing by hand. Percent complete, a job log, reports that write themselves, and
                letters on your letterhead.
              </p>
              <div className="grid grid-cols-4 gap-2 mb-5 wn-tiles">
                {FEATURES.slice(0, 8).map((f, n) => {
                  const FI = f.icon;
                  return (
                    <div key={n} className="aspect-square rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <FI size={20} style={{ color: f.color }} />
                    </div>
                  );
                })}
              </div>
              <p className="text-[15px] text-white/40">
                Takes about a minute. Each one has a &ldquo;show me&rdquo; button that points at it on the real screen.
              </p>
            </div>
          ) : feature ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 shrink-0 wn-pop">
                  <div className="wn-halo" style={{ background: feature.color + '22' }} />
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: feature.color + '1f', border: '1px solid ' + feature.color + '55' }}>
                    <Icon size={26} style={{ color: feature.color }} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: feature.color }}>
                    {feature.tag}
                  </p>
                  <h2 className="text-[23px] font-bold leading-tight">{feature.title}</h2>
                </div>
              </div>

              <p className="text-[17px] text-white/70 leading-relaxed mb-4">{feature.body}</p>

              <div className="space-y-2.5 mb-5 wn-stagger">
                {feature.points.map((p, n) => (
                  <div key={n} className="flex items-start gap-2.5">
                    <Check size={17} style={{ color: feature.color }} className="shrink-0 mt-0.5" />
                    <p className="text-[16px] text-white/60 leading-snug">{p}</p>
                  </div>
                ))}
              </div>

              {(feature.tourId || feature.route) && (
                <button onClick={act}
                  className="relative overflow-hidden w-full min-h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] mb-3"
                  style={{ background: feature.color + '1f', color: feature.color, border: '1px solid ' + feature.color + '66' }}>
                  <span className="wn-shine" />
                  <Play size={16} /> {feature.cta || 'Show me'}
                </button>
              )}
            </>
          ) : null}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={() => go(i - 1)}
                className="min-h-[52px] px-4 rounded-xl text-[16px] font-bold flex items-center gap-2 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <ArrowLeft size={17} /> Back
              </button>
            )}
            <button onClick={() => (i >= total - 1 ? done() : go(i + 1))}
              className="flex-1 min-h-[52px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99]"
              style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)' }}>
              {i >= total - 1 ? <>Got it <Check size={18} /></> : <>{intro ? 'Start' : 'Next'} <ArrowRight size={18} /></>}
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
            {Array.from({ length: total }).map((_, n) => (
              <button key={n} onClick={() => go(n)} aria-label={`Page ${n + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{ width: n === i ? 22 : 6, background: n === i ? '#C9A84C' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Has this release's walkthrough been seen? */
export function whatsNewSeen(): boolean {
  try { return localStorage.getItem(RELEASE_KEY) === '1'; } catch { return true; }
}
