'use client';

import { useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Shared RO loading screen for the main public site.
 * Admin routes are passed through untouched (admin has its own splash).
 *
 * When the splash completes, fires:
 *   window.__roSiteReady = true
 *   window.dispatchEvent(new Event('ro:site-ready'))
 *
 * Hero and HeroVideo listen for this before starting video + animations.
 */
export default function ROLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const splashRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<HTMLImageElement>(null);
  const [done, setDone] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Admin has its own splash — skip entirely
    if (isAdmin) {
      setDone(true);
      return;
    }

    // Only show splash on the FIRST visit this session.
    // Back button, internal navigation, and page switches skip it.
    const alreadyPlayed = (window as any).__roSplashPlayed || false;
    if (alreadyPlayed) {
      setDone(true);
      (window as any).__roSplashPlayed = true;
      (window as any).__roSiteReady = true;
      window.dispatchEvent(new Event('ro:site-ready'));
      return;
    }

    // Mark splash as played for the rest of this page session
    (window as any).__roSplashPlayed = true;

    const ctx = gsap.context(() => {
      gsap.set(roRef.current, { opacity: 0, scale: 0.88 });
      gsap.set(splashRef.current, { opacity: 1 });

      gsap.timeline()
        .to(roRef.current, {
          opacity: 0.85, scale: 1,
          duration: 1.1, ease: 'power2.out',
        })
        .to(roRef.current, {
          scale: 1.05, opacity: 0.95,
          duration: 1.3, ease: 'sine.inOut',
          yoyo: true, repeat: 1,
        })
        .to(splashRef.current, {
          opacity: 0, duration: 0.7, ease: 'power2.inOut',
          onComplete: () => {
            setDone(true);
            if (splashRef.current) splashRef.current.style.display = 'none';
            // Signal to Hero + HeroVideo that they can start
            (window as any).__roSiteReady = true;
            window.dispatchEvent(new Event('ro:site-ready'));
          },
        }, '+=0.1');
    });

    return () => ctx.revert();
  }, [isAdmin, reducedMotion]);

  // Admin: pass through with no chrome at all
  if (isAdmin) {
    return <>{children}</>;
  }

  // Public site: wrap with Navbar + Footer + splash
  return (
    <>
      {!done && (
        <div
          ref={splashRef}
          className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center"
          style={{ zIndex: 200 }}
        >
          <img
            ref={roRef}
            src="/ro-icon.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none"
            style={{
              width: '72vw',
              maxWidth: '360px',
              objectFit: 'fill',
              transform: 'scaleY(1.35)',
              transformOrigin: 'center center',
            }}
          />
        </div>
      )}
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
