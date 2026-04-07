'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { SERVICE_CATEGORIES, SERVICES_DETAIL } from '@/lib/services-data';
import type { ServiceCategory } from '@/lib/services-data';
import { ArrowRight, Phone, CheckCircle2, HardHat, Droplets, Zap, Pipette, Wrench, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap } from '@/components/animations/GSAPProvider';
import ServiceDrawer from '@/components/ServiceDrawer';
import type { ServiceDetail } from '@/lib/commercial-data';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  roofing: HardHat,
  septic: Droplets,
  electrical: Zap,
  plumbing: Pipette,
  repairs: Wrench,
};

export default function ServicePageTemplate({ category }: { category: ServiceCategory }) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const scopeRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const Icon = CATEGORY_ICONS[category.id] || Wrench;

  // Find the matching SERVICES_DETAIL key
  const detailKey = Object.keys(SERVICES_DETAIL).find(k =>
    SERVICES_DETAIL[k].id === category.id
  );

  const openDrawer = () => {
    if (detailKey) {
      setSelectedService(SERVICES_DETAIL[detailKey]);
      setDrawerOpen(true);
    }
  };

  // Cross-links: other service categories
  const otherCategories = SERVICE_CATEGORIES.filter(c => c.id !== category.id).slice(0, 3);

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

        gsap.set([badge, h1, line, desc, btns], { opacity: 0 });
        const tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'power2.out' } });
        if (badge) tl.fromTo(badge, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0);
        if (h1)    tl.fromTo(h1,    { y: 50, opacity: 0 },  { y: 0, opacity: 1, duration: 1.1 }, 0.15);
        if (line)  tl.fromTo(line,  { scaleX: 0, opacity: 0, transformOrigin: 'left center' }, { scaleX: 1, opacity: 1, duration: 0.9, ease: 'power2.inOut' }, 0.6);
        if (desc)  tl.fromTo(desc,  { y: 25, opacity: 0 },  { y: 0, opacity: 1, duration: 0.9 }, 0.8);
        if (btns)  tl.fromTo(btns,  { y: 25, opacity: 0 },  { y: 0, opacity: 1, duration: 0.8 }, 1.05);
      }

      if (scopeRef.current) {
        const head = scopeRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1,
          scrollTrigger: { trigger: head, start: 'top 85%' } });
        const items = scopeRef.current.querySelectorAll('.scope-item');
        items.forEach((item, i) => {
          gsap.fromTo(item, { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.08, ease: 'power2.out',
              scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } });
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

      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.querySelector('.cta-inner'),
          { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' } });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [mounted]);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${category.title} — RO Unlimited`,
    description: category.description,
    url: `https://rounlimited.com/services/${category.slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: 'RO Unlimited Construction & Development',
      telephone: '(864) 304-0139',
      email: 'Rounlimitedco@gmail.com',
      url: 'https://rounlimited.com',
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
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${category.title} Services`,
      itemListElement: category.services.map((s, i) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s },
        position: i + 1,
      })),
    },
  };

  // FAQ structured data
  const faqJsonLd = category.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  if (!mounted) return <div className="min-h-screen bg-ro-black" />;

  return (
    <div ref={containerRef}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <ServiceDrawer service={selectedService} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-ro-black to-ro-black" />
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 px-6 sm:px-10 lg:pl-16 pt-28 pb-16" style={{ maxWidth: 'min(600px, 100%)' }}>
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-gold/[0.06] backdrop-blur-sm mb-7 self-start">
            <Icon size={12} className="text-ro-gold flex-shrink-0" />
            <span className="text-ro-gold text-[10px] font-mono tracking-[0.3em] uppercase">RO Services — {category.title}</span>
          </div>

          <h1 className="text-ro-white font-heading uppercase leading-[0.92] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}>
            {category.tagline.split(' ').slice(0, 3).join(' ')}<br />
            <span className="gradient-text-gold">{category.tagline.split(' ').slice(3).join(' ')}</span>
          </h1>

          <div className="hero-gold-line w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />

          <p className="hero-desc text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
            {category.hero}
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

      {/* ═══ SERVICES INCLUDED ═══ */}
      <section ref={scopeRef} className="py-32 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-[#0d1117] to-ro-black" />
        <div className="absolute inset-0 blueprint-overlay opacity-[0.04]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">What&apos;s Covered</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9]">
              {category.title}<br /><span className="gradient-text-gold">Services</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-ro-gold/60 to-transparent mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {category.services.map((service, i) => (
              <div key={i} className="scope-item group flex items-start gap-4 p-5 sm:p-6 border border-ro-gray-800/30 bg-ro-gray-900/10 hover:border-ro-gold/20 hover:bg-ro-gold/[0.02] transition-all duration-700">
                <div className="w-8 h-8 flex items-center justify-center border border-ro-gold/20 bg-ro-gold/[0.04] flex-shrink-0 group-hover:border-ro-gold/40 transition-colors duration-700">
                  <CheckCircle2 size={14} className="text-ro-gold/60 group-hover:text-ro-gold transition-colors duration-700" />
                </div>
                <div>
                  <h3 className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase group-hover:text-ro-gold-light transition-colors duration-700">
                    {service}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {detailKey && (
            <div className="mt-10 text-center">
              <button onClick={openDrawer}
                className="inline-flex items-center gap-2 text-ro-gold/60 text-sm font-mono tracking-wider uppercase hover:text-ro-gold transition-colors cursor-pointer">
                View Full Details <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      {category.faq.length > 0 && (
        <section ref={faqRef} className="py-28 sm:py-36 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-ro-black to-[#0d1117]" />
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
                <div key={i} className="faq-item border border-ro-gray-800/30 bg-ro-gray-900/10">
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
                      <p className="text-ro-gray-400 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ OTHER SERVICES ═══ */}
      <section className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] to-ro-black" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">More Services</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">
              We Also <span className="gradient-text-gold">Handle</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {otherCategories.map((cat) => {
              const CatIcon = CATEGORY_ICONS[cat.id] || Wrench;
              return (
                <Link key={cat.id} href={`/services/${cat.slug}`}
                  className="group relative p-7 border border-ro-gray-800/30 bg-ro-gray-900/10 hover:border-ro-gold/20 hover:bg-ro-gold/[0.02] transition-all duration-700 text-center">
                  <div className="w-10 h-10 mx-auto flex items-center justify-center border border-ro-gold/15 bg-ro-gold/[0.04] mb-4 group-hover:border-ro-gold/35 transition-colors duration-700">
                    <CatIcon size={18} className="text-ro-gold/60 group-hover:text-ro-gold transition-colors duration-700" />
                  </div>
                  <h3 className="text-ro-white font-heading text-base tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-700">{cat.title}</h3>
                  <p className="text-ro-gray-500 text-xs sm:text-sm leading-relaxed">{cat.description.slice(0, 80)}...</p>
                  <div className="mt-3 flex items-center justify-center gap-1 text-ro-gold/40 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    View <ArrowRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/services" className="inline-flex items-center gap-2 text-ro-gold/50 text-sm font-mono tracking-wider uppercase hover:text-ro-gold transition-colors">
              All Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={ctaRef} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black to-[#0d1117]" />
        <div className="absolute inset-0 blueprint-overlay opacity-[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-inner">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-12" />
            <span className="text-ro-gold/70 text-xs font-mono tracking-[0.4em] uppercase block mb-6">Ready to Start?</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.85] mb-8">
              Get a<br /><span className="gradient-text-gold">Quote</span>
            </h2>
            <p className="text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto">
              Call us directly or request a quote online. No pressure, no upselling — just honest answers.
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
