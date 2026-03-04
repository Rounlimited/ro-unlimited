'use client';

import { useRef, useCallback } from 'react';
import { gsap } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

interface WeldingSparkProps {
  x?: number;
  y?: number;
  size?: number;
  auto?: boolean;
  className?: string;
}

/**
 * Welding spark burst effect.
 * Fires 8 particles outward from a central point with glow.
 * Can be triggered programmatically or auto-fires on mount.
 */
export default function WeldingSpark({ 
  x = 0, 
  y = 0, 
  size = 40,
  auto = false,
  className = '' 
}: WeldingSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const fire = useCallback(() => {
    if (!containerRef.current || reducedMotion) return;

    const sparks = containerRef.current.querySelectorAll('.spark-particle');
    const core = containerRef.current.querySelector('.spark-core');

    // Reset all to center
    gsap.set(sparks, { x: 0, y: 0, scale: 1, opacity: 1 });
    gsap.set(core, { scale: 0, opacity: 0 });

    const tl = gsap.timeline();

    // Core flash
    tl.to(core, {
      scale: 1.5,
      opacity: 1,
      duration: 0.08,
      ease: 'power4.out',
    });
    tl.to(core, {
      scale: 0.3,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    });

    // Sparks fly outward in random directions
    sparks.forEach((spark, i) => {
      const angle = (i / sparks.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const distance = 20 + Math.random() * 40;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      tl.to(spark, {
        x: targetX,
        y: targetY - 10 - Math.random() * 20, // Gravity bias upward initially
        scale: 0,
        opacity: 0,
        duration: 0.3 + Math.random() * 0.4,
        ease: 'power2.out',
      }, 0.02 + Math.random() * 0.05);
    });

    return tl;
  }, [reducedMotion]);

  // Auto-fire on mount if requested
  if (auto && containerRef.current) {
    setTimeout(() => fire(), 100);
  }

  return (
    <div
      ref={containerRef}
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
      }}
      data-fire={fire}
    >
      {/* Core flash */}
      <div
        className="spark-core absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.25,
          height: size * 0.25,
          background: 'radial-gradient(circle, #FFFFFF 0%, #F5E6A3 40%, rgba(201,168,76,0) 100%)',
          boxShadow: '0 0 12px 4px rgba(201,168,76,0.6)',
          opacity: 0,
        }}
      />
      {/* Spark particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="spark-particle absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            background: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#F5E6A3' : '#C9A84C',
            boxShadow: `0 0 4px 1px rgba(201,168,76,0.5)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// Export the fire function type for external triggering
export type SparkRef = {
  fire: () => gsap.core.Timeline | undefined;
};