'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';
import CountUp from '@/components/animations/CountUp';

const VALUES = [
  { word: 'Honor', desc: 'We treat every project — and every client — with the respect the work demands.' },
  { word: 'Integrity', desc: 'When we say we\'ll show up, we show up. When we say we\'ll do something, we do it.' },
  { word: 'Faith', desc: 'We believe in the work, in our people, and in doing right by everyone we build for.' },
  { word: 'Pride', desc: 'Every job carries our name. We don\'t cut corners because we have to live with what we build.' },
];

const STATS = [
  { value: 25, suffix: '+', label: 'Years in Business' },
  { value: 500, suffix: '+', label: 'Projects Completed' },
  { value: 7, suffix: '', label: 'License Classifications' },
  { value: 3, suffix: '', label: 'States Served' },
];

// What the company is today. Kept to what RO actually does and actually
// offers customers — no capability goes here that the site or app doesn't back up.
const TODAY = [
  {
    title: 'Commercial Construction',
    desc: 'Ground-up commercial buildings, shells, and build-outs — offices, retail, warehouses — managed start to finish as a licensed general contractor.',
  },
  {
    title: 'Site Work & Utilities, Self-Performed',
    desc: 'Grading, water and sewer, storm drainage, boring, and septic are done by our own crews — so the ground under your building is ready when the building is.',
  },
  {
    title: 'Your Project, Live',
    desc: 'Every job gets its own private project page: review and sign your agreement, then follow progress by phase, jobsite photos, written progress reports, and invoices — all in one link.',
  },
  {
    title: 'Run Like a Business',
    desc: 'A rolling three-week schedule, real cost tracking on every job, and written change orders you approve before extra work begins. No surprises.',
  },
];

const LICENSES = [
  'General Contractor — Building', 'Grading', 'Water & Sewer', 'Boring & Tunneling',
  'Highway — Roads & Bridges', 'Specialty — Concrete', 'Specialty — Masonry',
];

