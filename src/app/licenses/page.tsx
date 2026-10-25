import Link from 'next/link';
import { ShieldCheck, ExternalLink, FileDown, ImageDown, Phone } from 'lucide-react';
import { LICENSES, LLR_LOOKUP_URL } from '@/lib/licenses';
import { COMPANY } from '@/lib/constants';

/**
 * Licenses & Classifications — the prequal page. A GC's estimator, a lender
 * or a county inspector lands here from the footer, reads the numbers, and
 * clicks straight through to the state lookup. Plain HTML on purpose: it
 * indexes, it prints, it reads at any size, and it never goes out of date
 * separately from the rest of the site (one data file feeds everything).
 */
export default function LicensesPage() {
  const total = LICENSES.reduce((n, l) => n + l.classifications.length, 0);

  return (
    <div className="bg-ro-black text-ro-white">
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 steel-texture opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-5">South Carolina</span>
          <h1 className="font-heading text-4xl sm:text-6xl tracking-tight uppercase leading-[0.95]">
            License <span className="gradient-text-gold">Classifications</span>
          </h1>
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mt-7" />
          <p className="text-ro-gray-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mt-7">
            {total} state license classifications under one contractor &mdash; the dirt, the pipe, the power,
            the building and the septic, self-performed under our own licenses. Every number below is
            public record; verify it on the state site before you call.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-9">
            <a href={LLR_LOOKUP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[52px] px-6 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">
              <ShieldCheck size={18} /> Verify on SC LLR <ExternalLink size={14} />
            </a>
            <a href="/api/capability-statement" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 min-h-[52px] px-6 border border-ro-gold/40 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/10 transition-colors">
              <FileDown size={18} /> Capability Statement (PDF)
            </a>
            <a href="/ro-licenses-card.png" download="RO-Unlimited-Licenses.png"
              className="inline-flex items-center gap-2 min-h-[52px] px-6 border border-ro-gray-700 text-ro-gray-300 font-heading text-sm tracking-wider uppercase hover:border-ro-gold/40 hover:text-ro-gold transition-colors">
              <ImageDown size={18} /> Save as Image
            </a>
          </div>
        </div>
      </section>

      {/* Licenses */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {LICENSES.map((lic) => (
            <article key={lic.id} className="border border-ro-gray-800 bg-ro-black/60 relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ro-gold/50" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ro-gold/50" />

              {/* License header */}
              <header className="px-5 sm:px-8 py-6 sm:py-7 border-b border-ro-gray-800 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-2">{lic.issuer}</p>
                  <h2 className="font-heading text-2xl sm:text-4xl tracking-tight uppercase leading-none">
                    {lic.title}
                  </h2>
                </div>
                <div className="lg:text-right">
                  <p className="text-ro-gray-500 text-xs font-mono tracking-[0.25em] uppercase">License Number</p>
                  <p className="font-mono text-2xl sm:text-3xl text-ro-white tracking-wide select-all">{lic.number}</p>
                  {lic.group && (
                    <p className="text-ro-gray-400 text-sm mt-1">
                      Group {lic.group} &mdash; <span className="text-ro-white">{lic.limit}</span>
                    </p>
                  )}
                </div>
              </header>

              {/* Classification tiles */}
              <div className="p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lic.classifications.map((c) => (
                  <div key={c.code} className="group border border-ro-gray-800 bg-ro-black/50 p-5 hover:border-ro-gold/40 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="font-mono text-2xl sm:text-3xl text-ro-gold tracking-wide">{c.code}</span>
                      <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-ro-gray-600 group-hover:text-ro-gray-400 transition-colors">{lic.number}</span>
                    </div>
                    <h3 className="font-heading text-lg sm:text-xl uppercase tracking-tight text-ro-white mb-2">{c.name}</h3>
                    <p className="text-ro-gray-400 text-[15px] leading-relaxed">{c.covers}</p>
                  </div>
                ))}
              </div>

              <footer className="px-5 sm:px-8 pb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <a href={lic.verifyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ro-gold hover:text-ro-gold-light underline underline-offset-4">
                  Verify {lic.number} on {lic.issuerShort} <ExternalLink size={13} />
                </a>
                {lic.group && <span className="text-ro-gray-500">Group {lic.group} license limit: {lic.limit}.</span>}
              </footer>
            </article>
          ))}

          {/* Multi-state + insurance + contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-ro-gray-800 p-6">
              <p className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-2">Also Licensed</p>
              <p className="text-ro-white font-heading text-xl uppercase tracking-tight">Georgia &amp; North Carolina</p>
              <p className="text-ro-gray-400 text-[15px] mt-2 leading-relaxed">We mobilize across the tri-state. Out-of-state license documentation is furnished with any bid or prequalification package.</p>
            </div>
            <div className="border border-ro-gray-800 p-6">
              <p className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-2">Insured &amp; Bonded</p>
              <p className="text-ro-white font-heading text-xl uppercase tracking-tight">Certificates on Request</p>
              <p className="text-ro-gray-400 text-[15px] mt-2 leading-relaxed">General liability, auto and workers&rsquo; comp certificates, plus bonding capacity letters, go out the same day for lender and GC packets.</p>
            </div>
            <div className="border border-ro-gray-800 p-6">
              <p className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-2">Prequalification</p>
              <p className="text-ro-white font-heading text-xl uppercase tracking-tight">Talk to JR Directly</p>
              <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 text-ro-gold text-lg mt-2 hover:text-ro-gold-light">
                <Phone size={18} /> {COMPANY.phone}
              </a>
              <p className="text-ro-gray-500 text-sm mt-1">or <Link href="/contact" className="underline underline-offset-4 hover:text-ro-gold">send the project</Link>.</p>
            </div>
          </div>

          <p className="text-ro-gray-600 text-xs text-center font-mono tracking-wide pt-4">
            Classification display &middot; Refer to issued licenses for terms and limitations &middot; Group limits per SC LLR (H.4115, 2023)
          </p>
        </div>
      </section>
    </div>
  );
}
