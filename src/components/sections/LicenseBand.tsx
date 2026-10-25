'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';
import CountUp from '@/components/animations/CountUp';
import { LICENSES, LLR_LOOKUP_URL, STATES_LINE } from '@/lib/licenses';

/**
 * Homepage "license plate" band — the proof behind the pitch. Most
 * contractors hold one or two classifications; RO holds thirteen, so one
 * license holder can be accountable for the whole job. Credentials only —
 * no promises about who swings the shovel or who owns a delay (owner, 2026-10).
 * Engraved-plate tiles reveal left to right; every number links to the lookup.
 */
const WHY = [
  { k: 'Licensed for all of it', v: 'Building, grading, water and sewer, boring, highway, concrete, masonry, marine, public power, plumbing, electrical, HVAC and septic — permits pulled under RO\u2019s own numbers.' },
  { k: 'One contractor accountable', v: 'One license holder on the permits and the inspections, one insurance certificate, one point of responsibility for the finished job.' },
  { k: 'Verified, not claimed', v: 'Every number is public record on the SC LLR lookup. Bonded and insured for the job at hand — certificates on request.' },
];

export default function LicenseBand() {
  const ref = useRef<HTMLElement>(null);
  const sc = LICENSES.filter((l) => l.classifications.length > 0);
  const total = sc.reduce((n, l) => n + l.classifications.length, 0);

  useGSAP(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const tiles = ref.current.querySelectorAll('.lic-tile');
    gsap.set(tiles, { opacity: 0, y: 18 });
    gsap.to(tiles, {
      opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none none', id: 'license-band' },
    });
  }, { scope: ref });

  return (
    <section ref={ref} id="licenses-band" className="relative py-20 sm:py-28 overflow-hidden border-t border-ro-gray-800">
      <div className="absolute inset-0 steel-texture opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* Left: the number and the claim */}
          <div className="lg:col-span-5">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-5">Licensed {STATES_LINE}</span>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-ro-gold font-heading text-[96px] sm:text-[128px] leading-[0.8]">
                <CountUp end={total} duration={1.6} />
              </span>
              <span className="text-ro-white font-heading text-2xl sm:text-3xl uppercase tracking-tight leading-[0.95] pb-2">
                State license<br />classifications
              </span>
            </div>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl uppercase tracking-tight leading-[0.95] mt-6">
              One license holder.<br /><span className="gradient-text-gold">Accountable for all of it.</span>
            </h2>
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mt-5 max-w-xl">
              Most contractors hold one or two. RO Unlimited is licensed for the building, the dirt, the pipe,
              the power, the concrete, the mechanicals and the septic &mdash; one license holder accountable for the
              whole job, with trade crews scaled to the project.
            </p>
            <ul className="mt-7 space-y-4">
              {WHY.map((w) => (
                <li key={w.k} className="flex gap-3">
                  <span className="mt-1 w-4 h-4 shrink-0 border-t-2 border-l-2 border-ro-gold/60" />
                  <div>
                    <p className="text-ro-white font-heading text-sm tracking-wider uppercase">{w.k}</p>
                    <p className="text-ro-gray-400 text-[15px] leading-relaxed">{w.v}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/licenses" className="group inline-flex items-center justify-center gap-2 min-h-[52px] px-6 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">
                Every license, every number <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={LLR_LOOKUP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 border border-ro-gold/40 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/10 transition-colors">
                <ShieldCheck size={16} /> Verify on SC LLR <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Right: the plates */}
          <div className="lg:col-span-7 space-y-6">
            {sc.map((lic) => (
              <div key={lic.id}>
                <div className="flex items-baseline justify-between gap-4 mb-3 border-b border-ro-gray-800 pb-2">
                  <p className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase">
                    {lic.id === 'osww' ? 'Onsite Wastewater — Tier 2' : lic.title}
                    {lic.group && <span className="text-ro-gray-500 font-body normal-case tracking-normal text-sm"> &nbsp;Group {lic.group} · {lic.limit}</span>}
                  </p>
                  <p className="font-mono text-ro-gold text-sm sm:text-base tracking-wide shrink-0">{lic.number}</p>
                </div>
                <div className={`grid gap-2 ${lic.classifications.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {lic.classifications.map((c) => (
                    <Link key={c.code} href={`/licenses#${lic.id}`} className="lic-tile group flex items-center gap-3 px-3.5 py-3 border border-ro-gray-800 bg-ro-black/60 hover:border-ro-gold/50 transition-colors"
                      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                      <span className="font-mono text-ro-gold text-xl sm:text-2xl tracking-wide whitespace-nowrap min-w-[64px]">{c.code}</span>
                      <span className="text-ro-gray-200 font-heading text-[13px] sm:text-sm uppercase tracking-tight leading-tight group-hover:text-ro-white">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-ro-gray-600 text-xs font-mono tracking-wide">Also a licensed general contractor in Georgia. Classification display — refer to issued licenses for terms.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
