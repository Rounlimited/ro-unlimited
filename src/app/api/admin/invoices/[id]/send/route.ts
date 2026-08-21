import { NextRequest, NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/invoice-send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST — email the invoice. Thin wrapper over lib/invoice-send, which the
// AI's send_invoice tool also calls — one code path for both.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.to_email) return NextResponse.json({ error: 'to_email is required' }, { status: 400 });
    const result = await sendInvoiceEmail(params.id, body);
    if ('error' in result) {
      const status = result.error === 'Invoice not found' ? 404 : result.error === 'Invoice is cancelled' ? 409 : 500;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[invoice send] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
