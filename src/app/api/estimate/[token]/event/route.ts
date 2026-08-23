import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { recordDocumentEvent, visitorFromCookies, DocEvent } from '@/lib/doc-events';

export const dynamic = 'force-dynamic';

const ALLOWED: DocEvent[] = ['section_seen', 'time_on_page', 'options_changed'];

/**
 * Client beacon from the live estimate page: "reached the total", "reached
 * the sign block", "spent N seconds". Sent with navigator.sendBeacon on
 * page hide, so it must accept text/plain bodies and answer fast.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    let body: any = {};
    try { body = JSON.parse(await req.text()); } catch { body = {}; }
    const event = String(body.event || '') as DocEvent;
    if (!ALLOWED.includes(event)) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = createAdminClient();
    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, division, status, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();
    if (!est) return NextResponse.json({ ok: false }, { status: 404 });

    const meta: Record<string, unknown> = {};
    if (event === 'section_seen') meta.section = String(body.section || '').slice(0, 40);
    if (event === 'time_on_page') {
      meta.seconds = Math.max(0, Math.min(6 * 3600, Math.round(Number(body.seconds) || 0)));
      meta.max_scroll = Math.max(0, Math.min(100, Math.round(Number(body.max_scroll) || 0)));
    }
    if (event === 'options_changed') meta.choice = String(body.choice || '').slice(0, 120);

    const visitor = visitorFromCookies();
    await recordDocumentEvent({ req, docType: 'estimate', doc: est as any, event, meta, visitorId: visitor.isNew ? null : visitor.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
