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
// NEXABIDS_AI_USERS lists who may use the AI in NexaBids; without it, the assistant's test list is used.
const mayRead = (email?: string | null) => !!email && (process.env.NEXABIDS_AI_USERS || process.env.CLAUDE_SUB_TESTERS || 'admin@nexavisiongroup.com').split(',').map((s) => s.trim().toLowerCase()).includes(email.toLowerCase());
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(req: NextRequest, { params }: Ctx) {
  const admin = createAdminClient();
  // The answer to a question he asked the AI about this bid (see action 'ask')
  const jobId = req.nextUrl.searchParams.get('job');
  if (jobId) {
    const { data: j } = await admin.from('ai_sub_jobs').select('status, status_label, result, payload').eq('id', jobId).maybeSingle();
    if (!j || (j.payload as any)?.takeoff_id !== params.id) return fail('Not found.', 404);
    return NextResponse.json({ status: j.status, label: j.status_label, result: j.status === 'done' || j.status === 'error' ? j.result : null });
  }
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
  // a big plan set is stored in pieces: hand back each piece, in order, with its size
  let file_parts: { url: string; size: number }[] | null = null;
  const { data: listed } = await admin.storage.from(BUCKET).list(params.id, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
  const pieces = (listed || []).filter((o: any) => /^part-\d+$/.test(o.name)).sort((a: any, b: any) => a.name.localeCompare(b.name));
  if (pieces.length) {
    const { data: urls } = await admin.storage.from(BUCKET).createSignedUrls(pieces.map((o: any) => `${params.id}/${o.name}`), 60 * 60 * 6);
    if (urls && urls.length === pieces.length && urls.every((u: any) => u.signedUrl)) { file_parts = pieces.map((o: any, i: number) => ({ url: urls[i].signedUrl, size: Number(o.metadata?.size) || 0 })); file_url = null; }
  }
  return NextResponse.json({ ...row, data: normalizeTakeoff(row.data), file_url, file_parts, can_read: mayRead(user?.email) });
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
    const { error: jErr } = await admin.from('ai_sub_jobs').insert({ user_id: user!.id, user_email: user!.email || null, status: 'queued', status_label: 'Waiting to read the plans…', payload: { kind: 'read_plans', takeoff_id: t.id, file_path: t.file_path, then_draft: true } });
    if (jErr) return fail('Could not start that. Try again.', 500);
    const ai = { status: 'queued', done: 0, total: 0, sheets: {}, updated_at: now, draft: { status: 'queued', updated_at: now } };
    await admin.from('takeoffs').update({ ai }).eq('id', t.id);
    return NextResponse.json({ ok: true, ai });
  }
  // A question to the AI about this bid, answered while it looks at the sheet he is on
  if (body.action === 'ask') {
    const user = await getServerUser(req).catch(() => null);
    if (!mayRead(user?.email)) return fail('The AI is not switched on for this sign-in yet.', 403);
    const { data: t } = await admin.from('takeoffs').select('id, file_path').eq('id', params.id).maybeSingle();
    if (!t?.file_path) return fail('Those plans are not here any more.', 404);
    const msgs = (Array.isArray(body.messages) ? body.messages : []).filter((m: any) => m && typeof m.content === 'string' && m.content.trim()).slice(-10).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 1500) }));
    const page = Math.floor(Number(body.page)) || 1;
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return fail('Type a question first.');
    const { data: job, error: jErr } = await admin.from('ai_sub_jobs').insert({ user_id: user!.id, user_email: user!.email || null, status: 'queued', status_label: 'Looking at the sheet…',
      payload: { kind: 'bid_ask', takeoff_id: t.id, file_path: t.file_path, page, whole: body.whole === true, messages: msgs, item: body.item ? { name: String(body.item.name || '').slice(0, 140), what_the_ai_said: String(body.item.note || '').slice(0, 400) } : undefined } }).select('id').single();
    if (jErr || !job) return fail('Could not start that. Try again.', 500);
    return NextResponse.json({ ok: true, job: job.id });
  }
  // The AI marks where one item is on a sheet; the app then measures it from the drawing's own lines
  if (body.action === 'measure') {
    const user = await getServerUser(req).catch(() => null);
    if (!mayRead(user?.email)) return fail('The AI is not switched on for this sign-in yet.', 403);
    const { data: t } = await admin.from('takeoffs').select('id, file_path, ai').eq('id', params.id).maybeSingle();
    if (!t?.file_path) return fail('Those plans are not here any more.', 404);
    const it = body.item || {}; const page = Math.floor(Number(body.page)) || 0;
    if (!it.id || !it.name || !['count', 'area', 'length'].includes(it.kind) || page < 1) return fail('Pick the item and the sheet first.');
    const now = new Date().toISOString(); const cur = (t.ai || {}) as any;
    const { error: jErr } = await admin.from('ai_sub_jobs').insert({ user_id: user!.id, user_email: user!.email || null, status: 'queued', status_label: 'Looking for it on the sheet…',
      payload: { kind: 'measure_item', takeoff_id: t.id, file_path: t.file_path, page, item: { id: String(it.id).slice(0, 40), name: String(it.name).slice(0, 140), kind: it.kind, hint: String(it.hint || '').slice(0, 240) } } });
    if (jErr) return fail('Could not start that. Try again.', 500);
    const ai = { ...cur, measures: { ...(cur.measures || {}), [String(it.id)]: { status: 'queued', page, updated_at: now } } };
    await admin.from('takeoffs').update({ ai }).eq('id', t.id);
    return NextResponse.json({ ok: true, ai });
  }
  // Draft (or re-draft) the list of things to price from a set that has already been read
  if (body.action === 'draft') {
    const user = await getServerUser(req).catch(() => null);
    if (!mayRead(user?.email)) return fail('The AI is not switched on for this sign-in yet.', 403);
    const { data: t } = await admin.from('takeoffs').select('id, ai').eq('id', params.id).maybeSingle();
    const cur = (t?.ai || null) as any;
    if (!cur || cur.status !== 'done') return fail('Have the AI read the plans first.');
    const now = new Date().toISOString();
    const { error: jErr } = await admin.from('ai_sub_jobs').insert({ user_id: user!.id, user_email: user!.email || null, status: 'queued', status_label: 'Drafting the list…', payload: { kind: 'draft_bid', takeoff_id: t!.id } });
    if (jErr) return fail('Could not start that. Try again.', 500);
    const ai = { ...cur, updated_at: now, draft: { status: 'queued', updated_at: now } };
    await admin.from('takeoffs').update({ ai }).eq('id', t!.id);
    return NextResponse.json({ ok: true, ai });
  }
  // Build-ups he has made before (a wall with its block, grout and rebar), to reuse on the next bid
  if (body.action === 'assemblies' || body.action === 'assembly_save') {
    const { data: d } = await admin.from('app_settings').select('value').eq('key', 'nexabids_assemblies').maybeSingle();
    let list: any[] = Array.isArray((d?.value as any)?.list) ? (d!.value as any).list : [];
    if (body.action === 'assembly_save' && body.assembly?.name && Array.isArray(body.assembly.parts) && body.assembly.parts.length) {
      const a = body.assembly; const key = String(a.name).trim().toLowerCase();
      list = [{ name: String(a.name).trim().slice(0, 120), kind: a.kind, unit: a.unit, heightFt: a.heightFt, widthFt: a.widthFt, depthIn: a.depthIn, unitCost: Number(a.unitCost) || 0,
        parts: a.parts.slice(0, 12).map((p: any) => ({ name: String(p.name || '').slice(0, 80), unit: String(p.unit || '').slice(0, 8), per: Number(p.per) || 0, unitCost: Number(p.unitCost) || 0 })) },
        ...list.filter((x) => String(x.name).toLowerCase() !== key)].slice(0, 60);
      await admin.from('app_settings').upsert({ key: 'nexabids_assemblies', value: { list } }, { onConflict: 'key' });
    }
    return NextResponse.json({ list });
  }
  // Remembers what he charges for something, so the next bid can fill it in
  if (body.action === 'remember_price') {
    const name = String(body.name || '').trim().slice(0, 120); const price = Number(body.price) || 0; const unit = String(body.unit || 'EA').slice(0, 8);
    if (!name || !(price > 0)) return fail('Nothing to remember.');
    const { data: have } = await admin.from('cost_items').select('id').ilike('name', name.replace(/[%_]/g, ' ')).eq('unit', unit).limit(1);
    if (have?.length) await admin.from('cost_items').update({ default_cost: price, is_active: true }).eq('id', have[0].id);
    else { const { error } = await admin.from('cost_items').insert({ name, category: 'material', trade: 'NexaBids', unit, default_cost: price, default_markup_percent: 0, is_active: true }); if (error) return fail(error.message, 500); }
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'pricing_defaults') {
    if (body.pricing) await admin.from('app_settings').upsert({ key: 'nexabids_pricing', value: body.pricing }, { onConflict: 'key' });
    const { data: d } = await admin.from('app_settings').select('value').eq('key', 'nexabids_pricing').maybeSingle();
    return NextResponse.json({ pricing: d?.value || null });
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
  const lines = takeoffLines(normalizeTakeoff(row.data), `From plans: ${row.name}`.slice(0, 120), body.include_alts === true);
  if (!lines.length) return fail('Nothing has been measured yet.');
  const { data: last } = await admin.from('estimate_line_items').select('sort_order').eq('estimate_id', est.id).order('sort_order', { ascending: false }).limit(1);
  const first = (last?.[0]?.sort_order || 0) + 1;
  const rows = lines.map((l, i) => ({
    estimate_id: est.id, phase: l.phase, category: l.category, description: l.description, quantity: l.quantity, unit: l.unit,
    unit_cost: l.unit_cost, markup_percent: 0, total: Math.round(l.quantity * l.unit_cost * 100) / 100, sort_order: first + i,
  }));
  const { error } = await admin.from('estimate_line_items').insert(rows);
  if (error) return fail(error.message, 500);

  // His overhead, profit and contingency go onto the estimate when he asks for that (same percents, same arithmetic)
  const pr = normalizeTakeoff(row.data).pricing;
  if (body.apply_pricing === true && pr) await admin.from('estimates').update({ overhead_percent: pr.overheadPct, markup_percent: pr.profitPct, contingency_percent: pr.contingencyPct }).eq('id', est.id);
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
  const { data: left } = await admin.storage.from(BUCKET).list(params.id, { limit: 100 });
  if (left && left.length) await admin.storage.from(BUCKET).remove(left.map((o: any) => `${params.id}/${o.name}`)).catch(() => null);
  const { error } = await admin.from('takeoffs').delete().eq('id', params.id);
  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true });
}
