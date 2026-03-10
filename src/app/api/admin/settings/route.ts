import { NextRequest, NextResponse } from 'next/server';
import { sanityClient, sanityWriteClient } from '@/lib/sanity/client';

export async function GET() {
  try {
    const settings = await sanityClient.fetch(
      `*[_type == "siteSettings" && _id == "siteSettings"][0]{
        "heroVideoUrl": heroVideo.asset->url,
        "heroVideoId": heroVideo.asset._ref,
        "commercialVideoUrl": commercialVideo.asset->url,
        "commercialVideoId": commercialVideo.asset._ref,
        "residentialVideoUrl": residentialVideo.asset->url,
        "residentialVideoId": residentialVideo.asset._ref,
        heroVideoScale,
        commercialVideoScale,
        residentialVideoScale,
        heroOverlayOpacity,
        heroHeadline,
        heroSubheadline,
        heroDescription
      }`
    );
    return NextResponse.json(settings || {});
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.heroVideo === null) {
      await sanityWriteClient.patch('siteSettings').unset(['heroVideo']).commit();
      return NextResponse.json({ success: true });
    }

    if (body.commercialVideo === null) {
      await sanityWriteClient.patch('siteSettings').unset(['commercialVideo']).commit();
      return NextResponse.json({ success: true });
    }

    if (body.residentialVideo === null) {
      await sanityWriteClient.patch('siteSettings').unset(['residentialVideo']).commit();
      return NextResponse.json({ success: true });
    }

    await sanityWriteClient.createIfNotExists({
      _id: 'siteSettings',
      _type: 'siteSettings',
    });

    await sanityWriteClient.patch('siteSettings').set(body).commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, value, assetRef } = body;

    await sanityWriteClient.createIfNotExists({
      _id: 'siteSettings',
      _type: 'siteSettings',
    });

    let patch: Record<string, any> = {};

    if (assetRef) {
      patch[field] = {
        _type: field.includes('Video') ? 'file' : 'image',
        asset: { _type: 'reference', _ref: assetRef },
      };
    } else {
      patch[field] = value;
    }

    const result = await sanityWriteClient.patch('siteSettings').set(patch).commit();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
