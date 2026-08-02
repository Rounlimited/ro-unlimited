import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity/client';

type RouteContext = { params: { token: string } };

const Q = `*[_type == "devProposal" && shareToken == $token][0]{
  _id, title, templateId, status, content, approvedAt, viewedAt
}`;

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const doc = await sanityWriteClient.fetch(Q, { token: params.token });
    if (!doc || doc.status === 'draft') {
      return NextResponse.json({ error: 'Proposal not found or link expired' }, { status: 404 });
    }

    // First open: published -> viewed
    if (doc.status === 'published') {
      const now = new Date().toISOString();
      await sanityWriteClient.patch(doc._id).set({ status: 'viewed', viewedAt: now }).commit();
      doc.status = 'viewed';
    }

    return NextResponse.json({
      title: doc.title,
      template_id: doc.templateId,
      status: doc.status,
      content: doc.content ? JSON.parse(doc.content) : {},
      approved_at: doc.approvedAt || null,
    });
  } catch (e: unknown) {
    console.error('[proposal GET]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
