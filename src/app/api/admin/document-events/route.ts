import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Cross-document customer activity feed ("who's looking right now").
 * ?doc_type=estimate|invoice  ?limit=50  ?since=ISO  ?internal=1 to include staff
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(1, Number(sp.get('limit')) || 50));
    const supabase = createAdminClient();
    let q = supabase
      .from('document_events')
      .select('id, doc_type, doc_id, event, internal, visitor_id, device_type, os, browser, city, region, country, meta, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (sp.get('doc_type')) q = q.eq('doc_type', sp.get('doc_type'));
    if (sp.get('since')) q = q.gte('created_at', sp.get('since'));
    if (sp.get('internal') !== '1') q = q.eq('internal', false);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Attach the document number / customer so the feed reads as sentences.
    const events = data || [];
    const estIds = Array.from(new Set(events.filter((e) => e.doc_type === 'estimate').map((e) => e.doc_id)));
    const invIds = Array.from(new Set(events.filter((e) => e.doc_type === 'invoice').map((e) => e.doc_id)));
    const [ests, invs] = await Promise.all([
      estIds.length ? supabase.from('estimates').select('id, estimate_number, project_name, division, customer:customers(first_name, last_name, company_name)').in('id', estIds) : Promise.resolve({ data: [] as any[] }),
      invIds.length ? supabase.from('invoices').select('id, invoice_number, customer:customers(first_name, last_name, company_name)').in('id', invIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const docs: Record<string, any> = {};
    (ests.data || []).forEach((d: any) => { docs[d.id] = { number: d.estimate_number, project_name: d.project_name, division: d.division, customer: d.customer }; });
    (invs.data || []).forEach((d: any) => { docs[d.id] = { number: d.invoice_number, customer: d.customer }; });
    return NextResponse.json({ events: events.map((e) => ({ ...e, doc: docs[e.doc_id] || null })) });
  } catch (err) {
    console.error('[document-events] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
