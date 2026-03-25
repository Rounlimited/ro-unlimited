'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { COMPANY } from '@/lib/constants';
import { CAPABILITY_SECTIONS } from '@/lib/capabilities-data';
import { ArrowRight, Phone, Wrench, Shield, Building2, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';
import SectionTransition from '@/components/animations/SectionTransition';

const SECTION_ICONS = [Wrench, Shield, Building2, Truck] as const;
const SYSTEM_PILLARS = [
  {
    title: 'Inspection-ready thinking',
    copy: 'The work is sequenced to pass, not patched together at the last minute.',
  },
  {
    title: 'Client-facing finish quality',
    copy: 'Spaces meant to represent a brand should not feel like commodity construction.',
  },
  {
    title: 'Full-job coordination',
    copy: 'Site work, shell, systems, and closeout all move under one disciplined standard.',
  },
] as const;

export default function CapabilitiesPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const capabilityRefs = useRef<(HTMLElement | null)[]>([]);
  const pillarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closeRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!pageRef.current) return;

    const hero = pageRef.current.querySelector('.cap-hero');
    const heroBadge = hero?.querySelector('.cap-hero-badge');
    const heroTitle = hero?.querySelector('h1');
    const heroLine = hero?.querySelector('.cap-hero-line');
    const heroDeck = hero?.querySelector('.cap-hero-deck');
    const heroStats = hero?.querySelectorAll('.cap-hero-stat');

    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (heroBadge) tl.fromTo(heroBadge, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.05);
      if (heroTitle) tl.fromTo(heroTitle, { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, 0.15);
      if (heroLine) tl.fromTo(heroLine, { scaleX: 0, opacity: 0, transformOrigin: 'left center' }, { scaleX: 1, opacity: 1, duration: 0.45, ease: 'power2.inOut' }, 0.38);
      if (heroDeck) tl.fromTo(heroDeck, { y: 28, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.7 }, 0.5);
      if (heroStats?.length) {
        tl.fromTo(heroStats,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.42 },
          0.72
        );
      }
    }

    capabilityRefs.current.forEach((card, index) => {
      if (!card) return;
      const bits = card.querySelectorAll('.cap-bit');
      gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: index === 0 ? 'top 86%' : 'top 80%',
          toggleActions: 'play none none none',
        },
      })
        .fromTo(card,
          { y: 34, opacity: 0, scale: 0.97, clipPath: 'inset(14% 0% 0% 0%)' },
          { y: 0, opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.78, ease: 'power3.out' }
        )
        .fromTo(bits,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.35, ease: 'power2.out' },
          0.12
        );
    });

    pillarRefs.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(card,
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          delay: index * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 84%', toggleActions: 'play none none none' },
        }
      );
    });

    if (closeRef.current) {
      const closeBits = closeRef.current.querySelectorAll('.close-bit');
      gsap.fromTo(closeBits,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.55,
          ease: 'power3.out',
          scrollTrigger: { trigger: closeRef.current, start: 'top 78%', toggleActions: 'play none none none' },
        }
      );
    }
  }, { scope: pageRef });

  return (
    <main ref={pageRef} className="overflow-x-hidden bg-ro-black">
      <section className="cap-hero relative flex min-h-[100svh] items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/94 to-ro-black" />
        <div className="absolute left-[-12%] top-[10%] h-[260px] w-[260px] rounded-full bg-ro-gold/12 blur-3xl pointer-events-none" />
        <div className="absolute right-[-10%] top-[32%] h-[240px] w-[240px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
          <div className="max-w-5xl">
            <div className="cap-hero-badge mb-6 inline-flex items-center gap-2 border border-ro-gold/20 bg-ro-gold/5 px-4 py-1.5">
              <Sparkles size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">Commercial construction</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.9] mb-6">
              Capabilities Built<br />
              <span className="gradient-text-gold">for Serious Scope</span>
            </h1>
            <div className="cap-hero-line mb-7 h-[2px] w-24 bg-gradient-to-r from-ro-gold to-transparent" />
            <div className="cap-hero-deck relative max-w-3xl overflow-hidden border border-ro-gold/14 bg-gradient-to-br from-ro-black/72 via-ro-black/56 to-ro-black/28 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.24)] sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/45 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.12),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.02))]" />
              <p className="relative max-w-2xl text-lg leading-relaxed text-ro-gray-300 sm:text-xl">
                Kitchen systems, life safety, shell work, and site development presented the way a serious buyer actually vets them: by control, sequencing, code pressure, and finished presence.
              </p>
              <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  `${COMPANY.experience} years`,
                  COMPANY.serviceAreaShort,
                  'Code-heavy work',
                  'Client-facing finish',
                ].map((item) => (
                  <div key={item} className="cap-hero-stat border border-ro-gold/10 bg-ro-black/26 px-3 py-3 text-center text-[11px] font-mono uppercase tracking-[0.22em] text-ro-gray-400">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionTransition label="FLOOR 07" title="Systems That Carry the Job" featured sparks />

      <section className="relative border-t border-ro-gray-800 py-20">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Deep commercial scope</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Systems We Deliver</h2>
            <div className="w-24 gold-line mt-4" />
          </div>

          <div className="space-y-20">
            {CAPABILITY_SECTIONS.map((section, i) => {
              const Icon = SECTION_ICONS[i] ?? Wrench;
              return (
                <article
                  key={section.id}
                  id={section.id}
                  ref={(el) => { capabilityRefs.current[i] = el; }}
                  className="grid grid-cols-1 gap-10 items-start border-b border-ro-gray-800/80 pb-20 lg:grid-cols-12 lg:gap-16 last:border-0 last:pb-0"
                >
                  <div className="lg:col-span-4">
                    <div className="cap-bit flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 border border-ro-gold/25 bg-ro-gold/5 flex items-center justify-center text-ro-gold">
                        <Icon size={22} strokeWidth={1.25} />
                      </div>
                      <span className="text-ro-gold/40 font-mono text-xs tracking-widest uppercase">0{i + 1}</span>
                    </div>
                    <h3 className="cap-bit text-ro-white font-heading text-2xl sm:text-3xl tracking-tight uppercase leading-tight">{section.title}</h3>
                    <p className="cap-bit text-ro-gray-500 text-sm sm:text-base leading-relaxed mt-4">{section.summary}</p>
                  </div>
                  <div className="lg:col-span-8">
                    <ul className="space-y-4 rounded-none border border-ro-gold/10 bg-ro-black/28 p-5 shadow-[0_16px_46px_rgba(0,0,0,0.18)] sm:p-7">
                      {section.bullets.map((line) => (
                        <li
                          key={line}
                          className="cap-bit flex gap-3 border-l-2 border-ro-gold/20 pl-4 text-ro-gray-300 text-sm leading-relaxed sm:text-base"
                        >
                          <CheckCircle2 size={14} className="mt-1 text-ro-gold/80 flex-shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <SectionTransition label="FLOOR 08" title="What Serious Buyers Are Reading For" sparks />

      <section className="border-t border-ro-gold/10 bg-gradient-to-b from-ro-black via-ro-black to-[#0a0a0a] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Buyer filters</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase mb-4">What Gets Work Chosen</h2>
            <div className="w-24 gold-line" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SYSTEM_PILLARS.map((pillar, index) => (
              <div
                key={pillar.title}
                ref={(el) => { pillarRefs.current[index] = el; }}
                className="relative overflow-hidden border border-ro-gold/12 bg-ro-black/38 p-6 shadow-[0_16px_46px_rgba(0,0,0,0.18)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/35 to-transparent" />
                <div className="mb-5 text-[11px] font-mono uppercase tracking-[0.28em] text-ro-gold/55">0{index + 1}</div>
                <h3 className="text-ro-white font-heading text-xl uppercase tracking-wider mb-3">{pillar.title}</h3>
                <p className="text-ro-gray-400 text-sm sm:text-base leading-relaxed">{pillar.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionTransition label="FLOOR 09" title="Bring Us the Real Scope" sparks />

      <section ref={closeRef} className="border-t border-ro-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="close-bit text-ro-gray-500 text-sm text-center sm:text-left">Serious systems. Clean delivery. Three states.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="close-bit inline-flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"
            >
              <Phone size={14} /> {COMPANY.phone}
            </a>
            <Link
              href="/contact"
              className="close-bit inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors"
            >
              Start a project <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
