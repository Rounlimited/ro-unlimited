import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/**
 * How did we do — asked once, at the end of the job.
 *
 * Four or five stars gets pointed at a public review. Anything lower goes
 * straight to JR instead, which is the honest way round: a customer who was
 * let down should reach the owner, not a review form.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const rating = Math.round(Number(body.rating) || 0);
    if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Tap a star rating first' }, { status: 400 });

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, division, completed_at, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();
    if (!est) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const comment = String(body.comment || '').trim().slice(0, 2000) || null;
    const name = String(body.name || '').trim().slice(0, 120) || null;

    const { error } = await supabase.from('project_feedback').upsert(
      { estimate_id: est.id, rating, comment, name },
      { onConflict: 'estimate_id' },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const c: any = est.customer;
    const who = name || c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'A customer';
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    await notifyTeam({
      type: rating >= 4 ? 'project_feedback' : 'project_feedback_low',
      title: `${stars} — ${est.project_name || est.estimate_number}`,
      body: `${who}${comment ? ': ' + comment.slice(0, 140) : ''}`,
      url: `/admin/estimates/${est.id}`,
      reference_id: est.id,
      division: est.division || null,
      tag: `feedback-${est.id}`,
    } as any);

    return NextResponse.json({ rating });
  } catch (err) {
    console.error('[estimate/feedback] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
