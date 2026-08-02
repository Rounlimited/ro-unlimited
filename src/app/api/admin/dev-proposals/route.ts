import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity/client';
import { getServerUser, roleOf } from '@/lib/supabase/server';

// Dev Proposals — super_admin only. Stored as Sanity docs (_type 'devProposal').

async function requireSuperAdmin(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user || roleOf(user) !== 'super_admin') return null;
  return user;
}

const LIST_FIELDS = `_id, title, templateId, status, shareToken, viewedAt, approvedAt, _createdAt, _updatedAt, responses`;

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

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const docs = await sanityWriteClient.fetch(
      `*[_type == "devProposal"] | order(_updatedAt desc) { ${LIST_FIELDS} }`
    );
    const proposals = (docs || []).map((d: any) => ({
      id: d._id,
      title: d.title,
      template_id: d.templateId,
      status: d.status,
      share_token: d.shareToken || null,
      responses: d.responses ? JSON.parse(d.responses) : [],
      viewed_at: d.viewedAt || null,
      approved_at: d.approvedAt || null,
      created_at: d._createdAt,
      updated_at: d._updatedAt,
    }));
    return NextResponse.json({ proposals });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const doc = await sanityWriteClient.create({
      _type: 'devProposal',
      title: body.title || 'Untitled proposal',
      templateId: body.template_id || 'upgrade-proposal',
      status: 'draft',
      content: JSON.stringify(body.content || {}),
      responses: '[]',
      createdBy: user.email || user.id,
    });
    const full = await sanityWriteClient.getDocument(doc._id);
    return NextResponse.json({ proposal: toApi(full) });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
