'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';
import CraneAnimation from '@/components/animations/CraneAnimation';
import { gsap, useGSAP, MEDIA_QUERIES } from '@/components/animations/GSAPProvider';
import { CINEMATIC_MOTION, EASES, TIMING } from '@/lib/gsap-config';

export default function ConstructionCTA() {
  const [mounted, setMounted] = useState(false);
  const [useCrane, setUseCrane] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const ambientTopRef = useRef<HTMLDivElement>(null);
  const ambientBottomRef = useRef<HTMLDivElement>(null);
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
    if (chapterRef.current) gsap.set(chapterRef.current, { opacity: 0, y: 18 });
    gsap.set([ambientTopRef.current, ambientBottomRef.current].filter(Boolean), { opacity: 0, scale: 0.84 });
    gsap.set(panelRef.current, CINEMATIC_MOTION.chapterPanel.from);
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

    if (chapterRef.current) {
      tl.fromTo(chapterRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: TIMING.normal, ease: EASES.chapterReveal },
        0
      );
    }

    tl.fromTo([ambientTopRef.current, ambientBottomRef.current].filter(Boolean),
      CINEMATIC_MOTION.ambientBloom.from,
      { ...CINEMATIC_MOTION.ambientBloom.to, opacity: 0.9, stagger: 0.08 },
      0.04
    );

    tl.fromTo(panelRef.current,
      CINEMATIC_MOTION.chapterPanel.from,
      { ...CINEMATIC_MOTION.chapterPanel.to, duration: 0.82 },
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
        ease: EASES.ambientFloat,
      });

      if (lineRef.current) {
        gsap.to(lineRef.current, {
          boxShadow: '0 0 18px rgba(201,168,76,0.75)',
          repeat: -1,
          yoyo: true,
          duration: 1.6,
          ease: EASES.ambientFloat,
        });
      }

      actionEls.forEach((button) => {
        const xTo = gsap.quickTo(button as Element, 'x', { duration: 0.22, ease: 'power3.out' });
        const yTo = gsap.quickTo(button as Element, 'y', { duration: 0.22, ease: 'power3.out' });
        const move: EventListener = (event) => {
          const pointerEvent = event as PointerEvent;
          const rect = (button as HTMLElement).getBoundingClientRect();
          const x = (pointerEvent.clientX - rect.left - rect.width / 2) * 0.08;
          const y = (pointerEvent.clientY - rect.top - rect.height / 2) * 0.12;
          xTo(x);
          yTo(y);
        };
        const leave: EventListener = () => {
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
    <div ref={panelRef} className="cta-panel relative overflow-hidden border border-ro-gold/20 bg-ro-black/90 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.36)] lg:bg-ro-black/80 lg:p-12 lg:backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 caution-stripe opacity-30" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
        {/* Left: heading block */}
        <div className="lg:flex-1 text-center lg:text-left mb-8 lg:mb-0">
          <span ref={eyebrowRef} className="cta-eyebrow text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-6 block">Ready when you are</span>
          <h2 ref={titleRef} className="cta-title text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase mb-6">
            Build What <span className="gradient-text-gold">They Remember</span>
          </h2>
          <div ref={lineRef} className="cta-line w-24 h-[2px] bg-ro-gold mb-0 lg:mb-0 mx-auto lg:mx-0"
            style={{ boxShadow: '0 0 8px rgba(201,168,76,0.4)' }}
          />
        </div>
        {/* Right: desc + buttons */}
        <div className="lg:flex-1 text-center lg:text-left">
          <p ref={copyRef} className="cta-copy text-ro-gray-400 text-base sm:text-lg mb-8">
            For developers, operators, and owners who want control without flattening the vision. Ground-up, repositioning, or site work that gets it moving, RO carries the job with discipline all the way to opening day.
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
      <section className="relative overflow-hidden py-24">
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
    <section ref={sectionRef} className="relative flex min-h-[100svh] items-center overflow-hidden bg-ro-black py-24 lg:min-h-0">
      <div className="absolute inset-0 steel-texture" />
      <div className="absolute inset-0 blueprint-overlay opacity-50" />
      <div ref={ambientTopRef} className="pointer-events-none absolute left-[-12%] top-[6%] h-[260px] w-[260px] rounded-full bg-ro-gold/16 blur-3xl lg:hidden" />
      <div ref={ambientBottomRef} className="pointer-events-none absolute right-[-14%] bottom-[8%] h-[280px] w-[280px] rounded-full bg-cyan-400/10 blur-3xl lg:hidden" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/30 to-transparent" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={chapterRef} className="mb-6 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.32em] text-ro-gray-500">
          <span className="h-px w-10 bg-gradient-to-r from-ro-gold/0 via-ro-gold/60 to-ro-gold/0" />
          Final Act
        </div>
        {ctaContent}
      </div>
    </section>
  );
}
