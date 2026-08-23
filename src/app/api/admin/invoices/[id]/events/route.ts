import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { summarizeVisits } from '@/lib/doc-events-summary';

export const dynamic = 'force-dynamic';

/** Customer activity for one invoice: raw events + grouped visits. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('document_events')
      .select('id, event, internal, visitor_id, device_type, os, browser, city, region, country, referrer, meta, created_at')
      .eq('doc_type', 'invoice')
      .eq('doc_id', params.id)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const events = data || [];
    return NextResponse.json({ events, summary: summarizeVisits(events) });
  } catch (err) {
    console.error('[invoices/events] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
