import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession, setPassword } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

/** Signed-in customer sets (or changes) their password. Lost it? The email link signs them back in and they set a new one. */
export async function POST(req: NextRequest) {
  const s = await getCustomerSession();
  if (!s) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const out = await setPassword(s.email, String(body.password || ''));
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
