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
 * DivisionCards — Scroll-triggered accordion with digital physics.
 *
 * Physics effects:
 *   1. Weighted snap gate — must scroll 50% into next card before it commits
 *   2. Squish compression — card below deforms slightly as pressure builds
 *   3. Pressure glow — gold border intensifies as scroll approaches threshold
 *   4. Elastic spring-back — overshoots slightly when snapping back (real spring feel)
 */
export default function DivisionCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!spacerRef.current) return;

    // ── Mobile flip mode ───────────────────────────────────────────────
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia(MEDIA_QUERIES.mobile).matches;
      if (isMobile && sectionRef.current?.closest('.page-flip-slide')) {
        const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
        const bodies = allCards
          .map(c => c.querySelector('.card-body') as HTMLElement)
          .filter(Boolean);
        gsap.set(bodies, { height: 0, paddingBottom: 0, opacity: 0 });

        gsap.set(allCards, { opacity: 0, y: 20 });
        const header = sectionRef.current!.querySelector('.text-center') as HTMLElement;
        if (header) gsap.set(header, { opacity: 0, y: -15 });

        const entranceTl = gsap.timeline({ paused: true });
        if (header) {
          entranceTl.fromTo(header,
            { opacity: 0, y: -15 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
            0
          );
        }
        entranceTl.fromTo(allCards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
          0.2
        );

        const flipSlide = sectionRef.current!.closest('.page-flip-slide')!;
        const myIndex = Array.from(document.querySelectorAll('.page-flip-slide')).indexOf(flipSlide);
        const handler = (e: Event) => {
          if ((e as CustomEvent).detail?.index === myIndex) {
            entranceTl.play();
            window.removeEventListener('flipSlideEnter', handler);
          }
        };
        window.addEventListener('flipSlideEnter', handler);
        return;
      }
    }

    // ── Desktop scroll physics ─────────────────────────────────────────
    const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const bodies = allCards.map(c => c.querySelector('.card-body') as HTMLElement).filter(Boolean);
    const links  = allCards.map(c => c.querySelector('a') as HTMLElement).filter(Boolean);

    // Collapse unit: each card owns an equal slice of the timeline
    const collapseUnit = 1 / allCards.length;

    // ── PHYSICS EFFECT 3: Pressure glow + squish via ScrollTrigger onUpdate ──
    // We track scroll progress within each card's window and drive
    // live border glow & squish on the next card proportionally.
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress; // 0 → 1 across the whole section

        allCards.forEach((card, i) => {
          const link = links[i];
          const windowStart = i * collapseUnit;
          const windowEnd   = (i + 1) * collapseUnit;

          // How far into this card's collapse window are we? (0–1)
          const localProgress = Math.max(0, Math.min(1,
            (progress - windowStart) / collapseUnit
          ));

          // ── PHYSICS EFFECT 2: Pressure glow ──
          // Border + glow intensify as we approach the 50% snap threshold.
          // Peaks at ~50% progress (the decision point), fades after commit.
          const glowIntensity = localProgress < 0.5
            ? localProgress * 2           // ramp up 0 → 1 as we approach threshold
            : (1 - localProgress) * 2;    // ramp down after commit

          const goldOpacity  = 0.2 + (glowIntensity * 0.6);  // 0.2 → 0.8
          const glowStrength = glowIntensity * 12;            // 0 → 12px spread
          const glowAlpha    = glowIntensity * 0.5;           // 0 → 0.5 opacity

          if (link) {
            link.style.borderColor = `rgba(201,168,76,${goldOpacity})`;
            link.style.boxShadow = glowStrength > 1
              ? `0 0 ${glowStrength}px rgba(201,168,76,${glowAlpha}), inset 0 0 ${glowStrength * 0.5}px rgba(201,168,76,${glowAlpha * 0.3})`
              : '';
          }

          // ── PHYSICS EFFECT 1: Squish compression ──
          // The card BELOW the one being collapsed gets a subtle squeeze
          // proportional to how much pressure is building.
          // Peaks at ~40% progress (before commit), releases on collapse.
          const nextCard = allCards[i + 1];
          if (nextCard) {
            const squishAmount = localProgress < 0.4
              ? localProgress / 0.4          // ramp up: 0 → 1
              : Math.max(0, 1 - ((localProgress - 0.4) / 0.6)); // ramp down after

            const squishScale = 1 - (squishAmount * 0.025); // max 2.5% squeeze
            gsap.set(nextCard, {
              scaleY: squishScale,
              transformOrigin: 'top center',
            });
          }
        });
      },
    });

    // ── Main collapse timeline ─────────────────────────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
        snap: {
          snapTo: 'labels',
          delay: 0.6,
          duration: { min: 0.4, max: 1.0 },
          // ── PHYSICS EFFECT 4: Elastic spring-back ──
          // Forward commits use power2.inOut (deliberate, weighted).
          // Spring-back uses elastic ease — real springs overshoot slightly
          // before settling. The asymmetry is what makes it feel physical.
          ease: 'elastic.out(1, 0.5)',
          directionalEndThreshold: 0.5,
        },
      },
    });

    allCards.forEach((_, i) => {
      const body = bodies[i];
      const card = allCards[i];
      if (!body || !card) return;

      tl.addLabel(`card-${i}`);

      // Body collapses
      tl.to(body, {
        height: 0,
        paddingBottom: 0,
        opacity: 0,
        duration: collapseUnit,
        ease: 'power2.inOut',
      });

      // Margin tightens simultaneously — use power2.inOut for the commit
      // direction; spring-back handled by snap ease above
      tl.to(card, {
        marginBottom: 4,
        duration: collapseUnit,
        ease: 'power2.inOut',
      }, '<');

      // Reset squish on the next card once this collapse completes
      const nextCard = allCards[i + 1];
      if (nextCard) {
        tl.to(nextCard, {
          scaleY: 1,
          duration: collapseUnit * 0.2,
          ease: 'power2.out',
        }, '>-' + (collapseUnit * 0.2));
      }
    });

  }, { scope: sectionRef });

  return (
    <div ref={spacerRef} className="relative z-[30] [height:220vh] lg:[height:400vh]">
      <section
        ref={sectionRef}
        className="sticky top-0 h-screen overflow-hidden bg-ro-black"
      >
        <BlueprintGrid intensity="medium" animate={true} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-transparent to-ro-black pointer-events-none z-[1]" />

        <div className="relative z-10 flex flex-col h-screen px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="pt-12 sm:pt-16 lg:pt-20 pb-4 sm:pb-6 text-center flex-shrink-0">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-3 block">
              Our Divisions
            </span>
            <h2 className="text-ro-white font-heading text-2xl sm:text-3xl md:text-5xl tracking-tight uppercase mb-3">
              Built to Handle <span className="gradient-text-gold">Any Project</span>
            </h2>
            <div className="mx-auto w-20 h-[2px] bg-ro-gold"
              style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
            />
          </div>

          {/* Card Stage */}
          <div ref={stageRef} className="relative flex-1 max-w-2xl mx-auto w-full flex flex-col">
            {DIVISIONS.map((division, index) => {
              const Icon = ICONS[division.icon] || Building2;
              return (
                <div
                  key={division.id}
                  ref={el => { cardRefs.current[index] = el; }}
                  className="division-card mb-6 lg:mb-8"
                >
                  <Link
                    href={division.href}
                    className="relative w-full bg-ro-gray-900/80 lg:bg-ro-gray-900/60 lg:backdrop-blur-sm overflow-hidden block border border-ro-gold/20 transition-none"
                    style={{ willChange: 'box-shadow, border-color' }}
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
                    <div className="p-4 sm:p-5 lg:p-6">
                      {/* Card Header — always visible */}
                      <div className="card-header flex items-center gap-3 sm:gap-4">
                        <div className="division-icon w-8 h-8 sm:w-10 sm:h-10 border border-ro-gold/30 flex items-center justify-center text-ro-gold flex-shrink-0">
                          <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <h3 className="division-name text-ro-white font-heading text-lg sm:text-xl lg:text-2xl tracking-wider uppercase">
                          {division.name}
                        </h3>
                      </div>

                      {/* Card Body — collapses on scroll */}
                      <div className="card-body overflow-hidden">
                        <div className="card-body-inner pt-3 sm:pt-4 pb-2">
                          <p className="division-audience text-ro-gold/50 text-xs tracking-wider uppercase mb-2 sm:mb-3">
                            {division.targetAudience}
                          </p>
                          <p className="division-desc text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
                            {division.description}
                          </p>
                          <div className="division-tags flex flex-wrap gap-2 mb-3 sm:mb-4">
                            {division.services.slice(0, 3).map(service => (
                              <span
                                key={service}
                                className="division-tag px-2 sm:px-3 py-1 text-xs font-mono text-ro-gray-500 border border-ro-gray-800"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
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
          <div className="flex-shrink-0 pb-4 sm:pb-8" />
        </div>
      </section>
    </div>
  );
}
