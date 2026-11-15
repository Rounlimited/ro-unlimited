'use client';

/* NexaBooks entry for RO's admin: bookkeeping by NexaVision Group, connected to RO Unlimited.
   It is a Nexa module, so it wears Nexa's look (dark glass, blue/violet/cyan aurora, a rotating
   gradient edge, a light sweep) instead of RO gold, sized for JR: 18px+ title, 16px+ sub line,
   light text only, 64px+ tap target. Shown to RO's admin role only (see lib/nexabooks/access.ts).

   It is a plain <a>, not next/link: /admin/nexabooks is a server route that redirects to
   NexaBooks, so it needs a real page load. */

export const NEXABOOKS_HREF = '/admin/nexabooks';

type Props = {
  variant: 'drawer' | 'sidebar' | 'sidebar-collapsed';
  onOpen?: () => void;
};

export default function NexaBooksEntry({ variant, onOpen }: Props) {
  if (variant === 'sidebar-collapsed') {
    return (
      <a href={NEXABOOKS_HREF} onClick={onOpen} className="nbx nbx-mini" aria-label="Bookkeeping by NexaBooks, connected to RO Unlimited by Nexa" title="Bookkeeping (NexaBooks)">
        <span className="nbx-logo" aria-hidden="true">N</span>
        <style>{CSS}</style>
      </a>
    );
  }
  const compact = variant === 'sidebar';
  return (
    <a href={NEXABOOKS_HREF} onClick={onOpen} className={`nbx ${compact ? 'nbx-side' : 'nbx-drawer'}`}
      aria-label="Bookkeeping by NexaBooks, connected to RO Unlimited by Nexa. Premium module.">
      <span className="nbx-aurora" aria-hidden="true"><i /><i /><i /></span>
      <span className="nbx-shine" aria-hidden="true" />
      <span className="nbx-logo" aria-hidden="true">N</span>
      <span className="nbx-text">
        <span className="nbx-title">Bookkeeping</span>
        <span className="nbx-sub">
          Nexa<span className="nbx-grad">Books</span>
          {compact ? null : <> · connected to RO Unlimited by Nexa</>}
        </span>
      </span>
      {compact ? null : (
        <span className="nbx-premium" title="Premium Nexa module">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 15 9l7 .6-5.3 4.6L18.2 21 12 17.3 5.8 21l1.5-6.8L2 9.6 9 9z" /></svg>
          Premium
        </span>
      )}
      <span className="nbx-go" aria-hidden="true">&rarr;</span>
      <style>{CSS}</style>
    </a>
  );
}

