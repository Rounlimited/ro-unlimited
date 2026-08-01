import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { token: string } };

// POST /api/proposal/[token]/respond
// body: { type: 'approval'|'comment'|'answers', comment?, answers? }
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type;
    if (!['approval', 'comment', 'answers'].includes(type)) {
      return NextResponse.json({ error: 'Invalid response type' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: doc, error } = await supabase
      .from('dev_proposals')
      .select('id, status, responses')
      .eq('share_token', params.token)
      .single();

    if (error || !doc || doc.status === 'draft') {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
