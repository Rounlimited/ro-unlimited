import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { bidStage, nexaBidsAccess, NEXABIDS_LOCKED } from '@/lib/nexabids';

/**
 * Bid from Plans: the list of plan sets, and getting a plan file in.
 * A plan set can be far bigger than a request to this server may be, so the phone or computer sends the file
 * straight to private storage with a one-time upload ticket from here.
 */
export const dynamic = 'force-dynamic';
const BUCKET = 'plans';
const MAX_FILE_BYTES = 50_000_000;     // the storage plan this site is on takes 50 MB per stored file
const PART_BYTES = 40_000_000;         // so a bigger plan set is stored in pieces of this size
const MAX_SET_BYTES = 600_000_000;     // the biggest plan set taken in one go
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(req: NextRequest) {
  const admin = createAdminClient();
  const access = await nexaBidsAccess(admin);
  if (!access.active) return NextResponse.json({ error: NEXABIDS_LOCKED, locked: true, access, bids: [] }, { status: 402 });
  // Prices he has charged before whose name matches what he is typing
  if (req.nextUrl.searchParams.has('prices')) {
    const q = (req.nextUrl.searchParams.get('prices') || '').trim().replace(/[%_,()]/g, ' ').slice(0, 60);
    if (q.length < 3) return NextResponse.json([]);
    const { data } = await admin.from('cost_items').select('id, name, unit, default_cost').ilike('name', '%' + q + '%').eq('is_active', true).gt('default_cost', 0).order('updated_at', { ascending: false }).limit(6);
    return NextResponse.json(data || []);
  }
  // Estimates a takeoff can be sent to: anything not signed, newest first.
  if (req.nextUrl.searchParams.get('estimates')) {
    const q = (req.nextUrl.searchParams.get('q') || '').trim().replace(/[%,()]/g, ' ');
    let query = admin.from('estimates')
      .select('id, estimate_number, project_name, status, total, customer:customers(first_name, last_name, company_name)')
      .is('signed_at', null).in('status', ['draft', 'sent', 'viewed', 'revised'])
      .order('updated_at', { ascending: false }).limit(40);
    if (q) query = query.or(`project_name.ilike.%${q}%,estimate_number.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) return fail(error.message, 500);
    const open = (data || []).filter((e: any) => !/^(EXAMPLE|DEMO)/i.test(String(e.project_name || '')));
    // Drafts first: they are the safe place to send measuring, because no customer is looking at them.
    return NextResponse.json([...open.filter((e: any) => e.status === 'draft'), ...open.filter((e: any) => e.status !== 'draft')]);
  }
  const { data, error } = await admin.from('takeoffs')
    .select('id, name, file_name, file_size, page_count, estimate_id, created_at, updated_at, data, estimate:estimates(id, estimate_number, project_name, status, signed_at, completed_at, total)')
    .order('updated_at', { ascending: false }).limit(100);
  if (error) return fail(error.message, 500);
  return NextResponse.json({ access, bids: (data || []).map((t: any) => ({
    ...t, data: undefined, stage: bidStage(t.estimate),
    item_count: Array.isArray(t.data?.items) ? t.data.items.length : 0,
    sheets_scaled: t.data?.scales ? Object.keys(t.data.scales).length : 0,
  })) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();
  if (!(await nexaBidsAccess(admin)).active) return NextResponse.json({ error: NEXABIDS_LOCKED, locked: true }, { status: 402 });

  if (body.action === 'create') {
    const fileName = String(body.file_name || '').slice(0, 200);
    if (!/\.pdf$/i.test(fileName)) return fail('Plans need to be a PDF file.');
    const size = Number(body.file_size) || 0;
    if (size > MAX_SET_BYTES) return fail('That file is over 600 MB. Split the plan set into two PDFs and bring them in one at a time.');
    await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_FILE_BYTES }).catch(() => null);
    const name = String(body.name || fileName.replace(/\.pdf$/i, '')).trim().slice(0, 140) || 'Plans';
    const { data: row, error } = await admin.from('takeoffs').insert({ name, file_name: fileName, file_size: size || null }).select('id').single();
    if (error || !row) return fail(error?.message || 'Could not start that.', 500);
    const path = `${row.id}/plans.pdf`;
    if (size > 45_000_000) {
      // too big for one stored file: one upload ticket per piece
      const parts: { path: string; token: string; from: number; to: number }[] = [];
      for (let i = 0, from = 0; from < size; i++, from += PART_BYTES) {
        const pp = `${row.id}/part-${String(i).padStart(3, '0')}`;
        const { data: t, error: tErr } = await admin.storage.from(BUCKET).createSignedUploadUrl(pp);
        if (tErr || !t) { await admin.from('takeoffs').delete().eq('id', row.id); return fail('Could not get ready for that file. Try again.', 502); }
        parts.push({ path: pp, token: t.token, from, to: Math.min(size, from + PART_BYTES) });
      }
      await admin.from('takeoffs').update({ file_path: path }).eq('id', row.id);
      return NextResponse.json({ id: row.id, bucket: BUCKET, parts });
    }
    const { data: up, error: upErr } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (upErr || !up) {
      await admin.from('takeoffs').delete().eq('id', row.id);
      console.error('[takeoffs] upload url', upErr);
      return fail('Could not get ready for that file. Try again.', 502);
    }
    await admin.from('takeoffs').update({ file_path: path }).eq('id', row.id);
    return NextResponse.json({ id: row.id, bucket: BUCKET, path, token: up.token });
  }
  return fail('Unknown action.');
}