export default function OurStoryPage() {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const todayRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);
  const proofRef = useRef<HTMLElement>(null);
  const promiseRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || reducedMotion) return;
    const ctx = gsap.context(() => {

      // Hero entrance
      if (heroRef.current) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        const badge = heroRef.current.querySelector('.hero-badge');
        const h1 = heroRef.current.querySelector('h1');
        const line = heroRef.current.querySelector('.hero-gold-line');
        const sub = heroRef.current.querySelector('.hero-sub');
        if (badge) tl.fromTo(badge, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.2);
        if (h1) tl.fromTo(h1, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.3);
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.8, transformOrigin: 'center' }, 0.8);
        if (sub) tl.fromTo(sub, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 1.0);
      }

      // Story paragraphs — staggered reveal
      if (storyRef.current) {
        const paras = storyRef.current.querySelectorAll('.story-para');
        paras.forEach((p, i) => {
          gsap.fromTo(p, { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
              scrollTrigger: { trigger: p, start: 'top 85%', toggleActions: 'play none none reverse' } });
        });
        const goldQuote = storyRef.current.querySelector('.story-gold-quote');
        if (goldQuote) gsap.fromTo(goldQuote, { x: -60, opacity: 0 },
          { x: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: goldQuote, start: 'top 85%' } });
      }

      // Where We Are Today cards
      if (todayRef.current) {
        todayRef.current.querySelectorAll('.today-card').forEach((card, i) => {
          gsap.fromTo(card, { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, delay: (i % 2) * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Values cards
      if (valuesRef.current) {
        const cards = valuesRef.current.querySelectorAll('.value-card');
        cards.forEach((card, i) => {
          gsap.fromTo(card, { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Proof stats
      if (proofRef.current) {
        const items = proofRef.current.querySelectorAll('.proof-item');
        gsap.fromTo(items, { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'power2.out',
            scrollTrigger: { trigger: proofRef.current, start: 'top 80%' } });
      }

      // Promise section
      if (promiseRef.current) {
        gsap.fromTo(promiseRef.current.querySelector('.promise-content'),
          { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: promiseRef.current, start: 'top 80%' } });
      }

      // CTA
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.querySelector('.cta-inner'),
          { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' } });
      }

    }, containerRef);
    return () => ctx.revert();
  }, [mounted, reducedMotion]);

  // NOTE: no !mounted gate here — the full page must be in the SSR HTML for SEO.
  // GSAP entrance animations still run post-mount via the mounted-gated effects.

  return (
    <div ref={containerRef}>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <div className="hero-badge inline-flex items-center gap-2 px-5 py-2 border border-ro-gold/30 bg-ro-gold/5 mb-8">
            <span className="w-2 h-2 bg-ro-gold rounded-full" />
            <span className="text-ro-gold text-xs font-mono tracking-[0.25em] uppercase">Our Story</span>
          </div>
          <h1 className="text-ro-white font-heading text-5xl sm:text-6xl md:text-7xl tracking-tight uppercase leading-[0.85] mb-6">
            25 Years of<br /><span className="gradient-text-gold">Earning It.</span><br />Every Day.
          </h1>
          <div className="hero-gold-line w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mb-8" />
          <p className="hero-sub text-ro-gray-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Learned in the field. Built by hand. One standard that never changes.
          </p>
        </div>
      </section>

      {/* ═══ THE STORY ═══ */}
      <section ref={storyRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black to-ro-black/98" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="story-para mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-6">How It Started</span>
            <p className="text-ro-gray-300 text-base sm:text-lg leading-[1.85]">
              JR didn&apos;t learn construction from a textbook. He learned it out in the field — running equipment,
              setting forms, laying pipe, and working with his own hands. Every lesson came from a real job site:
              read the ground before you cut it, fix the problem before it costs anyone money, and finish what you start.
            </p>
          </div>

          <div className="story-para mb-12">
            <p className="text-ro-gray-300 text-base sm:text-lg leading-[1.85]">
              That hands-on foundation is still how RO Unlimited works today. The people planning your project know
              the work because they&apos;ve done the work — and for more than 25 years, the mission hasn&apos;t changed:
              build different, build better, and build lasting relationships. Along the way we&apos;ve created spaces for
              entrepreneurs to grow their businesses, developed properties for investors, and partnered with fellow
              builders on professional build-outs to help bring their projects to life.
            </p>
          </div>

          {/* Gold pull quote — the signature line */}
          <div className="story-gold-quote my-16 pl-6 border-l-[3px] border-ro-gold/60">
            <p className="text-ro-gold font-heading text-2xl sm:text-3xl tracking-tight uppercase leading-[1.15]">
              &ldquo;When we say we will show up, we show up. When we say we will do something, we do it.&rdquo;
            </p>
          </div>

          <div className="story-para mb-12">
            <p className="text-ro-gray-300 text-base sm:text-lg leading-[1.85]">
              From our local neighbors to licensed builders throughout the community, we are grateful for the trust
              that has been placed in us. That trust is something we work to earn every single day.
            </p>
          </div>

          <div className="story-para mb-12">
            <p className="text-ro-gray-300 text-base sm:text-lg leading-[1.85]">
              Every project is approached with honor, integrity, faith, and pride — ensuring that every job is completed
              the right way. After more than 25 years in the industry, one thing remains the same: our commitment to doing
              the job right and building something that lasts.
            </p>
          </div>

          <div className="story-para">
            <p className="text-ro-white font-heading text-xl sm:text-2xl tracking-tight uppercase leading-[1.2] text-center">
              Because at RO Unlimited,<br />
              <span className="gradient-text-gold">a job well done always speaks for itself.</span>
            </p>
          </div>

        </div>
      </section>

      {/* ═══ WHERE WE ARE TODAY ═══ */}
      <section ref={todayRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-[#0d0d0d] to-ro-black" />
        <div className="absolute inset-0 blueprint-overlay opacity-10" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Where We Are Today</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              Same Hands. <span className="gradient-text-gold">Bigger Reach.</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mt-6 mb-6" />
            <p className="text-ro-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              RO Unlimited Construction &amp; Development provides professional full-range commercial construction —
              including site development and utility services — throughout South Carolina, Georgia, and North Carolina.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-14">
            {TODAY.map((t) => (
              <div key={t.title} className="today-card group relative p-6 sm:p-8 border border-ro-gray-800/50 bg-ro-black/40 hover:border-ro-gold/30 transition-all duration-500">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ro-gold/30 group-hover:border-ro-gold/60 transition-colors duration-500" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ro-gold/30 group-hover:border-ro-gold/60 transition-colors duration-500" />
                <h3 className="text-ro-gold font-heading text-xl sm:text-2xl tracking-tight uppercase mb-3">{t.title}</h3>
                <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="today-card text-center">
            <p className="text-ro-gray-500 text-xs font-mono tracking-[0.3em] uppercase mb-5">Licensed In</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
              {LICENSES.map((l) => (
                <span key={l} className="px-4 py-2 border border-ro-gold/25 bg-ro-gold/5 text-ro-gray-300 text-xs sm:text-sm font-mono tracking-wide uppercase">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE VALUES ═══ */}
      <section ref={valuesRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 steel-texture" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black/95 via-ro-black/90 to-ro-black/95" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">What Drives Us</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              Four <span className="gradient-text-gold">Pillars</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {VALUES.map((val, i) => (
              <div key={val.word} className="value-card group relative p-6 sm:p-8 border border-ro-gray-800/50 bg-ro-black/40 hover:border-ro-gold/30 transition-all duration-500 text-center">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ro-gold/30 group-hover:border-ro-gold/60 transition-colors duration-500" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ro-gold/30 group-hover:border-ro-gold/60 transition-colors duration-500" />
                <h3 className="text-ro-gold font-heading text-2xl sm:text-3xl tracking-tight uppercase mb-4">{val.word}</h3>
                <p className="text-ro-gray-400 text-xs sm:text-sm leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE NUMBERS ═══ */}
      <section ref={proofRef} className="py-24 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-ro-black" />
        <div className="absolute inset-0 blueprint-overlay opacity-10" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {STATS.map((stat, i) => (
              <div key={i} className="proof-item text-center">
                <CountUp end={stat.value} suffix={stat.suffix} duration={2.5}
                  className="font-heading text-5xl sm:text-6xl text-ro-gold tracking-tighter text-shadow-gold" />
                <div className="text-ro-gray-400 text-xs font-mono tracking-[0.2em] uppercase mt-3">{stat.label}</div>
                <div className="w-8 h-[1px] bg-ro-gold/30 mx-auto mt-3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE PROMISE ═══ */}
      <section ref={promiseRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-[#0d0d0d] to-ro-black" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="promise-content">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-6">Our Promise</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-[0.9] mb-8">
              Every Trade on Your Site —<br /><span className="gradient-text-gold">Held to Our Standard</span>
            </h2>
            <p className="text-ro-gray-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-6">
              When you hire RO, you&apos;re not just getting one company. You&apos;re getting an entire team of vetted
              specialists — electricians, plumbers, framers, concrete crews — all held to the same standard we hold ourselves.
              Every trade licensed. Every trade proven. Every trade accountable to our project management.
            </p>
            <Link href="/commercial" className="text-ro-gold text-sm font-mono tracking-wider uppercase hover:text-ro-gold-light transition-colors inline-flex items-center gap-2">
              See our commercial standards <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={ctaRef} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-[#111] to-ro-black" />
        <div className="absolute inset-0 blueprint-overlay opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ro-gold/[0.03] rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-inner">
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mb-10" />
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.85] mb-8">
              Let&apos;s Build Something<br /><span className="gradient-text-gold">That Lasts.</span>
            </h2>
            <p className="text-ro-gray-400 text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
              Send us your project. We&apos;ll show you what 25 years of doing it right looks like.
            </p>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-4 text-ro-gold font-heading text-3xl sm:text-4xl tracking-tight hover:text-ro-gold-light transition-colors duration-300 mb-8">
              <Phone size={28} className="flex-shrink-0" /> {COMPANY.phone}
            </a>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="group flex items-center gap-3 px-10 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
                Start Your Project <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
