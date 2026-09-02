'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { COMPANY, DIVISIONS } from '@/lib/constants';
import { Phone, Mail, MapPin, Clock, Facebook, ArrowUp } from 'lucide-react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const cautionRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const col3Ref = useRef<HTMLDivElement>(null);
  const col4Ref = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLAnchorElement>(null);
  const joinRef = useRef<HTMLAnchorElement>(null);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useGSAP(() => {
    if (!footerRef.current) return;

    const columns = [col1Ref.current, col2Ref.current, col3Ref.current, col4Ref.current].filter(Boolean);
    gsap.set([cautionRef.current, logoRef.current, bottomBarRef.current, quoteRef.current, ...columns], { opacity: 0 });

    const goldHeadings = footerRef.current.querySelectorAll('.footer-gold-heading');
    gsap.set(goldHeadings, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: footerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
        id: 'footer-build',
      },
    });

    tl.fromTo(cautionRef.current,
      { scaleX: 0, transformOrigin: 'left center', opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 0
    );
    tl.fromTo(logoRef.current,
      { scale: 0, rotation: 180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(2)' }, 0.15
    );

    const colDelays = [0.25, 0.40, 0.55, 0.70];
    columns.forEach((col, i) => {
      tl.fromTo(col,
        { clipPath: 'inset(100% 0% 0% 0%)', y: 30, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        colDelays[i]
      );
    });

    if (goldHeadings.length) {
      tl.fromTo(goldHeadings,
        { scaleX: 0, transformOrigin: 'left center', opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power1.in' }, 0.85
      );
    }

    tl.fromTo(bottomBarRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.95
    );
    tl.fromTo(quoteRef.current,
      { scale: 0, rotation: 90, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, 1.10
    );

    tl.fromTo(joinRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 1.30
    );

    tl.call(() => {
      if (!joinRef.current) return;
      // Scale from left so it never clips the left edge
      gsap.set(joinRef.current, { transformOrigin: 'left center' });
      gsap.to(joinRef.current, {
        boxShadow: '0 0 14px 2px rgba(212,119,44,0.55), 0 0 4px 1px rgba(212,119,44,0.35)',
        repeat: -1,
        yoyo: true,
        duration: 1.1,
        ease: 'sine.inOut',
      });
      gsap.to(joinRef.current, {
        scale: 1.04,
        repeat: -1,
        yoyo: true,
        duration: 1.1,
        ease: 'sine.inOut',
      });
    }, [], 1.75);

  }, { scope: footerRef });

  return (
    <footer ref={footerRef} className="relative bg-ro-black border-t border-ro-gold/10">
      <div ref={cautionRef} className="h-1 caution-stripe opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Brand */}
          <div ref={col1Ref}>
            <div ref={logoRef} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border-2 border-ro-gold flex items-center justify-center">
                <span className="text-ro-gold font-heading text-lg font-bold">RO</span>
              </div>
              <div>
                <div className="text-ro-white font-heading text-base tracking-wider uppercase">RO Unlimited</div>
                <div className="text-ro-gold/50 text-xs tracking-[0.15em] uppercase">Contractor & Developer</div>
              </div>
            </div>
            <p className="text-ro-gray-500 text-sm leading-relaxed mb-6">
              {COMPANY.experience} years of complete commercial construction and site development across Georgia, South Carolina, and North Carolina. We show up. We build right. We stand behind it.
            </p>
            <a href={COMPANY.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-ro-gray-500 hover:text-ro-gold transition-colors text-sm">
              <Facebook size={16} /><span>Follow us</span>
            </a>
          </div>

          {/* Column 2: Divisions */}
          <div ref={col2Ref}>
            <h3 className="footer-gold-heading text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Divisions</h3>
            <ul className="space-y-3">
              {DIVISIONS.map((div) => (
                <li key={div.id}>
                  <Link href={div.href} className="text-ro-gray-400 hover:text-ro-white transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-ro-gold/40 rounded-full" />{div.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div ref={col3Ref}>
            <h3 className="footer-gold-heading text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Contact</h3>
            <ul className="space-y-4">
              <li><a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 text-ro-gray-400 hover:text-ro-gold transition-colors text-sm"><Phone size={14} className="text-ro-gold/60" />{COMPANY.phone}</a></li>
              <li><a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 text-ro-gray-400 hover:text-ro-gold transition-colors text-sm"><Mail size={14} className="text-ro-gold/60" />{COMPANY.email}</a></li>
              <li className="flex items-center gap-3 text-ro-gray-400 text-sm"><MapPin size={14} className="text-ro-gold/60" />{COMPANY.serviceArea}</li>
              <li className="flex items-center gap-3 text-ro-gray-400 text-sm"><Clock size={14} className="text-ro-gold/60" />{COMPANY.hours}</li>
            </ul>
          </div>

          {/* Column 4: CTA */}
          <div ref={col4Ref}>
            <h3 className="footer-gold-heading text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Start Your Project</h3>
            <p className="text-ro-gray-500 text-sm mb-6">{COMPANY.cta}</p>

            {/* Join CTA — ghost badge, scales from left edge */}
            <div className="mb-5">
              <p className="text-ro-gray-600 text-xs mb-2">Trade professional?</p>
              <a
                ref={joinRef}
                href="/join"
                className="join-cta-badge inline-flex items-center gap-1.5 px-2 py-[3px] text-[10px] font-heading tracking-wider uppercase"
                style={{ opacity: 0, transformOrigin: 'left center' }}
              >
                <span className="relative z-10">Join the RO Network</span>
                <span className="relative z-10 opacity-70">→</span>
              </a>
            </div>

            <Link
              href="/contact"
              ref={quoteRef}
              className="inline-block px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors duration-300"
            >
              Get a Quote
            </Link>
          </div>
        </div>

        {/* License classifications — sitewide E-E-A-T strip. GCs screenshot
            this into vendor packets; it's prequal data, not decoration. */}
        <div className="mt-16 pt-8 border-t border-ro-gray-800">
          <p className="text-ro-gray-500 text-xs tracking-wide leading-relaxed text-center sm:text-left">
            <span className="text-ro-gold/70 font-mono uppercase tracking-wider">Licensed in SC &middot; NC &middot; GA</span>
            <span className="text-ro-gray-700"> — </span>
            General Contractor (Building) &middot; Boring &amp; Tunneling &middot; Water &amp; Sewer &middot; Highway, Roads &amp; Bridges &middot; Grading &middot; Specialty Concrete &middot; Specialty Masonry. Fully insured. License documentation available for prequalification.
          </p>
          <p className="text-ro-gray-600 text-xs tracking-wide mt-1.5 text-center sm:text-left font-mono">
            GC Lic #CLG 127704 &middot; Onsite Wastewater Lic #OSWW10837 &middot; Mechanical Lic #CLM119115
            <span className="text-ro-gray-700"> &middot; </span>
            <a href="/api/capability-statement" target="_blank" rel="noopener" className="text-ro-gold/70 hover:text-ro-gold underline underline-offset-2 transition-colors">
              Download Capability Statement (PDF)
            </a>
          </p>
        </div>

        {/* Bottom bar */}
        <div ref={bottomBarRef} className="mt-8 pt-8 border-t border-ro-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-ro-gray-600 text-xs tracking-wide">&copy; {new Date().getFullYear()} {COMPANY.fullName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <p className="text-ro-gray-700 text-xs italic">{COMPANY.tagline}</p>
            <button onClick={scrollToTop} className="w-8 h-8 border border-ro-gray-700 flex items-center justify-center text-ro-gray-500 hover:text-ro-gold hover:border-ro-gold/30 transition-colors" aria-label="Back to top">
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

        {/* Build credit — small, last thing on the page, no competing with the
            client's own footer. */}
        {/* Clear the sticky call bar on mobile, or this line hides behind it. */}
        <p className="mt-6 mb-24 md:mb-0 text-center text-ro-gray-700 text-[11px] tracking-wide">
          Like this site?{' '}
          <a
            href="https://nexavisiongroup.com"
            target="_blank"
            rel="noopener"
            className="text-ro-gray-600 hover:text-ro-gold underline underline-offset-2 transition-colors"
          >
            NexaVisionGroup.com
          </a>
        </p>
      </div>
    </footer>
  );
}
