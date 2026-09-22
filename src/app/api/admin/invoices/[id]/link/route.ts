import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

type RouteContext = { params: { id: string } };

/**
 * Link controls for an INVOICE link — same keyring as estimates:
 * off | on | new | kill | extend (days) | expire_on (date).
 * The /i/[token] route already enforces link_enabled and expiry.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

async function status(supabase: any, id: string) {
  const { data: v } = await supabase
    .from('invoices')
    .select('id, invoice_number, share_token, share_token_expires_at, link_enabled, view_count, last_viewed_at, sent_at, status')
    .eq('id', id)
    .single();
  if (!v) return null;
  const expired = v.share_token_expires_at ? new Date(v.share_token_expires_at) < new Date() : false;
  return {
    enabled: v.link_enabled !== false,
    has_link: !!v.share_token,
    expired,
    url: v.share_token ? `${SITE}/i/${v.share_token}` : null,
    expires_at: v.share_token_expires_at,
    view_count: v.view_count || 0,
    last_viewed_at: v.last_viewed_at,
    sent_at: v.sent_at,
    signed: false,
  };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const s = await status(supabase, params.id);
    if (!s) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { action, date, days } = await req.json();
    const patch: any = {};

    if (action === 'off') {
      patch.link_enabled = false;
    } else if (action === 'on') {
      patch.link_enabled = true;
      const s = await status(supabase, params.id);
      if (s && (!s.has_link || s.expired)) {
        patch.share_token = crypto.randomBytes(16).toString('hex');
        patch.share_token_expires_at = new Date(Date.now() + 60 * 86400000).toISOString();
      }
    } else if (action === 'new') {
      patch.share_token = crypto.randomBytes(16).toString('hex');
      patch.share_token_expires_at = new Date(Date.now() + 60 * 86400000).toISOString();
      patch.link_enabled = true;
    } else if (action === 'kill') {
      patch.share_token = null;
      patch.share_token_expires_at = null;
    } else if (action === 'extend') {
      const n = Math.min(365, Math.max(1, Number(days) || 60));
      patch.share_token_expires_at = new Date(Date.now() + n * 86400000).toISOString();
    } else if (action === 'expire_on') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
        return NextResponse.json({ error: 'Pick a date' }, { status: 400 });
      }
      const day = new Date(date + 'T12:00:00Z');
      day.setUTCDate(day.getUTCDate() + 1);
      const iso = day.toISOString().slice(0, 10) + 'T04:59:59.000Z';
      if (new Date(iso) < new Date()) {
        return NextResponse.json({ error: 'That date has already passed' }, { status: 400 });
      }
      patch.share_token_expires_at = iso;
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const { error } = await supabase.from('invoices').update(patch).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const s = await status(supabase, params.id);
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
