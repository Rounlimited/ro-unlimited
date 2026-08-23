import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { recordDocumentEvent, visitorFromCookies } from '@/lib/doc-events';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Customer-facing PDF download, gated identically to the JSON route. */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(first_name, last_name, company_name, email, phone, address, city, state, zip)')
      .eq('share_token', params.token)
      .single();

    if (error || !invoice || invoice.status === 'draft') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (!invoice.link_enabled) return NextResponse.json({ error: 'Link disabled' }, { status: 410 });
    if (invoice.share_token_expires_at && new Date(invoice.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    const { data: payments } = await supabase
      .from('invoice_payments').select('*').eq('invoice_id', invoice.id).order('paid_date');

    const buf = await generateInvoicePDF(invoice, payments || []);
    // The invoice page's PDF link is a download ("Download PDF") — count it.
    const visitor = visitorFromCookies();
    await recordDocumentEvent({ req, docType: 'invoice', doc: invoice, event: 'pdf_download', visitorId: visitor.isNew ? null : visitor.id });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[public invoice pdf] error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
