import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Disable Next.js body parsing — we stream the raw body to Sanity
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Direct stream upload: Content-Type is video/* or image/*
    // Browser sends raw binary body with ?filename= and ?type= query params
    if (!contentType.includes('multipart/form-data')) {
      const url = new URL(req.url);
      const filename = url.searchParams.get('filename') || 'upload';
      const type = url.searchParams.get('type') || 'heroVideo';

      const isVideo = contentType.startsWith('video/') || type.includes('Video');

      // Get the raw body as a Web ReadableStream and convert to Node stream
      const body = req.body;
      if (!body) return NextResponse.json({ error: 'No body' }, { status: 400 });

      // Read body in chunks
      const reader = body.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);

      const asset = await sanityWriteClient.assets.upload(
        isVideo ? 'file' : 'image',
        buffer,
        { filename, contentType }
      );

      // Wire to siteSettings
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
      });
    }

    // Fallback: multipart/form-data (for image uploads from UploadModal — small files)
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
