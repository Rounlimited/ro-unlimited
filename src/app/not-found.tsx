import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: `Page Not Found — ${COMPANY.name}`,
  description: `The page you're looking for doesn't exist. Browse our construction, roofing, electrical, plumbing, septic, and repair services.`,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ro-black flex items-center justify-center px-6 py-20">
      <div className="relative max-w-2xl w-full text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="font-heading text-ro-gold/30 text-[10rem] sm:text-[14rem] leading-none tracking-tight mb-4">
            404
          </div>
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-8" />
          <h1 className="text-ro-white font-heading text-3xl sm:text-4xl uppercase tracking-tight mb-6">
            Page <span className="gradient-text-gold">Not Found</span>
          </h1>
          <p className="text-ro-gray-400 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Head back home or call us directly — we&apos;re happy to help.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/" className="group inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all">
              <Home size={14} /> Back Home <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-xs tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all">
              <Phone size={12} /> {COMPANY.phone}
            </a>
          </div>

          <div className="text-ro-gray-600 text-xs font-mono tracking-wider uppercase mb-4">Popular Pages</div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link href="/commercial" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Commercial</Link>
            <Link href="/services/roofing" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Roofing</Link>
            <Link href="/services/electrical" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Electrical</Link>
            <Link href="/services/plumbing" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Plumbing</Link>
            <Link href="/services/septic" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Septic</Link>
            <Link href="/services/repairs" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Repairs</Link>
            <Link href="/contact" className="text-ro-gold/70 hover:text-ro-gold transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
