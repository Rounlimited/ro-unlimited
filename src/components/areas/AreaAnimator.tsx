'use client';

import { useEffect, useRef } from 'react';
// Always from GSAPProvider (one gsap core, plugins registered once).
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';

/**
 * Entrance animations for the town pages. The page itself is server-rendered;
 * this only decorates what is already in the HTML.
 *
 * Every scroll reveal uses `immediateRender: false`, so an element is never
 * hidden before its trigger actually fires: the worst case is a missing
 * animation, never missing content.
 */
export default function AreaAnimator({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const heroBits = root.querySelectorAll('[data-hero]');
      if (heroBits.length) {
        gsap.from(heroBits, { y: 28, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out', delay: 0.15 });
      }
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 36, opacity: 0, duration: 0.8, ease: 'power2.out', immediateRender: false,
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
