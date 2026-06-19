import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('file_id');
  const stream = req.nextUrl.searchParams.get('stream');
  const download = req.nextUrl.searchParams.get('download');
  const filename = req.nextUrl.searchParams.get('filename');
  if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 });

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Use public Telegram API to get file path
  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
  const tgData = await tgRes.json();
  if (!tgData.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const filePath = tgData.result.file_path;
  const fileSize = tgData.result.file_size || 0;

  // Stream the actual file bytes when stream=1 (large files) or download=1 (force a
  // proper download with the real filename instead of Telegram's "file_NNN").
  if (stream === '1' || download === '1') {
    // Download from the SAME host getFile used (public Telegram CDN) — the file lives on
    // Telegram's cloud, not the Oracle server (TELEGRAM_API_URL).
    const internalUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
    let fileRes: Response;
    try {
      fileRes = await fetch(internalUrl);
    } catch {
      return NextResponse.json({ error: 'File download failed' }, { status: 502 });
    }
    if (!fileRes.ok) return NextResponse.json({ error: 'File download failed' }, { status: 500 });
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      ...(fileSize ? { 'Content-Length': String(fileSize) } : {}),
      'Cache-Control': 'public, max-age=3600',
    };
    if (download === '1') {
      const ascii = (filename || 'download').replace(/[\r\n"\\]/g, '').replace(/[/]/g, '_');
      headers['Content-Disposition'] =
        `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename || 'download')}`;
    }
    return new NextResponse(fileRes.body, { headers });
  }

  // Files under 20MB: direct Telegram CDN URL (fast, no proxy)
  if (fileSize <= 20 * 1024 * 1024) {
    return NextResponse.json({ url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}` });
  }

  // Larger files: return self-referencing stream URL (no auth needed)
  const token = req.nextUrl.pathname.split('/')[4]; // /api/shared/folder/[token]/file
  return NextResponse.json({ url: `/api/shared/folder/${token}/file?file_id=${fileId}&stream=1` });
}
