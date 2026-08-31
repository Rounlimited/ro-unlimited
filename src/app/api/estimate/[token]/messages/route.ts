import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';
import { recordDocumentEvent, visitorFromCookies } from '@/lib/doc-events';

export const dynamic = 'force-dynamic';

/**
 * Questions from the customer on their project page.
 *
 * A written question beats a missed phone call: it lands in JR's alerts with
 * the job attached, and the answer stays on the page where they asked it.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const text = String(body.body || '').trim();
    const name = String(body.name || '').trim().slice(0, 120);

    if (!text) return NextResponse.json({ error: 'Write your question first' }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ error: 'Please keep it under 2000 characters' }, { status: 400 });

    const { data: est } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, division, signed_at, share_token_expires_at, customer:customers(first_name, last_name, company_name)')
      .eq('share_token', params.token)
      .single();

    if (!est) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (est.share_token_expires_at && new Date(est.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // A ceiling per project, so a stuck send button can't flood his alerts.
    const { count } = await supabase
      .from('project_messages').select('*', { count: 'exact', head: true })
      .eq('estimate_id', est.id).eq('author', 'customer');
    if ((count || 0) >= 50) {
      return NextResponse.json({ error: 'Please call us at (864) 304-0139 — this thread is full.' }, { status: 429 });
    }

    const { data: msg, error } = await supabase
      .from('project_messages')
      .insert({ estimate_id: est.id, author: 'customer', author_name: name || null, body: text })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const c: any = est.customer;
    const who = name || c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'A customer';

    await notifyTeam({
      type: 'project_question',
      title: `${who} asked a question — ${est.project_name || est.estimate_number}`,
      body: text.slice(0, 160),
      url: `/admin/estimates/${est.id}`,
      reference_id: est.id,
      division: est.division || null,
      tag: `project-question-${est.id}`,
    } as any);

    const visitor = visitorFromCookies();
    await recordDocumentEvent({
      req, docType: 'estimate', doc: est as any, event: 'message_sent',
      visitorId: visitor.id, meta: { name: who },
    }).catch(() => {});

    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error('[estimate/messages] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
