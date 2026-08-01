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

    const entry = {
      at: new Date().toISOString(),
      type,
      comment: typeof body.comment === 'string' ? body.comment.slice(0, 4000) : undefined,
      answers: body.answers && typeof body.answers === 'object' ? body.answers : undefined,
      meta: { ua: req.headers.get('user-agent') || undefined },
    };

    const responses = Array.isArray(doc.responses) ? [...doc.responses, entry] : [entry];
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { responses, updated_at: now };

    if (type === 'approval') {
      patch.status = 'approved';
      patch.approved_at = now;
    } else if (doc.status !== 'approved') {
      patch.status = 'responded';
    }

    const { error: upErr } = await supabase
      .from('dev_proposals')
      .update(patch)
      .eq('id', doc.id);

    if (upErr) {
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: patch.status || doc.status });
  } catch (e: unknown) {
    console.error('[proposal respond]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
