'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, HardHat, FileText, MapPin, CalendarDays, ClipboardCheck, ShieldCheck, MessageSquare } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

const PHASES = [
  {
    phase: '01', title: 'First Call & Site Visit',
    description: 'It starts with a call or a message through the contact page. We ask what you want to build, where, and when, then look at the property and whatever drawings exist.',
    points: ['Send plans, a survey or just the address', 'We walk the site with you', 'You hear plainly what the job will take'],
  },
  {
    phase: '02', title: 'Scope & Written Estimate',
    description: 'We put the scope in writing: what is included, what is not, and what it costs. If the design is not finished, we tell you which numbers are firm and which depend on drawings still to come.',
    points: ['Scope written out by trade', 'Allowances and exclusions called out', 'Questions answered before you sign'],
  },
  {
    phase: '03', title: 'Contract, Permits & Planning',
    description: 'Once you approve the estimate, the contract is signed and the permits are applied for under our own license numbers. Long-lead materials are ordered and the work is sequenced.',
    points: ['Building, land disturbance and utility permits', 'Utility locates called in', 'Materials ordered and trades lined up'],
  },
  {
    phase: '04', title: 'Site Work & Utilities',
    description: 'Erosion controls go in, the land is cleared and graded, the pad is built, and storm drainage, water and sewer are installed while the site is open.',
    points: ['Clearing, grading and building pad', 'Storm, water and sewer in the ground', 'Inspections passed before backfill'],
  },
  {
    phase: '05', title: 'Foundation & Structure',
    description: 'Footings and slab are poured, then the structure goes up: framing, steel or a mix of both, built to the approved drawings.',
    points: ['Footing and slab inspections', 'Framing or steel erection', 'Structural inspection before cover-up'],
  },
  {
    phase: '06', title: 'Dry-In & Building Systems',
    description: 'Roofing and exterior skin close the building in. Plumbing, electrical and HVAC rough-ins follow under our mechanical contractor license, each inspected before the walls are closed.',
    points: ['Roof and exterior envelope', 'Plumbing, electrical and HVAC rough-in', 'Rough-in inspections'],
  },
  {
    phase: '07', title: 'Interior & Finishes',
    description: 'Insulation, drywall, flooring, trim, fixtures and paint. Outside, the drives, parking and final grading are finished and the site is stabilized.',
    points: ['Interior build-out and finishes', 'Paving, concrete flatwork and final grade', 'Trim-out of every building system'],
  },
  {
    phase: '08', title: 'Final Inspection & Walkthrough',
    description: 'The building official does the final inspection. Then we walk the project with you, write the punch list, finish it, and hand over the building.',
    points: ['Final inspections and certificate of occupancy', 'Punch list written with you and completed', 'Keys, warranties and closeout documents'],
  },
];

const NEED_FROM_YOU = [
  { icon: MapPin, title: 'The Property', text: 'The address or parcel, and a survey if you have one.' },
  { icon: FileText, title: 'The Plans', text: 'Architectural or civil drawings at whatever stage they are in. No plans yet is fine too.' },
  { icon: CalendarDays, title: 'The Timeline', text: 'When you want to break ground and any date the building has to be open by.' },
];

const PROMISES = [
  { icon: ShieldCheck, title: 'One License Holder', text: 'Site, utilities, building and mechanical work are permitted under RO Unlimited’s own state license classifications, in South Carolina and Georgia.' },
  { icon: ClipboardCheck, title: 'Inspected at Every Stage', text: 'Work is inspected by the local building department before it is covered, and nothing gets buried or closed in until it has passed.' },
  { icon: MessageSquare, title: 'You Know Where It Stands', text: 'You get straight updates as the job moves, and changes to scope or price are put in writing before the work is done.' },
];

export default function ProcessPage() {
  return (
    <SubPageAnimator>
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-6">
              <HardHat size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">The Build Process</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.9] mb-6">
              How We<br /><span className="gradient-text-gold">Build It</span>
            </h1>
            <div className="w-24 gold-line mb-6" />
            <p className="text-ro-gray-300 text-lg sm:text-xl leading-relaxed max-w-xl">This isn&apos;t just a process — it&apos;s a promise. Every phase completed with honor, integrity, and pride. From raw land to finished product.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 relative">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 sm:mb-14">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Step by Step</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase leading-[0.95] mb-4">Our Construction Process, From First Call to Final Inspection</h2>
            <div className="w-24 gold-line mb-5" />
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed">Every project is different, but the order of the work is not. This is how a ground-up build runs with RO Unlimited in Upstate South Carolina and Northeast Georgia. Smaller jobs skip the steps they do not need.</p>
          </div>
          <div className="space-y-0">
            {PHASES.map((phase, i) => (
              <div key={phase.phase} className="relative flex gap-5 sm:gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-2 border-ro-gold/30 flex items-center justify-center bg-ro-black flex-shrink-0 z-10">
                    <span className="text-ro-gold font-mono text-sm font-bold">{phase.phase}</span>
                  </div>
                  {i < PHASES.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-ro-gold/30 to-ro-gold/5 min-h-[60px]" />}
                </div>
                <div className="pb-12 pt-1">
                  <h3 className="text-ro-white font-heading text-xl sm:text-2xl tracking-wider uppercase mb-2">{phase.title}</h3>
                  <p className="text-ro-gray-300 text-base leading-relaxed mb-3">{phase.description}</p>
                  <ul className="space-y-1.5">
                    {phase.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-ro-gray-400 text-[15px] leading-snug"><span className="mt-2 w-1.5 h-1.5 bg-ro-gold/70 shrink-0" /> {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 relative border-t border-ro-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Getting Started</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">What We Need From You to Start</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {NEED_FROM_YOU.map(({ icon: Ic, title, text }) => (
              <div key={title} className="p-6 border border-ro-gray-800 bg-ro-black/50">
                <div className="w-11 h-11 flex items-center justify-center border border-ro-gold/30 bg-ro-gold/5 mb-4"><Ic size={20} className="text-ro-gold" /></div>
                <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-2">{title}</h3>
                <p className="text-ro-gray-300 text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 relative border-t border-ro-gray-800">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">On Every Job</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Permits, Inspections and Accountability</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROMISES.map(({ icon: Ic, title, text }) => (
              <div key={title} className="p-6 border border-ro-gray-800 bg-ro-black/50">
                <div className="w-11 h-11 flex items-center justify-center border border-ro-gold/30 bg-ro-gold/5 mb-4"><Ic size={20} className="text-ro-gold" /></div>
                <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-2">{title}</h3>
                <p className="text-ro-gray-300 text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-ro-gray-400 text-base mt-8">See every classification and license number on the <Link href="/licenses" className="text-ro-gold underline underline-offset-4">licenses page</Link>.</p>
        </div>
      </section>

      <section className="py-16 border-t border-ro-gray-800 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-ro-white font-heading text-3xl uppercase mb-4">Ready to Start <span className="gradient-text-gold">Your Build?</span></h2>
          <p className="text-ro-gray-300 text-base sm:text-lg mb-6 max-w-xl mx-auto">Step one is a conversation. Call {COMPANY.phone}, {COMPANY.hours}, or send the project through the contact page.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">Get a Quote <ArrowRight size={14} /></Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"><Phone size={14} /> {COMPANY.phone}</a>
          </div>
        </div>
      </section>
    </SubPageAnimator>
  );
}
