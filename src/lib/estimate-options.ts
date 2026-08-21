import { createAdminClient } from '@/lib/supabase/server';
import { recalcEstimateTotals } from '@/lib/estimates';

/**
 * Estimate options — the configurator layer. Option groups ("Roof Color")
 * hold choices (photo + description + price delta). Customers select on the
 * share link; the server owns all math. Signing materializes the selected
 * choices into real line items so accepted totals and downstream invoices
 * carry the customer's picks.
 *
 * Money model: line items stay the canonical base. `selections_total` is the
 * server-computed sum of selected deltas, folded into line items exactly once
 * at signing (options_materialized_at guards the fold).
 */

export interface OptionChoice {
  id: string;
  option_id: string;
  label: string;
  description: string | null;
  image_url: string | null;
  price_delta: number;
  is_default: boolean;
  selected: boolean;
  sort_order: number;
}

export interface OptionGroup {
  id: string;
  estimate_id: string;
  label: string;
  description: string | null;
  selection_type: 'single' | 'multi' | 'addon';
  required: boolean;
  sort_order: number;
  choices: OptionChoice[];
}

export async function getOptionsWithChoices(
  supabase: ReturnType<typeof createAdminClient>,
  estimateId: string
): Promise<OptionGroup[]> {
  const [{ data: groups }, { data: choices }] = await Promise.all([
    supabase.from('estimate_options').select('*').eq('estimate_id', estimateId).order('sort_order'),
    supabase.from('estimate_option_choices').select('*').eq('estimate_id', estimateId).order('sort_order'),
  ]);
  return (groups || []).map((g) => ({
    ...g,
    choices: (choices || []).filter((ch) => ch.option_id === g.id),
  }));
}

export function selectionsDelta(groups: OptionGroup[]): number {
  return groups.reduce(
    (sum, g) => sum + g.choices.filter((ch) => ch.selected).reduce((s2, ch) => s2 + Number(ch.price_delta), 0),
    0
  );
}

/**
 * Apply a customer's selections (list of choice ids). Validates group rules:
 *  - single: exactly one choice when required, at most one otherwise
 *  - addon:  zero or one
 *  - multi:  anything
 * Rejects unknown ids. Recomputes selections_total server-side.
 */
export async function applySelections(
  estimateId: string,
  choiceIds: string[]
): Promise<{ ok: true; selections_total: number; summary: string[] } | { error: string }> {
  const supabase = createAdminClient();
  const groups = await getOptionsWithChoices(supabase, estimateId);
  if (!groups.length) return { error: 'This document has no selectable options' };

  const chosen = new Set(choiceIds.map(String));
  const validIds = new Set(groups.flatMap((g) => g.choices.map((ch) => ch.id)));
  for (const id of chosen) {
    if (!validIds.has(id)) return { error: 'Unknown option choice submitted' };
  }

  const summary: string[] = [];
  for (const g of groups) {
    const picked = g.choices.filter((ch) => chosen.has(ch.id));
    if (g.selection_type === 'single') {
      if (picked.length > 1) return { error: `Pick just one option for "${g.label}"` };
      if (g.required && picked.length === 0) return { error: `Pick an option for "${g.label}"` };
    } else if (g.selection_type === 'addon' && picked.length > 1) {
      return { error: `"${g.label}" allows one add-on at most` };
    }
    for (const ch of picked) {
      const d = Number(ch.price_delta);
      summary.push(`${g.label}: ${ch.label}${d ? ` (${d > 0 ? '+' : '−'}$${Math.abs(d).toLocaleString()})` : ''}`);
    }
  }

  // Persist: two bulk updates beat N round trips
  const allIds = [...validIds];
  const selectedIds = allIds.filter((id) => chosen.has(id));
  const unselectedIds = allIds.filter((id) => !chosen.has(id));
  if (unselectedIds.length) {
    await supabase.from('estimate_option_choices').update({ selected: false }).in('id', unselectedIds);
  }
  if (selectedIds.length) {
    await supabase.from('estimate_option_choices').update({ selected: true }).in('id', selectedIds);
  }

  const fresh = await getOptionsWithChoices(supabase, estimateId);
  const selections_total = selectionsDelta(fresh);
  await supabase.from('estimates').update({
    selections_total,
    updated_at: new Date().toISOString(),
  }).eq('id', estimateId);

  return { ok: true, selections_total, summary };
}

/**
 * Fold the selected choices into real line items (phase "Selected Options")
 * and recalc the estimate totals. Runs once — at signing — and zeroes
 * selections_total so nothing double-counts. Idempotent via
 * options_materialized_at.
 */
export async function materializeSelections(estimateId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: est } = await supabase
    .from('estimates')
    .select('id, options_materialized_at, overhead_percent, markup_percent, tax_percent, contingency_percent, permit_fees, total_override')
    .eq('id', estimateId)
    .single();
  if (!est || est.options_materialized_at) return;

  const groups = await getOptionsWithChoices(supabase, estimateId);
  const selected = groups.flatMap((g) =>
    g.choices.filter((ch) => ch.selected).map((ch) => ({ group: g, choice: ch }))
  );
  if (!selected.length) return;

  const { data: existing } = await supabase
    .from('estimate_line_items')
    .select('sort_order')
    .eq('estimate_id', estimateId)
    .order('sort_order', { ascending: false })
    .limit(1);
  let sort = (existing?.[0]?.sort_order ?? 0) + 1;

  // Only priced selections become line items; included-at-no-cost picks are
  // recorded on the document itself, not the money table.
  const rows = selected
    .filter(({ choice }) => Number(choice.price_delta) !== 0)
    .map(({ group, choice }) => ({
      estimate_id: estimateId,
      phase: 'Selected Options',
      description: `${group.label} — ${choice.label}`,
      category: 'material',
      quantity: 1,
      unit: 'selection',
      unit_cost: Number(choice.price_delta),
      markup_percent: 0,
      total: Number(choice.price_delta),
      sort_order: sort++,
    }));

  if (rows.length) {
    await supabase.from('estimate_line_items').insert(rows);
    const { data: allItems } = await supabase
      .from('estimate_line_items').select('*').eq('estimate_id', estimateId);
    const totals = recalcEstimateTotals(allItems || [], est as any);
    await supabase.from('estimates').update({
      ...totals,
      ...(est.total_override != null ? { total: Number(est.total_override) + rows.reduce((s, r) => s + r.total, 0), total_override: Number(est.total_override) + rows.reduce((s, r) => s + r.total, 0) } : {}),
      selections_total: 0,
      options_materialized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', estimateId);
  } else {
    await supabase.from('estimates').update({
      selections_total: 0,
      options_materialized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', estimateId);
  }
}
