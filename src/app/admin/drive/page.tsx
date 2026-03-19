'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthGuard from '@/components/admin/AuthGuard';
import Link from 'next/link';
import {
  Upload, FolderPlus, Search, Trash2, Download, File as FileIcon, Image, Film,
  FileText, Music, Archive, MoreVertical, X, Loader2, ChevronLeft, ChevronRight,
  HardDrive, FolderOpen, Folder, Eye, Share2, FolderInput, Grid3X3, List,
  Home, Plus, Check, Copy,
} from 'lucide-react';

interface UserFile {
  id: string; user_email: string; filename: string; original_filename: string;
  mime_type: string; file_size: number; folder: string;
  entity_type: string | null; entity_id: string | null; created_at: string;
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

export default function DrivePage() {
  const [allFiles, setAllFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [search, setSearch] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [totalBytes, setTotalBytes] = useState(0);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<'file' | 'folder'>('file');
  const [menuTarget, setMenuTarget] = useState<string>('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('ro_drive_view') as any) || 'grid';
    return 'grid';
  });
  const [toast, setToast] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { localStorage.setItem('ro_drive_view', viewMode); }, [viewMode]);

  // Get user email
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Explicit folders from DB
  const [dbFolders, setDbFolders] = useState<{ id: string; path: string; name: string }[]>([]);

