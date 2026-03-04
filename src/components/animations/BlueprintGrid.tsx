'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

interface BlueprintGridProps {
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
  className?: string;
}

/**
 * Animated blueprint grid background.
 * Pulses opacity on scroll, intensifies during key sections.
 * Uses the SVG tile as repeating background pattern.
 */
export default function BlueprintGrid({ 
  intensity = 'low', 
  animate = true,
  className = '' 
}: BlueprintGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const opacityMap = {
    low: 0.03,
    medium: 0.08,
    high: 0.15,
  };

  useEffect(() => {
    if (!gridRef.current || !animate || reducedMotion) return;

    // Subtle pulse animation
    const pulse = gsap.to(gridRef.current, {
      opacity: opacityMap[intensity] * 1.8,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      pulse.kill();
    };
  }, [animate, intensity, reducedMotion]);

  return (
    <div
      ref={gridRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity: opacityMap[intensity],
        backgroundImage: `url('/images/svg/blueprint-grid.svg')`,
        backgroundSize: '100px 100px',
        backgroundRepeat: 'repeat',
      }}
      aria-hidden="true"
    />
  );
}