import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { snapshotRow, recordEdit, recordDelete } from '@/lib/edit-history';
import { recalcEstimateTotals, syncScheduleAmounts, withLiveAmounts } from '@/lib/estimates';

type RouteContext = { params: { id: string } };

// GET — single estimate with all related data
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch estimate with customer join
    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('*, customer:customers(id, first_name, last_name, company_name, email, phone, address, city, state, zip)')
      .eq('id', id)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Fetch related data in parallel
    const [lineItemsRes, paymentRes, historyRes] = await Promise.all([
      supabase
        .from('estimate_line_items')
        .select('*')
        .eq('estimate_id', id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('estimate_payment_schedules')
        .select('*')
        .eq('estimate_id', id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('estimate_status_history')
        .select('*')
        .eq('estimate_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (estimate) {
      estimate.scope_of_work = estimate.project_description;
    }

    return NextResponse.json({
      ...estimate,
      line_items: lineItemsRes.data || [],
      payment_schedule: withLiveAmounts(paymentRes.data || [], Number(estimate?.total) || 0),
      status_history: historyRes.data || [],
    });
  } catch (err) {
    console.error('[estimates/[id]] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update estimate fields; recalculate totals if financial fields change
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const supabase = createAdminClient();

    // He chose to change a contract the customer already signed (asked on the edit screen): keep a record of it.
    if (body.signed_edit_ack) {
      const { data: cur } = await supabase.from('estimates').select('status, signed_at').eq('id', id).maybeSingle();
      if (cur && (cur.signed_at || cur.status === 'accepted')) {
        await supabase.from('estimate_status_history').insert({ estimate_id: id, old_status: cur.status, new_status: cur.status, notes: "Opened for changes after signing, on the owner's say-so (edit screen)" });
      }
      return NextResponse.json({ ok: true });
    }

    // Check for status change to insert history
    const oldStatusChanged = body.status !== undefined;
    let oldStatus: string | null = null;

    if (oldStatusChanged) {
      const { data: current } = await supabase
        .from('estimates')
        .select('status')
        .eq('id', id)
        .single();
      oldStatus = current?.status || null;
    }

    // Remove non-updatable fields
    delete body.id;
    delete body.created_at;
    delete body.estimate_number;

    // Map aliased field names to actual column names
    if (body.scope_of_work !== undefined) {
      body.project_description = body.scope_of_work;
      delete body.scope_of_work;
    }
    if (body.description !== undefined && body.project_description === undefined) {
      body.project_description = body.description;
      delete body.description;
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Check if financial fields changed — if so, recalculate totals
    const financialFields = [
      'overhead_percent', 'markup_percent', 'tax_percent',
      'contingency_percent', 'permit_fees', 'total_override', 'adjustment_amount',
    ];
    const financialChanged = financialFields.some((f) => body[f] !== undefined);

    if (financialChanged) {
      // Get current estimate for defaults and line items for recalc
      const [{ data: currentEst }, { data: lineItems }] = await Promise.all([
        supabase.from('estimates').select('*').eq('id', id).single(),
        supabase.from('estimate_line_items').select('*').eq('estimate_id', id),
      ]);

      if (currentEst) {
        const merged = { ...currentEst, ...body };
        const totals = recalcEstimateTotals(lineItems || [], merged);
        Object.assign(body, totals);
      }
    }

    // (recalc above owns `total` — fixed price plus any credit/charge.)

    // Snapshot for Undo/Redo (taken before the write)
    const priorRow = await snapshotRow(supabase, 'estimates', id);

    const { data, error } = await supabase
      .from('estimates')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    await recordEdit(supabase, 'estimates', id, priorRow, data);
    if (financialChanged) await syncScheduleAmounts(supabase, id, Number(data.total) || 0);

    // Insert status history if status changed
    if (oldStatusChanged && body.status && body.status !== oldStatus) {
      await supabase.from('estimate_status_history').insert({
        estimate_id: id,
        old_status: oldStatus,
        new_status: body.status,
        notes: body.status_notes || null,
        changed_by: body.changed_by || null,
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[estimates/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — hard delete estimate (cascades handle related records)
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Invoices are money records and are never removed as a side effect: say
    // so plainly instead of failing with a database error nobody sees.
    const { data: invs } = await supabase.from('invoices').select('invoice_number').eq('estimate_id', id);
    if (invs && invs.length) {
      const nums = invs.map((i) => i.invoice_number).filter(Boolean).join(', ');
      return NextResponse.json({
        error: `This one has ${invs.length === 1 ? 'an invoice' : invs.length + ' invoices'} on it (${nums}). Delete ${invs.length === 1 ? 'that invoice' : 'those invoices'} first, then delete this.`,
      }, { status: 409 });
    }
    // A revision made from this one keeps living; it just loses the pointer back.
    await supabase.from('estimates').update({ parent_estimate_id: null }).eq('parent_estimate_id', id);

    const { error } = await supabase
      .from('estimates')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Could not delete it: ' + error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[estimates/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
