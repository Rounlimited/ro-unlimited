// NexaBooks sales adapter for RO Unlimited. Read-only. No session needed (NexaBooks is a server,
// not a signed-in person): every request must carry a valid NexaBooks signature made with this
// business's connector secret, checked by src/lib/nexabooks/verify.ts. Lives outside /api/admin
// on purpose so the admin session gate in src/middleware.ts never touches it.
//   GET /api/nexabooks/sales?from=YYYY-MM-DD&to=YYYY-MM-DD     invoice payments by day and method (max 93 days)
//   GET /api/nexabooks/payouts?from=YYYY-MM-DD&to=YYYY-MM-DD   always empty, no card processor (max 35 days)
//   GET /api/nexabooks/jobs                                     open, bidding and recently finished jobs
// Mapping choices are documented in src/lib/nexabooks/sales.ts.
import { NextRequest, NextResponse } from 'next/server';
import { buildJobs, buildPayouts, buildSales } from '@/lib/nexabooks/sales';
import {
  adapterSigningString, verifyNexaBooksRequest,
  type JobsResponse, type PayoutsResponse, type SalesResponse,
} from '@/lib/nexabooks/verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS: Record<string, number> = { sales: 93, payouts: 35 };
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest, { params }: { params: { adapter: string } }) {
  const adapter = params.adapter;
  if (!(adapter in MAX_DAYS) && adapter !== 'jobs') {
    return NextResponse.json({ error: 'unknown adapter' }, { status: 404, headers: NO_STORE });
  }
  const query = req.nextUrl.searchParams;
  if (!verifyNexaBooksRequest(req.headers, adapterSigningString(adapter, query), process.env.NEXABOOKS_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }

  try {
    if (adapter === 'jobs') {
      const body: JobsResponse = { version: 1, currency: 'USD', jobs: await buildJobs() };
      return NextResponse.json(body, { headers: NO_STORE });
    }

    const from = query.get('from') ?? '', to = query.get('to') ?? '';
    if (!DAY.test(from) || !DAY.test(to) || from > to) {
      return NextResponse.json({ error: 'from and to must be YYYY-MM-DD' }, { status: 400, headers: NO_STORE });
    }
    const span = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
    if (span > MAX_DAYS[adapter]) {
      return NextResponse.json({ error: `ask for at most ${MAX_DAYS[adapter]} days at a time` }, { status: 400, headers: NO_STORE });
    }

    if (adapter === 'sales') {
      const body: SalesResponse = { version: 1, currency: 'USD', timezone: 'America/New_York', from, to, days: await buildSales(from, to) };
      return NextResponse.json(body, { headers: NO_STORE });
    }
    const body: PayoutsResponse = { version: 1, currency: 'USD', from, to, payouts: await buildPayouts(from, to) };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (e) {
    console.error('[nexabooks adapter]', adapter, e);
    return NextResponse.json({ error: 'adapter failed' }, { status: 502, headers: NO_STORE });
  }
}
