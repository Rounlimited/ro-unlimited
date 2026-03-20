'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Download, Eye, Folder, FolderOpen, FolderPlus,
  HardDrive, Loader2, File as FileIcon, Image, Film, Music, FileText, Archive,
  MoreVertical, X, Search, Grid3X3, List, Trash2, Upload, Info, Lock,
} from 'lucide-react';

interface SharedFile {
  id: string; original_filename: string; mime_type: string;
  file_size: number; telegram_file_id: string; folder: string; created_at: string;
}

interface DbFolder { id: string; path: string; name: string; }

interface ShareData {
  folder_path: string; user_email: string; permission: string;
  files: SharedFile[]; folders: DbFolder[];
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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
  if (mime.startsWith('audio/')) return '#8B5CF6';
  if (mime.includes('pdf')) return '#EF4444';
  if (mime.includes('document') || mime.includes('text')) return '#C9A84C';
  if (mime.includes('zip')) return '#F97316';
  return '#888';
}

export default function SharedFolderPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<'file' | 'folder'>('file');
  const [menuTarget, setMenuTarget] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const fetchData = async (pw?: string) => {
    const pwParam = pw || password;
    const url = pwParam
      ? `/api/shared/folder/${params.token}?pw=${encodeURIComponent(pwParam)}`
      : `/api/shared/folder/${params.token}`;
    const res = await fetch(url);
    const d = await res.json();
    if (d.requires_password && !d.error) {
      setNeedsPassword(true);
      setLoading(false);
      return;
    }
    if (d.error && d.requires_password) {
      setPasswordError('Incorrect password');
      setLoading(false);
      return;
    }
    if (d.error) { setError(d.error); setLoading(false); return; }
    setNeedsPassword(false);
    setPasswordError('');
    setData(d);
    if (!currentPath) setCurrentPath(d.folder_path);
    setLoading(false);
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) return;
    setLoading(true);
    setPasswordError('');
    fetchData(password);
  };

  useEffect(() => { fetchData(); }, [params.token]);

  // Load thumbnails for images in grid view
  useEffect(() => {
    if (viewMode !== 'grid' || !data) return;
    const imageFiles = data.files.filter(f =>
      f.mime_type?.startsWith('image/') && !thumbnails[f.id] &&
      ((f.folder || '/') === currentPath || (f.folder || '/') === currentPath.replace(/\/$/, ''))
    );
    imageFiles.slice(0, 10).forEach(async (f) => {
      const url = await getUrl(f);
      if (url) setThumbnails(prev => ({ ...prev, [f.id]: url }));
    });
  }, [data, viewMode, currentPath]);

  const canWrite = data?.permission === 'readwrite';

  const getUrl = async (file: SharedFile) => {
    const res = await fetch(`/api/shared/folder/${params.token}/file?file_id=${file.telegram_file_id}`);
    const d = await res.json();
    return d.url || '';
  };

  const closePreview = () => { setPreviewFile(null); setPreviewUrl(''); };
  const openPreview = async (file: SharedFile) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl('');
    window.history.pushState({ preview: true }, '');
    const url = await getUrl(file);
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  useEffect(() => {
    const onPop = () => { if (previewFile) closePreview(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [previewFile]);

  const handleDownload = async (file: SharedFile) => {
    const url = previewUrl || await getUrl(file);
    if (url) window.open(url, '_blank');
  };

  // Derive folder contents
  const getFolderContents = () => {
    if (!data) return { subfolders: [], files: [] };
    const normalizedPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';

    const filesHere = data.files.filter(f => {
      const fp = f.folder || '/';
      return fp === currentPath || fp === currentPath.replace(/\/$/, '');
    });

    const subfolderMap = new Map<string, { name: string; path: string; fileCount: number; totalSize: number }>();
    data.files.forEach(f => {
      const fp = (f.folder || '/') + '/';
      if (fp.startsWith(normalizedPath) && fp !== normalizedPath) {
        const remainder = fp.slice(normalizedPath.length);
        const nextSeg = remainder.split('/')[0];
        if (nextSeg && !subfolderMap.has(nextSeg)) {
          const folderPath = normalizedPath + nextSeg;
          const inside = data.files.filter(ff => (ff.folder || '/').startsWith(folderPath));
          subfolderMap.set(nextSeg, { name: nextSeg, path: folderPath, fileCount: inside.length, totalSize: inside.reduce((s, ff) => s + (ff.file_size || 0), 0) });
        }
      }
    });

    // Include explicit DB folders
    (data.folders || []).forEach(df => {
      const dfParent = df.path.substring(0, df.path.lastIndexOf('/')) || '/';
      const dfParentNorm = dfParent.endsWith('/') ? dfParent : dfParent + '/';
      if (dfParentNorm === normalizedPath || dfParent === currentPath) {
        if (!subfolderMap.has(df.name)) {
          subfolderMap.set(df.name, { name: df.name, path: df.path, fileCount: 0, totalSize: 0 });
        }
      }
    });

    const subfolders = [...subfolderMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      const s = search.toLowerCase();
      return { subfolders: [], files: data.files.filter(f => f.original_filename.toLowerCase().includes(s)) };
    }

    return { subfolders, files: filesHere };
  };

  const { subfolders, files } = getFolderContents();

  // Breadcrumbs
  const rootPath = data?.folder_path || '/';
  const rootName = rootPath === '/' ? 'Shared Drive' : rootPath.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Shared';
  const relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : '';
  const relativeSegments = relativePath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: rootName, path: rootPath },
    ...relativeSegments.map((seg, i) => ({
      name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: rootPath + (rootPath.endsWith('/') ? '' : '/') + relativeSegments.slice(0, i + 1).join('/'),
    })),
  ];

  const goBack = () => {
    if (currentPath === rootPath) return;
    const segs = currentPath.split('/').filter(Boolean);
    const parent = '/' + segs.slice(0, -1).join('/');
    setCurrentPath(parent || '/');
  };

  // Upload (readwrite only)
  const handleUpload = async (fileList: FileList) => {
    if (!fileList?.length || !data || !canWrite) return;
    setUploading(true);
    let uploaded = 0;
    const BOT_TOKEN = '8749047502:AAGIy6qsa_6R81FW88XX1REn3MBTc8NJ7dc';
    const CHAT_ID = '8195603202';
    const UPLOAD_BASE = 'https://upload.rounlimited.com';

    for (const file of Array.from(fileList)) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadProgress(`Uploading ${file.name} (${sizeMB} MB)...`);

      try {
        const tgForm = new FormData();
        tgForm.append('chat_id', CHAT_ID);
        tgForm.append('document', file, file.name);
        tgForm.append('caption', `${data.user_email} | ${currentPath} | ${file.name} [shared upload]`);

        const tgData: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const startTime = Date.now();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              const elapsed = (Date.now() - startTime) / 1000;
              const speed = e.loaded / elapsed;
              const speedStr = speed > 1024 * 1024 ? `${(speed / (1024 * 1024)).toFixed(1)} MB/s` : `${(speed / 1024).toFixed(0)} KB/s`;
              const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
              const totalMB = (e.total / (1024 * 1024)).toFixed(1);
              setUploadProgress(`${file.name} — ${pct}% (${loadedMB}/${totalMB} MB) ${speedStr}`);
            }
          });
          xhr.addEventListener('load', () => { try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({ ok: false }); } });
          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.open('POST', `${UPLOAD_BASE}/bot${BOT_TOKEN}/sendDocument`);
          xhr.send(tgForm);
        });

        if (tgData.ok) {
          const doc = tgData.result.document;
          await fetch(`/api/shared/folder/${params.token}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_metadata',
              filename: doc.file_name || file.name,
              original_filename: file.name,
              mime_type: doc.mime_type || file.type,
              file_size: doc.file_size || file.size,
              telegram_file_id: doc.file_id,
              folder: currentPath,
            }),
          });
          uploaded++;
        }
      } catch {}
    }
    setUploading(false);
    setUploadProgress('');
    if (uploaded > 0) { setToast(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`); fetchData(); }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !data) return;
    const name = newFolderName.trim().toLowerCase().replace(/\s+/g, '-');
    const newPath = (currentPath === '/' ? '/' : currentPath + '/') + name;
    setShowNewFolder(false);
    setNewFolderName('');
    await fetch(`/api/shared/folder/${params.token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_folder', path: newPath, name }),
    });
    setToast(`Folder "${name}" created`);
    fetchData();
  };

  const handleDeleteFile = async (file: SharedFile) => {
    if (!confirm(`Delete ${file.original_filename}?`)) return;
    await fetch(`/api/shared/folder/${params.token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: file.id }),
    });
    setToast('File deleted'); setMenuOpen(null); fetchData();
  };

  const handleDeleteFolder = async (folderPath: string, folderName: string) => {
    const inside = data?.files.filter(f => (f.folder || '/').startsWith(folderPath)) || [];
    if (!confirm(`Delete "${folderName}"${inside.length ? ` and ${inside.length} file${inside.length !== 1 ? 's' : ''}` : ''}?`)) return;
    await fetch(`/api/shared/folder/${params.token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_folder', path: folderPath }),
    });
    setToast(`Folder deleted`); setMenuOpen(null); fetchData();
  };

  const openFileMenu = (id: string) => { setMenuOpen(id); setMenuType('file'); };
  const openFolderMenu = (path: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpen(path); setMenuType('folder'); setMenuTarget(name);
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

  if (needsPassword) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#3b8dd4]/10 flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-[#3b8dd4]" />
        </div>
        <h1 className="text-[22px] font-bold text-white mb-2">Password Required</h1>
        <p className="text-white/40 text-[14px] mb-6">This shared folder is protected with a password</p>
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
          onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
          placeholder="Enter password" autoFocus
          className="w-full px-4 py-3.5 bg-[#141414] border border-white/10 rounded-xl text-[16px] text-white text-center placeholder:text-white/20 focus:outline-none focus:border-[#3b8dd4]/50 mb-3" />
        {passwordError && <p className="text-red-400 text-[13px] mb-3">{passwordError}</p>}
        <button onClick={handlePasswordSubmit} disabled={!password.trim() || loading}
          className="w-full py-3.5 bg-[#3b8dd4] text-white font-semibold text-[16px] rounded-xl hover:bg-[#3b8dd4]/90 transition-colors disabled:opacity-50">
          {loading ? 'Verifying...' : 'Open Folder'}
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  // Preview overlay
  if (previewFile) {
    const isImage = previewFile.mime_type?.startsWith('image/');
    const isVideo = previewFile.mime_type?.startsWith('video/');
    const isAudio = previewFile.mime_type?.startsWith('audio/');
    const isPdf = previewFile.mime_type?.includes('pdf');
    const isOffice = previewFile.mime_type?.includes('word') || previewFile.mime_type?.includes('spreadsheet') || previewFile.mime_type?.includes('presentation') ||
      previewFile.mime_type?.includes('msword') || previewFile.mime_type?.includes('excel') || previewFile.mime_type?.includes('powerpoint') ||
      !!previewFile.original_filename?.match(/\.(docx?|xlsx?|pptx?)$/i);
    const Icon = getFileIcon(previewFile.mime_type);
    const color = getFileColor(previewFile.mime_type);
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5">
          <button onClick={() => window.history.back()} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-white font-medium truncate">{previewFile.original_filename}</p>
            <p className="text-[12px] text-white/30">{formatSize(previewFile.file_size)}</p>
          </div>
          <button onClick={() => openFileMenu(previewFile.id)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/30 p-4">
          {previewLoading ? (
            <Loader2 size={32} className="text-[#3b8dd4] animate-spin" />
          ) : previewUrl ? (
            <>
              {isImage && <img src={previewUrl} alt={previewFile.original_filename} className="max-w-full max-h-full rounded-lg object-contain" />}
              {isVideo && <video src={previewUrl} controls autoPlay playsInline className="max-w-full max-h-full rounded-lg" />}
              {isAudio && (
                <div className="w-full max-w-md">
                  <div className="w-20 h-20 rounded-2xl bg-[#8B5CF6]/15 flex items-center justify-center mx-auto mb-6">
                    <Music size={36} className="text-[#8B5CF6]" />
                  </div>
                  <audio src={previewUrl} controls className="w-full" />
                </div>
              )}
              {isPdf && <iframe src={previewUrl} className="w-full h-full rounded-lg border border-white/10" />}
              {isOffice && (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
                  className="w-full h-full rounded-lg border border-white/10 bg-white" style={{ minHeight: '80vh' }} />
              )}
              {!isImage && !isVideo && !isAudio && !isPdf && !isOffice && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: color + '15' }}>
                    <Icon size={36} style={{ color }} />
                  </div>
                  <p className="text-white/40 text-[15px]">Preview not available for this file type</p>
                </div>
              )}
            </>
          ) : <p className="text-white/30">Could not load preview</p>}
        </div>

        {/* File info + actions */}
        <div className="border-t border-white/5 bg-[#0a0a0a]">
          <div className="px-5 py-3">
            <div className="grid grid-cols-2 gap-y-2 text-[13px] mb-3">
              <span className="text-white/30">Type</span>
              <span className="text-white/60">{previewFile.mime_type || 'Unknown'}</span>
              <span className="text-white/30">Size</span>
              <span className="text-white/60">{formatSize(previewFile.file_size)}</span>
              <span className="text-white/30">Uploaded</span>
              <span className="text-white/60">{new Date(previewFile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              <span className="text-white/30">Location</span>
              <span className="text-white/60">{previewFile.folder || '/'}</span>
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <button onClick={() => handleDownload(previewFile)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#3b8dd4] text-white font-semibold text-[15px] rounded-xl">
              <Download size={18} /> Download
            </button>
            {canWrite && (
              <button onClick={() => { handleDeleteFile(previewFile); setPreviewFile(null); }}
                className="flex items-center justify-center gap-2 py-3 px-5 bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-[15px] rounded-xl">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hidden file input */}
      {canWrite && (
        <input ref={fileInputRef} type="file" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ''; }} />
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 px-4 py-3">
          {currentPath !== rootPath ? (
            <button onClick={goBack} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-9" />
          )}

          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] rounded-full border border-white/10">
                <Search size={16} className="text-white/30" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
                  autoFocus className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 focus:outline-none" />
              </div>
              <button onClick={() => { setShowSearch(false); setSearch(''); }} className="p-1.5 text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
          ) : (
            <>
              <HardDrive size={20} className="text-[#3b8dd4] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {breadcrumbs.map((bc, i) => (
                    <div key={bc.path} className="flex items-center shrink-0">
                      {i > 0 && <ChevronRight size={14} className="text-white/15 mx-0.5" />}
                      <button onClick={() => { setCurrentPath(bc.path); setSearch(''); setShowSearch(false); }}
                        className={`text-[14px] font-medium whitespace-nowrap capitalize ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                        {bc.name}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/20 mt-0.5">
                  {data.permission === 'readwrite' ? 'Full access' : 'View only'} &middot; {data.files.length} file{data.files.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setShowSearch(true)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                <Search size={20} />
              </button>
              <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                {viewMode === 'grid' ? <List size={20} /> : <Grid3X3 size={20} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pb-28 px-4 pt-3">
        {search ? (
          <>
            <p className="text-[13px] text-white/30 mb-3">{files.length} result{files.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
            {files.length === 0 ? (
              <div className="text-center py-16"><p className="text-white/20 text-[16px]">No files found</p></div>
            ) : (
              <div className="space-y-1">
                {files.map(file => <FileListItem key={file.id} file={file} onTap={openPreview} onMenu={openFileMenu} menuOpen={menuOpen} canWrite={canWrite} />)}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Folders */}
            {subfolders.length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Folders</p>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {subfolders.map(sf => (
                      <button key={sf.path} onClick={() => { setCurrentPath(sf.path); setSearch(''); }}
                        className="relative bg-[#141414] border border-white/5 rounded-2xl p-4 text-left hover:border-[#3b8dd4]/20 hover:bg-[#3b8dd4]/[0.03] transition-all active:scale-[0.98] group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-11 h-11 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center">
                            <Folder size={22} className="text-[#3b8dd4]" />
                          </div>
                          {canWrite && (
                            <button onClick={e => openFolderMenu(sf.path, sf.name, e)}
                              className="p-1.5 rounded-full text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          )}
                        </div>
                        <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name.replace(/-/g, ' ')}</p>
                        <p className="text-[12px] text-white/25 mt-0.5">{sf.fileCount} item{sf.fileCount !== 1 ? 's' : ''} &middot; {formatSize(sf.totalSize)}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {subfolders.map(sf => (
                      <button key={sf.path} onClick={() => { setCurrentPath(sf.path); setSearch(''); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors active:bg-white/[0.05]">
                        <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center shrink-0">
                          <Folder size={20} className="text-[#3b8dd4]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name.replace(/-/g, ' ')}</p>
                          <p className="text-[12px] text-white/25">{sf.fileCount} item{sf.fileCount !== 1 ? 's' : ''} &middot; {formatSize(sf.totalSize)}</p>
                        </div>
                        {canWrite && (
                          <button onClick={e => openFolderMenu(sf.path, sf.name, e)} className="p-2 rounded-full text-white/15 hover:text-white/40 hover:bg-white/5 shrink-0">
                            <MoreVertical size={18} />
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Files</p>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {files.map(file => {
                      const Icon = getFileIcon(file.mime_type);
                      const color = getFileColor(file.mime_type);
                      return (
                        <button key={file.id} onClick={() => openPreview(file)}
                          className="relative bg-[#141414] border border-white/5 rounded-2xl overflow-hidden text-left hover:border-white/10 transition-all active:scale-[0.98] group">
                          {file.mime_type?.startsWith('image/') && thumbnails[file.id] ? (
                            <div className="w-full h-28 bg-black/30 relative">
                              <img src={thumbnails[file.id]} alt="" className="w-full h-full object-cover" />
                              <button onClick={e => { e.stopPropagation(); openFileMenu(file.id); }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/70 hover:bg-black/70 transition-colors">
                                <MoreVertical size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between p-4 pb-2">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '12' }}>
                                <Icon size={22} style={{ color }} />
                              </div>
                              <button onClick={e => { e.stopPropagation(); openFileMenu(file.id); }}
                                className="p-1.5 rounded-full text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          )}
                          <div className="px-4 py-2.5">
                            <p className="text-[13px] text-white font-medium truncate">{file.original_filename}</p>
                            <p className="text-[11px] text-white/25 mt-0.5">{formatSize(file.file_size)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map(file => <FileListItem key={file.id} file={file} onTap={openPreview} onMenu={openFileMenu} menuOpen={menuOpen} canWrite={canWrite} />)}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {subfolders.length === 0 && files.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen size={52} className="text-white/8 mb-4" />
                <p className="text-white/25 text-[17px] font-medium mb-1">Empty folder</p>
                <p className="text-white/15 text-[14px]">{canWrite ? 'Upload files or create a subfolder' : 'No files in this folder'}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB buttons (readwrite) */}
      {canWrite && (
        <div className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-2.5"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
          {uploading && (
            <div className="w-[calc(100vw-2rem)] max-w-md px-4 py-3 bg-[#111] border border-[#3b8dd4]/30 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Loader2 size={16} className="animate-spin text-[#3b8dd4] shrink-0" />
                <span className="text-[14px] text-white font-medium truncate">Uploading</span>
              </div>
              <p className="text-[13px] text-[#3b8dd4] leading-snug">{uploadProgress}</p>
            </div>
          )}
          <div className="flex gap-2.5">
            <button onClick={() => setShowNewFolder(true)}
              className="w-12 h-12 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-[#3b8dd4] hover:border-[#3b8dd4]/20 transition-colors shadow-lg">
              <FolderPlus size={20} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className={`flex items-center gap-2 px-5 h-12 bg-[#3b8dd4] rounded-2xl shadow-lg shadow-[#3b8dd4]/20 text-white font-bold text-[15px] hover:bg-[#3b8dd4]/90 transition-colors ${uploading ? 'opacity-50' : ''}`}>
              <Upload size={18} /> Upload
            </button>
          </div>
        </div>
      )}

      {/* File context menu */}
      {menuOpen && menuType === 'file' && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2" />
            {(() => {
              const file = data.files.find(f => f.id === menuOpen);
              if (!file) return null;
              return (
                <>
                  <div className="px-5 py-2 mb-1">
                    <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                    <p className="text-[12px] text-white/30">{formatSize(file.file_size)} &middot; {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <button onClick={() => { openPreview(file); setMenuOpen(null); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white/70 hover:bg-white/5">
                    <Eye size={20} /> Preview
                  </button>
                  <button onClick={() => { handleDownload(file); setMenuOpen(null); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white/70 hover:bg-white/5">
                    <Download size={20} /> Download
                  </button>
                  <button onClick={() => {
                    setMenuOpen(null);
                    // Show info via preview
                    openPreview(file);
                  }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10">
                    <Info size={20} /> File Info
                  </button>
                  {canWrite && (
                    <button onClick={() => handleDeleteFile(file)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-red-400 hover:bg-red-500/10">
                      <Trash2 size={20} /> Delete
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Folder context menu */}
      {menuOpen && menuType === 'folder' && canWrite && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-5 py-2 mb-1">
              <p className="text-[15px] text-white font-medium capitalize">{menuTarget.replace(/-/g, ' ')}</p>
              <p className="text-[12px] text-white/30">Folder</p>
            </div>
            <button onClick={() => { setCurrentPath(menuOpen!); setMenuOpen(null); }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white/70 hover:bg-white/5">
              <FolderOpen size={20} /> Open
            </button>
            <button onClick={() => handleDeleteFolder(menuOpen!, menuTarget)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-red-400 hover:bg-red-500/10">
              <Trash2 size={20} /> Delete Folder
            </button>
          </div>
        </>
      )}

      {/* New folder modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowNewFolder(false)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white mb-4">New Folder</h3>
            <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-[15px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#3b8dd4]/50 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowNewFolder(false)}
                className="flex-1 py-2.5 text-[14px] text-white/40 border border-white/10 rounded-xl hover:bg-white/5">Cancel</button>
              <button onClick={handleCreateFolder}
                className="flex-1 py-2.5 text-[14px] bg-[#3b8dd4] text-white font-semibold rounded-xl hover:bg-[#3b8dd4]/90">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 left-4 right-4 z-50 px-5 py-3 bg-[#111] border border-[#3b8dd4]/30 rounded-2xl text-[14px] text-[#3b8dd4] shadow-2xl leading-snug break-words">
          {toast}
        </div>
      )}
    </div>
  );
}

function FileListItem({ file, onTap, onMenu, menuOpen, canWrite }: {
  file: SharedFile; onTap: (f: SharedFile) => void; onMenu: (id: string) => void; menuOpen: string | null; canWrite: boolean;
}) {
  const Icon = getFileIcon(file.mime_type);
  const color = getFileColor(file.mime_type);
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors active:bg-white/[0.05]">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '12' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <button onClick={() => onTap(file)} className="flex-1 min-w-0 text-left">
        <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
        <p className="text-[12px] text-white/25">{formatSize(file.file_size)} &middot; {new Date(file.created_at).toLocaleDateString()}</p>
      </button>
      <button onClick={() => onMenu(file.id)} className="p-2 rounded-full text-white/15 hover:text-white/40 hover:bg-white/5 shrink-0">
        <MoreVertical size={18} />
      </button>
    </div>
  );
}
