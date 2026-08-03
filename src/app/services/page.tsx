'use client';

import Link from 'next/link';
import Image from 'next/image';
import { DIVISIONS, COMPANY } from '@/lib/constants';
import { SERVICE_CATEGORIES, SERVICES_DETAIL, SERVICES_PROCESS } from '@/lib/services-data';
import { ArrowRight, Phone, Wrench, HardHat, Droplets, Zap, Pipette, CheckCircle2, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import ServiceDrawer from '@/components/ServiceDrawer';
import type { ServiceDetail } from '@/lib/commercial-data';

const division = DIVISIONS.find(d => d.id === 'services')!;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  roofing: HardHat,
  septic: Droplets,
  electrical: Zap,
  plumbing: Pipette,
  repairs: Wrench,
};

const HERO_STATS = [
  { value: '25+', label: 'Years Experience' },
  { value: '3', label: 'States Served' },
  { value: '100%', label: 'Licensed & Insured' },
  { value: '24hr', label: 'Emergency Response' },
];

const PROCESS_STEPS = [
  { num: '01', title: 'Call or Request', desc: 'Call us or submit a quote request. Describe the issue — we\'ll handle the rest.' },
  { num: '02', title: 'Assessment', desc: 'A crew member visits to inspect, diagnose, and provide a written estimate.' },
  { num: '03', title: 'Schedule & Execute', desc: 'We lock in a date, stage materials, and get it done on schedule.' },
  { num: '04', title: 'Follow-Up', desc: 'We check in after the job. Warranty issues are handled promptly.' },
];

const CROSS_DIVISIONS = [
  { id: 'residential', label: 'Residential Division', desc: 'Custom homes & luxury renovations', href: '/residential', icon: '◆' },
  { id: 'commercial', label: 'Commercial Division', desc: 'Steel builds & commercial development', href: '/commercial', icon: '◆' },
  { id: 'grading', label: 'Land Grading & Site Prep', desc: 'Excavation & foundation work', href: '/grading', icon: '◆' },
];

