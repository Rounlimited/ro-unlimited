'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, FileUp } from 'lucide-react';
import { COMPANY } from '@/lib/constants';

/**
 * StickyCallBar — mobile-only bottom action bar. Phone leads convert several
 * times better than forms for contractors, so the call button leads and shows
 * the actual number; "Send Plans" is the B2B second track (developers and GCs
 * want to hand over drawings, not fill a homeowner form).
 *
 * Stays hidden until the visitor scrolls past ~90% of the first viewport so
 * it never covers the hero video or its CTAs, which already include the
 * phone number. Slide-up is a plain CSS transform transition — cheap, and it
 * degrades to a fade-free jump under prefers-reduced-motion via the media
 * check below rather than animating regardless.
 */
export default function StickyCallBar() {
  const [show, setShow] = useState(false);
  const [reduced, setReduced] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShow(window.scrollY > window.innerHeight * 0.9);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The contact page already ends in the form — a "Send Plans" bar there is noise.
  if (pathname === '/contact') return null;

  return (
    <div
      aria-hidden={!show}
      className="fixed bottom-0 inset-x-0 z-[60] md:hidden"
      style={{
        transform: show ? 'translateY(0)' : 'translateY(110%)',
        transition: reduced ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(201,168,76,0.25)',
      }}
    >
      <div className="flex gap-3 px-4 py-3">
        <a
          href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
          className="flex-1 flex items-center justify-center gap-2 min-h-[52px] bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase active:scale-[0.98] transition-transform"
          tabIndex={show ? 0 : -1}
        >
          <Phone size={17} /> {COMPANY.phone}
        </a>
        <Link
          href="/contact"
          className="flex-1 flex items-center justify-center gap-2 min-h-[52px] border border-ro-gold/40 text-ro-gold font-heading text-sm tracking-wider uppercase active:scale-[0.98] transition-transform"
          tabIndex={show ? 0 : -1}
        >
          <FileUp size={17} /> Send Plans
        </Link>
      </div>
    </div>
  );
}
