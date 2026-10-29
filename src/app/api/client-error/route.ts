import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Browser-side crash reports from the error boundaries. Writes one line to
 * the Vercel function log (search "[client-error]") — no database, no PII
 * beyond the user agent and URL, tiny payloads only.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = (await req.text()).slice(0, 4000);
    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = { message: raw }; }
    console.error('[client-error]', JSON.stringify({
      kind: body.kind, message: body.message, digest: body.digest, url: body.url, ua: body.ua, at: body.at,
      stack: String(body.stack || '').split('\n').slice(0, 6).join(' | '),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    }));
  } catch { /* never fail the caller */ }
  return new NextResponse(null, { status: 204 });
}
