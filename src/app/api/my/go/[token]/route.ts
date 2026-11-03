import { NextRequest, NextResponse } from 'next/server';
import { redeemLogin, sessionCookie } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
type Ctx = { params: { token: string } };

/** The link in the sign-in email. One use, then a 90-day cookie and straight to their projects. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
  const out = await redeemLogin(params.token, req.headers.get('user-agent'));
  if (!out) return NextResponse.redirect(`${site}/my?expired=1`, 302);
  const next = req.nextUrl.searchParams.get('next');
  const res = NextResponse.redirect(`${site}${next && next.startsWith('/') ? next : '/my'}`, 302);
  res.headers.append('Set-Cookie', sessionCookie(out.session));
  return res;
}
