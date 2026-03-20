import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('file_id');
  const stream = req.nextUrl.searchParams.get('stream');
  if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 });

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Use public Telegram API to get file path
  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
  const tgData = await tgRes.json();
  if (!tgData.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const filePath = tgData.result.file_path;
  const fileSize = tgData.result.file_size || 0;

  // If stream=1, proxy the actual file bytes (for large files)
  if (stream === '1') {
    const TELEGRAM_API_BASE = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
    const internalUrl = `${TELEGRAM_API_BASE}/file/bot${TELEGRAM_TOKEN}/${filePath}`;
    const fileRes = await fetch(internalUrl);
    if (!fileRes.ok) return NextResponse.json({ error: 'File download failed' }, { status: 500 });
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    return new NextResponse(fileRes.body, {
      headers: {
        'Content-Type': contentType,
        ...(fileSize ? { 'Content-Length': String(fileSize) } : {}),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Files under 20MB: direct Telegram CDN URL (fast, no proxy)
  if (fileSize <= 20 * 1024 * 1024) {
    return NextResponse.json({ url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}` });
  }

  // Larger files: return self-referencing stream URL (no auth needed)
  const token = req.nextUrl.pathname.split('/')[4]; // /api/shared/folder/[token]/file
  return NextResponse.json({ url: `/api/shared/folder/${token}/file?file_id=${fileId}&stream=1` });
}
