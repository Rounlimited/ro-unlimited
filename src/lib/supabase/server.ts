import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side admin client — uses service role key
// NEVER expose this on the client side
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url: string | URL | Request, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  );
}

/** Role for a Supabase user. Legacy users with no role metadata are treated as
 * 'admin' (mirrors the admin UI). Employees are explicitly 'employee'. */
export function roleOf(user: any): string {
  return user?.user_metadata?.role || user?.app_metadata?.role || 'admin';
}

/**
 * Resolve the signed-in admin user for an API route.
 * 1) Cookie session — the installed PWA / browser sends its Supabase auth
 *    cookies on same-origin fetches, so this is the normal dashboard path.
 * 2) Bearer token — `Authorization: Bearer <access_token>` fallback.
 * Returns the Supabase user, or null if not authenticated.
 */
export async function getServerUser(req?: Request): Promise<any | null> {
  // 1) Cookie session (dashboard / PWA)
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            try {
              toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {
              // read-only context (e.g. token refresh during a GET) — ignore
            }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    // fall through to bearer
  }

  // 2) Bearer token fallback
  const authz = req?.headers.get('authorization') || '';
  const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7).trim() : '';
  if (token) {
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await sb.auth.getUser(token);
      if (user) return user;
    } catch {
      // invalid token
    }
  }

  return null;
}
