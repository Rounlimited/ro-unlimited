import { NextRequest, NextResponse } from 'next/server';
import { requestLoginLink, loginWithPassword, sessionCookie } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

/**
 * Customer sign-in, on the site.
 *  { email, password }  → signs in right here (cookie), or a generic error.
 *  { email }            → emails a one-time link (first visit / forgot password).
 * Never confirms whether an address exists.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const next = typeof body.next === 'string' && body.next.startsWith('/') ? body.next : null;
    if (body.password) {
      const out = await loginWithPassword(String(body.email || ''), String(body.password), req.headers.get('user-agent'));
      if ('error' in out) return NextResponse.json({ error: out.error }, { status: 401 });
      const res = NextResponse.json({ ok: true, signed_in: true, next: next || '/my' });
      res.headers.append('Set-Cookie', sessionCookie(out.session));
      return res;
    }
    await requestLoginLink(String(body.email || ''), next);
    return NextResponse.json({ ok: true, link_sent: true });
  } catch (err) {
    console.error('[my/login]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
