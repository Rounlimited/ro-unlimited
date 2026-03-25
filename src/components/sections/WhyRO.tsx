'use client';

import { useRef } from 'react';
import { Shield, Layers, Flame, MapPin } from 'lucide-react';
import { gsap, ScrollTrigger, SplitText, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';

const REASONS = [
  { icon: Layers, title: 'Full-scope control', description: 'Site work, shell, interiors, and closeout under one accountable team. Less handoff noise. More control from first mobilization to turnover.' },
  { icon: Flame, title: 'Kitchen systems fluency', description: 'Restaurants and QSR work come with real pressure: hoods, grease, gas, make-up air, inspections, and brand timing. We already speak that language.' },
  { icon: Shield, title: 'Inspection-ready delivery', description: 'ADA, life safety, MEP coordination, occupancy, and punch discipline handled with the kind of preparation that keeps momentum.' },
  { icon: MapPin, title: 'Multi-state confidence', description: 'Georgia, South Carolina, and North Carolina coverage with local familiarity, fast-track experience, and a standard that carries from one site to the next.' },
];

/**
 * WhyRO — "BUILT DIFFERENT" Letter Construction.
 *
 * Desktop: Pinned scrub-linked sequence. Scaffolding rises, SplitText letters
 * scatter-to-bolt, gold line draws, cards build in sequence.
 *
 * Mobile: Auto-play on viewport entry. Header builds (~1.2s), then each card
 * gets its own ScrollTrigger for staggered entry as you scroll.
 *
 * SplitText is created INSIDE each matchMedia context for proper cleanup.
 */
export default function WhyRO() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scaffoldRef = useRef<HTMLDivElement>(null);
  const goldLineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !titleRef.current) return;

    const mm = gsap.matchMedia();

    // ═══════════════════════════════════════════════
    //  DESKTOP — Scrub-linked "BUILT DIFFERENT" sequence
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.desktop, () => {
      if (!spacerRef.current) return;

      // Set initial hidden states
      gsap.set([badgeRef.current, goldLineRef.current], { opacity: 0 });
      if (scaffoldRef.current) gsap.set(scaffoldRef.current, { opacity: 0 });
      const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      allCards.forEach(card => { gsap.set(card, { opacity: 0 }); });

      // SplitText inside context — auto-reverted when context changes
      const split = SplitText.create(titleRef.current!, { type: 'chars' });
      gsap.set(split.chars, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: spacerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          id: 'built-different',
        },
      });

      // Phase 1: Badge slides from left (0.00–0.03)
      tl.fromTo(badgeRef.current,
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.03, ease: 'power2.out' },
        0
      );

      // Phase 2: Scaffolding rises (0.03–0.05)
      if (scaffoldRef.current) {
        tl.fromTo(scaffoldRef.current,
          { scaleY: 0, transformOrigin: 'bottom center', opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 0.02, ease: 'power2.out' },
          0.03
        );
      }

      // Phase 3: Letters bolt into place (0.05–0.40)
      tl.fromTo(split.chars,
        {
          x: () => gsap.utils.random(-150, 150),
          y: () => gsap.utils.random(-120, 120),
          rotation: () => gsap.utils.random(-180, 180),
          scale: 0.3,
          opacity: 0,
        },
        {
          x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
          stagger: 0.02,
          ease: 'back.out(2)',
          duration: 0.35,
        },
        0.05
      );

      // Phase 4: Gold weld line draws (0.40–0.45)
      tl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.05, ease: 'power2.inOut' },
        0.40
      );

      // Phase 5: Scaffolding fades out (0.45–0.48)
      if (scaffoldRef.current) {
        tl.to(scaffoldRef.current,
          { opacity: 0, duration: 0.03, ease: 'power1.in' },
          0.45
        );
      }

      // Phase 6–9: Cards build in sequence (0.48–0.96)
      const CARD_STARTS = [0.48, 0.60, 0.72, 0.84];
      allCards.forEach((card, i) => {
        buildReasonCard(tl, card, CARD_STARTS[i]);
      });

      // Phase 10: All card bottom lines weld seal (0.96–1.00)
      allCards.forEach(card => {
        const bottomLine = card.querySelector('.reason-bottom-line');
        if (bottomLine) {
          tl.fromTo(bottomLine,
            { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
            { scaleX: 1, opacity: 1, duration: 0.04, ease: 'power2.inOut' },
            0.96
          );
        }
      });

      return () => { split.revert(); };
    });

    // ═══════════════════════════════════════════════
    //  MOBILE — Clean fade+rise, trigger when well in view
    //  Header keeps SplitText for "Built Different" wow factor,
    //  cards just fade up simply — no bolt/weld micro-animations
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.mobile, () => {
      const inFlipMode = !!sectionRef.current?.closest('.page-flip-slide');

      // Set initial hidden states
      gsap.set([badgeRef.current, goldLineRef.current], { opacity: 0 });
      if (scaffoldRef.current) gsap.set(scaffoldRef.current, { opacity: 0 });
      const allCards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      allCards.forEach(card => { gsap.set(card, { opacity: 0 }); });

      // SplitText inside mobile context
      const split = SplitText.create(titleRef.current!, { type: 'chars' });
      gsap.set(split.chars, { opacity: 0 });

      if (inFlipMode) {
        // FLIP MODE: entrance animation, paused until slide enters
        const entranceTl = gsap.timeline({ paused: true });

        entranceTl.fromTo(badgeRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
          0
        );

        entranceTl.fromTo(split.chars,
          {
            x: () => gsap.utils.random(-80, 80),
            y: () => gsap.utils.random(-60, 60),
            rotation: () => gsap.utils.random(-90, 90),
            scale: 0.4, opacity: 0,
          },
          {
            x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
            stagger: 0.04, ease: 'back.out(1.7)', duration: 0.6,
          },
          0.2
        );

        entranceTl.fromTo(goldLineRef.current,
          { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
          { scaleX: 1, opacity: 1, duration: 0.4, ease: 'power2.inOut' },
          1.0
        );

        entranceTl.fromTo(allCards,
          { y: 20, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
          1.2
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

        return () => {
          split.revert();
          window.removeEventListener('flipSlideEnter', handler);
        };
      }

      // ─── NORMAL MODE: Header auto-play — trigger at 65% ───
      const headerTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none none',
          id: 'whyro-header-mobile',
        },
      });

      // Badge fades up
      headerTl.fromTo(badgeRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        0
      );

      // Letters scatter-to-bolt (keep this — it's the signature effect)
      headerTl.fromTo(split.chars,
        {
          x: () => gsap.utils.random(-80, 80),
          y: () => gsap.utils.random(-60, 60),
          rotation: () => gsap.utils.random(-90, 90),
          scale: 0.4,
          opacity: 0,
        },
        {
          x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
          stagger: 0.04,
          ease: 'back.out(1.7)',
          duration: 0.6,
        },
        0.2
      );

      // Gold line draws
      headerTl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.4, ease: 'power2.inOut' },
        1.0
      );

      // ─── Cards: premium panel reveal with inner stagger ───
      allCards.forEach((card, i) => {
        const innerBits = card.querySelectorAll('.reason-icon, .reason-title, .reason-desc');
        if (innerBits.length) gsap.set(innerBits, { opacity: 0, y: 12 });

        gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 72%',
            toggleActions: 'play none none none',
            id: `whyro-card-${i}-mobile`,
          },
        })
          .fromTo(card,
            {
              y: 30,
              opacity: 0,
              scale: 0.97,
              clipPath: 'inset(12% 0% 0% 0%)',
              boxShadow: '0 0 0 rgba(201,168,76,0)',
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              clipPath: 'inset(0% 0% 0% 0%)',
              boxShadow: '0 16px 34px rgba(0,0,0,0.25), 0 0 20px rgba(201,168,76,0.06)',
              duration: 0.65,
              ease: 'power3.out',
            }
          )
          .fromTo(innerBits,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out' },
            0.12
          );
      });

      return () => { split.revert(); };
    });

  }, { scope: sectionRef });

  return (
    <div ref={spacerRef} className="relative lg:z-[20] lg:[height:280vh]">
    <section
      ref={sectionRef}
      className="bg-ro-black lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden"
    >
      <BlueprintGrid intensity="medium" animate={true} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-transparent to-ro-black pointer-events-none z-[1]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-4 sm:px-6 lg:h-screen lg:min-h-screen lg:px-8">
        {/* Header Area */}
        <div className="flex-shrink-0 pb-6 pt-20 text-left lg:pb-4 lg:text-center">
          {/* Badge */}
          <span
            ref={badgeRef}
            className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block"
          >
            Why serious buyers choose RO
          </span>

          {/* Title with scaffolding overlay */}
          <div className="relative inline-block">
            {/* Scaffolding grid — appears behind text, removed after letters bolt */}
            <div
              ref={scaffoldRef}
              className="absolute -inset-x-8 -inset-y-4 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(201,168,76,0.1) 18px, rgba(201,168,76,0.1) 19px),
                  repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(201,168,76,0.1) 18px, rgba(201,168,76,0.1) 19px)
                `,
              }}
              aria-hidden="true"
            />

            <h2
              ref={titleRef}
              className="relative text-ro-white font-heading text-4xl sm:text-5xl md:text-6xl tracking-tight uppercase leading-[1.1]"
            >
              Built to Be <span className="text-ro-gold">Chosen</span>
            </h2>
          </div>

          {/* Gold weld line */}
          <div
            ref={goldLineRef}
            className="mt-4 h-[2px] w-24 bg-ro-gold lg:mx-auto"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
          />
        </div>

        {/* Cards grid — single column on mobile to keep the pacing cinematic */}
        <div className="flex flex-1 items-start py-4 lg:items-center lg:py-0">
          <div className="mx-auto grid w-full max-w-xl grid-cols-1 gap-4 sm:gap-5 lg:max-w-6xl lg:grid-cols-4 lg:gap-6">
            {REASONS.map((reason, index) => (
              <div
                key={reason.title}
                ref={el => { cardRefs.current[index] = el; }}
                className="relative border border-ro-gray-800 bg-ro-black/80 p-5 sm:p-6 lg:bg-ro-black/60 lg:p-8 lg:backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.08),transparent_38%)] pointer-events-none" />
                <div className="absolute top-4 right-4 text-[11px] font-mono tracking-[0.28em] uppercase text-ro-gray-600">
                  0{index + 1}
                </div>
                {/* Corner bolt accents */}
                <div
                  className="reason-bolt absolute top-2 left-2 w-1.5 h-1.5 rounded-full hidden lg:block"
                  style={{ background: 'radial-gradient(circle, #D4B965, #8A7233)', boxShadow: '0 0 3px rgba(201,168,76,0.3)' }}
                />
                <div
                  className="reason-bolt absolute top-2 right-2 w-1.5 h-1.5 rounded-full hidden lg:block"
                  style={{ background: 'radial-gradient(circle, #D4B965, #8A7233)', boxShadow: '0 0 3px rgba(201,168,76,0.3)' }}
                />
                <div
                  className="reason-bolt absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full hidden lg:block"
                  style={{ background: 'radial-gradient(circle, #D4B965, #8A7233)', boxShadow: '0 0 3px rgba(201,168,76,0.3)' }}
                />
                <div
                  className="reason-bolt absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full hidden lg:block"
                  style={{ background: 'radial-gradient(circle, #D4B965, #8A7233)', boxShadow: '0 0 3px rgba(201,168,76,0.3)' }}
                />

                {/* Icon */}
                <div className="reason-icon w-10 h-10 sm:w-12 sm:h-12 border border-ro-gold/30 flex items-center justify-center text-ro-gold mb-3">
                  <reason.icon size={20} />
                </div>

                {/* Title */}
                <h3 className="reason-title text-ro-white font-heading text-base sm:text-base lg:text-lg tracking-wider uppercase mb-2">
                  {reason.title}
                </h3>

                {/* Description */}
                <p className="reason-desc text-ro-gray-500 text-sm sm:text-base leading-relaxed">
                  {reason.description}
                </p>

                {/* Bottom gold weld line */}
                <div
                  className="reason-bottom-line absolute bottom-0 left-0 right-0 h-[2px] bg-ro-gold"
                  style={{ transformOrigin: 'left center', boxShadow: '0 0 6px rgba(201,168,76,0.4)' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="flex-shrink-0 pb-8" />
      </div>
    </section>
    </div>
  );
}

/**
 * Builds a single reason card within the desktop scrub timeline.
 * Wall rises → bolts screw → icon bolts → title stamps → description pours.
 */
function buildReasonCard(tl: gsap.core.Timeline, card: HTMLDivElement, start: number) {
  const bolts = card.querySelectorAll('.reason-bolt');
  const icon = card.querySelector('.reason-icon');
  const title = card.querySelector('.reason-title');
  const desc = card.querySelector('.reason-desc');

  // Card panel wall rises — clipPath from bottom
  tl.fromTo(card,
    { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
    { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.04, ease: 'power3.out' },
    start
  );

  // Corner bolts screw in
  if (bolts.length) {
    tl.fromTo(bolts,
      { scale: 0, rotation: 180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.015, stagger: 0.004, ease: 'back.out(2)' },
      start + 0.03
    );
  }

  // Icon bolts in — scale 0→1, rotation -90→0
  if (icon) {
    tl.fromTo(icon,
      { scale: 0, rotation: -90, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.025, ease: 'back.out(2)' },
      start + 0.05
    );
  }

  // Title stamps — scaleY 0→1 from top (mechanical press)
  if (title) {
    tl.fromTo(title,
      { scaleY: 0, transformOrigin: 'top center', opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.02, ease: 'elastic.out(0.5, 0.3)' },
      start + 0.07
    );
  }

  // Description pours — clipPath from bottom, y 15→0
  if (desc) {
    tl.fromTo(desc,
      { clipPath: 'inset(100% 0% 0% 0%)', y: 15, opacity: 0 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.025, ease: 'power2.out' },
      start + 0.09
    );
  }
}
