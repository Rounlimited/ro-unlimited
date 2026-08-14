import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity/client';

export const dynamic = 'force-dynamic';

/**
 * Public, read-only site media — ONLY the fields the public pages need to
 * render their hero videos. Exists because /api/admin/settings (which the
 * residential and commercial pages used to fetch) is auth-gated now, so
 * anonymous visitors got a 401 and the videos never mounted.
 *
 * Whitelist only — never spread the settings document into this response.
 */
export async function GET() {
  try {
    const data = await sanityClient.fetch(
      `*[_type == "siteSettings" && _id == "siteSettings"][0]{
        "heroVideoUrl": heroVideo.asset->url,
        "commercialVideoUrl": commercialVideo.asset->url,
        "residentialVideoUrl": residentialVideo.asset->url,
        heroVideoScale,
        commercialVideoScale,
        residentialVideoScale,
      }`
    );
    return NextResponse.json(data || {}, {
      headers: {
        // CDN-cacheable for a minute; media changes are rare and a 60s lag
        // after an admin swaps a video is fine.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
