import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity/client';

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

    const doc = await sanityWriteClient.fetch(
      `*[_type == "devProposal" && shareToken == $token][0]{ _id, status, responses }`,
      { token: params.token }
    );
    if (!doc || doc.status === 'draft') {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const entry = {
      at: new Date().toISOString(),
      type,
      comment: typeof body.comment === 'string' ? body.comment.slice(0, 4000) : undefined,
      answers: body.answers && typeof body.answers === 'object' ? body.answers : undefined,
      meta: { ua: req.headers.get('user-agent') || undefined },
    };

    const prev = doc.responses ? JSON.parse(doc.responses) : [];
    const responses = [...prev, entry];
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { responses: JSON.stringify(responses) };

    if (type === 'approval') {
      patch.status = 'approved';
      patch.approvedAt = now;
    } else if (doc.status !== 'approved') {
      patch.status = 'responded';
    }

    await sanityWriteClient.patch(doc._id).set(patch).commit();
    return NextResponse.json({ ok: true, status: patch.status || doc.status });
  } catch (e: unknown) {
    console.error('[proposal respond]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
