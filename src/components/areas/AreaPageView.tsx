import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone, MapPin, ChevronDown, ExternalLink, Building2, Mountain, Waves } from 'lucide-react';
import { COMPANY } from '@/lib/constants';
import LicenseRail from '@/components/sections/LicenseRail';
import AreaAnimator from '@/components/areas/AreaAnimator';
import { AREA_KINDS, areaPath, otherServicesInTown, siblingTowns, type AreaPage } from '@/lib/areas-data';

/**
 * One town-and-service landing page. Server component: every word of the
 * page is in the first HTML response. Visual language is the sub-service
 * template's (forge backgrounds, corner-bracket cards, gold rules).
 */

const KIND_ICON = { commercial: Building2, grading: Mountain, utilities: Waves, 'commercial-site': Building2 } as const;
const tel = `tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`;

function SectionHead({ eyebrow, title, accent, center = false }: { eyebrow: string; title: string; accent?: string; center?: boolean }) {
  return (
    <div data-reveal className={`mb-12 sm:mb-14 ${center ? 'text-center' : ''}`}>
      <span className="text-ro-gold text-xs font-mono tracking-[0.3em] sm:tracking-[0.4em] uppercase block mb-4">{eyebrow}</span>
      <h2 className="text-ro-white font-heading text-3xl sm:text-5xl tracking-tight uppercase leading-[0.95]">
        {title}{accent ? <> <span className="gradient-text-gold">{accent}</span></> : null}
      </h2>
      <div className={`w-20 h-[2px] mt-6 ${center ? 'mx-auto bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent' : 'bg-gradient-to-r from-ro-gold/60 to-transparent'}`} />
    </div>
  );
}

