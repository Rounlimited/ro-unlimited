import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('file_id');
  if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 });

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_API_BASE = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
  if (!TELEGRAM_TOKEN) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const tgRes = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
  const tgData = await tgRes.json();
  if (!tgData.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const internalUrl = `${TELEGRAM_API_BASE}/file/bot${TELEGRAM_TOKEN}/${tgData.result.file_path}`;
  return NextResponse.json({ url: `/api/admin/drive/file?url=${encodeURIComponent(internalUrl)}` });
}
