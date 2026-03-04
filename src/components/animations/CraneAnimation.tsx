'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';

interface CraneAnimationProps {
  children?: React.ReactNode;
  scrollDistance?: string;
  className?: string;
}

/**
 * The Crane — centerpiece scroll-driven animation.
 *
 * Desktop: Scrub-linked crane assembly. Tower rises, jib swings, cable extends,
 * hook lowers content panel into place.
 *
 * Mobile: Crane SVG hidden (too cramped on small screens). Content panel
 * auto-plays a simple fade+rise when entering viewport.
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
  const spacerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    // ═══════════════════════════════════════════════
    //  DESKTOP — Scrub-linked crane sequence
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.desktop, () => {
      if (!spacerRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: spacerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
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
    });

    // ═══════════════════════════════════════════════
    //  MOBILE — Simple content panel reveal
    //  Crane SVG hidden via CSS, content fades up
    // ═══════════════════════════════════════════════
    mm.add(MEDIA_QUERIES.mobile, () => {
      if (!contentRef.current) return;

      gsap.set(contentRef.current, { opacity: 0 });

      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
            id: 'crane-mobile',
          },
        }
      );
    });

  }, { scope: sectionRef });

  return (
    <div ref={spacerRef} className={`relative lg:z-[10] lg:[height:250vh] ${className}`}>
    <div ref={sectionRef} className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden py-16 lg:py-0">
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

      {/* Inline SVG Crane — desktop only */}
      <svg
        className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-[300px] sm:max-w-[400px] hidden lg:block"
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

      {/* Content panel — "lowered" by crane on desktop, centered on mobile */}
      <div
        ref={contentRef}
        className="relative lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:bottom-[15%] w-[90%] max-w-md mx-auto"
      >
        {children}
      </div>
    </div>
    </div>
  );
}
