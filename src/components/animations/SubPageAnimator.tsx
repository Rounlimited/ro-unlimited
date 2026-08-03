'use client';

import { useRef, useEffect, useState } from 'react';
// MUST come from GSAPProvider, never straight from 'gsap'. Importing the core
// directly here created a SECOND gsap instance, and ScrollTrigger ends up bound
// to only one of them — so every scroll-triggered tween on these pages applied
// its `from` state (opacity 0) and then never played. The content stayed
// invisible forever, including on /contact.
import { gsap, ScrollTrigger, usePrefersReducedMotion } from './GSAPProvider';

interface SubPageAnimatorProps {
  children: React.ReactNode;
}

export default function SubPageAnimator({ children }: SubPageAnimatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || reducedMotion) return;
    const ctx = gsap.context(() => {
      const hero = containerRef.current?.querySelector('section:first-child');
      if (hero) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        const badge = hero.querySelector('.inline-flex');
        const h1 = hero.querySelector('h1');
        const gl = hero.querySelector('.gold-line');
        const desc = hero.querySelector('p');
        const btns = hero.querySelectorAll('a, button');
        if (badge) tl.from(badge, { x: -40, opacity: 0, duration: 0.6 }, 0.2);
        if (h1) tl.from(h1, { y: 40, opacity: 0, duration: 0.8 }, 0.3);
        if (gl) tl.from(gl, { scaleX: 0, transformOrigin: 'left', duration: 0.6 }, 0.6);
        if (desc) tl.from(desc, { y: 20, opacity: 0, duration: 0.6 }, 0.7);
        if (btns.length) tl.from(btns, { y: 20, opacity: 0, stagger: 0.1, duration: 0.5 }, 0.9);
      }
      const sections = containerRef.current?.querySelectorAll('section:not(:first-child)');
      sections?.forEach((section) => {
        const h2 = section.querySelector('h2');
        const sgl = section.querySelector('.gold-line');
        // immediateRender:false on every scroll-triggered reveal below.
        // By default gsap.from() hides the element the moment the tween is
        // built and only shows it when the trigger fires — so anything that
        // stops the trigger firing leaves the content permanently invisible
        // (that is the bug that blanked /grading and /contact). With this off,
        // the element renders normally and the reveal is applied only when the
        // trigger actually runs: worst case you lose an animation, never the
        // content.
        if (h2) gsap.from(h2, { y: 30, opacity: 0, duration: 0.7, immediateRender: false, scrollTrigger: { trigger: h2, start: 'top 85%' } });
        if (sgl) gsap.from(sgl, { scaleX: 0, transformOrigin: 'center', duration: 0.6, immediateRender: false, scrollTrigger: { trigger: sgl, start: 'top 85%' } });
        const cards = section.querySelectorAll('.grid > div');
        if (cards.length) gsap.from(cards, { y: 40, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out', immediateRender: false, scrollTrigger: { trigger: cards[0], start: 'top 85%' } });
        const links = section.querySelectorAll('.flex-wrap a');
        if (links.length && !section.querySelector('.grid')) gsap.from(links, { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, immediateRender: false, scrollTrigger: { trigger: section, start: 'top 85%' } });
      });
    }, containerRef);

    // Positions are measured before fonts/images settle; without this the
    // start points can be stale and a trigger may never become active.
    ScrollTrigger.refresh();

    // Self-healing reveal. These tweens hide content first and show it when a
    // ScrollTrigger fires, so ANY failure in that chain leaves the page blank
    // for the visitor — which is exactly what happened here. Rather than trust
    // it, watch the revealed elements: once one has been on screen for a beat
    // and is still invisible, fade it in ourselves. When GSAP works normally
    // this never fires; when it doesn't, the page still reads correctly.
    const timers = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          // Deliberately do NOT cancel when it scrolls back out — during a fast
          // scroll an element can enter and leave before the check runs, and
          // cancelling would let it stay invisible.
          if (!entry.isIntersecting || timers.has(el)) return;
          timers.set(
            el,
            window.setTimeout(() => {
              timers.delete(el);
              if (Number(getComputedStyle(el).opacity) < 0.05) {
                gsap.to(el, { opacity: 1, y: 0, duration: 0.4, overwrite: 'auto' });
              }
            }, 900)
          );
        });
      },
      { threshold: 0.01 }
    );
    containerRef.current
      ?.querySelectorAll<HTMLElement>('section:not(:first-child) .grid > div, section:not(:first-child) h2, section:not(:first-child) .flex-wrap a')
      .forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      ctx.revert();
    };
  }, [mounted, reducedMotion]);

  if (!mounted) return <div>{children}</div>;
  return <div ref={containerRef}>{children}</div>;
}
