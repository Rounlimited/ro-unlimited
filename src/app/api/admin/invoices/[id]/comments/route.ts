import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST — admin reply on the invoice thread (shows on the customer link too).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const text = String(body.body || '').trim();
    if (!text) return NextResponse.json({ error: 'Write a reply first' }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ error: 'Replies are limited to 2000 characters' }, { status: 400 });

    const { data: inv } = await supabase.from('invoices').select('id').eq('id', params.id).single();
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const { data: comment, error } = await supabase
      .from('invoice_comments')
      .insert({ invoice_id: params.id, author: 'admin', name: body.name || 'RO Unlimited', body: text })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comment });
  } catch (err) {
    console.error('[admin invoice comments] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
