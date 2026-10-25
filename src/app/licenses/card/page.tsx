import { LICENSES, STATES_LINE } from '@/lib/licenses';

/**
 * The shareable version — 1080×1920 (a full phone screen) rendered from the
 * same data as /licenses and screenshotted into /public/ro-licenses-card.png.
 * Built to be READ on a phone in Messenger: two columns, codes at 56px,
 * names at 30px, each license number printed once over its group. Backdrop
 * is one of JR's own hot-tap photos — no stock, no AI.
 */
const gold = '#C9A84C';

export default function LicenseCardPage() {
  const sc = LICENSES.filter((l) => l.classifications.length > 0);
  const ga = LICENSES.find((l) => l.id === 'ga');
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-start justify-center py-10">
      <style>{`nav, header, footer, [class*="sticky"], [class*="StickyCall"] { display: none !important; } main { padding-top: 0 !important; }`}</style>
      <div id="license-card" className="relative w-[1080px] h-[1920px] bg-[#0a0a0a] text-white overflow-hidden" style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}>
        {/* Backdrop: real jobsite photo, crushed to a texture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/utilities/jr-hot-tap.jpg" alt="" className="absolute inset-x-0 top-0 h-[560px] w-full object-cover" style={{ filter: 'grayscale(1) contrast(1.15) brightness(0.55)' }} />
        <div className="absolute inset-x-0 top-0 h-[560px]" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.75) 55%, #0a0a0a 100%)' }} />
        <div className="absolute inset-x-0 top-0 h-[10px]" style={{ background: `repeating-linear-gradient(135deg, ${gold} 0 28px, #0a0a0a 28px 56px)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(900px 400px at 50% 0%, rgba(201,168,76,0.12), transparent 70%)' }} />

        {/* Header */}
        <div className="relative px-14 pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ro-co-logo-v2.png" alt="RO Unlimited" className="h-[110px] w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.8)]" />
          <div className="mt-10 flex items-end justify-between">
            <div>
              <div className="text-[22px] tracking-[0.45em] uppercase" style={{ color: gold }}>South Carolina</div>
              <div className="text-[64px] font-black uppercase tracking-[-0.01em] leading-[0.95] mt-2">License<br />Classifications</div>
            </div>
            <div className="text-right pb-2">
              <div className="text-[120px] font-black leading-none" style={{ color: gold }}>{sc.reduce((n, l) => n + l.classifications.length, 0)}</div>
              <div className="text-[20px] tracking-[0.3em] uppercase text-white/70 -mt-2">Classifications</div>
            </div>
          </div>
          <div className="mt-5 text-[26px] leading-snug text-white/85">
            One contractor. No handoffs. Self-performed under our own licenses.
          </div>
        </div>

        {/* Licenses */}
        <div className="relative px-14 mt-8 space-y-6">
          {sc.map((lic) => (
            <div key={lic.id}>
              {/* Plate header */}
              <div className="flex items-end justify-between gap-6 border-b-2 pb-3" style={{ borderColor: gold }}>
                <div className="min-w-0">
                  <div className="text-[18px] tracking-[0.3em] uppercase text-white/60">{lic.issuerShort}{lic.group ? ` · Group ${lic.group} · ${lic.limit}` : ' · Tier 2 Installer'}</div>
                  <div className="text-[40px] font-black uppercase tracking-tight leading-none mt-1">{lic.id === 'osww' ? 'Onsite Wastewater' : lic.title}</div>
                </div>
                <div className="shrink-0 font-mono font-bold text-[44px] tracking-wide leading-none" style={{ color: gold }}>{lic.number}</div>
              </div>
              {/* Tiles */}
              <div className={`grid gap-3 mt-4 ${lic.classifications.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {lic.classifications.map((c) => (
                  <div key={c.code} className="flex items-center gap-5 px-6 border border-white/15" style={{ height: lic.classifications.length === 1 ? 118 : 94, background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                    <div className="font-mono font-bold text-[56px] leading-none whitespace-nowrap min-w-[150px]" style={{ color: gold }}>{c.code}</div>
                    <div className="min-w-0">
                      <div className="text-[30px] font-extrabold uppercase tracking-tight leading-[1.05]">{c.name}</div>
                      {lic.classifications.length === 1 && <div className="text-[22px] text-white/70 leading-snug mt-1">Pumps, grease traps, mounded systems &amp; all commercial onsite systems</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {ga && (
            <div className="flex items-center gap-4 text-[24px] text-white/80 pt-1">
              <span className="font-mono font-bold text-[26px]" style={{ color: gold }}>GA</span>
              <span>Also a licensed <span className="text-white font-bold">General Contractor in Georgia</span> &mdash; documentation furnished with any bid.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute inset-x-0 bottom-0 px-14 pb-12">
          <div className="border-t border-white/15 pt-6 flex items-center justify-between text-[22px] text-white/75">
            <div><span className="text-white font-bold">(864) 304-0139</span> &nbsp;·&nbsp; rounlimited.com/licenses</div>
            <div>Licensed &amp; Insured &nbsp;·&nbsp; {STATES_LINE}</div>
          </div>
          <div className="text-[18px] text-white/45 mt-2">Verify every number at verify.llronline.com &nbsp;·&nbsp; Easley, South Carolina</div>
        </div>
      </div>
    </div>
  );
}
