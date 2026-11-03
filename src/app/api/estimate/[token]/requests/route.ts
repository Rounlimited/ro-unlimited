import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sanityWriteClient } from '@/lib/sanity/client';
import { submitRequest } from '@/lib/customer-requests';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
type Ctx = { params: { token: string } };

const MAX_BYTES = 4 * 1024 * 1024; // Vercel request limit is 4.5MB
const OK_TYPES = /^(image\/(jpeg|png|webp|heic|heif|gif)|application\/pdf)$/i;

async function estimateFor(token: string) {
  const { data } = await createAdminClient().from('estimates').select('id, link_enabled').eq('share_token', token).single();
  if (!data) return { error: NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 }) };
  if ((data as any).link_enabled === false) return { error: NextResponse.json({ error: 'This link is paused' }, { status: 423 }) };
  return { id: data.id };
}

/** One file at a time (multipart: request_id, file) → { url, name, size, type }. The customer page uploads each, then submits. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const est = await estimateFor(params.token);
    if ('error' in est) return est.error;
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const requestId = String(form.get('request_id') || '');
    if (!file || !requestId) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That file is over 4 MB — a photo of it usually works' }, { status: 413 });
    if (!OK_TYPES.test(file.type)) return NextResponse.json({ error: 'Photos and PDFs only' }, { status: 415 });
    const { data: reqRow } = await createAdminClient().from('customer_requests').select('id').eq('id', requestId).eq('estimate_id', est.id).maybeSingle();
    if (!reqRow) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await sanityWriteClient.assets.upload(file.type.startsWith('image/') ? 'image' : 'file', buffer, { filename: file.name, contentType: file.type });
    return NextResponse.json({ url: asset.url, name: file.name, size: file.size, type: file.type, asset_id: asset._id });
  } catch (err: any) {
    console.error('[estimate/requests] PUT', err);
    return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 });
  }
}

/** Submit: { request_id, text?, files: [{url,name,size,type}] } */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const est = await estimateFor(params.token);
    if ('error' in est) return est.error;
    const body = await req.json();
    const files = (Array.isArray(body.files) ? body.files : []).filter((f: any) => f && typeof f.url === 'string' && /^https:\/\/cdn\.sanity\.io\//.test(f.url))
      .map((f: any) => ({ url: f.url, name: String(f.name || 'file').slice(0, 120), size: Number(f.size) || 0, type: String(f.type || '') }));
    const text = String(body.text || '').trim().slice(0, 2000) || null;
    if (!body.request_id) return NextResponse.json({ error: 'request_id required' }, { status: 400 });
    if (!text && !files.length) return NextResponse.json({ error: 'Add a note or a file first' }, { status: 400 });
    const out = await submitRequest({ estimateId: est.id, requestId: String(body.request_id), text, files });
    if (!out.request) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json({ ok: true, request: out.request });
  } catch (err) {
    console.error('[estimate/requests] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
