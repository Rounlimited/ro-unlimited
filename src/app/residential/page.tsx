import Link from 'next/link';
import { DIVISIONS, COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, Home } from 'lucide-react';

const division = DIVISIONS.find(d => d.id === 'residential')!;

export default function ResidentialPage() {
  return (
    <>
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-6">
              <Home size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">Residential Division</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.9] mb-6">
              Luxury Homes,<br /><span className="gradient-text-gold">Built to Last</span>
            </h1>
            <div className="w-24 gold-line mb-6" />
            <p className="text-ro-gray-400 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">{division.description}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">Start Your Build <ArrowRight size={14} /></Link>
              <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"><Phone size={14} /> {COMPANY.phone}</a>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 relative">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">What We Build</span>
            <h2 className="text-ro-white font-heading text-4xl tracking-tight uppercase">Residential Services</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {division.services.map((service, i) => (
              <div key={service} className="p-6 border border-ro-gray-800 hover:border-ro-gold/20 bg-ro-black/50 transition-all duration-500">
                <div className="text-ro-gold font-mono text-xs mb-3">0{i + 1}</div>
                <h3 className="text-ro-white font-heading text-lg tracking-wider uppercase mb-2">{service}</h3>
                <div className="w-8 h-[1px] bg-ro-gold/30" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 border-t border-ro-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-ro-gray-500 mb-6">Need land grading before your build? We handle that too.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/grading" className="px-4 py-2 text-sm border border-ro-gray-700 text-ro-gray-400 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading">Land Grading &rarr;</Link>
            <Link href="/commercial" className="px-4 py-2 text-sm border border-ro-gray-700 text-ro-gray-400 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading">Commercial &rarr;</Link>
            <Link href="/process" className="px-4 py-2 text-sm border border-ro-gray-700 text-ro-gray-400 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading">Our Process &rarr;</Link>
          </div>
        </div>
      </section>
    </>
  );
}
