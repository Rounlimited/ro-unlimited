'use client';

import { useEffect, createContext, useContext } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// ─── Register ALL plugins ONCE at module level ───
// 2026 official pattern: centralize registration here,
// every component imports from this file, never from 'gsap' directly.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
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
    gsap.defaults(CONSTRUCTION_DEFAULTS);

    ScrollTrigger.config({
      ignoreMobileResize: true,
    });

    // Refresh after fonts load (positions shift when fonts swap)
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

// ─── Re-export everything from here ───
// All components import { gsap, ScrollTrigger, useGSAP } from this file.
// Never import gsap or ScrollTrigger directly from 'gsap' elsewhere.
export { gsap, ScrollTrigger, useGSAP };
