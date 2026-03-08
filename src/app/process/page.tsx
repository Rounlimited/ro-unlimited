'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, HardHat } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

const PHASES = [
  { phase: '01', title: 'Consultation & Design', description: 'We start with your vision. Site evaluation, architectural planning, 3D modeling, and project scoping.' },
  { phase: '02', title: 'Site Preparation', description: 'Land grading, excavation, foundation work, and all site prep handled by our own crews.' },
  { phase: '03', title: 'Structural Build', description: 'Framing, steel, structural shells - the backbone of every project built to code and beyond.' },
  { phase: '04', title: 'Systems & Enclosure', description: 'Roofing, exterior finishes, mechanical systems, electrical, and plumbing integration.' },
  { phase: '05', title: 'Interior & Finishes', description: 'From luxury interior buildouts to modern industrial design details - we finish what we start.' },
  { phase: '06', title: 'Final Walkthrough', description: 'Quality assurance, punch list completion, and project handoff. Your project, delivered.' },
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
            <p className="text-ro-gray-400 text-lg sm:text-xl leading-relaxed max-w-xl">From raw land to finished product - see every phase of how RO Unlimited delivers projects on time and built to last.</p>
          </div>
        </div>
      </section>
      <section className="py-24 relative">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-0">
            {PHASES.map((phase, i) => (
              <div key={phase.phase} className="relative flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-2 border-ro-gold/30 flex items-center justify-center bg-ro-black flex-shrink-0 z-10">
                    <span className="text-ro-gold font-mono text-sm font-bold">{phase.phase}</span>
                  </div>
                  {i < PHASES.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-ro-gold/30 to-ro-gold/5 min-h-[60px]" />}
                </div>
                <div className="pb-12 pt-1">
                  <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-2">{phase.title}</h3>
                  <p className="text-ro-gray-500 text-sm leading-relaxed">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 border-t border-ro-gray-800 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-ro-white font-heading text-3xl uppercase mb-6">Ready to Start <span className="gradient-text-gold">Your Build?</span></h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">Get a Quote <ArrowRight size={14} /></Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"><Phone size={14} /> {COMPANY.phone}</a>
          </div>
        </div>
      </section>
    </SubPageAnimator>
  );
}



