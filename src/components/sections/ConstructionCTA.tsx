'use client';
import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';

export default function ConstructionCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 caution-stripe opacity-20" />
      <div className="absolute inset-0 steel-texture" />
      <div className="absolute inset-0 blueprint-overlay opacity-50" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-6 block">Ready to Build?</span>
        <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase mb-6">
          Send Us Your <span className="gradient-text-gold">Project</span>
        </h2>
        <div className="mx-auto w-24 gold-line mb-8" />
        <p className="text-ro-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12">
          Commercial or residential — from raw land to finished product. {COMPANY.experience} years of solving the problems other contractors won&apos;t touch.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300">
            Start Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="group flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-all duration-300">
            <Phone size={16} />Call Now
          </a>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 caution-stripe opacity-20" />
    </section>
  );
}
