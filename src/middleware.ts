import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Maintenance-mode gate.
 *
 * When `siteSettings.maintenanceMode` is true in Sanity, all PUBLIC routes are
 * rewritten to /maintenance (HTTP 503). The admin portal (/admin), API routes
 * (/api) and the maintenance page itself stay fully reachable so the site can
 * always be brought back online from the admin panel.
 *
 * The flag is read from the Sanity CDN (fast, globally cached) and FAILS OPEN —
 * if Sanity is unreachable we serve the site rather than risk a false outage.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3at2yyx0';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

const QUERY = '*[_id == "siteSettings"][0]{maintenanceMode}';
const SANITY_URL =
  `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}` +
  `?query=${encodeURIComponent(QUERY)}`;

async function isMaintenanceOn(): Promise<boolean> {
  // Env override — the operator kill-switch. Set MAINTENANCE_MODE=on in Vercel
  // to force the site offline regardless of the Sanity flag (e.g. when the
  // Sanity write token isn't available to drive the in-panel toggle).
  const envFlag = (process.env.MAINTENANCE_MODE || '').toLowerCase();
  if (envFlag === 'on' || envFlag === 'true' || envFlag === '1') return true;
  if (envFlag === 'off' || envFlag === 'false' || envFlag === '0') return false;

  try {
    const res = await fetch(SANITY_URL, {
      // Short revalidate so flipping the switch takes effect within ~20s,
      // without hitting Sanity on every single request.
      next: { revalidate: 20 },
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json?.result?.maintenanceMode === true;
  } catch {
    return false; // fail open
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never gate the admin portal, API, the maintenance page, or Next internals.
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  if (await isMaintenanceOn()) {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.rewrite(url, {
      status: 503,
      headers: {
        'Retry-After': '3600',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next static assets and files with an extension
  // (images, robots.txt, sitemap.xml, manifest.json, icons, etc.).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
