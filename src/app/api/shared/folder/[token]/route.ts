import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getShare(supabase: any, token: string) {
  const { data: share } = await supabase
    .from('folder_shares')
    .select('*')
    .eq('token', token)
    .single();
  if (!share) return null;
  if (share.expires_at && new Date(share.expires_at) < new Date()) return null;
  return share;
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const share = await getShare(supabase, params.token);
  if (!share) return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });

  // Increment access count
  await supabase.from('folder_shares').update({ accessed_count: (share.accessed_count || 0) + 1 }).eq('id', share.id);

  // Get files
  const { data: files } = await supabase
    .from('user_files')
    .select('id, original_filename, mime_type, file_size, telegram_file_id, folder, created_at')
    .eq('user_email', share.user_email)
    .like('folder', `${share.folder_path}%`)
    .order('original_filename');

  // Get explicit folders under this share
  const { data: folders } = await supabase
    .from('user_folders')
    .select('id, path, name')
    .eq('user_email', share.user_email)
    .like('path', `${share.folder_path}%`);

  return NextResponse.json({
    folder_path: share.folder_path,
    user_email: share.user_email,
    permission: share.permission,
    files: files || [],
    folders: folders || [],
  });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const share = await getShare(supabase, params.token);
  if (!share) return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
  if (share.permission !== 'readwrite') return NextResponse.json({ error: 'Read-only access' }, { status: 403 });

  const body = await req.json();

  // Create folder
  if (body.action === 'create_folder') {
    const { path, name } = body;
    if (!path || !name) return NextResponse.json({ error: 'path and name required' }, { status: 400 });
    // Ensure folder is within shared scope
    if (!path.startsWith(share.folder_path)) return NextResponse.json({ error: 'Outside shared folder' }, { status: 403 });
    const { error } = await supabase.from('user_folders').insert({ path, name, user_email: share.user_email });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Save file metadata (after upload to Telegram)
  if (body.action === 'save_metadata') {
    const { filename, original_filename, mime_type, file_size, telegram_file_id, folder } = body;
    if (!telegram_file_id) return NextResponse.json({ error: 'telegram_file_id required' }, { status: 400 });
    // Ensure file goes within shared scope
    if (!folder.startsWith(share.folder_path) && folder !== share.folder_path) {
      return NextResponse.json({ error: 'Outside shared folder' }, { status: 403 });
    }
    const { error } = await supabase.from('user_files').insert({
      user_email: share.user_email,
      filename: filename || original_filename,
      original_filename,
      mime_type,
      file_size,
      telegram_file_id,
      folder,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Delete file
  if (body.action === 'delete') {
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    // Verify file belongs to this share's scope
    const { data: file } = await supabase.from('user_files').select('folder').eq('id', id).single();
    if (!file || !file.folder.startsWith(share.folder_path)) {
      return NextResponse.json({ error: 'File not in shared folder' }, { status: 403 });
    }
    await supabase.from('user_files').delete().eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // Delete folder
  if (body.action === 'delete_folder') {
    const { path } = body;
    if (!path || !path.startsWith(share.folder_path)) return NextResponse.json({ error: 'Outside shared folder' }, { status: 403 });
    // Delete files in folder
    await supabase.from('user_files').delete().eq('user_email', share.user_email).like('folder', `${path}%`);
    // Delete folder record
    await supabase.from('user_folders').delete().eq('path', path).eq('user_email', share.user_email);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
