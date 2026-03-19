import { createAdminClient } from '@/lib/supabase/server';

export default async function SharedFolderPage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { token } = params;

  const { data: share } = await supabase
    .from('folder_shares')
    .select('*')
    .eq('token', token)
    .single();

  if (!share) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-[24px] font-bold text-white mb-2">Link Expired</h1>
          <p className="text-white/40 text-[16px]">This shared folder link is no longer valid.</p>
        </div>
      </div>
    );
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-[24px] font-bold text-white mb-2">Link Expired</h1>
          <p className="text-white/40 text-[16px]">Expired on {new Date(share.expires_at).toLocaleDateString()}.</p>
        </div>
      </div>
    );
  }

  await supabase.from('folder_shares').update({ accessed_count: (share.accessed_count || 0) + 1 }).eq('id', share.id);

  // Get all files in this folder and subfolders
  const { data: files } = await supabase
    .from('user_files')
    .select('*')
    .eq('user_email', share.user_email)
    .like('folder', `${share.folder_path}%`)
    .order('original_filename');

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const folderName = share.folder_path.split('/').filter(Boolean).pop() || 'Shared Folder';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b8dd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white capitalize">{folderName.replace(/-/g, ' ')}</h1>
            <p className="text-[12px] text-white/30">
              {(files || []).length} file{(files || []).length !== 1 ? 's' : ''} &middot; Shared by {share.user_email.split('@')[0]} &middot; {share.permission === 'readwrite' ? 'Full access' : 'View only'}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {(files || []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/25 text-[16px]">This folder is empty</p>
          </div>
        ) : (files || []).map(file => {
          const isImage = file.mime_type?.startsWith('image/');
          const isVideo = file.mime_type?.startsWith('video/');
          const isPdf = file.mime_type?.includes('pdf');
          const color = isImage ? '#22C55E' : isVideo ? '#3b8dd4' : isPdf ? '#EF4444' : '#C9A84C';

          return (
            <SharedFileRow key={file.id} file={file} color={color} telegramToken={TELEGRAM_TOKEN!} />
          );
        })}
      </div>
    </div>
  );
}

async function SharedFileRow({ file, color, telegramToken }: { file: any; color: string; telegramToken: string }) {
  // Get download URL
  let downloadUrl = '';
  try {
    const res = await fetch(`https://api.telegram.org/bot${telegramToken}/getFile?file_id=${file.telegram_file_id}`);
    const data = await res.json();
    if (data.ok) downloadUrl = `https://api.telegram.org/file/bot${telegramToken}/${data.result.file_path}`;
  } catch {}

  const sizeStr = file.file_size < 1024 * 1024
    ? `${(file.file_size / 1024).toFixed(1)} KB`
    : `${(file.file_size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <a href={downloadUrl || '#'} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
        <p className="text-[12px] text-white/25">{sizeStr}</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </a>
  );
}
