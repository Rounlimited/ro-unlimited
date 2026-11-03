import { NextRequest, NextResponse } from 'next/server';
import { draftUpdate } from '@/lib/customer-updates';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
type Ctx = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const out = await draftUpdate(params.id);
    return NextResponse.json(out);
  } catch (err) {
    console.error('[estimates/update/draft]', err);
    return NextResponse.json({ draft: null, error: 'Server error' }, { status: 500 });
  }
}
