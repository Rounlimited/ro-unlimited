import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOptionsWithChoices, selectionsDelta } from '@/lib/estimate-options';
import { rollUpProgress } from '@/lib/reporting';
import { recordDocumentEvent, visitorFromCookies, visitorCookie } from '@/lib/doc-events';

type RouteContext = { params: { token: string } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = params;
    const supabase = createAdminClient();

    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('*, customer:customers(first_name, last_name, company_name, email, phone)')
      .eq('share_token', token)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: 'Estimate not found or link expired' }, { status: 404 });
    }

    // Check expiration
    if (estimate.share_token_expires_at && new Date(estimate.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This estimate link has expired' }, { status: 410 });
    }

    // Remap project_description
    estimate.scope_of_work = estimate.project_description;

    // Fetch related data
    const [{ data: lineItems }, { data: paymentSchedule }, disclaimerResult] = await Promise.all([
      supabase.from('estimate_line_items').select('*').eq('estimate_id', estimate.id).order('phase').order('sort_order'),
      supabase.from('estimate_payment_schedules').select('*').eq('estimate_id', estimate.id).order('sort_order'),
      estimate.disclaimer_ids?.length
        ? supabase.from('disclaimers').select('id, title, body').in('id', estimate.disclaimer_ids)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Log the open (device, location, repeat visits). Staff opening their own
    // link are recorded as internal and don't count or flip the status.
    const visitor = visitorFromCookies();
    const { internal } = await recordDocumentEvent({ req, docType: 'estimate', doc: estimate, event: 'link_view', visitorId: visitor.id });

    // Mark as viewed if currently sent
    if (estimate.status === 'sent' && !internal) {
      const now = new Date().toISOString();
      await supabase.from('estimates').update({ status: 'viewed', viewed_at: now }).eq('id', estimate.id);
      await supabase.from('estimate_status_history').insert({
        estimate_id: estimate.id,
        old_status: 'sent',
        new_status: 'viewed',
        notes: 'Customer opened estimate link',
      });
    }

    // Strip sensitive fields
    const {
      share_token: _st,
      share_token_expires_at: _ste,
      notes: _n,
      internal_notes: _in,
      ...safeEstimate
    } = estimate;

    // Live job progress — only once the customer has signed and JR has actually
    // set a phase. Percentages only: his schedule/budget flags stay internal.
    let progress: any = null;
    if (estimate.signed_at) {
      const { data: progressRows } = await supabase
        .from('estimate_phase_progress')
        .select('phase, percent_complete, updated_at')
        .eq('estimate_id', estimate.id);
      if (progressRows && progressRows.length) {
        const roll = rollUpProgress(lineItems || [], progressRows);
        const inProgress = roll.phases.find((ph) => ph.percent > 0 && ph.percent < 100);
        const nextUp = roll.phases.find((ph) => ph.percent === 0);
        progress = {
          percent: roll.percent,
          phases: roll.phases.map((ph) => ({ phase: ph.phase, percent: ph.percent })),
          in_progress: inProgress ? inProgress.phase : null,
          next_up: nextUp ? nextUp.phase : null,
          updated_at: progressRows
            .map((r) => r.updated_at)
            .sort()
            .reverse()[0] || null,
        };
      }
    }

    const options = await getOptionsWithChoices(supabase, estimate.id);
    const selections_total = estimate.options_materialized_at ? 0 : selectionsDelta(options);

    const res = NextResponse.json({
      ...safeEstimate,
      line_items: lineItems || [],
      payment_schedule: paymentSchedule || [],
      disclaimers: disclaimerResult?.data || [],
      options,
      progress,
      selections_total,
      final_total: Number(estimate.total) + selections_total,
    });
    if (visitor.isNew) res.headers.append('Set-Cookie', visitorCookie(visitor.id));
    return res;
  } catch (err) {
    console.error('[estimate/token] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
