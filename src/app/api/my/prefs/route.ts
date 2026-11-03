import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession, getCustomerPrefs, setCustomerPrefs } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getCustomerSession();
  if (!s) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json({ email: s.email, prefs: await getCustomerPrefs(s.email) });
}

export async function POST(req: NextRequest) {
  const s = await getCustomerSession();
  if (!s) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  await setCustomerPrefs(s.email, { channel: body.channel, frequency: body.frequency });
  return NextResponse.json({ ok: true, prefs: await getCustomerPrefs(s.email) });
}
