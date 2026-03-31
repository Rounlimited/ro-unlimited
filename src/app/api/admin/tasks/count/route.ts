import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const todayStr = new Date().toISOString().split('T')[0];

    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '("done","cancelled","snoozed")')
      .or(`due_date.lte.${todayStr},due_date.is.null`);

    return NextResponse.json({ count: count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
