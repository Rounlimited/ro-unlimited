import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { listQuestions } from '@/lib/questions';

export const dynamic = 'force-dynamic';

/** Every open customer question across every job, newest first, plus the recent answers and response-time stats. */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const estimateId = req.nextUrl.searchParams.get('estimate_id') || undefined;
    const data = await listQuestions(supabase, { estimateId, limit: Number(req.nextUrl.searchParams.get('limit')) || 100 });
    return NextResponse.json({ ...data, answered: data.answered.slice(0, 30) });
  } catch (err) {
    console.error('[admin/questions] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
