import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

type RouteContext = { params: { id: string } };

/**
 * Link controls — JR's kill switch and keyring for a customer link.
 *
 *   off    — pause it (customer sees a friendly "we're making updates" page)
 *   on     — resume the same link (mints one if none exists or it expired)
 *   new    — issue a fresh link; the old one dies instantly
 *   kill   — delete the link outright; nothing works until a new one is issued
 *   extend — push the expiry out 60 days from today
 *
 * Pausing beats deleting for phone-call edits: same link, back on after.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

async function status(supabase: any, id: string) {
  const { data: e } = await supabase
    .from('estimates')
    .select('id, estimate_number, share_token, share_token_expires_at, link_enabled, view_count, last_viewed_at, sent_at, signed_at')
    .eq('id', id)
    .single();
  if (!e) return null;
  const expired = e.share_token_expires_at ? new Date(e.share_token_expires_at) < new Date() : false;
  return {
    enabled: e.link_enabled !== false,
    has_link: !!e.share_token,
    expired,
    url: e.share_token ? `${SITE}/estimate/${e.share_token}` : null,
    expires_at: e.share_token_expires_at,
    view_count: e.view_count || 0,
    last_viewed_at: e.last_viewed_at,
    sent_at: e.sent_at,
    signed: !!e.signed_at,
  };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const s = await status(supabase, params.id);
    if (!s) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { action } = await req.json();
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
      patch.share_token_expires_at = new Date(Date.now() + 60 * 86400000).toISOString();
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const { error } = await supabase.from('estimates').update(patch).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const s = await status(supabase, params.id);
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
