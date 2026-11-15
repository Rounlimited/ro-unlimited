'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

import LicenseRail from '@/components/sections/LicenseRail';
import { DIVISIONS, COMPANY } from '@/lib/constants';
import { GRADING_SERVICES, GRADING_STEPS, GRADING_FAQS } from '@/lib/grading-data';
import { ArrowRight, Phone, Mountain, ChevronDown, Check, MapPin, Droplets, Building2 } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

const division = DIVISIONS.find(d => d.id === 'grading')!;
const TEL = `tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`;

const HERO_FACTS = [
  { value: COMPANY.experience, label: 'Years in the dirt' },
  { value: '13', label: 'State license classifications' },
  { value: 'SC & GA', label: 'Licensed in both states' },
];

// `ro-` files are RO Unlimited's own job photos; `px-` files are stock
// placeholders. Captions on stock describe the kind of work, never a job.
const GALLERY = [
  { src: '/images/grading/ro-graded-drive-steel-frame-2026.jpg', alt: 'RO Unlimited job site in Upstate South Carolina: graded and stoned drive running alongside a steel building frame', cap: 'RO job site: graded drive beside the steel', tall: true },
  { src: '/images/grading/px-track-loader-red-clay-36657004.jpg', alt: 'Compact track loader fine grading red clay next to a concrete slab', cap: 'Track loader fine grading red clay' },
  { src: '/images/grading/px-aerial-red-clay-site-23910575.jpg', alt: 'Aerial view of red clay excavation with a dump truck and loader at work', cap: 'Excavation and haul-off from above' },
  { src: '/images/grading/ro-site-steel-frame-2026.jpg', alt: 'RO Unlimited job site in Upstate South Carolina: red steel building frame going up on a prepared site', cap: 'RO job site: steel going up on the pad', tall: true },
  { src: '/images/grading/px-track-loader-spotter-15110000.jpg', alt: 'Skid steer track loader moving dirt while a spotter in a safety vest watches', cap: 'Skid steer and spotter on the cut' },
  { src: '/images/grading/px-detention-pond-aerial-12485784.jpg', alt: 'Aerial view of a finished detention pond between apartment buildings and parking', cap: 'A finished detention pond doing its job' },
  { src: '/images/grading/px-roller-compaction-31086011.jpg', alt: 'Smooth drum roller compacting red soil while two workers check grade', cap: 'Compacting fill and checking grade', wide: true },
];

const ONE_CONTRACTOR = [
  { icon: Mountain, title: 'Site', text: 'Clearing, grading, pads, ponds and subgrade under the Grading and Highway classifications.', href: null },
  { icon: Droplets, title: 'Utilities', text: 'Water, sewer and storm drainage under the Water & Sewer Lines classification.', href: '/utilities' },
  { icon: Building2, title: 'Building', text: 'Foundations, structure and finish under the Building and Concrete classifications.', href: '/commercial' },
];

const AREA_TOWNS = ['Greenville', 'Easley', 'Greer', 'Spartanburg', 'Anderson', 'Northeast Georgia'];

