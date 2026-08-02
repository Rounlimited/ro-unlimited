import { NextResponse } from 'next/server';
import { getServerUser, roleOf } from '@/lib/supabase/server';

// Email access control.
// The RO mailboxes (jr@, build@, info@) are business-private.
// Default policy: only owner (admin) and NexaVision dev (super_admin)
// may read or send. Employees/invited users get 403 until a per-account
// grant system exists.
const AUTHORIZED_ROLES = ['super_admin', 'admin'];

export async function requireEmailAccess(): Promise<
  { ok: true; user: any } | { ok: false; res: NextResponse }
> {
  const user = await getServerUser();
  if (!user || !AUTHORIZED_ROLES.includes(roleOf(user))) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: 'Not authorized for email access' },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user };
}
