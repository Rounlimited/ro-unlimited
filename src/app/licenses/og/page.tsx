import { LICENSES, STATES_LINE } from '@/lib/licenses';

/** 1200×630 link-preview image, captured to /public/og-licenses.png. */
const gold = '#C9A84C';

export default function LicenseOgPage() {
  const sc = LICENSES.filter((l) => l.classifications.length > 0);
  const codes = sc.flatMap((l) => l.classifications.map((c) => c.code));
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-start justify-center py-10">
      <style>{`nav, header, footer, [class*="sticky"], [class*="StickyCall"] { display: none !important; } main { padding-top: 0 !important; }`}</style>
      <div id="og-card" className="relative w-[1200px] h-[630px] bg-[#0a0a0a] text-white overflow-hidden" style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/utilities/jr-hot-tap.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'grayscale(1) contrast(1.1) brightness(0.4)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.9) 55%, rgba(10,10,10,0.6) 100%)' }} />
        <div className="absolute inset-x-0 top-0 h-[8px]" style={{ background: `repeating-linear-gradient(135deg, ${gold} 0 24px, #0a0a0a 24px 48px)` }} />
        <div className="relative h-full px-16 py-12 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ro-co-logo-v2.png" alt="RO Unlimited" className="h-[84px] w-auto" />
            <div className="text-right">
              <div className="text-[16px] tracking-[0.4em] uppercase" style={{ color: gold }}>Licensed {STATES_LINE}</div>
              <div className="text-[15px] text-white/55 mt-1">verify.llronline.com</div>
            </div>
          </div>
          <div className="flex items-end gap-8">
            <div className="text-[200px] font-black leading-[0.8]" style={{ color: gold }}>{codes.length}</div>
            <div className="pb-3">
              <div className="text-[44px] font-black uppercase leading-[0.95] tracking-tight">State license<br />classifications.</div>
              <div className="text-[30px] font-bold uppercase leading-tight tracking-tight text-white/85 mt-3">One contractor. No handoffs.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {codes.map((c) => (
              <span key={c} className="font-mono font-bold text-[22px] px-3 py-1 border border-white/20" style={{ color: gold, background: 'rgba(255,255,255,0.04)' }}>{c}</span>
            ))}
            <span className="font-mono font-bold text-[22px] px-3 py-1 border border-white/20 text-white/80" style={{ background: 'rgba(255,255,255,0.04)' }}>GA GC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
