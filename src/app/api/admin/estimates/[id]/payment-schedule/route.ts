import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — list payment schedule milestones
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('estimate_payment_schedules')
      .select('*')
      .eq('estimate_id', id)
      .order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[estimates/payment-schedule] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — bulk replace payment schedule (delete old, insert new)
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Delete all existing milestones for this estimate
    await supabase
      .from('estimate_payment_schedules')
      .delete()
      .eq('estimate_id', id);

    // Insert new milestones
    if (items.length > 0) {
      const rows = items.map((item: any, idx: number) => ({
        estimate_id: id,
        milestone: item.milestone || null,
        due_description: item.description || item.due_description || null,
        amount: item.amount || 0,
        percent: item.percent || 0,
        sort_order: item.sort_order ?? idx,
      }));

      const { data, error } = await supabase
        .from('estimate_payment_schedules')
        .insert(rows)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error('[estimates/payment-schedule] PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
