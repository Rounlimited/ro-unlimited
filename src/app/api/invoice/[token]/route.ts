import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { effectiveStatus } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

/**
 * Public invoice view — whitelisted fields only, gated by the link switch
 * and expiry. Paid invoices stay viewable (the link doubles as a receipt).
 * Every hit is logged to invoice_views for the admin "viewed 4×" signal.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: inv, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();

    if (error || !inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!inv.link_enabled) return NextResponse.json({ error: 'This invoice link has been turned off' }, { status: 410 });
    if (inv.share_token_expires_at && new Date(inv.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invoice link has expired' }, { status: 410 });
    }
    if (inv.status === 'draft') return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // View tracking — hashed IP, never the raw address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await supabase.from('invoice_views').insert({
      invoice_id: inv.id,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 250),
      ip_hash: crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24),
    });

    const { data: payments } = await supabase
      .from('invoice_payments')
      .select('amount, method, paid_date')
      .eq('invoice_id', inv.id)
      .order('paid_date');

    const who = inv.customer
      ? inv.customer.company_name || [inv.customer.first_name, inv.customer.last_name].filter(Boolean).join(' ')
      : inv.bill_to?.company || inv.bill_to?.name || null;

    // Whitelist — no internal notes, no customer contact details, no ids
    return NextResponse.json({
      invoice_number: inv.invoice_number,
      status: effectiveStatus(inv),
      billed_to: who,
      project_name: inv.project_name,
      project_address: inv.project_address,
      milestone_label: inv.milestone_label,
      line_items: inv.line_items,
      subtotal: inv.subtotal,
      tax_percent: inv.tax_percent,
      tax_amount: inv.tax_amount,
      total: inv.total,
      amount_paid: inv.amount_paid,
      issued_date: inv.issued_date,
      due_date: inv.due_date,
      payment_instructions: inv.payment_instructions,
      photos: inv.photos,
      payments: payments || [],
    });
  } catch (err) {
    console.error('[public invoice] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
