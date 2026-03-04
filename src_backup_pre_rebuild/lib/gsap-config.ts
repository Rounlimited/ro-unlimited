/**
 * RO Unlimited — GSAP Animation Configuration
 * Mobile-first construction theme animations.
 * All timings optimized for scrub-linked scroll on flagship phones.
 */

// Brand timing constants
export const TIMING = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.2,
  crawl: 2.0,
  // Scrub distances (in vh of scroll input)
  scrubShort: '+=50%',
  scrubMedium: '+=100%',
  scrubLong: '+=200%',
} as const;

// Construction-themed easing
export const EASES = {
  beamDrop: 'bounce.out',
  wallRise: 'power3.out',
  boltIn: 'back.out(2)',
  craneSwing: 'power2.inOut',
  weld: 'power1.in',
  mechanical: 'steps(12)',
  heavyLand: 'elastic.out(0.5, 0.3)',
  cableLower: 'power1.inOut',
} as const;

// Animation presets — each has a 'from' state (GSAP animates FROM these values)
export const CONSTRUCTION_ANIMATIONS = {
  // Steel beam dropping from above
  beamDrop: {
    from: {
      y: -120,
      rotation: -3,
      opacity: 0,
      ease: EASES.beamDrop,
      duration: TIMING.slow,
    },
  },
  // Wall rising from ground
  wallRise: {
    from: {
      y: 80,
      clipPath: 'inset(100% 0% 0% 0%)',
      opacity: 0,
      ease: EASES.wallRise,
      duration: TIMING.normal,
    },
  },
  // Bolt/rivet snapping in
  boltIn: {
    from: {
      scale: 0,
      rotation: 180,
      opacity: 0,
      ease: EASES.boltIn,
      duration: TIMING.fast,
    },
  },
  // Crane cable lowering element
  craneDrop: {
    from: {
      y: -200,
      opacity: 0,
      ease: EASES.cableLower,
      duration: TIMING.crawl,
    },
  },
  // Panel sliding from left
  slideLeft: {
    from: {
      x: -100,
      opacity: 0,
      ease: EASES.wallRise,
      duration: TIMING.normal,
    },
  },
  // Panel sliding from right
  slideRight: {
    from: {
      x: 100,
      opacity: 0,
      ease: EASES.wallRise,
      duration: TIMING.normal,
    },
  },
  // Stamp/press in (label maker effect)
  stampIn: {
    from: {
      scaleY: 0,
      transformOrigin: 'top center',
      opacity: 0,
      ease: EASES.heavyLand,
      duration: TIMING.fast,
    },
  },
  // Welding spark (scale up then fade)
  spark: {
    from: {
      scale: 0,
      opacity: 0,
      ease: EASES.weld,
      duration: TIMING.fast,
    },
  },
  // Foundation pour (clip from bottom)
  foundationPour: {
    from: {
      clipPath: 'inset(100% 0% 0% 0%)',
      opacity: 0,
      ease: EASES.wallRise,
      duration: TIMING.slow,
    },
  },
  // Simple fade (reduced motion fallback default)
  fadeIn: {
    from: {
      opacity: 0,
      ease: 'power2.out',
      duration: TIMING.normal,
    },
  },
  // Border trace (for cards) — uses strokeDashoffset
  borderTrace: {
    from: {
      strokeDashoffset: 1000,
      ease: 'power1.inOut',
      duration: TIMING.slow,
    },
  },
  // Scaffold rise (for card frames)
  scaffoldUp: {
    from: {
      scaleY: 0,
      transformOrigin: 'bottom center',
      opacity: 0,
      ease: EASES.wallRise,
      duration: TIMING.normal,
    },
  },
  // Letter scatter (for "DIFFERENT" text)
  letterScatter: {
    from: {
      x: () => Math.random() * 400 - 200,
      y: () => Math.random() * 300 - 150,
      rotation: () => Math.random() * 360 - 180,
      scale: 0.5,
      opacity: 0,
      ease: EASES.wallRise,
      duration: TIMING.slow,
    },
  },
} as const;

// ScrollTrigger defaults
export const SCROLL_TRIGGER_DEFAULTS = {
  start: 'top 85%',
  end: 'bottom 15%',
  toggleActions: 'play none none reverse' as const,
};

// Mobile-specific overrides
export const MOBILE_OVERRIDES = {
  // Reduce animation distances on smaller screens
  beamDrop: { y: -80 },
  wallRise: { y: 50 },
  craneDrop: { y: -150 },
  slideLeft: { x: -60 },
  slideRight: { x: 60 },
  // Faster durations for thumb scrolling
  durationMultiplier: 0.8,
};

// Progress bar config (nav scroll tracker)
export const PROGRESS_BAR_CONFIG = {
  height: 3,
  color: '#C9A84C',
  glowColor: 'rgba(201, 168, 76, 0.4)',
  glowSize: 6,
};