'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';

interface SectionTransitionProps {
  /** Label stamped on the beam, e.g. "FLOOR 01" */
  label?: string;
  /** Show welding spark bursts at endpoints */
  sparks?: boolean;
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
  sparks = false,
  className = '',
}: SectionTransitionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const sparkLeftRef = useRef<HTMLDivElement>(null);
  const sparkRightRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current || !beamRef.current) return;

    // Set initial hidden states
    gsap.set(beamRef.current, { opacity: 0 });
    if (labelRef.current) gsap.set(labelRef.current, { opacity: 0 });
    if (scanRef.current) gsap.set(scanRef.current, { opacity: 0, xPercent: -120 });

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

    // Beam resolves in with a cleaner engineered sweep
    tl.fromTo(beamRef.current,
      { y: 24, opacity: 0, scaleX: 0.92, filter: 'blur(6px)' },
      { y: 0, opacity: 1, scaleX: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' },
      0
    );

    if (scanRef.current) {
      tl.fromTo(scanRef.current,
        { opacity: 0, xPercent: -120 },
        { opacity: 0.75, xPercent: 120, duration: 0.6, ease: 'power2.inOut' },
        0.18
      ).to(scanRef.current, { opacity: 0, duration: 0.12, ease: 'power1.out' }, '>-0.08');
    }

    // Label resolves after the sweep
    if (labelRef.current) {
      tl.fromTo(labelRef.current,
        { y: 10, opacity: 0, letterSpacing: '0.45em' },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        0.34
      );
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
      className={`relative py-4 sm:py-6 overflow-hidden ${className}`}
    >
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
            className="absolute inset-0 flex items-center justify-center font-heading text-xs sm:text-sm tracking-[0.3em] uppercase text-ro-black/60"
            style={{ textShadow: '0 0 4px rgba(201,168,76,0.3)' }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Welding sparks — left endpoint */}
      {sparks && (
        <div
          ref={sparkLeftRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
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
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
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