export default function AreaPageView({ page }: { page: AreaPage }) {
  const kind = AREA_KINDS[page.kind];
  const Icon = KIND_ICON[page.kind];
  const siblings = siblingTowns(page);
  const others = otherServicesInTown(page);

  return (
    <AreaAnimator>
      <div className={kind.theme === 'utility' ? 'ud-theme' : undefined}>

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden">
          <Image src={page.heroImage} alt={page.heroAlt} fill priority className="object-cover" sizes="100vw" style={{ zIndex: 0 }} />
          {/* Flat scrim on phones (copy spans the full width), left-weighted on desktop. */}
          <div className="absolute inset-0 lg:hidden" style={{ zIndex: 1, background: 'rgba(10,10,10,0.86)' }} />
          <div className="absolute inset-0 hidden lg:block" style={{ zIndex: 1, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.95) 50%, rgba(10,10,10,0.72) 70%, rgba(0,0,0,0.2) 90%)' }} />
          <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, transparent 20%, transparent 75%, rgba(10,10,10,0.95) 100%)' }} />

          <div className="relative z-10 px-6 sm:px-10 lg:pl-16 pt-28 pb-16" style={{ maxWidth: 'min(700px, 100%)' }}>
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono tracking-wider uppercase text-ro-gray-400">
                <li><Link href="/" className="hover:text-ro-gold transition-colors">Home</Link></li>
                <li className="text-ro-gold/30">/</li>
                <li><Link href="/areas" className="hover:text-ro-gold transition-colors">Service Areas</Link></li>
                <li className="text-ro-gold/30">/</li>
                <li className="text-ro-gold/80" aria-current="page">{page.place}</li>
              </ol>
            </nav>

            <div data-hero className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/25 bg-ro-black/40 backdrop-blur-sm mb-7">
              <MapPin size={12} className="text-ro-gold flex-shrink-0" />
              <span className="text-ro-gold text-[10px] sm:text-[11px] font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase">Serving {page.place}</span>
            </div>

            <h1 data-hero className="text-ro-white font-heading uppercase leading-[0.95] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.1rem, 4.4vw, 3.9rem)', textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
              {page.h1Lead}{' '}<br />
              <span className="gradient-text-gold">{page.h1Place}</span>
            </h1>

            <div data-hero className="w-10 h-[2px] bg-gradient-to-r from-ro-gold/80 to-transparent mb-6" />

            <p data-hero className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.85)' }}>
              {page.intro}
            </p>

            <div data-hero className="flex flex-col sm:flex-row gap-3">
              <Link href="/contact" className="gold-pin group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300 whitespace-nowrap">
                Send Us Your Plans <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={tel} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold/5 hover:border-ro-gold/50 transition-all duration-300 backdrop-blur-sm whitespace-nowrap">
                <Phone size={13} /> {COMPANY.phone}
              </a>
            </div>
          </div>
        </section>

        {/* ═══ LOCAL GUIDE — the town-specific substance ═══ */}
        <section className="py-20 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 forge-bg" />
          <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.11]" />
          <div className="absolute inset-0 forge-slash pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow={`${kind.short} in ${page.placeShort}`} title={page.guideTitle} accent={page.guideAccent} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {page.sections.map((block, i) => (
                <div key={block.heading} data-reveal className="group relative p-6 sm:p-9 border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm hover:border-ro-gold/25 transition-colors duration-700">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ro-gold/20" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ro-gold/20" />
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-ro-gold/20 bg-ro-gold/[0.04]">
                      <span className="text-ro-gold font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="text-ro-white font-heading text-lg sm:text-xl tracking-wide uppercase leading-tight pt-0.5">{block.heading}</h3>
                  </div>
                  {block.body.map((p, j) => (
                    <p key={j} className="text-ro-gray-300 text-base leading-relaxed mb-4 last:mb-0">{p}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHO YOU DEAL WITH — verified local agencies ═══ */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 forge-bg-alt" />
          <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.08]" />
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Permits, Taps and Inspections" title="Who Signs Off in" accent={page.placeShort} />
            <div data-reveal className="border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm">
              {page.authorities.map((a, i) => (
                <div key={a.role} className={`grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 p-5 sm:p-6 ${i < page.authorities.length - 1 ? 'border-b border-ro-gray-800/40' : ''}`}>
                  <div className="text-ro-gold text-xs font-mono tracking-[0.15em] uppercase pt-1">{a.role}</div>
                  <div>
                    <h3 className="text-ro-white font-heading text-lg tracking-wide uppercase leading-tight">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-2 hover:text-ro-gold-light transition-colors">
                          {a.name} <ExternalLink size={12} className="text-ro-gold/50 flex-shrink-0" />
                        </a>
                      ) : a.name}
                    </h3>
                    <p className="text-ro-gray-300 text-base leading-relaxed mt-1.5">{a.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p data-reveal className="text-ro-gray-500 text-sm leading-relaxed mt-5">
              Agency names and requirements are taken from each agency&apos;s own published pages. They change, so the permit path for your parcel is confirmed with the agency before we price it.
            </p>
          </div>
        </section>

        {/* ═══ PHOTOS ═══ */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 forge-bg" />
          <div className="absolute inset-0 forge-slash pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="From Our Jobs" title="The Work," accent="Up Close" center />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {page.gallery.map((g) => (
                <figure key={g.src} data-reveal className="relative overflow-hidden border border-ro-gold/10">
                  <div className="relative aspect-[4/3]">
                    <Image src={g.src} alt={g.alt} fill className="object-cover" sizes="(max-width: 639px) 100vw, 33vw" />
                  </div>
                  <figcaption className="px-4 py-3 text-ro-gray-400 text-sm leading-snug bg-ro-black/60">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <LicenseRail codes={kind.licenseCodes} title={kind.licenseTitle} intro={kind.licenseIntro} accent={kind.theme === 'utility' ? '#F84B0C' : undefined} />

        {/* ═══ FAQ — answers are in the HTML (native <details>) ═══ */}
        <section className="py-20 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 forge-bg-alt" />
          <div className="absolute inset-0 blueprint-overlay-warm opacity-[0.10]" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow={`${page.placeShort} Questions`} title="Asked" accent="Before the Bid" center />
            <div className="space-y-4">
              {page.faq.map((item, i) => (
                <details key={item.q} data-reveal open={i === 0} className="group border border-ro-gray-800/40 bg-[#1a150d]/20 backdrop-blur-sm open:border-ro-gold/20 transition-colors">
                  <summary className="flex items-start gap-4 p-5 sm:p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <h3 className="flex-1 text-ro-white font-heading text-base sm:text-lg tracking-wide uppercase leading-snug">{item.q}</h3>
                    <ChevronDown size={18} className="text-ro-gold/50 flex-shrink-0 mt-1 transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1">
                    <p className="text-ro-gray-300 text-base leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CROSS-LINKS — division page, sibling towns, other services here ═══ */}
        <section className="py-20 sm:py-28 relative overflow-hidden border-t border-ro-gray-800">
          <div className="absolute inset-0 forge-bg" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="Keep Reading" title="More From" accent="RO Unlimited" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kind.divisions.map((d) => (
                <Link key={d.href} href={d.href} data-reveal className="group relative p-6 border border-ro-gold/25 bg-ro-gold/[0.04] hover:border-ro-gold/50 transition-colors">
                  <span className="text-ro-gold text-[11px] font-mono tracking-[0.2em] uppercase block mb-2">The full division page</span>
                  <span className="text-ro-white font-heading text-xl tracking-wide uppercase leading-tight flex items-center gap-2">
                    {d.label} <ArrowRight size={16} className="text-ro-gold group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-ro-gray-400 text-sm leading-relaxed block mt-2">{d.blurb}</span>
                </Link>
              ))}
              {others.map((o) => (
                <Link key={areaPath(o)} href={areaPath(o)} data-reveal className="group relative p-6 border border-ro-gray-800/60 bg-ro-black/40 hover:border-ro-gold/30 transition-colors">
                  <span className="text-ro-gray-500 text-[11px] font-mono tracking-[0.2em] uppercase block mb-2">Also in {o.placeShort}</span>
                  <span className="text-ro-white font-heading text-xl tracking-wide uppercase leading-tight flex items-center gap-2">
                    {AREA_KINDS[o.kind].short} <ArrowRight size={16} className="text-ro-gold/70 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-ro-gray-400 text-sm leading-relaxed block mt-2">{o.h1}</span>
                </Link>
              ))}
            </div>

            {siblings.length > 0 && (
              <div data-reveal className="mt-10">
                <h3 className="text-ro-gray-400 text-xs font-mono tracking-[0.25em] uppercase mb-4 flex items-center gap-2">
                  <Icon size={13} className="text-ro-gold" /> {kind.short} in nearby towns
                </h3>
                <div className="flex flex-wrap gap-3">
                  {siblings.map((s) => (
                    <Link key={areaPath(s)} href={areaPath(s)} className="px-4 py-3 text-sm border border-ro-gray-700 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/40 transition-colors uppercase tracking-wider font-heading">
                      {s.place} &rarr;
                    </Link>
                  ))}
                  <Link href="/areas" className="px-4 py-3 text-sm border border-ro-gold/30 text-ro-gold hover:bg-ro-gold/5 transition-colors uppercase tracking-wider font-heading">
                    All service areas &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="relative py-24 sm:py-32 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 forge-bg-alt" />
          <div className="absolute inset-0 forge-slash pointer-events-none" />
          <div data-reveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-ro-gold/40 to-transparent mx-auto mb-10" />
            <span className="text-ro-gold/80 text-xs font-mono tracking-[0.3em] sm:tracking-[0.4em] uppercase block mb-6">Building in {page.placeShort}?</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase leading-[0.9] mb-8">
              Send Us<br /><span className="gradient-text-gold">Your Plans</span>
            </h2>
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">{page.ctaLine}</p>
            <a href={tel} className="inline-flex items-center gap-3 text-ro-gold font-heading text-3xl sm:text-4xl tracking-tight hover:text-ro-gold-light transition-colors duration-300 mb-8">
              <Phone size={24} className="flex-shrink-0" /> {COMPANY.phone}
            </a>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="gold-pin group inline-flex items-center gap-3 px-10 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
                Request a Quote <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={`mailto:${COMPANY.email}`} className="text-ro-gray-300 hover:text-ro-gold transition-colors text-base underline underline-offset-4">{COMPANY.email}</a>
            </div>
          </div>
        </section>
      </div>
    </AreaAnimator>
  );
}
