'use client';
import Link from 'next/link';
import { COMPANY, TRUST_STATS } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 blueprint-overlay gsap-blueprint" />
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute left-[10%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute left-[30%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute left-[70%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute left-[90%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute top-[20%] left-0 right-0 h-px bg-ro-gold" />
        <div className="absolute top-[50%] left-0 right-0 h-px bg-ro-gold" />
        <div className="absolute top-[80%] left-0 right-0 h-px bg-ro-gold" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-8">
            <span className="w-2 h-2 bg-ro-gold rounded-full animate-pulse" />
            <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">{COMPANY.experience} Years Building Excellence</span>
          </div>
          <h1>
            <span className="block text-ro-white font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.9] mb-4">We Build</span>
            <span className="block gradient-text-gold font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.9] mb-4">Everything</span>
            <span className="block text-ro-white font-heading text-3xl sm:text-4xl md:text-5xl tracking-wider uppercase leading-[0.9]">From the Ground Up</span>
          </h1>
          <div className="mx-auto my-8 w-32 gold-line" />
          <p className="max-w-2xl mx-auto text-ro-gray-400 text-lg sm:text-xl font-body leading-relaxed mb-12">
            Complete commercial and residential construction. Land grading to luxury finishes. One company — total capability.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300">
              Send Us Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="group flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300">
              <Phone size={16} />{COMPANY.phone}
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-ro-gold font-heading text-3xl sm:text-4xl mb-1">{stat.value}</div>
                <div className="text-ro-gray-500 text-xs tracking-wider uppercase font-body">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ro-gold/20 to-transparent" />
    </section>
  );
}
