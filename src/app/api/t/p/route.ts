import { NextRequest, NextResponse } from 'next/server';
import { recordEmailEvent, SITE_COOKIE } from '@/lib/email-tracking';

export const dynamic = 'force-dynamic';

/** Website page view by someone who arrived from a tracked email (cookie ro_em). */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SITE_COOKIE)?.value || '';
  if (!/^[a-f0-9]{24}$/.test(token)) return new NextResponse(null, { status: 204 });
  const b = await req.json().catch(() => ({}));
  const path = typeof b.path === 'string' ? b.path.slice(0, 300) : '/';
  if (path.startsWith('/admin')) return new NextResponse(null, { status: 204 });
  await recordEmailEvent(req, token, 'site', path);
  return new NextResponse(null, { status: 204 });
}
