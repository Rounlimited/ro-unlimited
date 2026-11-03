import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { replyToQuestion } from '@/lib/questions';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

/** The whole question thread for one job (both sides), oldest first. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('project_messages')
      .select('id, author, author_name, body, created_at, answered_at, answered_by, reply_to')
      .eq('estimate_id', params.id)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const open = (data || []).filter((m) => m.author === 'customer' && !m.answered_at).length;
    return NextResponse.json({ messages: data || [], open });
  } catch (err) {
    console.error('[estimates/messages] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Answer the customer. Posts into the thread, marks open questions answered, emails the customer (notify:false to skip). */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    const user = await getServerUser(req);
    const who = String(body.answered_by || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RO Unlimited').slice(0, 80);
    const out = await replyToQuestion({
      estimateId: params.id, body: String(body.body || ''), answeredBy: who,
      questionId: body.question_id || null, notify: body.notify !== false, fromEmail: body.from_email || null,
    });
    if (!out.message) return NextResponse.json({ error: out.error || 'Could not post the answer' }, { status: 400 });
    return NextResponse.json({ ok: true, message: out.message, emailed: out.emailed, to: out.to, warning: out.error || null });
  } catch (err) {
    console.error('[estimates/messages] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
