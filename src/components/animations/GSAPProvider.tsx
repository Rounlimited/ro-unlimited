'use client';

import { useEffect, createContext, useContext } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// ─── Register ALL plugins ONCE at module level ───
// 2026 official pattern: centralize registration here,
// every component imports from this file, never from 'gsap' directly.
// All GSAP plugins are now FREE (Webflow acquisition 2024).
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

// GSAP Context for global ready state
const GSAPCtx = createContext<{ isReady: boolean }>({ isReady: false });
export function useGSAPContext() {
  return useContext(GSAPCtx);
}

// Reduced motion detection — available for any component that wants it
export function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Global defaults — construction theme
const CONSTRUCTION_DEFAULTS = {
  ease: 'power3.out',
  duration: 1.2,
};

export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force scroll to top on page load — prevents browser scroll restoration
    // from starting the user partway through a pinned ScrollTrigger section
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    gsap.defaults(CONSTRUCTION_DEFAULTS);

    // ─── ScrollTrigger config — mobile-first optimizations ───
    ScrollTrigger.config({
      ignoreMobileResize: true, // Prevents recalc when mobile address bar hides/shows
    });

    // Refresh after first paint — ensures ScrollTrigger measures correct
    // positions for sticky sections (layout must be settled first).
    // Double-rAF waits for both layout and paint to complete.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    // Second refresh after fonts load (positions shift when fonts swap)
    if (document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    return () => {
      ScrollTrigger.killAll();
    };
  }, []);

  return (
    <GSAPCtx.Provider value={{ isReady: true }}>
      {children}
    </GSAPCtx.Provider>
  );
}

// ─── Shared breakpoints for gsap.matchMedia() ───
// Desktop: scrub + sticky scroll. Mobile: auto-play on viewport entry.
export const MEDIA_QUERIES = {
  mobile: '(max-width: 1023px)',
  desktop: '(min-width: 1024px)',
} as const;

// ─── Re-export everything from here ───
// All components import { gsap, ScrollTrigger, useGSAP } from this file.
// Never import gsap or ScrollTrigger directly from 'gsap' elsewhere.
export { gsap, ScrollTrigger, SplitText, useGSAP };
