import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Post-job feedback from the paid invoice (receipt) page: 1–5 stars + an
 * optional note. One per invoice. Low ratings raise a louder notification —
 * that's a phone call JR needs to make, not a metric.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || '').trim().slice(0, 2000);
    const name = String(body.name || '').trim().slice(0, 120);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Pick a star rating first' }, { status: 400 });
    }

    const { data: inv } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, link_enabled, project_name, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();
    if (!inv || inv.status === 'draft') return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!inv.link_enabled) return NextResponse.json({ error: 'This invoice link has been turned off' }, { status: 410 });
    if (inv.status !== 'paid') {
      return NextResponse.json({ error: 'Feedback opens once the invoice is settled' }, { status: 409 });
    }

    const { data: feedback, error } = await supabase
      .from('invoice_feedback')
      .insert({ invoice_id: inv.id, rating, comment: comment || null, name: name || null })
      .select()
      .single();
    if (error) {
      if (String(error.message).includes('duplicate') || error.code === '23505') {
        return NextResponse.json({ error: 'Feedback was already submitted for this invoice — thank you!' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 });
    }

    const cust: any = inv.customer;
    const whoName = name || (cust
      ? (cust.company_name || [cust.first_name, cust.last_name].filter(Boolean).join(' '))
      : 'Customer');
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    await supabase.from('admin_notifications').insert({
      type: rating <= 3 ? 'invoice_feedback_low' : 'invoice_feedback',
      title: rating <= 3
        ? `⚠️ ${stars} from ${whoName} — worth a call`
        : `${stars} from ${whoName}`,
      body: `${inv.invoice_number}${inv.project_name ? ` (${inv.project_name})` : ''}${comment ? `: "${comment.slice(0, 140)}"` : ''}`,
      url: `/admin/invoices/${inv.id}`,
      reference_id: inv.id,
    }).then(() => {}, () => {});

    return NextResponse.json({ feedback: { rating: feedback.rating, comment: feedback.comment } });
  } catch (err) {
    console.error('[invoice feedback] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