  // Fetch ALL files + folders for this user
  const fetchFiles = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    const res = await fetch(`/api/admin/drive?user=${encodeURIComponent(userEmail)}`);
    const data = await res.json();
    setAllFiles(data.files || []);
    setTotalBytes(data.totalBytes || 0);
    setDbFolders(data.folders || []);
    setLoading(false);
  }, [userEmail]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // ── Derive current folder contents ──
  const getFolderContents = () => {
    const normalizedPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';

    // Files directly in this folder
    const filesHere = allFiles.filter(f => {
      const filePath = f.folder || '/';
      return filePath === currentPath || filePath === currentPath.replace(/\/$/, '');
    });

    // Subfolders from files (implicit)
    const subfolderMap = new Map<string, { name: string; path: string; fileCount: number; totalSize: number }>();
    allFiles.forEach(f => {
      const filePath = (f.folder || '/') + '/';
      if (filePath.startsWith(normalizedPath) && filePath !== normalizedPath) {
        const remainder = filePath.slice(normalizedPath.length);
        const nextSegment = remainder.split('/')[0];
        if (nextSegment && !subfolderMap.has(nextSegment)) {
          const folderPath = normalizedPath + nextSegment;
          const filesInside = allFiles.filter(ff => (ff.folder || '/').startsWith(folderPath));
          subfolderMap.set(nextSegment, {
            name: nextSegment,
            path: folderPath,
            fileCount: filesInside.length,
            totalSize: filesInside.reduce((s, ff) => s + (ff.file_size || 0), 0),
          });
        }
      }
    });

    // Subfolders from DB (explicit — includes empty folders)
    dbFolders.forEach(df => {
      const dfParent = df.path.substring(0, df.path.lastIndexOf('/')) || '/';
      const dfParentNorm = dfParent.endsWith('/') ? dfParent : dfParent + '/';
      if (dfParentNorm === normalizedPath || dfParent === currentPath) {
        const name = df.name;
        if (!subfolderMap.has(name)) {
          subfolderMap.set(name, { name, path: df.path, fileCount: 0, totalSize: 0 });
        }
      }
    });

    const subfolders = [...subfolderMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const searchFiles = allFiles.filter(f => f.original_filename.toLowerCase().includes(s));
      return { subfolders: [], files: searchFiles };
    }

    return { subfolders, files: filesHere };
  };

  const { subfolders, files } = getFolderContents();

  // ── Breadcrumb segments ──
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'RO Drive', path: '/' },
    ...pathSegments.map((seg, i) => ({
      name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: '/' + pathSegments.slice(0, i + 1).join('/'),
    })),
  ];

  // ── Navigation ──
  const navigateToFolder = (path: string) => {
    setCurrentPath(path);
    setSearch('');
    setShowSearch(false);
    setMenuOpen(null);
  };

  const goBack = () => {
    if (currentPath === '/') return;
    const parent = '/' + pathSegments.slice(0, -1).join('/');
    setCurrentPath(parent || '/');
  };

  // ── Upload ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length || !userEmail) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(fileList)) {
      setUploadProgress(`Uploading ${file.name}...`);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_email', userEmail);
      formData.append('folder', currentPath);
      const res = await fetch('/api/admin/drive', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        setToast(data.setup_required ? 'Send a message to @Nexavisiongroup_bot on Telegram first' : `Failed: ${data.error}`);
      } else { uploaded++; }
    }
    setUploading(false);
    setUploadProgress('');
    if (uploaded > 0) { setToast(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`); fetchFiles(); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Get file URL from Telegram ──
  const getFileUrl = async (fileId: string): Promise<string> => {
    const res = await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_download_url', id: fileId }),
    });
    const data = await res.json();
    return data.url || '';
  };

  // ── Open file preview ──
  const openPreview = async (file: UserFile) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl('');
    const url = await getFileUrl(file.id);
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  // ── Download file ──
  const handleDownload = async (file: UserFile) => {
    const url = previewUrl || await getFileUrl(file.id);
    if (url) window.open(url, '_blank');
    else setToast('Failed to get download link');
  };

  // ── Delete file ──
  const handleDeleteFile = async (file: UserFile) => {
    if (!confirm(`Delete ${file.original_filename}?`)) return;
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: file.id }),
    });
    setToast('File deleted'); setMenuOpen(null); fetchFiles();
  };

  // ── Delete folder (DB record + all files in it) ──
  const handleDeleteFolder = async (folderPath: string, folderName: string) => {
    const filesInFolder = allFiles.filter(f => (f.folder || '/').startsWith(folderPath));
    const msg = filesInFolder.length > 0
      ? `Delete folder "${folderName}" and ${filesInFolder.length} file${filesInFolder.length !== 1 ? 's' : ''} inside?`
      : `Delete empty folder "${folderName}"?`;
    if (!confirm(msg)) return;
    // Delete files
    for (const f of filesInFolder) {
      await fetch('/api/admin/drive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: f.id }),
      });
    }
    // Delete folder record from DB
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_folder', path: folderPath, user_email: userEmail }),
    });
    setToast(`Folder "${folderName}" deleted`); setMenuOpen(null); fetchFiles();
  };

  // ── Share file ──
  const handleShare = async (fileId: string, permission: 'read' | 'readwrite') => {
    const res = await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share', file_id: fileId, permission, user_email: userEmail }),
    });
    const data = await res.json();
    if (data.link) {
      try { const ta = document.createElement('textarea'); ta.value = data.link; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } catch {}
      try { await navigator.clipboard.writeText(data.link); } catch {}
      setToast(permission === 'read' ? 'View-only link copied!' : 'Full access link copied!');
    }
    setMenuOpen(null);
  };

  // ── Create folder ──
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userEmail) return;
    const name = newFolderName.trim().toLowerCase().replace(/\s+/g, '-');
    const newPath = (currentPath === '/' ? '/' : currentPath + '/') + name;
    setShowNewFolder(false);
    setNewFolderName('');

    // Save folder to DB so it persists even when empty
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_folder', path: newPath, name, user_email: userEmail }),
    });

    setToast(`Folder "${name}" created`);
    await fetchFiles(); // Refresh to pick up the new folder
    navigateToFolder(newPath);
  };

  // ── Open file/folder menu ──
  const openFileMenu = (id: string) => { setMenuOpen(id); setMenuType('file'); };
  const openFolderMenu = (path: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(path);
    setMenuType('folder');
    setMenuTarget(name);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* ── Header ── */}
        <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2 px-4 py-3">
            {currentPath === '/' ? (
              <Link href="/admin" className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5">
                <ChevronLeft size={24} />
              </Link>
            ) : (
              <button onClick={goBack} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5">
                <ChevronLeft size={24} />
              </button>
            )}

            {showSearch ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] rounded-full border border-white/10">
                  <Search size={16} className="text-white/30" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all files..."
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
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {breadcrumbs.map((bc, i) => (
                      <div key={bc.path} className="flex items-center shrink-0">
                        {i > 0 && <ChevronRight size={14} className="text-white/15 mx-0.5" />}
                        <button onClick={() => navigateToFolder(bc.path)}
                          className={`text-[14px] font-medium whitespace-nowrap ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                          {bc.name}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/20 mt-0.5">{formatSize(totalBytes)} used</p>
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

        {/* ── Content ── */}
        <div className="pb-28 px-4 pt-3">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={28} className="text-[#3b8dd4] animate-spin" /></div>
          ) : search ? (
            // Search results
            <>
              <p className="text-[13px] text-white/30 mb-3">{files.length} result{files.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
              {files.length === 0 ? (
                <div className="text-center py-16"><p className="text-white/20 text-[16px]">No files found</p></div>
              ) : (
                <div className="space-y-1">
                  {files.map(file => <FileListItem key={file.id} file={file} onTap={openPreview} onMenu={openFileMenu} menuOpen={menuOpen} />)}
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
                        <button key={sf.path} onClick={() => navigateToFolder(sf.path)}
                          className="relative bg-[#141414] border border-white/5 rounded-2xl p-4 text-left hover:border-[#3b8dd4]/20 hover:bg-[#3b8dd4]/[0.03] transition-all active:scale-[0.98] group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-11 h-11 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center">
                              <Folder size={22} className="text-[#3b8dd4]" />
                            </div>
                            <button onClick={e => openFolderMenu(sf.path, sf.name, e)}
                              className="p-1.5 rounded-full text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                          <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name.replace(/-/g, ' ')}</p>
                          <p className="text-[12px] text-white/25 mt-0.5">{sf.fileCount} item{sf.fileCount !== 1 ? 's' : ''} &middot; {formatSize(sf.totalSize)}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {subfolders.map(sf => (
                        <button key={sf.path} onClick={() => navigateToFolder(sf.path)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors active:bg-white/[0.05] group">
                          <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center shrink-0">
                            <Folder size={20} className="text-[#3b8dd4]" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name.replace(/-/g, ' ')}</p>
                            <p className="text-[12px] text-white/25">{sf.fileCount} item{sf.fileCount !== 1 ? 's' : ''} &middot; {formatSize(sf.totalSize)}</p>
                          </div>
                          <button onClick={e => openFolderMenu(sf.path, sf.name, e)}
                            className="p-1.5 rounded-full text-white/25 hover:text-white/50 hover:bg-white/5 shrink-0">
                            <MoreVertical size={18} />
                          </button>
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
                            className="relative bg-[#141414] border border-white/5 rounded-2xl p-4 text-left hover:border-white/10 transition-all active:scale-[0.98] group">
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '12' }}>
                                <Icon size={22} style={{ color }} />
                              </div>
                              <button onClick={e => { e.stopPropagation(); openFileMenu(file.id); }}
                                className="p-1.5 rounded-full text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                            <p className="text-[14px] text-white font-medium truncate">{file.original_filename}</p>
                            <p className="text-[11px] text-white/25 mt-0.5">{formatSize(file.file_size)}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {files.map(file => <FileListItem key={file.id} file={file} onTap={openPreview} onMenu={openFileMenu} menuOpen={menuOpen} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {subfolders.length === 0 && files.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FolderOpen size={52} className="text-white/8 mb-4" />
                  <p className="text-white/25 text-[17px] font-medium mb-1">Empty folder</p>
                  <p className="text-white/15 text-[14px]">Upload files or create a subfolder</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FAB buttons ── */}
        <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2.5"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
          {uploading && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#3b8dd4]/30 rounded-full text-[13px] text-[#3b8dd4]">
              <Loader2 size={14} className="animate-spin" /> {uploadProgress}
            </div>
          )}
          <div className="flex gap-2.5">
            <button onClick={() => setShowNewFolder(true)}
              className="w-12 h-12 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-[#3b8dd4] hover:border-[#3b8dd4]/20 transition-colors shadow-lg">
              <FolderPlus size={20} />
            </button>
            <label className={`relative flex items-center gap-2 px-4 h-12 bg-white/5 border border-white/10 rounded-2xl shadow-lg text-white/60 font-bold text-[14px] hover:bg-white/10 transition-colors cursor-pointer overflow-hidden ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <FileIcon size={16} /> Files
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.ppt,.pptx" onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ fontSize: '100px' }} />
            </label>
            <label className={`relative flex items-center gap-2 px-5 h-12 bg-[#3b8dd4] rounded-2xl shadow-lg shadow-[#3b8dd4]/20 text-white font-bold text-[15px] hover:bg-[#3b8dd4]/90 transition-colors cursor-pointer overflow-hidden ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={18} /> Media
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*" onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ fontSize: '100px' }} />
            </label>
          </div>
        </div>

        {/* ── File Preview/Info Screen ── */}
        {previewFile && (
          <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col">
            {/* Preview header */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5">
              <button onClick={() => { setPreviewFile(null); setPreviewUrl(''); }} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-white font-medium truncate">{previewFile.original_filename}</p>
                <p className="text-[12px] text-white/30">{formatSize(previewFile.file_size)}</p>
              </div>
              <button onClick={() => { openFileMenu(previewFile.id); }}
                className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/30 p-4">
              {previewLoading ? (
                <Loader2 size={32} className="text-[#3b8dd4] animate-spin" />
              ) : previewUrl ? (
                <>
                  {previewFile.mime_type?.startsWith('image/') && (
                    <img src={previewUrl} alt={previewFile.original_filename}
                      className="max-w-full max-h-full rounded-lg object-contain" />
                  )}
                  {previewFile.mime_type?.startsWith('video/') && (
                    <video src={previewUrl} controls autoPlay playsInline
                      className="max-w-full max-h-full rounded-lg" />
                  )}
                  {previewFile.mime_type?.startsWith('audio/') && (
                    <div className="w-full max-w-md">
                      <div className="w-20 h-20 rounded-2xl bg-[#8B5CF6]/15 flex items-center justify-center mx-auto mb-6">
                        <Music size={36} className="text-[#8B5CF6]" />
                      </div>
                      <audio src={previewUrl} controls className="w-full" />
                    </div>
                  )}
                  {previewFile.mime_type?.includes('pdf') && (
                    <iframe src={previewUrl} className="w-full h-full rounded-lg border border-white/10" />
                  )}
                  {!previewFile.mime_type?.startsWith('image/') && !previewFile.mime_type?.startsWith('video/') && !previewFile.mime_type?.startsWith('audio/') && !previewFile.mime_type?.includes('pdf') && (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: getFileColor(previewFile.mime_type) + '15' }}>
                        {(() => { const I = getFileIcon(previewFile.mime_type); return <I size={36} style={{ color: getFileColor(previewFile.mime_type) }} />; })()}
                      </div>
                      <p className="text-white/40 text-[15px]">Preview not available for this file type</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-white/30">Could not load preview</p>
              )}
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#3b8dd4] text-white font-semibold text-[15px] rounded-xl hover:bg-[#3b8dd4]/90 transition-colors">
                  <Download size={18} /> Download
                </button>
                <button onClick={() => handleShare(previewFile.id, 'read')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white/70 font-medium text-[15px] rounded-xl hover:bg-white/10 transition-colors">
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── File context menu ── */}
        {menuOpen && menuType === 'file' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl shadow-2xl pb-safe"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2" />
              {(() => {
                const file = allFiles.find(f => f.id === menuOpen);
                if (!file) return null;
                return (
                  <>
                    <div className="px-5 py-2 mb-1">
                      <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                      <p className="text-[12px] text-white/30">{formatSize(file.file_size)}</p>
                    </div>
                    <button onClick={() => { handleDownload(file); setMenuOpen(null); }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white/70 hover:bg-white/5">
                      <Download size={20} /> Download
                    </button>
                    <button onClick={() => handleShare(file.id, 'read')}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10">
                      <Eye size={20} /> Share (View Only)
                    </button>
                    <button onClick={() => handleShare(file.id, 'readwrite')}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#C9A84C] hover:bg-[#C9A84C]/10">
                      <Share2 size={20} /> Share (Full Access)
                    </button>
                    <button onClick={() => {
                      const folder = prompt('Move to folder path:', file.folder);
                      if (folder) {
                        fetch('/api/admin/drive', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'move', id: file.id, folder }) })
                          .then(() => { setToast('File moved'); setMenuOpen(null); fetchFiles(); });
                      }
                    }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white/70 hover:bg-white/5">
                      <FolderInput size={20} /> Move
                    </button>
                    <button onClick={() => handleDeleteFile(file)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-red-400 hover:bg-red-500/10">
                      <Trash2 size={20} /> Delete
                    </button>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* ── Folder context menu ── */}
        {menuOpen && menuType === 'folder' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl shadow-2xl pb-safe"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2" />
              <div className="px-5 py-2 mb-1">
                <p className="text-[15px] text-white font-medium capitalize">{menuTarget.replace(/-/g, ' ')}</p>
                <p className="text-[12px] text-white/30">Folder</p>
              </div>
              <button onClick={() => { navigateToFolder(menuOpen!); setMenuOpen(null); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white/70 hover:bg-white/5">
                <FolderOpen size={20} /> Open
              </button>
              <button onClick={async () => {
                const res = await fetch('/api/admin/drive', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'share_folder', folder_path: menuOpen, permission: 'read', user_email: userEmail }),
                });
                const data = await res.json();
                if (data.link) {
                  try { const ta = document.createElement('textarea'); ta.value = data.link; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } catch {}
                  try { await navigator.clipboard.writeText(data.link); } catch {}
                  setToast('View-only folder link copied!');
                }
                setMenuOpen(null);
              }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10">
                <Eye size={20} /> Share Folder (View Only)
              </button>
              <button onClick={async () => {
                const res = await fetch('/api/admin/drive', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'share_folder', folder_path: menuOpen, permission: 'readwrite', user_email: userEmail }),
                });
                const data = await res.json();
                if (data.link) {
                  try { const ta = document.createElement('textarea'); ta.value = data.link; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } catch {}
                  try { await navigator.clipboard.writeText(data.link); } catch {}
                  setToast('Full access folder link copied!');
                }
                setMenuOpen(null);
              }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#C9A84C] hover:bg-[#C9A84C]/10">
                <Share2 size={20} /> Share Folder (Full Access)
              </button>
              <button onClick={() => handleDeleteFolder(menuOpen!, menuTarget)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-red-400 hover:bg-red-500/10">
                <Trash2 size={20} /> Delete Folder
              </button>
            </div>
          </>
        )}

        {/* ── New folder modal ── */}
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
                  className="flex-1 py-2.5 text-[14px] text-white/40 border border-white/10 rounded-xl hover:bg-white/5">
                  Cancel
                </button>
                <button onClick={handleCreateFolder}
                  className="flex-1 py-2.5 text-[14px] bg-[#3b8dd4] text-white font-semibold rounded-xl hover:bg-[#3b8dd4]/90">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#1a1a1a] border border-[#3b8dd4]/30 rounded-full text-[15px] text-[#3b8dd4] shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

// ── File list item (reusable for list view + search results) ──
function FileListItem({ file, onTap, onMenu, menuOpen }: { file: UserFile; onTap: (f: UserFile) => void; onMenu: (id: string) => void; menuOpen: string | null }) {
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
