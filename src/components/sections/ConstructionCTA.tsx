'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';
import CraneAnimation from '@/components/animations/CraneAnimation';
import SitePlanBackdrop from '@/components/sections/SitePlanBackdrop';

export default function ConstructionCTA() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const ctaContent = (
    <div className="p-8 sm:p-12 bg-ro-black/90 lg:bg-ro-black/80 border border-ro-gold/20 lg:backdrop-blur-sm relative">
      <div className="absolute top-0 left-0 right-0 h-1 caution-stripe opacity-30" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
        {/* Left: heading block */}
        <div className="lg:flex-1 text-center lg:text-left mb-8 lg:mb-0">
          <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-6 block">Ready to Build?</span>
          <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase mb-6">
            Send Us Your <span className="gradient-text-gold">Project</span>
          </h2>
          <div className="w-24 h-[2px] bg-ro-gold mb-0 lg:mb-0 mx-auto lg:mx-0"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
          />
        </div>
        {/* Right: desc + buttons */}
        <div className="lg:flex-1 text-center lg:text-left">
          <p className="text-ro-gray-400 text-base sm:text-lg mb-8">
            Commercial or residential — from raw land to finished product. {COMPANY.experience} years of showing up where it counts and building it right.
          </p>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
            <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300">
              Start Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="group flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-all duration-300">
              <Phone size={16} />Call Now
            </a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 caution-stripe opacity-30" />
    </div>
  );

  if (!mounted) {
    return (
      <section className="relative py-24 overflow-hidden">
        <SitePlanBackdrop />
        <div className="absolute inset-0 steel-texture" />
        <div className="absolute inset-0 blueprint-overlay opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {ctaContent}
        </div>
      </section>
    );
  }

  return (
    <CraneAnimation scrollDistance="+=150%" className="bg-ro-black">
      {ctaContent}
    </CraneAnimation>
  );
}
