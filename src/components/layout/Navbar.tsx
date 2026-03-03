'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS, COMPANY } from '@/lib/constants';
import { Menu, X, Phone } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ro-black/95 backdrop-blur-sm border-b border-ro-gold/10">
      <div className="h-[2px] w-full bg-ro-gray-800">
        <div className="h-full bg-gradient-to-r from-ro-gold-dark via-ro-gold to-ro-gold-light w-[35%]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-ro-gold flex items-center justify-center bg-ro-black group-hover:bg-ro-gold/10 transition-colors duration-300">
                <span className="text-ro-gold font-heading text-xl font-bold">RO</span>
              </div>
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-ro-gold/40" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-ro-gold/40" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-ro-gold/40" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-ro-gold/40" />
            </div>
            <div className="hidden sm:block">
              <div className="text-ro-white font-heading text-lg tracking-wider uppercase leading-none">RO Unlimited</div>
              <div className="text-ro-gold/60 text-xs tracking-[0.2em] uppercase font-body">Contractor & Developer</div>
            </div>
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
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-ro-gold p-2" aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
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
