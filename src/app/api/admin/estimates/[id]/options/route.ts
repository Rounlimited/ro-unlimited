import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOptionsWithChoices } from '@/lib/estimate-options';

export const dynamic = 'force-dynamic';

// GET — option groups with their choices.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const options = await getOptionsWithChoices(supabase, params.id);
    return NextResponse.json({ options });
  } catch (err) {
    console.error('[estimate options] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a group with its choices in one shot.
// { label, description?, selection_type?, required?, choices: [{label, description?, image_url?, price_delta?, is_default?}] }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const label = String(body.label || '').trim();
    if (!label) return NextResponse.json({ error: 'Group label is required' }, { status: 400 });
    const choices = Array.isArray(body.choices) ? body.choices : [];
    if (!choices.some((c: any) => String(c.label || '').trim())) {
      return NextResponse.json({ error: 'At least one choice is required' }, { status: 400 });
    }

    const { data: est } = await supabase
      .from('estimates').select('id, options_materialized_at').eq('id', params.id).single();
    if (!est) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    if (est.options_materialized_at) {
      return NextResponse.json({ error: 'Options are locked — this document was signed' }, { status: 409 });
    }

    const { data: maxSort } = await supabase
      .from('estimate_options').select('sort_order').eq('estimate_id', params.id)
      .order('sort_order', { ascending: false }).limit(1);

    const { data: group, error } = await supabase
      .from('estimate_options')
      .insert({
        estimate_id: params.id,
        label,
        description: body.description || null,
        selection_type: ['single', 'multi', 'addon'].includes(body.selection_type) ? body.selection_type : 'single',
        required: body.required !== false,
        sort_order: (maxSort?.[0]?.sort_order ?? -1) + 1,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = choices
      .filter((c: any) => String(c.label || '').trim())
      .map((c: any, i: number) => ({
        option_id: group.id,
        estimate_id: params.id,
        label: String(c.label).trim(),
        description: c.description || null,
        image_url: c.image_url || null,
        price_delta: Number(c.price_delta) || 0,
        is_default: !!c.is_default,
        selected: !!c.is_default, // defaults start selected so totals read sensibly
        sort_order: i,
      }));
    const { error: chErr } = await supabase.from('estimate_option_choices').insert(rows);
    if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

    const options = await getOptionsWithChoices(supabase, params.id);
    return NextResponse.json({ group: options.find((g) => g.id === group.id), options });
  } catch (err) {
    console.error('[estimate options] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
