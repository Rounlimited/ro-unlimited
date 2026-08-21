import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Customer signature on the public invoice — DocuSign-lite. One signature
 * per invoice, immutable once placed, stamped with time + hashed IP.
 * Notifies the admin.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const name = String(body.name || '').trim();
    const sig = String(body.signature_data || '');

    if (name.length < 2) return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 });
    if (!sig.startsWith('data:image/png;base64,') || sig.length < 500) {
      return NextResponse.json({ error: 'Please draw your signature before submitting' }, { status: 400 });
    }
    if (sig.length > 300_000) return NextResponse.json({ error: 'Signature image too large' }, { status: 400 });

    const { data: inv } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, link_enabled, share_token_expires_at, signed_at, project_name, total, amount_paid')
      .eq('share_token', params.token)
      .single();
    if (!inv || inv.status === 'draft') return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!inv.link_enabled) return NextResponse.json({ error: 'This invoice link has been turned off' }, { status: 410 });
    if (inv.share_token_expires_at && new Date(inv.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invoice link has expired' }, { status: 410 });
    }
    if (inv.signed_at) return NextResponse.json({ error: 'This invoice has already been signed' }, { status: 409 });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const signed_at = new Date().toISOString();
    const { error } = await supabase.from('invoices').update({
      signed_at,
      signed_name: name.slice(0, 120),
      signature_data: sig,
      signer_ip_hash: crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24),
      updated_at: signed_at,
    }).eq('id', inv.id);
    if (error) return NextResponse.json({ error: 'Could not save signature' }, { status: 500 });

    await supabase.from('admin_notifications').insert({
      type: 'invoice_signed',
      title: `Invoice signed: ${inv.invoice_number}`,
      body: `${name} signed invoice ${inv.invoice_number}${inv.project_name ? ` (${inv.project_name})` : ''}.`,
      url: `/admin/invoices/${inv.id}`,
      reference_id: inv.id,
    }).then(() => {}, () => {});

    return NextResponse.json({ signed: true, signed_at, signed_name: name });
  } catch (err) {
    console.error('[invoice sign] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
