import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy file downloads from Telegram Bot API server
// Streams the response — no size limit, no buffering
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  const allowed = [
    process.env.TELEGRAM_API_URL,
    process.env.TELEGRAM_FILE_SERVER,
    'https://api.telegram.org',
  ].filter(Boolean);
  if (!allowed.some(base => url.startsWith(base!))) {
    return new NextResponse('Invalid URL', { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse('File not found', { status: 404 });

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = res.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    // Stream the response body directly — no buffering
    return new NextResponse(res.body, { headers });
  } catch {
    return new NextResponse('Failed to fetch file', { status: 502 });
  }
}
