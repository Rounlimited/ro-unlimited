import { NextRequest, NextResponse } from 'next/server';
import { activateInvoiceLink } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

// POST — turn the share link on without email (the copy-and-text path).
// Flips draft → sent: handing out the link IS sending the invoice.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await activateInvoiceLink(params.id);
    if ('error' in result) {
      return NextResponse.json(result, { status: result.error === 'Invoice not found' ? 404 : 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[invoice activate-link] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
