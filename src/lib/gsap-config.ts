export const GSAP_DEFAULTS = { duration: 1.2, ease: 'power3.out' } as const;

export const CONSTRUCTION_ANIMATIONS = {
  beamDrop: { from: { y: -150, rotation: 5, opacity: 0 }, to: { y: 0, rotation: 0, opacity: 1, duration: 1.2, ease: 'bounce.out' } },
  wallRise: { from: { clipPath: 'inset(100% 0 0 0)', opacity: 0 }, to: { clipPath: 'inset(0% 0 0 0)', opacity: 1, duration: 1, ease: 'power2.out' } },
  boltIn: { from: { scale: 0, rotation: 180, opacity: 0 }, to: { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' } },
  craneDrop: { from: { y: -300, opacity: 0 }, to: { y: 0, opacity: 1, duration: 1.5, ease: 'power2.out' } },
  slideLeft: { from: { x: -120, opacity: 0 }, to: { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' } },
  slideRight: { from: { x: 120, opacity: 0 }, to: { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' } },
  scaffoldBuild: { from: { clipPath: 'inset(100% 0 0 0)', opacity: 0 }, to: { clipPath: 'inset(0% 0 0 0)', opacity: 1, duration: 1.2, ease: 'power3.out' } },
  weldSpark: { from: { scale: 0, opacity: 1 }, to: { scale: 2, opacity: 0, duration: 0.5, ease: 'power1.out' } },
  staggerConfig: { each: 0.15, from: 'start' },
} as const;

export const SCROLL_TRIGGER_DEFAULTS = {
  start: 'top 80%', end: 'bottom 20%', toggleActions: 'play none none reverse',
} as const;
