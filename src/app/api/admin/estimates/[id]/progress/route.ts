import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rollUpProgress } from '@/lib/reporting';

type RouteContext = { params: { id: string } };

/**
 * Per-phase progress + JR's schedule/budget status flags for one contract.
 * Phases come from the line items, so the list always matches the work.
 */

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const [estRes, itemsRes, progRes] = await Promise.all([
      supabase
        .from('estimates')
        .select('id, estimate_number, schedule_status, budget_status, status_reason, status_note, status_updated_at, reporting_cadence, reporting_day, reporting_includes')
        .eq('id', id)
        .single(),
      supabase.from('estimate_line_items').select('phase, total').eq('estimate_id', id),
      supabase.from('estimate_phase_progress').select('phase, percent_complete, note, updated_at').eq('estimate_id', id),
    ]);

    if (estRes.error || !estRes.data) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
    const notes = new Map((progRes.data || []).map((p) => [p.phase, p.note]));

    return NextResponse.json({
      estimate_id: id,
      estimate_number: estRes.data.estimate_number,
      percent: roll.percent,
      total_value: roll.totalValue,
      earned: roll.earned,
      phases: roll.phases.map((p) => ({ ...p, note: notes.get(p.phase) || null })),
      schedule_status: estRes.data.schedule_status,
      budget_status: estRes.data.budget_status,
      status_reason: estRes.data.status_reason,
      status_note: estRes.data.status_note,
      status_updated_at: estRes.data.status_updated_at,
      reporting_cadence: estRes.data.reporting_cadence,
      reporting_day: estRes.data.reporting_day,
      reporting_includes: estRes.data.reporting_includes || [],
    });
  } catch (err) {
    console.error('[estimates/[id]/progress] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * PUT — set one phase's percentage, or the status flags, or both.
 * Body: { phase?, percent_complete?, note?, schedule_status?, budget_status?,
 *         status_reason?, status_note? }
 */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await req.json();

    if (body.phase) {
      const percent = Math.max(0, Math.min(100, Math.round(Number(body.percent_complete) || 0)));
      const { error } = await supabase
        .from('estimate_phase_progress')
        .upsert(
          { estimate_id: id, phase: String(body.phase), percent_complete: percent, note: body.note ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'estimate_id,phase' },
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const statusFields: Record<string, any> = {};
    for (const k of ['schedule_status', 'budget_status', 'status_reason', 'status_note']) {
      if (body[k] !== undefined) statusFields[k] = body[k] || null;
    }
    // Clearing a green schedule clears the delay reason with it.
    if (statusFields.schedule_status && statusFields.schedule_status !== 'behind' && body.status_reason === undefined) {
      statusFields.status_reason = null;
    }
    if (Object.keys(statusFields).length) {
      statusFields.status_updated_at = new Date().toISOString();
      const { error } = await supabase.from('estimates').update(statusFields).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return GET(req, { params });
  } catch (err) {
    console.error('[estimates/[id]/progress] PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
