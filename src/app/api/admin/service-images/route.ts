import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET: Fetch images for a division/service (or all for a division)
// ?division=electrical&serviceId=panel-upgrades&type=gallery
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = req.nextUrl;
  const division = searchParams.get('division');
  const serviceId = searchParams.get('serviceId');
  const imageType = searchParams.get('type');

  let query = supabase.from('service_page_images').select('*');
  if (division) query = query.eq('division', division);
  if (serviceId) query = query.eq('service_id', serviceId);
  if (imageType) query = query.eq('image_type', imageType);
  query = query.order('image_type').order('sort_order', { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Add a new image
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { division, service_id, image_type, image_url, sort_order } = body;

  if (!division || !service_id || !image_type || !image_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // For hero and card, replace existing (only 1 allowed)
  if (image_type === 'hero' || image_type === 'card') {
    await supabase
      .from('service_page_images')
      .delete()
      .eq('division', division)
      .eq('service_id', service_id)
      .eq('image_type', image_type);
  }

  const { data, error } = await supabase
    .from('service_page_images')
    .insert({ division, service_id, image_type, image_url, sort_order: sort_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Update an image (reorder, change URL)
export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { id, image_url, sort_order } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (image_url !== undefined) updates.image_url = image_url;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from('service_page_images')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: Remove an image
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const id = req.nextUrl.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('service_page_images')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
