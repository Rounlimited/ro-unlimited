import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity/client';

// Next.js 14+ route segment config
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) as ${type}...`);

    const buffer = Buffer.from(await file.arrayBuffer());

    const asset = await sanityWriteClient.assets.upload(
      type === 'video' ? 'file' : 'image',
      buffer,
      { filename: file.name, contentType: file.type }
    );

    console.log(`Upload complete: ${asset._id}`);

    return NextResponse.json({
      assetId: asset._id,
      url: asset.url,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      size: asset.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
