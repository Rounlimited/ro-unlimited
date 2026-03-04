'use client';

import { useRef, useCallback } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';
import { CONSTRUCTION_ANIMATIONS, SCROLL_TRIGGER_DEFAULTS } from '@/lib/gsap-config';

type AnimationType = keyof typeof CONSTRUCTION_ANIMATIONS;

interface ScrollAnimationConfig {
  animation: AnimationType;
  trigger?: string;
  scrub?: boolean | number;
  pin?: boolean;
  start?: string;
  end?: string;
  stagger?: number | gsap.StaggerVars;
  delay?: number;
  markers?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
}

/**
 * Mobile-first scroll animation hook.
 * Ties GSAP animations to ScrollTrigger with construction theme presets.
 * Respects prefers-reduced-motion automatically.
 */
export function useScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const animate = useCallback((
    targets: string | Element | Element[],
    config: ScrollAnimationConfig
  ) => {
    if (reducedMotion) {
      // Reduced motion: just make everything visible
      gsap.set(targets, { opacity: 1, clearProps: 'transform,clipPath' });
      return;
    }

    const preset = CONSTRUCTION_ANIMATIONS[config.animation];
    if (!preset) return;

    const scrollTriggerConfig: ScrollTrigger.Vars = {
      trigger: config.trigger || (typeof targets === 'string' ? targets : undefined),
      start: config.start || SCROLL_TRIGGER_DEFAULTS.start,
      end: config.end || SCROLL_TRIGGER_DEFAULTS.end,
      toggleActions: config.scrub ? undefined : SCROLL_TRIGGER_DEFAULTS.toggleActions,
      scrub: config.scrub || false,
      pin: config.pin || false,
      markers: config.markers || false,
      onEnter: config.onEnter,
      onLeave: config.onLeave,
    };

    return gsap.from(targets, {
      ...preset.from,
      scrollTrigger: scrollTriggerConfig,
      stagger: config.stagger,
      delay: config.delay,
    });
  }, [reducedMotion]);

  // Scrub-linked animation (tied to scroll position)
  const scrubTimeline = useCallback((
    trigger: string,
    options?: {
      pin?: boolean;
      start?: string;
      end?: string;
      anticipatePin?: number;
      markers?: boolean;
    }
  ) => {
    if (reducedMotion) return gsap.timeline();

    return gsap.timeline({
      scrollTrigger: {
        trigger,
        start: options?.start || 'top top',
        end: options?.end || '+=100%',
        scrub: 1,
        pin: options?.pin ?? true,
        anticipatePin: options?.anticipatePin ?? 1,
        markers: options?.markers || false,
      },
    });
  }, [reducedMotion]);

  // Counter animation (for trust stats)
  const countUp = useCallback((
    target: string | Element,
    endValue: number,
    config?: { trigger?: string; duration?: number; suffix?: string }
  ) => {
    if (reducedMotion) {
      gsap.set(target, { textContent: `${endValue}${config?.suffix || ''}` });
      return;
    }

    const obj = { value: 0 };
    return gsap.to(obj, {
      value: endValue,
      duration: config?.duration || 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: config?.trigger || (typeof target === 'string' ? target : undefined),
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      onUpdate: () => {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.textContent = `${Math.round(obj.value)}${config?.suffix || ''}`;
      },
    });
  }, [reducedMotion]);

  return { containerRef, animate, scrubTimeline, countUp, reducedMotion };
}

export default useScrollAnimation;