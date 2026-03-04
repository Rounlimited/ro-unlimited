'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from './GSAPProvider';

gsap.registerPlugin(ScrollTrigger);

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
        if (h2) gsap.from(h2, { y: 30, opacity: 0, duration: 0.7, scrollTrigger: { trigger: h2, start: 'top 85%' } });
        if (sgl) gsap.from(sgl, { scaleX: 0, transformOrigin: 'center', duration: 0.6, scrollTrigger: { trigger: sgl, start: 'top 85%' } });
        const cards = section.querySelectorAll('.grid > div');
        if (cards.length) gsap.from(cards, { y: 40, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: cards[0], start: 'top 85%' } });
        const links = section.querySelectorAll('.flex-wrap a');
        if (links.length && !section.querySelector('.grid')) gsap.from(links, { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, scrollTrigger: { trigger: section, start: 'top 85%' } });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [mounted, reducedMotion]);

  if (!mounted) return <div>{children}</div>;
  return <div ref={containerRef}>{children}</div>;
}
