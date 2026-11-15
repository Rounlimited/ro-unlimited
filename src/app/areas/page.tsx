import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import AreaAnimator from '@/components/areas/AreaAnimator';
import { COMPANY } from '@/lib/constants';
import { AREA_KINDS, AREA_PAGES, AREA_TOWNS, areaPath } from '@/lib/areas-data';
import { SITE_URL, breadcrumbLd, pageMeta } from '@/lib/seo';

const DESCRIPTION = 'Where RO Unlimited works: commercial construction, site work and underground utilities in Greenville, Spartanburg, Anderson, Greer, Easley and NE Georgia.';

export const metadata: Metadata = pageMeta({
  title: 'Service Areas | Upstate SC & Northeast Georgia',
  description: DESCRIPTION,
  path: '/areas',
  image: '/images/areas/ro-metal-building-graded-pad.jpg',
  imageAlt: 'Metal commercial building on a graded red clay pad, built by RO Unlimited',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Service Areas', path: '/areas' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'RO Unlimited service area pages',
    itemListElement: AREA_PAGES.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.h1,
      url: `${SITE_URL}${areaPath(p)}`,
    })),
  },
];

const tel = `tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`;

export default function AreasHubPage() {
  return (
    <AreaAnimator>
      <JsonLd data={structuredData} />

      <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 forge-bg" />
        <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.11]" />
        <div className="absolute inset-0 forge-slash pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono tracking-wider uppercase text-ro-gray-400">
              <li><Link href="/" className="hover:text-ro-gold transition-colors">Home</Link></li>
              <li className="text-ro-gold/30">/</li>
              <li className="text-ro-gold/80" aria-current="page">Service Areas</li>
            </ol>
          </nav>
          <div data-hero className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-black/40 mb-7">
            <MapPin size={12} className="text-ro-gold" />
            <span className="text-ro-gold text-[11px] font-mono tracking-[0.25em] uppercase">{COMPANY.serviceArea}</span>
          </div>
          <h1 data-hero className="text-ro-white font-heading uppercase leading-[0.95] tracking-tight mb-6" style={{ fontSize: 'clamp(2.2rem, 5vw, 4.2rem)' }}>
            Service Areas:<br /><span className="gradient-text-gold">Upstate South Carolina &amp; Northeast Georgia</span>
          </h1>
          <div data-hero className="w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />
          <p data-hero className="text-ro-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            RO Unlimited is a licensed general contractor serving commercial owners, developers and other contractors across the Upstate and over the Savannah River into Northeast Georgia. Every town below has its own water and sewer provider, its own permit office and its own stormwater rules. These pages lay out who signs off in each one and what that means for a building, a site package or an underground utility job there.
          </p>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 forge-bg-alt" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {AREA_TOWNS.map((town) => {
              const pages = AREA_PAGES.filter((p) => p.town === town.slug);
              return (
                <div key={town.slug} data-reveal className="relative p-6 sm:p-8 border border-ro-gray-800/40 bg-[#1a150d]/20">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ro-gold/20" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ro-gold/20" />
                  <span className="text-ro-gold text-[11px] font-mono tracking-[0.25em] uppercase block mb-2">{town.county}</span>
                  <h2 className="text-ro-white font-heading text-2xl sm:text-3xl tracking-tight uppercase leading-tight mb-3">{town.name}</h2>
                  <p className="text-ro-gray-300 text-base leading-relaxed mb-5">{town.blurb}</p>
                  <ul className="space-y-2">
                    {pages.map((p) => (
                      <li key={areaPath(p)}>
                        <Link href={areaPath(p)} className="group flex items-center justify-between gap-3 px-4 py-3.5 border border-ro-gray-800 bg-ro-black/40 hover:border-ro-gold/40 transition-colors">
                          <span className="text-ro-white font-heading text-base tracking-wide uppercase leading-snug">{p.h1}</span>
                          <ArrowRight size={16} className="text-ro-gold flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-ro-gray-800">
        <div className="absolute inset-0 forge-bg" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 data-reveal className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase leading-[0.95] mb-4">
            Not on the list? <span className="gradient-text-gold">Call anyway.</span>
          </h2>
          <p data-reveal className="text-ro-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl mb-8">
            These are the towns we have written up, not the edge of where we work. RO is licensed in South Carolina and Georgia and takes commercial building, site and utility work across both. The division pages cover the work itself in full.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {Object.values(AREA_KINDS).flatMap((k) => k.divisions).filter((d, i, all) => all.findIndex((x) => x.href === d.href) === i).map((d) => (
              <Link key={d.href} href={d.href} className="px-4 py-3 text-sm border border-ro-gray-700 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/40 transition-colors uppercase tracking-wider font-heading">
                {d.label} &rarr;
              </Link>
            ))}
            <Link href="/licenses" className="px-4 py-3 text-sm border border-ro-gray-700 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/40 transition-colors uppercase tracking-wider font-heading">
              Licenses &rarr;
            </Link>
          </div>
          <div data-reveal className="flex flex-col sm:flex-row gap-3">
            <Link href="/contact" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-colors">
              Send Us Your Plans <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={tel} className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold/5 transition-colors">
              <Phone size={14} /> {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>
    </AreaAnimator>
  );
}
