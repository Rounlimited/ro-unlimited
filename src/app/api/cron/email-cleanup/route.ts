import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Called by Vercel cron (vercel.json) — permanently deletes emails that have been
// in the trash folder for more than 30 days (based on updated_at or created_at).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Delete messages in trash where created_at is older than 30 days.
  // We use created_at as the age marker — emails are typically trashed soon
  // after receipt, so this is a reasonable proxy for time-in-trash.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data: old, error: fetchErr } = await supabase
    .from('email_messages')
    .select('id')
    .eq('folder', 'trash')
    .lt('created_at', cutoff.toISOString());

  if (fetchErr) {
    console.error('[email-cleanup] fetch error:', fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const ids = (old || []).map(r => r.id);
  if (!ids.length) {
    return NextResponse.json({ deleted: 0, message: 'Nothing to clean up' });
  }

  const { error: delErr } = await supabase
    .from('email_messages')
    .delete()
    .in('id', ids);

  if (delErr) {
    console.error('[email-cleanup] delete error:', delErr.message);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  console.log(`[email-cleanup] Permanently deleted ${ids.length} trash messages older than 30 days`);
  return NextResponse.json({ deleted: ids.length });
}
