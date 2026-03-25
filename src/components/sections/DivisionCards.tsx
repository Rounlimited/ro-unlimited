'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { DIVISIONS, type DivisionCardEntry } from '@/lib/constants';
import { ArrowRight, Home, Building2, Mountain, HardHat, UtensilsCrossed, Store, Landmark, Hammer, Warehouse } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';
import { EASES, TIMING } from '@/lib/gsap-config';

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

    // ── Mobile-first reveal system ─────────────────────────────────────
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia(MEDIA_QUERIES.mobile).matches;
      if (isMobile) {
        const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
        const cardLinks = allCards
          .map(c => c.querySelector('.division-link') as HTMLElement | null)
          .filter(Boolean) as HTMLElement[];
        const header = sectionRef.current!.querySelector('.division-header') as HTMLElement | null;
        const headerBadge = sectionRef.current!.querySelector('.division-eyebrow') as HTMLElement | null;
        const headerTitle = header?.querySelector('h2') as HTMLElement | null;
        const headerLine = sectionRef.current!.querySelector('.division-line') as HTMLElement | null;

        if (headerBadge) gsap.set(headerBadge, { opacity: 0, y: -16 });
        if (headerTitle) gsap.set(headerTitle, { opacity: 0, y: 30 });
        if (headerLine) gsap.set(headerLine, { opacity: 0, scaleX: 0, transformOrigin: 'center center' });

        cardLinks.forEach((card, index) => {
          const icon = card.querySelector('.division-icon') as HTMLElement | null;
          const title = card.querySelector('.division-name') as HTMLElement | null;
          const audience = card.querySelector('.division-audience') as HTMLElement | null;
          const desc = card.querySelector('.division-desc') as HTMLElement | null;
          const tags = card.querySelectorAll('.division-tag');
          const arrow = card.querySelector('.division-arrow') as HTMLElement | null;
          const bottomLine = card.querySelector('.division-bottom-line') as HTMLElement | null;
          const isFeatured = index === 0;

          gsap.set(card, {
            opacity: 0,
            y: isFeatured ? 46 : 36,
            scale: isFeatured ? 0.92 : 0.95,
            rotationX: 10,
            transformPerspective: 1200,
            clipPath: isFeatured ? 'inset(18% 0% 0% 0%)' : 'inset(16% 0% 0% 0%)',
            boxShadow: '0 0 0 rgba(201,168,76,0)',
          });
          if (icon) gsap.set(icon, { opacity: 0, scale: 0.72, rotation: -18 });
          if (title) gsap.set(title, { opacity: 0, y: 14 });
          if (audience) gsap.set(audience, { opacity: 0, y: 10 });
          if (desc) gsap.set(desc, { opacity: 0, y: 14 });
          if (tags.length) gsap.set(tags, { opacity: 0, y: 10, scale: 0.96 });
          if (arrow) gsap.set(arrow, { opacity: 0, x: -10 });
          if (bottomLine) gsap.set(bottomLine, { scaleX: 0, transformOrigin: 'left center', opacity: 0 });

          gsap.timeline({
            scrollTrigger: {
              trigger: card,
              start: index === 0 ? 'top 88%' : 'top 82%',
              toggleActions: 'play none none none',
              id: `division-card-mobile-${index}`,
            },
          })
            .fromTo(card,
              {
                opacity: 0,
                y: isFeatured ? 46 : 36,
                scale: isFeatured ? 0.92 : 0.95,
                rotationX: 10,
                transformPerspective: 1200,
                clipPath: isFeatured ? 'inset(18% 0% 0% 0%)' : 'inset(16% 0% 0% 0%)',
                boxShadow: '0 0 0 rgba(201,168,76,0)',
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                rotationX: 0,
                clipPath: 'inset(0% 0% 0% 0%)',
                boxShadow: isFeatured ? '0 26px 64px rgba(0,0,0,0.4), 0 0 42px rgba(201,168,76,0.16)' : '0 20px 54px rgba(0,0,0,0.34), 0 0 34px rgba(201,168,76,0.12)',
                duration: isFeatured ? TIMING.chapterSlow : 0.72,
                ease: EASES.chapterReveal,
              }
            )
            .fromTo(icon,
              { opacity: 0, scale: 0.72, rotation: -18 },
              { opacity: 1, scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(1.8)' },
              0.1
            )
            .fromTo(title,
              { opacity: 0, y: 14 },
              { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
              0.16
            )
            .fromTo(audience,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.26, ease: 'power2.out' },
              0.2
            )
            .fromTo(desc,
              { opacity: 0, y: 14 },
              { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
              0.24
            )
            .fromTo(tags,
              { opacity: 0, y: 10, scale: 0.96 },
              { opacity: 1, y: 0, scale: 1, stagger: 0.04, duration: 0.25, ease: 'power2.out' },
              0.3
            )
            .fromTo(arrow,
              { opacity: 0, x: -10 },
              { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' },
              0.38
            )
            .fromTo(bottomLine,
              { scaleX: 0, transformOrigin: 'left center', opacity: 0 },
              { scaleX: 1, opacity: 1, duration: 0.36, ease: 'power2.inOut' },
              0.18
            );
        });

        const playHeader = () => {
          const entranceTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
          if (headerBadge) {
            entranceTl.fromTo(headerBadge,
              { opacity: 0, y: -16 },
              { opacity: 1, y: 0, duration: 0.4 },
              0
            );
          }
          if (headerTitle) {
            entranceTl.fromTo(headerTitle,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.55 },
              0.08
            );
          }
          if (headerLine) {
            entranceTl.fromTo(headerLine,
              { opacity: 0, scaleX: 0, transformOrigin: 'center center' },
              { opacity: 1, scaleX: 1, duration: 0.35 },
              0.18
            );
          }
        };

        if (sectionRef.current?.closest('.page-flip-slide')) {
          const flipSlide = sectionRef.current.closest('.page-flip-slide')!;
          const myIndex = Array.from(document.querySelectorAll('.page-flip-slide')).indexOf(flipSlide);
          const handler = (e: Event) => {
            if ((e as CustomEvent).detail?.index === myIndex) {
              playHeader();
              window.removeEventListener('flipSlideEnter', handler);
            }
          };
          window.addEventListener('flipSlideEnter', handler);
          return () => window.removeEventListener('flipSlideEnter', handler);
        }

        gsap.timeline({
          scrollTrigger: {
            trigger: header || sectionRef.current,
            start: 'top 72%',
            toggleActions: 'play none none none',
            id: 'division-header-mobile',
          },
        }).call(playHeader);
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
    <div ref={spacerRef} className={tallStack ? 'relative z-[30] py-12 sm:py-16 lg:py-0 lg:[height:600vh]' : 'relative z-[30] py-12 sm:py-16 lg:py-0 lg:[height:400vh]'}>
      <section
        ref={sectionRef}
        className="relative min-h-[100svh] overflow-hidden bg-ro-black lg:sticky lg:top-0 lg:h-screen"
      >
        <BlueprintGrid intensity="medium" animate={true} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-transparent to-ro-black pointer-events-none z-[1]" />

        <div className="relative z-10 flex min-h-[100svh] flex-col px-4 sm:px-6 lg:h-screen lg:min-h-screen lg:px-8">
          {/* Section Header */}
          <div className="division-header flex-shrink-0 pb-6 pt-12 text-left sm:pt-16 lg:pb-6 lg:pt-20 lg:text-center">
            <span className="division-eyebrow text-ro-gold text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-3 block">
              {eyebrow}
            </span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase mb-3">
              {titleBeforeGold} <span className="gradient-text-gold">{titleGold}</span>
            </h2>
            <div className="division-line mt-2 h-[2px] w-20 bg-ro-gold lg:mx-auto"
              style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
            />
          </div>

          {/* Card Stage — single col on mobile, 2-col grid on desktop */}
          <div ref={stageRef} className="relative mx-auto flex-1 w-full max-w-2xl lg:max-w-5xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-6 lg:pt-2">
              {cards.map((division, index) => {
                const Icon = ICONS[division.icon] || Building2;
                const isFeatured = index === 0;
                return (
                  <div
                    key={division.id}
                    ref={el => { cardRefs.current[index] = el; }}
                    className={`division-card lg:mb-0 ${isFeatured ? 'mb-8' : 'mb-6'}`}
                  >
                    <Link
                      href={division.href}
                      className={`division-link relative block w-full overflow-hidden border transition-none ${isFeatured ? 'border-ro-gold/30 bg-ro-gray-900/92 shadow-[0_24px_60px_rgba(0,0,0,0.34)] lg:bg-ro-gray-900/70' : 'border-ro-gold/20 bg-ro-gray-900/85 lg:bg-ro-gray-900/60'} lg:backdrop-blur-sm`}
                      style={{ willChange: 'box-shadow, border-color' }}
                    >
                      <div className={`absolute inset-0 pointer-events-none ${isFeatured ? 'bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]' : 'bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_48%)]'}`} />
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent pointer-events-none" />
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
                      <div className={`flex h-full flex-col p-5 sm:p-6 lg:p-6 ${isFeatured ? 'min-h-[63vh] justify-between sm:min-h-[56vh] lg:min-h-0' : 'min-h-[44vh]'}`}>
                        {/* Card Header — always visible */}
                        <div className="card-header">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`division-icon flex flex-shrink-0 items-center justify-center border border-ro-gold/30 bg-ro-gold/5 text-ro-gold ${isFeatured ? 'h-12 w-12' : 'h-10 w-10 sm:h-10 sm:w-10'}`}>
                              <Icon size={isFeatured ? 22 : 18} className="sm:w-[22px] sm:h-[22px]" />
                            </div>
                            <h3 className={`division-name font-heading uppercase tracking-wider text-ro-white ${isFeatured ? 'text-2xl sm:text-[1.9rem] lg:text-2xl' : 'text-xl sm:text-xl lg:text-2xl'}`}>
                              {division.name}
                            </h3>
                          </div>
                        </div>

                        {/* Card Body — collapses on scroll */}
                        <div className="card-body overflow-hidden">
                          <div className="card-body-inner pb-2 pt-4 sm:pt-4">
                            <p className="division-audience mb-3 text-[13px] uppercase tracking-wider text-ro-gold/55 sm:text-xs">
                              {division.targetAudience}
                            </p>
                            <p className={`division-desc leading-relaxed text-ro-gray-400 ${isFeatured ? 'mb-4 text-[1.05rem] sm:text-lg lg:text-[15px]' : 'mb-3 text-base sm:text-base lg:text-[15px] sm:mb-4'}`}>
                              {division.description}
                            </p>
                            <div className="division-tags mb-4 flex flex-wrap gap-2.5">
                              {division.services.slice(0, 3).map(service => (
                                <span
                                  key={service}
                                  className="division-tag px-2.5 sm:px-3 py-1 text-[13px] sm:text-xs font-mono text-ro-gray-400 border border-ro-gray-700/80 bg-ro-black/40"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                            <div className="division-arrow flex items-center gap-2 text-sm font-heading uppercase tracking-wider text-ro-gold">
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
                  Built to Last.
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
