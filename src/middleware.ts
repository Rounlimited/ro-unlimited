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
 * The flag lives in Supabase (`app_settings.maintenance_mode`) and is read via
 * the service-role key. It FAILS OPEN — if Supabase is unreachable we serve the
 * site rather than risk a false outage.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function isMaintenanceOn(): Promise<boolean> {
  // Env override — emergency operator kill-switch. Set MAINTENANCE_MODE=on/off
  // in Vercel to force a state regardless of the Supabase flag.
  const envFlag = (process.env.MAINTENANCE_MODE || '').toLowerCase();
  if (envFlag === 'on' || envFlag === 'true' || envFlag === '1') return true;
  if (envFlag === 'off' || envFlag === 'false' || envFlag === '0') return false;

  if (!SUPABASE_URL || !SERVICE_KEY) return false;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        // Short revalidate so flipping the switch takes effect within ~15s,
        // without querying Supabase on every single request.
        next: { revalidate: 15 },
      }
    );
    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{ value: unknown }>;
    return rows?.[0]?.value === true;
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
