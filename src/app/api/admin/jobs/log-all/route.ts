import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Log the same thing on several jobs at once.
 *
 * Weather doesn't hit one site at a time. A rained-out Tuesday is a rain day
 * on every job that's running, and typing it five times is how a log stops
 * getting kept.
 *
 * Body: { type, text?, entry_date?, job_ids?, reason? }
 * With no job_ids it hits every accepted/signed job that isn't finished.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();

    const type = String(body.type || 'rain');
    const text = (body.text || '').trim();
    if (!text && type !== 'rain') {
      return NextResponse.json({ error: 'Say what happened' }, { status: 400 });
    }
    const entryDate = body.entry_date || new Date().toISOString().slice(0, 10);

    // Which jobs
    let ids: string[] = Array.isArray(body.job_ids) ? body.job_ids.filter(Boolean) : [];
    if (!ids.length) {
      const { data: jobs, error } = await supabase
        .from('estimates')
        .select('id')
        .or('status.eq.accepted,signed_at.not.is.null')
        .limit(200);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      ids = (jobs || []).map((j) => j.id);
    }
    if (!ids.length) return NextResponse.json({ logged: 0, skipped: 0, jobs: [] });

    // Never log the same thing twice on the same day for the same job — he
    // may well tap this from two screens, or twice by accident.
    const { data: existing } = await supabase
      .from('job_log_entries')
      .select('estimate_id')
      .in('estimate_id', ids)
      .eq('entry_date', entryDate)
      .eq('type', type);

    const already = new Set((existing || []).map((e) => e.estimate_id));
    const todo = ids.filter((id) => !already.has(id));

    if (todo.length) {
      const { error } = await supabase.from('job_log_entries').insert(
        todo.map((id) => ({
          estimate_id: id,
          entry_date: entryDate,
          type,
          text: text || null,
          reason: body.reason || null,
        })),
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Name them back so the confirmation can say which jobs it touched.
    const { data: named } = await supabase
      .from('estimates')
      .select('id, project_name, estimate_number')
      .in('id', todo.length ? todo : ids);

    return NextResponse.json({
      logged: todo.length,
      skipped: already.size,
      entry_date: entryDate,
      jobs: (named || []).map((j) => j.project_name || j.estimate_number),
    });
  } catch (err) {
    console.error('[jobs/log-all] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
