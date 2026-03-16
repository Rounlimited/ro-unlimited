import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { recalcEstimateTotals } from '@/lib/estimates';

type RouteContext = { params: { id: string } };

// Helper: recalculate and persist estimate totals
async function updateEstimateTotals(supabase: any, estimateId: string) {
  const [{ data: estimate }, { data: lineItems }] = await Promise.all([
    supabase.from('estimates').select('*').eq('id', estimateId).single(),
    supabase.from('estimate_line_items').select('*').eq('estimate_id', estimateId),
  ]);

  if (!estimate) return;

  const totals = recalcEstimateTotals(lineItems || [], estimate);
  await supabase
    .from('estimates')
    .update({ ...totals, updated_at: new Date().toISOString() })
    .eq('id', estimateId);
}

// GET — list line items for an estimate
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id)
      .order('phase', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[estimates/line-items] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a single line item, auto-calculate total
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const supabase = createAdminClient();

    const quantity = body.quantity || 0;
    const unit_cost = body.unit_cost || 0;
    const markup_percent = body.markup_percent || 0;
    const total = quantity * unit_cost * (1 + markup_percent / 100);

    const { data, error } = await supabase
      .from('estimate_line_items')
      .insert({
        estimate_id: id,
        phase: body.phase || null,
        category: body.category || null,
        description: body.description || null,
        quantity,
        unit: body.unit || null,
        unit_cost,
        markup_percent,
        total,
        sort_order: body.sort_order ?? 0,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Recalculate estimate totals
    await updateEstimateTotals(supabase, id);

    return NextResponse.json(data);
  } catch (err) {
    console.error('[estimates/line-items] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — bulk update line items (upsert all, delete any not in array)
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get existing item IDs
    const { data: existing } = await supabase
      .from('estimate_line_items')
      .select('id')
      .eq('estimate_id', id);

    const existingIds = (existing || []).map((e: any) => e.id as string);
    const incomingIds = new Set(items.filter((i: any) => i.id).map((i: any) => i.id as string));

    // Delete items not in the incoming array
    const toDelete = existingIds.filter((eid: string) => !incomingIds.has(eid));
    if (toDelete.length > 0) {
      await supabase
        .from('estimate_line_items')
        .delete()
        .in('id', toDelete);
    }

    // Upsert all items
    const upsertItems = items.map((item: any, idx: number) => {
      const quantity = item.quantity || 0;
      const unit_cost = item.unit_cost || 0;
      const markup_percent = item.markup_percent || 0;
      const total = quantity * unit_cost * (1 + markup_percent / 100);

      return {
        ...(item.id ? { id: item.id } : {}),
        estimate_id: id,
        phase: item.phase || null,
        category: item.category || null,
        description: item.description || null,
        quantity,
        unit: item.unit || null,
        unit_cost,
        markup_percent,
        total,
        sort_order: item.sort_order ?? idx,
        notes: item.notes || null,
      };
    });

    const { data, error } = await supabase
      .from('estimate_line_items')
      .upsert(upsertItems, { onConflict: 'id' })
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Recalculate estimate totals
    await updateEstimateTotals(supabase, id);

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[estimates/line-items] PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — delete a single line item by ?item_id=
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const itemId = req.nextUrl.searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ error: 'item_id query param is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('estimate_line_items')
      .delete()
      .eq('id', itemId)
      .eq('estimate_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Recalculate estimate totals
    await updateEstimateTotals(supabase, id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[estimates/line-items] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
