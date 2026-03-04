'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

/**
 * Page loading sequence — the "site boot up" moment.
 * Black screen -> gold laser line draws across -> logo fades in -> blueprint pulses -> content reveals.
 * Duration: ~1.2s. Plays once on initial load.
 */
export default function LoadingSequence({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setIsComplete(true);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setIsComplete(true);
        // Clean up overlay after animation
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              if (overlayRef.current) overlayRef.current.style.display = 'none';
            },
          });
        }
      },
    });

    // Gold laser line draws across center
    tl.fromTo(
      laserRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }
    );

    // Logo fades in above laser
    tl.fromTo(
      logoRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      '-=0.2'
    );

    // Blueprint grid pulses once below
    tl.fromTo(
      gridRef.current,
      { opacity: 0 },
      { opacity: 0.15, duration: 0.2, ease: 'power1.in' },
      '-=0.1'
    );
    tl.to(gridRef.current, { opacity: 0.05, duration: 0.3 });

    return () => {
      tl.kill();
    };
  }, [reducedMotion]);

  if (reducedMotion && isComplete) return <>{children}</>;

  return (
    <>
      {/* Loading overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] bg-ro-black flex flex-col items-center justify-center pointer-events-none"
        style={{ display: isComplete ? 'none' : 'flex' }}
      >
        {/* Logo */}
        <div ref={logoRef} className="opacity-0 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 border-2 border-ro-gold flex items-center justify-center">
              <span className="font-heading text-ro-gold text-sm font-bold tracking-tight">
                RoU
              </span>
            </div>
          </div>
        </div>

        {/* Laser level line */}
        <div
          ref={laserRef}
          className="h-[2px] bg-ro-gold"
          style={{
            width: '60vw',
            maxWidth: 300,
            transform: 'scaleX(0)',
            boxShadow: '0 0 8px rgba(201,168,76,0.6), 0 0 20px rgba(201,168,76,0.3)',
          }}
        />

        {/* Blueprint grid pulse */}
        <div
          ref={gridRef}
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Page content */}
      {children}
    </>
  );
}