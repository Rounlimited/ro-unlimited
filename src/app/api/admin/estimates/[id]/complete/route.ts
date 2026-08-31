import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';

type RouteContext = { params: { id: string } };

/**
 * Closing a job out.
 *
 * Sets the completion date, the warranty JR is standing behind, and a closing
 * word to the customer. Everything on their link then turns into the record of
 * the finished job — and the page finally asks how it went.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json().catch(() => ({}));

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, division, completed_at, customer:customers(first_name, last_name, company_name)')
      .eq('id', params.id)
      .single();
    if (!est) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Reopening: JR found something that still needs doing.
    if (body.reopen) {
      await supabase.from('estimates')
        .update({ completed_at: null })
        .eq('id', params.id);
      return NextResponse.json({ completed: false });
    }

    const completedAt = body.completed_at
      ? new Date(body.completed_at + 'T12:00:00').toISOString()
      : new Date().toISOString();

    const { error } = await supabase.from('estimates').update({
      completed_at: completedAt,
      completion_note: (body.completion_note || '').trim() || null,
      warranty_months: body.warranty_months != null && body.warranty_months !== ''
        ? Number(body.warranty_months) : null,
      warranty_notes: (body.warranty_notes || '').trim() || null,
      // Anything still part-done is finished by definition once the job is.
      ...(body.finish_phases === false ? {} : {}),
    }).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // A job that's done is 100% done — otherwise the customer's page says
    // "complete" over a bar stuck at 92%.
    if (body.finish_phases !== false) {
      await supabase.from('estimate_phase_progress')
        .update({ percent_complete: 100, updated_at: new Date().toISOString() })
        .eq('estimate_id', params.id)
        .lt('percent_complete', 100);
    }

    const c: any = est.customer;
    const who = c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Customer';
    await notifyTeam({
      type: 'job_completed',
      title: `Job complete — ${est.project_name || est.estimate_number}`,
      body: `${who}${body.warranty_months ? ` · ${body.warranty_months}-month warranty` : ''}`,
      url: `/admin/estimates/${params.id}`,
      reference_id: params.id,
      division: est.division || null,
      tag: `job-complete-${params.id}`,
    } as any);

    return NextResponse.json({ completed: true, completed_at: completedAt });
  } catch (err) {
    console.error('[estimates/complete] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