export default function ServicesPage() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
  const whyRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const crossRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const openDrawer = (name: string) => {
    const detail = SERVICES_DETAIL[name];
    if (detail) { setSelectedService(detail); setDrawerOpen(true); }
  };

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const ctx = gsap.context(() => {

      // Hero entrance
      if (heroRef.current) {
        const badge = heroRef.current.querySelector('.hero-badge');
        const h1 = heroRef.current.querySelector('h1');
        const line = heroRef.current.querySelector('.hero-gold-line');
        const desc = heroRef.current.querySelector('.hero-desc');
        const btns = heroRef.current.querySelector('.hero-btns');
        const stats = heroRef.current.querySelector('.hero-stats');

        gsap.set([badge, h1, line, desc, btns, stats], { opacity: 0 });

        const tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'power2.out' } });
        if (badge) tl.fromTo(badge, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0);
        if (h1)    tl.fromTo(h1,    { y: 50, opacity: 0 },  { y: 0, opacity: 1, duration: 1.1 }, 0.15);
        if (line)  tl.fromTo(line,  { scaleX: 0, opacity: 0, transformOrigin: 'left center' }, { scaleX: 1, opacity: 1, duration: 0.9, ease: 'power2.inOut' }, 0.6);
        if (desc)  tl.fromTo(desc,  { y: 25, opacity: 0 },  { y: 0, opacity: 1, duration: 0.9 }, 0.8);
        if (btns)  tl.fromTo(btns,  { y: 25, opacity: 0 },  { y: 0, opacity: 1, duration: 0.8 }, 1.05);
        if (stats) tl.fromTo(stats, { y: 30, opacity: 0 },  { y: 0, opacity: 1, duration: 1.0 }, 1.3);
      }

      // Categories
      if (categoriesRef.current) {
        const head = categoriesRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1,
          scrollTrigger: { trigger: head, start: 'top 85%' } });
        const cards = categoriesRef.current.querySelectorAll('.category-card');
        cards.forEach((c, i) => {
          gsap.fromTo(c, { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, delay: i * 0.08, ease: 'power2.out',
              scrollTrigger: { trigger: c, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Why RO section
      if (whyRef.current) {
        const items = whyRef.current.querySelectorAll('.why-item');
        items.forEach((item, i) => {
          gsap.fromTo(item, { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' } });
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
  }, [mounted]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'RO Unlimited Construction & Development',
    description: 'Roofing, plumbing, electrical, septic systems, and general repairs across Upstate SC, Georgia, and North Carolina. Licensed, insured, 25+ years experience.',
    telephone: '(864) 304-0139',
    email: 'Rounlimitedco@gmail.com',
    url: 'https://rounlimited.com/services',
    areaServed: [
      { '@type': 'State', name: 'South Carolina' },
      { '@type': 'State', name: 'Georgia' },
      { '@type': 'State', name: 'North Carolina' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'SC',
      addressCountry: 'US',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'RO Services',
      itemListElement: SERVICE_CATEGORIES.map((cat, i) => ({
        '@type': 'OfferCatalog',
        name: cat.title,
        url: `https://rounlimited.com/services/${cat.slug}`,
        position: i + 1,
      })),
    },
  };

  // NOTE: no !mounted gate here — the full page must be in the SSR HTML for SEO.
  // GSAP entrance animations still run post-mount via the mounted-gated effects.

  return (
    <div ref={containerRef}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceDrawer service={selectedService} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ═══ HERO — with background image ═══ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex flex-col overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/services/roofing/roofing-hero.jpg"
          alt="RO Unlimited Services"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          style={{ zIndex: 0 }}
        />
        {/* Left-heavy gradient overlay for text legibility */}
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.6) 55%, rgba(0,0,0,0.15) 80%)' }} />
        {/* Top/bottom vignette */}
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, transparent 20%, transparent 75%, rgba(10,10,10,0.95) 100%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] pointer-events-none" style={{ zIndex: 2, background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-center flex-1 px-6 sm:px-10 lg:pl-16 lg:pr-0 pt-28 pb-6" style={{ maxWidth: 'min(520px, 100%)' }}>
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-black/40 backdrop-blur-sm mb-7 self-start">
            <Wrench size={12} className="text-ro-gold flex-shrink-0" />
            <span className="text-ro-gold text-[10px] font-mono tracking-[0.3em] uppercase">RO Services Division</span>
          </div>

          <h1 className="text-ro-white font-heading uppercase leading-[0.88] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.6rem, 5vw, 4.5rem)' }}>
            Every Job<br />
            <span className="gradient-text-gold">Matters.</span><br />
            Every Client<br />
            <span className="gradient-text-gold">Counts.</span>
          </h1>

          <div className="hero-gold-line w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />

          <p className="hero-desc text-ro-white/90 text-sm sm:text-base leading-relaxed tracking-wide mb-8 max-w-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
            {division.description}
          </p>

          <div className="hero-btns flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
            <Link href="/contact" className="group inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300 whitespace-nowrap">
              Get a Quote <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300 backdrop-blur-sm whitespace-nowrap">
              <Phone size={12} /> {COMPANY.phone}
            </a>
          </div>
        </div>

        {/* Stat bar */}
        <div className="hero-stats relative z-10 mt-auto">
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-ro-gold/10 border-t border-ro-gold/10"
              style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}>
              {HERO_STATS.map((s, i) => (
                <div key={i} className="px-6 py-4 text-center">
                  <div className="font-heading text-xl sm:text-2xl text-ro-gold tracking-tight">{s.value}</div>
                  <div className="text-ro-gray-600 text-[10px] font-mono tracking-wider uppercase mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SERVICE CATEGORIES ═══ */}
      <section ref={categoriesRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.11]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[450px] h-[450px] warm-glow-strong animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">What We Handle</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.9]">
              Our<br /><span className="gradient-text-gold">Services</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-ro-gold/60 to-transparent mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || Wrench;
              return (
                <Link key={cat.id} href={`/services/${cat.slug}`}
                  className="category-card group relative p-7 sm:p-8 border border-ro-gray-800/40 overflow-hidden hover:border-ro-gold/25 transition-all duration-700">
                  {/* Hover-reveal background image */}
                  {cat.cardImage && (
                    <>
                      <Image src={cat.cardImage} alt="" fill className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" sizes="(max-width: 1023px) 100vw, 33vw" />
                      <div className="absolute inset-0 bg-ro-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </>
                  )}
                  {/* Idle background */}
                  <div className="absolute inset-0 bg-ro-gray-900/20 backdrop-blur-sm group-hover:bg-transparent transition-colors duration-700" />

                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />

                  <div className="relative z-10">
                    <div className="w-11 h-11 flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-5 group-hover:border-ro-gold/35 group-hover:bg-ro-black/50 transition-all duration-700">
                      <Icon size={20} className="text-ro-gold/70 group-hover:text-ro-gold transition-colors duration-700" />
                    </div>

                    <h3 className="text-ro-white font-heading text-lg tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-700">
                      {cat.title}
                    </h3>
                    <p className="text-ro-gray-500 text-sm leading-relaxed mb-4 group-hover:text-ro-gray-300 transition-colors duration-700">
                      {cat.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {cat.services.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 text-[10px] font-mono text-ro-gray-600 border border-ro-gray-800/60 group-hover:border-ro-gold/20 group-hover:text-ro-gray-400 transition-colors duration-700">{s}</span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-ro-gold/50 text-xs font-mono tracking-wider uppercase group-hover:text-ro-gold transition-colors duration-500">
                      View Details <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Small Renovations — inline card that opens drawer */}
            <button onClick={() => openDrawer('Small Renovations')}
              className="category-card group relative p-7 sm:p-8 border border-ro-gray-800/40 overflow-hidden hover:border-ro-gold/25 transition-all duration-700 text-left cursor-pointer">
              <div className="absolute inset-0 bg-ro-gray-900/20 backdrop-blur-sm group-hover:bg-transparent transition-colors duration-700" />
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />

              <div className="relative z-10">
                <div className="w-11 h-11 flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-5 group-hover:border-ro-gold/35 group-hover:bg-ro-gold/[0.08] transition-all duration-700">
                  <Wrench size={20} className="text-ro-gold/70 group-hover:text-ro-gold transition-colors duration-700" />
                </div>

                <h3 className="text-ro-white font-heading text-lg tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-700">
                  Small Renovations
                </h3>
                <p className="text-ro-gray-500 text-sm leading-relaxed mb-4">
                  Bathroom updates, kitchen refreshes, ADA modifications, and room conversions — focused renovations that transform spaces.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 text-[10px] font-mono text-ro-gray-600 border border-ro-gray-800/60">Bathroom Updates</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-ro-gray-600 border border-ro-gray-800/60">Kitchen Refreshes</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-ro-gray-600 border border-ro-gray-800/60">ADA Modifications</span>
                </div>

                <div className="flex items-center gap-2 text-ro-gold/50 text-xs font-mono tracking-wider uppercase group-hover:text-ro-gold transition-colors duration-500">
                  Tap for Details <ArrowRight size={12} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ CINEMATIC PHOTO BREAK ═══ */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/services/repairs/repairs-hero.jpg"
          alt="RO Unlimited crew at work"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-ro-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-transparent to-ro-black" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/50 to-transparent mx-auto mb-8" />
          <p className="text-ro-white font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight uppercase leading-[1.1]">
            We don&apos;t just <span className="gradient-text-gold">fix things.</span>
          </p>
          <p className="text-ro-white/80 font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight uppercase leading-[1.1] mt-2">
            We build <span className="gradient-text-gold">trust.</span>
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/50 to-transparent mx-auto mt-8" />
        </div>
      </section>

      {/* ═══ WHY RO FOR SERVICE WORK ═══ */}
      <section ref={whyRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.09]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] warm-glow-golden animate-ember pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] warm-glow pointer-events-none opacity-80" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Why RO</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              Not Just <span className="gradient-text-gold">Another Contractor</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {[
              { title: 'Full-Service Company', desc: 'Most handymen can\'t do structural work. Most GCs won\'t do small jobs. RO does both — with the same crew, same standards, same accountability.' },
              { title: '25+ Years of Trust', desc: 'We\'ve been building in the Upstate for over two decades. Your neighbors know us. Your property manager has our number. We show up and we deliver.' },
              { title: 'Licensed & Insured', desc: 'Every trade we touch is covered by proper licensing and insurance. No fly-by-night subs, no liability gaps. Your property is protected.' },
              { title: 'One Call, Everything Handled', desc: 'Roof, plumbing, electrical, septic — one number to call for all of it. We coordinate the trades so you don\'t have to manage multiple contractors.' },
            ].map((item, i) => (
              <div key={i} className="why-item group relative p-8 sm:p-10 border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm hover:border-ro-gold/25 hover:bg-ro-gold/[0.03] transition-all duration-700">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/45 transition-colors duration-700" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/45 transition-colors duration-700" />
                <h3 className="text-ro-white font-heading text-lg sm:text-xl tracking-wider uppercase mb-3 group-hover:text-ro-gold-light transition-colors duration-700">{item.title}</h3>
                <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS (process accordion) ═══ */}
      <section ref={processRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.09]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] warm-glow-strong pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">How It Works</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.9]">
              Simple<br /><span className="gradient-text-gold">Process</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>
          <div className="relative">
            <div className="process-connector absolute left-8 sm:left-12 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ro-gold/50 via-ro-gold/30 to-ro-gold/10" />
            <div className="space-y-6 sm:space-y-8">
              {PROCESS_STEPS.map((step) => {
                const detail = SERVICES_PROCESS[step.title];
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
                        <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed max-w-lg mt-1">{step.desc}</p>
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
                            <span className="text-ro-gray-300 text-xs sm:text-sm">{detail.clientRole}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-ro-gold/70 text-xs font-mono tracking-wider uppercase flex-shrink-0 mt-0.5">Deliverable:</span>
                            <span className="text-ro-gray-300 text-xs sm:text-sm">{detail.deliverable}</span>
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

      {/* ═══ CROSS-DIVISION ═══ */}
      <section ref={crossRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] warm-glow-strong animate-ember pointer-events-none opacity-70" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Full-Service</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              More Than <span className="gradient-text-gold">Repairs</span>
            </h2>
            <p className="text-ro-gray-400 text-sm sm:text-base mt-4 max-w-md mx-auto">A repair call today is how a lot of clients find out we also build the building. One company — total capability.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {CROSS_DIVISIONS.map((div) => (
              <Link key={div.id} href={div.href}
                className="cross-card group relative p-8 border border-ro-gray-800/40 bg-[#1a150d]/20 hover:border-ro-gold/25 hover:bg-ro-gold/[0.03] transition-all duration-700 text-center">
                <div className="text-ro-gold/20 text-2xl mb-4 group-hover:text-ro-gold/45 transition-colors duration-700">{div.icon}</div>
                <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-700">{div.label}</h3>
                <p className="text-ro-gray-400 text-xs sm:text-sm">{div.desc}</p>
                <div className="mt-4 flex items-center justify-center gap-1 text-ro-gold/40 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Explore <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={ctaRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.06]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] warm-glow-golden animate-ember pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] warm-glow-strong pointer-events-none" />
        <div className="absolute inset-0 warm-vignette pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-inner">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-12" />
            <span className="text-ro-gold/70 text-xs font-mono tracking-[0.4em] uppercase block mb-6">Let&apos;s Get It Done</span>
            <h2 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.85] mb-8">
              Need a<br /><span className="gradient-text-gold">Fix?</span>
            </h2>
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-12 max-w-md mx-auto">
              Tell us what&apos;s going on. We&apos;ll give you a straight answer and a fair price.
            </p>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-4 text-ro-gold font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight hover:text-ro-gold-light transition-colors duration-300 mb-10">
              <Phone size={28} className="flex-shrink-0" /> {COMPANY.phone}
            </a>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/contact" className="group flex items-center gap-3 px-10 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
                Request a Quote <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
