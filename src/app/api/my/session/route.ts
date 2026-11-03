import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

/** Cheap "am I signed in?" for the portal bar on project pages. */
export async function GET() {
  const s = await getCustomerSession();
  return NextResponse.json(s ? { signed_in: true, email: s.email } : { signed_in: false }, { headers: { 'Cache-Control': 'no-store' } });
}
