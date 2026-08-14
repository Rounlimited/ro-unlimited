'use client';

/**
 * UtilityPlanBackdrop — the Utility Division's atmosphere layer: a civil
 * utility-plan sheet rendered at whisper opacity behind the whole section.
 *
 * Layer stack (per 2026 "blueprint grid" practice — Vercel/Linear idiom,
 * drafting conventions used correctly, ONE stroke weight everywhere):
 *   1. Blue-black base (#0A0D14) — the section reads as a different "sheet"
 *      than the rest of the site before the linework even registers.
 *   2. Engineer grid: 24px minor lines at white 3%, 96px major lines tinted
 *      division orange at 6%. 1px, always.
 *   3. One sparse SVG plan layer: two dashed pipe runs in APWA locate-paint
 *      colors (orange = comms, blue = potable water) with manhole nodes,
 *      station ticks and mono labels, one dimension callout, "+" crosshairs,
 *      and a title block. Edges faded with a mask so it breathes.
 *   4. Motion, all reduced-motion-gated: dashes march slowly along the runs
 *      (locate paint being laid down), the layer drifts over 120s, and one
 *      locate dot blinks on a 5s cycle. Nothing else moves.
 *
 * Fixed, pointer-events-none, behind everything — sections with transparent
 * backgrounds let the sheet show through; heroes with photos cover it.
 */

const ORANGE = '#F84B0C';
const BLUE = '#014BE6';

export default function UtilityPlanBackdrop() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
      style={{ contain: 'strict', background: '#0A0D14' }}
    >
      <style>{`
        @keyframes ud-dash-march { to { stroke-dashoffset: -120; } }
        @keyframes ud-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-60px,-40px,0); } }
        @keyframes ud-blink { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        .ud-run-o { animation: ud-dash-march 48s linear infinite; }
        .ud-run-b { animation: ud-dash-march 64s linear infinite; }
        .ud-sheet { animation: ud-drift 120s ease-in-out infinite alternate; }
        .ud-dot   { animation: ud-blink 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ud-run-o, .ud-run-b, .ud-sheet, .ud-dot { animation: none; }
        }
      `}</style>

      {/* 2. Engineer grid — minor 24px white, major 96px orange-tinted */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
            `linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            `linear-gradient(rgba(248,75,12,0.06) 1px, transparent 1px)`,
            `linear-gradient(90deg, rgba(248,75,12,0.06) 1px, transparent 1px)`,
          ].join(','),
          backgroundSize: '24px 24px, 24px 24px, 96px 96px, 96px 96px',
        }}
      />

      {/* 3. Plan linework — oversized so the drift never exposes an edge */}
      <div
        className="ud-sheet absolute"
        style={{
          inset: '-8%',
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 55%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 55%, transparent 100%)',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          {/* ── Orange run (comms) — long dashed polyline, manholes at bends ── */}
          <g stroke={ORANGE} strokeWidth="1" fill="none" opacity="0.11">
            <polyline className="ud-run-o" strokeDasharray="10 8" points="-40,240 520,240 640,340 1180,340 1320,260 1680,260" />
            {/* node circles at fittings (Kittl: anchor dots at endpoints) */}
            <circle cx="520" cy="240" r="7" />
            <circle cx="640" cy="340" r="7" />
            <circle cx="1180" cy="340" r="7" />
            {/* station ticks */}
            <line x1="300" y1="232" x2="300" y2="248" />
            <line x1="900" y1="332" x2="900" y2="348" />
          </g>
          <g fill={ORANGE} opacity="0.16" fontSize="11" letterSpacing="1.5">
            <text x="258" y="222">STA 10+50</text>
            <text x="858" y="322">STA 16+00</text>
            <text x="1210" y="326">4&quot; COMMS — DIRECTIONAL BORE</text>
          </g>

          {/* ── Blue run (potable water) — orthogonal with a valve tee ── */}
          <g stroke={BLUE} strokeWidth="1" fill="none" opacity="0.12">
            <polyline className="ud-run-b" strokeDasharray="14 10" points="-40,700 420,700 420,560 980,560 1120,640 1680,640" />
            <circle cx="420" cy="700" r="7" />
            <circle cx="420" cy="560" r="7" />
            <circle cx="980" cy="560" r="7" />
            {/* gate valve symbol (two triangles) at the tee */}
            <path d="M 700 552 l 14 8 l -14 8 z M 728 552 l -14 8 l 14 8 z" />
          </g>
          <g fill={BLUE} opacity="0.17" fontSize="11" letterSpacing="1.5">
            <text x="452" y="548">8&quot; DIP W</text>
            <text x="1150" y="628">12&quot; C900 W</text>
            <text x="310" y="688">MH-4</text>
          </g>

          {/* ── Dimension callout — tick terminators, one only ── */}
          <g stroke="rgba(255,255,255,0.10)" strokeWidth="1" fill="none">
            <line x1="640" y1="360" x2="640" y2="420" />
            <line x1="1180" y1="360" x2="1180" y2="420" />
            <line x1="640" y1="410" x2="1180" y2="410" />
            <line x1="634" y1="416" x2="646" y2="404" />
            <line x1="1174" y1="416" x2="1186" y2="404" />
          </g>
          <text x="880" y="402" fill="rgba(255,255,255,0.14)" fontSize="11" letterSpacing="1.5" textAnchor="middle">540&apos;-0&quot;</text>

          {/* ── Contour cluster — corner accent, ≤5% ── */}
          <g stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none">
            <path d="M 1280 880 q 120 -60 320 -40" />
            <path d="M 1300 930 q 130 -70 340 -46" />
            <path d="M 1330 980 q 140 -80 350 -52" />
          </g>

          {/* ── "+" crosshairs at a few major-grid intersections ── */}
          <g stroke="rgba(255,255,255,0.10)" strokeWidth="1">
            {[[192, 480], [768, 96], [1344, 768], [96, 864]].map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
                <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
              </g>
            ))}
          </g>

          {/* ── Blinking locate dot — the one live element ── */}
          <circle className="ud-dot" cx="980" cy="560" r="3.5" fill={ORANGE} opacity="0.5" />

          {/* ── Title block — bottom-right, drafting-table authentic ── */}
          <g transform="translate(1235, 40)">
            <rect x="0" y="0" width="330" height="86" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <line x1="0" y1="28" x2="330" y2="28" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <line x1="0" y1="56" x2="330" y2="56" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <line x1="200" y1="56" x2="200" y2="86" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <g fontSize="10.5" letterSpacing="2">
              <text x="12" y="19" fill="rgba(248,75,12,0.30)">RO UNLIMITED — UTILITY DIVISION</text>
              <text x="12" y="47" fill="rgba(255,255,255,0.16)">UTILITY PLAN — SELF-PERFORMED</text>
              <text x="12" y="75" fill="rgba(255,255,255,0.13)">SHEET C-401 · SCALE 1:200</text>
              <text x="212" y="75" fill="rgba(1,75,230,0.35)">REV C — 2026.08</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
