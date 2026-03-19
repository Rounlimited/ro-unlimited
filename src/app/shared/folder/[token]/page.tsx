'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Download, Eye, Folder, X, Loader2 } from 'lucide-react';

interface SharedFile {
  id: string; original_filename: string; mime_type: string;
  file_size: number; telegram_file_id: string;
}

interface ShareData {
  folder_path: string; user_email: string; permission: string;
  files: SharedFile[];
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SharedFolderPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/shared/folder/${params.token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [params.token]);

  const getUrl = async (file: SharedFile) => {
    const res = await fetch(`/api/shared/folder/${params.token}/file?file_id=${file.telegram_file_id}`);
    const d = await res.json();
    return d.url || '';
  };

  const openPreview = async (file: SharedFile) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    const url = await getUrl(file);
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  const handleDownload = async (file: SharedFile) => {
    const url = previewUrl || await getUrl(file);
    if (url) window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 size={28} className="text-[#3b8dd4] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-[24px] font-bold text-white mb-2">Link Expired</h1>
        <p className="text-white/40 text-[16px]">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;
  const folderName = data.folder_path.split('/').filter(Boolean).pop() || 'Shared Folder';

  // Preview overlay
  if (previewFile) {
    const isImage = previewFile.mime_type?.startsWith('image/');
    const isVideo = previewFile.mime_type?.startsWith('video/');
    const isPdf = previewFile.mime_type?.includes('pdf');
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5">
          <button onClick={() => { setPreviewFile(null); setPreviewUrl(''); }} className="p-2 text-white/40">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-white font-medium truncate">{previewFile.original_filename}</p>
            <p className="text-[12px] text-white/30">{formatSize(previewFile.file_size)}</p>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/30 p-4">
          {previewLoading ? <Loader2 size={28} className="text-[#3b8dd4] animate-spin" /> :
            previewUrl ? (
              <>
                {isImage && <img src={previewUrl} alt="" className="max-w-full max-h-full rounded-lg object-contain" />}
                {isVideo && <video src={previewUrl} controls autoPlay playsInline className="max-w-full max-h-full rounded-lg" />}
                {isPdf && <iframe src={previewUrl} className="w-full h-full rounded-lg border border-white/10" />}
                {!isImage && !isVideo && !isPdf && <p className="text-white/40">Preview not available</p>}
              </>
            ) : <p className="text-white/30">Could not load preview</p>}
        </div>
        <div className="px-4 pb-6 pt-3" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          <button onClick={() => handleDownload(previewFile)}
            className="w-full py-4 bg-[#3b8dd4] text-white text-center font-bold text-[16px] rounded-2xl">
            Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/15 flex items-center justify-center">
            <Folder size={20} className="text-[#3b8dd4]" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white capitalize">{folderName.replace(/-/g, ' ')}</h1>
            <p className="text-[12px] text-white/30">
              {data.files.length} file{data.files.length !== 1 ? 's' : ''} &middot; Shared by {data.user_email.split('@')[0]} &middot; {data.permission === 'readwrite' ? 'Full access' : 'View only'}
            </p>
          </div>
        </div>
      </div>

      {data.files.length === 0 ? (
        <div className="text-center py-16"><p className="text-white/25 text-[16px]">This folder is empty</p></div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {data.files.map(file => {
            const isImage = file.mime_type?.startsWith('image/');
            const color = isImage ? '#22C55E' : file.mime_type?.includes('pdf') ? '#EF4444' : file.mime_type?.startsWith('video/') ? '#3b8dd4' : '#C9A84C';
            return (
              <button key={file.id} onClick={() => openPreview(file)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                  <Eye size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                  <p className="text-[12px] text-white/25">{formatSize(file.file_size)}</p>
                </div>
                <span className="text-[12px] text-white/20">Tap to view</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
