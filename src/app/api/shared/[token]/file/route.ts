import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Stream a single-file share's bytes with the real filename + extension.
// (Linking straight to the Telegram URL names the download "file_NNN" with no
// extension, because the <a download> attribute is ignored for cross-origin URLs.)
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { data: share } = await supabase
    .from('file_shares')
    .select('*, file:user_files(*)')
    .eq('token', params.token)
    .single();

  if (!share || !share.file) return new NextResponse('Not found', { status: 404 });
  if (share.expires_at && new Date(share.expires_at) < new Date())
    return new NextResponse('Link expired', { status: 410 });

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) return new NextResponse('Not configured', { status: 500 });

  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${share.file.telegram_file_id}`);
  const tgData = await tgRes.json();
  if (!tgData.ok) return new NextResponse('File not found', { status: 404 });

  // Download from the SAME host the getFile lookup used (public Telegram CDN) — the
  // file lives on Telegram's cloud, not the Oracle server.
  let fileRes: Response;
  try {
    fileRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${tgData.result.file_path}`);
  } catch {
    return new NextResponse('Download failed', { status: 502 });
  }
  if (!fileRes.ok) return new NextResponse('Download failed', { status: 502 });

  const original = share.file.original_filename || 'download';
  const ascii = original.replace(/[\r\n"\\]/g, '').replace(/[/]/g, '_');
  const headers: Record<string, string> = {
    'Content-Type': fileRes.headers.get('content-type') || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(original)}`,
    'Cache-Control': 'private, max-age=0',
  };
  if (tgData.result.file_size) headers['Content-Length'] = String(tgData.result.file_size);

  return new NextResponse(fileRes.body, { headers });
}
