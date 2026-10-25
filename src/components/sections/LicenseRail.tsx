import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { LICENSES } from '@/lib/licenses';

/**
 * "What our licenses let us do here" — the classifications that apply to ONE
 * division page, shown where the buyer is already reading about that work.
 * Pass the codes; everything else (names, scopes, numbers) comes from the
 * source of truth.
 */
export default function LicenseRail({ codes, title = 'Licensed for this work', intro, accent = '#C9A84C' }: {
  codes: string[]; title?: string; intro?: string; accent?: string;
}) {
  const items = LICENSES.flatMap((l) => l.classifications.filter((c) => codes.includes(c.code)).map((c) => ({ ...c, lic: l })));
  if (!items.length) return null;
  return (
    <section className="py-16 sm:py-20 relative border-t border-ro-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono tracking-[0.3em] uppercase block mb-3" style={{ color: accent }}>State License Classifications</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase leading-[0.95]">{title}</h2>
            {intro && <p className="text-ro-gray-400 text-base sm:text-lg leading-relaxed mt-3 max-w-2xl">{intro}</p>}
          </div>
          <Link href="/licenses" className="inline-flex items-center gap-2 text-sm font-heading tracking-wider uppercase underline underline-offset-4 shrink-0" style={{ color: accent }}>
            All {LICENSES.reduce((n, l) => n + l.classifications.length, 0)} classifications <ExternalLink size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((c) => (
            <Link key={c.code} href={`/licenses#${c.lic.id}`} className="group border border-ro-gray-800 bg-ro-black/50 p-5 hover:border-ro-gold/40 transition-colors" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-mono text-2xl sm:text-3xl tracking-wide" style={{ color: accent }}>{c.code}</span>
                <span className="text-[11px] font-mono tracking-[0.15em] text-ro-gray-600 group-hover:text-ro-gray-400 transition-colors">{c.lic.number}</span>
              </div>
              <h3 className="text-ro-white font-heading text-lg uppercase tracking-tight leading-tight">{c.name}</h3>
              <p className="text-ro-gray-400 text-[15px] leading-relaxed mt-1.5">{c.covers}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
