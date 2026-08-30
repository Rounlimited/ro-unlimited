import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

/** GET — one report. */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('progress_reports').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  return NextResponse.json({ report: { ...data, link: data.share_token ? `${siteUrl()}/r/${data.share_token}` : null } });
}

/** PATCH — JR edits the drafted summary (or the photo set) before sending. */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const fields: Record<string, any> = {};
    for (const k of ['summary', 'photos', 'next_up', 'period_start', 'period_end']) {
      if (body[k] !== undefined) fields[k] = body[k];
    }
    if (!Object.keys(fields).length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    const { data, error } = await supabase
      .from('progress_reports').update(fields).eq('id', params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ report: { ...data, link: data.share_token ? `${siteUrl()}/r/${data.share_token}` : null } });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** DELETE — throw away a draft. */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminClient();
  const { data: report } = await supabase.from('progress_reports').select('status').eq('id', params.id).single();
  if (report?.status === 'sent') {
    return NextResponse.json({ error: 'That report was already sent — it stays in the record.' }, { status: 400 });
  }
  const { error } = await supabase.from('progress_reports').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
