import { NextRequest, NextResponse } from 'next/server';
import { sanityClient, sanityWriteClient } from '@/lib/sanity/client';
import {
  commercialRfpDetailProjection,
  isCommercialRfpStatus,
  type CommercialRfpDetail,
} from '@/lib/sanity/commercial-rfp-admin';

function badId(id: string) {
  return !id || id.length > 128 || !/^[-\w]+$/.test(id);
}

type RouteCtx = { params: { id: string } };

/** GET — single RFP */
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params;
    if (badId(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const doc = await sanityClient.fetch<CommercialRfpDetail | null>(
      `*[_type == "commercialRfp" && _id == $id][0] ${commercialRfpDetailProjection}`,
      { id }
    );

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    console.error('[commercial-rfps/:id] GET error:', err);
    return NextResponse.json({ error: 'Failed to load RFP' }, { status: 500 });
  }
}

/** PATCH — update status / internal notes (admin workflow) */
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params;
    if (badId(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Sanity write token not configured' }, { status: 503 });
    }

    const body = (await req.json()) as { status?: string; notes?: string };

    const patch: Record<string, string> = {};
    if (body.status !== undefined) {
      if (!isCommercialRfpStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (body.notes !== undefined) {
      patch.notes = String(body.notes);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    const updated = await sanityWriteClient.patch(id).set(patch).commit();

    const doc = await sanityClient.fetch<CommercialRfpDetail | null>(
      `*[_type == "commercialRfp" && _id == $id][0] ${commercialRfpDetailProjection}`,
      { id: updated._id }
    );

    return NextResponse.json(doc);
  } catch (err) {
    console.error('[commercial-rfps/:id] PATCH error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
