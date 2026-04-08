'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import type { SubService } from '@/lib/sub-service-types';
import {
  ArrowRight, Phone, AlertTriangle, Shield, CheckCircle2,
  ChevronDown, Wrench, DollarSign, Clock,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';

interface SubServicePageProps {
  subService: SubService;
  parentSlug: string;
  parentLabel: string;
  icon: React.ElementType;
  allSubServices: SubService[];
}

interface DynamicImages { hero?: string; card?: string; gallery: string[] }

export default function SubServicePage({ subService, parentSlug, parentLabel, icon: Icon, allSubServices }: SubServicePageProps) {
  const [mounted, setMounted] = useState(false);
  const [dynImages, setDynImages] = useState<DynamicImages | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
  const subGalleryRef = useRef<HTMLElement>(null);
  const warningsRef = useRef<HTMLElement>(null);
  const maintenanceRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const costRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const crossRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  const otherServices = allSubServices.filter(s => s.id !== subService.id);

  // Fetch custom images from Supabase (if any uploaded via admin)
  useEffect(() => {
    fetch(`/api/admin/service-images?division=${parentSlug}&serviceId=${subService.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ image_type: string; image_url: string; sort_order: number }>) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const hero = data.find(d => d.image_type === 'hero')?.image_url;
        const card = data.find(d => d.image_type === 'card')?.image_url;
        const gallery = data.filter(d => d.image_type === 'gallery').sort((a, b) => a.sort_order - b.sort_order).map(d => d.image_url);
        setDynImages({ hero, card, gallery });
      })
      .catch(() => {});
  }, [parentSlug, subService.id]);

  // Resolved images: DB overrides > hardcoded defaults
  const heroImage = dynImages?.hero || subService.heroImage;
  const galleryImgs = (dynImages?.gallery && dynImages.gallery.length > 0) ? dynImages.gallery : (subService.galleryImages || []);

  useEffect(() => { setMounted(true); }, []);

  // ═══ GSAP ANIMATIONS ═══
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const ctx = gsap.context(() => {

      // Hero — staggered timeline entrance
      if (heroRef.current) {
        const badge = heroRef.current.querySelector('.hero-badge');
        const h1 = heroRef.current.querySelector('h1');
        const line = heroRef.current.querySelector('.hero-gold-line');
        const desc = heroRef.current.querySelector('.hero-desc');
        const btns = heroRef.current.querySelector('.hero-btns');

        gsap.set([badge, h1, line, desc, btns], { opacity: 0 });
        const tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'power2.out' } });
        if (badge) tl.fromTo(badge, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0);
        if (h1) tl.fromTo(h1, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.15);
        if (line) tl.fromTo(line, { scaleX: 0, opacity: 0, transformOrigin: 'left center' }, { scaleX: 1, opacity: 1, duration: 0.9, ease: 'power2.inOut' }, 0.6);
        if (desc) tl.fromTo(desc, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.8);
        if (btns) tl.fromTo(btns, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 1.05);
      }

      // Overview blocks — fade-up with scale (like residential craft-cards)
      if (overviewRef.current) {
        const head = overviewRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        const blocks = overviewRef.current.querySelectorAll('.overview-block');
        blocks.forEach((b, i) => {
          gsap.fromTo(b, { y: 50, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, duration: 1, delay: i * 0.12, ease: 'power2.out',
              scrollTrigger: { trigger: b, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Sub-service gallery — staggered fade + scale
      if (subGalleryRef.current) {
        const head = subGalleryRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        const imgs = subGalleryRef.current.querySelectorAll('.gallery-item');
        imgs.forEach((img, i) => {
          gsap.fromTo(img, { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.08, ease: 'power2.out',
              scrollTrigger: { trigger: img, start: 'top 90%', toggleActions: 'play none none reverse' } });
        });
      }

      // Warning signs — slide from left with stagger
      if (warningsRef.current) {
        const head = warningsRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        const items = warningsRef.current.querySelectorAll('.warning-item');
        items.forEach((item, i) => {
          gsap.fromTo(item, { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.9, delay: i * 0.08, ease: 'power3.out',
              scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none reverse' } });
        });
      }

      // Maintenance tips — scrubbed vertical line + staggered steps
      if (maintenanceRef.current) {
        const head = maintenanceRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        const line = maintenanceRef.current.querySelector('.maint-connector');
        if (line) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 2, ease: 'power2.inOut',
          transformOrigin: 'top', scrollTrigger: { trigger: maintenanceRef.current, start: 'top 70%', end: 'bottom 50%', scrub: 1 } });
        const steps = maintenanceRef.current.querySelectorAll('.maint-step');
        steps.forEach((s, i) => {
          gsap.fromTo(s, { y: 35, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: s, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Process steps — same scrubbed pattern
      if (processRef.current) {
        const head = processRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        const line = processRef.current.querySelector('.process-connector');
        if (line) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 2, ease: 'power2.inOut',
          transformOrigin: 'top', scrollTrigger: { trigger: processRef.current, start: 'top 70%', end: 'bottom 50%', scrub: 1 } });
        const steps = processRef.current.querySelectorAll('.process-step');
        steps.forEach((s, i) => {
          gsap.fromTo(s, { y: 35, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: s, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Cost table — fade-up
      if (costRef.current) {
        gsap.fromTo(costRef.current.querySelector('.cost-inner'),
          { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power2.out',
            scrollTrigger: { trigger: costRef.current, start: 'top 80%' } });
      }

      // FAQ — staggered fade-up
      if (faqRef.current) {
        const items = faqRef.current.querySelectorAll('.faq-item');
        items.forEach((item, i) => {
          gsap.fromTo(item, { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // Cross-links — staggered cards
      if (crossRef.current) {
        const cards = crossRef.current.querySelectorAll('.cross-card');
        gsap.fromTo(cards, { y: 35, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: crossRef.current, start: 'top 80%' } });
      }

      // CTA — dramatic scale reveal
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.querySelector('.cta-inner'),
          { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' } });
      }

    }, containerRef);
    return () => ctx.revert();
  }, [mounted]);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${subService.title} — RO Unlimited`,
    description: subService.heroDescription,
    url: `https://rounlimited.com/services/${parentSlug}/${subService.slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: 'RO Unlimited Construction & Development',
      telephone: '(864) 304-0139',
      url: 'https://rounlimited.com',
      areaServed: [
        { '@type': 'State', name: 'South Carolina' },
        { '@type': 'State', name: 'Georgia' },
        { '@type': 'State', name: 'North Carolina' },
      ],
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: subService.faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  if (!mounted) return <div className="min-h-screen bg-ro-black" />;

  return (
    <div ref={containerRef}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
        <img
          src={heroImage}
          alt={`${subService.title} by RO Unlimited`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.6) 55%, rgba(0,0,0,0.15) 80%)' }} />
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, transparent 20%, transparent 75%, rgba(10,10,10,0.95) 100%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] pointer-events-none" style={{ zIndex: 2, background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 px-6 sm:px-10 lg:pl-16 pt-28 pb-16" style={{ maxWidth: 'min(620px, 100%)' }}>
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-black/40 backdrop-blur-sm mb-7 self-start">
            <Icon size={12} className="text-ro-gold flex-shrink-0" />
            <span className="text-ro-gold text-[10px] font-mono tracking-[0.3em] uppercase">RO {parentLabel} — {subService.title}</span>
          </div>

          <h1 className="text-ro-white font-heading uppercase leading-[0.92] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)', textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
            {subService.tagline.split(' ').slice(0, Math.ceil(subService.tagline.split(' ').length / 2)).join(' ')}<br />
            <span className="gradient-text-gold">{subService.tagline.split(' ').slice(Math.ceil(subService.tagline.split(' ').length / 2)).join(' ')}</span>
          </h1>

          <div className="hero-gold-line w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />

          <p className="hero-desc text-ro-gray-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            {subService.heroDescription}
          </p>

          <div className="hero-btns flex flex-col sm:flex-row gap-3">
            <Link href="/contact" className="group inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300 whitespace-nowrap">
              Get a Quote <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300 backdrop-blur-sm whitespace-nowrap">
              <Phone size={12} /> {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ═══ EDUCATIONAL OVERVIEW — 4-block grid ═══ */}
      <section ref={overviewRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.11]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[450px] h-[450px] warm-glow-strong animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Everything You Need to Know</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9]">
              {subService.title}<br /><span className="gradient-text-gold">Guide</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-ro-gold/60 to-transparent mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {subService.overview.map((block, i) => (
              <div key={i} className="overview-block group relative p-7 sm:p-9 border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm hover:border-ro-gold/25 hover:bg-ro-gold/[0.03] transition-all duration-700">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ro-gold/20 group-hover:border-ro-gold/45 transition-colors duration-700" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ro-gold/20 group-hover:border-ro-gold/45 transition-colors duration-700" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 flex items-center justify-center border border-ro-gold/20 bg-ro-gold/[0.04]">
                    <span className="text-ro-gold font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="text-ro-white font-heading text-lg tracking-wider uppercase group-hover:text-ro-gold-light transition-colors duration-700">
                    {block.heading}
                  </h3>
                </div>
                <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed">
                  {block.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PHOTO GALLERY — inline media for this specialty ═══ */}
      {galleryImgs.length > 0 && (
        <section ref={subGalleryRef} className="py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 forge-bg-alt" />
          <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.08]" />
          <div className="absolute inset-0 forge-slash pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] warm-glow-golden animate-ember pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="section-head mb-12 text-center">
              <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">See the Work</span>
              <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
                {subService.title} <span className="gradient-text-gold">Gallery</span>
              </h2>
              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
            </div>

            {/* Desktop: masonry-style grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3">
              {galleryImgs.map((img, i) => (
                <div key={i} className={`gallery-item group relative overflow-hidden border border-ro-gold/10 ${i === 0 ? 'lg:row-span-2' : ''}`}>
                  <div className={`relative ${i === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
                    <img src={img} alt={`${subService.title} by RO Unlimited`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ro-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 border-2 border-ro-gold/0 group-hover:border-ro-gold/25 transition-colors duration-500" />
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: horizontal scroll with snap */}
            <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
              {galleryImgs.map((img, i) => (
                <div key={i} className="gallery-item flex-shrink-0 w-[80vw] snap-center">
                  <div className="relative aspect-[4/3] overflow-hidden border border-ro-gold/10">
                    <img src={img} alt={`${subService.title} by RO Unlimited`} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ro-black/40 via-transparent to-transparent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ WARNING SIGNS — "Call Us If You See..." ═══ */}
      <section ref={warningsRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.09]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[500px] warm-glow-golden animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-amber-500/20 bg-amber-500/[0.04] mb-6">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-mono tracking-[0.3em] uppercase">Call Us If You See This</span>
            </div>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9]">
              Warning<br /><span className="gradient-text-gold">Signs</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-amber-500/60 to-transparent mt-6" />
          </div>

          <div className="space-y-4">
            {subService.warningSigns.map((sign, i) => (
              <div key={i} className="warning-item group relative flex gap-4 sm:gap-5 p-5 sm:p-6 border border-ro-gray-800/30 bg-[#1a150d]/15 backdrop-blur-sm hover:border-amber-500/20 transition-all duration-500">
                <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-amber-500/60 via-ro-gold/40 to-transparent" />
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-amber-500/20 bg-amber-500/[0.06] mt-0.5">
                  <AlertTriangle size={14} className="text-amber-400/70" />
                </div>
                <div>
                  <h3 className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase mb-2 group-hover:text-amber-300 transition-colors duration-500">
                    {sign.trigger}
                  </h3>
                  <p className="text-ro-gray-400 text-sm leading-relaxed">
                    {sign.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-3 text-amber-400 font-heading text-lg sm:text-xl tracking-tight hover:text-amber-300 transition-colors duration-300">
              <Phone size={18} /> Call Now: {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ═══ MAINTENANCE TIPS — Timeline layout ═══ */}
      <section ref={maintenanceRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.10]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] warm-glow-strong pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-16 text-center">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Protect Your Investment</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9]">
              Maintenance<br /><span className="gradient-text-gold">Tips</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="relative">
            <div className="maint-connector absolute left-5 sm:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ro-gold/50 via-ro-gold/30 to-ro-gold/10" />
            <div className="space-y-6 sm:space-y-8">
              {subService.maintenanceTips.map((tip, i) => (
                <div key={i} className="maint-step relative">
                  <button
                    onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                    className="flex gap-6 sm:gap-10 items-start w-full text-left group cursor-pointer"
                  >
                    <div className="flex-shrink-0 relative z-10 w-10 sm:w-16 flex items-center justify-center">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 bg-ro-black flex items-center justify-center transition-all duration-500 ${expandedTip === i ? 'border-ro-gold bg-ro-gold/10' : 'border-ro-gold/40'}`}>
                        <Shield size={16} className="text-ro-gold" />
                      </div>
                    </div>
                    <div className="flex-1 pb-2 pt-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase group-hover:text-ro-gold-light transition-colors">
                          {tip.tip}
                        </h3>
                        <ChevronDown size={14} className={`text-ro-gold/30 transition-all duration-300 flex-shrink-0 ${expandedTip === i ? 'rotate-180 text-ro-gold' : ''}`} />
                      </div>
                      {expandedTip === i && (
                        <p className="text-ro-gray-300 text-sm leading-relaxed mt-3 animate-card-up">{tip.detail}</p>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROCESS STEPS ═══ */}
      <section ref={processRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.08]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] warm-glow-golden animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-16 text-center">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">How We Do It</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9]">
              Our<br /><span className="gradient-text-gold">Process</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="relative">
            <div className="process-connector absolute left-8 sm:left-12 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ro-gold/50 via-ro-gold/30 to-ro-gold/10" />
            <div className="space-y-8 sm:space-y-10">
              {subService.processSteps.map((step) => (
                <div key={step.num} className="process-step flex gap-8 sm:gap-12 items-start">
                  <div className="flex-shrink-0 relative z-10 w-16 sm:w-24 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-ro-gold/40 bg-ro-black flex items-center justify-center">
                      <span className="font-mono text-ro-gold text-sm sm:text-base">{step.num}</span>
                    </div>
                  </div>
                  <div className="flex-1 pb-2 pt-1">
                    <h3 className="text-ro-white font-heading text-xl sm:text-2xl tracking-wider uppercase mb-3">{step.title}</h3>
                    <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed max-w-lg">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COST & LIFESPAN REFERENCE ═══ */}
      {subService.costData.length > 0 && (
        <section ref={costRef} className="py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 forge-bg" />
          <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.09]" />
          <div className="absolute inset-0 forge-slash pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="cost-inner">
              <div className="text-center mb-12">
                <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Investment Guide</span>
                <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
                  Cost & <span className="gradient-text-gold">Lifespan</span>
                </h2>
                <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
              </div>

              <div className="border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 border-b border-ro-gold/15 bg-ro-gold/[0.04]">
                  <div className="p-4 sm:p-5">
                    <span className="text-ro-gold text-[10px] sm:text-xs font-mono tracking-wider uppercase">Material / Service</span>
                  </div>
                  <div className="p-4 sm:p-5 text-center">
                    <span className="text-ro-gold text-[10px] sm:text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-1"><DollarSign size={11} /> Cost Range</span>
                  </div>
                  <div className="p-4 sm:p-5 text-center">
                    <span className="text-ro-gold text-[10px] sm:text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-1"><Clock size={11} /> Lifespan</span>
                  </div>
                </div>
                {/* Rows */}
                {subService.costData.map((row, i) => (
                  <div key={i} className={`grid grid-cols-3 ${i < subService.costData.length - 1 ? 'border-b border-ro-gray-800/30' : ''} hover:bg-ro-gold/[0.02] transition-colors duration-300`}>
                    <div className="p-4 sm:p-5">
                      <span className="text-ro-white text-sm sm:text-base font-heading tracking-wider uppercase">{row.item}</span>
                    </div>
                    <div className="p-4 sm:p-5 text-center">
                      <span className="text-ro-gray-300 text-sm sm:text-base">{row.cost}</span>
                    </div>
                    <div className="p-4 sm:p-5 text-center">
                      <span className="text-ro-gray-300 text-sm sm:text-base">{row.lifespan}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-ro-gray-600 text-xs font-mono tracking-wider text-center mt-6">
                Prices are estimates for Upstate SC — <Link href="/contact" className="text-ro-gold/50 hover:text-ro-gold transition-colors">get a real quote</Link> for your project.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      <section ref={faqRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.10]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[500px] warm-glow-strong animate-ember pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Common Questions</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              <span className="gradient-text-gold">FAQ</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="space-y-4">
            {subService.faq.map((item, i) => (
              <div key={i} className="faq-item border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm hover:border-ro-gold/15 transition-colors duration-500">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-start gap-4 p-5 sm:p-6 text-left cursor-pointer group"
                >
                  <div className="flex-1">
                    <h3 className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase group-hover:text-ro-gold-light transition-colors">
                      {item.q}
                    </h3>
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

      {/* ═══ EXPLORE OTHER ROOFING SERVICES ═══ */}
      <section ref={crossRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] warm-glow pointer-events-none opacity-80" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">More {parentLabel} Services</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              Explore <span className="gradient-text-gold">More</span>
            </h2>
          </div>

          {/* Desktop grid / Mobile horizontal scroll */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
            {otherServices.slice(0, 4).map((svc) => (
              <Link key={svc.id} href={`/services/${parentSlug}/${svc.slug}`}
                className="cross-card group relative p-6 border border-ro-gray-800/30 overflow-hidden hover:border-ro-gold/20 transition-all duration-700 text-center">
                {svc.cardImage && (
                  <>
                    <img src={svc.cardImage} alt={svc.title} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 bg-ro-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </>
                )}
                <div className="absolute inset-0 bg-ro-gray-900/10 group-hover:bg-transparent transition-colors duration-700" />
                <div className="relative z-10">
                  <div className="w-9 h-9 mx-auto flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-4 group-hover:border-ro-gold/35 transition-all duration-700">
                    <Icon size={16} className="text-ro-gold/60 group-hover:text-ro-gold transition-colors duration-700" />
                  </div>
                  <h3 className="text-ro-white font-heading text-sm tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-700">{svc.title}</h3>
                  <div className="mt-2 flex items-center justify-center gap-1 text-ro-gold/40 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    View <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile scroll */}
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            {otherServices.map((svc) => (
              <Link key={svc.id} href={`/services/${parentSlug}/${svc.slug}`}
                className="cross-card flex-shrink-0 w-[60vw] snap-center group relative p-6 border border-ro-gray-800/30 text-center">
                <div className="w-9 h-9 mx-auto flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-3">
                  <Icon size={16} className="text-ro-gold/60" />
                </div>
                <h3 className="text-ro-white font-heading text-sm tracking-wider uppercase">{svc.title}</h3>
                <div className="mt-2 flex items-center justify-center gap-1 text-ro-gold/40 text-xs font-mono uppercase">
                  View <ArrowRight size={10} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href={`/services/${parentSlug}`} className="inline-flex items-center gap-2 text-ro-gold/50 text-sm font-mono tracking-wider uppercase hover:text-ro-gold transition-colors">
              All {parentLabel} Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={ctaRef} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
        <div className="absolute inset-0 bg-ro-black/88" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 forge-bg-alt" style={{ zIndex: 2, opacity: 0.6 }} />
        <div className="absolute inset-0 forge-slash pointer-events-none" style={{ zIndex: 3 }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] warm-glow-golden animate-ember pointer-events-none" style={{ zIndex: 3 }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-inner">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-12" />
            <span className="text-ro-gold/70 text-xs font-mono tracking-[0.4em] uppercase block mb-6">Ready to Start?</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.85] mb-8">
              Get Your<br /><span className="gradient-text-gold">Quote</span>
            </h2>
            <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto">
              Call us directly or request a quote online. No pressure, no upselling — just honest answers about your {subService.title.toLowerCase()} needs.
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
