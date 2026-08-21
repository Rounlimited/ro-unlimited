import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calcTotals, effectiveStatus, normalizeLineItems } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

// GET — one invoice with its payments ledger, customer, and estimate reference.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const [{ data: invoice, error }, { data: payments }, { data: views }] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, customer:customers(id, first_name, last_name, company_name, email, phone, address, city, state, zip), estimate:estimates(id, estimate_number, project_name, total)')
        .eq('id', params.id)
        .single(),
      supabase.from('invoice_payments').select('*').eq('invoice_id', params.id).order('paid_date', { ascending: false }),
      supabase.from('invoice_views').select('viewed_at').eq('invoice_id', params.id).order('viewed_at', { ascending: false }).limit(1),
    ]);
    const { data: comments } = await supabase
      .from('invoice_comments').select('*').eq('invoice_id', params.id).order('created_at');
    if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const { count } = await supabase
      .from('invoice_views')
      .select('*', { count: 'exact', head: true })
      .eq('invoice_id', params.id);

    return NextResponse.json({
      ...invoice,
      effective_status: effectiveStatus(invoice),
      payments: payments || [],
      comments: comments || [],
      view_count: count || 0,
      last_viewed_at: views?.[0]?.viewed_at || null,
    });
  } catch (err) {
    console.error('[invoice] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update fields; recalculates totals when line items or tax change.
// amount_paid and paid status are ledger-owned and rejected here.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();

    delete body.amount_paid; // ledger-owned
    delete body.invoice_number; // immutable
    delete body.id;

    if (body.line_items) body.line_items = normalizeLineItems(body.line_items);

    if (body.line_items || body.tax_percent != null) {
      const { data: current } = await supabase
        .from('invoices').select('line_items, tax_percent').eq('id', params.id).single();
      if (!current) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      const items = body.line_items ?? current.line_items;
      const tax = body.tax_percent ?? current.tax_percent;
      Object.assign(body, calcTotals(items, Number(tax)));
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*, customer:customers(id, first_name, last_name, company_name, email, phone)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, effective_status: effectiveStatus(data) });
  } catch (err) {
    console.error('[invoice] PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — drafts only. Anything sent gets cancelled (status change), never
// deleted: sent invoices are business records with a number the customer saw.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: inv } = await supabase
      .from('invoices').select('id, status, sent_at, amount_paid').eq('id', params.id).single();
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    if (inv.status !== 'draft' || inv.sent_at || Number(inv.amount_paid) > 0) {
      return NextResponse.json(
        { error: 'Only unsent drafts can be deleted — cancel this invoice instead (PATCH status: cancelled)' },
        { status: 409 }
      );
    }

    // Free any milestone that pointed at this draft
    await supabase.from('estimate_payment_schedules').update({ invoice_id: null }).eq('invoice_id', params.id);
    const { error } = await supabase.from('invoices').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[invoice] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
