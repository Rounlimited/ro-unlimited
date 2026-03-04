'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';
import Image from 'next/image';

interface BeamDropProps {
  /** Text stamped on the beam */
  label?: string;
  /** Trigger element selector for ScrollTrigger */
  trigger?: string;
  className?: string;
}

/**
 * I-Beam section divider that drops from above with bounce.
 * Optional label text stamped on center of beam.
 */
export default function BeamDrop({ 
  label, 
  trigger,
  className = '' 
}: BeamDropProps) {
  const beamRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!beamRef.current || reducedMotion) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger || beamRef.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });

    // Beam drops from above with rotation and bounce
    tl.from(beamRef.current, {
      y: -100,
      rotation: -2,
      opacity: 0,
      duration: 0.8,
      ease: 'bounce.out',
    });

    // Label stamps in after beam lands
    if (labelRef.current) {
      tl.from(labelRef.current, {
        scaleY: 0,
        opacity: 0,
        transformOrigin: 'center center',
        duration: 0.3,
        ease: 'back.out(2)',
      }, '-=0.2');
    }

    return () => {
      tl.kill();
    };
  }, [trigger, reducedMotion]);

  return (
    <div 
      ref={beamRef} 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: 40 }}
    >
      {/* I-Beam SVG */}
      <img
        src="/images/svg/i-beam.svg"
        alt=""
        className="w-full h-full object-cover"
        aria-hidden="true"
      />
      {/* Stamped label */}
      {label && (
        <span
          ref={labelRef}
          className="absolute inset-0 flex items-center justify-center font-heading text-sm tracking-[0.3em] uppercase text-ro-black/60"
          style={{ textShadow: '0 0 4px rgba(201,168,76,0.3)' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}