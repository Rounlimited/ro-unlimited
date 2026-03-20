'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Folder, FolderOpen, HardDrive, Loader2, File as FileIcon, Image, Film, Music, FileText, Archive } from 'lucide-react';

interface SharedFile {
  id: string; original_filename: string; mime_type: string;
  file_size: number; telegram_file_id: string; folder: string;
}

interface ShareData {
  folder_path: string; user_email: string; permission: string;
  files: SharedFile[];
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (!mime) return FileIcon;
  if (mime.startsWith('image/')) return Image;
  if (mime.startsWith('video/')) return Film;
  if (mime.startsWith('audio/')) return Music;
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return FileText;
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return Archive;
  return FileIcon;
}

function getFileColor(mime: string): string {
  if (!mime) return '#888';
  if (mime.startsWith('image/')) return '#22C55E';
  if (mime.startsWith('video/')) return '#3b8dd4';
  if (mime.startsWith('audio/')) return '#C9A84C';
  if (mime.includes('pdf')) return '#EF4444';
  return '#C9A84C';
}

export default function SharedFolderPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/shared/folder/${params.token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          setCurrentPath(d.folder_path);
        }
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

  // Derive folder contents for current path
  const getFolderContents = () => {
    if (!data) return { subfolders: [], files: [] };
    const normalizedPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';

    // Files directly in this folder
    const filesHere = data.files.filter(f => {
      const filePath = f.folder || '/';
      return filePath === currentPath || filePath === currentPath.replace(/\/$/, '');
    });

    // Subfolders derived from file paths
    const subfolderMap = new Map<string, { name: string; path: string; fileCount: number; totalSize: number }>();
    data.files.forEach(f => {
      const filePath = (f.folder || '/') + '/';
      if (filePath.startsWith(normalizedPath) && filePath !== normalizedPath) {
        const remainder = filePath.slice(normalizedPath.length);
        const nextSegment = remainder.split('/')[0];
        if (nextSegment && !subfolderMap.has(nextSegment)) {
          const folderPath = normalizedPath + nextSegment;
          const filesInside = data.files.filter(ff => (ff.folder || '/').startsWith(folderPath));
          subfolderMap.set(nextSegment, {
            name: nextSegment,
            path: folderPath,
            fileCount: filesInside.length,
            totalSize: filesInside.reduce((s, ff) => s + (ff.file_size || 0), 0),
          });
        }
      }
    });

    const subfolders = [...subfolderMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    return { subfolders, files: filesHere };
  };

  const { subfolders, files } = getFolderContents();

  // Breadcrumbs relative to shared root
  const rootPath = data?.folder_path || '/';
  const rootName = rootPath === '/' ? 'RO Drive' : rootPath.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Shared';
  const relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : '';
  const relativeSegments = relativePath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: rootName, path: rootPath },
    ...relativeSegments.map((seg, i) => ({
      name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: rootPath + (rootPath.endsWith('/') ? '' : '/') + relativeSegments.slice(0, i + 1).join('/'),
    })),
  ];

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
          <button onClick={() => handleDownload(previewFile)} className="p-2 text-[#3b8dd4]">
            <Download size={22} />
          </button>
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
      {/* Header with breadcrumbs */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <HardDrive size={20} className="text-[#3b8dd4] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {breadcrumbs.map((bc, i) => (
                <div key={bc.path} className="flex items-center shrink-0">
                  {i > 0 && <ChevronRight size={14} className="text-white/15 mx-0.5" />}
                  <button onClick={() => setCurrentPath(bc.path)}
                    className={`text-[14px] font-medium whitespace-nowrap capitalize ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-white/40'}`}>
                    {bc.name}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/20 mt-0.5">
              Shared by {data.user_email.split('@')[0]} &middot; {data.permission === 'readwrite' ? 'Full access' : 'View only'} &middot; {data.files.length} file{data.files.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-8">
        {/* Subfolders */}
        {subfolders.length > 0 && (
          <div className="mb-4">
            <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Folders</p>
            <div className="grid grid-cols-2 gap-2.5">
              {subfolders.map(sf => (
                <button key={sf.path} onClick={() => setCurrentPath(sf.path)}
                  className="bg-[#141414] border border-white/5 rounded-2xl p-4 text-left hover:border-[#3b8dd4]/20 transition-all active:scale-[0.98]">
                  <div className="w-11 h-11 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center mb-3">
                    <Folder size={22} className="text-[#3b8dd4]" />
                  </div>
                  <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name.replace(/-/g, ' ')}</p>
                  <p className="text-[12px] text-white/25 mt-0.5">{sf.fileCount} item{sf.fileCount !== 1 ? 's' : ''} &middot; {formatSize(sf.totalSize)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div>
            <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Files</p>
            <div className="space-y-1">
              {files.map(file => {
                const Icon = getFileIcon(file.mime_type);
                const color = getFileColor(file.mime_type);
                return (
                  <button key={file.id} onClick={() => openPreview(file)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                      <p className="text-[12px] text-white/25">{formatSize(file.file_size)}</p>
                    </div>
                    <Eye size={16} className="text-white/15 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {subfolders.length === 0 && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen size={52} className="text-white/8 mb-4" />
            <p className="text-white/25 text-[17px] font-medium mb-1">Empty folder</p>
            <p className="text-white/15 text-[14px]">No files in this folder</p>
          </div>
        )}
      </div>
    </div>
  );
}
