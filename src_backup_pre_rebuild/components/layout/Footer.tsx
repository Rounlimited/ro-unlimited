'use client';
import Link from 'next/link';
import { COMPANY, DIVISIONS } from '@/lib/constants';
import { Phone, Mail, MapPin, Facebook, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <footer className="relative bg-ro-black border-t border-ro-gold/10">
      <div className="h-1 caution-stripe opacity-30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border-2 border-ro-gold flex items-center justify-center">
                <span className="text-ro-gold font-heading text-lg font-bold">RO</span>
              </div>
              <div>
                <div className="text-ro-white font-heading text-base tracking-wider uppercase">RO Unlimited</div>
                <div className="text-ro-gold/50 text-xs tracking-[0.15em] uppercase">Contractor & Developer</div>
              </div>
            </div>
            <p className="text-ro-gray-500 text-sm leading-relaxed mb-6">
              {COMPANY.experience} years of complete commercial and residential construction. Problem solving, designing, developing — ground up.
            </p>
            <a href={COMPANY.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-ro-gray-500 hover:text-ro-gold transition-colors text-sm">
              <Facebook size={16} /><span>Follow us</span>
            </a>
          </div>
          <div>
            <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Divisions</h3>
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
          <div>
            <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Contact</h3>
            <ul className="space-y-4">
              <li><a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 text-ro-gray-400 hover:text-ro-gold transition-colors text-sm"><Phone size={14} className="text-ro-gold/60" />{COMPANY.phone}</a></li>
              <li><a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 text-ro-gray-400 hover:text-ro-gold transition-colors text-sm"><Mail size={14} className="text-ro-gold/60" />{COMPANY.email}</a></li>
              <li className="flex items-center gap-3 text-ro-gray-400 text-sm"><MapPin size={14} className="text-ro-gold/60" />{COMPANY.serviceArea}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Start Your Project</h3>
            <p className="text-ro-gray-500 text-sm mb-6">{COMPANY.cta}</p>
            <Link href="/contact" className="inline-block px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors duration-300">
              Get a Quote
            </Link>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-ro-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-ro-gray-600 text-xs tracking-wide">&copy; {new Date().getFullYear()} {COMPANY.fullName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <p className="text-ro-gray-700 text-xs italic">{COMPANY.tagline}</p>
            <button onClick={scrollToTop} className="w-8 h-8 border border-ro-gray-700 flex items-center justify-center text-ro-gray-500 hover:text-ro-gold hover:border-ro-gold/30 transition-colors" aria-label="Back to top">
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
