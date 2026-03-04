'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

interface WallRiseProps {
  children: React.ReactNode;
  /** Delay before animation starts */
  delay?: number;
  /** Duration of the rise */
  duration?: number;
  /** Custom trigger selector */
  trigger?: string;
  /** Stagger index for sequential reveals */
  index?: number;
  className?: string;
}

/**
 * Wall Rise reveal — content rises up from the ground via clipPath.
 * Like a wall being erected on a construction site.
 */
export default function WallRise({ 
  children, 
  delay = 0,
  duration = 0.8,
  trigger,
  index = 0,
  className = '' 
}: WallRiseProps) {
  const wallRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!wallRef.current || reducedMotion) return;

    const anim = gsap.from(wallRef.current, {
      clipPath: 'inset(100% 0% 0% 0%)',
      y: 40,
      opacity: 0,
      duration,
      delay: delay + index * 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: trigger || wallRef.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });

    return () => {
      anim.kill();
    };
  }, [delay, duration, trigger, index, reducedMotion]);

  return (
    <div ref={wallRef} className={className}>
      {children}
    </div>
  );
}