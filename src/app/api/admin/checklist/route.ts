import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient, sanityClient } from '@/lib/sanity/client';

const DOC_ID = 'checklistData';

export async function GET() {
  try {
    const data = await sanityClient.fetch(`*[_id == "${DOC_ID}"][0]`);
    return NextResponse.json(data || {});
  } catch (error: any) {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, value } = body;

    await sanityWriteClient.createIfNotExists({
      _id: DOC_ID,
      _type: 'checklistData',
    });

    await sanityWriteClient.patch(DOC_ID).set({ [field]: value }).commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
