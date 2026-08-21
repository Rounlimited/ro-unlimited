import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Accept & sign an estimate/contract from its share link — signing IS the
 * acceptance. Works on anything already in the system that has a live link.
 * One signature, immutable, timestamp + hashed IP, status history entry,
 * loud admin notification (an accepted contract is the best news the app
 * can deliver).
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

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, status, document_mode, project_name, total, signed_at, share_token_expires_at, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();
    if (!est) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    if (est.share_token_expires_at && new Date(est.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired — call us and we will resend it' }, { status: 410 });
    }
    if (est.signed_at) return NextResponse.json({ error: 'This document has already been signed' }, { status: 409 });
    if (['declined', 'expired'].includes(est.status)) {
      return NextResponse.json({ error: 'This document is no longer open for acceptance — call us at (864) 304-0139' }, { status: 409 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const signed_at = new Date().toISOString();
    const patch: Record<string, any> = {
      client_signature: sig,
      signed_at,
      signed_name: name.slice(0, 120),
      signer_ip_hash: crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24),
      updated_at: signed_at,
    };
    if (est.status !== 'accepted') {
      patch.status = 'accepted';
      patch.accepted_at = signed_at;
    }
    const { error } = await supabase.from('estimates').update(patch).eq('id', est.id);
    if (error) return NextResponse.json({ error: 'Could not save signature' }, { status: 500 });

    if (patch.status === 'accepted') {
      await supabase.from('estimate_status_history').insert({
        estimate_id: est.id,
        old_status: est.status,
        new_status: 'accepted',
        notes: `Accepted & signed by ${name} via share link`,
      }).then(() => {}, () => {});
    }

    const docWord = est.document_mode === 'contract' ? 'Contract' : 'Estimate';
    const money = '$' + Math.round(Number(est.total) || 0).toLocaleString();
    await supabase.from('admin_notifications').insert({
      type: 'estimate_signed',
      title: `🎉 ${docWord} signed: ${est.estimate_number} (${money})`,
      body: `${name} accepted and signed ${est.estimate_number}${est.project_name ? ` — ${est.project_name}` : ''}.`,
      url: `/admin/estimates/${est.id}`,
      reference_id: est.id,
    }).then(() => {}, () => {});

    return NextResponse.json({ signed: true, signed_at, signed_name: name, status: patch.status || est.status });
  } catch (err) {
    console.error('[estimate sign] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
