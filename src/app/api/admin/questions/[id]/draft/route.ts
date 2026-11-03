import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { draftAnswer } from '@/lib/questions';

export const dynamic = 'force-dynamic';

/** AI draft for one customer question, from that job's records. Nothing is sent — JR edits and taps Send. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: q } = await supabase.from('project_messages').select('id, estimate_id, author').eq('id', params.id).maybeSingle();
    if (!q || q.author !== 'customer') return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    const out = await draftAnswer(q.estimate_id, q.id);
    if (out.error) return NextResponse.json({ error: out.error }, { status: 502 });
    return NextResponse.json({ draft: out.draft });
  } catch (err) {
    console.error('[admin/questions/draft] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
