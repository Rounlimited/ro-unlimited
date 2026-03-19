import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Self-hosted server for both upload (2GB) and download (no 20MB limit)
const TELEGRAM_API = `${process.env.TELEGRAM_API_URL || 'https://api.telegram.org'}/bot${TELEGRAM_TOKEN}`;
// We use a private channel/chat to store files — bot sends to itself
// First message to the bot creates the chat_id
const STORAGE_CHAT_ID = process.env.TELEGRAM_STORAGE_CHAT_ID || '';

export const dynamic = 'force-dynamic';

// GET — list files for user
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('user');
  const folder = searchParams.get('folder');
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');
  const search = searchParams.get('search');

  let query = supabase
    .from('user_files')
    .select('*')
    .order('created_at', { ascending: false });

  if (userEmail) query = query.eq('user_email', userEmail);
  if (folder) query = query.eq('folder', folder);
  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let files = data || [];
  if (search) {
    const s = search.toLowerCase();
    files = files.filter(f => f.original_filename.toLowerCase().includes(s) || f.folder?.toLowerCase().includes(s));
  }

  // Calculate storage used
  const totalBytes = files.reduce((sum, f) => sum + (f.file_size || 0), 0);

  // Fetch explicit folders for this user
  let foldersQuery = supabase.from('user_folders').select('*').order('name');
  if (userEmail) foldersQuery = foldersQuery.eq('user_email', userEmail);
  const { data: folders } = await foldersQuery;

  return NextResponse.json({ files, totalBytes, folders: folders || [] });
}

