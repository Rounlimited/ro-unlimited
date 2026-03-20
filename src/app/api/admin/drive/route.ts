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

  const showTrash = searchParams.get('trash') === '1';
  const zone = searchParams.get('zone'); // 'company' | 'personal' | null

  let query = supabase
    .from('user_files')
    .select('*')
    .order('created_at', { ascending: false });

  if (zone === 'company') {
    // Company Drive — all files NOT under /personal/ from ALL users
    // Don't filter by user_email — this is shared across all admins
  } else if (zone === 'personal' && userEmail) {
    // Personal Drive — only this user's files under /personal/
    query = query.eq('user_email', userEmail);
  } else if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  if (folder) query = query.eq('folder', folder);
  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);

  // Filter by trash status
  if (showTrash) {
    query = query.not('deleted_at', 'is', null);
  } else {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let files = data || [];

  // Zone-level filtering (PostgREST can't do NOT LIKE easily)
  if (zone === 'company') {
    files = files.filter(f => !(f.folder || '/').startsWith('/personal/'));
  } else if (zone === 'personal') {
    files = files.filter(f => (f.folder || '/').startsWith('/personal/'));
  }

  if (search) {
    const s = search.toLowerCase();
    files = files.filter(f => f.original_filename.toLowerCase().includes(s) || f.folder?.toLowerCase().includes(s));
  }

  // Calculate storage used
  const totalBytes = files.reduce((sum, f) => sum + (f.file_size || 0), 0);

  // Fetch folders — company zone gets all non-personal folders from all users
  let foldersQuery = supabase.from('user_folders').select('*').order('name');
  if (zone !== 'company' && userEmail) foldersQuery = foldersQuery.eq('user_email', userEmail);
  const { data: folders } = await foldersQuery;
  let filteredFolders = folders || [];
  if (zone === 'company') {
    filteredFolders = filteredFolders.filter(f => !f.path.startsWith('/personal/'));
  } else if (zone === 'personal') {
    filteredFolders = filteredFolders.filter(f => f.path.startsWith('/personal/'));
  }

  // Auto-purge files deleted more than 30 days ago
  if (!showTrash) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await supabase.from('user_files').delete().not('deleted_at', 'is', null).lt('deleted_at', thirtyDaysAgo.toISOString());
  }

  return NextResponse.json({ files, totalBytes, folders: filteredFolders });
}

