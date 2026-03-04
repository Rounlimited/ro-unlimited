'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { COMPANY, TRUST_STATS } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';
import { gsap, ScrollTrigger, SplitText, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';
import CountUp from '@/components/animations/CountUp';

/**
 * HERO — Desktop: pinned scrub-linked construction sequence.
 *        Mobile: auto-play on viewport entry (~3.5s build).
 *
 * Desktop (scrub) builds bottom-to-top as you scroll through 400vh:
 *   Stats → CTAs → Description → Gold line → headings → badge
 *
 * Mobile (auto-play) builds in user-requested order:
 *   Phone → Gold CTA → Description → Gold line →
 *   FROM THE GROUND UP (letters) → EVERYTHING (scale) →
 *   WE BUILD (letters) → Badge. Stats: ScrollTrigger.
 *
 * gsap.matchMedia() auto-reverts all animations when breakpoint changes.
 */
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
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    // ═══════════════════════════════════════════════
    //  DESKTOP — Scrub-linked construction sequence
    //  Pinned hero builds as you scroll through spacer
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.desktop, () => {
      if (!spacerRef.current) return;

      gsap.set([badgeRef.current, line1Ref.current, line2Ref.current, line3Ref.current,
        goldLineRef.current, descRef.current, statsRef.current], { opacity: 0 });
      if (ctaRef.current?.children.length) {
        gsap.set(ctaRef.current.children, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: spacerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          id: 'hero-build',
        },
      });

      // BUILD FROM THE GROUND UP — bottom first

      // 0.00–0.06: Stats rise from below — FOUNDATION POURED
      tl.fromTo(statsRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)', y: 40, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.06, ease: 'power3.out' },
        0
      );

      // 0.06–0.13: CTA buttons bolt in — STRUCTURAL STEEL FRAMING
      if (ctaRef.current?.children.length) {
        tl.fromTo(ctaRef.current.children,
          { scale: 0, rotation: 180, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.07, stagger: 0.02, ease: 'back.out(2)' },
          0.06
        );
      }

      // 0.13–0.20: Description pours in — WALLS RISING
      tl.fromTo(descRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)', y: 20, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.07, ease: 'power2.out' },
        0.13
      );

      // 0.20–0.26: Gold weld line draws — STRUCTURAL CONNECTOR
      tl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.06, ease: 'power2.inOut' },
        0.20
      );

      // 0.26–0.36: "FROM THE GROUND UP" rises via clipPath
      tl.fromTo(line3Ref.current,
        { clipPath: 'inset(100% 0% 0% 0%)', y: 40, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.10, ease: 'power3.out' },
        0.26
      );

      // 0.36–0.46: "EVERYTHING" scales up from center
      tl.fromTo(line2Ref.current,
        { scale: 0.2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.10, ease: 'back.out(1.5)' },
        0.36
      );

      // 0.46–0.57: "WE BUILD" drops like top beam — PLACED LAST
      tl.fromTo(line1Ref.current,
        { y: -100, rotation: -3, opacity: 0 },
        { y: 0, rotation: 0, opacity: 1, duration: 0.11, ease: 'bounce.out' },
        0.46
      );

      // 0.57–0.65: Badge bolts on — FINAL SIGN AT TOP
      tl.fromTo(badgeRef.current,
        { scale: 0, rotation: 90, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.08, ease: 'back.out(2)' },
        0.57
      );
    });

    // ═══════════════════════════════════════════════
    //  MOBILE — Auto-play on page load
    //  Order: phone → CTA → desc → gold line → FROM THE GROUND UP
    //  → EVERYTHING → WE BUILD → badge. Stats: ScrollTrigger.
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.mobile, () => {
      // Hide everything initially
      gsap.set([badgeRef.current, line2Ref.current, goldLineRef.current], { opacity: 0 });
      if (ctaRef.current?.children.length) {
        gsap.set(ctaRef.current.children, { opacity: 0 });
      }

      // SplitText with mask — chars hidden behind clip containers,
      // slide into view with pure y transform. No opacity needed.
      // This is the 2025-2026 agency-standard text reveal technique.
      const split3 = SplitText.create(line3Ref.current!, { type: 'chars', mask: 'chars' });
      const split1 = SplitText.create(line1Ref.current!, { type: 'chars', mask: 'chars' });
      gsap.set([split3.chars, split1.chars], { y: '110%', willChange: 'transform' });

      // Description: line-by-line mask reveal
      const splitDesc = SplitText.create(descRef.current!, { type: 'lines', mask: 'lines' });
      gsap.set(splitDesc.lines, { y: '100%' });

      const tl = gsap.timeline({ delay: 0.5 });

      // 1. Phone number — slides in from right (0s)
      if (ctaRef.current?.children[1]) {
        tl.fromTo(ctaRef.current.children[1],
          { x: 60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
          0
        );
      }

      // 2. Gold CTA — steel beam wipe from left (0.15s)
      if (ctaRef.current?.children[0]) {
        tl.fromTo(ctaRef.current.children[0],
          { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
          { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.5, ease: 'power3.inOut' },
          0.15
        );
      }

      // 3. Description — lines rise from behind masks (0.5s)
      tl.fromTo(splitDesc.lines,
        { y: '100%' },
        { y: '0%', stagger: 0.08, duration: 0.5, ease: 'power3.out' },
        0.5
      );

      // 4. Gold weld line draws across (0.65s)
      tl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.inOut' },
        0.65
      );

      // 5. "FROM THE GROUND UP" — chars rise from below baselines (0.9s)
      tl.fromTo(split3.chars,
        { y: '110%' },
        { y: '0%', stagger: 0.02, duration: 0.45, ease: 'back.out(1.2)' },
        0.9
      );

      // 6. "EVERYTHING" — scale punch from center (1.3s)
      tl.fromTo(line2Ref.current,
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
        1.3
      );

      // 7. "WE BUILD" — chars drop from above, center-out stagger (1.5s)
      tl.fromTo(split1.chars,
        { y: '-110%' },
        { y: '0%', stagger: { each: 0.025, from: 'center' }, duration: 0.45, ease: 'back.out(1.5)' },
        1.5
      );

      // 8. Badge — drops in from top (1.9s)
      tl.fromTo(badgeRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        1.9
      );

      // Clean up GPU layers after build finishes
      tl.call(() => {
        gsap.set([split3.chars, split1.chars], { willChange: 'auto' });
      });

      // ─── Stats: concrete pour from bottom, stagger from edges ───
      if (statsRef.current?.children.length) {
        const statEls = Array.from(statsRef.current.children) as HTMLElement[];
        gsap.set(statEls, { scaleY: 0, transformOrigin: 'center bottom', opacity: 0 });

        gsap.fromTo(statEls,
          { scaleY: 0, opacity: 0, transformOrigin: 'center bottom' },
          {
            scaleY: 1, opacity: 1,
            duration: 0.5, ease: 'power3.out',
            stagger: { each: 0.1, from: 'edges' },
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
              id: 'hero-stats-mobile',
            },
          }
        );
      }

      return () => { split1.revert(); split3.revert(); splitDesc.revert(); };
    });

  }, { scope: sectionRef });

  // Parse numeric values for CountUp
  const parseStatValue = (val: string): { num: number; suffix: string } => {
    const match = val.match(/^(\d+)(.*)$/);
    if (match) return { num: parseInt(match[1]), suffix: match[2] };
    return { num: 0, suffix: val };
  };

  return (
    <div ref={spacerRef} className="relative lg:z-[40] lg:[height:400vh]">
    <section ref={sectionRef} className="min-h-screen lg:sticky lg:top-0 lg:h-screen flex items-center justify-start lg:justify-center overflow-hidden bg-ro-black pt-20">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 lg:pt-8 lg:pb-8">
        <div className="text-center">
          {/* Badge — final sign bolted on top */}
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-8">
            <span className="w-2 h-2 bg-ro-gold rounded-full" />
            <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">
              {COMPANY.experience} Years Building Excellence
            </span>
          </div>

          {/* Heading — builds bottom to top */}
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

          {/* Gold welding line — structural connector */}
          <div ref={goldLineRef} className="mx-auto my-8 w-32 h-[2px] bg-ro-gold"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4), 0 0 16px rgba(201,168,76,0.2)' }}
          />

          {/* Description — walls rising */}
          <p ref={descRef} className="max-w-2xl mx-auto text-ro-gray-400 text-lg sm:text-xl font-body leading-relaxed mb-12">
            Complete commercial and residential construction. Land grading to luxury finishes. One company — total capability.
          </p>

          {/* CTAs — structural steel framing */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300">
              Send Us Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="group flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300">
              <Phone size={16} />{COMPANY.phone}
            </a>
          </div>

          {/* Trust Stats — foundation, poured first */}
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
    </div>
  );
}
