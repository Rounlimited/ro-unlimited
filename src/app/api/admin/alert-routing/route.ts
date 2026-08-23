import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { getAlertRouting, ALERT_TYPES, DIVISIONS, type AlertRouting } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

const clean = (v: unknown): string[] => Array.isArray(v) ? Array.from(new Set(v.map((e) => String(e).trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+$/.test(e)))) : [];

/** GET → routing + the people it can route to (with push-device status). */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const [routing, { data: users }, { data: subs }] = await Promise.all([
      getAlertRouting(),
      supabase.auth.admin.listUsers({ page: 1, perPage: 200 }).then((r) => ({ data: r.data?.users || [] })),
      supabase.from('push_subscriptions').select('user_email, updated_at'),
    ]);
    const devices: Record<string, { count: number; last: string | null }> = {};
    (subs || []).forEach((s: any) => { const k = (s.user_email || '').toLowerCase(); if (!k) return; const d = (devices[k] ||= { count: 0, last: null }); d.count++; if (!d.last || s.updated_at > d.last) d.last = s.updated_at; });
    const untagged = (subs || []).filter((s: any) => !s.user_email).length;
    const people = (users || []).map((u: any) => ({
      id: u.id,
      email: String(u.email || '').toLowerCase(),
      name: u.user_metadata?.name || u.user_metadata?.full_name || u.user_metadata?.display_name || null,
      role: u.user_metadata?.role || u.app_metadata?.role || 'admin',
      devices: devices[String(u.email || '').toLowerCase()]?.count || 0,
      last_device_at: devices[String(u.email || '').toLowerCase()]?.last || null,
    })).sort((a, b) => a.email.localeCompare(b.email));
    return NextResponse.json({ routing, people, untagged_devices: untagged, alert_types: ALERT_TYPES, divisions: DIVISIONS });
  } catch (err) {
    console.error('[alert-routing] GET', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** PUT → save routing. Empty lists mean "everyone with push". */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const routing: AlertRouting = {
      default: clean(body.default),
      by_division: Object.fromEntries(Object.entries(body.by_division || {}).map(([k, v]) => [String(k).toLowerCase(), clean(v)]).filter(([, v]) => (v as string[]).length)),
      by_event: Object.fromEntries(Object.entries(body.by_event || {}).map(([k, v]) => [String(k), clean(v)]).filter(([, v]) => (v as string[]).length)),
    };
    const supabase = createAdminClient();
    const { error } = await supabase.from('app_settings').upsert({ key: 'alert_routing', value: routing }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, routing });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

/** POST {test:true} → send a test alert to the signed-in user's own devices. */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user?.email) return NextResponse.json({ error: 'No session' }, { status: 401 });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    const res = await fetch(`${siteUrl}/api/admin/push-send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-push-secret': process.env.PUSH_SECRET || '' },
      body: JSON.stringify({ title: 'Test alert — RO Unlimited', body: `This is what an estimate alert looks like on your phone. Sent to ${user.email}.`, url: '/admin/settings', tag: 'alert-test', recipients: [String(user.email).toLowerCase()] }),
    });
    const j = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, sent: j.sent ?? 0, expired: j.expired ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
