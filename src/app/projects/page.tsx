'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Images, Phone } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

export default function ProjectsPage() {
  return (
    <SubPageAnimator>
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-ro-gold/25 text-ro-gold mb-8 mx-auto">
            <Images size={28} strokeWidth={1.25} />
          </div>
          <h1 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.9] mb-6">
            Project <span className="gradient-text-gold">Portfolio</span>
          </h1>
          <div className="w-24 gold-line mx-auto mb-8" />
          <p className="text-ro-gray-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-4">
            We are rebuilding this gallery around commercial work that shows both scope and finish: restaurants, retail, renovations, build-outs, and local businesses where execution matters and the final look still has to land.
            Full case studies and photography are rolling out next.
          </p>
          <p className="text-ro-gray-600 text-sm max-w-xl mx-auto mb-10">
            Need proof now? Start with our <Link href="/capabilities" className="text-ro-gold/70 hover:text-ro-gold transition-colors">capabilities</Link> page or{' '}
            <Link href="/commercial" className="text-ro-gold/70 hover:text-ro-gold transition-colors">commercial division</Link> overview.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors"
            >
              Send an RFP <ArrowRight size={14} />
            </Link>
            <a
              href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-2 px-8 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"
            >
              <Phone size={14} /> {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>
    </SubPageAnimator>
  );
}
