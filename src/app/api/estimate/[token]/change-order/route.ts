import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

const money = (n: number) => (n >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(n)).toLocaleString();

/**
 * The customer approving (or declining) extra work from their project page.
 * Same page they signed the contract on — no separate paperwork, and no
 * "reply to this email to approve" that nobody can find three months later.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const id = String(body.change_order_id || '');
    const decision = body.decision === 'decline' ? 'decline' : 'approve';

    if (!id) return NextResponse.json({ error: 'Which change order?' }, { status: 400 });

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, division, total, share_token_expires_at')
      .eq('share_token', params.token)
      .single();
    if (!est) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (est.share_token_expires_at && new Date(est.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    const { data: co } = await supabase
      .from('change_orders').select('*').eq('id', id).eq('estimate_id', est.id).single();
    if (!co) return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    if (co.status === 'approved' || co.status === 'declined') {
      return NextResponse.json({ error: 'That has already been answered' }, { status: 409 });
    }

    if (decision === 'decline') {
      await supabase.from('change_orders').update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: (body.reason || '').toString().slice(0, 500) || null,
      }).eq('id', id);

      await notifyTeam({
        type: 'change_order_declined',
        title: `Change order declined — ${est.project_name || est.estimate_number}`,
        body: `${co.title} · ${money(Number(co.amount))}`,
        url: `/admin/estimates/${est.id}`, reference_id: est.id, tag: `co-${id}`,
      } as any);

      return NextResponse.json({ status: 'declined' });
    }

    const name = String(body.name || '').trim().slice(0, 120);
    if (!name) return NextResponse.json({ error: 'Please type your name to approve' }, { status: 400 });

    await supabase.from('change_orders').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_name: name,
      signature_url: body.signature_url || null,
    }).eq('id', id);

    // Approved extra work is part of the contract, so the total has to follow
    // it — otherwise percent complete and earned-to-date quietly drift.
    const newTotal = Number(est.total || 0) + Number(co.amount || 0);
    await supabase.from('estimates').update({ total: newTotal }).eq('id', est.id);

    await notifyTeam({
      type: 'change_order_approved',
      title: `${name} approved a change order — ${est.project_name || est.estimate_number}`,
      body: `${co.title} · ${money(Number(co.amount))} · contract now $${Math.round(newTotal).toLocaleString()}`,
      url: `/admin/estimates/${est.id}`, reference_id: est.id,
      division: est.division || null, tag: `co-${id}`,
    } as any);

    return NextResponse.json({ status: 'approved', contract_total: newTotal });
  } catch (err) {
    console.error('[estimate/change-order] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
