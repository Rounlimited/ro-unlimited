'use client';

import { useState, useEffect } from 'react';

// Mobile-first breakpoints matching Tailwind defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Mobile-first media query hook.
 * Returns true when viewport is AT or ABOVE the specified breakpoint.
 * Default state is false (mobile) to match mobile-first philosophy.
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
    const media = window.matchMedia(query);

    setMatches(media.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
}

/**
 * Returns current device context for animation decisions.
 */
export function useDeviceContext() {
  const isTablet = useMediaQuery('md');
  const isDesktop = useMediaQuery('lg');
  const isWide = useMediaQuery('xl');

  // Check for high refresh rate display (ProMotion, etc.)
  const [isHighRefresh, setIsHighRefresh] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame timing to detect >60hz
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;

    const checkRefreshRate = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setIsHighRefresh(frames > 75); // 120hz+ displays
        return;
      }
      rafId = requestAnimationFrame(checkRefreshRate);
    };

    rafId = requestAnimationFrame(checkRefreshRate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return {
    isMobile: !isTablet,
    isTablet: isTablet && !isDesktop,
    isDesktop,
    isWide,
    isHighRefresh,
  };
}

export { BREAKPOINTS };
export default useMediaQuery;