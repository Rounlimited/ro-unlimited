'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { DIVISIONS, type DivisionCardEntry } from '@/lib/constants';
import { ArrowRight, Home, Building2, Mountain, HardHat, UtensilsCrossed, Store, Landmark, Hammer, Warehouse } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICONS: Record<string, any> = {
  home: Home,
  building: Building2,
  mountain: Mountain,
  hardhat: HardHat,
  utensils: UtensilsCrossed,
  store: Store,
  landmark: Landmark,
  hammer: Hammer,
  warehouse: Warehouse,
};

/**
 * DivisionCards — Scroll-triggered accordion with digital physics.
 *
 * Desktop layout: 2-column grid on lg+, max-w-5xl stage.
 * Mobile layout: single column accordion (unchanged).
 */
type DivisionCardsProps = {
  /** Defaults to legacy four divisions; homepage passes commercial project types. */
  items?: readonly DivisionCardEntry[];
  eyebrow?: string;
  titleBeforeGold?: string;
  titleGold?: string;
  exploreLabel?: string;
};

export default function DivisionCards({
  items,
  eyebrow = 'Our Divisions',
  titleBeforeGold = 'Built to Handle',
  titleGold = 'Any Project',
  exploreLabel = 'Explore Division',
}: DivisionCardsProps) {
  const cards: readonly DivisionCardEntry[] = items ?? DIVISIONS;
  const tallStack = cards.length > 4;
  const sectionRef  = useRef<HTMLDivElement>(null);
  const stageRef    = useRef<HTMLDivElement>(null);
  const cardRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRef   = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

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
    const bodies   = allCards.map(c => c.querySelector('.card-body') as HTMLElement).filter(Boolean);
    const links    = allCards.map(c => c.querySelector('a') as HTMLElement).filter(Boolean);
    const totalCards  = allCards.length;
    const collapseUnit = 1 / totalCards;

    if (watermarkRef.current) {
      gsap.set(watermarkRef.current, { opacity: 0.05, y: 18 });
    }

    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress;

        allCards.forEach((card, i) => {
          const link = links[i];
          const windowStart = i * collapseUnit;
          const localProgress = Math.max(0, Math.min(1,
            (progress - windowStart) / collapseUnit
          ));

          const glowIntensity = localProgress < 0.5
            ? localProgress * 2
            : (1 - localProgress) * 2;

          const goldOpacity  = 0.2 + (glowIntensity * 0.6);
          const glowStrength = glowIntensity * 12;
          const glowAlpha    = glowIntensity * 0.5;

          if (link) {
            link.style.borderColor = `rgba(201,168,76,${goldOpacity})`;
            link.style.boxShadow = glowStrength > 1
              ? `0 0 ${glowStrength}px rgba(201,168,76,${glowAlpha}), inset 0 0 ${glowStrength * 0.5}px rgba(201,168,76,${glowAlpha * 0.3})`
              : '';
          }

          const nextCard = allCards[i + 1];
          if (nextCard) {
            const squishAmount = localProgress < 0.4
              ? localProgress / 0.4
              : Math.max(0, 1 - ((localProgress - 0.4) / 0.6));
            const squishScale = 1 - (squishAmount * 0.025);
            gsap.set(nextCard, { scaleY: squishScale, transformOrigin: 'top center' });
          }
        });

        if (watermarkRef.current) {
          const lastWindow  = (totalCards - 1) * collapseUnit;
          const lastProgress = Math.max(0, Math.min(1,
            (progress - lastWindow) / collapseUnit
          ));
          const opacity = 0.05 + (Math.pow(lastProgress, 1.6) * 0.95);
          const yOffset = 18 - (lastProgress * 18);
          watermarkRef.current.style.opacity = String(opacity);
          watermarkRef.current.style.transform = `translateY(${yOffset}px)`;
        }
      },
    });

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

      tl.to(body, {
        height: 0,
        paddingBottom: 0,
        opacity: 0,
        duration: collapseUnit,
        ease: 'power2.inOut',
      });

      tl.to(card, {
        marginBottom: 4,
        duration: collapseUnit,
        ease: 'power2.inOut',
      }, '<');

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
    <div ref={spacerRef} className={tallStack ? 'relative z-[30] [height:330vh] lg:[height:600vh]' : 'relative z-[30] [height:220vh] lg:[height:400vh]'}>
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
            <span className="text-ro-gold text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-3 block">
              {eyebrow}
            </span>
            <h2 className="text-ro-white font-heading text-2xl sm:text-3xl md:text-5xl tracking-tight uppercase mb-3">
              {titleBeforeGold} <span className="gradient-text-gold">{titleGold}</span>
            </h2>
            <div className="mx-auto w-20 h-[2px] bg-ro-gold"
              style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
            />
          </div>

          {/* Card Stage — single col on mobile, 2-col grid on desktop */}
          <div ref={stageRef} className="relative flex-1 max-w-2xl lg:max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:pt-2">
              {cards.map((division, index) => {
                const Icon = ICONS[division.icon] || Building2;
                return (
                  <div
                    key={division.id}
                    ref={el => { cardRefs.current[index] = el; }}
                    className="division-card mb-6 lg:mb-0"
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
                          <h3 className="division-name text-ro-white font-heading text-xl sm:text-xl lg:text-2xl tracking-wider uppercase">
                            {division.name}
                          </h3>
                        </div>

                        {/* Card Body — collapses on scroll */}
                        <div className="card-body overflow-hidden">
                          <div className="card-body-inner pt-3 sm:pt-4 pb-2">
                            <p className="division-audience text-ro-gold/50 text-[13px] sm:text-xs tracking-wider uppercase mb-2 sm:mb-3">
                              {division.targetAudience}
                            </p>
                            <p className="division-desc text-ro-gray-400 text-base sm:text-base lg:text-[15px] leading-relaxed mb-3 sm:mb-4">
                              {division.description}
                            </p>
                            <div className="division-tags flex flex-wrap gap-2 mb-3 sm:mb-4">
                              {division.services.slice(0, 3).map(service => (
                                <span
                                  key={service}
                                  className="division-tag px-2 sm:px-3 py-1 text-[13px] sm:text-xs font-mono text-ro-gray-500 border border-ro-gray-800"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                            <div className="division-arrow flex items-center gap-2 text-ro-gold text-sm tracking-wider uppercase font-heading">
                              <span>{exploreLabel}</span>
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

            {/* RO Watermark Reveal */}
            <div
              ref={watermarkRef}
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none"
              style={{
                top: 'calc(100% - 20px)',
                opacity: 0.05,
                willChange: 'opacity, transform',
              }}
            >
              <div className="relative" style={{ width: '120px', height: '200px' }}>
                <img
                  src="/ro-icon.svg"
                  alt=""
                  className="w-full h-full"
                  style={{
                    objectFit: 'contain',
                    filter: 'brightness(0) saturate(100%) invert(72%) sepia(33%) saturate(600%) hue-rotate(5deg) brightness(95%)',
                  }}
                />
              </div>
              <div className="mt-3 text-center">
                <p className="font-mono uppercase tracking-[0.35em] text-[10px] sm:text-[11px]"
                  style={{ color: 'rgba(201,168,76,0.7)' }}>
                  Ground Up.
                </p>
                <p className="font-mono uppercase tracking-[0.35em] text-[10px] sm:text-[11px] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  No Shortcuts.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="flex-shrink-0 pb-4 sm:pb-8" />
        </div>
      </section>
    </div>
  );
}
