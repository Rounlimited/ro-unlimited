'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { DIVISIONS } from '@/lib/constants';
import { ArrowRight, Home, Building2, Mountain, HardHat } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICONS: Record<string, any> = {
  home: Home,
  building: Building2,
  mountain: Mountain,
  hardhat: HardHat,
};

/**
 * DivisionCards — Pinned scrub-linked construction sequence.
 *
 * The page IS a construction site. Each of 4 division cards physically BUILDS
 * as the user scrolls: wall rises from ground, border welds clockwise, corner
 * bolts screw in, icon drops with metallic bounce, name stamps in, description
 * pours like concrete, tags weld on, gold line seals the bottom.
 *
 * Mobile-first: designed for iPhone 16 Pro Max (430×932) thumb scrolling.
 * One card at a time, full viewport width, ~50vh scroll per card.
 *
 * Timeline across +=200% scroll:
 *   0.00–0.06  Section header construction
 *   0.06–0.28  Card 0 builds
 *   0.30–0.52  Card 1 builds
 *   0.54–0.76  Card 2 builds
 *   0.78–1.00  Card 3 builds
 */
export default function DivisionCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !stageRef.current || !spacerRef.current) return;

    // ─── Set initial hidden states ───
    const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    allCards.forEach(card => {
      gsap.set(card, { opacity: 0 });
    });
    if (headerRef.current) {
      gsap.set(headerRef.current.children, { opacity: 0 });
    }

    // ─── Setup SVG border rects with correct dimensions ───
    allCards.forEach(card => {
      const rect = card.querySelector('.card-border-rect') as SVGRectElement | null;
      const svg = card.querySelector('.card-border-svg') as SVGSVGElement | null;
      if (rect && svg) {
        const { width, height } = card.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        rect.setAttribute('width', String(width - 2));
        rect.setAttribute('height', String(height - 2));
        const perimeter = 2 * (width - 2 + height - 2);
        rect.style.strokeDasharray = String(perimeter);
        rect.style.strokeDashoffset = String(perimeter);
      }
    });

    // ─── Main scrub timeline ───
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        id: 'division-cards-build',
      },
    });

    // ─── Phase 0: Section Header Construction (0.00–0.06) ───
    if (headerRef.current) {
      const badge = headerRef.current.querySelector('.section-badge');
      const heading = headerRef.current.querySelector('.section-heading');
      const goldLine = headerRef.current.querySelector('.section-gold-line');

      if (badge) {
        tl.fromTo(badge,
          { x: -60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.02, ease: 'power2.out' },
          0
        );
      }
      if (heading) {
        tl.fromTo(heading,
          { scale: 0, rotation: 90, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.025, ease: 'back.out(2)' },
          0.02
        );
      }
      if (goldLine) {
        tl.fromTo(goldLine,
          { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
          { scaleX: 1, opacity: 1, duration: 0.02, ease: 'power2.inOut' },
          0.04
        );
      }
    }

    // ─── Card start positions ───
    const CARD_STARTS = [0.06, 0.30, 0.54, 0.78];
    const CARD_DURATION = 0.22;

    // ─── Build each card ───
    allCards.forEach((card, i) => {
      const start = CARD_STARTS[i];
      buildCard(tl, card, start);

      // Transition: fade out completed card before next starts
      if (i < allCards.length - 1) {
        tl.fromTo(card,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -30, duration: 0.02, ease: 'power2.in' },
          start + CARD_DURATION
        );
      }
    });

  }, { scope: sectionRef });

  return (
    <div ref={spacerRef} className="relative z-[30]" style={{ height: '300vh' }}>
    <section
      ref={sectionRef}
      className="sticky top-0 h-screen overflow-hidden bg-ro-black"
    >
      <BlueprintGrid intensity="medium" animate={true} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-transparent to-ro-black pointer-events-none z-[1]" />

      <div className="relative z-10 flex flex-col h-screen px-4 sm:px-6 lg:px-8">
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

        {/* Card Stage — all cards stacked here */}
        <div ref={stageRef} className="relative flex-1 max-w-2xl mx-auto w-full">
          {DIVISIONS.map((division, index) => {
            const Icon = ICONS[division.icon] || Building2;
            return (
              <div
                key={division.id}
                ref={el => { cardRefs.current[index] = el; }}
                className="absolute inset-0 flex items-center"
              >
                <Link
                  href={division.href}
                  className="relative w-full bg-ro-gray-900/60 backdrop-blur-sm overflow-visible block"
                >
                  {/* SVG Border Trace — welds clockwise */}
                  <svg
                      className="card-border-svg absolute inset-0 w-full h-full pointer-events-none z-20"
                      preserveAspectRatio="none"
                    >
                      <rect
                        className="card-border-rect"
                        x="1" y="1"
                        fill="none"
                        stroke="#C9A84C"
                        strokeWidth="1.5"
                        rx="0"
                      />
                    </svg>

                  {/* Corner Bolts */}
                  <div className="card-bolt card-bolt-tl absolute top-2 left-2 w-2 h-2 rounded-full"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />
                  <div className="card-bolt card-bolt-tr absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />
                  <div className="card-bolt card-bolt-bl absolute bottom-2 left-2 w-2 h-2 rounded-full"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />
                  <div className="card-bolt card-bolt-br absolute bottom-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)', boxShadow: '0 0 4px rgba(201,168,76,0.3)' }}
                  />

                  {/* Card Content */}
                  <div className="p-6 sm:p-8">
                    {/* Icon */}
                    <div className="division-icon w-14 h-14 border border-ro-gold/30 flex items-center justify-center text-ro-gold mb-4">
                      <Icon size={28} />
                    </div>

                    {/* Division Name */}
                    <h3 className="division-name text-ro-white font-heading text-2xl sm:text-3xl tracking-wider uppercase mb-2">
                      {division.name}
                    </h3>

                    {/* Target Audience */}
                    <p className="division-audience text-ro-gold/50 text-xs tracking-wider uppercase mb-4">
                      {division.targetAudience}
                    </p>

                    {/* Description */}
                    <p className="division-desc text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-5">
                      {division.description}
                    </p>

                    {/* Service Tags */}
                    <div className="division-tags flex flex-wrap gap-2 mb-5">
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

                  {/* Bottom Gold Weld Line */}
                  <div className="division-bottom-line absolute bottom-0 left-0 right-0 h-[2px] bg-ro-gold"
                    style={{ transformOrigin: 'left center', boxShadow: '0 0 6px rgba(201,168,76,0.4)' }}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Card counter indicator */}
        <div className="flex-shrink-0 pb-8 flex justify-center gap-2">
          {DIVISIONS.map((_, i) => (
            <div key={i} className="w-8 h-[2px] bg-ro-gray-800" />
          ))}
        </div>
      </div>
    </section>
    </div>
  );
}

/**
 * Builds a single card within the scrub timeline.
 * Each element is physically "constructed" in sequence.
 */
function buildCard(tl: gsap.core.Timeline, card: HTMLDivElement, start: number) {
  const borderRect = card.querySelector('.card-border-rect') as SVGRectElement | null;
  const boltTL = card.querySelector('.card-bolt-tl');
  const boltTR = card.querySelector('.card-bolt-tr');
  const boltBL = card.querySelector('.card-bolt-bl');
  const boltBR = card.querySelector('.card-bolt-br');
  const icon = card.querySelector('.division-icon');
  const name = card.querySelector('.division-name');
  const audience = card.querySelector('.division-audience');
  const desc = card.querySelector('.division-desc');
  const tags = card.querySelectorAll('.division-tag');
  const arrow = card.querySelector('.division-arrow');
  const bottomLine = card.querySelector('.division-bottom-line');

  // Card background rises from ground (wall rise)
  tl.fromTo(card,
    { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
    { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.03, ease: 'power3.out' },
    start
  );

  // Border welds clockwise (strokeDashoffset → 0)
  if (borderRect) {
    tl.fromTo(borderRect,
      { strokeDashoffset: borderRect.style.strokeDasharray, opacity: 0 },
      { strokeDashoffset: 0, opacity: 1, duration: 0.04, ease: 'power1.inOut' },
      start + 0.025
    );
  }

  // Corner bolts screw in
  const bolts = [
    { el: boltTL, pos: start + 0.055 },
    { el: boltTR, pos: start + 0.065 },
    { el: boltBL, pos: start + 0.075 },
    { el: boltBR, pos: start + 0.080 },
  ];
  bolts.forEach(({ el, pos }) => {
    if (el) {
      tl.fromTo(el,
        { scale: 0, rotation: 180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.012, ease: 'back.out(2)' },
        pos
      );
    }
  });

  // Icon drops from above (steel piece falling into place)
  if (icon) {
    tl.fromTo(icon,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.025, ease: 'bounce.out' },
      start + 0.090
    );
  }

  // Division name stamps in (mechanical press)
  if (name) {
    tl.fromTo(name,
      { scaleY: 0, transformOrigin: 'top center', opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.02, ease: 'elastic.out(0.5, 0.3)' },
      start + 0.110
    );
  }

  // Audience line fades
  if (audience) {
    tl.fromTo(audience,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.015, ease: 'power2.out' },
      start + 0.125
    );
  }

  // Description pours in (concrete pour — clipPath from bottom)
  if (desc) {
    tl.fromTo(desc,
      { clipPath: 'inset(100% 0% 0% 0%)', y: 20, opacity: 0 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.025, ease: 'power2.out' },
      start + 0.130
    );
  }

  // Service tags weld on (staggered)
  if (tags.length) {
    tl.fromTo(tags,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.02, stagger: 0.008, ease: 'back.out(1.5)' },
      start + 0.155
    );
  }

  // Arrow slides from left (beam sliding into place)
  if (arrow) {
    tl.fromTo(arrow,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.015, ease: 'power3.out' },
      start + 0.180
    );
  }

  // Bottom gold weld line seals
  if (bottomLine) {
    tl.fromTo(bottomLine,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.018, ease: 'power2.inOut' },
      start + 0.200
    );
  }
}
