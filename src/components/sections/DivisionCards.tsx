'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { DIVISIONS } from '@/lib/constants';
import { ArrowRight, Home, Building2, Mountain, HardHat } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICONS: Record<string, any> = {
  home: Home,
  building: Building2,
  mountain: Mountain,
  hardhat: HardHat,
};

/**
 * DivisionCards — Scroll-triggered accordion.
 *
 * Desktop: All 4 cards visible. One card body expanded at a time. As user
 * scrolls, current card collapses and next expands — steel panels folding.
 *
 * Mobile: Cards flow vertically with individual fade+rise ScrollTriggers.
 */
export default function DivisionCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !stageRef.current) return;

    const mm = gsap.matchMedia();

    // ═══════════════════════════════════════════════
    //  DESKTOP — Accordion scrub
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.desktop, () => {
      if (!spacerRef.current) return;

      const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      const bodies = allCards.map(c => c.querySelector('.card-body') as HTMLElement);
      const bodyInners = allCards.map(c => c.querySelector('.card-body-inner') as HTMLElement);
      const bottomLines = allCards.map(c => c.querySelector('.division-bottom-line') as HTMLElement);

      // Measure natural body heights BEFORE collapsing anything
      const bodyHeights = bodies.map(b => b ? b.scrollHeight : 0);

      // Initial state: all cards hidden, card 0 body expanded, rest collapsed
      allCards.forEach((card, i) => {
        gsap.set(card, { opacity: 0, marginBottom: i < allCards.length - 1 ? 16 : 0 });
        if (i > 0) {
          gsap.set(bodies[i], { height: 0 });
          gsap.set(bodyInners[i], { opacity: 0 });
          if (bottomLines[i]) gsap.set(bottomLines[i], { scaleX: 0, opacity: 0 });
        }
      });

      if (headerRef.current) {
        gsap.set(headerRef.current.children, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: spacerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          id: 'division-cards-accordion',
        },
      });

      // ── Phase 0: Header + Cards appear (0.00 – 0.06) ──
      if (headerRef.current) {
        const badge = headerRef.current.querySelector('.section-badge');
        const heading = headerRef.current.querySelector('.section-heading');
        const goldLine = headerRef.current.querySelector('.section-gold-line');

        if (badge) {
          tl.fromTo(badge,
            { x: -60, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.015, ease: 'power2.out' },
            0
          );
        }
        if (heading) {
          tl.fromTo(heading,
            { scale: 0, rotation: 90, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.02, ease: 'back.out(2)' },
            0.015
          );
        }
        if (goldLine) {
          tl.fromTo(goldLine,
            { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
            { scaleX: 1, opacity: 1, duration: 0.015, ease: 'power2.inOut' },
            0.03
          );
        }
      }

      // Fade in all 4 cards with stagger
      allCards.forEach((card, i) => {
        tl.fromTo(card,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.02, ease: 'power2.out' },
          0.04 + i * 0.004
        );
      });

      // ── Phases 1-3: Accordion collapse/expand ──
      const PHASE_START = 0.07;
      const PHASE_DURATION = 0.30;

      for (let i = 0; i < allCards.length - 1; i++) {
        const ps = PHASE_START + i * PHASE_DURATION;

        // Current card: gold weld line retracts from right
        if (bottomLines[i]) {
          tl.fromTo(bottomLines[i],
            { scaleX: 1, opacity: 1 },
            { scaleX: 0, opacity: 0, duration: 0.03, ease: 'power2.in', transformOrigin: 'right center' },
            ps
          );
        }

        // Current card: body content fades out
        if (bodyInners[i]) {
          tl.fromTo(bodyInners[i],
            { opacity: 1 },
            { opacity: 0, duration: 0.04, ease: 'power2.in' },
            ps + 0.01
          );
        }

        // Current card: body collapses (height → 0)
        if (bodies[i]) {
          tl.fromTo(bodies[i],
            { height: bodyHeights[i] },
            { height: 0, duration: 0.09, ease: 'power3.inOut' },
            ps + 0.03
          );
        }

        // Current card: margin tightens
        tl.fromTo(allCards[i],
          { marginBottom: 16 },
          { marginBottom: 4, duration: 0.06, ease: 'power2.inOut' },
          ps + 0.06
        );

        // Next card: body expands (height 0 → natural)
        if (bodies[i + 1]) {
          tl.fromTo(bodies[i + 1],
            { height: 0 },
            { height: bodyHeights[i + 1], duration: 0.09, ease: 'power3.inOut' },
            ps + 0.10
          );
        }

        // Next card: body content fades in
        if (bodyInners[i + 1]) {
          tl.fromTo(bodyInners[i + 1],
            { opacity: 0 },
            { opacity: 1, duration: 0.05, ease: 'power2.out' },
            ps + 0.15
          );
        }

        // Next card: gold weld line draws from left
        if (bottomLines[i + 1]) {
          tl.fromTo(bottomLines[i + 1],
            { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
            { scaleX: 1, opacity: 1, duration: 0.04, ease: 'power2.inOut' },
            ps + 0.20
          );
        }
      }
    });

    // ═══════════════════════════════════════════════
    //  MOBILE — Clean fade+rise per card
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.mobile, () => {
      // Header auto-play
      if (headerRef.current) {
        gsap.set(headerRef.current.children, { opacity: 0 });

        const badge = headerRef.current.querySelector('.section-badge');
        const heading = headerRef.current.querySelector('.section-heading');
        const goldLine = headerRef.current.querySelector('.section-gold-line');

        const headerTl = gsap.timeline({
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 65%',
            toggleActions: 'play none none none',
            id: 'divisions-header-mobile',
          },
        });

        if (badge) {
          headerTl.fromTo(badge,
            { y: 15, opacity: 0 },
            { x: 0, y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            0
          );
        }
        if (heading) {
          headerTl.fromTo(heading,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
            0.15
          );
        }
        if (goldLine) {
          headerTl.fromTo(goldLine,
            { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
            { scaleX: 1, opacity: 1, duration: 0.4, ease: 'power2.inOut' },
            0.4
          );
        }
      }

      // Each card: simple fade+rise
      const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      allCards.forEach((card, i) => {
        gsap.set(card, { opacity: 0 });

        gsap.fromTo(card,
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 70%',
              toggleActions: 'play none none none',
              id: `division-card-${i}-mobile`,
            },
          }
        );
      });
    });

  }, { scope: sectionRef });

  return (
    <div ref={spacerRef} className="relative lg:z-[30] lg:[height:300vh]">
    <section
      ref={sectionRef}
      className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden bg-ro-black"
    >
      <BlueprintGrid intensity="medium" animate={true} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-transparent to-ro-black pointer-events-none z-[1]" />

      <div className="relative z-10 flex flex-col lg:h-screen px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="pt-20 pb-6 text-center flex-shrink-0">
          <span className="section-badge text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-3 block">
            Our Divisions
          </span>
          <h2 className="section-heading text-ro-white font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase mb-3">
            Built to Handle <span className="gradient-text-gold">Any Project</span>
          </h2>
          <div className="section-gold-line mx-auto w-20 h-[2px] bg-ro-gold"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
          />
        </div>

        {/* Card Stage — accordion on desktop, flowing column on mobile */}
        <div ref={stageRef} className="relative flex-1 max-w-2xl mx-auto w-full flex flex-col gap-6 lg:gap-0 lg:justify-center">
          {DIVISIONS.map((division, index) => {
            const Icon = ICONS[division.icon] || Building2;
            return (
              <div
                key={division.id}
                ref={el => { cardRefs.current[index] = el; }}
                className="division-card"
              >
                <Link
                  href={division.href}
                  className="relative w-full bg-ro-gray-900/80 lg:bg-ro-gray-900/60 lg:backdrop-blur-sm overflow-hidden block border border-ro-gold/20"
                >
                  {/* Corner Bolts — desktop only */}
                  <div className="card-bolt absolute top-2 left-2 w-2 h-2 rounded-full hidden lg:block"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />
                  <div className="card-bolt absolute top-2 right-2 w-2 h-2 rounded-full hidden lg:block"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />
                  <div className="card-bolt absolute bottom-2 left-2 w-2 h-2 rounded-full hidden lg:block"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />
                  <div className="card-bolt absolute bottom-2 right-2 w-2 h-2 rounded-full hidden lg:block"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />

                  {/* Card Content */}
                  <div className="p-5 sm:p-6">
                    {/* Card Header — always visible (icon + title inline) */}
                    <div className="card-header flex items-center gap-4">
                      <div className="division-icon w-10 h-10 border border-ro-gold/30 flex items-center justify-center text-ro-gold flex-shrink-0">
                        <Icon size={22} />
                      </div>
                      <h3 className="division-name text-ro-white font-heading text-xl sm:text-2xl tracking-wider uppercase">
                        {division.name}
                      </h3>
                    </div>

                    {/* Card Body — collapses on desktop scroll */}
                    <div className="card-body overflow-hidden">
                      <div className="card-body-inner pt-4">
                        {/* Target Audience */}
                        <p className="division-audience text-ro-gold/50 text-xs tracking-wider uppercase mb-3">
                          {division.targetAudience}
                        </p>

                        {/* Description */}
                        <p className="division-desc text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-4">
                          {division.description}
                        </p>

                        {/* Service Tags */}
                        <div className="division-tags flex flex-wrap gap-2 mb-4">
                          {division.services.slice(0, 3).map(service => (
                            <span
                              key={service}
                              className="division-tag px-3 py-1 text-xs font-mono text-ro-gray-500 border border-ro-gray-800"
                            >
                              {service}
                            </span>
                          ))}
                        </div>

                        {/* Explore Arrow */}
                        <div className="division-arrow flex items-center gap-2 text-ro-gold text-sm tracking-wider uppercase font-heading">
                          <span>Explore Division</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Gold Weld Line */}
                  <div className="division-bottom-line absolute bottom-0 left-0 right-0 h-[2px] bg-ro-gold"
                    style={{ transformOrigin: 'left center', boxShadow: '0 0 6px rgba(201,168,76,0.4)' }}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer */}
        <div className="flex-shrink-0 pb-8" />
      </div>
    </section>
    </div>
  );
}
