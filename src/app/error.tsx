'use client';

import { useEffect } from 'react';
import { COMPANY } from '@/lib/constants';

/**
 * Public-site error boundary. Two jobs:
 *  1. A tab left open across a deploy asks for JS chunks that no longer exist
 *     (ChunkLoadError / "Loading chunk … failed" / "Importing a module script
 *     failed" in Safari). That is cured by ONE reload — do it automatically.
 *  2. Anything else: say so in RO's voice with a working Reload button, and
 *     POST the real error to /api/client-error so it shows in Vercel logs,
 *     because "Application error: a client-side exception has occurred"
 *     tells nobody anything.
 */
const STALE_CHUNK = /ChunkLoadError|Loading chunk|Loading CSS chunk|Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;

function report(error: Error & { digest?: string }, kind: string) {
  try {
    const body = JSON.stringify({
      kind, message: String(error?.message || error).slice(0, 500), stack: String(error?.stack || '').slice(0, 2000),
      digest: error?.digest, url: location.href, ua: navigator.userAgent, at: new Date().toISOString(),
    });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }));
    else fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* never let reporting throw */ }
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const stale = STALE_CHUNK.test(String(error?.message || '') + String(error?.stack || ''));
    report(error, stale ? 'stale-chunk' : 'client-exception');
    if (stale) {
      // Reload once per URL; a second failure falls through to the message.
      const key = 'ro-chunk-reload:' + location.pathname;
      try {
        if (sessionStorage.getItem(key) !== '1') {
          sessionStorage.setItem(key, '1');
          location.reload();
        }
      } catch { location.reload(); }
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-ro-black text-ro-white px-6">
      <div className="max-w-md text-center">
        <p className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase mb-4">One Sec</p>
        <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-tight leading-[0.95]">
          This page needs a <span className="gradient-text-gold">reload</span>
        </h1>
        <p className="text-ro-gray-300 text-base leading-relaxed mt-5">
          The site was updated while this page was open. A reload picks up the new version.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button onClick={() => location.reload()} className="min-h-[52px] px-6 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-colors">
            Reload Page
          </button>
          <button onClick={() => reset()} className="min-h-[52px] px-6 border border-ro-gold/40 text-ro-gold font-heading text-sm tracking-wider uppercase hover:bg-ro-gold/10 transition-colors">
            Try Again
          </button>
        </div>
        <p className="text-ro-gray-500 text-sm mt-8">
          Still stuck? Call <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="text-ro-gold">{COMPANY.phone}</a>.
        </p>
      </div>
    </div>
  );
}
