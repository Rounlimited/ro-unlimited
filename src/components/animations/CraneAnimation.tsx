'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/animations/GSAPProvider';

interface CraneAnimationProps {
  children?: React.ReactNode;
  scrollDistance?: string;
  className?: string;
}

/**
 * The Crane — centerpiece scroll-driven animation.
 * One timeline, one ScrollTrigger (scrub-linked).
 * Uses fromTo() for every tween — explicit start/end, no immediateRender issues.
 *
 * Sequence:
 * 1. Tower rises with lattice sections stacking (0%–20%)
 * 2. Jib arm swings out from tower top (20%–35%)
 * 3. Cable extends from jib tip (35%–55%)
 * 4. Hook descends with content panel (55%–80%)
 * 5. Content lands, cable retracts, crane fades (80%–100%)
 */
export default function CraneAnimation({
  children,
  scrollDistance = '+=150%',
  className = '',
}: CraneAnimationProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const towerRef = useRef<SVGGElement>(null);
  const jibRef = useRef<SVGGElement>(null);
  const cableRef = useRef<SVGLineElement>(null);
  const hookRef = useRef<SVGGElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration guard — render crane SVG only on client
  useEffect(() => { setMounted(true); }, []);

  // ─── useGSAP: single scrub timeline, auto-cleanup ───
  useGSAP(() => {
    if (!mounted || !sectionRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: scrollDistance,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        id: 'crane-sequence',
      },
    });

    // Phase 1: Tower rises (0%–20%)
    if (towerRef.current) {
      tl.fromTo(towerRef.current,
        { scaleY: 0, transformOrigin: 'bottom center' },
        { scaleY: 1, duration: 0.2, ease: 'power2.out' },
        0
      );
    }

    // Phase 2: Jib arm swings out (20%–35%)
    if (jibRef.current) {
      tl.fromTo(jibRef.current,
        { rotation: -90, transformOrigin: '200px 122px', opacity: 0 },
        { rotation: 0, opacity: 1, duration: 0.15, ease: 'power2.out' },
        0.2
      );
    }

    // Phase 3: Cable extends (35%–55%)
    if (cableRef.current) {
      tl.fromTo(cableRef.current,
        { scaleY: 0, transformOrigin: 'top center' },
        { scaleY: 1, duration: 0.2, ease: 'none' },
        0.35
      );
    }

    // Phase 4: Hook descends with content (55%–80%)
    if (hookRef.current) {
      tl.fromTo(hookRef.current,
        { y: -200, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.25, ease: 'power1.inOut' },
        0.55
      );
    }
    if (contentRef.current) {
      tl.fromTo(contentRef.current,
        { y: -150, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 0.9, duration: 0.25, ease: 'power1.inOut' },
        0.55
      );
    }

    // Phase 5: Content lands, hook releases (80%–100%)
    if (contentRef.current) {
      tl.to(contentRef.current,
        { scale: 1, duration: 0.1, ease: 'elastic.out(0.5, 0.3)' },
        0.8
      );
    }
    if (cableRef.current) {
      tl.to(cableRef.current,
        { scaleY: 0, transformOrigin: 'top center', duration: 0.1, ease: 'power2.in' },
        0.85
      );
    }
    if (towerRef.current && jibRef.current) {
      tl.to([towerRef.current, jibRef.current],
        { opacity: 0.15, duration: 0.1 },
        0.9
      );
    }

  }, { scope: sectionRef, dependencies: [mounted, scrollDistance] });

  // Server placeholder — no crane on SSR
  if (!mounted) {
    return (
      <div className={`relative min-h-screen overflow-hidden ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div ref={sectionRef} className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url('/images/svg/blueprint-grid.svg')`,
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
          opacity: 0.06,
        }}
        aria-hidden="true"
      />

      {/* Inline SVG Crane — parts separated for individual GSAP control */}
      <svg
        className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-[300px] sm:max-w-[400px]"
        viewBox="0 0 400 600"
        style={{ height: '80vh', maxHeight: 600 }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cgold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#A88A3D' }} />
            <stop offset="50%" style={{ stopColor: '#C9A84C' }} />
            <stop offset="100%" style={{ stopColor: '#D4B965' }} />
          </linearGradient>
        </defs>

        {/* Tower */}
        <g ref={towerRef}>
          <rect x="140" y="570" width="120" height="12" rx="1" fill="#C9A84C" opacity="0.8" />
          <rect x="135" y="580" width="30" height="8" rx="1" fill="#C9A84C" opacity="0.5" />
          <rect x="235" y="580" width="30" height="8" rx="1" fill="#C9A84C" opacity="0.5" />
          <line x1="185" y1="570" x2="185" y2="120" stroke="#C9A84C" strokeWidth="2" />
          <line x1="215" y1="570" x2="215" y2="120" stroke="#C9A84C" strokeWidth="2" />
          {Array.from({ length: 11 }).map((_, i) => {
            const y1 = 570 - i * 40;
            const y2 = y1 - 40;
            return (
              <g key={i}>
                <line x1="185" y1={y1} x2="215" y2={y2} stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" />
                <line x1="215" y1={y1} x2="185" y2={y2} stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" />
                <line x1="185" y1={y2} x2="215" y2={y2} stroke="#C9A84C" strokeWidth="0.6" opacity="0.3" />
              </g>
            );
          })}
          <rect x="182" y="118" width="36" height="8" rx="1" fill="url(#cgold)" />
        </g>

        {/* Jib Arm */}
        <g ref={jibRef}>
          <line x1="200" y1="122" x2="370" y2="108" stroke="#C9A84C" strokeWidth="2" />
          <line x1="200" y1="130" x2="370" y2="116" stroke="#C9A84C" strokeWidth="1" opacity="0.5" />
          <line x1="200" y1="118" x2="200" y2="95" stroke="#C9A84C" strokeWidth="1.5" />
          <line x1="200" y1="95" x2="370" y2="108" stroke="#C9A84C" strokeWidth="0.6" opacity="0.4" />
          <polygon points="196,95 204,95 200,83" fill="url(#cgold)" />
          <line x1="200" y1="122" x2="145" y2="118" stroke="#C9A84C" strokeWidth="1.5" />
          <rect x="133" y="116" width="14" height="12" rx="1" fill="#C9A84C" opacity="0.6" />
          <circle cx="370" cy="112" r="3" fill="none" stroke="#C9A84C" strokeWidth="1" />
        </g>

        {/* Cable */}
        <line
          ref={cableRef}
          x1="370" y1="115" x2="370" y2="380"
          stroke="#C9A84C" strokeWidth="1" strokeDasharray="3,2" opacity="0.7"
        />

        {/* Hook */}
        <g ref={hookRef}>
          <rect x="364" y="375" width="12" height="8" rx="1.5" fill="#C9A84C" opacity="0.7" />
          <path
            d="M370,383 L370,396 Q370,404 365,404 Q359,404 359,397 L359,394"
            fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Content panel — "lowered" by crane */}
      <div
        ref={contentRef}
        className="absolute left-1/2 -translate-x-1/2 bottom-[15%] w-[90%] max-w-md"
      >
        {children}
      </div>
    </div>
  );
}
