'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS, COMPANY } from '@/lib/constants';
import { Menu, X, Phone } from 'lucide-react';
import { gsap } from '@/components/animations/GSAPProvider';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const joinNavRef = useRef<HTMLDivElement>(null);
  const desktopJoinRef = useRef<HTMLDivElement>(null);
  const glowTweens = useRef<gsap.core.Tween[]>([]);

  // Desktop join badge — persistent glow pulse on mount
  useEffect(() => {
    if (!desktopJoinRef.current) return;
    gsap.set(desktopJoinRef.current, { transformOrigin: 'left center' });
    gsap.to(desktopJoinRef.current, {
      boxShadow: '0 0 12px 2px rgba(212,119,44,0.55), 0 0 4px 1px rgba(212,119,44,0.35)',
      repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut',
    });
    gsap.to(desktopJoinRef.current, {
      scale: 1.04,
      repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut',
    });
  }, []);

  // Start pulse when mobile menu opens, kill when it closes
  useEffect(() => {
    if (isOpen && joinNavRef.current) {
      gsap.set(joinNavRef.current, { transformOrigin: 'left center' });
      const t1 = gsap.to(joinNavRef.current, {
        boxShadow: '0 0 12px 2px rgba(212,119,44,0.55), 0 0 4px 1px rgba(212,119,44,0.35)',
        repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut',
      });
      const t2 = gsap.to(joinNavRef.current, {
        scale: 1.04,
        repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut',
      });
      glowTweens.current = [t1, t2];
    } else {
      glowTweens.current.forEach(t => t.kill());
      glowTweens.current = [];
      if (joinNavRef.current) {
        gsap.set(joinNavRef.current, { clearProps: 'boxShadow,scale' });
      }
    }
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ro-black/95 backdrop-blur-sm border-b border-ro-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/ro-unlimited-logo.svg"
              alt="RO Unlimited"
              className="h-10 w-auto object-contain"
              style={{ maxWidth: '200px' }}
            />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`relative px-4 py-2 text-sm tracking-wider uppercase font-body transition-colors duration-300 ${isActive ? 'text-ro-gold' : 'text-ro-gray-400 hover:text-ro-white'}`}>
                  {link.label}
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-ro-gold" />}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-2 text-ro-gray-400 hover:text-ro-gold transition-colors text-sm">
              <Phone size={14} /><span className="font-mono text-xs">{COMPANY.phone}</span>
            </a>
            <Link href="/contact"
              className="relative px-6 py-2.5 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors duration-300">
              Get a Quote
            </Link>
            {/* Join the RO Network — desktop badge, same style as footer */}
            <div ref={desktopJoinRef} style={{ transformOrigin: 'left center', display: 'inline-block' }}>
              <Link href="/join"
                className="join-cta-badge inline-flex flex-col items-center gap-0 px-3 py-[5px] font-heading text-[10px] tracking-[0.2em] uppercase leading-[1.4]">
                <span className="relative z-10">Join the</span>
                <span className="relative z-10">RO Network</span>
              </Link>
            </div>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-ro-gold p-2" aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-ro-black border-t border-ro-gold/10 px-4 py-6 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 text-sm tracking-wider uppercase font-body border-l-2 transition-all duration-300 ${isActive ? 'border-ro-gold text-ro-gold bg-ro-gold/5' : 'border-transparent text-ro-gray-400 hover:border-ro-gold/30 hover:text-ro-white'}`}>
                {link.label}
              </Link>
            );
          })}

          {/* Join the RO Network — ghost badge, matches footer style */}
          <div className="px-4 pt-3">
            <p className="text-ro-gray-600 text-[10px] mb-1.5 uppercase tracking-wider">Trade professional?</p>
            <div ref={joinNavRef} style={{ transformOrigin: 'left center', display: 'inline-block' }}>
              <Link
                href="/join"
                onClick={() => setIsOpen(false)}
                className="join-cta-badge inline-flex items-center gap-1.5 px-2 py-[3px] text-[10px] font-heading tracking-wider uppercase"
              >
                <span className="relative z-10">Join the RO Network</span>
                <span className="relative z-10 opacity-70">→</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-ro-gray-800 mt-4">
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 text-ro-gold px-4 py-2">
              <Phone size={16} /><span className="font-mono">{COMPANY.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
