import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Browser-side crash reports (from the <head> early hook and the error
 * boundaries). Logged to the Vercel function log AND stored in
 * public.client_errors, because the log stream is only readable live and a
 * one-off crash on someone else's machine needs to be there whenever we look.
 * Tiny payloads, capped, no PII beyond UA/URL/IP.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = (await req.text()).slice(0, 6000);
    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = { message: raw }; }
    const row = {
      kind: String(body.kind || '').slice(0, 40),
      message: String(body.message || '').slice(0, 1000),
      stack: String(body.stack || '').slice(0, 3000),
      src: String(body.src || '').slice(0, 300),
      line: Number(body.line) || null,
      col: Number(body.col) || null,
      url: String(body.url || '').slice(0, 500),
      ua: String(body.ua || req.headers.get('user-agent') || '').slice(0, 400),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      at: String(body.at || '').slice(0, 40),
    };
    console.error('[client-error]', JSON.stringify(row));
    try { await createAdminClient().from('client_errors').insert(row); } catch { /* log line still exists */ }
  } catch { /* never fail the caller */ }
  return new NextResponse(null, { status: 204 });
}
