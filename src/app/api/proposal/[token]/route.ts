import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { token: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();

    const { data: doc, error } = await supabase
      .from('dev_proposals')
      .select('*')
      .eq('share_token', params.token)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Proposal not found or link expired' }, { status: 404 });
    }
    if (doc.status === 'draft') {
      return NextResponse.json({ error: 'This proposal is not published yet' }, { status: 404 });
    }

    // First open: published -> viewed
    if (doc.status === 'published') {
      const now = new Date().toISOString();
      await supabase.from('dev_proposals')
        .update({ status: 'viewed', viewed_at: now, updated_at: now })
        .eq('id', doc.id);
      doc.status = 'viewed';
      doc.viewed_at = now;
    }

    // Public payload: never leak responses or internals to the viewer
    return NextResponse.json({
      title: doc.title,
      template_id: doc.template_id,
      status: doc.status,
      content: doc.content,
      approved_at: doc.approved_at,
    });
  } catch (e: unknown) {
    console.error('[proposal GET]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
