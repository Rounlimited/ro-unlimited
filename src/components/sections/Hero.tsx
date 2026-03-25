'use client';

import { useRef, useCallback } from 'react';
import { COMPANY, TRUST_STATS } from '@/lib/constants';
import { gsap, SplitText, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';
import HeroVideo from '@/components/sections/HeroVideo';
import CountUp from '@/components/animations/CountUp';
import { CINEMATIC_MOTION, EASES, TIMING } from '@/lib/gsap-config';

/**
 * HERO — Desktop: pinned scrub-linked construction sequence.
 * Mobile: ROLoader splash ends → video plays 2s → build sequence fires bottom-to-top:
 *   Description panel → Gold line → headline build → badge.
 *   Stats: ScrollTrigger on scroll.
 *
 * Nothing plays until window dispatches 'ro:site-ready'.
 */
interface HeroProps {
  heroVideoUrl?: string | null;
}

export default function Hero({ heroVideoUrl }: HeroProps) {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const ambientLeftRef = useRef<HTMLDivElement>(null);
  const ambientRightRef = useRef<HTMLDivElement>(null);
  const ambientBottomRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const badgeRef     = useRef<HTMLDivElement>(null);
  const line1Ref     = useRef<HTMLSpanElement>(null);
  const line2Ref     = useRef<HTMLSpanElement>(null);
  const line3Ref     = useRef<HTMLSpanElement>(null);
  const goldLineRef  = useRef<HTMLDivElement>(null);
  const contentDeckRef = useRef<HTMLDivElement>(null);
  const descRef      = useRef<HTMLParagraphElement>(null);
  const statsRef     = useRef<HTMLDivElement>(null);
  const spacerRef    = useRef<HTMLDivElement>(null);

  // Mobile timeline stored here, played when video signals ready
  const mobileTlRef   = useRef<gsap.core.Timeline | null>(null);
  const tlReadyRef    = useRef(false);
  const videoFiredRef = useRef(false);

  // Called by HeroVideo after 2s of play (or immediately if no video)
  const handleVideoReady = useCallback(() => {
    if (tlReadyRef.current && mobileTlRef.current) {
      mobileTlRef.current.play();
    } else {
      videoFiredRef.current = true;
    }
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();
    const verticalLines = sectionRef.current.querySelectorAll('.hero-grid-v');
    const horizontalLines = sectionRef.current.querySelectorAll('.hero-grid-h');

    gsap.set(
      [ambientLeftRef.current, ambientRightRef.current, ambientBottomRef.current, shimmerRef.current].filter(Boolean),
      { opacity: 0, scale: 0.88 }
    );

    if (ambientLeftRef.current) {
      gsap.to(ambientLeftRef.current, {
        xPercent: 10,
        yPercent: -8,
        scale: 1.08,
        duration: TIMING.ambient,
        repeat: -1,
        yoyo: true,
        ease: EASES.ambientFloat,
      });
    }

    if (ambientRightRef.current) {
      gsap.to(ambientRightRef.current, {
        xPercent: -8,
        yPercent: 10,
        scale: 1.05,
        duration: TIMING.ambient + 1,
        repeat: -1,
        yoyo: true,
        ease: EASES.ambientFloat,
      });
    }

    if (ambientBottomRef.current) {
      gsap.to(ambientBottomRef.current, {
        xPercent: 6,
        yPercent: -10,
        scale: 1.12,
        duration: TIMING.ambient + 2,
        repeat: -1,
        yoyo: true,
        ease: EASES.ambientFloat,
      });
    }

    if (shimmerRef.current) {
      gsap.fromTo(shimmerRef.current,
        { xPercent: -120, opacity: 0, scale: 1 },
        {
          xPercent: 120,
          opacity: 0.55,
          duration: 2.4,
          ease: EASES.chapterSweep,
          repeat: -1,
          repeatDelay: 3.5,
        }
      );
    }

    // ═══════════════════════════════════════════════════════
    // DESKTOP — Same entrance sequence as mobile:
    // ROLoader splash → video plays 2s → build sequence fires
    // ═══════════════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.desktop, () => {
      // Hide everything initially
      gsap.set([badgeRef.current, line2Ref.current, goldLineRef.current], { opacity: 0 });
      if (contentDeckRef.current) gsap.set(contentDeckRef.current, CINEMATIC_MOTION.chapterPanel.from);
      if (verticalLines.length) gsap.set(verticalLines, { scaleY: 0, opacity: 0, transformOrigin: 'center top' });
      if (horizontalLines.length) gsap.set(horizontalLines, { scaleX: 0, opacity: 0, transformOrigin: 'left center' });

      // SplitText mask reveal
      const split3 = SplitText.create(line3Ref.current!, { type: 'chars', mask: 'chars' });
      const split1 = SplitText.create(line1Ref.current!, { type: 'chars', mask: 'chars' });
      gsap.set([split3.chars, split1.chars], { y: '110%', willChange: 'transform' });

      const splitDesc = SplitText.create(descRef.current!, { type: 'lines', mask: 'lines' });
      gsap.set(splitDesc.lines, { y: '100%' });

      // Build PAUSED — played by handleVideoReady
      const tl = gsap.timeline({ paused: true });
      mobileTlRef.current = tl;
      tlReadyRef.current = true;

      tl.fromTo([ambientLeftRef.current, ambientRightRef.current, ambientBottomRef.current].filter(Boolean),
        CINEMATIC_MOTION.ambientBloom.from,
        {
          ...CINEMATIC_MOTION.ambientBloom.to,
          opacity: (_index, target) => target === ambientBottomRef.current ? 0.72 : 1,
          stagger: 0.08,
        },
        0
      );

      tl.fromTo(badgeRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        0.12
      );

      if (shimmerRef.current) {
        tl.to(shimmerRef.current, { opacity: 0.45, duration: 0.5, ease: EASES.chapterSweep }, 0.18);
      }

      // Headline choreography
      tl.fromTo(split1.chars,
        { y: '-110%' },
        { y: '0%', stagger: { each: 0.025, from: 'center' }, duration: 0.45, ease: 'back.out(1.5)' },
        0.34
      );

      tl.fromTo(line2Ref.current,
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
        0.62
      );

      tl.fromTo(split3.chars,
        { y: '110%' },
        { y: '0%', stagger: 0.02, duration: 0.45, ease: 'back.out(1.2)' },
        0.82
      );

      tl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.inOut' },
        1.05
      );

      if (verticalLines.length) {
        tl.fromTo(verticalLines,
          { scaleY: 0, opacity: 0, transformOrigin: 'center top' },
          { scaleY: 1, opacity: 0.18, duration: 0.35, stagger: 0.03, ease: 'power2.out' },
          1.08
        );
      }

      if (horizontalLines.length) {
        tl.fromTo(horizontalLines,
          { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
          { scaleX: 1, opacity: 0.18, duration: 0.35, stagger: 0.03, ease: 'power2.out' },
          1.12
        );
      }

      if (contentDeckRef.current) {
        tl.fromTo(contentDeckRef.current, CINEMATIC_MOTION.chapterPanel.from, {
          ...CINEMATIC_MOTION.chapterPanel.to,
          duration: 0.78,
        }, 1.2);
      }

      tl.fromTo(splitDesc.lines,
        { y: '100%' },
        { y: '0%', stagger: 0.08, duration: 0.5, ease: 'power3.out' },
        1.28
      );

      tl.call(() => {
        gsap.set([split3.chars, split1.chars], { willChange: 'auto' });
      });

      // If video already fired before tl was ready, play now
      if (videoFiredRef.current) {
        tl.play();
      }

      // Stats: same concrete pour as mobile
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
              id: 'hero-stats-desktop',
            },
          }
        );
      }

      return () => {
        split1.revert();
        split3.revert();
        splitDesc.revert();
      };
    });

    // ═══════════════════════════════════════════════════════
    // MOBILE — Paused until HeroVideo fires onReady (2s after video plays)
    //          which itself only plays after 'ro:site-ready' fires
    // ═══════════════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.mobile, () => {
      // Hide everything initially
      gsap.set([badgeRef.current, line2Ref.current, goldLineRef.current], { opacity: 0 });
      if (contentDeckRef.current) gsap.set(contentDeckRef.current, CINEMATIC_MOTION.chapterPanel.from);
      if (verticalLines.length) gsap.set(verticalLines, { scaleY: 0, opacity: 0, transformOrigin: 'center top' });
      if (horizontalLines.length) gsap.set(horizontalLines, { scaleX: 0, opacity: 0, transformOrigin: 'left center' });

      // SplitText mask reveal — agency-standard char animation
      const split3 = SplitText.create(line3Ref.current!, { type: 'chars', mask: 'chars' });
      const split1 = SplitText.create(line1Ref.current!, { type: 'chars', mask: 'chars' });
      gsap.set([split3.chars, split1.chars], { y: '110%', willChange: 'transform' });

      const splitDesc = SplitText.create(descRef.current!, { type: 'lines', mask: 'lines' });
      gsap.set(splitDesc.lines, { y: '100%' });

      // Build PAUSED — played by handleVideoReady
      const tl = gsap.timeline({ paused: true });
      mobileTlRef.current = tl;
      tlReadyRef.current = true;

      tl.fromTo([ambientLeftRef.current, ambientRightRef.current, ambientBottomRef.current].filter(Boolean),
        CINEMATIC_MOTION.ambientBloom.from,
        {
          ...CINEMATIC_MOTION.ambientBloom.to,
          opacity: (_index, target) => target === ambientBottomRef.current ? 0.78 : 1,
          stagger: 0.08,
        },
        0
      );

      tl.fromTo(badgeRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        0.1
      );

      if (shimmerRef.current) {
        tl.to(shimmerRef.current, { opacity: 0.5, duration: 0.45, ease: EASES.chapterSweep }, 0.2);
      }

      tl.fromTo(split1.chars,
        { y: '-110%' },
        { y: '0%', stagger: { each: 0.025, from: 'center' }, duration: 0.45, ease: 'back.out(1.5)' },
        0.32
      );

      tl.fromTo(line2Ref.current,
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
        0.58
      );

      tl.fromTo(split3.chars,
        { y: '110%' },
        { y: '0%', stagger: 0.02, duration: 0.45, ease: 'back.out(1.2)' },
        0.78
      );

      tl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.inOut' },
        0.98
      );

      if (verticalLines.length) {
        tl.fromTo(verticalLines,
          { scaleY: 0, opacity: 0, transformOrigin: 'center top' },
          { scaleY: 1, opacity: 0.2, duration: 0.35, stagger: 0.03, ease: 'power2.out' },
          1.02
        );
      }

      if (horizontalLines.length) {
        tl.fromTo(horizontalLines,
          { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
          { scaleX: 1, opacity: 0.2, duration: 0.35, stagger: 0.03, ease: 'power2.out' },
          1.08
        );
      }

      if (contentDeckRef.current) {
        tl.fromTo(contentDeckRef.current, CINEMATIC_MOTION.chapterPanel.from, {
          ...CINEMATIC_MOTION.chapterPanel.to,
          duration: 0.74,
        }, 1.16);
      }

      tl.fromTo(splitDesc.lines,
        { y: '100%' },
        { y: '0%', stagger: 0.08, duration: 0.5, ease: 'power3.out' },
        1.22
      );

      tl.call(() => {
        gsap.set([split3.chars, split1.chars], { willChange: 'auto' });
      });

      // If video already fired before tl was ready, play now
      if (videoFiredRef.current) {
        tl.play();
      }

      // Stats: concrete pour from bottom, stagger from edges
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

  const parseStatValue = (val: string): { num: number; suffix: string } => {
    const match = val.match(/^(\d+)(.*)$/);
    if (match) return { num: parseInt(match[1]), suffix: match[2] };
    return { num: 0, suffix: val };
  };

  return (
    <div ref={spacerRef} className="relative">
      <section ref={sectionRef} className="flex min-h-[100svh] items-center justify-start overflow-hidden bg-ro-black pt-20 lg:min-h-screen lg:justify-center">

        {/* Blueprint grid */}
        <BlueprintGrid intensity="low" animate={true} />

        {/* Hero video — waits for ro:site-ready, then fires onReady after 2s */}
        <HeroVideo videoUrl={heroVideoUrl || null} onReady={handleVideoReady} />

        {/* Structural lines */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="hero-grid-v absolute left-[10%] top-0 bottom-0 w-px bg-ro-gold" />
          <div className="hero-grid-v absolute left-[30%] top-0 bottom-0 w-px bg-ro-gold" />
          <div className="hero-grid-v absolute left-[70%] top-0 bottom-0 w-px bg-ro-gold" />
          <div className="hero-grid-v absolute left-[90%] top-0 bottom-0 w-px bg-ro-gold" />
          <div className="hero-grid-h absolute top-[20%] left-0 right-0 h-px bg-ro-gold" />
          <div className="hero-grid-h absolute top-[50%] left-0 right-0 h-px bg-ro-gold" />
          <div className="hero-grid-h absolute top-[80%] left-0 right-0 h-px bg-ro-gold" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-ro-black/88 via-ro-black/62 to-ro-black/88 lg:bg-gradient-to-b lg:from-ro-black/80 lg:via-ro-black/60 lg:to-ro-black/80" />
        <div className="absolute inset-0 z-[2] lg:hidden" style={{ background: 'linear-gradient(to right, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.88) 34%, rgba(8,8,8,0.52) 62%, rgba(8,8,8,0.10) 100%)' }} />
        <div ref={ambientLeftRef} className="absolute left-[-18%] top-[10%] z-[1] h-[280px] w-[280px] rounded-full bg-ro-gold/18 blur-3xl pointer-events-none lg:left-[-10%] lg:top-[12%] lg:h-[220px] lg:w-[220px] lg:bg-ro-gold/10" />
        <div ref={ambientRightRef} className="absolute right-[-18%] top-[26%] z-[1] h-[260px] w-[260px] rounded-full bg-cyan-400/16 blur-3xl pointer-events-none lg:right-[-12%] lg:top-[30%] lg:h-[260px] lg:w-[260px] lg:bg-cyan-400/10" />
        <div ref={ambientBottomRef} className="absolute left-[4%] bottom-[8%] z-[1] h-[240px] w-[240px] rounded-full bg-fuchsia-500/12 blur-3xl pointer-events-none lg:hidden" />
        <div ref={shimmerRef} className="absolute inset-y-0 left-[-10%] z-[3] w-1/2 lg:w-1/3 bg-gradient-to-r from-transparent via-ro-gold/18 to-transparent mix-blend-screen pointer-events-none" />

        <div className="relative z-[10] mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <div className="max-w-[470px] text-left lg:max-w-none lg:text-center">

            {/* Badge */}
            <div ref={badgeRef} className="mb-8 inline-flex items-center gap-2 self-start border border-ro-gold/20 bg-ro-gold/5 px-4 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] lg:self-center">
              <span className="w-2 h-2 bg-ro-gold rounded-full" />
              <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">
                {COMPANY.experience} Years. Still Raising the Standard.
              </span>
            </div>

            {/* Heading — builds bottom to top */}
            <h1>
              <span ref={line1Ref} className="block text-ro-white font-heading text-[3.2rem] sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.88] mb-3 lg:mb-4">
                We Build
              </span>
              <span ref={line2Ref} className="block gradient-text-gold font-heading text-[3.2rem] sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.88] mb-3 lg:mb-4">
                What Lasts
              </span>
              <span ref={line3Ref} className="block text-ro-white font-heading text-[2.05rem] sm:text-4xl md:text-5xl tracking-[0.12em] uppercase leading-[0.92]">
                From the Ground Up
              </span>
            </h1>

            {/* Gold welding line */}
            <div ref={goldLineRef} className="my-8 w-32 h-[2px] bg-ro-gold lg:mx-auto"
              style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4), 0 0 16px rgba(201,168,76,0.2)' }}
            />

            <div ref={contentDeckRef} className="relative mb-12 overflow-hidden border border-ro-gold/14 bg-gradient-to-br from-ro-black/72 via-ro-black/56 to-ro-black/30 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.24)] lg:mx-auto lg:max-w-3xl lg:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/45 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.12),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.02))]" />

              {/* Description */}
              <p ref={descRef} className="relative max-w-md pr-2 text-[1.05rem] font-body leading-relaxed text-ro-gray-300 sm:text-xl lg:mx-auto lg:max-w-2xl lg:px-1">
                Ground-up retail, restaurant, financial, industrial, and site-driven work delivered with the control buyers trust and the finish people notice. Across Georgia, South Carolina, and North Carolina, RO brings schedule, systems, and standards under one roof.
              </p>
            </div>

            {/* Trust Stats */}
            <div ref={statsRef} className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-8 max-w-md lg:max-w-3xl lg:mx-auto">
              {TRUST_STATS.map((stat) => {
                const { num, suffix } = parseStatValue(stat.value);
                return (
                  <div key={stat.label} className="text-center border border-ro-gold/10 bg-ro-black/30 backdrop-blur-md px-3 py-4 shadow-[0_10px_26px_rgba(0,0,0,0.18)]">
                    <div className="text-ro-gold font-heading text-3xl sm:text-4xl mb-1">
                      <CountUp end={num} suffix={suffix} duration={2} />
                    </div>
                    <div className="text-ro-gray-500 text-[11px] sm:text-xs tracking-wider uppercase font-body leading-snug px-1">{stat.label}</div>
                    <div className="mx-auto mt-3 h-px w-8 bg-gradient-to-r from-transparent via-ro-gold/50 to-transparent" />
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
