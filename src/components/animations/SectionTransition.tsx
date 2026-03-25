'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';
import { CINEMATIC_MOTION, EASES, TIMING } from '@/lib/gsap-config';

interface SectionTransitionProps {
  /** Label stamped on the beam, e.g. "FLOOR 01" */
  label?: string;
  /** Chapter title shown in the mobile interstitial */
  title?: string;
  /** Supporting copy for the chapter handoff */
  subtitle?: string;
  /** Show welding spark bursts at endpoints */
  sparks?: boolean;
  /** First transition gets a more cinematic mobile treatment */
  featured?: boolean;
  className?: string;
}

/**
 * SectionTransition — I-beam structural connector between sections.
 *
 * Scroll-triggered (not pinned). Beam drops from above with bounce,
 * label stamps in, welding sparks burst at both endpoints.
 *
 * Uses fromTo() for every tween. useGSAP for auto-cleanup.
 */
export default function SectionTransition({
  label,
  title,
  subtitle,
  sparks = false,
  featured = false,
  className = '',
}: SectionTransitionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const sparkLeftRef = useRef<HTMLDivElement>(null);
  const sparkRightRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current || !beamRef.current || !panelRef.current) return;

    // Set initial hidden states
    gsap.set(panelRef.current, CINEMATIC_MOTION.chapterPanel.from);
    gsap.set(beamRef.current, { opacity: 0 });
    if (labelRef.current) gsap.set(labelRef.current, { opacity: 0 });
    if (scanRef.current) gsap.set(scanRef.current, { opacity: 0, xPercent: -120 });
    if (glowRef.current) gsap.set(glowRef.current, { opacity: 0, scale: 0.82 });
    if (pulseRef.current) gsap.set(pulseRef.current, { opacity: featured ? 0.3 : 0, scale: 0.72 });
    if (titleRef.current) gsap.set(titleRef.current, CINEMATIC_MOTION.chapterCopy.from);
    if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 0, y: 16 });

    const sparkEls = [
      ...Array.from(sparkLeftRef.current?.querySelectorAll('.spark-dot') || []),
      ...Array.from(sparkRightRef.current?.querySelectorAll('.spark-dot') || []),
    ];
    if (sparkEls.length) gsap.set(sparkEls, { opacity: 0, scale: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
        id: label ? `transition-${label.replace(/\s/g, '-').toLowerCase()}` : 'section-transition',
      },
    });

    tl.fromTo(panelRef.current, CINEMATIC_MOTION.chapterPanel.from, CINEMATIC_MOTION.chapterPanel.to, 0);

    if (glowRef.current) {
      tl.fromTo(glowRef.current,
        CINEMATIC_MOTION.ambientBloom.from,
        {
          ...CINEMATIC_MOTION.ambientBloom.to,
          opacity: featured ? 0.95 : 0.65,
        },
        0.02
      );
    }

    // Beam resolves in with a cleaner engineered sweep
    tl.fromTo(beamRef.current,
      { y: 24, opacity: 0, scaleX: 0.92, filter: 'blur(6px)' },
      { y: 0, opacity: 1, scaleX: 1, filter: 'blur(0px)', duration: TIMING.chapter, ease: EASES.chapterReveal },
      0.08
    );

    if (scanRef.current) {
      tl.fromTo(scanRef.current,
        { opacity: 0, xPercent: -120 },
        { opacity: featured ? 0.9 : 0.75, xPercent: 120, duration: 0.7, ease: EASES.chapterSweep },
        0.22
      ).to(scanRef.current, { opacity: 0, duration: 0.14, ease: 'power1.out' }, '>-0.1');
    }

    // Label resolves after the sweep
    if (labelRef.current) {
      tl.fromTo(labelRef.current,
        { y: 10, opacity: 0, letterSpacing: '0.45em' },
        { y: 0, opacity: 1, duration: TIMING.fast, ease: EASES.chapterReveal },
        0.42
      );
    }

    if (titleRef.current) {
      tl.fromTo(titleRef.current, CINEMATIC_MOTION.chapterCopy.from, CINEMATIC_MOTION.chapterCopy.to, 0.36);
    }

    if (subtitleRef.current) {
      tl.fromTo(subtitleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: TIMING.normal, ease: EASES.chapterReveal },
        0.48
      );
    }

    if (pulseRef.current && featured) {
      tl.fromTo(pulseRef.current,
        { opacity: 0, scale: 0.72 },
        { opacity: 0.5, scale: 1, duration: TIMING.chapterSlow, ease: EASES.chapterReveal },
        0.18
      );

      tl.call(() => {
        gsap.to(pulseRef.current, {
          opacity: 0.2,
          scale: 1.08,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: EASES.ambientFloat,
        });
      });
    }

    // Welding sparks burst at endpoints
    if (sparks && sparkEls.length) {
      sparkEls.forEach((spark, i) => {
        const angle = (i % 6) / 6 * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const distance = 12 + Math.random() * 25;
        const toX = Math.cos(angle) * distance;
        const toY = Math.sin(angle) * distance - 10;

        tl.fromTo(spark,
          { x: 0, y: 0, scale: 1, opacity: 1 },
          {
            x: toX, y: toY, scale: 0, opacity: 0,
            duration: 0.3 + Math.random() * 0.3,
            ease: 'power2.out',
          },
          0.7 + Math.random() * 0.05
        );
      });
    }

  }, { scope: wrapperRef });

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden bg-ro-black px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-5 ${className}`}
    >
      <div
        ref={panelRef}
        className={`relative mx-auto max-w-6xl overflow-hidden border border-ro-gold/15 bg-ro-black/82 backdrop-blur-sm ${featured ? 'min-h-[36vh] sm:min-h-[32vh]' : 'min-h-[28vh] sm:min-h-[24vh]'} lg:min-h-0`}
      >
        <div ref={glowRef} className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ro-gold/25 to-transparent" />
        <div ref={pulseRef} className="pointer-events-none absolute right-[-12%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-ro-gold/20 bg-ro-gold/10 blur-2xl lg:hidden" />

        <div className="relative z-10 flex min-h-full flex-col justify-center gap-6 px-5 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-7">
          {/* I-Beam */}
          <div
            ref={beamRef}
            className="relative w-full"
            style={{ height: 40 }}
          >
            <img
              src="/images/svg/i-beam.svg"
              alt=""
              className="w-full h-full object-cover"
              aria-hidden="true"
            />
            <div
              ref={scanRef}
              className="absolute top-0 bottom-0 w-1/4 bg-gradient-to-r from-transparent via-ro-gold/50 to-transparent mix-blend-screen pointer-events-none"
            />

            {/* Stamped label */}
            {label && (
              <span
                ref={labelRef}
                className="absolute inset-0 flex items-center justify-center font-heading text-[10px] sm:text-xs tracking-[0.34em] uppercase text-ro-black/60"
                style={{ textShadow: '0 0 4px rgba(201,168,76,0.3)' }}
              >
                {label}
              </span>
            )}
          </div>

          {(title || subtitle) && (
            <div className="max-w-3xl">
              {title && (
                <h2 ref={titleRef} className={`font-heading uppercase tracking-tight text-ro-white ${featured ? 'text-3xl sm:text-4xl lg:text-3xl' : 'text-2xl sm:text-3xl lg:text-2xl'}`}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p ref={subtitleRef} className="mt-3 max-w-2xl text-sm leading-relaxed text-ro-gray-400 sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Welding sparks — left endpoint */}
      {sparks && (
        <div
          ref={sparkLeftRef}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none sm:left-6 lg:left-8"
          style={{ width: 30, height: 30 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`l-${i}`}
              className="spark-dot absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 2 + Math.random() * 2,
                height: 2 + Math.random() * 2,
                background: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#F5E6A3' : '#C9A84C',
                boxShadow: '0 0 4px rgba(201,168,76,0.5)',
              }}
            />
          ))}
        </div>
      )}

      {/* Welding sparks — right endpoint */}
      {sparks && (
        <div
          ref={sparkRightRef}
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none sm:right-6 lg:right-8"
          style={{ width: 30, height: 30 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`r-${i}`}
              className="spark-dot absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 2 + Math.random() * 2,
                height: 2 + Math.random() * 2,
                background: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#F5E6A3' : '#C9A84C',
                boxShadow: '0 0 4px rgba(201,168,76,0.5)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
