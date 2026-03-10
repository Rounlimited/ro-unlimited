'use client';

import Link from 'next/link';
import { DIVISIONS, COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, Home, ChevronDown, CheckCircle2, Heart, Hammer, Ruler, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';
import CountUp from '@/components/animations/CountUp';
import ServiceDrawer from '@/components/ServiceDrawer';
import { RESIDENTIAL_SERVICE_DETAILS, RESIDENTIAL_PROCESS, CRAFT_PILLARS } from '@/lib/residential-data';
import type { ServiceDetail } from '@/lib/commercial-data';

const division = DIVISIONS.find(d => d.id === 'residential')!;

const HERO_STATS = [
  { value: 25, suffix: '+', label: 'Years Building Homes' },
  { value: 2, suffix: '', label: 'Generations of Craft' },
  { value: 3, suffix: '', label: 'States Served' },
  { value: 100, suffix: '%', label: 'Built with Pride' },
];

const PROCESS_STEPS = [
  { num: '01', title: 'Discovery', desc: 'We sit down and listen. Your vision, your lifestyle, your must-haves.' },
  { num: '02', title: 'Design', desc: 'Floor plans, elevations, materials — your home takes shape on paper first.' },
  { num: '03', title: 'Permitting', desc: 'We handle approvals across GA, SC, and NC so you don\'t have to.' },
  { num: '04', title: 'Construction', desc: 'Foundation through finishes. Weekly updates with photos.' },
  { num: '05', title: 'Walkthrough & Keys', desc: 'Every detail inspected. Every room walked. Keys in your hand.' },
];

const DIFFERENTIATORS = [
  { icon: Home, title: 'One Builder, Start to Finish', desc: 'No subcontractor shuffles. One team that knows your project inside and out — from the first conversation to the final walkthrough.' },
  { icon: Hammer, title: 'We Grade Your Land Too', desc: 'Most builders make you hire a separate site prep company. We do it ourselves — one less contract, one less headache.' },
  { icon: Heart, title: 'Generational Craft', desc: 'JR grew up on job sites watching his father build. This isn\'t a business he started — it\'s a trade he was raised in.' },
  { icon: Sparkles, title: 'Your Home, Our Name', desc: 'Every home carries our reputation. We don\'t cut corners because we have to live with what we build.' },
];

const CRAFT_ICONS = [Ruler, Sparkles, Heart, Hammer];

const CROSS_DIVISIONS = [
  { id: 'commercial', label: 'Commercial Division', desc: 'Steel builds & commercial development', href: '/commercial', icon: '◆' },
  { id: 'grading', label: 'Land Grading & Site Prep', desc: 'Excavation & foundation work', href: '/grading', icon: '◆' },
  { id: 'process', label: 'The Build Process', desc: 'See how we deliver — phase by phase', href: '/process', icon: '◆' },
];

export default function ResidentialPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const scopeRef = useRef<HTMLElement>(null);
  const visionRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const diffRef = useRef<HTMLElement>(null);
  const trustRef = useRef<HTMLElement>(null);
  const crossRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data?.residentialVideoUrl) setVideoUrl(data.residentialVideoUrl); })
      .catch(() => {});
  }, []);

  const openDrawer = (name: string) => {
    const detail = RESIDENTIAL_SERVICE_DETAILS[name];
    if (detail) { setSelectedService(detail); setDrawerOpen(true); }
  };

  // ═══ GSAP — softer, warmer animations than commercial ═══
  useEffect(() => {
    if (!mounted || !containerRef.current || reducedMotion) return;
    const ctx = gsap.context(() => {

      // Hero — gentle float-in
      if (heroRef.current) {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        const badge = heroRef.current.querySelector('.hero-badge');
        const h1 = heroRef.current.querySelector('h1');
        const line = heroRef.current.querySelector('.hero-gold-line');
        const desc = heroRef.current.querySelector('.hero-desc');
        const btns = heroRef.current.querySelector('.hero-btns');
        const stats = heroRef.current.querySelector('.hero-stats');
        if (badge) tl.fromTo(badge, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.3);
        if (h1) tl.fromTo(h1, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0.4);
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1, transformOrigin: 'left' }, 0.9);
        if (desc) tl.fromTo(desc, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 1.1);
        if (btns) tl.fromTo(btns, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 1.4);
        if (stats) tl.fromTo(stats, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 1.6);
      }

      // Scope — gentle fade-up (not harsh L/R like commercial)
      if (scopeRef.current) {
        const head = scopeRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1,
          scrollTrigger: { trigger: head, start: 'top 85%' } });
        const panels = scopeRef.current.querySelectorAll('.scope-panel');
        panels.forEach((p, i) => {
          gsap.fromTo(p, { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, delay: i * 0.08, ease: 'power2.out',
              scrollTrigger: { trigger: p, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Vision — the emotional core, slow reveal
      if (visionRef.current) {
        const paras = visionRef.current.querySelectorAll('.vision-para');
        paras.forEach(p => {
          gsap.fromTo(p, { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out',
              scrollTrigger: { trigger: p, start: 'top 82%', toggleActions: 'play none none reverse' } });
        });
        const quote = visionRef.current.querySelector('.vision-quote');
        if (quote) gsap.fromTo(quote, { x: -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: quote, start: 'top 82%' } });
      }

      // Craft pillars
      if (craftRef.current) {
        const cards = craftRef.current.querySelectorAll('.craft-card');
        cards.forEach((c, i) => {
          gsap.fromTo(c, { y: 40, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: c, start: 'top 85%', toggleActions: 'play none none reverse' } });
        });
      }

      // Process steps
      if (processRef.current) {
        const steps = processRef.current.querySelectorAll('.process-step');
        steps.forEach((s, i) => {
          gsap.fromTo(s, { y: 35, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: s, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
        const line = processRef.current.querySelector('.process-connector');
        if (line) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 2, ease: 'power2.inOut',
          transformOrigin: 'top', scrollTrigger: { trigger: processRef.current, start: 'top 70%', end: 'bottom 50%', scrub: 1 } });
      }

      // Differentiators
      if (diffRef.current) {
        const head = diffRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1,
          scrollTrigger: { trigger: head, start: 'top 85%' } });
        const props = diffRef.current.querySelectorAll('.diff-prop');
        props.forEach((p, i) => {
          gsap.fromTo(p, { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: p, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Trust
      if (trustRef.current) {
        gsap.fromTo(trustRef.current.querySelector('.trust-content'),
          { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: trustRef.current, start: 'top 80%' } });
      }

      // Cross-division
      if (crossRef.current) {
        const cards = crossRef.current.querySelectorAll('.cross-card');
        gsap.fromTo(cards, { y: 35, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: crossRef.current, start: 'top 80%' } });
      }

      // CTA
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.querySelector('.cta-inner'),
          { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' } });
      }

    }, containerRef);
    return () => ctx.revert();
  }, [mounted, reducedMotion]);

  if (!mounted) return <div className="min-h-screen bg-ro-black" />;

  return (
    <div ref={containerRef}>
      <ServiceDrawer service={selectedService} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ═══ SECTION 1 — HERO (warm, cinematic) ═══ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex flex-col justify-center overflow-hidden">
        {videoUrl ? (
          <>
            <video key={videoUrl} src={videoUrl} autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a150d]/80 via-ro-black/50 to-ro-black" style={{ zIndex: 1 }} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a150d]/60 via-transparent to-transparent" style={{ zIndex: 1 }} />
            <div className="absolute inset-0 blueprint-overlay-warm opacity-15" style={{ zIndex: 1 }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 blueprint-overlay-warm" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#241c10] via-[#1f170c]/95 to-ro-black" />
            {/* Multiple warm ambient glows when no video */}
            <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] warm-glow-golden pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] warm-glow-strong pointer-events-none opacity-70" />
          </>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
          <div className="max-w-3xl">
            <div className="hero-badge inline-flex items-center gap-2 px-5 py-2 border border-ro-gold/25 bg-ro-gold/[0.06] backdrop-blur-sm mb-8">
              <Home size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-[0.25em] uppercase">Residential Division</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.85] mb-8">
              Your Home.<br />
              <span className="gradient-text-gold">Your Vision.</span><br />
              <span className="text-ro-white/90">Built by Hands</span><br />
              <span className="gradient-text-gold">That Care.</span>
            </h1>

            <div className="hero-gold-line w-32 h-[2px] bg-gradient-to-r from-ro-gold/80 via-ro-gold-light/60 to-transparent mb-8" />
            <p className="hero-desc text-ro-gray-300 text-lg sm:text-xl leading-[1.8] mb-10 max-w-xl">
              Custom homes, complex framing, luxury renovations — designed around your life and built to last generations.
            </p>
            <div className="hero-btns flex flex-wrap gap-4">
              <Link href="/contact" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
                Start Your Build <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300 backdrop-blur-sm">
                <Phone size={14} /> {COMPANY.phone}
              </a>
            </div>
          </div>
        </div>
        {/* Stat bar — warm tones */}
        <div className="hero-stats relative z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-ro-gold/[0.08]">
              {HERO_STATS.map((s, i) => (
                <div key={i} className="bg-[#1a150d]/80 backdrop-blur-sm px-6 py-5 text-center">
                  <div className="font-heading text-2xl sm:text-3xl text-ro-gold tracking-tight">{s.value}{s.suffix}</div>
                  <div className="text-ro-gray-500 text-xs font-mono tracking-wider uppercase mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — WHAT WE BUILD (clickable → drawer) ═══ */}
      <section ref={scopeRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 warm-gradient-section" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] warm-glow-strong pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] warm-glow pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">What We Build</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.9]">
              Residential<br /><span className="gradient-text-gold">Services</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-ro-gold/60 to-transparent mt-6" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {division.services.map((service, i) => (
              <button key={service} onClick={() => openDrawer(service)}
                className="scope-panel group relative p-6 sm:p-8 text-left border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm hover:border-ro-gold/25 hover:bg-ro-gold/[0.03] transition-all duration-700 cursor-pointer">
                {/* Warm corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700" />
                <div className="flex items-start gap-5">
                  <span className="font-heading text-3xl sm:text-4xl text-ro-gold/15 group-hover:text-ro-gold/30 transition-colors duration-700 tracking-tighter flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase group-hover:text-ro-gold-light transition-colors duration-700 mb-1">
                      {service}
                    </h3>
                    <span className="text-ro-gray-700 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Tap for details
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-ro-gray-800 group-hover:text-ro-gold/50 transition-colors duration-500 flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — THE VISION (emotional storytelling core — golden hour) ═══ */}
      <section ref={visionRef} className="py-36 sm:py-48 relative overflow-hidden">
        <div className="absolute inset-0 warm-gradient-deep" />
        {/* Multiple golden-hour glow layers — like sunlight through windows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] warm-glow-golden pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] warm-glow-strong pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] warm-glow pointer-events-none opacity-80" />
        <div className="absolute inset-0 warm-vignette pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="vision-para text-center mb-16">
            <span className="text-ro-gold/60 text-xs font-mono tracking-[0.4em] uppercase block mb-8">More Than Construction</span>
            <p className="text-ro-white font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight uppercase leading-[1.15]">
              Building a home isn&apos;t just construction.
            </p>
          </div>

          <div className="vision-para mb-14">
            <p className="text-ro-gray-300 text-base sm:text-lg leading-[2] text-center">
              It&apos;s the kitchen where your family gathers on Sunday mornings.
              The porch where you watch your kids play in the yard.
              The master suite that&apos;s finally, truly <em className="text-ro-gold not-italic">yours</em>.
            </p>
          </div>

          <div className="vision-para mb-14">
            <p className="text-ro-gray-300 text-base sm:text-lg leading-[2] text-center">
              We&apos;ve been building these moments for 25 years — two generations of
              understanding that a home is where life happens, and it deserves to be
              built by hands that care about getting it right.
            </p>
          </div>

          {/* Gold pull quote — the signature line */}
          <div className="vision-quote my-16 py-10 border-y border-ro-gold/20 text-center">
            <p className="text-ro-gold font-heading text-xl sm:text-2xl lg:text-3xl tracking-tight uppercase leading-[1.2] text-shadow-gold">
              &ldquo;A house is structure.<br />A home is intention.&rdquo;
            </p>
          </div>

          <div className="vision-para text-center">
            <p className="text-ro-gray-400 text-sm leading-relaxed">
              We build every home like it&apos;s our own. That&apos;s not a tagline — it&apos;s a promise.
            </p>
            <Link href="/our-story" className="inline-flex items-center gap-2 text-ro-gold/60 text-xs font-mono tracking-wider uppercase mt-4 hover:text-ro-gold transition-colors">
              Read our story <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — THE CRAFT (craftsmanship showcase) ═══ */}
      <section ref={craftRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 warm-gradient-section" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] warm-glow-strong pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Craftsmanship</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              The <span className="gradient-text-gold">Craft</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CRAFT_PILLARS.map((pillar, i) => {
              const Icon = CRAFT_ICONS[i];
              return (
                <div key={pillar.title} className="craft-card group relative p-6 sm:p-8 border border-ro-gray-800/30 bg-[#1a150d]/20 hover:border-ro-gold/20 hover:bg-ro-gold/[0.02] transition-all duration-700 text-center">
                  <div className="w-11 h-11 mx-auto flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-5 group-hover:border-ro-gold/35 group-hover:bg-ro-gold/[0.08] transition-all duration-700">
                    <Icon size={18} className="text-ro-gold/70 group-hover:text-ro-gold transition-colors duration-700" />
                  </div>
                  <h3 className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase mb-3 group-hover:text-ro-gold-light transition-colors duration-700">{pillar.title}</h3>
                  <p className="text-ro-gray-500 text-xs sm:text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — THE JOURNEY (process accordion) ═══ */}
      <section ref={processRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black to-[#1a150d]/15" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Your Build Journey</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.9]">
              From Vision<br /><span className="gradient-text-gold">to Home</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>
          <div className="relative">
            <div className="process-connector absolute left-8 sm:left-12 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ro-gold/50 via-ro-gold/30 to-ro-gold/10" />
            <div className="space-y-6 sm:space-y-8">
              {PROCESS_STEPS.map((step) => {
                const detail = RESIDENTIAL_PROCESS[step.title];
                const isExpanded = expandedStep === step.title;
                return (
                  <div key={step.num} className="process-step relative">
                    <button onClick={() => setExpandedStep(isExpanded ? null : step.title)}
                      className="flex gap-8 sm:gap-12 items-start w-full text-left group cursor-pointer">
                      <div className="flex-shrink-0 relative z-10 w-16 sm:w-24 flex items-center justify-center">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 bg-ro-black flex items-center justify-center transition-all duration-500 ${isExpanded ? 'border-ro-gold bg-ro-gold/10' : 'border-ro-gold/40'}`}>
                          <span className="font-mono text-ro-gold text-xs sm:text-sm">{step.num}</span>
                        </div>
                      </div>
                      <div className="flex-1 pb-2 pt-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-ro-white font-heading text-xl sm:text-2xl tracking-wider uppercase group-hover:text-ro-gold-light transition-colors">{step.title}</h3>
                          <ChevronDown size={16} className={`text-ro-gold/30 transition-all duration-300 ${isExpanded ? 'rotate-180 text-ro-gold' : ''}`} />
                        </div>
                        <p className="text-ro-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mt-1">{step.desc}</p>
                      </div>
                    </button>
                    {isExpanded && detail && (
                      <div className="ml-24 sm:ml-36 mt-4 pb-4 border-l-2 border-ro-gold/15 pl-6 space-y-4 animate-card-up">
                        <div className="space-y-2">
                          {detail.bullets.map((b, bi) => (
                            <div key={bi} className="flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-ro-gold/70 mt-0.5 flex-shrink-0" />
                              <span className="text-ro-gray-300 text-sm leading-relaxed">{b}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-ro-gold/70 text-xs font-mono tracking-wider uppercase flex-shrink-0 mt-0.5">Your Role:</span>
                            <span className="text-ro-gray-400 text-xs sm:text-sm">{detail.clientRole}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-ro-gold/70 text-xs font-mono tracking-wider uppercase flex-shrink-0 mt-0.5">Deliverable:</span>
                            <span className="text-ro-gray-400 text-xs sm:text-sm">{detail.deliverable}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — THE RO DIFFERENCE (residential version) ═══ */}
      <section ref={diffRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 warm-gradient-section" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-8" />
        <div className="absolute bottom-1/3 left-1/3 w-[700px] h-[500px] warm-glow pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-20 text-center">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Why Families Choose RO</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              The RO <span className="gradient-text-gold">Difference</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {DIFFERENTIATORS.map((diff, i) => {
              const Icon = diff.icon;
              return (
                <div key={i} className="diff-prop group relative p-8 sm:p-10 border border-ro-gray-800/30 bg-[#1a150d]/15 hover:border-ro-gold/20 hover:bg-ro-gold/[0.02] transition-all duration-700">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/45 transition-colors duration-700" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/45 transition-colors duration-700" />
                  <div className="w-12 h-12 flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-6 group-hover:border-ro-gold/30 group-hover:bg-ro-gold/[0.08] transition-all duration-700">
                    <Icon size={22} className="text-ro-gold/70 group-hover:text-ro-gold transition-colors duration-700" />
                  </div>
                  <h3 className="text-ro-white font-heading text-lg sm:text-xl tracking-wider uppercase mb-3 group-hover:text-ro-gold-light transition-colors duration-700">{diff.title}</h3>
                  <p className="text-ro-gray-400 text-sm sm:text-base leading-relaxed">{diff.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7 — TRUST ═══ */}
      <section ref={trustRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 warm-gradient-deep" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] warm-glow-golden pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] warm-glow-strong pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="trust-content">
            <div className="text-ro-gold/10 font-heading text-[120px] sm:text-[160px] leading-none select-none mb-[-40px] sm:mb-[-60px]">&ldquo;</div>
            <blockquote className="text-ro-white font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight uppercase leading-[1.15] mb-8">
              We build homes the way<br /><span className="gradient-text-gold">we&apos;d build our own.</span>
            </blockquote>
            <p className="text-ro-gray-500 text-sm font-mono tracking-[0.3em] uppercase mb-4">Two generations of building homes across three states</p>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/30 to-transparent mx-auto mb-4" />
            <Link href="/our-story" className="text-ro-gold/50 text-xs font-mono tracking-wider uppercase hover:text-ro-gold transition-colors inline-flex items-center gap-1">
              Read our story <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8 — CROSS-DIVISION ═══ */}
      <section ref={crossRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black to-[#1a150d]/15" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Full-Service</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              More Than <span className="gradient-text-gold">Residential</span>
            </h2>
            <p className="text-ro-gray-500 text-sm sm:text-base mt-4 max-w-md mx-auto">One company. Total capability. Ground up.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {CROSS_DIVISIONS.map((div) => (
              <Link key={div.id} href={div.href}
                className="cross-card group relative p-8 border border-ro-gray-800/30 bg-[#1a150d]/10 hover:border-ro-gold/20 hover:bg-ro-gold/[0.02] transition-all duration-700 text-center">
                <div className="text-ro-gold/20 text-2xl mb-4 group-hover:text-ro-gold/45 transition-colors duration-700">{div.icon}</div>
                <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-700">{div.label}</h3>
                <p className="text-ro-gray-500 text-xs sm:text-sm">{div.desc}</p>
                <div className="mt-4 flex items-center justify-center gap-1 text-ro-gold/40 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Explore <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 9 — THE CLOSE (warm CTA) ═══ */}
      <section ref={ctaRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 warm-gradient-deep" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-6" />
        {/* Layered warm radial glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] warm-glow-golden pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] warm-glow-strong pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-inner">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-12" />
            <span className="text-ro-gold/70 text-xs font-mono tracking-[0.4em] uppercase block mb-6">Let&apos;s Build Your Home</span>
            <h2 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.85] mb-8">
              Ready to<br /><span className="gradient-text-gold">Build?</span>
            </h2>
            <p className="text-ro-gray-400 text-base sm:text-lg leading-relaxed mb-12 max-w-md mx-auto">
              Tell us about your vision. The first conversation is always free.
            </p>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-4 text-ro-gold font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight hover:text-ro-gold-light transition-colors duration-300 mb-10">
              <Phone size={28} className="flex-shrink-0" /> {COMPANY.phone}
            </a>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/contact" className="group flex items-center gap-3 px-10 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
                Start Your Build <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 px-8 py-4 border border-ro-gold/25 text-ro-gold/80 font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/40 transition-all duration-300">
                {COMPANY.email}
              </a>
            </div>
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/30 to-transparent mx-auto" />
          </div>
        </div>
      </section>

    </div>
  );
}
