import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createInvoice } from '@/lib/invoices';
import { rollUpProgress } from '@/lib/reporting';

type RouteContext = { params: { id: string } };

/**
 * Bill the work that's been done but not invoiced yet.
 *
 * The gap between earned and billed is the number that quietly hurts a
 * contractor — it's his money sitting in someone else's bank. This turns it
 * into a draft invoice in one tap. Draft, not sent: he still reads it first.
 */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();

    const [estRes, itemsRes, progRes, invRes] = await Promise.all([
      supabase.from('estimates')
        .select('id, estimate_number, project_name, total, customer_id')
        .eq('id', params.id).single(),
      supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', params.id),
      supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order').eq('estimate_id', params.id),
      supabase.from('invoices').select('total, status').eq('estimate_id', params.id)
        .neq('status', 'draft').neq('status', 'cancelled'),
    ]);

    const est = estRes.data;
    if (!est) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
    const total = Number(est.total || 0);
    const earned = roll.totalValue > 0 ? roll.earned : total * (roll.percent / 100);
    const billed = (invRes.data || []).reduce((s, i) => s + Number(i.total || 0), 0);
    const unbilled = Math.round((earned - billed) * 100) / 100;

    if (unbilled <= 0) {
      return NextResponse.json({ error: 'Nothing to bill — you have invoiced everything earned so far.' }, { status: 400 });
    }

    const result: any = await createInvoice({
      estimate_id: params.id,
      customer_id: est.customer_id,
      line_items: [{
        description: `Progress billing — ${roll.percent}% complete`,
        quantity: 1,
        unit_price: unbilled,
      }],
      notes: `Work completed to date on ${est.project_name || est.estimate_number}.`,
    });

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({
      invoice: result.invoice || result,
      amount: unbilled,
      percent: roll.percent,
    });
  } catch (err) {
    console.error('[jobs/bill] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
