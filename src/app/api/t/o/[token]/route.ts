import { NextRequest } from 'next/server';
import { recordEmailEvent } from '@/lib/email-tracking';

export const dynamic = 'force-dynamic';

// 1x1 transparent GIF
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

/** Email open pixel: /api/t/o/<token>.gif */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token || '').replace(/\.gif$/i, '');
  await recordEmailEvent(req, token, 'open');
  return new Response(GIF, {
    headers: { 'Content-Type': 'image/gif', 'Content-Length': String(GIF.length), 'Cache-Control': 'no-store, no-cache, must-revalidate, private', Pragma: 'no-cache' },
  });
}
