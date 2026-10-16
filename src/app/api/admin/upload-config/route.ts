import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, roleOf } from '@/lib/supabase/server';

// Hands out the Sanity WRITE token — owners/devs only.
export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user || !['admin', 'super_admin'].includes(roleOf(user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3at2yyx0',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
  });
}
