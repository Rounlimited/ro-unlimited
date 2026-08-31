import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('company_letters').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
  return NextResponse.json({ letter: data });
}

/** PATCH — JR edits any part of it before it prints. */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const fields: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of ['title', 'subject', 'body', 'closing', 'recipient_name',
      'recipient_company', 'recipient_address', 'signer_name', 'signer_title', 'doc_type']) {
      if (body[k] !== undefined) fields[k] = body[k];
    }
    const { data, error } = await supabase
      .from('company_letters').update(fields).eq('id', params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ letter: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('company_letters').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
