'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  trigger?: string;
  className?: string;
}

/**
 * Mechanical odometer-style count up.
 * Numbers tick up like a counter, not smooth interpolation.
 * Triggers when element scrolls into view.
 */
export default function CountUp({ 
  end, 
  suffix = '', 
  prefix = '',
  duration = 2,
  trigger,
  className = '' 
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(`${prefix}${end}${suffix}`);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    if (reducedMotion) {
      setDisplayed(`${prefix}${end}${suffix}`);
      return;
    }

    setDisplayed(`${prefix}0${suffix}`);
    const obj = { value: 0 };
    const anim = gsap.to(obj, {
      value: end,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: trigger || ref.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
      onUpdate: () => {
        setDisplayed(`${prefix}${Math.round(obj.value)}${suffix}`);
      },
    });

    return () => {
      anim.kill();
    };
  }, [end, suffix, prefix, duration, trigger, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {displayed}
    </span>
  );
}