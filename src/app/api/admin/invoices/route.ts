import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createInvoice, effectiveStatus } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

// GET — list invoices with filters + an AR summary strip in one call.
//   ?status=sent|draft|paid|partial|overdue|cancelled  (overdue is derived)
//   ?customer_id=uuid   ?estimate_id=uuid   ?q=search (number/project/company)
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const customerId = url.searchParams.get('customer_id');
    const estimateId = url.searchParams.get('estimate_id');
    const q = url.searchParams.get('q')?.trim();

    let query = supabase
      .from('invoices')
      .select('*, customer:customers(id, first_name, last_name, company_name, email, phone)')
      .order('created_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (estimateId) query = query.eq('estimate_id', estimateId);
    if (status && status !== 'overdue') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let invoices = (data || []).map((inv) => ({ ...inv, effective_status: effectiveStatus(inv) }));

    if (status === 'overdue') invoices = invoices.filter((i) => i.effective_status === 'overdue');
    if (q) {
      const needle = q.toLowerCase();
      invoices = invoices.filter((i) => {
        const hay = [
          i.invoice_number, i.project_name, i.milestone_label,
          i.customer?.company_name, i.customer?.first_name, i.customer?.last_name,
          i.bill_to?.name, i.bill_to?.company,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(needle);
      });
    }

    // AR summary over the unfiltered set (the strip shouldn't change as you filter)
    const all = (data || []).map((inv) => ({ ...inv, effective_status: effectiveStatus(inv) }));
    const open = all.filter((i) => !['draft', 'paid', 'cancelled'].includes(i.effective_status));
    const now = Date.now();
    const ageDays = (d: string | null) => (d ? Math.floor((now - new Date(d + 'T00:00:00').getTime()) / 86400000) : 0);
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const summary = {
      outstanding: open.reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0),
      overdue: all.filter((i) => i.effective_status === 'overdue')
        .reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0),
      draft_count: all.filter((i) => i.effective_status === 'draft').length,
      open_count: open.length,
      aging: {
        current: open.filter((i) => ageDays(i.due_date) <= 0).reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0),
        d1_30: open.filter((i) => ageDays(i.due_date) > 0 && ageDays(i.due_date) <= 30).reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0),
        d31_60: open.filter((i) => ageDays(i.due_date) > 30 && ageDays(i.due_date) <= 60).reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0),
        d61_plus: open.filter((i) => ageDays(i.due_date) > 60).reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0),
      },
      collected_this_month: 0, // filled below
    };

    const { data: monthPayments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .gte('paid_date', monthStart.toISOString().slice(0, 10));
    summary.collected_this_month = (monthPayments || []).reduce((s, p) => s + Number(p.amount), 0);

    return NextResponse.json({ invoices, summary });
  } catch (err) {
    console.error('[invoices] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create (from scratch, from an estimate, or from a milestone).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createInvoice(body);
    if ('error' in result) {
      return NextResponse.json(result, { status: result.invoice_id ? 409 : 400 });
    }
    return NextResponse.json(result.invoice);
  } catch (err) {
    console.error('[invoices] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
