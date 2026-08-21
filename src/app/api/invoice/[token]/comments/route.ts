import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Customer notes/questions on the public invoice. Notifies the admin. */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const text = String(body.body || '').trim();
    const name = String(body.name || '').trim().slice(0, 120);

    if (!text) return NextResponse.json({ error: 'Write a note first' }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ error: 'Notes are limited to 2000 characters' }, { status: 400 });

    const { data: inv } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, link_enabled, share_token_expires_at, project_name')
      .eq('share_token', params.token)
      .single();
    if (!inv || inv.status === 'draft') return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!inv.link_enabled) return NextResponse.json({ error: 'This invoice link has been turned off' }, { status: 410 });
    if (inv.share_token_expires_at && new Date(inv.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invoice link has expired' }, { status: 410 });
    }

    // spam ceiling per invoice
    const { count } = await supabase
      .from('invoice_comments').select('*', { count: 'exact', head: true })
      .eq('invoice_id', inv.id).eq('author', 'customer');
    if ((count || 0) >= 30) {
      return NextResponse.json({ error: 'Comment limit reached — give us a call at (864) 304-0139' }, { status: 429 });
    }

    const { data: comment, error } = await supabase
      .from('invoice_comments')
      .insert({ invoice_id: inv.id, author: 'customer', name: name || null, body: text })
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Could not save note' }, { status: 500 });

    await supabase.from('admin_notifications').insert({
      type: 'invoice_comment',
      title: `Note on ${inv.invoice_number}`,
      message: `${name || 'Customer'}: ${text.slice(0, 140)}`,
      entity_type: 'invoice',
      entity_id: inv.id,
      action_url: `/admin/invoices/${inv.id}`,
    }).then(() => {}, () => {});

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('[invoice comments] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
