// Opens NexaBooks (bookkeeping run by NexaVision Group, connected to RO Unlimited) for the
// signed-in person. Runs on the server: checks RO's own login and role, then hands over with a
// one-time link that expires after 60 seconds, built here at click time (never cached or put in
// page HTML). Linked from the drawer and side bar with a full page load, not router.push.
//   not signed in        -> /admin/login
//   signed in, not admin -> /admin
//   admin                -> NexaBooks as `owner`
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, roleOf } from '@/lib/supabase/server';
import { nexaBooksRoleFor } from '@/lib/nexabooks/access';
import { nexaBooksConfig, nexaBooksLaunchUrl } from '@/lib/nexabooks/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function go(req: NextRequest, to: string) {
  const res = NextResponse.redirect(new URL(to, req.url), 303);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return go(req, '/admin/login');

  const role = nexaBooksRoleFor(roleOf(user));
  const config = nexaBooksConfig();
  if (!role || !config) return go(req, '/admin');

  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || [meta.first_name, meta.last_name].filter(Boolean).join(' ') || null;
  return go(req, nexaBooksLaunchUrl(config, { id: user.id, email: user.email, name, role }));
}
