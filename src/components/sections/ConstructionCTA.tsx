'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';
import CraneAnimation from '@/components/animations/CraneAnimation';
import { gsap, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';

export default function ConstructionCTA() {
  const [mounted, setMounted] = useState(false);
  const [useCrane, setUseCrane] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia(MEDIA_QUERIES.desktop);
    const sync = () => setUseCrane(mq.matches);
    sync();

    const listener = () => sync();
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else mq.addListener(listener);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', listener);
      else mq.removeListener(listener);
    };
  }, []);

  useGSAP(() => {
    if (useCrane || !sectionRef.current || !panelRef.current) return;

    const actionEls = actionsRef.current ? Array.from(actionsRef.current.children) : [];
    const buttonCleanup: Array<() => void> = [];
    gsap.set(panelRef.current, { opacity: 0, y: 34, scale: 0.97, clipPath: 'inset(16% 0% 0% 0%)' });
    gsap.set([eyebrowRef.current, titleRef.current, copyRef.current], { opacity: 0, y: 18 });
    if (lineRef.current) gsap.set(lineRef.current, { opacity: 0, scaleX: 0, transformOrigin: 'left center' });
    if (actionEls.length) gsap.set(actionEls, { opacity: 0, y: 14 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 72%',
        toggleActions: 'play none none none',
        id: 'construction-cta-mobile',
      },
      defaults: { ease: 'power3.out' },
    });

    tl.fromTo(panelRef.current,
      { opacity: 0, y: 34, scale: 0.97, clipPath: 'inset(16% 0% 0% 0%)' },
      { opacity: 1, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75 },
      0
    );

    tl.fromTo(eyebrowRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.35 },
      0.12
    );

    tl.fromTo(titleRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45 },
      0.18
    );

    tl.fromTo(lineRef.current,
      { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
      { opacity: 1, scaleX: 1, duration: 0.35 },
      0.28
    );

    tl.fromTo(copyRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.4 },
      0.34
    );

    if (actionEls.length) {
      tl.fromTo(actionEls,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.35 },
        0.42
      );
    }

    tl.call(() => {
      gsap.to(panelRef.current, {
        y: -8,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      if (lineRef.current) {
        gsap.to(lineRef.current, {
          boxShadow: '0 0 18px rgba(201,168,76,0.75)',
          repeat: -1,
          yoyo: true,
          duration: 1.6,
          ease: 'sine.inOut',
        });
      }

      actionEls.forEach((button) => {
        const xTo = gsap.quickTo(button as Element, 'x', { duration: 0.22, ease: 'power3.out' });
        const yTo = gsap.quickTo(button as Element, 'y', { duration: 0.22, ease: 'power3.out' });
        const move = (event: PointerEvent) => {
          const rect = (button as HTMLElement).getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
          const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
          xTo(x);
          yTo(y);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        button.addEventListener('pointermove', move);
        button.addEventListener('pointerleave', leave);
        buttonCleanup.push(() => {
          button.removeEventListener('pointermove', move);
          button.removeEventListener('pointerleave', leave);
        });
      });
    });
    return () => {
      buttonCleanup.forEach((fn) => fn());
    };
  }, { scope: sectionRef, dependencies: [useCrane] });

  const ctaContent = (
    <div ref={panelRef} className="cta-panel p-8 sm:p-12 bg-ro-black/90 lg:bg-ro-black/80 border border-ro-gold/20 lg:backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_42%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 caution-stripe opacity-30" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
        {/* Left: heading block */}
        <div className="lg:flex-1 text-center lg:text-left mb-8 lg:mb-0">
          <span ref={eyebrowRef} className="cta-eyebrow text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-6 block">Ready when you are</span>
          <h2 ref={titleRef} className="cta-title text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase mb-6">
            Build Something <span className="gradient-text-gold">People Remember</span>
          </h2>
          <div ref={lineRef} className="cta-line w-24 h-[2px] bg-ro-gold mb-0 lg:mb-0 mx-auto lg:mx-0"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
          />
        </div>
        {/* Right: desc + buttons */}
        <div className="lg:flex-1 text-center lg:text-left">
          <p ref={copyRef} className="cta-copy text-ro-gray-400 text-base sm:text-lg mb-8">
            For developers, operators, and owners who want real control without sacrificing taste. Ground-up, repositioning, or the site work that gets it moving, we know how to carry the job forward.
          </p>
          <div ref={actionsRef} className="cta-actions flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
            <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300">
              Start Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="group flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-all duration-300">
              <Phone size={16} />Call RO Unlimited
            </a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 caution-stripe opacity-30" />
    </div>
  );

  if (!mounted) {
    return (
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 steel-texture" />
        <div className="absolute inset-0 blueprint-overlay opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {ctaContent}
        </div>
      </section>
    );
  }

  if (useCrane) {
    return (
      <CraneAnimation scrollDistance="+=150%" className="bg-ro-black">
        {ctaContent}
      </CraneAnimation>
    );
  }

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-ro-black">
      <div className="absolute inset-0 steel-texture" />
      <div className="absolute inset-0 blueprint-overlay opacity-50" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/30 to-transparent" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {ctaContent}
      </div>
    </section>
  );
}
