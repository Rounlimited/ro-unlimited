'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { COMPANY, TRUST_STATS } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';
import CountUp from '@/components/animations/CountUp';

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const goldLineRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // ─── useGSAP replaces useEffect ───
  // Auto-cleanup via gsap.context(), scoped selectors, SSR-safe
  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      delay: 1.0, // After LoadingSequence
    });

    // Badge slides from left
    tl.fromTo(badgeRef.current,
      { x: -60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6 }
    );

    // "WE BUILD" drops like a steel beam
    tl.fromTo(line1Ref.current,
      { y: -80, rotation: -2, opacity: 0 },
      { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: 'bounce.out' },
      '-=0.2'
    );

    // "EVERYTHING" scales up from center
    tl.fromTo(line2Ref.current,
      { scale: 0.3, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.5)' },
      '-=0.3'
    );

    // "FROM THE GROUND UP" rises via clipPath
    tl.fromTo(line3Ref.current,
      { clipPath: 'inset(100% 0% 0% 0%)', y: 30, opacity: 0 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.6 },
      '-=0.2'
    );

    // Gold welding line draws across
    tl.fromTo(goldLineRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.5, ease: 'power2.inOut' },
      '-=0.1'
    );

    // Description fades up
    tl.fromTo(descRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.2'
    );

    // CTAs bolt in with stagger
    if (ctaRef.current?.children.length) {
      tl.fromTo(ctaRef.current.children,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.15, ease: 'back.out(2)' },
        '-=0.2'
      );
    }

    // Stats section rises
    tl.fromTo(statsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.2'
    );

  }, { scope: sectionRef }); // ← scoped + auto-cleanup

  // Parse numeric values from trust stats for CountUp
  const parseStatValue = (val: string): { num: number; suffix: string } => {
    const match = val.match(/^(\d+)(.*)$/);
    if (match) return { num: parseInt(match[1]), suffix: match[2] };
    return { num: 0, suffix: val };
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated blueprint grid */}
      <BlueprintGrid intensity="low" animate={true} />

      {/* Structural lines */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute left-[10%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute left-[30%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute left-[70%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute left-[90%] top-0 bottom-0 w-px bg-ro-gold" />
        <div className="absolute top-[20%] left-0 right-0 h-px bg-ro-gold" />
        <div className="absolute top-[50%] left-0 right-0 h-px bg-ro-gold" />
        <div className="absolute top-[80%] left-0 right-0 h-px bg-ro-gold" />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Badge */}
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-8">
            <span className="w-2 h-2 bg-ro-gold rounded-full animate-pulse" />
            <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">
              {COMPANY.experience} Years Building Excellence
            </span>
          </div>

          {/* Heading */}
          <h1>
            <span ref={line1Ref} className="block text-ro-white font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.9] mb-4">
              We Build
            </span>
            <span ref={line2Ref} className="block gradient-text-gold font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.9] mb-4">
              Everything
            </span>
            <span ref={line3Ref} className="block text-ro-white font-heading text-3xl sm:text-4xl md:text-5xl tracking-wider uppercase leading-[0.9]">
              From the Ground Up
            </span>
          </h1>

          {/* Gold welding line */}
          <div ref={goldLineRef} className="mx-auto my-8 w-32 h-[2px] bg-ro-gold"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4), 0 0 16px rgba(201,168,76,0.2)' }}
          />

          {/* Description */}
          <p ref={descRef} className="max-w-2xl mx-auto text-ro-gray-400 text-lg sm:text-xl font-body leading-relaxed mb-12">
            Complete commercial and residential construction. Land grading to luxury finishes. One company — total capability.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300">
              Send Us Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="group flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300">
              <Phone size={16} />{COMPANY.phone}
            </a>
          </div>

          {/* Trust Stats with CountUp */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {TRUST_STATS.map((stat) => {
              const { num, suffix } = parseStatValue(stat.value);
              return (
                <div key={stat.label} className="text-center">
                  <div className="text-ro-gold font-heading text-3xl sm:text-4xl mb-1">
                    <CountUp end={num} suffix={suffix} duration={2} />
                  </div>
                  <div className="text-ro-gray-500 text-xs tracking-wider uppercase font-body">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ro-gold/20 to-transparent" />
    </section>
  );
}
