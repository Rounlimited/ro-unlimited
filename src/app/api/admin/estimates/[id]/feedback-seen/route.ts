import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/** JR opened the Job Room — everything waiting there counts as seen. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    await supabase.from('job_feedback')
      .update({ seen_at: new Date().toISOString() })
      .eq('estimate_id', params.id)
      .is('seen_at', null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
