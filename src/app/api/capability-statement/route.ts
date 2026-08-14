import { NextResponse } from 'next/server';
import { renderCapabilityPdf } from '@/lib/capability-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Public capability statement PDF — the prequal one-pager GCs attach to
 * vendor packets. Rendered on demand (it stamps the current month), cached
 * at the CDN for a day.
 */
export async function GET() {
  try {
    const buf = await renderCapabilityPdf();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="RO-Unlimited-Capability-Statement.pdf"',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('[capability-statement] render failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
