import { NextRequest, NextResponse } from 'next/server';
import { recordEmailEvent, validSig, SITE_COOKIE } from '@/lib/email-tracking';

export const dynamic = 'force-dynamic';

/**
 * Email link redirect: /api/t/c/<token>?u=<base64url destination>&s=<signature>
 * Logs the click, then sends the reader on with a plain 302. The signature
 * means nobody can use this address to bounce people to some other site.
 * Going to our own website also drops a small cookie, so the pages they look
 * at next are credited to this email.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token || '');
  const u = req.nextUrl.searchParams.get('u') || '';
  const s = req.nextUrl.searchParams.get('s') || '';
  let dest = '';
  try { dest = Buffer.from(u, 'base64url').toString('utf8'); } catch { /* bad link */ }
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
  if (!/^https?:\/\//i.test(dest) || !validSig(token, dest, s)) return NextResponse.redirect(site, 302);

  await recordEmailEvent(req, token, 'click', dest);
  const res = NextResponse.redirect(dest, 302);
  res.headers.set('Cache-Control', 'no-store');
  if (/^https?:\/\/(www\.)?rounlimited\.com(\/|$)/i.test(dest)) {
    res.cookies.set(SITE_COOKIE, token, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: true, httpOnly: false });
  }
  return res;
}
