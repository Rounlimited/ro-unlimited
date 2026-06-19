import { NextRequest, NextResponse } from 'next/server';
import { mimeFromFilename } from '@/lib/mime';

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

    // Prefer a MIME type derived from the filename's extension — Telegram serves
    // octet-stream, which makes Android rewrite the saved extension to ".bin".
    const contentType = (asDownload && mimeFromFilename(filename)) || res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = res.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    };
    if (contentLength) headers['Content-Length'] = contentLength;
    if (asDownload) {
      // Bare `filename="..."` only — Android's URLUtil.guessFileName regex requires the
      // filename at the very end with nothing after it, so no `filename*=` suffix (it
      // would make the app save as "file.bin"). Sanitize to prevent header injection.
      const ascii = (filename || 'download').replace(/[\r\n"\\]/g, '').replace(/[/]/g, '_');
      headers['Content-Disposition'] = `attachment; filename="${ascii}"`;
    }

    // Stream the response body directly — no buffering
    return new NextResponse(res.body, { headers });
  } catch {
    return new NextResponse('Failed to fetch file', { status: 502 });
  }
}
