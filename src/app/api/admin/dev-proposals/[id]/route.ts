import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sanityWriteClient } from '@/lib/sanity/client';
import { getServerUser, roleOf } from '@/lib/supabase/server';

type Ctx = { params: { id: string } };

async function requireSuperAdmin(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user || roleOf(user) !== 'super_admin') return null;
  return user;
}

function toApi(doc: any) {
  if (!doc) return null;
  return {
    id: doc._id,
    title: doc.title,
    template_id: doc.templateId,
    status: doc.status,
    share_token: doc.shareToken || null,
    content: doc.content ? JSON.parse(doc.content) : {},
    responses: doc.responses ? JSON.parse(doc.responses) : [],
    viewed_at: doc.viewedAt || null,
    approved_at: doc.approvedAt || null,
    created_at: doc._createdAt,
    updated_at: doc._updatedAt,
  };
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await requireSuperAdmin(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const doc = await sanityWriteClient.getDocument(params.id);
  if (!doc || doc._type !== 'devProposal') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ proposal: toApi(doc) });
}

// PATCH: { title?, content?, action?: 'publish' | 'unpublish' }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await requireSuperAdmin(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const doc = await sanityWriteClient.getDocument(params.id);
    if (!doc || doc._type !== 'devProposal') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.title === 'string') patch.title = body.title;
    if (body.content && typeof body.content === 'object') {
      patch.content = JSON.stringify(body.content);
    }
    if (body.action === 'publish') {
      patch.shareToken = doc.shareToken || randomBytes(16).toString('hex');
      patch.status = 'published';
    } else if (body.action === 'unpublish') {
      patch.status = 'draft';
    }

    await sanityWriteClient.patch(params.id).set(patch).commit();
    const updated = await sanityWriteClient.getDocument(params.id);
    return NextResponse.json({ proposal: toApi(updated) });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await requireSuperAdmin(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await sanityWriteClient.delete(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
