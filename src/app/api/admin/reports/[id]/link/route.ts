import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { newUniqueReportToken } from '@/lib/progress-reports';

type RouteContext = { params: { id: string } };

/**
 * Link controls for a PROGRESS REPORT link — same keyring as estimates
 * and invoices: off | on | new | kill | extend (days) | expire_on (date).
 * Reports never expire unless JR sets a date.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

async function status(supabase: any, id: string) {
  const { data: r } = await supabase
    .from('progress_reports')
    .select('id, share_token, share_token_expires_at, link_enabled, view_count, last_viewed_at, sent_at, status')
    .eq('id', id)
    .single();
  if (!r) return null;
  const expired = r.share_token_expires_at ? new Date(r.share_token_expires_at) < new Date() : false;
  return {
    enabled: r.link_enabled !== false,
    has_link: !!r.share_token && r.status === 'sent',
    expired,
    url: r.share_token && r.status === 'sent' ? `${SITE}/r/${r.share_token}` : null,
    expires_at: r.share_token_expires_at,
    view_count: r.view_count || 0,
    last_viewed_at: r.last_viewed_at,
    sent_at: r.sent_at,
    signed: false,
  };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const s = await status(supabase, params.id);
    if (!s) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
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
      if (s && s.expired) patch.share_token_expires_at = null;
    } else if (action === 'new') {
      patch.share_token = await newUniqueReportToken(supabase);
      patch.share_token_expires_at = null;
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

    const { error } = await supabase.from('progress_reports').update(patch).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const s = await status(supabase, params.id);
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
