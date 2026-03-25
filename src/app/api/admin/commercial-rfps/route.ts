import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity/client';
import {
  commercialRfpListProjection,
  type CommercialRfpListItem,
} from '@/lib/sanity/commercial-rfp-admin';

/**
 * GET — list commercial RFP submissions (admin UI).
 * Query: ?status=new|in_review|contacted|closed (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')?.trim() || '';

    const filter =
      status !== ''
        ? `*[_type == "commercialRfp" && status == $status] | order(submittedAt desc) ${commercialRfpListProjection}`
        : `*[_type == "commercialRfp"] | order(submittedAt desc) ${commercialRfpListProjection}`;

    const rows = await sanityClient.fetch<CommercialRfpListItem[]>(
      filter,
      status !== '' ? { status } : {}
    );

    return NextResponse.json(rows ?? []);
  } catch (err) {
    console.error('[commercial-rfps] GET error:', err);
    return NextResponse.json({ error: 'Failed to load RFPs' }, { status: 500 });
  }
}
