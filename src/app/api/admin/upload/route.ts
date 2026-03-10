import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// This route only handles small image uploads from UploadModal (multipart/form-data, <4.5MB)
// Video uploads go DIRECTLY from the browser to Sanity CDN — see site-editor/page.tsx
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isVideo = file.type.startsWith('video/') || (type?.includes('Video')) || type === 'video';

    const asset = await sanityWriteClient.assets.upload(
      isVideo ? 'file' : 'image',
      buffer,
      { filename: file.name, contentType: file.type }
    );

    const fieldMap: Record<string, string> = {
      heroVideo: 'heroVideo',
      commercialVideo: 'commercialVideo',
    };
    const sanityField = fieldMap[type];
    if (sanityField) {
      await sanityWriteClient.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings' });
      await sanityWriteClient.patch('siteSettings').set({
        [sanityField]: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
      }).commit();
    }

    return NextResponse.json({
      assetId: asset._id,
      url: asset.url,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
