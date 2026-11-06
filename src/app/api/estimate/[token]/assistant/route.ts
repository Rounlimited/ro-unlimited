import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { askAssistant, rateAssistant } from '@/lib/assistant';
import { resolveToken, canAct, whoLabel, viewerOf, touchMember } from '@/lib/project-members';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
type Ctx = { params: { token: string } };

async function estimateFor(token: string) {
  const { data } = await createAdminClient().from('estimates').select('id, link_enabled, show_assistant, customer:customers(first_name, company_name)').eq('share_token', (await resolveToken(token)).token).single(); // __rt: personal links resolve too
  if (!data) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  if ((data as any).link_enabled === false) return { error: NextResponse.json({ error: 'This link is paused' }, { status: 423 }) };
  if ((data as any).show_assistant === false) return { error: NextResponse.json({ error: 'The assistant is off for this project — ask RO below.' }, { status: 403 }) };
  const c: any = (data as any).customer;
  return { id: data.id, name: c?.first_name || c?.company_name || null };
}

/** { question } → answer from the job's records, or a handoff that lands in JR's inbox. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const est = await estimateFor(params.token);
    if ('error' in est) return est.error;
    const body = await req.json().catch(() => ({}));
    const out = await askAssistant({ estimateId: est.id, question: String(body.question || ''), customerName: est.name });
    if (out.error) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json(out);
  } catch (err) {
    console.error('[estimate/assistant] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** { log_id, helpful } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const est = await estimateFor(params.token);
    if ('error' in est) return est.error;
    const body = await req.json().catch(() => ({}));
    const out = await rateAssistant({ estimateId: est.id, logId: String(body.log_id || ''), helpful: !!body.helpful, customerName: est.name });
    if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json(out);
  } catch (err) {
    console.error('[estimate/assistant] PATCH', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
