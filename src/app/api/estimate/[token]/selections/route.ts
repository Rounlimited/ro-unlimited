import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { applySelections } from '@/lib/estimate-options';

export const dynamic = 'force-dynamic';

/**
 * Customer confirms option selections from the share link.
 * Locked once the document is signed; every confirm notifies the admin with
 * the picks and the new total. The server owns all math.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const choiceIds: string[] = Array.isArray(body.choice_ids) ? body.choice_ids.map(String) : [];
    const confirmedBy = String(body.name || '').trim().slice(0, 120);

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, status, document_mode, project_name, total, signed_at, share_token_expires_at, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();
    if (!est) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (est.share_token_expires_at && new Date(est.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired — call us and we will resend it' }, { status: 410 });
    }
    if (est.signed_at) {
      return NextResponse.json({ error: 'Selections are locked — this document has been signed' }, { status: 409 });
    }
    if (['declined', 'expired'].includes(est.status)) {
      return NextResponse.json({ error: 'This document is no longer open — call us at (864) 304-0139' }, { status: 409 });
    }

    const result = await applySelections(est.id, choiceIds);
    if ('error' in result) return NextResponse.json(result, { status: 400 });

    await supabase.from('estimates').update({
      selections_confirmed_at: new Date().toISOString(),
      selections_confirmed_by: confirmedBy || null,
    }).eq('id', est.id);

    const cust: any = est.customer;
    const who = confirmedBy || (cust
      ? (cust.company_name || [cust.first_name, cust.last_name].filter(Boolean).join(' '))
      : 'Customer');
    const finalTotal = Number(est.total) + result.selections_total;
    await supabase.from('admin_notifications').insert({
      type: 'estimate_selections',
      title: `Options chosen: ${est.estimate_number} → $${Math.round(finalTotal).toLocaleString()}`,
      body: `${who} picked: ${result.summary.join(' · ') || 'no priced options'}.`,
      url: `/admin/estimates/${est.id}`,
      reference_id: est.id,
    }).then(() => {}, () => {});

    return NextResponse.json({
      confirmed: true,
      selections_total: result.selections_total,
      final_total: finalTotal,
      summary: result.summary,
    });
  } catch (err) {
    console.error('[estimate selections] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
