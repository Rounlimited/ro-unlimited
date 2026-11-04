import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** The plain-language glossary the assistant and the customer pages reuse on every job. */
export async function GET() {
  const { data } = await createAdminClient().from('portal_faq').select('*').order('term');
  return NextResponse.json({ entries: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const term = String(body.term || '').trim().slice(0, 120), answer = String(body.answer || '').trim().slice(0, 1500);
  if (!term || !answer) return NextResponse.json({ error: 'Need the term and the answer' }, { status: 400 });
  const { data, error } = await createAdminClient().from('portal_faq').insert({ term, answer, tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 8) : [], source: body.source || 'admin' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, entry: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const patch: any = { updated_at: new Date().toISOString() };
  if (body.term !== undefined) patch.term = String(body.term).trim().slice(0, 120);
  if (body.answer !== undefined) patch.answer = String(body.answer).trim().slice(0, 1500);
  if (body.active !== undefined) patch.active = !!body.active;
  const { data, error } = await createAdminClient().from('portal_faq').update(patch).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, entry: data });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await createAdminClient().from('portal_faq').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
