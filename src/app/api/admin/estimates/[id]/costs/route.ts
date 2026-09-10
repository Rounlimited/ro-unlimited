import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

/**
 * Job costing — what JR actually SPENT on a job, tapped in as it happens.
 * "$2,400 pipe, Ferguson" takes four taps. The Job Room turns these into a
 * live margin (earned − spent), which is what makes his Over Budget button
 * a number instead of a feeling.
 */

const COST_CATEGORIES: string[] = ['materials', 'subcontractor', 'labor', 'equipment', 'hauling', 'fuel', 'permits', 'other'];

async function listCosts(supabase: any, estimateId: string) {
  const { data: costs } = await supabase
    .from('job_costs')
    .select('id, spent_on, category, amount, vendor, note, created_at')
    .eq('estimate_id', estimateId)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });

  const rows = costs || [];
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const c of rows) {
    const amt = Number(c.amount || 0);
    total += amt;
    byCategory[c.category] = (byCategory[c.category] || 0) + amt;
  }
  return { costs: rows, total: Math.round(total), by_category: byCategory };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    return NextResponse.json(await listCosts(supabase, params.id));
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const amount = Number(body.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Amount required' }, { status: 400 });

    const category = COST_CATEGORIES.includes(body.category) ? body.category : 'other';
    const { error } = await supabase.from('job_costs').insert({
      estimate_id: params.id,
      amount,
      category,
      vendor: (body.vendor || '').trim() || null,
      note: (body.note || '').trim() || null,
      spent_on: body.spent_on || new Date().toISOString().slice(0, 10),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(await listCosts(supabase, params.id));
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase.from('job_costs').delete().eq('id', id).eq('estimate_id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(await listCosts(supabase, params.id));
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
