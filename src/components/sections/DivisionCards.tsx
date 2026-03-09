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
 * All cards start fully expanded. As user scrolls, each card's body
 * collapses sequentially with stagger, margins tighten.
 * Based on CodePen by Fabio Ottaviani (supah/jOZezwa).
 */
export default function DivisionCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!spacerRef.current) return;

    // In flip mode on mobile, collapse bodies + entrance animation
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia(MEDIA_QUERIES.mobile).matches;
      if (isMobile && sectionRef.current?.closest('.page-flip-slide')) {
        const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
        const bodies = allCards
          .map(c => c.querySelector('.card-body') as HTMLElement)
          .filter(Boolean);
        gsap.set(bodies, { height: 0, paddingBottom: 0, opacity: 0 });

        // Hide cards + header for entrance animation
        gsap.set(allCards, { opacity: 0, y: 20 });
        const header = sectionRef.current!.querySelector('.text-center') as HTMLElement;
        if (header) gsap.set(header, { opacity: 0, y: -15 });

        // Entrance animation (paused)
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

        // Listen for flip event
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

    const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const bodies = allCards.map(c => c.querySelector('.card-body') as HTMLElement).filter(Boolean);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
        snap: {
          snapTo: 'labels',
          delay: 0.3,
          duration: { min: 0.3, max: 0.9 },
          ease: 'power2.inOut',
        },
      },
    });

    // Each card gets its own labeled snap point so scroll parks here,
    // giving the user time to read before the next card collapses.
    // Cards fold one at a time with no overlap.
    const collapseUnit = 1 / allCards.length;

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
                    <div className="p-4 sm:p-5 lg:p-6">
                      {/* Card Header — always visible (icon + title) */}
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
                          {/* Target Audience */}
                          <p className="division-audience text-ro-gold/50 text-xs tracking-wider uppercase mb-2 sm:mb-3">
                            {division.targetAudience}
                          </p>

                          {/* Description */}
                          <p className="division-desc text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
                            {division.description}
                          </p>

                          {/* Service Tags */}
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
          <div className="flex-shrink-0 pb-4 sm:pb-8" />
        </div>
      </section>
    </div>
  );
}
