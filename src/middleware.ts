import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

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

/* ─── Admin API gate ──────────────────────────────────────────
   Every /api/admin/* route runs with the service-role key, so the session
   check has to happen before the handler. Anything below is reachable only
   with a signed-in Supabase session (cookie from the dashboard / PWA /
   native webview, or `Authorization: Bearer <access_token>`).

   Exceptions — routes that are public BY DESIGN and gate themselves with a
   one-time token or a shared secret:                                       */
const ADMIN_API_PUBLIC: Array<{ path: RegExp; methods: string[] }> = [
  // Join flow: new account reads (GET) and redeems (PUT) an invite token.
  { path: /^\/api\/admin\/invite-token$/, methods: ['GET', 'PUT'] },
  // Magic access-link redemption — token in the query string.
  { path: /^\/api\/admin\/access-link$/, methods: ['GET'] },
  // Server-to-server push fan-out from cron/email/intake — x-push-secret.
  { path: /^\/api\/admin\/push-send$/, methods: ['POST'] },
];

function isPublicAdminApi(pathname: string, method: string): boolean {
  return ADMIN_API_PUBLIC.some((r) => r.path.test(pathname) && r.methods.includes(method.toUpperCase()));
}

async function hasAdminSession(req: NextRequest): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false; // fail CLOSED — this is auth

  // 1) Cookie session
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => { /* read-only here; the route handlers refresh cookies */ },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return true;
  } catch { /* fall through */ }

  // 2) Bearer token
  const authz = req.headers.get('authorization') || '';
  const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7).trim() : '';
  if (token) {
    try {
      const { data: { user } } = await createClient(url, anon).auth.getUser(token);
      if (user) return true;
    } catch { /* invalid token */ }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin API: require a signed-in session (see ADMIN_API_PUBLIC for the
  // handful of token-gated exceptions).
  if (pathname.startsWith('/api/admin')) {
    if (req.method === 'OPTIONS' || isPublicAdminApi(pathname, req.method)) return NextResponse.next();
    if (!(await hasAdminSession(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.next();
  }

  // Never gate the admin portal, API, the maintenance page, or Next internals.
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/maintenance') ||
    // Customer document links must survive maintenance mode — an invoice
    // shouldn't bounce because the marketing site is being worked on.
    pathname.startsWith('/i/') ||
    pathname.startsWith('/estimate/') ||
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
