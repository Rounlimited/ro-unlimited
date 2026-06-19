import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy file downloads from Telegram Bot API server
// Streams the response — no size limit, no buffering
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  // When `download` is present, force a save dialog with the real filename + extension
  // (otherwise the browser would name the file after the proxy/Telegram URL with no extension).
  const asDownload = req.nextUrl.searchParams.get('download');
  const filename = req.nextUrl.searchParams.get('filename');
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
    if (asDownload) {
      // Sanitize to prevent header injection; provide both ASCII and UTF-8 names.
      const ascii = (filename || 'download').replace(/[\r\n"\\]/g, '').replace(/[/]/g, '_');
      headers['Content-Disposition'] =
        `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename || 'download')}`;
    }

    // Stream the response body directly — no buffering
    return new NextResponse(res.body, { headers });
  } catch {
    return new NextResponse('Failed to fetch file', { status: 502 });
  }
}
