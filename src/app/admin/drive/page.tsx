'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthGuard from '@/components/admin/AuthGuard';
import Link from 'next/link';
import {
  Upload, FolderPlus, Search, Trash2, Download, File, Image, Film,
  FileText, Music, Archive, MoreVertical, X, Loader2, ChevronLeft,
  HardDrive, FolderOpen, Eye, Pencil, FolderInput,
} from 'lucide-react';

interface UserFile {
  id: string;
  user_email: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  folder: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(mime: string) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.startsWith('video/')) return Film;
  if (mime.startsWith('audio/')) return Music;
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return FileText;
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return Archive;
  return File;
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
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState('general');
  const [totalBytes, setTotalBytes] = useState(0);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Get user email
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Fetch files
  const fetchFiles = async () => {
    if (!userEmail) return;
    setLoading(true);
    const params = new URLSearchParams({ user: userEmail });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/drive?${params}`);
    const data = await res.json();
    setFiles(data.files || []);
    setTotalBytes(data.totalBytes || 0);
    setLoading(false);
  };

  useEffect(() => { if (userEmail) fetchFiles(); }, [userEmail, search]);

  // Get unique folders (from files + custom created folders)
  const folders = [...new Set([...files.map(f => f.folder), ...customFolders])].sort();
  const folderFiles = files.filter(f => currentFolder === 'all' ? true : f.folder === currentFolder);

  // Upload
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
      formData.append('folder', currentFolder === 'all' ? 'general' : currentFolder);

      const res = await fetch('/api/admin/drive', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) {
        if (data.setup_required) {
          setToast('Setup needed: Send any message to @Nexavisiongroup_bot on Telegram first');
        } else {
          setToast(`Failed: ${data.error}`);
        }
      } else {
        uploaded++;
      }
    }

    setUploading(false);
    setUploadProgress('');
    if (uploaded > 0) {
      setToast(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`);
      fetchFiles();
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download
  const handleDownload = async (file: UserFile) => {
    const res = await fetch('/api/admin/drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_download_url', id: file.id }),
    });
    const data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank');
    } else {
      setToast('Failed to get download link');
    }
  };

  // Delete
  const handleDelete = async (file: UserFile) => {
    if (!confirm(`Delete ${file.original_filename}?`)) return;
    await fetch('/api/admin/drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: file.id }),
    });
    setToast('File deleted');
    setMenuOpen(null);
    fetchFiles();
  };

  // Move
  const handleMove = async (file: UserFile, folder: string) => {
    await fetch('/api/admin/drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'move', id: file.id, folder }),
    });
    setToast(`Moved to ${folder}`);
    setMenuOpen(null);
    fetchFiles();
  };

  // Create folder — add to a local list so it shows immediately even when empty
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim().toLowerCase().replace(/\s+/g, '-');
    setCustomFolders(prev => prev.includes(name) ? prev : [...prev, name]);
    setCurrentFolder(name);
    setShowNewFolder(false);
    setNewFolderName('');
    setToast(`Folder "${name}" created`);
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link href="/admin" className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5">
              <ChevronLeft size={24} />
            </Link>
            <HardDrive size={22} className="text-[#3b8dd4]" />
            <h1 className="text-[18px] font-bold text-white flex-1">RO Drive</h1>
            <div className="text-[12px] text-white/30 font-mono">
              {formatSize(totalBytes)} used
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1a1a1a] rounded-full border border-white/5">
              <Search size={18} className="text-white/30" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none" />
            </div>
          </div>

          {/* Folder tabs */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setCurrentFolder('all')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                currentFolder === 'all' ? 'bg-[#3b8dd4]/15 text-[#3b8dd4] border border-[#3b8dd4]/30' : 'text-white/40 border border-white/10 hover:bg-white/5'
              }`}>
              All Files
            </button>
            {folders.map(f => (
              <button key={f} onClick={() => setCurrentFolder(f)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors capitalize ${
                  currentFolder === f ? 'bg-[#3b8dd4]/15 text-[#3b8dd4] border border-[#3b8dd4]/30' : 'text-white/40 border border-white/10 hover:bg-white/5'
                }`}>
                {f}
              </button>
            ))}
            <button onClick={() => setShowNewFolder(true)}
              className="px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap text-white/20 border border-dashed border-white/10 hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-colors">
              <FolderPlus size={14} className="inline mr-1" /> New
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="pb-24">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="text-[#3b8dd4] animate-spin" />
            </div>
          ) : folderFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <FolderOpen size={48} className="text-white/10 mb-4" />
              <p className="text-white/30 text-[16px] mb-2">
                {search ? 'No files match your search' : 'No files yet'}
              </p>
              <p className="text-white/15 text-[14px]">
                Tap the upload button to add files
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {folderFiles.map(file => {
                const Icon = getFileIcon(file.mime_type);
                const color = getFileColor(file.mime_type);
                return (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.02] relative">
                    {/* File icon */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color + '15' }}>
                      <Icon size={20} style={{ color }} />
                    </div>

                    {/* File info */}
                    <button onClick={() => handleDownload(file)} className="flex-1 min-w-0 text-left">
                      <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                      <p className="text-[12px] text-white/25 mt-0.5">
                        {formatSize(file.file_size)} &middot; {new Date(file.created_at).toLocaleDateString()}
                        {currentFolder === 'all' && <span className="ml-1 capitalize"> &middot; {file.folder}</span>}
                      </p>
                    </button>

                    {/* Menu */}
                    <button onClick={() => setMenuOpen(menuOpen === file.id ? null : file.id)}
                      className="p-2 rounded-full text-white/20 hover:text-white/50 hover:bg-white/5 shrink-0">
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown */}
                    {menuOpen === file.id && (
                      <div className="absolute right-4 top-12 z-20 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]">
                        <button onClick={() => handleDownload(file)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-white/70 hover:bg-white/5">
                          <Download size={16} /> Download
                        </button>
                        <button onClick={() => {
                          const folder = prompt('Move to folder:', file.folder);
                          if (folder) handleMove(file, folder);
                        }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-white/70 hover:bg-white/5">
                          <FolderInput size={16} /> Move
                        </button>
                        <button onClick={() => handleDelete(file)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-red-400 hover:bg-red-500/10">
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload FAB */}
        <div className="fixed bottom-20 right-5 z-30 flex flex-col items-end gap-3"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
          {uploading && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#3b8dd4]/30 rounded-full text-[13px] text-[#3b8dd4]">
              <Loader2 size={14} className="animate-spin" />
              {uploadProgress}
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-6 py-4 bg-[#1a1a1a] border border-[#3b8dd4]/20 rounded-2xl shadow-lg text-[#3b8dd4] font-bold text-[15px] hover:bg-[#222] transition-colors disabled:opacity-50">
            <Upload size={20} /> Upload
          </button>
        </div>

        {/* Hidden file input (multiple) */}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar" />

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
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#1a1a1a] border border-[#3b8dd4]/30 rounded-full text-[15px] text-[#3b8dd4] shadow-lg">
            {toast}
          </div>
        )}

        {/* Click-outside to close menus */}
        {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
      </div>
    </AuthGuard>
  );
}
