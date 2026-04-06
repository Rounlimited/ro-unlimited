import { NextRequest, NextResponse } from 'next/server';
import { sanityClient, sanityWriteClient } from '@/lib/sanity/client';

// GET — list all photos
export async function GET() {
  try {
    const photos = await sanityClient.fetch(
      `*[_type == "sitePhoto"] | order(_createdAt desc) {
        _id, url, filename, description, jobType, location, date, assetId,
        "uploadedAt": _createdAt
      }`
    );
    return NextResponse.json(photos || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create new photo doc
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, filename, assetId } = body;
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const doc = await sanityWriteClient.create({
      _type: 'sitePhoto',
      url,
      filename: filename || 'photo.jpg',
      assetId: assetId || '',
      description: '',
      jobType: '',
      location: '',
      date: '',
    });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update photo metadata
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });

    await sanityWriteClient.patch(id).set(updates).commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove photo
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });

    await sanityWriteClient.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