export default function GradingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <SubPageAnimator>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <Image src="/images/grading/px-dozer-mass-grading-9577586.jpg" alt="" fill priority className="object-cover opacity-25" sizes="100vw" aria-hidden="true" />
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/80 to-ro-black" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-ro-gold/20 bg-ro-gold/5 mb-6">
              <Mountain size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">{division.name}</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tight uppercase leading-[0.9] mb-6">
              Every Build Starts<br /><span className="gradient-text-gold">With the Ground</span>
            </h1>
            <div className="w-24 gold-line mb-6" />
            <p className="text-ro-gray-300 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">{division.description}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">Get a Site Quote <ArrowRight size={14} /></Link>
              <a href={TEL} className="flex items-center gap-2 px-6 py-3 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/5 transition-colors"><Phone size={14} /> {COMPANY.phone}</a>
            </div>
          </div>
          <dl className="mt-14 grid grid-cols-3 max-w-2xl border-t border-white/10 divide-x divide-white/10">
            {HERO_FACTS.map((f) => (
              <div key={f.label} className="px-3 sm:px-5 pt-5 first:pl-0">
                <dd className="text-ro-gold font-heading text-xl sm:text-3xl tracking-tight">{f.value}</dd>
                <dt className="text-ro-gray-400 text-[11px] sm:text-xs font-mono tracking-wider uppercase mt-1 leading-snug">{f.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ═══ WHAT THE DIVISION DOES ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Site Work Contractor &middot; Upstate SC</span>
              <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-[0.95] mb-5">Site Work &amp; Land Grading in Upstate South Carolina</h2>
              <div className="w-24 gold-line mb-6" />
              <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                Before a slab is poured or a wall goes up, somebody has to turn raw land into a site that drains, holds a building and passes inspection. That is this division. We clear the land, move the dirt, build the pad, shape the ponds and swales, and leave the ground ready for foundations.
              </p>
              <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                RO Unlimited is based in Easley and works the Greenville area and the rest of the Upstate, with licensing in South Carolina and Georgia. Grading is one of the 13 state license classifications we hold, alongside the water, sewer, concrete, highway and building classifications that the rest of the job needs.
              </p>
              <ul className="space-y-2.5">
                {['Commercial pads, outparcels and shell-building sites', 'Retail and light multi-family site development', 'Lots and driveways for custom homes', 'Site packages for other general contractors'].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-ro-gray-300 text-base"><Check size={18} className="text-ro-gold shrink-0 mt-0.5" /> {t}</li>
                ))}
              </ul>
            </div>
            <figure className="relative">
              <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] overflow-hidden border border-ro-gray-800">
                <Image src="/images/grading/ro-pad-metal-building-2026.jpg" alt="RO Unlimited job site in Upstate South Carolina: finished metal building on a graded red clay pad with equipment tracks in the foreground" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-ro-black/70 via-transparent to-transparent" />
              </div>
              <figcaption className="absolute bottom-4 left-4 right-4 text-ro-gray-200 text-sm font-mono tracking-wide">RO Unlimited job site, Upstate SC: red clay pad, building standing on it.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">What We Do to the Ground</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase">Site Work Services</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mt-5 max-w-2xl mx-auto">Land clearing, mass grading, building pads, stormwater, erosion control and subgrade. Hire one piece or the whole site package.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {GRADING_SERVICES.map((s) => (
              <div key={s.num} className="group relative border border-ro-gray-800 hover:border-ro-gold/40 bg-ro-black/60 overflow-hidden transition-colors duration-500">
                <div className="relative h-48 sm:h-52 overflow-hidden">
                  <Image src={s.img} alt={s.alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ro-black via-ro-black/30 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-ro-gold font-mono text-xs tracking-widest">{s.num}</span>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-ro-white font-heading text-lg sm:text-xl tracking-wider uppercase mb-2 group-hover:text-ro-gold transition-colors duration-300">{s.title}</h3>
                  <p className="text-ro-gray-300 text-base leading-relaxed mb-4">{s.desc}</p>
                  <ul className="space-y-1.5 border-t border-ro-gray-800 pt-4">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-ro-gray-400 text-[15px] leading-snug"><span className="mt-2 w-1.5 h-1.5 bg-ro-gold/70 shrink-0" /> {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Link href="/contact" className="flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">Price My Site Work <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* ═══ HOW A JOB RUNS ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">How a Site Work Job Runs</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase">From Survey to Pad-Ready</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {GRADING_STEPS.map((step) => (
              <div key={step.num} className="relative p-6 sm:p-7 border border-ro-gray-800 bg-ro-black/50">
                <div className="w-12 h-12 flex items-center justify-center border border-ro-gold/40 text-ro-gold font-heading text-lg mb-5">{step.num}</div>
                <h3 className="text-ro-white font-heading text-lg tracking-wider uppercase mb-2">{step.title}</h3>
                <p className="text-ro-gray-300 text-base leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ONE CONTRACTOR ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800 overflow-hidden">
        <Image src="/images/grading/px-aerial-red-clay-site-23910575.jpg" alt="" fill className="object-cover opacity-[0.07]" sizes="100vw" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10 sm:mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Why It Matters</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-[0.95] mb-5">Site, Utilities and Building. <span className="gradient-text-gold">One Contractor.</span></h2>
            <div className="w-24 gold-line mb-6" />
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-4">
              On most projects the grading contractor, the utility contractor and the builder are three different companies. Each one hands the site to the next, and every handoff is a place for a pad elevation to be off, a trench to settle under new pavement, or a question about who fixes it.
            </p>
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed">
              RO Unlimited holds the license classifications for all three. The company that cuts the pad is the one that has to pour on it, and the one that backfills the storm line is the one that has to pave over it. One license holder is accountable from the first cut to the finished building.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {ONE_CONTRACTOR.map(({ icon: Ic, title, text, href }) => (
              <div key={title} className="p-6 border border-white/10 bg-ro-black/70 backdrop-blur-sm">
                <div className="w-11 h-11 flex items-center justify-center border border-ro-gold/30 bg-ro-gold/5 mb-4"><Ic size={20} className="text-ro-gold" /></div>
                <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-2">{title}</h3>
                <p className="text-ro-gray-300 text-base leading-relaxed">{text}</p>
                {href && (
                  <Link href={href} className="mt-4 inline-flex items-center gap-2 text-ro-gold text-sm font-heading tracking-wider uppercase underline underline-offset-4">
                    {title === 'Utilities' ? 'Underground utilities' : 'Commercial construction'} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LicenseRail codes={['GD4', 'HY4', 'CT4', 'WL4', 'BT4']} title="Licensed from raw land to pad" intro="Grading, roads and parking, concrete, and the water and sewer that go in before the pad is finished — all under our own license classifications." />

      {/* ═══ GALLERY ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">On the Ground</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase">Grading &amp; Site Work Photos</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mt-5 max-w-2xl mx-auto">Red clay, steel tracks and a string line. This is what the work looks like between the survey stakes and the first concrete truck.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 grid-flow-dense gap-3 sm:gap-4">
            {GALLERY.map((g) => (
              <div key={g.src} className={`group relative overflow-hidden border border-ro-gray-800 hover:border-ro-gold/40 transition-colors duration-500 ${g.tall ? 'row-span-2 min-h-[20rem] sm:min-h-[28rem]' : 'h-40 sm:h-56'} ${g.wide ? 'col-span-2 lg:col-span-1' : ''}`}>
                <Image src={g.src} alt={g.alt} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-ro-black/85 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 right-3 text-ro-gray-200 text-xs sm:text-sm leading-snug">{g.cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICE AREA ═══ */}
      <section className="py-16 sm:py-20 relative border-t border-ro-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Where We Work</span>
              <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase leading-[0.95] mb-4">Grading Contractor for Greenville and the Upstate</h2>
              <div className="w-24 gold-line mb-5" />
              <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed">
                We run out of Easley, so Greenville and the towns around it are home ground. We take site work across Upstate South Carolina and into Northeast Georgia, and we are licensed in both states.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AREA_TOWNS.map((t) => (
                <div key={t} className="flex items-center gap-2 px-4 py-4 border border-ro-gray-800 bg-ro-black/50 text-ro-gray-200 text-base">
                  <MapPin size={16} className="text-ro-gold shrink-0" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Straight Answers</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Site Work &amp; Grading FAQ</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {GRADING_FAQS.map((f, i) => (
              <div key={f.q} className="border border-ro-gray-800 hover:border-ro-gold/30 transition-colors duration-300 bg-ro-black/50">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 min-h-[56px] text-left">
                  <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wide uppercase">{f.q}</h3>
                  <ChevronDown size={18} className={`text-ro-gold shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className="grid transition-all duration-500" style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr', opacity: openFaq === i ? 1 : 0 }}>
                  <p className="overflow-hidden px-5 sm:px-6 text-ro-gray-300 text-base leading-relaxed"><span className="block pb-5">{f.a}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28 relative border-t border-ro-gray-800 overflow-hidden">
        <Image src="/images/grading/px-track-loader-red-clay-36657004.jpg" alt="" fill className="object-cover opacity-15" sizes="100vw" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/80 to-ro-black" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-ro-white font-heading text-3xl sm:text-5xl tracking-tight uppercase leading-[0.95] mb-6">Send Us the Site.<br /><span className="gradient-text-gold">We&apos;ll Price the Dirt.</span></h2>
          <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">Send the civil drawings, a survey, or just the address and what you want to build. We will walk the site and scope the grading, the storm drainage and the utilities around it as one package.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.12em] uppercase hover:bg-ro-gold-light transition-colors">Get a Site Quote <ArrowRight size={14} /></Link>
            <a href={TEL} className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-ro-gold/30 text-ro-gold font-heading text-sm tracking-[0.12em] uppercase hover:bg-ro-gold/5 transition-colors"><Phone size={14} /> {COMPANY.phone}</a>
            <Link href="/utilities" className="inline-flex items-center justify-center px-5 py-4 border border-ro-gray-700 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading text-sm">Underground Utilities &rarr;</Link>
            <Link href="/commercial" className="inline-flex items-center justify-center px-5 py-4 border border-ro-gray-700 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading text-sm">Commercial &rarr;</Link>
            <Link href="/process" className="inline-flex items-center justify-center px-5 py-4 border border-ro-gray-700 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/30 transition-colors uppercase tracking-wider font-heading text-sm">Our Process &rarr;</Link>
          </div>
          <p className="text-ro-gray-400 text-sm mt-8">{COMPANY.hours} &middot; <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-4 hover:text-ro-gold">{COMPANY.email}</a></p>
        </div>
      </section>
    </SubPageAnimator>
  );
}
