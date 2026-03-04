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
  const sparkLeftRef = useRef<HTMLDivElement>(null);
  const sparkRightRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current || !beamRef.current) return;

    // Set initial hidden states
    gsap.set(beamRef.current, { opacity: 0 });
    if (labelRef.current) gsap.set(labelRef.current, { opacity: 0 });

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

    // Beam drops from above with bounce
    tl.fromTo(beamRef.current,
      { y: -80, rotation: -2, opacity: 0 },
      { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: 'bounce.out' },
      0
    );

    // Label stamps in after beam lands
    if (labelRef.current) {
      tl.fromTo(labelRef.current,
        { scaleY: 0, transformOrigin: 'center center', opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' },
        0.5
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
