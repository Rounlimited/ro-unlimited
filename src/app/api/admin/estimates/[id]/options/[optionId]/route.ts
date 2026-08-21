import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOptionsWithChoices, selectionsDelta } from '@/lib/estimate-options';

export const dynamic = 'force-dynamic';

async function assertEditable(supabase: ReturnType<typeof createAdminClient>, estimateId: string) {
  const { data: est } = await supabase
    .from('estimates').select('id, options_materialized_at').eq('id', estimateId).single();
  if (!est) return 'Estimate not found';
  if (est.options_materialized_at) return 'Options are locked — this document was signed';
  return null;
}

// PUT — update a group and replace its choices wholesale (simplest correct
// contract for an editor UI). Choice ids are regenerated; selections reset to
// defaults, and selections_total recomputes.
export async function PUT(req: NextRequest, { params }: { params: { id: string; optionId: string } }) {
  try {
    const supabase = createAdminClient();
    const blocked = await assertEditable(supabase, params.id);
    if (blocked) return NextResponse.json({ error: blocked }, { status: blocked.includes('locked') ? 409 : 404 });

    const body = await req.json();
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.label !== undefined) patch.label = String(body.label).trim();
    if (body.description !== undefined) patch.description = body.description || null;
    if (body.selection_type !== undefined && ['single', 'multi', 'addon'].includes(body.selection_type)) patch.selection_type = body.selection_type;
    if (body.required !== undefined) patch.required = !!body.required;
    if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;

    const { error } = await supabase
      .from('estimate_options').update(patch)
      .eq('id', params.optionId).eq('estimate_id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (Array.isArray(body.choices)) {
      await supabase.from('estimate_option_choices').delete().eq('option_id', params.optionId);
      const rows = body.choices
        .filter((c: any) => String(c.label || '').trim())
        .map((c: any, i: number) => ({
          option_id: params.optionId,
          estimate_id: params.id,
          label: String(c.label).trim(),
          description: c.description || null,
          image_url: c.image_url || null,
          price_delta: Number(c.price_delta) || 0,
          is_default: !!c.is_default,
          selected: !!c.is_default,
          sort_order: i,
        }));
      if (rows.length) {
        const { error: chErr } = await supabase.from('estimate_option_choices').insert(rows);
        if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });
      }
    }

    const options = await getOptionsWithChoices(supabase, params.id);
    await supabase.from('estimates').update({ selections_total: selectionsDelta(options) }).eq('id', params.id);
    return NextResponse.json({ options });
  } catch (err) {
    console.error('[estimate option] PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove a group (choices cascade); selections_total recomputes.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; optionId: string } }) {
  try {
    const supabase = createAdminClient();
    const blocked = await assertEditable(supabase, params.id);
    if (blocked) return NextResponse.json({ error: blocked }, { status: blocked.includes('locked') ? 409 : 404 });

    const { error } = await supabase
      .from('estimate_options').delete()
      .eq('id', params.optionId).eq('estimate_id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const options = await getOptionsWithChoices(supabase, params.id);
    await supabase.from('estimates').update({ selections_total: selectionsDelta(options) }).eq('id', params.id);
    return NextResponse.json({ deleted: true, options });
  } catch (err) {
    console.error('[estimate option] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
