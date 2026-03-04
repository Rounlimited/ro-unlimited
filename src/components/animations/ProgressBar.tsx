'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { PROGRESS_BAR_CONFIG } from '@/lib/gsap-config';

/**
 * Scroll progress bar — fixed to top of viewport.
 * Fills from 0% to 100% as user scrolls entire page.
 * Styled as a welding line with glow effect.
 */
export default function ProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!barRef.current) return;

    // Kill any existing tween from previous render (Strict Mode double-mount)
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    // Kill any existing ScrollTriggers on this element
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.trigger === document.documentElement && st.animation?.targets()?.includes(barRef.current)) {
        st.kill();
      }
    });

    // Reset bar to 0
    gsap.set(barRef.current, { scaleX: 0 });

    tweenRef.current = gsap.to(barRef.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
        id: 'progress-bar',
      },
    });

    return () => {
      // Clean up on unmount
      const existing = ScrollTrigger.getById('progress-bar');
      if (existing) existing.kill();
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      <div
        ref={barRef}
        style={{
          height: PROGRESS_BAR_CONFIG.height,
          transform: 'scaleX(0)',
          transformOrigin: 'left center',
          backgroundColor: PROGRESS_BAR_CONFIG.color,
          boxShadow: `0 0 ${PROGRESS_BAR_CONFIG.glowSize}px ${PROGRESS_BAR_CONFIG.glowColor}, 0 0 ${PROGRESS_BAR_CONFIG.glowSize * 2}px ${PROGRESS_BAR_CONFIG.glowColor}`,
        }}
      />
    </div>
  );
}