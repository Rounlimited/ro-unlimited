'use client';

import Link from 'next/link';
import { SERVICE_CATEGORIES } from '@/lib/services-data';
import { ROOFING_SUB_SERVICES } from '@/lib/roofing-data';
import ServicePageTemplate from '@/components/sections/ServicePageTemplate';
import { ArrowRight, HardHat, BookOpen } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap } from '@/components/animations/GSAPProvider';

const category = SERVICE_CATEGORIES.find(c => c.id === 'roofing')!;

export default function RoofingPage() {
  const [mounted, setMounted] = useState(false);
  const guidesRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !guidesRef.current) return;
    const ctx = gsap.context(() => {
      const head = guidesRef.current!.querySelector('.section-head');
      if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
      const cards = guidesRef.current!.querySelectorAll('.guide-card');
      cards.forEach((c, i) => {
        gsap.fromTo(c, { y: 40, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.08, ease: 'power2.out',
            scrollTrigger: { trigger: c, start: 'top 88%', toggleActions: 'play none none reverse' } });
      });
    }, guidesRef);
    return () => ctx.revert();
  }, [mounted]);

  return (
    <>
      <ServicePageTemplate category={category} />

      {/* ═══ DETAILED GUIDES SECTION — injected after template ═══ */}
      <section ref={guidesRef} className="py-28 sm:py-36 relative overflow-hidden -mt-1">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.11]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[450px] h-[450px] warm-glow-strong animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-gold/[0.04] mb-6">
              <BookOpen size={12} className="text-ro-gold" />
              <span className="text-ro-gold text-[10px] font-mono tracking-[0.3em] uppercase">In-Depth Guides</span>
            </div>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9]">
              Explore Our<br /><span className="gradient-text-gold">Roofing Guides</span>
            </h2>
            <p className="text-ro-gray-400 text-sm sm:text-base mt-6 max-w-lg mx-auto">
              Detailed educational pages for every roofing service — materials, costs, warning signs, maintenance tips, and more.
            </p>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROOFING_SUB_SERVICES.map((svc) => (
              <Link key={svc.id} href={`/services/roofing/${svc.slug}`}
                className="guide-card group relative p-6 sm:p-7 border border-ro-gray-800/40 overflow-hidden hover:border-ro-gold/25 transition-all duration-700 text-center">
                {svc.cardImage && (
                  <>
                    <img src={svc.cardImage} alt={svc.title} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 bg-ro-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </>
                )}
                <div className="absolute inset-0 bg-ro-gray-900/10 group-hover:bg-transparent transition-colors duration-700" />
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />
                <div className="relative z-10">
                  <div className="w-10 h-10 mx-auto flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-4 group-hover:border-ro-gold/35 group-hover:bg-ro-black/50 transition-all duration-700">
                    <HardHat size={18} className="text-ro-gold/60 group-hover:text-ro-gold transition-colors duration-700" />
                  </div>
                  <h3 className="text-ro-white font-heading text-sm tracking-wider uppercase mb-1 group-hover:text-ro-gold-light transition-colors duration-700">{svc.title}</h3>
                  <p className="text-ro-gray-600 text-[10px] font-mono tracking-wider uppercase mb-3">{svc.tagline.split(' ').slice(0, 4).join(' ')}</p>
                  <div className="flex items-center justify-center gap-1 text-ro-gold/40 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Read Guide <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
