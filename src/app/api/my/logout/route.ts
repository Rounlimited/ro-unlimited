import { NextResponse } from 'next/server';
import { endSession, getCustomerSession, sessionCookie } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const s = await getCustomerSession();
  if (s) await endSession(s.token);
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', sessionCookie(null));
  return res;
}
