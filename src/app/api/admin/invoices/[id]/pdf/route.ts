import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const [{ data: invoice, error }, { data: payments }] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, customer:customers(first_name, last_name, company_name, email, phone, address, city, state, zip)')
        .eq('id', params.id)
        .single(),
      supabase.from('invoice_payments').select('*').eq('invoice_id', params.id).order('paid_date'),
    ]);
    if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const buf = await generateInvoicePDF(invoice, payments || []);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[invoice pdf] error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
