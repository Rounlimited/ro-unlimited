'use client';

/**
 * SitePlanBackdrop — the homepage's atmosphere layer: a structural plan sheet
 * in brand gold, the architectural sibling of the Utility Division's
 * UtilityPlanBackdrop (same drafting-conventions-done-right recipe, different
 * discipline: column grid bubbles, beam lines, an elevation marker, a north
 * arrow, and a title block instead of pipe runs).
 *
 * Absolute (not fixed) — it drops inside opaque sticky sections
 * (DivisionCards, WhyRO, ConstructionCTA) as their background layer,
 * replacing the old tiled BlueprintGrid pulse.
 *
 * One 1px stroke weight everywhere; gold linework 8–12%, grid ≤5%;
 * motion is a 140s drift plus one blinking axis bubble, reduced-motion gated.
 */

const GOLD = '#C9A84C';

export default function SitePlanBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes sp-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-48px,-28px,0); } }
        @keyframes sp-blink { 0%, 100% { opacity: 0.30; } 50% { opacity: 0.85; } }
        .sp-sheet { animation: sp-drift 140s ease-in-out infinite alternate; }
        .sp-dot   { animation: sp-blink 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .sp-sheet, .sp-dot { animation: none; } }
      `}</style>

      {/* Engineer grid — minor 24px white, major 96px gold-tinted */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)`,
            `linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
            `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px)`,
            `linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
          ].join(','),
          backgroundSize: '24px 24px, 24px 24px, 96px 96px, 96px 96px',
        }}
      />

      {/* Structural plan linework */}
      <div
        className="sp-sheet absolute"
        style={{
          inset: '-6%',
          maskImage: 'radial-gradient(ellipse 92% 88% at 50% 46%, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 92% 88% at 50% 46%, black 50%, transparent 100%)',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          {/* ── Column grid axes — bubbles top and left, drafting standard ── */}
          <g stroke={GOLD} strokeWidth="1" opacity="0.10" fill="none">
            {/* vertical axis lines A–D */}
            {[360, 680, 1000, 1320].map((x) => (
              <line key={x} x1={x} y1={60} x2={x} y2={960} strokeDasharray="2 10" />
            ))}
            {/* horizontal axis lines 1–3 */}
            {[280, 560, 840].map((y) => (
              <line key={y} x1={60} y1={y} x2={1560} y2={y} strokeDasharray="2 10" />
            ))}
            {/* axis bubbles */}
            {[360, 680, 1000, 1320].map((x) => <circle key={`b${x}`} cx={x} cy={60} r={16} />)}
            {[280, 560, 840].map((y) => <circle key={`b${y}`} cx={60} cy={y} r={16} />)}
          </g>
          <g fill={GOLD} opacity="0.16" fontSize="13" textAnchor="middle" letterSpacing="1">
            {['A', 'B', 'C', 'D'].map((l, i) => <text key={l} x={360 + i * 320} y={65}>{l}</text>)}
            {['1', '2', '3'].map((l, i) => <text key={l} x={60} y={285 + i * 280}>{l}</text>)}
          </g>

          {/* ── Beams between a few column intersections (double lines) ── */}
          <g stroke={GOLD} strokeWidth="1" opacity="0.09" fill="none">
            <line x1={360} y1={276} x2={1000} y2={276} />
            <line x1={360} y1={284} x2={1000} y2={284} />
            <line x1={676} y1={280} x2={676} y2={560} />
            <line x1={684} y1={280} x2={684} y2={560} />
            {/* column marks at intersections — filled squares reading as steel */}
            {[[360, 280], [680, 280], [1000, 280], [680, 560], [1320, 560]].map(([x, y]) => (
              <rect key={`${x}${y}`} x={x - 6} y={y - 6} width={12} height={12} fill={GOLD} fillOpacity="0.10" stroke="none" />
            ))}
          </g>

          {/* ── Dimension string along axis 1 — tick terminators ── */}
          <g stroke="rgba(255,255,255,0.09)" strokeWidth="1" fill="none">
            <line x1={360} y1={130} x2={1320} y2={130} />
            {[360, 680, 1000, 1320].map((x) => (
              <g key={`d${x}`}>
                <line x1={x} y1={118} x2={x} y2={142} />
                <line x1={x - 6} y1={136} x2={x + 6} y2={124} />
              </g>
            ))}
          </g>
          <g fill="rgba(255,255,255,0.12)" fontSize="11" textAnchor="middle" letterSpacing="1.5">
            <text x={520} y={122}>32&apos;-0&quot;</text>
            <text x={840} y={122}>32&apos;-0&quot;</text>
            <text x={1160} y={122}>32&apos;-0&quot;</text>
          </g>

          {/* ── Elevation marker + north arrow, corner details ── */}
          <g stroke="rgba(255,255,255,0.10)" strokeWidth="1" fill="none">
            <circle cx={170} cy={880} r={18} />
            <line x1={152} y1={880} x2={188} y2={880} />
            <path d="M 162 872 l 8 -10 l 8 10 z" />
          </g>
          <text x={200} y={885} fill="rgba(255,255,255,0.12)" fontSize="11" letterSpacing="1.5">FFE 100&apos;-0&quot;</text>
          <g transform="translate(1480, 880)" stroke={GOLD} strokeWidth="1" opacity="0.14" fill="none">
            <circle r={20} />
            <path d="M 0 12 L 0 -12 M 0 -12 l -6 8 M 0 -12 l 6 8" />
          </g>
          <text x={1480} y={922} fill={GOLD} opacity="0.15" fontSize="10" textAnchor="middle" letterSpacing="2">N</text>

          {/* ── Blinking column dot — the one live element ── */}
          <circle className="sp-dot" cx={680} cy={280} r={3.5} fill={GOLD} opacity="0.4" />

          {/* ── Title block — bottom-left so it clears section CTAs ── */}
          <g transform="translate(60, 40)">
            <rect x="0" y="0" width="330" height="86" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="28" x2="330" y2="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="56" x2="330" y2="56" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="200" y1="56" x2="200" y2="86" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <g fontSize="10.5" letterSpacing="2">
              <text x="12" y="19" fill="rgba(201,168,76,0.28)">RO UNLIMITED — CONSTRUCTION &amp; DEVELOPMENT</text>
              <text x="12" y="47" fill="rgba(255,255,255,0.15)">STRUCTURAL PLAN — SELF-PERFORMED</text>
              <text x="12" y="75" fill="rgba(255,255,255,0.12)">SHEET S-201 · SCALE 1:100</text>
              <text x="212" y="75" fill="rgba(201,168,76,0.24)">REV B — 2026.08</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
