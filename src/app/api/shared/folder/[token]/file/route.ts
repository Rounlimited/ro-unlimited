import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('file_id');
  if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 });

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
  const tgData = await tgRes.json();
  if (!tgData.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  return NextResponse.json({
    url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${tgData.result.file_path}`,
  });
}