// POST — upload file or manage files
export async function POST(req: NextRequest) {
  if (!TELEGRAM_TOKEN) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  const supabase = createAdminClient();
  const contentType = req.headers.get('content-type') || '';

  // Handle JSON actions (delete, move, rename)
  if (contentType.includes('application/json')) {
    const body = await req.json();

    if (body.action === 'delete') {
      const { error } = await supabase.from('user_files').delete().eq('id', body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'move') {
      const { error } = await supabase.from('user_files').update({ folder: body.folder }).eq('id', body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'rename') {
      const { error } = await supabase.from('user_files').update({ original_filename: body.filename }).eq('id', body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'get_download_url') {
      // Get temporary download URL from Telegram
      const { data: file } = await supabase.from('user_files').select('telegram_file_id').eq('id', body.id).single();
      if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

      // Use public API for getFile (works for all files) then download through public CDN
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${file.telegram_file_id}`);
      const tgData = await tgRes.json();
      if (!tgData.ok) return NextResponse.json({ error: 'Failed to get file from Telegram' }, { status: 500 });

      const filePath = tgData.result.file_path;
      const fileSize = tgData.result.file_size || 0;

      // Public API download limit is 20MB. Use proxy for larger files.
      if (fileSize > 20 * 1024 * 1024) {
        // Large file — proxy through our server-side fetch (server→Telegram CDN→user)
        return NextResponse.json({ url: `/api/admin/drive/file?url=${encodeURIComponent(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`)}` });
      }
      // Small file — direct Telegram CDN URL (fast, HTTPS, no proxy needed)
      return NextResponse.json({ url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}` });
    }

    if (body.action === 'create_folder') {
      const { path, name, user_email } = body;
      if (!path || !name || !user_email) return NextResponse.json({ error: 'path, name, and user_email required' }, { status: 400 });
      const { data, error } = await supabase.from('user_folders').upsert({
        user_email, path, name,
      }, { onConflict: 'user_email,path' }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, folder: data });
    }

    if (body.action === 'share_folder') {
      const { folder_path, permission, user_email } = body;
      if (!folder_path || !user_email) return NextResponse.json({ error: 'folder_path and user_email required' }, { status: 400 });
      const crypto = await import('crypto');
      const token = crypto.randomBytes(24).toString('hex');
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      const { data, error } = await supabase.from('folder_shares').insert({
        folder_path, user_email, token,
        permission: permission || 'read',
        expires_at: expires.toISOString(),
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      return NextResponse.json({ share: data, link: `${baseUrl}/shared/folder/${token}` });
    }

    if (body.action === 'delete_folder') {
      const { path, user_email } = body;
      if (!path || !user_email) return NextResponse.json({ error: 'path and user_email required' }, { status: 400 });
      // Delete the folder record
      await supabase.from('user_folders').delete().eq('user_email', user_email).eq('path', path);
      // Delete all subfolders
      await supabase.from('user_folders').delete().eq('user_email', user_email).like('path', path + '/%');
      return NextResponse.json({ success: true });
    }

    if (body.action === 'share') {
      const { file_id, permission, user_email } = body;
      if (!file_id || !user_email) return NextResponse.json({ error: 'file_id and user_email required' }, { status: 400 });
      const crypto = await import('crypto');
      const token = crypto.randomBytes(24).toString('hex');
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // 30-day expiry

      const { data, error } = await supabase.from('file_shares').insert({
        file_id,
        token,
        permission: permission || 'read',
        created_by: user_email,
        expires_at: expires.toISOString(),
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      return NextResponse.json({
        share: data,
        link: `${baseUrl}/shared/${token}`,
      });
    }

    if (body.action === 'list_shares') {
      const { file_id } = body;
      if (!file_id) return NextResponse.json({ error: 'file_id required' }, { status: 400 });
      const { data } = await supabase.from('file_shares').select('*').eq('file_id', file_id).order('created_at', { ascending: false });
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      return NextResponse.json({
        shares: (data || []).map(s => ({ ...s, link: `${baseUrl}/shared/${s.token}` })),
      });
    }

    if (body.action === 'delete_share') {
      const { share_id } = body;
      if (!share_id) return NextResponse.json({ error: 'share_id required' }, { status: 400 });
      await supabase.from('file_shares').delete().eq('id', share_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  // Handle multipart file upload
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const userEmail = formData.get('user_email') as string;
  const folder = (formData.get('folder') as string) || 'general';
  const entityType = formData.get('entity_type') as string || null;
  const entityId = formData.get('entity_id') as string || null;

  if (!file || !userEmail) {
    return NextResponse.json({ error: 'file and user_email required' }, { status: 400 });
  }

  // Check file size (2GB limit with self-hosted Bot API, 50MB with public API)
  const maxSize = process.env.TELEGRAM_API_URL ? 2 * 1024 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large. Maximum ${process.env.TELEGRAM_API_URL ? '2GB' : '50MB'}.` }, { status: 413 });
  }

  // Determine storage chat — use bot's own saved messages or a channel
  let chatId = STORAGE_CHAT_ID;
  if (!chatId) {
    // Get bot's own chat_id by sending to the bot's ID
    // We need a chat to send to — use the bot's updates to find one, or create via getUpdates
    const updatesRes = await fetch(`${TELEGRAM_API}/getUpdates?limit=1`);
    const updates = await updatesRes.json();
    if (updates.ok && updates.result?.length > 0) {
      chatId = String(updates.result[0].message?.chat?.id || '');
    }
    if (!chatId) {
      return NextResponse.json({
        error: 'Telegram storage not initialized. Send any message to the bot first to activate it.',
        setup_required: true
      }, { status: 503 });
    }
  }

  // Upload to Telegram
  const tgForm = new FormData();
  tgForm.append('chat_id', chatId);
  tgForm.append('document', file, file.name);
  tgForm.append('caption', `${userEmail} | ${folder} | ${file.name}`);

  const tgRes = await fetch(`${TELEGRAM_API}/sendDocument`, {
    method: 'POST',
    body: tgForm,
  });

  const tgData = await tgRes.json();
  if (!tgData.ok) {
    return NextResponse.json({ error: `Telegram upload failed: ${tgData.description}` }, { status: 500 });
  }

  const doc = tgData.result.document;
  const telegramFileId = doc.file_id;

  // Save metadata to Supabase
  const { data: record, error } = await supabase
    .from('user_files')
    .insert({
      user_email: userEmail,
      filename: doc.file_name || file.name,
      original_filename: file.name,
      mime_type: doc.mime_type || file.type,
      file_size: doc.file_size || file.size,
      telegram_file_id: telegramFileId,
      folder,
      entity_type: entityType,
      entity_id: entityId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ file: record });
}
