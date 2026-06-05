import { NextRequest, NextResponse } from 'next/server';
import { sanityClient, sanityWriteClient } from '@/lib/sanity/client';
import { createAdminClient } from '@/lib/supabase/server';

// Maintenance mode lives in Supabase (app_settings) because the Sanity token is
// read-only. Map the camelCase API fields to the app_settings keys.
const MAINTENANCE_FIELDS: Record<string, string> = {
  maintenanceMode: 'maintenance_mode',
  maintenanceMessage: 'maintenance_message',
};

async function readMaintenance() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_message']);
    const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
    return {
      maintenanceMode: map['maintenance_mode'] === true,
      maintenanceMessage: typeof map['maintenance_message'] === 'string' ? map['maintenance_message'] : '',
    };
  } catch {
    return { maintenanceMode: false, maintenanceMessage: '' };
  }
}

export async function GET() {
  let settings: Record<string, any> = {};
  try {
    settings = await sanityClient.fetch(
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
    ) || {};
  } catch (error: any) {
    console.error('Settings fetch error:', error);
  }
  // Maintenance state always comes from Supabase (source of truth)
  const maint = await readMaintenance();
  return NextResponse.json({ ...settings, ...maint });
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

    // Maintenance fields are stored in Supabase, not Sanity.
    if (field in MAINTENANCE_FIELDS) {
      const key = MAINTENANCE_FIELDS[field];
      const normalized = field === 'maintenanceMode' ? value === true : value;
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value: normalized, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, [field]: normalized });
    }

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
