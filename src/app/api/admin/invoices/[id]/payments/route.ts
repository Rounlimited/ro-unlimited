import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { reconcilePayments } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

// POST — record a payment on the ledger. amount_paid + status recompute from
// the ledger sum; a payment covering the balance flips the invoice to paid.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    const { data: inv } = await supabase
      .from('invoices').select('id, status, total, amount_paid').eq('id', params.id).single();
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (inv.status === 'cancelled') {
      return NextResponse.json({ error: 'Invoice is cancelled — reactivate it before recording payments' }, { status: 409 });
    }

    const { data: payment, error } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: params.id,
        amount,
        method: body.method || 'check',
        reference: body.reference || null,
        paid_date: body.paid_date || new Date().toISOString().slice(0, 10),
        notes: body.notes || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const invoice = await reconcilePayments(supabase, params.id);
    return NextResponse.json({ payment, invoice });
  } catch (err) {
    console.error('[invoice payments] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE ?payment_id=… — remove a mis-entered payment; ledger reconciles.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const paymentId = new URL(req.url).searchParams.get('payment_id');
    if (!paymentId) return NextResponse.json({ error: 'payment_id query param required' }, { status: 400 });

    const { error } = await supabase
      .from('invoice_payments').delete().eq('id', paymentId).eq('invoice_id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const invoice = await reconcilePayments(supabase, params.id);
    return NextResponse.json({ deleted: true, invoice });
  } catch (err) {
    console.error('[invoice payments] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