// POST — upload file or manage files
export async function POST(req: NextRequest) {
  if (!TELEGRAM_TOKEN) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  const supabase = createAdminClient();
  const contentType = req.headers.get('content-type') || '';

  // Handle JSON actions
  if (contentType.includes('application/json')) {
    const body = await req.json();

    // Save metadata only (file already uploaded directly to Telegram from client)
    if (body.action === 'save_metadata') {
      const { data, error } = await supabase.from('user_files').insert({
        user_email: body.user_email,
        filename: body.filename,
        original_filename: body.original_filename,
        mime_type: body.mime_type,
        file_size: body.file_size,
        telegram_file_id: body.telegram_file_id,
        folder: body.folder || '/',
        entity_type: body.entity_type || null,
        entity_id: body.entity_id || null,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ file: data });
    }

    if (body.action === 'delete') {
      // Soft delete — move to trash
      const { error } = await supabase.from('user_files').update({ deleted_at: new Date().toISOString() }).eq('id', body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'restore') {
      const { error } = await supabase.from('user_files').update({ deleted_at: null }).eq('id', body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'permanent_delete') {
      const { error } = await supabase.from('user_files').delete().eq('id', body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'empty_trash') {
      const { user_email } = body;
      if (!user_email) return NextResponse.json({ error: 'user_email required' }, { status: 400 });
      await supabase.from('user_files').delete().eq('user_email', user_email).not('deleted_at', 'is', null);
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
      const { folder_path, permission, user_email, password, expiry_days } = body;
      if (!folder_path || !user_email) return NextResponse.json({ error: 'folder_path and user_email required' }, { status: 400 });
      const crypto = await import('crypto');
      const perm = permission || 'read';
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

      // Cleanup expired shares while we're here
      await supabase.from('folder_shares').delete().lt('expires_at', new Date().toISOString());

      // Check for existing active share with same folder+permission (no password)
      if (!password) {
        const { data: existing } = await supabase.from('folder_shares')
          .select('*')
          .eq('folder_path', folder_path)
          .eq('user_email', user_email)
          .eq('permission', perm)
          .is('password_hash', null)
          .gt('expires_at', new Date().toISOString())
          .limit(1)
          .single();
        if (existing) {
          return NextResponse.json({ share: existing, link: `${baseUrl}/shared/folder/${existing.token}`, reused: true });
        }
      }

      const token = crypto.randomBytes(24).toString('hex');
      const expires = new Date();
      expires.setDate(expires.getDate() + (expiry_days || 30));
      const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex') : null;

      const { data, error } = await supabase.from('folder_shares').insert({
        folder_path, user_email, token,
        permission: perm,
        expires_at: expiry_days === 0 ? null : expires.toISOString(),
        password_hash: passwordHash,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ share: data, link: `${baseUrl}/shared/folder/${token}` });
    }

    if (body.action === 'list_folder_shares') {
      const { folder_path, user_email } = body;
      if (!folder_path || !user_email) return NextResponse.json({ error: 'folder_path and user_email required' }, { status: 400 });
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      const { data } = await supabase.from('folder_shares').select('*')
        .eq('folder_path', folder_path).eq('user_email', user_email)
        .order('created_at', { ascending: false });
      const now = new Date();
      return NextResponse.json({
        shares: (data || []).map(s => ({
          ...s,
          link: `${baseUrl}/shared/folder/${s.token}`,
          expired: s.expires_at ? new Date(s.expires_at) < now : false,
          has_password: !!s.password_hash,
        })),
      });
    }

    if (body.action === 'delete_folder_share') {
      const { share_id } = body;
      if (!share_id) return NextResponse.json({ error: 'share_id required' }, { status: 400 });
      await supabase.from('folder_shares').delete().eq('id', share_id);
      return NextResponse.json({ success: true });
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

    // ── User-to-user sharing ──
    if (body.action === 'share_with_user') {
      const { resource_type, resource_path, file_id, shared_with_email, permission, user_email } = body;
      if (!shared_with_email || !user_email) return NextResponse.json({ error: 'emails required' }, { status: 400 });
      if (shared_with_email === user_email) return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
      // Check if already shared
      let query = supabase.from('user_shares').select('id')
        .eq('owner_email', user_email).eq('shared_with_email', shared_with_email);
      if (resource_type === 'folder') query = query.eq('resource_type', 'folder').eq('resource_path', resource_path);
      else query = query.eq('resource_type', 'file').eq('file_id', file_id);
      const { data: existing } = await query.limit(1).single();
      if (existing) {
        // Update permission
        await supabase.from('user_shares').update({ permission: permission || 'read' }).eq('id', existing.id);
        return NextResponse.json({ success: true, updated: true });
      }
      const { error } = await supabase.from('user_shares').insert({
        resource_type: resource_type || 'folder',
        resource_path: resource_path || null,
        file_id: file_id || null,
        owner_email: user_email,
        shared_with_email,
        permission: permission || 'read',
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'list_user_shares') {
      const { user_email } = body;
      if (!user_email) return NextResponse.json({ error: 'user_email required' }, { status: 400 });
      // Shares I've given out
      const { data: outgoing } = await supabase.from('user_shares').select('*').eq('owner_email', user_email);
      // Shares given to me
      const { data: incoming } = await supabase.from('user_shares').select('*').eq('shared_with_email', user_email);
      return NextResponse.json({ outgoing: outgoing || [], incoming: incoming || [] });
    }

    if (body.action === 'delete_user_share') {
      const { share_id } = body;
      if (!share_id) return NextResponse.json({ error: 'share_id required' }, { status: 400 });
      await supabase.from('user_shares').delete().eq('id', share_id);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'get_shared_with_me') {
      const { user_email } = body;
      if (!user_email) return NextResponse.json({ error: 'user_email required' }, { status: 400 });
      // Get all shares where I'm the recipient
      const { data: shares } = await supabase.from('user_shares').select('*').eq('shared_with_email', user_email);
      if (!shares?.length) return NextResponse.json({ shares: [], files: [], folders: [] });

      // Gather all shared files and folders
      const fileShares = shares.filter(s => s.resource_type === 'file' && s.file_id);
      const folderShares = shares.filter(s => s.resource_type === 'folder' && s.resource_path);

      let sharedFiles: any[] = [];
      let sharedFolders: any[] = [];

      // Get files shared directly
      if (fileShares.length) {
        const fileIds = fileShares.map(s => s.file_id);
        const { data: files } = await supabase.from('user_files').select('*').in('id', fileIds);
        sharedFiles = (files || []).map(f => {
          const share = fileShares.find(s => s.file_id === f.id);
          return { ...f, shared_by: share?.owner_email, share_permission: share?.permission, share_id: share?.id };
        });
      }

      // Get folders and their contents
      for (const fs of folderShares) {
        const { data: files } = await supabase.from('user_files').select('*')
          .eq('user_email', fs.owner_email).like('folder', `${fs.resource_path}%`);
        const { data: folders } = await supabase.from('user_folders').select('*')
          .eq('user_email', fs.owner_email).like('path', `${fs.resource_path}%`);
        const folderName = fs.resource_path === '/' ? 'Full Drive' : fs.resource_path.split('/').filter(Boolean).pop() || fs.resource_path;
        sharedFolders.push({
          ...fs,
          name: folderName,
          file_count: (files || []).length,
          total_size: (files || []).reduce((s: number, f: any) => s + (f.file_size || 0), 0),
          files: files || [],
          subfolders: folders || [],
        });
      }

      return NextResponse.json({ shares, files: sharedFiles, folders: sharedFolders });
    }

    if (body.action === 'list_admin_users') {
      // Return list of admin user emails for user-to-user sharing picker
      const { data } = await supabase.auth.admin.listUsers();
      const emails = (data?.users || []).map((u: any) => u.email).filter(Boolean);
      return NextResponse.json({ users: emails });
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
// upload.rounlimited.com — direct HTTPS, no Cloudflare limit
