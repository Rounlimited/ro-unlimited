'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, Droplets, ShieldCheck, ChevronDown, Waves, Flame, Layers } from 'lucide-react';
import { gsap } from '@/components/animations/GSAPProvider';

/* â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const HERO_STATS = [
  { value: '3', label: 'State Licenses Held' },
  { value: '25+', label: 'Years In The Dirt' },
  { value: '3', label: 'States Served' },
  { value: '100%', label: 'Self-Performed' },
];

const TICKER = 'WATER MAIN TAPS \u2022 DUCTILE IRON \u2022 C900 PVC \u2022 SANITARY SEWER \u2022 STORM DRAINAGE \u2022 TIER 2 SEPTIC \u2022 COMMERCIAL GREASE TRAPS \u2022 HOT TAPS \u2022 FIRE LINES \u2022 ';

// Images are RO's OWN job photos from JR. Every one has been visually checked
// against its card title \u2014 do not swap in stock on filename or alt text alone.
const CAPABILITIES = [
  { num: '01', title: 'Water Main Taps & Hot Taps', img: '/images/utilities/jr-hot-tap.jpg',
    desc: 'Live-main connections without shutting the system down. Tapping sleeves, valves, and pressure connections done under license.' },
  { num: '02', title: 'Ductile Iron & C900 Water Lines', img: '/images/utilities/jr-ductile-iron-valve.jpg',
    desc: 'Black bolted ductile iron and big-bore C900 PVC \u2014 domestic service and fire lines, bedded, restrained, and pressure-tested to spec.' },
  { num: '03', title: 'Sanitary Sewer Installation', img: '/images/utilities/jr-sewer-lateral.jpg',
    desc: 'Gravity sewer mains, laterals, and manholes \u2014 laser-graded fall, tied into municipal systems clean the first time.' },
  { num: '04', title: 'Storm Drainage Systems', img: '/images/utilities/px-37627673.jpg',
    desc: 'PVC and black corrugated HDPE storm runs, catch basins, and drainage structures \u2014 the package that gets your site through inspection.' },
  { num: '05', title: 'Tier 2 Septic Systems', img: '/images/utilities/jr-septic-tank-set.jpg',
    desc: 'Engineered and conventional septic under a Tier 2 license \u2014 commercial-scale systems, pump tanks, and drain fields.' },
  { num: '06', title: 'Commercial Grease Traps', img: '/images/utilities/jr-grease-interceptor.jpg',
    desc: 'Interceptors and grease traps for restaurants and QSR builds \u2014 sized, set, plumbed, and inspection-ready.' },
];

const PROCESS = [
  { num: '01', title: 'Locate & Design', desc: 'Utility locates, soil review, and a run plan that matches the civil drawings \u2014 before a bucket touches dirt.' },
  { num: '02', title: 'Cut & Install', desc: 'Open the trench, bed the pipe, set the structures. Our crews, our iron \u2014 no waiting on a sub.' },
  { num: '03', title: 'Test & Inspect', desc: 'Pressure tests, mandrel and vacuum tests, municipal inspections \u2014 documented and passed before anything closes.' },
  { num: '04', title: 'Backfill & Document', desc: 'Every run photographed before backfill. You get proof of what\u2019s under your site \u2014 forever.' },
];

const GALLERY = [
  '/images/utilities/jr-hot-tap.jpg',
  '/images/utilities/jr-tapping-sleeve.jpg',
  '/images/utilities/jr-valve-trench.jpg',
  '/images/utilities/jr-underslab-rough.jpg',
  '/images/utilities/px-37627672.jpg',
  '/images/utilities/jr-grease-interceptor.jpg',
];

const FAQS = [
  { q: 'Can you tap into a live water main?', a: 'Yes \u2014 that\u2019s exactly what our water & sewer license covers. We perform hot taps on live mains with tapping sleeves and valves, so the surrounding system stays in service while your property gets connected.' },
  { q: 'Do you sub out the utility work?', a: 'No. Underground utilities are self-performed \u2014 our crews, our equipment, our licenses. That\u2019s the point: when the same contractor controls the sitework and the underground package, the critical path doesn\u2019t slip waiting on someone else\u2019s schedule.' },
  { q: 'What does a Tier 2 septic license cover?', a: 'Commercial-scale septic \u2014 engineered systems, large conventional systems, pump stations, and commercial grease traps and interceptors. Most residential septic installers can\u2019t touch this class of work.' },
  { q: 'Can you handle the full site, not just utilities?', a: 'That\u2019s our model. We clear it, grade it, pipe it, and build on it \u2014 site development, underground utilities, and vertical construction under one contract with one accountable contractor.' },
];

/* â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function UtilitiesPage() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const capsRef = useRef<HTMLElement>(null);
  const licenseRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const ctx = gsap.context(() => {

      // Hero â€” cinematic staggered entrance
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

      // Capability cards â€” depth-staggered rise
      if (capsRef.current) {
        const head = capsRef.current.querySelector('.section-head');
        if (head) gsap.fromTo(head, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: head, start: 'top 85%' } });
        capsRef.current.querySelectorAll('.cap-card').forEach((c, i) => {
          gsap.fromTo(c, { y: 60, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 1, delay: (i % 3) * 0.08, ease: 'power2.out',
              scrollTrigger: { trigger: c, start: 'top 90%', toggleActions: 'play none none reverse' } });
        });
      }

      // License moat â€” split slide-in
      if (licenseRef.current) {
        const left = licenseRef.current.querySelector('.moat-copy');
        const right = licenseRef.current.querySelector('.moat-side');
        if (left) gsap.fromTo(left, { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: 'power2.out', scrollTrigger: { trigger: licenseRef.current, start: 'top 75%' } });
        if (right) gsap.fromTo(right, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: 'power2.out', scrollTrigger: { trigger: licenseRef.current, start: 'top 75%' } });
        licenseRef.current.querySelectorAll('.lic-card').forEach((c, i) => {
          gsap.fromTo(c, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.3 + i * 0.15, ease: 'power2.out', scrollTrigger: { trigger: licenseRef.current, start: 'top 70%' } });
        });
      }

      // Process â€” connector line draw + steps
      if (processRef.current) {
        const lineEl = processRef.current.querySelector('.process-line');
        if (lineEl) gsap.fromTo(lineEl, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: processRef.current, start: 'top 70%' } });
        processRef.current.querySelectorAll('.process-step').forEach((s, i) => {
          gsap.fromTo(s, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: i * 0.15, ease: 'power2.out', scrollTrigger: { trigger: processRef.current, start: 'top 75%' } });
        });
      }

      // Gallery â€” scale reveals
      if (galleryRef.current) {
        galleryRef.current.querySelectorAll('.gallery-item').forEach((img, i) => {
          gsap.fromTo(img, { y: 50, opacity: 0, scale: 0.94 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: (i % 3) * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: img, start: 'top 92%', toggleActions: 'play none none reverse' } });
        });
      }

      // FAQ
      if (faqRef.current) {
        faqRef.current.querySelectorAll('.faq-item').forEach((item, i) => {
          gsap.fromTo(item, { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      // CTA
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.querySelector('.cta-inner'),
          { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' } });
      }

    }, containerRef);
    return () => ctx.revert();
  }, [mounted]);

  return (
    <div ref={containerRef}>
      <style>{`
        @keyframes util-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .util-ticker-track { animation: util-ticker 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .util-ticker-track { animation: none; } }
      `}</style>

      {/* â•â•â• HERO â•â•â• */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col overflow-hidden">
        <Image src="/images/services/septic/subs/excavation-wide.jpg" alt="RO Unlimited underground utility excavation" fill priority className="object-cover" sizes="100vw" style={{ zIndex: 0 }} />
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.6) 55%, rgba(0,0,0,0.15) 80%)' }} />
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, transparent 20%, transparent 75%, rgba(10,10,10,0.95) 100%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] pointer-events-none" style={{ zIndex: 2, background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-center flex-1 px-6 sm:px-10 lg:pl-16 pt-28 pb-6" style={{ maxWidth: 'min(560px, 100%)' }}>
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-black/40 backdrop-blur-sm mb-7 self-start">
            <Droplets size={12} className="text-ro-gold flex-shrink-0" />
            <span className="text-ro-gold text-[10px] font-mono tracking-[0.3em] uppercase">Underground Utilities Division</span>
          </div>

          <h1 className="font-heading uppercase leading-[0.88] tracking-tight mb-6" style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.6rem)' }}>
            <span className="hero-text-fade">The Best Work</span><br />
            <span className="gradient-text-gold">Gets Buried.</span>
          </h1>

          <div className="hero-gold-line w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />

          <p className="hero-desc text-sm sm:text-base leading-relaxed mb-8 max-w-sm text-ro-gray-200 border-l-2 border-ro-gold/70 bg-ro-black/50 backdrop-blur-md pl-4 pr-4 py-3.5" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            Water mains. Sewer taps. Storm drainage. Tier 2 septic. Nobody sees it when it&apos;s done &mdash; but every building in the Upstate stands on it. Licensed, self-performed, and photographed before backfill.
          </p>

          <div className="hero-btns flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
            <Link href="/contact" className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300 whitespace-nowrap">
              Scope Your Project <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300 backdrop-blur-sm whitespace-nowrap">
              <Phone size={12} /> {COMPANY.phone}
            </a>
          </div>
        </div>

        <div className="hero-stats relative z-10 mt-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-ro-gold/10 border-t border-ro-gold/10" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}>
            {HERO_STATS.map((s, i) => (
              <div key={i} className="px-4 sm:px-6 py-4 text-center">
                <div className="font-heading text-xl sm:text-2xl text-ro-gold tracking-tight">{s.value}</div>
                <div className="text-ro-gray-600 text-[10px] font-mono tracking-wider uppercase mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â• SPEC TICKER â•â•â• */}
      <div className="relative overflow-hidden border-y border-ro-gold/15 bg-ro-black py-3 select-none" aria-hidden="true">
        <div className="util-ticker-track flex whitespace-nowrap w-max">
          <span className="text-ro-gold/60 font-mono text-[11px] tracking-[0.3em]">{TICKER}</span>
          <span className="text-ro-gold/60 font-mono text-[11px] tracking-[0.3em]">{TICKER}</span>
        </div>
      </div>

      {/* â•â•â• CAPABILITIES â•â•â• */}
      <section ref={capsRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-head text-center mb-14 sm:mb-20">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">What We Put In The Ground</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase">Water &middot; Sewer &middot; Storm &middot; Septic</h2>
            <div className="mx-auto w-24 gold-line mt-5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {CAPABILITIES.map((cap) => (
              <div key={cap.num} className="cap-card group relative border border-ro-gray-800 hover:border-ro-gold/30 bg-ro-black/60 overflow-hidden transition-colors duration-500">
                <div className="relative h-44 sm:h-48 overflow-hidden">
                  <Image src={cap.img} alt={cap.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ro-black via-ro-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-ro-gold font-mono text-xs tracking-widest">{cap.num}</div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase mb-2 group-hover:text-ro-gold transition-colors duration-300">{cap.title}</h3>
                  <p className="text-ro-gray-500 text-sm leading-relaxed">{cap.desc}</p>
                  <div className="w-8 h-[1px] bg-ro-gold/30 mt-4 group-hover:w-16 transition-all duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â• LICENSE MOAT â•â•â• */}
      <section ref={licenseRef} className="py-24 sm:py-28 relative border-t border-ro-gray-800 overflow-hidden">
        <Image src="/images/services/septic/excavator-digging.jpg" alt="" fill className="object-cover opacity-[0.08]" sizes="100vw" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="moat-copy">
              <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Licensed &amp; Self-Performed</span>
              <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase mb-6 leading-[0.95]">Most Contractors<br /><span className="gradient-text-gold">Can&apos;t Legally Touch This</span></h2>
              <div className="w-24 gold-line mb-6" />
              <p className="text-ro-gray-400 leading-relaxed mb-4">Tapping a live water main. Running ductile iron under a parking lot. Setting a commercial grease trap. This work takes state licensing most general contractors don&apos;t hold &mdash; so it gets subbed out, and schedules slip.</p>
              <p className="text-ro-gray-400 leading-relaxed">We hold the licenses and run our own crews and equipment. When RO Unlimited does your sitework, the underground package stays in-house &mdash; <span className="text-ro-gold">one contractor controlling the critical path from first cut to final tap.</span></p>
            </div>
            <div className="moat-side space-y-3">
              {[
                { icon: Waves, label: 'Water & Sewer License' },
                { icon: Layers, label: 'Grading License' },
                { icon: Flame, label: 'Tier 2 Septic / Grease Trap License' },
              ].map(({ icon: Ic, label }) => (
                <div key={label} className="lic-card flex items-center gap-4 p-5 border border-ro-gold/20 bg-ro-black/70 backdrop-blur-sm hover:border-ro-gold/40 transition-colors duration-300">
                  <div className="w-10 h-10 flex items-center justify-center border border-ro-gold/30 bg-ro-gold/5 shrink-0"><Ic size={18} className="text-ro-gold" /></div>
                  <div>
                    <div className="text-ro-white font-heading text-sm tracking-wider uppercase">{label}</div>
                    <div className="text-ro-gray-600 text-[10px] font-mono tracking-wider uppercase mt-0.5 flex items-center gap-1"><ShieldCheck size={10} className="text-ro-gold/60" /> State Licensed &middot; Fully Insured</div>
                  </div>
                </div>
              ))}
              <p className="text-ro-gray-600 text-xs pt-2">License documentation available on request for prequalification and lender packages.</p>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â• PROCESS â•â•â• */}
      <section ref={processRef} className="py-24 sm:py-28 relative border-t border-ro-gray-800">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">How It Goes In</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Trench To Backfill</h2>
            <div className="mx-auto w-24 gold-line mt-5" />
          </div>
          <div className="relative">
            <div className="process-line hidden lg:block absolute top-7 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-ro-gold/10 via-ro-gold/50 to-ro-gold/10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {PROCESS.map((step) => (
                <div key={step.num} className="process-step relative text-center lg:text-left">
                  <div className="mx-auto lg:mx-0 w-14 h-14 flex items-center justify-center border border-ro-gold/40 bg-ro-black text-ro-gold font-heading text-lg mb-5 relative z-10">{step.num}</div>
                  <h3 className="text-ro-white font-heading text-base tracking-wider uppercase mb-2">{step.title}</h3>
                  <p className="text-ro-gray-500 text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â• GALLERY â•â•â• */}
      <section ref={galleryRef} className="py-24 sm:py-28 relative border-t border-ro-gray-800">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Before It Disappears</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Shot Before Backfill</h2>
            <div className="mx-auto w-24 gold-line mt-5" />
            <p className="text-ro-gray-500 text-sm mt-5 max-w-md mx-auto">Underground work only gets seen once. We photograph every run, tap, and tank before it&apos;s covered &mdash; proof of what&apos;s under your site.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {GALLERY.map((img, i) => (
              <div key={img} className={`gallery-item group relative overflow-hidden border border-ro-gray-800 hover:border-ro-gold/30 transition-colors duration-500 ${i === 0 ? 'col-span-2 lg:col-span-1 h-56 sm:h-64' : 'h-40 sm:h-56'}`}>
                <Image src={img} alt="RO Unlimited underground utility work" fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 1024px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-ro-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â• FAQ â•â•â• */}
      <section ref={faqRef} className="py-24 sm:py-28 relative border-t border-ro-gray-800">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Straight Answers</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Developer FAQ</h2>
            <div className="mx-auto w-24 gold-line mt-5" />
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item border border-ro-gray-800 hover:border-ro-gold/20 transition-colors duration-300 bg-ro-black/50">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left">
                  <span className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase">{f.q}</span>
                  <ChevronDown size={16} className={`text-ro-gold shrink-0 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: expandedFaq === i ? 240 : 0, opacity: expandedFaq === i ? 1 : 0 }}>
                  <p className="px-5 sm:px-6 pb-5 text-ro-gray-400 text-sm leading-relaxed">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â• CTA â•â•â• */}
      <section ref={ctaRef} className="py-24 sm:py-32 relative border-t border-ro-gray-800 overflow-hidden">
        <Image src="/images/services/septic/equipment-jobsite.jpg" alt="" fill className="object-cover opacity-15" sizes="100vw" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/80 to-ro-black" />
        <div className="cta-inner relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-ro-white font-heading text-3xl sm:text-5xl tracking-tight uppercase leading-[0.95] mb-6">Put Your Utilities<br /><span className="gradient-text-gold">In Licensed Hands</span></h2>
          <p className="text-ro-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">Send the civil drawings, or just tell us what the site needs. We&apos;ll scope the underground package &mdash; and the dirt work around it &mdash; with one number and one accountable contractor.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/contact" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">Scope Your Project <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" /></Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold/5 transition-all duration-300"><Phone size={12} /> {COMPANY.phone}</a>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Link href="/grading" className="px-4 py-2 text-xs border border-ro-gray-700 text-ro-gray-400 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading">Site Development &rarr;</Link>
            <Link href="/commercial" className="px-4 py-2 text-xs border border-ro-gray-700 text-ro-gray-400 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading">Commercial &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
