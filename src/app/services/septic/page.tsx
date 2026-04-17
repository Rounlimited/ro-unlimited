'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { SERVICE_CATEGORIES } from '@/lib/services-data';
import { SEPTIC_SUB_SERVICES } from '@/lib/septic-data';
import { ArrowRight, Phone, Droplets, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';

const category = SERVICE_CATEGORIES.find(c => c.id === 'septic')!;

const HERO_STATS = [
  { value: 'DHEC', label: 'Permitted Installs' },
  { value: '24/7', label: 'Emergency Response' },
  { value: '30+yr', label: 'System Lifespan' },
  { value: '8', label: 'Specialties' },
];

const CROSS_DIVISIONS = [
  { id: 'residential', label: 'Residential Division', desc: 'Custom homes & luxury renovations', href: '/residential' },
  { id: 'plumbing', label: 'Plumbing Services', desc: 'Pipe repair, water heaters & fixtures', href: '/services/plumbing' },
  { id: 'electrical', label: 'Electrical Services', desc: 'Panel upgrades, EV chargers & more', href: '/services/electrical' },
];

export default function SepticPage() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const guidesRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const crossRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const ctx = gsap.context(() => {

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

      if (guidesRef.current) {
        const head = guidesRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        const cards = guidesRef.current.querySelectorAll('.guide-card');
        cards.forEach((c, i) => {
          gsap.fromTo(c, { y: 50, opacity: 0, scale: 0.96 },
            { y: 0, opacity: 1, scale: 1, duration: 1, delay: i * 0.06, ease: 'power2.out',
              scrollTrigger: { trigger: c, start: 'top 90%', toggleActions: 'play none none reverse' } });
        });
      }

      if (galleryRef.current) {
        const imgs = galleryRef.current.querySelectorAll('.gallery-item');
        imgs.forEach((img, i) => {
          gsap.fromTo(img, { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: img, start: 'top 90%', toggleActions: 'play none none reverse' } });
        });
      }

      if (faqRef.current) {
        const items = faqRef.current.querySelectorAll('.faq-item');
        items.forEach((item, i) => {
          gsap.fromTo(item, { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      if (crossRef.current) {
        const cards = crossRef.current.querySelectorAll('.cross-card');
        gsap.fromTo(cards, { y: 35, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: crossRef.current, start: 'top 80%' } });
      }

      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.querySelector('.cta-inner'),
          { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' } });
      }

    }, containerRef);
    return () => ctx.revert();
  }, [mounted]);

  if (!mounted) return <div className="min-h-screen bg-ro-black" />;

  return (
    <div ref={containerRef}>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex flex-col overflow-hidden">
        <img src={category.heroImage} alt="RO Unlimited Septic Services" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.6) 55%, rgba(0,0,0,0.15) 80%)' }} />
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, transparent 20%, transparent 75%, rgba(10,10,10,0.95) 100%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] pointer-events-none" style={{ zIndex: 2, background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-center flex-1 px-6 sm:px-10 lg:pl-16 pt-28 pb-6" style={{ maxWidth: 'min(520px, 100%)' }}>
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-black/40 backdrop-blur-sm mb-7 self-start">
            <Droplets size={12} className="text-ro-gold flex-shrink-0" />
            <span className="text-ro-gold text-[10px] font-mono tracking-[0.3em] uppercase">RO Septic Division</span>
          </div>

          <h1 className="font-heading uppercase leading-[0.88] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.6rem, 5vw, 4.5rem)' }}>
            <span className="hero-text-fade">Septic Done</span><br />
            <span className="gradient-text-gold">Right.</span><br />
            <span className="hero-text-fade">Permitted.</span><br />
            <span className="gradient-text-gold">Built to Last.</span>
          </h1>

          <div className="hero-gold-line w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />

          <p className="hero-desc text-sm sm:text-base leading-relaxed mb-8 max-w-sm hero-text-fade-subtle">
            {category.hero}
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

      {/* ═══ SEPTIC SPECIALTIES ═══ */}
      <section ref={guidesRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.11]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] warm-glow-strong animate-ember pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] warm-glow pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-20 text-center">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Our Specialties</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.9]">
              Septic<br /><span className="gradient-text-gold">Services</span>
            </h2>
            <p className="text-ro-gray-400 text-sm sm:text-base mt-6 max-w-lg mx-auto leading-relaxed">
              Tap into any specialty below for detailed guides — costs, process, warning signs, and exactly how we do the work.
            </p>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {SEPTIC_SUB_SERVICES.map((svc) => (
              <Link key={svc.id} href={`/services/septic/${svc.slug}`}
                className="guide-card group relative overflow-hidden border border-ro-gray-800/40 hover:border-ro-gold/25 transition-all duration-700">
                <img src={svc.cardImage} alt={svc.title} className="absolute inset-0 w-full h-full object-cover opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-ro-black/75 sm:bg-ro-black/80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-transparent sm:bg-ro-gray-900/10 sm:group-hover:bg-transparent transition-colors duration-700" />
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-700 z-10" />

                <div className="relative z-10 flex items-center gap-5 p-5 sm:p-7 sm:flex-col sm:text-center">
                  <div className="w-12 h-12 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center border border-ro-gold/25 sm:border-ro-gold/15 bg-ro-black/50 sm:bg-ro-gold/[0.04] sm:mb-2 group-hover:border-ro-gold/35 group-hover:bg-ro-black/50 transition-all duration-700">
                    <Droplets size={20} className="text-ro-gold sm:text-ro-gold/70 sm:group-hover:text-ro-gold transition-colors duration-700" />
                  </div>
                  <div className="flex-1 sm:flex-initial">
                    <h3 className="text-ro-white font-heading text-base tracking-wider uppercase mb-1 sm:mb-2 group-hover:text-ro-gold-light transition-colors duration-700">{svc.title}</h3>
                    <p className="text-ro-gray-300 sm:text-ro-gray-500 text-xs leading-relaxed sm:mb-4 sm:group-hover:text-ro-gray-300 transition-colors duration-700 line-clamp-2">{svc.tagline}</p>
                    <div className="hidden sm:flex items-center justify-center gap-2 text-ro-gold/40 text-xs font-mono tracking-wider uppercase group-hover:text-ro-gold transition-colors duration-500">
                      Read Guide <ArrowRight size={12} />
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ro-gold/50 flex-shrink-0 sm:hidden" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PHOTO GALLERY ═══ */}
      <section ref={galleryRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.09]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] warm-glow-golden animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Our Work</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              Septic <span className="gradient-text-gold">in Action</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3">
            {category.galleryImages.map((img, i) => (
              <div key={i} className={`gallery-item group relative overflow-hidden border border-ro-gold/10 ${i === 0 ? 'lg:row-span-2' : ''}`}>
                <div className={`relative ${i === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
                  <img src={img} alt="RO Unlimited septic work" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ro-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 border-2 border-ro-gold/0 group-hover:border-ro-gold/30 transition-colors duration-500" />
                </div>
              </div>
            ))}
          </div>

          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            {category.galleryImages.map((img, i) => (
              <div key={i} className="gallery-item flex-shrink-0 w-[75vw] snap-center">
                <div className="relative aspect-[4/3] overflow-hidden border border-ro-gold/10">
                  <img src={img} alt="RO Unlimited septic work" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section ref={faqRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.10]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/3 w-[700px] h-[500px] warm-glow-strong animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Common Questions</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              <span className="gradient-text-gold">FAQ</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="space-y-4">
            {category.faq.map((item, i) => (
              <div key={i} className="faq-item border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm hover:border-ro-gold/15 transition-colors duration-500">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-start gap-4 p-5 sm:p-6 text-left cursor-pointer group">
                  <div className="flex-1">
                    <h3 className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase group-hover:text-ro-gold-light transition-colors">{item.q}</h3>
                  </div>
                  <ChevronDown size={16} className={`text-ro-gold/30 flex-shrink-0 mt-0.5 transition-all duration-300 ${expandedFaq === i ? 'rotate-180 text-ro-gold' : ''}`} />
                </button>
                {expandedFaq === i && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-2">
                    <p className="text-ro-gray-300 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CROSS-DIVISIONS ═══ */}
      <section ref={crossRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] warm-glow-strong animate-ember pointer-events-none opacity-70" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Full-Service</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              More Than <span className="gradient-text-gold">Septic</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {CROSS_DIVISIONS.map((div) => (
              <Link key={div.id} href={div.href}
                className="cross-card group relative p-8 border border-ro-gray-800/40 bg-[#1a150d]/20 hover:border-ro-gold/25 hover:bg-ro-gold/[0.03] transition-all duration-700 text-center">
                <div className="text-ro-gold/20 text-2xl mb-4 group-hover:text-ro-gold/45 transition-colors duration-700">&#9670;</div>
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
      <section ref={ctaRef} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <img src={category.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
        <div className="absolute inset-0 bg-ro-black/88" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 forge-bg-alt" style={{ zIndex: 2, opacity: 0.6 }} />
        <div className="absolute inset-0 forge-slash pointer-events-none" style={{ zIndex: 3 }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] warm-glow-golden animate-ember pointer-events-none" style={{ zIndex: 3 }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-inner">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-12" />
            <span className="text-ro-gold/70 text-xs font-mono tracking-[0.4em] uppercase block mb-6">Ready to Start?</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.85] mb-8">
              Get a<br /><span className="gradient-text-gold">Septic Quote</span>
            </h2>
            <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto">
              Call us directly or request a quote online. Honest answers, DHEC-permitted installs, and no sales pressure — just real septic help.
            </p>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-4 text-ro-gold font-heading text-3xl sm:text-4xl tracking-tight hover:text-ro-gold-light transition-colors duration-300 mb-10">
              <Phone size={24} className="flex-shrink-0" /> {COMPANY.phone}
            </a>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="group flex items-center gap-3 px-10 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
                Request a Quote <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/30 to-transparent mx-auto mt-12" />
          </div>
        </div>
      </section>
    </div>
  );
}
