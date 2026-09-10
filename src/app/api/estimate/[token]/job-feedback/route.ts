import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/**
 * Mid-job customer feedback, three shapes:
 *   comment — a note pinned to a section of their project page
 *   pulse   — the one-tap "how's this feeling?" multiple choice
 *   review  — an any-time star rating (separate from the close-out one)
 *
 * All of it is JR-only on arrival (Job Room + notification). Per-job
 * switches on the estimate decide whether the customer even sees the UI:
 * feedback_enabled covers comments + pulse, reviews_enabled the stars.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const kind = String(body.kind || '');
    if (!['comment', 'pulse', 'review'].includes(kind)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, signed_at, feedback_enabled, reviews_enabled, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();
    if (!est || !est.signed_at) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (kind === 'review' ? est.reviews_enabled === false : est.feedback_enabled === false) {
      return NextResponse.json({ error: 'Not available on this project' }, { status: 403 });
    }

    // Flood guard — a stuck retry loop shouldn't fill the Job Room.
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count } = await supabase.from('job_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('estimate_id', est.id).gte('created_at', dayAgo);
    if ((count || 0) >= 25) return NextResponse.json({ error: 'Please call us — (864) 304-0139' }, { status: 429 });

    const row: any = { estimate_id: est.id, kind };
    const text = String(body.body || '').trim().slice(0, 2000) || null;

    if (kind === 'comment') {
      if (!text) return NextResponse.json({ error: 'Write a note first' }, { status: 400 });
      row.section = String(body.section || 'general').slice(0, 40);
      row.body = text;
    } else if (kind === 'pulse') {
      const answer = String(body.answer || '').trim().slice(0, 120);
      if (!answer) return NextResponse.json({ error: 'Pick an answer first' }, { status: 400 });
      row.question = String(body.question || '').slice(0, 200) || null;
      row.answer = answer;
      row.body = text;
    } else {
      const rating = Math.round(Number(body.rating) || 0);
      if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Tap a star rating first' }, { status: 400 });
      row.rating = rating;
      row.body = text;
    }

    const { error } = await supabase.from('job_feedback').insert(row);
    if (error) return NextResponse.json({ error: 'Could not save that — please call us.' }, { status: 500 });

    const c: any = est.customer;
    const who = c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'The customer';
    const project = est.project_name || est.estimate_number;
    const concern = kind === 'pulse' && /concern/i.test(row.answer || '');

    await notifyTeam({
      type: kind === 'review' ? 'project_review' : concern ? 'project_pulse_concern' : kind === 'pulse' ? 'project_pulse' : 'project_comment',
      title: kind === 'review'
        ? `${'★'.repeat(row.rating)}${'☆'.repeat(5 - row.rating)} — ${project}`
        : concern
          ? `⚠️ ${who} has a concern — ${project}`
          : kind === 'pulse'
            ? `${who}: "${row.answer}" — ${project}`
            : `💬 ${who} left a note on ${row.section} — ${project}`,
      body: (text || row.answer || '').slice(0, 160),
      url: `/admin/jobs/${est.id}`,
      reference_id: est.id,
      tag: 'job-feedback',
    } as any).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
