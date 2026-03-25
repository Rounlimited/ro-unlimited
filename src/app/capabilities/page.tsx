'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { CAPABILITY_SECTIONS } from '@/lib/capabilities-data';
import { ArrowRight, Phone, Wrench, Shield, Building2, Truck, Sparkles } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

const SECTION_ICONS = [Wrench, Shield, Building2, Truck] as const;

export default function CapabilitiesPage() {
  return (
    <SubPageAnimator>
      <section className="relative min-h-[72vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-6">
              <Sparkles size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">Commercial construction</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.9] mb-6">
              Capabilities That<br />
              <span className="gradient-text-gold">Win Commercial Work</span>
            </h1>
            <div className="w-24 gold-line mb-6" />
            <p className="text-ro-gray-400 text-lg sm:text-xl leading-relaxed mb-4 max-w-2xl">
              Commercial jobs are won in systems, sequencing, and inspection readiness, but they are remembered by how the finished place feels. If you are vetting restaurant, retail, or build-out partners, this is the scope depth that proves RO can deliver both.
            </p>
            <p className="text-ro-gray-500 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl">
              {COMPANY.experience} years across {COMPANY.serviceAreaShort}. Full-scope capability from site work through turnover, with the judgment to keep commercial work clean, intentional, and client-facing when the finish matters.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors"
              >
                Request a commercial consult <ArrowRight size={14} />
              </Link>
              <Link
                href="/projects"
                className="flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"
              >
                View projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-ro-gray-800 relative">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Deep commercial scope</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Systems we deliver</h2>
            <div className="w-24 gold-line mt-4" />
          </div>

          <div className="space-y-20">
            {CAPABILITY_SECTIONS.map((section, i) => {
              const Icon = SECTION_ICONS[i] ?? Wrench;
              return (
                <article
                  key={section.id}
                  id={section.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start border-b border-ro-gray-800/80 pb-20 last:border-0 last:pb-0"
                >
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 border border-ro-gold/25 flex items-center justify-center text-ro-gold">
                        <Icon size={22} strokeWidth={1.25} />
                      </div>
                      <span className="text-ro-gold/40 font-mono text-xs tracking-widest uppercase">0{i + 1}</span>
                    </div>
                    <h3 className="text-ro-white font-heading text-2xl sm:text-3xl tracking-tight uppercase leading-tight">{section.title}</h3>
                    <p className="text-ro-gray-500 text-sm sm:text-base leading-relaxed mt-4">{section.summary}</p>
                  </div>
                  <div className="lg:col-span-8">
                    <ul className="space-y-4">
                      {section.bullets.map((line) => (
                        <li
                          key={line}
                          className="flex gap-3 text-ro-gray-300 text-sm sm:text-base leading-relaxed border-l-2 border-ro-gold/20 pl-4"
                        >
                          <span className="text-ro-gold/80 mt-1.5 h-1.5 w-1.5 rounded-full bg-ro-gold/60 flex-shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-ro-black via-ro-black to-[#0a0a0a] border-t border-ro-gold/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-ro-white font-heading text-2xl sm:text-3xl tracking-tight uppercase mb-6">Why this page exists</h2>
          <p className="text-ro-gray-400 text-base sm:text-lg leading-relaxed mb-10">
            Most local builders cannot talk about commercial kitchens, life safety, build-out sequencing, and multi-state code pressure at this level. When a brand, developer, or local business owner reads this, they should immediately feel that RO understands both the technical side and the standard the finished space has to meet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/commercial" className="text-ro-gold/80 hover:text-ro-gold text-xs font-mono tracking-wider uppercase">
              Commercial division &rarr;
            </Link>
            <span className="hidden sm:inline text-ro-gray-700">|</span>
            <Link href="/grading" className="text-ro-gold/80 hover:text-ro-gold text-xs font-mono tracking-wider uppercase">
              Site work &amp; grading &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-ro-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-ro-gray-500 text-sm text-center sm:text-left">Serious scope. Clean delivery. Three states.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"
            >
              <Phone size={14} /> {COMPANY.phone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors"
            >
              Start a project <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </SubPageAnimator>
  );
}
