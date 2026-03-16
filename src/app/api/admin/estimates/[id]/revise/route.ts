import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// POST — create a revision of an estimate
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch the original estimate
    const { data: original, error: fetchErr } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !original) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Determine the root parent (for revision chain)
    const rootId = original.parent_estimate_id || original.id;

    // Find highest revision number in this chain
    const { data: revisions } = await supabase
      .from('estimates')
      .select('revision_number')
      .or(`id.eq.${rootId},parent_estimate_id.eq.${rootId}`)
      .order('revision_number', { ascending: false })
      .limit(1);

    const nextRevision = ((revisions?.[0]?.revision_number) || 0) + 1;

    // Build new estimate number with revision suffix
    const baseNumber = original.estimate_number.replace(/-R\d+$/, '');
    const newNumber = `${baseNumber}-R${nextRevision}`;

    // Copy estimate (exclude id, timestamps, status fields)
    const { id: _id, created_at, updated_at, sent_at, viewed_at, accepted_at, declined_at, status, share_token, share_token_expires_at, ...copyFields } = original;

    const { data: newEstimate, error: insertErr } = await supabase
      .from('estimates')
      .insert({
        ...copyFields,
        estimate_number: newNumber,
        parent_estimate_id: rootId,
        revision_number: nextRevision,
        status: 'draft',
        share_token: null,
        share_token_expires_at: null,
      })
      .select()
      .single();

    if (insertErr || !newEstimate) {
      return NextResponse.json({ error: insertErr?.message || 'Failed to create revision' }, { status: 500 });
    }

    // Copy line items
    const { data: lineItems } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id);

    if (lineItems?.length) {
      const copiedItems = lineItems.map(({ id: _liId, estimate_id, created_at, updated_at, ...rest }: any) => ({
        ...rest,
        estimate_id: newEstimate.id,
      }));
      await supabase.from('estimate_line_items').insert(copiedItems);
    }

    // Copy payment schedule
    const { data: payments } = await supabase
      .from('estimate_payment_schedules')
      .select('*')
      .eq('estimate_id', id);

    if (payments?.length) {
      const copiedPayments = payments.map(({ id: _pId, estimate_id, created_at, updated_at, ...rest }: any) => ({
        ...rest,
        estimate_id: newEstimate.id,
      }));
      await supabase.from('estimate_payment_schedules').insert(copiedPayments);
    }

    // Mark original as revised
    await supabase.from('estimates').update({ status: 'revised', updated_at: new Date().toISOString() }).eq('id', id);

    // Insert status history
    await supabase.from('estimate_status_history').insert({
      estimate_id: id,
      old_status: original.status,
      new_status: 'revised',
      notes: `Revised to ${newNumber}`,
    });

    return NextResponse.json({
      id: newEstimate.id,
      estimate_number: newNumber,
      revision_number: nextRevision,
    });
  } catch (err) {
    console.error('[estimates/revise] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
