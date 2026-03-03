'use client';
import Link from 'next/link';
import { DIVISIONS } from '@/lib/constants';
import { ArrowRight, Home, Building2, Mountain, HardHat } from 'lucide-react';

const ICONS: Record<string, any> = { home: Home, building: Building2, mountain: Mountain, hardhat: HardHat };

export default function DivisionCards() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 blueprint-overlay" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Our Divisions</span>
          <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase mb-4">
            Built to Handle <span className="gradient-text-gold">Any Project</span>
          </h2>
          <div className="mx-auto w-24 gold-line mb-6" />
          <p className="max-w-2xl mx-auto text-ro-gray-400 text-lg">
            Four specialized divisions working as one — delivering complete construction solutions from concept to completion.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DIVISIONS.map((division) => {
            const Icon = ICONS[division.icon] || Building2;
            return (
              <Link key={division.id} href={division.href}
                className="group relative bg-ro-gray-900/50 border border-ro-gray-800 hover:border-ro-gold/30 transition-all duration-500 overflow-hidden">
                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors" />
                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors" />
                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors" />
                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors" />
                <div className="p-8 sm:p-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 border border-ro-gold/20 flex items-center justify-center text-ro-gold group-hover:bg-ro-gold/10 transition-colors flex-shrink-0">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase group-hover:text-ro-gold transition-colors">{division.name}</h3>
                      <p className="text-ro-gray-500 text-xs tracking-wider uppercase mt-1">{division.targetAudience}</p>
                    </div>
                  </div>
                  <p className="text-ro-gray-400 text-sm leading-relaxed mb-6 pl-16">{division.description}</p>
                  <div className="pl-16 flex flex-wrap gap-2 mb-6">
                    {division.services.slice(0, 3).map((service) => (
                      <span key={service} className="px-3 py-1 text-xs font-mono text-ro-gray-500 border border-ro-gray-800 group-hover:border-ro-gold/20 group-hover:text-ro-gray-300 transition-colors">
                        {service}
                      </span>
                    ))}
                  </div>
                  <div className="pl-16 flex items-center gap-2 text-ro-gold text-sm tracking-wider uppercase font-heading">
                    <span>Explore Division</span>
                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-ro-gold/20">
                  <div className="h-full bg-ro-gold w-0 group-hover:w-full transition-all duration-700" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