const CSS = `
.nbx { position: relative; overflow: hidden; isolation: isolate; display: flex; align-items: center; gap: 14px;
  text-decoration: none; color: #eef3ff; border-radius: 16px;
  background: linear-gradient(135deg, #070b16 0%, #0b1022 55%, #071319 100%);
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.20), 0 2px 10px rgba(0, 0, 0, .5);
  transition: transform 220ms cubic-bezier(.2, .7, .2, 1), box-shadow 220ms ease;
  -webkit-tap-highlight-color: transparent; }
.nbx::before { content: ''; position: absolute; inset: 0; z-index: 2; border-radius: inherit; padding: 1.5px; pointer-events: none;
  background: conic-gradient(from var(--nbx-a, 0deg), #7dd3fc, #a78bfa, #22d3ee, #2563eb, #7dd3fc);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
  animation: nbx-spin 6s linear infinite; }
.nbx:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(124, 58, 237, 0.34), 0 2px 10px rgba(0, 0, 0, .5); }
.nbx:active { transform: scale(.985); }
.nbx:focus-visible { outline: 3px solid #7dd3fc; outline-offset: 3px; }
.nbx-drawer { width: 100%; min-height: 84px; padding: 14px 16px; margin-bottom: 20px; }
.nbx-side { margin: 6px 8px 10px; min-height: 64px; padding: 10px 12px; gap: 11px; border-radius: 14px; }
.nbx-mini { margin: 6px auto 10px; width: 48px; height: 48px; justify-content: center; border-radius: 14px; }
.nbx-mini .nbx-logo { width: 36px; height: 36px; font-size: 18px; border-radius: 10px; }
.nbx-aurora { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.nbx-aurora i { position: absolute; border-radius: 50%; filter: blur(28px); opacity: .55; animation: nbx-drift 9s ease-in-out infinite; }
.nbx-aurora i:nth-child(1) { width: 140px; height: 140px; left: -30px; top: -60px; background: #2563eb; }
.nbx-aurora i:nth-child(2) { width: 160px; height: 160px; right: 12%; top: -80px; background: #7c3aed; animation-delay: -3s; }
.nbx-aurora i:nth-child(3) { width: 150px; height: 150px; right: -40px; bottom: -90px; background: #06b6d4; animation-delay: -6s; }
.nbx-shine { position: absolute; top: 0; bottom: 0; left: -60%; width: 45%; z-index: 1; pointer-events: none;
  background: linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, .22) 50%, rgba(255, 255, 255, 0) 70%, transparent 100%);
  transform: skewX(-18deg); animation: nbx-sweep 4.6s ease-in-out infinite; }
.nbx-logo { position: relative; z-index: 1; flex: none; width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center;
  font: 800 22px/1 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #04121f;
  background: linear-gradient(120deg, #7dd3fc, #a78bfa 55%, #22d3ee); box-shadow: 0 0 22px rgba(125, 211, 252, .5); }
.nbx-side .nbx-logo { width: 40px; height: 40px; font-size: 19px; border-radius: 11px; }
.nbx-text { position: relative; z-index: 1; min-width: 0; flex: 1 1 auto; display: grid; gap: 3px; }
.nbx-title { font: 800 19px/1.15 system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: -.005em; color: #ffffff; }
.nbx-side .nbx-title { font-size: 17px; }
.nbx-sub { font: 600 16px/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #d6e0f2; }
.nbx-side .nbx-sub { font-size: 15px; }
.nbx-grad { background: linear-gradient(120deg, #7dd3fc, #c4b5fd 55%, #67e8f9); -webkit-background-clip: text; background-clip: text; color: transparent; }
.nbx-premium { position: relative; z-index: 1; flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 999px;
  font: 800 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #fff;
  background: linear-gradient(120deg, rgba(125, 211, 252, .25), rgba(167, 139, 250, .38) 55%, rgba(34, 211, 238, .25));
  border: 1px solid rgba(167, 139, 250, .7); animation: nbx-glow 2.8s ease-in-out infinite; }
.nbx-premium svg { color: #fde68a; filter: drop-shadow(0 0 4px rgba(253, 230, 138, .8)); }
.nbx-go { position: relative; z-index: 1; flex: none; font-size: 22px; color: #7dd3fc; transition: transform 200ms; }
.nbx:hover .nbx-go { transform: translateX(4px); }
@property --nbx-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes nbx-spin { to { --nbx-a: 360deg; } }
@keyframes nbx-sweep { 0% { left: -60%; } 55%, 100% { left: 130%; } }
@keyframes nbx-drift { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(18px, 8px) scale(1.12); } }
@keyframes nbx-glow { 0%, 100% { box-shadow: 0 0 12px rgba(167, 139, 250, .35), inset 0 1px 0 rgba(255, 255, 255, .25); } 50% { box-shadow: 0 0 22px rgba(125, 211, 252, .6), inset 0 1px 0 rgba(255, 255, 255, .25); } }
@media (max-width: 440px) { .nbx-drawer { gap: 12px; padding: 12px 13px; } .nbx-drawer .nbx-go { display: none; } .nbx-premium { padding: 6px 9px; font-size: 12px; } }
@media (max-width: 360px) { .nbx-drawer .nbx-premium { display: none; } }
@media (prefers-reduced-motion: reduce) { .nbx::before, .nbx-aurora i, .nbx-premium { animation: none; } .nbx-shine { display: none; } }
`;
