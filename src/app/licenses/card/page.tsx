import { LICENSES } from '@/lib/licenses';

/**
 * The shareable version — a 1080×1350 card (phone / Messenger / Facebook
 * portrait) rendered from the same data as /licenses, screenshotted into
 * /public/ro-licenses-card.png. Replaces the AI-generated poster: real
 * numbers, readable at phone size, no invented photos.
 */
export default function LicenseCardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-start justify-center py-10">
      {/* The card is captured by itself — no site chrome in the picture. */}
      <style>{`nav, header, footer, [class*="sticky"], [class*="StickyCall"] { display: none !important; } main { padding-top: 0 !important; }`}</style>
      <div id="license-card" className="relative w-[1080px] h-[1350px] bg-[#0b0b0b] text-white overflow-hidden" style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 500px at 50% -10%, rgba(201,168,76,0.18), transparent 60%)' }} />
        <div className="absolute inset-x-0 top-0 h-[6px]" style={{ background: 'repeating-linear-gradient(135deg, #C9A84C 0 26px, #0b0b0b 26px 52px)' }} />

        {/* Header */}
        <div className="relative px-16 pt-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ro-co-logo-v2.png" alt="RO Unlimited" className="h-[96px] w-auto" />
          </div>
          <div className="text-right">
            <div className="text-[14px] tracking-[0.4em] uppercase text-[#C9A84C]">South Carolina</div>
            <div className="text-[30px] font-extrabold uppercase tracking-tight leading-none mt-1">License Classifications</div>
          </div>
        </div>

        {/* Body */}
        <div className="relative px-16 mt-10 space-y-7">
          {LICENSES.map((lic) => (
            <div key={lic.id} className="border border-white/15 bg-white/[0.03]">
              <div className="flex items-end justify-between gap-8 px-7 py-4 border-b border-white/10">
                <div className="min-w-0">
                  <div className="text-[12px] tracking-[0.3em] uppercase text-[#C9A84C]">{lic.issuerShort}{lic.group ? ` · Group ${lic.group} · ${lic.limit}` : ''}</div>
                  <div className="text-[30px] font-extrabold uppercase tracking-tight leading-none mt-1">{lic.id === 'osww' ? 'Onsite Wastewater — Tier 2' : lic.title}</div>
                </div>
                <div className="text-[34px] font-mono font-bold text-[#C9A84C] tracking-wide shrink-0">{lic.number}</div>
              </div>
              <div className={`grid gap-3 p-5 ${lic.classifications.length >= 9 ? 'grid-cols-3' : lic.classifications.length === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {lic.classifications.map((c) => (
                  <div key={c.code} className="border border-white/10 bg-black/40 px-5 py-4 flex items-center gap-6">
                    <div className="text-[30px] font-mono font-bold text-[#C9A84C] min-w-[92px] whitespace-nowrap">{c.code}</div>
                    <div>
                      <div className="text-[19px] font-bold uppercase tracking-tight leading-tight">{c.name}</div>
                      {lic.classifications.length === 1 && <div className="text-[16px] text-white/65 mt-1 leading-snug">{c.covers}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute inset-x-0 bottom-0 px-16 pb-10">
          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[15px] text-white/60">
            <span>(864) 304-0139 &nbsp;·&nbsp; rounlimited.com/licenses &nbsp;·&nbsp; Easley, SC</span>
            <span>Verify at verify.llronline.com &nbsp;·&nbsp; Licensed &amp; Insured &nbsp;·&nbsp; SC · GA · NC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
