import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser } from '@/lib/supabase/server';
import { recalcEstimateTotals, syncScheduleAmounts } from '@/lib/estimates';
import { normalizeTakeoff, takeoffLines } from '@/lib/takeoff';
import { nexaBidsAccess, NEXABIDS_LOCKED } from '@/lib/nexabids';

/** One plan set: open it (with a short-lived link to the file), save the measuring, send it to an estimate, delete it. */
export const dynamic = 'force-dynamic';
const BUCKET = 'plans';
type Ctx = { params: { id: string } };
// The plan reader runs on NexaVision's worker with the owner's own Claude subscription (test), so for now only the
// sign-ins in CLAUDE_SUB_TESTERS may start it. Everyone can see what it read.
const mayRead = (email?: string | null) => !!email && (process.env.CLAUDE_SUB_TESTERS || 'admin@nexavisiongroup.com').split(',').map((s) => s.trim().toLowerCase()).includes(email.toLowerCase());
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(req: NextRequest, { params }: Ctx) {
  const admin = createAdminClient();
  if (!(await nexaBidsAccess(admin)).active) return NextResponse.json({ error: NEXABIDS_LOCKED, locked: true }, { status: 402 });
  const { data: row, error } = await admin.from('takeoffs').select('*, estimate:estimates(id, estimate_number, project_name)').eq('id', params.id).maybeSingle();
  if (error) return fail(error.message, 500);
  if (!row) return fail('Those plans are not here any more.', 404);
  let file_url: string | null = null;
  if (row.file_path) {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(row.file_path, 60 * 60 * 6);
    file_url = signed?.signedUrl || null;
  }
  const user = await getServerUser(req).catch(() => null);
  return NextResponse.json({ ...row, data: normalizeTakeoff(row.data), file_url, can_read: mayRead(user?.email) });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string' && body.name.trim()) upd.name = body.name.trim().slice(0, 140);
  if (body.data !== undefined) upd.data = normalizeTakeoff(body.data);
  if (Number(body.page_count) > 0) upd.page_count = Math.floor(Number(body.page_count));
  const { error } = await admin.from('takeoffs').update(upd).eq('id', params.id);
  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();
  if (body.action === 'read') {
    const user = await getServerUser(req).catch(() => null);
    if (!mayRead(user?.email)) return fail('The AI plan reader is not switched on for this sign-in yet.', 403);
    const { data: t } = await admin.from('takeoffs').select('id, file_path, ai').eq('id', params.id).maybeSingle();
    if (!t?.file_path) return fail('Those plans are not here any more.', 404);
    const cur = (t.ai || null) as { status?: string; updated_at?: string } | null;
    const busy = cur && (cur.status === 'queued' || cur.status === 'working') && Date.now() - new Date(cur.updated_at || 0).getTime() < 10 * 60000;
    if (busy) return NextResponse.json({ ok: true, already: true, ai: cur });
    const now = new Date().toISOString();
    const { error: jErr } = await admin.from('ai_sub_jobs').insert({ user_id: user!.id, user_email: user!.email || null, status: 'queued', status_label: 'Waiting to read the plans…', payload: { kind: 'read_plans', takeoff_id: t.id, file_path: t.file_path } });
    if (jErr) return fail('Could not start that. Try again.', 500);
    const ai = { status: 'queued', done: 0, total: 0, sheets: {}, updated_at: now };
    await admin.from('takeoffs').update({ ai }).eq('id', t.id);
    return NextResponse.json({ ok: true, ai });
  }
  if (body.action !== 'export') return fail('Unknown action.');
  if (!(await nexaBidsAccess(admin)).active) return NextResponse.json({ error: NEXABIDS_LOCKED, locked: true }, { status: 402 });

  const { data: row } = await admin.from('takeoffs').select('id, name, data').eq('id', params.id).maybeSingle();
  if (!row) return fail('Those plans are not here any more.', 404);
  const { data: est } = await admin.from('estimates').select('id, estimate_number, status, signed_at').eq('id', String(body.estimate_id || '')).maybeSingle();
  if (!est) return fail('Pick an estimate first.');
  if (est.signed_at || est.status === 'accepted') return fail(`${est.estimate_number} is a signed contract. Added work on a signed job goes on a change order.`, 409);
  // Anything past draft is live on the customer's page: new lines and a new total would show there at once.
  if (est.status !== 'draft' && body.customer_sees_ok !== true) {
    return NextResponse.json({ error: `The customer already has ${est.estimate_number}. Lines added now show on their page right away.`, needs_ok: true }, { status: 409 });
  }

  // Quantities are worked out here from the saved measuring, never taken from the screen.
  const lines = takeoffLines(normalizeTakeoff(row.data), `From plans: ${row.name}`.slice(0, 120));
  if (!lines.length) return fail('Nothing has been measured yet.');
  const { data: last } = await admin.from('estimate_line_items').select('sort_order').eq('estimate_id', est.id).order('sort_order', { ascending: false }).limit(1);
  const first = (last?.[0]?.sort_order || 0) + 1;
  const rows = lines.map((l, i) => ({
    estimate_id: est.id, phase: l.phase, category: l.category, description: l.description, quantity: l.quantity, unit: l.unit,
    unit_cost: l.unit_cost, markup_percent: 0, total: Math.round(l.quantity * l.unit_cost * 100) / 100, sort_order: first + i,
  }));
  const { error } = await admin.from('estimate_line_items').insert(rows);
  if (error) return fail(error.message, 500);

  const [{ data: full }, { data: all }] = await Promise.all([
    admin.from('estimates').select('*').eq('id', est.id).single(),
    admin.from('estimate_line_items').select('*').eq('estimate_id', est.id),
  ]);
  let total = 0;
  if (full) {
    const totals = recalcEstimateTotals(all || [], full);
    total = totals.total;
    await admin.from('estimates').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', est.id);
    await syncScheduleAmounts(admin, est.id, totals.total);
  }
  await admin.from('takeoffs').update({ estimate_id: est.id, updated_at: new Date().toISOString() }).eq('id', row.id);
  return NextResponse.json({ ok: true, added: rows.length, estimate_id: est.id, estimate_number: est.estimate_number, total, fixed_price: Number(full?.total_override) > 0 });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = createAdminClient();
  const { data: row } = await admin.from('takeoffs').select('file_path').eq('id', params.id).maybeSingle();
  if (row?.file_path) await admin.storage.from(BUCKET).remove([row.file_path]).catch(() => null);
  const { error } = await admin.from('takeoffs').delete().eq('id', params.id);
  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true });
}
