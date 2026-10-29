'use client';

import { useEffect } from 'react';

/** Root-layout crash fallback (the layout itself failed, so no site chrome). */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    try {
      const body = JSON.stringify({ kind: 'global', message: String(error?.message || error).slice(0, 500), stack: String(error?.stack || '').slice(0, 2000), digest: error?.digest, url: location.href, ua: navigator.userAgent, at: new Date().toISOString() });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }));
    } catch { /* ignore */ }
  }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420 }}>
          <p style={{ color: '#C9A84C', letterSpacing: '0.4em', fontSize: 12, textTransform: 'uppercase' }}>RO Unlimited</p>
          <h1 style={{ fontSize: 28, textTransform: 'uppercase', margin: '12px 0' }}>This page needs a reload</h1>
          <p style={{ color: '#bbb', lineHeight: 1.6 }}>The site was updated while this page was open.</p>
          <button onClick={() => location.reload()} style={{ marginTop: 24, minHeight: 52, padding: '0 28px', background: '#C9A84C', color: '#000', border: 0, fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Reload Page</button>
          <p style={{ color: '#888', fontSize: 14, marginTop: 28 }}>Still stuck? Call (864) 304-0139.</p>
        </div>
      </body>
    </html>
  );
}
