import { NextRequest, NextResponse } from 'next/server';
import { requestLoginLink } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

/** Customer asks for a sign-in link. Same answer whether or not we know the address. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    await requestLoginLink(String(body.email || ''), typeof body.next === 'string' && body.next.startsWith('/') ? body.next : null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[my/login]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
