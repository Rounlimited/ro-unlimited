import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SharedFilePage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { token } = params;

  // Look up share
  const { data: share } = await supabase
    .from('file_shares')
    .select('*, file:user_files(*)')
    .eq('token', token)
    .single();

  if (!share || !share.file) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-[24px] font-bold text-white mb-2">Link Expired</h1>
          <p className="text-white/40 text-[16px]">This shared file link is no longer valid.</p>
        </div>
      </div>
    );
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-[24px] font-bold text-white mb-2">Link Expired</h1>
          <p className="text-white/40 text-[16px]">This link expired on {new Date(share.expires_at).toLocaleDateString()}.</p>
        </div>
      </div>
    );
  }

  // Increment access count
  await supabase.from('file_shares').update({ accessed_count: (share.accessed_count || 0) + 1 }).eq('id', share.id);

  // Get download URL from Telegram
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${share.file.telegram_file_id}`);
  const tgData = await tgRes.json();

  let downloadUrl = '';
  if (tgData.ok) {
    downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${tgData.result.file_path}`;
  }

  const file = share.file;
  const isImage = file.mime_type?.startsWith('image/');
  const isVideo = file.mime_type?.startsWith('video/');
  const isPdf = file.mime_type?.includes('pdf');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b8dd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white">RO Drive</h1>
            <p className="text-[12px] text-white/30">Shared file — {share.permission === 'readwrite' ? 'Full access' : 'View only'}</p>
          </div>
        </div>
      </div>

      {/* File info */}
      <div className="px-5 py-6">
        <h2 className="text-[20px] font-bold text-white mb-1">{file.original_filename}</h2>
        <p className="text-[14px] text-white/30">
          {(file.file_size / (1024 * 1024)).toFixed(1)} MB &middot; Shared by {share.created_by.split('@')[0]}
        </p>
      </div>

      {/* Preview */}
      <div className="flex-1 px-5 pb-6">
        {isImage && downloadUrl && (
          <img src={downloadUrl} alt={file.original_filename} className="max-w-full rounded-xl border border-white/10" />
        )}
        {isVideo && downloadUrl && (
          <video src={downloadUrl} controls className="max-w-full rounded-xl border border-white/10" />
        )}
        {isPdf && downloadUrl && (
          <iframe src={downloadUrl} className="w-full h-[70vh] rounded-xl border border-white/10" />
        )}
      </div>

      {/* Download button — stream through our route so it saves with the real filename.
          (Linking straight to the Telegram URL downloads as "file_NNN" with no extension.) */}
      {downloadUrl && (
        <div className="px-5 pb-6">
          <a href={`/api/shared/${token}/file`} download={file.original_filename}
            className="block w-full py-4 bg-[#3b8dd4] text-white text-center font-bold text-[16px] rounded-2xl hover:bg-[#3b8dd4]/90 transition-colors">
            Download File
          </a>
        </div>
      )}
    </div>
  );
}
