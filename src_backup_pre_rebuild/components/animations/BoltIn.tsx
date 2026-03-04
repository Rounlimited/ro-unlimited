'use client';

import { useRef, useEffect } from 'react';
import { gsap } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

interface BoltInProps {
  /** Position: which corner */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Delay for stagger */
  delay?: number;
  /** Size in pixels */
  size?: number;
  /** Trigger element for ScrollTrigger */
  trigger?: string;
  className?: string;
}

/**
 * Animated bolt/rivet that snaps into a corner position.
 * Rotates 180deg and scales from 0 with elastic ease.
 */
export default function BoltIn({ 
  position, 
  delay = 0,
  size = 8,
  trigger,
  className = '' 
}: BoltInProps) {
  const boltRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const positionClasses = {
    'top-left': '-top-1 -left-1',
    'top-right': '-top-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
  };

  useEffect(() => {
    if (!boltRef.current || reducedMotion) return;

    const anim = gsap.from(boltRef.current, {
      scale: 0,
      rotation: 180,
      opacity: 0,
      duration: 0.4,
      delay,
      ease: 'back.out(2)',
      scrollTrigger: trigger ? {
        trigger,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      } : undefined,
    });

    return () => {
      anim.kill();
    };
  }, [delay, trigger, reducedMotion]);

  return (
    <div
      ref={boltRef}
      className={`absolute ${positionClasses[position]} ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="w-full h-full rounded-full"
        style={{
          background: 'radial-gradient(circle, #D4B965 0%, #C9A84C 60%, #8A7233 100%)',
          boxShadow: '0 0 4px rgba(201,168,76,0.3)',
        }}
      />
    </div>
  );
}