'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthGuard from '@/components/admin/AuthGuard';
import Link from 'next/link';
import {
  Upload, FolderPlus, Search, Trash2, Download, File as FileIcon, Image, Film,
  FileText, Music, Archive, MoreVertical, X, Loader2, ChevronLeft, ChevronRight,
  HardDrive, FolderOpen, Folder, Eye, Share2, FolderInput, Grid3X3, List,
  Home, Plus, Check, Copy, Lock, Clock, Link2, Shield, Trash, Users, Building2, User,
  RotateCcw, CheckSquare, Square, ArrowUpDown, History, Undo2,
} from 'lucide-react';

interface UserFile {
  id: string; user_email: string; filename: string; original_filename: string;
  mime_type: string; file_size: number; folder: string;
  entity_type: string | null; entity_id: string | null; created_at: string;
  deleted_at?: string | null;
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
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ro_drive_path');
      if (saved) return saved;
    }
    return '/';
  });
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
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  // Share sheet state
  const [shareSheet, setShareSheet] = useState<{ type: 'folder' | 'file'; path: string; fileId?: string } | null>(null);
  const [shareSheetTab, setShareSheetTab] = useState<'create' | 'manage'>('create');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState(30);
  const [shareLoading, setShareLoading] = useState(false);
  const [activeShares, setActiveShares] = useState<any[]>([]);
  // User-to-user sharing
  const [shareUserEmail, setShareUserEmail] = useState('');
  const [shareUserPerm, setShareUserPerm] = useState<'read' | 'readwrite'>('read');
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  // Drive zones
  const [driveZone, setDriveZone] = useState<'company' | 'personal' | 'shared'>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('ro_drive_zone') as any) || 'company';
    return 'company';
  });
  // Shared with me data
  const [sharedWithMe, setSharedWithMe] = useState<{ shares: any[]; files: any[]; folders: any[] }>({ shares: [], files: [], folders: [] });
  const [sharedWithMeLoading, setSharedWithMeLoading] = useState(false);
  // Move file picker
  const [moveFile, setMoveFile] = useState<UserFile | null>(null);
  const [movePath, setMovePath] = useState('/');
  // URL download
  const [showUrlDownload, setShowUrlDownload] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [urlDownloading, setUrlDownloading] = useState(false);
  // Trash
  const [showTrash, setShowTrash] = useState(false);
  const [trashFiles, setTrashFiles] = useState<UserFile[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Sort
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [showSort, setShowSort] = useState(false);
  // Drag & drop
  const [dragOver, setDragOver] = useState(false);
  // FAB expand/collapse
  const [fabOpen, setFabOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Persist upload handler in a ref so it survives re-renders
  const handleUploadRef = useRef<(files: FileList) => void>();

  useEffect(() => { if (toast) { const delay = toast.toLowerCase().includes('fail') || toast.toLowerCase().includes('error') ? 8000 : 3000; const t = setTimeout(() => setToast(null), delay); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { localStorage.setItem('ro_drive_view', viewMode); }, [viewMode]);
  useEffect(() => { sessionStorage.setItem('ro_drive_zone', driveZone); }, [driveZone]);

  // Fetch shared with me when that zone is selected
  const fetchSharedWithMe = useCallback(async () => {
    if (!userEmail) return;
    setSharedWithMeLoading(true);
    const res = await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_shared_with_me', user_email: userEmail }),
    });
    const data = await res.json();
    setSharedWithMe({ shares: data.shares || [], files: data.files || [], folders: data.folders || [] });
    setSharedWithMeLoading(false);
  }, [userEmail]);

  useEffect(() => { if (driveZone === 'shared' && userEmail) fetchSharedWithMe(); }, [driveZone, userEmail]);

  // Load admin users list for share sheet
  useEffect(() => {
    if (!shareSheet) return;
    fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_admin_users' }),
    }).then(r => r.json()).then(d => setAdminUsers((d.users || []).filter((e: string) => e !== userEmail)));
  }, [shareSheet, userEmail]);

  // Attach change listeners via DOM (survives Android app-switch re-mounts)
  useEffect(() => {
    const handler = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el.files?.length && handleUploadRef.current) {
        try { (window as any).__roKeepAlive?.(); } catch {}
        handleUploadRef.current(el.files);
        el.value = '';
      }
    };
    const mediaInput = document.getElementById('ro-drive-media-input');
    const filesInput = document.getElementById('ro-drive-upload-input');
    mediaInput?.addEventListener('change', handler);
    filesInput?.addEventListener('change', handler);
    return () => {
      mediaInput?.removeEventListener('change', handler);
      filesInput?.removeEventListener('change', handler);
    };
  }, []);

  // Get user email and save to native bridge
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
        // Save to native app so UploadActivity knows who's uploading
        try { (window as any).RONative?.saveEmail?.(data.user.email); } catch {}
      }
    });
  }, []);

  // Explicit folders from DB
  const [dbFolders, setDbFolders] = useState<{ id: string; path: string; name: string }[]>([]);

  // Zone root path — Company uses / (all non-personal files), Personal uses /personal/{user}
  const getZoneRoot = (zone: string, email: string) => {
    if (zone === 'personal') return `/personal/${email.split('@')[0]}`;
    return '/'; // Company root is / — includes all legacy + non-personal files
  };
  const zoneRoot = driveZone !== 'shared' ? getZoneRoot(driveZone, userEmail) : '/';

  // Fetch files + folders — company zone fetches from ALL users
  const fetchFiles = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    const zoneParam = driveZone !== 'shared' ? `&zone=${driveZone}` : '';
    const res = await fetch(`/api/admin/drive?user=${encodeURIComponent(userEmail)}${zoneParam}`);
    const data = await res.json();
    setAllFiles(data.files || []);
    setTotalBytes(data.totalBytes || 0);
    setDbFolders(data.folders || []);
    setLoading(false);
  }, [userEmail, driveZone]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Load thumbnails for image files in current view
  useEffect(() => {
    if (viewMode !== 'grid') return;
    const imageFiles = allFiles.filter(f => f.mime_type?.startsWith('image/') && !thumbnails[f.id]);
    if (!imageFiles.length) return;
    // Load up to 10 at a time
    imageFiles.slice(0, 10).forEach(async (f) => {
      const url = await getFileUrl(f.id);
      if (url) setThumbnails(prev => ({ ...prev, [f.id]: url }));
    });
  }, [allFiles, viewMode, currentPath]);

  // Zone files/folders — already filtered server-side by zone param
  const zoneFiles = driveZone === 'shared' ? [] : allFiles;
  const zoneFolders = driveZone === 'shared' ? [] : dbFolders;

  const zoneTotalBytes = zoneFiles.reduce((s, f) => s + (f.file_size || 0), 0);

  // ── Sort ──
  const sortFiles = (fileList: UserFile[]) => {
    return [...fileList].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.original_filename.localeCompare(b.original_filename);
        case 'size': return (b.file_size || 0) - (a.file_size || 0);
        case 'type': return (a.mime_type || '').localeCompare(b.mime_type || '');
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  // ── Derive current folder contents ──
  const getFolderContents = () => {
    const normalizedPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';

    // Files directly in this folder
    const filesHere = zoneFiles.filter(f => {
      const filePath = f.folder || '/';
      return filePath === currentPath || filePath === currentPath.replace(/\/$/, '');
    });

    // Subfolders from files (implicit)
    const subfolderMap = new Map<string, { name: string; path: string; fileCount: number; totalSize: number }>();
    zoneFiles.forEach(f => {
      const filePath = (f.folder || '/') + '/';
      if (filePath.startsWith(normalizedPath) && filePath !== normalizedPath) {
        const remainder = filePath.slice(normalizedPath.length);
        const nextSegment = remainder.split('/')[0];
        if (nextSegment && !subfolderMap.has(nextSegment)) {
          const folderPath = normalizedPath + nextSegment;
          const filesInside = zoneFiles.filter(ff => (ff.folder || '/').startsWith(folderPath));
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
    zoneFolders.forEach(df => {
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
      const searchFiles = zoneFiles.filter(f => f.original_filename.toLowerCase().includes(s));
      return { subfolders: [], files: searchFiles };
    }

    return { subfolders, files: filesHere };
  };

  const { subfolders, files: unsortedFiles } = getFolderContents();
  const files = sortFiles(unsortedFiles);

  // Switch zone handler
  const switchZone = (zone: 'company' | 'personal' | 'shared') => {
    setDriveZone(zone);
    setSearch('');
    setShowSearch(false);
    if (zone !== 'shared') {
      const root = getZoneRoot(zone, userEmail);
      setCurrentPath(root);
    }
  };

  // ── Breadcrumb segments ──
  // Strip zone prefix from display path
  const displayPath = driveZone !== 'shared'
    ? (currentPath.startsWith(zoneRoot) ? currentPath.slice(zoneRoot.length) || '/' : currentPath)
    : '/';
  const pathSegments = displayPath.split('/').filter(Boolean);
  const zoneName = driveZone === 'company' ? 'Company Drive' : driveZone === 'personal' ? 'My Drive' : 'Shared with Me';
  const breadcrumbs = [
    { name: zoneName, path: zoneRoot },
    ...pathSegments.map((seg, i) => ({
      name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: zoneRoot + '/' + pathSegments.slice(0, i + 1).join('/'),
    })),
  ];

  // Persist current path to sessionStorage
  useEffect(() => { sessionStorage.setItem('ro_drive_path', currentPath); }, [currentPath]);

  // Correct path when userEmail becomes available and zone is personal
  useEffect(() => {
    if (userEmail && driveZone === 'personal') {
      const root = getZoneRoot('personal', userEmail);
      if (!currentPath.startsWith(root)) setCurrentPath(root);
    }
  }, [userEmail, driveZone]);

  // ── Navigation ──
  const navigateToFolder = (path: string) => {
    // Push history entry so Android back button can walk back up
    window.history.pushState({ drivePath: path }, '');
    setCurrentPath(path);
    setSearch('');
    setShowSearch(false);
    setMenuOpen(null);
  };

  const goBack = () => {
    if (previewFile) { closePreview(); return; }
    if (currentPath === zoneRoot || currentPath === '/') return;
    const segs = currentPath.split('/').filter(Boolean);
    const parent = '/' + segs.slice(0, -1).join('/');
    setCurrentPath(parent.length >= zoneRoot.length ? parent : zoneRoot);
  };

  // ── Handle swipe-back from AppShell (iOS has no back button) ──
  useEffect(() => {
    const handler = (e: Event) => {
      // If in preview, close it
      if (previewFile) { closePreview(); e.preventDefault(); return; }
      // If in a subfolder, go up
      if (currentPath !== zoneRoot && currentPath !== '/') { goBack(); e.preventDefault(); }
      // Otherwise let AppShell handle it (router.back to leave Drive)
    };
    window.addEventListener('swipe-back', handler);
    return () => window.removeEventListener('swipe-back', handler);
  }, [currentPath, zoneRoot, previewFile]);

  // ── Upload with progress tracking ──
  const uploadWithProgress = (url: string, formData: FormData, fileName: string, fileSize: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = e.loaded / elapsed;
          const remaining = (e.total - e.loaded) / speed;
          const speedStr = speed > 1024 * 1024 ? `${(speed / (1024 * 1024)).toFixed(1)} MB/s` : `${(speed / 1024).toFixed(0)} KB/s`;
          const remainStr = remaining > 60 ? `${Math.ceil(remaining / 60)}m left` : `${Math.ceil(remaining)}s left`;
          const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (e.total / (1024 * 1024)).toFixed(1);
          setUploadProgress(`${fileName} — ${pct}% (${loadedMB}/${totalMB} MB) ${speedStr} · ${remainStr}`);
        }
      });

      xhr.addEventListener('load', () => {
        try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({ ok: false }); }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Cancelled')));

      xhr.open('POST', url);
      xhr.send(formData);
    });
  };

  const doUpload = async (fileList: FileList) => {
    if (!fileList?.length || !userEmail) return;
    setUploading(true);
    let uploaded = 0;
    const UPLOAD_BASE = process.env.NEXT_PUBLIC_TELEGRAM_UPLOAD_URL || '';
    const BOT_TOKEN = '8749047502:AAGIy6qsa_6R81FW88XX1REn3MBTc8NJ7dc';
    const CHAT_ID = '8195603202';

    for (const file of Array.from(fileList)) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadProgress(`Preparing ${file.name} (${sizeMB} MB)...`);

      try {
        if (UPLOAD_BASE && file.size > 512 * 1024) { // >512KB goes direct to Oracle, skip Vercel
          // Large file: direct to Oracle/Telegram with progress
          const tgForm = new FormData();
          tgForm.append('chat_id', CHAT_ID);
          tgForm.append('document', file, file.name);
          tgForm.append('caption', `${userEmail} | ${currentPath} | ${file.name}`);

          const tgData = await uploadWithProgress(
            `${UPLOAD_BASE}/bot${BOT_TOKEN}/sendDocument`,
            tgForm, file.name, file.size
          );

          if (tgData.ok) {
            setUploadProgress(`Saving ${file.name}...`);
            // Telegram may return the file as document, video, audio, animation, or voice
            const doc = tgData.result.document || tgData.result.video || tgData.result.audio || tgData.result.animation || tgData.result.voice;
            if (!doc || !doc.file_id) {
              setToast(`Upload succeeded but no file ID returned for ${file.name}`);
              continue;
            }
            const metaRes = await fetch('/api/admin/drive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'save_metadata',
                user_email: userEmail,
                filename: doc.file_name || file.name,
                original_filename: file.name,
                mime_type: doc.mime_type || file.type,
                file_size: doc.file_size || file.size,
                telegram_file_id: doc.file_id,
                folder: currentPath,
              }),
            });
            const metaData = await metaRes.json();
            if (metaData.error) {
              setToast(`Metadata save failed: ${metaData.error}`);
            } else {
              uploaded++;
            }
          } else {
            setToast(`Failed: ${tgData.description || 'Upload error'}`);
          }
        } else {
          // Small file: through Vercel
          setUploadProgress(`Uploading ${file.name} (${sizeMB} MB)...`);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('user_email', userEmail);
          formData.append('folder', currentPath);
          const res = await fetch('/api/admin/drive', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.error) {
            setToast(`Failed: ${data.error}`);
          } else { uploaded++; }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setToast(`Upload failed: ${file.name} — ${errMsg}`);
      }
    }
    setUploading(false);
    setUploadProgress('');
    if (uploaded > 0) { setToast(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`); fetchFiles(); }
  };

  // Keep the ref updated so the DOM listener always calls the latest version
  handleUploadRef.current = doUpload;

  // handleUpload removed — DOM listener in useEffect handles all uploads
  // to avoid double-fire (React onChange + DOM addEventListener both triggering)

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
  const closePreview = () => { setPreviewFile(null); setPreviewUrl(''); };
  const openPreview = async (file: UserFile) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl('');
    window.history.pushState({ drivePreview: true }, '');
    const url = await getFileUrl(file.id);
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  // Android back button — navigate up folders or close preview
  // Uses a ref updated via useEffect (not during render) to avoid React #310
  const backStateRef = useRef({ path: currentPath, root: zoneRoot, hasPreview: !!previewFile });
  useEffect(() => {
    backStateRef.current = { path: currentPath, root: zoneRoot, hasPreview: !!previewFile };
  }, [currentPath, zoneRoot, previewFile]);

  useEffect(() => {
    const onPop = () => {
      const { path, root, hasPreview } = backStateRef.current;
      if (hasPreview) {
        setPreviewFile(null);
        setPreviewUrl('');
        return;
      }
      if (path !== root && path !== '/') {
        const segs = path.split('/').filter(Boolean);
        const parent = '/' + segs.slice(0, -1).join('/');
        setCurrentPath(parent.length >= root.length ? parent : root);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── Download file ──
  const handleDownload = async (file: UserFile) => {
    const resolved = previewUrl || await getFileUrl(file.id);
    if (!resolved) { setToast('Failed to get download link'); return; }

    // get_download_url returns either a direct Telegram/Oracle URL (small files) or an
    // already-wrapped proxy URL (large files). Unwrap so we always hit the proxy once,
    // and force a real download with the correct filename + extension.
    let rawUrl = resolved;
    if (resolved.startsWith('/api/admin/drive/file')) {
      const qs = new URLSearchParams(resolved.split('?')[1] || '');
      rawUrl = decodeURIComponent(qs.get('url') || '');
    }
    const proxyUrl = `/api/admin/drive/file?download=1&filename=${encodeURIComponent(file.original_filename)}&url=${encodeURIComponent(rawUrl)}`;

    // window.open (not a synthetic <a download> click — Android WebView ignores those)
    // triggers the download; the proxy's Content-Disposition: attachment gives it the
    // correct name + extension.
    window.open(proxyUrl, '_blank');
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

  // ── Share sheet helpers ──
  const openShareSheet = async (type: 'folder' | 'file', path: string, fileId?: string) => {
    setShareSheet({ type, path, fileId });
    setShareSheetTab('create');
    setSharePassword('');
    setShareExpiry(30);
    setShareLoading(true);
    setMenuOpen(null);
    // Load existing shares
    if (type === 'folder') {
      const res = await fetch('/api/admin/drive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_folder_shares', folder_path: path, user_email: userEmail }),
      });
      const data = await res.json();
      setActiveShares(data.shares || []);
    } else if (fileId) {
      const res = await fetch('/api/admin/drive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_shares', file_id: fileId }),
      });
      const data = await res.json();
      setActiveShares(data.shares || []);
    }
    setShareLoading(false);
  };

  const createShare = async (permission: 'read' | 'readwrite') => {
    if (!shareSheet) return;
    setShareLoading(true);
    const action = shareSheet.type === 'folder' ? 'share_folder' : 'share';
    const payload: any = {
      action, permission, user_email: userEmail,
      ...(shareSheet.type === 'folder'
        ? { folder_path: shareSheet.path, expiry_days: shareExpiry, password: sharePassword || undefined }
        : { file_id: shareSheet.fileId }),
    };
    const res = await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.link) {
      try { await navigator.clipboard.writeText(data.link); } catch {
        try { const ta = document.createElement('textarea'); ta.value = data.link; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } catch {}
      }
      setToast(data.reused ? 'Existing share link copied!' : `${permission === 'read' ? 'View-only' : 'Full access'} link copied!`);
      // Refresh share list
      openShareSheet(shareSheet.type, shareSheet.path, shareSheet.fileId);
    }
    setShareLoading(false);
  };

  const deleteShareLink = async (shareId: string, type: 'folder' | 'file') => {
    const action = type === 'folder' ? 'delete_folder_share' : 'delete_share';
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, share_id: shareId }),
    });
    setActiveShares(prev => prev.filter(s => s.id !== shareId));
    setToast('Share link revoked');
  };

  const copyLink = async (link: string) => {
    try { await navigator.clipboard.writeText(link); } catch {
      try { const ta = document.createElement('textarea'); ta.value = link; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } catch {}
    }
    setToast('Link copied!');
  };

  // ── Trash ──
  const fetchTrash = async () => {
    if (!userEmail) return;
    setTrashLoading(true);
    const res = await fetch(`/api/admin/drive?user=${encodeURIComponent(userEmail)}&trash=1`);
    const data = await res.json();
    setTrashFiles(data.files || []);
    setTrashLoading(false);
  };

  const restoreFile = async (id: string) => {
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', id }),
    });
    setTrashFiles(prev => prev.filter(f => f.id !== id));
    setToast('File restored');
    fetchFiles();
  };

  const permanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this file? This cannot be undone.')) return;
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'permanent_delete', id }),
    });
    setTrashFiles(prev => prev.filter(f => f.id !== id));
    setToast('File permanently deleted');
  };

  const emptyTrash = async () => {
    if (!confirm(`Permanently delete all ${trashFiles.length} files in trash?`)) return;
    await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'empty_trash', user_email: userEmail }),
    });
    setTrashFiles([]);
    setToast('Trash emptied');
  };

  // sortFiles moved above getFolderContents

  // ── Bulk operations ──
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const { files: currentFiles } = getFolderContents();
    if (selected.size === currentFiles.length) setSelected(new Set());
    else setSelected(new Set(currentFiles.map(f => f.id)));
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Move ${selected.size} file${selected.size > 1 ? 's' : ''} to trash?`)) return;
    for (const id of selected) {
      await fetch('/api/admin/drive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
    }
    setToast(`${selected.size} file${selected.size > 1 ? 's' : ''} moved to trash`);
    setSelected(new Set());
    setSelectMode(false);
    fetchFiles();
  };

  const bulkMove = () => {
    if (!selected.size) return;
    // Use first selected file for the move picker; we'll move all
    const firstFile = allFiles.find(f => selected.has(f.id));
    if (firstFile) { setMoveFile(firstFile); setMovePath('/'); }
  };

  // ── Drag & drop (desktop only — disabled on touch devices to not block scroll) ──
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window);
  const handleDragOver = isTouchDevice ? undefined : (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = isTouchDevice ? undefined : (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const handleDrop = isTouchDevice ? undefined : (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) doUpload(e.dataTransfer.files);
  };

  // ── Share with user ──
  const shareWithUser = async () => {
    if (!shareSheet || !shareUserEmail) return;
    setShareLoading(true);
    const payload: any = {
      action: 'share_with_user', user_email: userEmail,
      shared_with_email: shareUserEmail, permission: shareUserPerm,
      resource_type: shareSheet.type,
      ...(shareSheet.type === 'folder' ? { resource_path: shareSheet.path } : { file_id: shareSheet.fileId }),
    };
    const res = await fetch('/api/admin/drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setToast(data.updated ? `Updated access for ${shareUserEmail}` : `Shared with ${shareUserEmail}`);
      setShareUserEmail('');
    } else {
      setToast(data.error || 'Failed to share');
    }
    setShareLoading(false);
  };

  // ── Move file(s) ──
  const handleMoveFile = async () => {
    if (!moveFile) return;
    if (selected.size > 0) {
      // Bulk move
      for (const id of selected) {
        await fetch('/api/admin/drive', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'move', id, folder: movePath }),
        });
      }
      setToast(`${selected.size} file${selected.size > 1 ? 's' : ''} moved`);
      setSelected(new Set());
      setSelectMode(false);
    } else {
      await fetch('/api/admin/drive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', id: moveFile.id, folder: movePath }),
      });
      setToast(`Moved to ${movePath === '/' ? 'root' : movePath.split('/').filter(Boolean).pop()}`);
    }
    setMoveFile(null);
    fetchFiles();
  };

  // Get subfolders for move picker
  const getMoveFolders = () => {
    const normalizedPath = movePath.endsWith('/') ? movePath : movePath + '/';
    const folderSet = new Map<string, string>();
    allFiles.forEach(f => {
      const fp = (f.folder || '/') + '/';
      if (fp.startsWith(normalizedPath) && fp !== normalizedPath) {
        const nextSeg = fp.slice(normalizedPath.length).split('/')[0];
        if (nextSeg) folderSet.set(nextSeg, normalizedPath + nextSeg);
      }
    });
    dbFolders.forEach(df => {
      const parent = df.path.substring(0, df.path.lastIndexOf('/')) || '/';
      const parentNorm = parent.endsWith('/') ? parent : parent + '/';
      if (parentNorm === normalizedPath || parent === movePath) {
        if (!folderSet.has(df.name)) folderSet.set(df.name, df.path);
      }
    });
    return [...folderSet.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  };

  // ── Download from URL ──
  const handleUrlDownload = async () => {
    if (!downloadUrl.trim() || !userEmail) return;
    setUrlDownloading(true);
    setShowUrlDownload(false);
    setToast('Downloading from URL...');
    try {
      const res = await fetch('/api/admin/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download_url', url: downloadUrl.trim(), folder: currentPath, user_email: userEmail }),
      });
      const data = await res.json();
      if (data.error) {
        setToast(`Download failed: ${data.error}`);
      } else {
        setToast(`Downloaded: ${data.filename}`);
        fetchFiles();
      }
    } catch (err) {
      setToast('Download failed — network error');
    }
    setUrlDownloading(false);
    setDownloadUrl('');
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
      {/* Photo/video picker — DOM change listener handles upload (no React onChange to avoid double-fire) */}
      <input id="ro-drive-media-input" ref={fileInputRef} type="file" multiple accept="image/*,video/*"
        className="fixed" style={{ top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }} />
      {/* All files picker — no accept filter */}
      <input id="ro-drive-upload-input" type="file" multiple
        className="fixed" style={{ top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }} />
      <div className="theme-page-dark flex-1 flex flex-col overflow-y-auto bg-[#0a0a0a]"
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {/* ── Header ── */}
        <div className="theme-header sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2 px-4 py-3">
            {currentPath === zoneRoot || currentPath === '/' ? (
              <Link href="/admin" className="w-11 h-11 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 -ml-1">
                <ChevronLeft size={24} />
              </Link>
            ) : (
              <button onClick={goBack} className="w-11 h-11 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 -ml-1">
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
                  <p className="text-[11px] text-white/20 mt-0.5">{formatSize(zoneTotalBytes)} used</p>
                </div>
                <button onClick={() => openShareSheet('folder', currentPath)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                  <Share2 size={20} />
                </button>
                <button onClick={() => setShowSort(s => !s)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                  <ArrowUpDown size={18} />
                </button>
                <button onClick={() => setShowSearch(true)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                  <Search size={20} />
                </button>
                <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                  {viewMode === 'grid' ? <List size={20} /> : <Grid3X3 size={20} />}
                </button>
              </>
            )}
          </div>

          {/* Zone switcher */}
          <div className="flex gap-1 px-4 py-2 border-t border-white/[0.03]">
            {([
              { key: 'company' as const, label: 'Company', icon: Building2 },
              { key: 'personal' as const, label: 'My Drive', icon: User },
              { key: 'shared' as const, label: 'Shared', icon: Users },
            ]).map(z => (
              <button key={z.key} onClick={() => { switchZone(z.key); setShowTrash(false); setSelectMode(false); setSelected(new Set()); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-colors ${!showTrash && driveZone === z.key ? 'bg-[#3b8dd4]/15 text-[#3b8dd4]' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'}`}>
                <z.icon size={14} />
                {z.label}
              </button>
            ))}
            <button onClick={() => { setShowTrash(true); fetchTrash(); setSelectMode(false); setSelected(new Set()); }}
              className={`px-3 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-colors ${showTrash ? 'bg-red-500/15 text-red-400' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'}`}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Sort dropdown */}
        {showSort && (
          <div className="px-4 py-2 flex gap-2">
            {([
              { key: 'date' as const, label: 'Date' },
              { key: 'name' as const, label: 'Name' },
              { key: 'size' as const, label: 'Size' },
              { key: 'type' as const, label: 'Type' },
            ]).map(s => (
              <button key={s.key} onClick={() => { setSortBy(s.key); setShowSort(false); }}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${sortBy === s.key ? 'bg-[#3b8dd4]/15 text-[#3b8dd4]' : 'bg-white/5 text-white/40 hover:text-white/60'}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Bulk action bar */}
        {selectMode && selected.size > 0 && (
          <div className="sticky top-[110px] z-20 mx-4 mb-2 flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#3b8dd4]/20 rounded-xl">
            <button onClick={selectAll} className="p-1.5 rounded-lg text-[#3b8dd4] hover:bg-[#3b8dd4]/10">
              <CheckSquare size={18} />
            </button>
            <span className="text-[13px] text-white/60 flex-1">{selected.size} selected</span>
            <button onClick={bulkMove} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5" title="Move">
              <FolderInput size={18} />
            </button>
            <button onClick={bulkDelete} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete">
              <Trash2 size={18} />
            </button>
            <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Drag & drop overlay */}
        {dragOver && (
          <div className="fixed inset-0 z-50 bg-[#3b8dd4]/10 border-4 border-dashed border-[#3b8dd4]/40 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload size={48} className="text-[#3b8dd4] mx-auto mb-3" />
              <p className="text-[18px] text-white font-bold">Drop files to upload</p>
              <p className="text-[14px] text-white/40">to {currentPath === '/' ? 'root' : currentPath.split('/').filter(Boolean).pop()}</p>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="pb-24 px-4 lg:px-8 pt-3">
          {showTrash ? (
            /* ── Trash view ── */
            trashLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={28} className="text-red-400 animate-spin" /></div>
            ) : trashFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Trash2 size={52} className="text-white/8 mb-4" />
                <p className="text-white/25 text-[17px] font-medium mb-1">Trash is empty</p>
                <p className="text-white/15 text-[14px]">Deleted files appear here for 30 days</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] text-white/30">{trashFiles.length} file{trashFiles.length !== 1 ? 's' : ''} in trash</p>
                  <button onClick={emptyTrash}
                    className="text-[12px] text-red-400 font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    Empty Trash
                  </button>
                </div>
                <div className="space-y-1">
                  {trashFiles.map(file => {
                    const Icon = getFileIcon(file.mime_type);
                    const color = getFileColor(file.mime_type);
                    return (
                      <div key={file.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '12' }}>
                          <Icon size={20} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                          <p className="text-[12px] text-white/25">{formatSize(file.file_size)} &middot; Deleted {file.deleted_at ? new Date(file.deleted_at).toLocaleDateString() : ''}</p>
                        </div>
                        <button onClick={() => restoreFile(file.id)}
                          className="p-2 rounded-lg text-[#3b8dd4] hover:bg-[#3b8dd4]/10" title="Restore">
                          <Undo2 size={16} />
                        </button>
                        <button onClick={() => permanentDelete(file.id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete permanently">
                          <Trash size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : driveZone === 'shared' ? (
            /* ── Shared with Me view ── */
            sharedWithMeLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={28} className="text-[#3b8dd4] animate-spin" /></div>
            ) : sharedWithMe.folders.length === 0 && sharedWithMe.files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={52} className="text-white/8 mb-4" />
                <p className="text-white/25 text-[17px] font-medium mb-1">Nothing shared with you</p>
                <p className="text-white/15 text-[14px]">When someone shares files or folders with you, they appear here</p>
              </div>
            ) : (
              <>
                {/* Shared folders */}
                {sharedWithMe.folders.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Shared Folders</p>
                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-2.5' : 'space-y-1'}>
                      {sharedWithMe.folders.map((sf: any) => (
                        viewMode === 'grid' ? (
                          <div key={sf.id}
                            className="bg-[#141414] border border-white/5 rounded-2xl p-4 text-left">
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-11 h-11 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center">
                                <Folder size={22} className="text-[#3b8dd4]" />
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sf.permission === 'readwrite' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-[#3b8dd4]/15 text-[#3b8dd4]'}`}>
                                {sf.permission === 'readwrite' ? 'Edit' : 'View'}
                              </span>
                            </div>
                            <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name?.replace(/-/g, ' ')}</p>
                            <p className="text-[12px] text-white/25 mt-0.5">{sf.file_count} file{sf.file_count !== 1 ? 's' : ''} &middot; {formatSize(sf.total_size)}</p>
                            <p className="text-[11px] text-white/15 mt-1">From {sf.owner_email?.split('@')[0]}</p>
                          </div>
                        ) : (
                          <div key={sf.id}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/10 flex items-center justify-center shrink-0">
                              <Folder size={20} className="text-[#3b8dd4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] text-white font-medium truncate capitalize">{sf.name?.replace(/-/g, ' ')}</p>
                              <p className="text-[12px] text-white/25">{sf.file_count} file{sf.file_count !== 1 ? 's' : ''} &middot; {formatSize(sf.total_size)} &middot; From {sf.owner_email?.split('@')[0]}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sf.permission === 'readwrite' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-[#3b8dd4]/15 text-[#3b8dd4]'}`}>
                              {sf.permission === 'readwrite' ? 'Edit' : 'View'}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared files */}
                {sharedWithMe.files.length > 0 && (
                  <div>
                    <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Shared Files</p>
                    <div className="space-y-1">
                      {sharedWithMe.files.map((file: any) => {
                        const Icon = getFileIcon(file.mime_type);
                        const color = getFileColor(file.mime_type);
                        return (
                          <div key={file.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '12' }}>
                              <Icon size={20} style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
                              <p className="text-[12px] text-white/25">{formatSize(file.file_size)} &middot; From {file.shared_by?.split('@')[0]}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${file.share_permission === 'readwrite' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-[#3b8dd4]/15 text-[#3b8dd4]'}`}>
                              {file.share_permission === 'readwrite' ? 'Edit' : 'View'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          ) : loading ? (
            <div className="flex justify-center py-20"><Loader2 size={28} className="text-[#3b8dd4] animate-spin" /></div>
          ) : search ? (
            // Search results
            <>
              <p className="text-[13px] text-white/30 mb-3">{files.length} result{files.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
              {files.length === 0 ? (
                <div className="text-center py-16"><p className="text-white/20 text-[16px]">No files found</p></div>
              ) : (
                <div className="space-y-1">
                  {files.map(file => <FileListItem key={file.id} file={file} onTap={openPreview} onMenu={openFileMenu} menuOpen={menuOpen} selectMode={selectMode} isSelected={selected.has(file.id)} onToggle={toggleSelect} />)}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Recent files — show at zone root */}
              {currentPath === zoneRoot && !selectMode && zoneFiles.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <History size={12} /> Recent
                    </p>
                    <button onClick={() => setSelectMode(true)} className="text-[11px] text-white/25 hover:text-white/50 px-2 py-1 rounded-lg hover:bg-white/5">
                      Select
                    </button>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {zoneFiles.slice(0, 8).map(file => {
                      const Icon = getFileIcon(file.mime_type);
                      const color = getFileColor(file.mime_type);
                      return (
                        <button key={file.id} onClick={() => openPreview(file)}
                          className="shrink-0 w-28 bg-[#141414] border border-white/5 rounded-xl overflow-hidden text-left hover:border-white/10 active:scale-[0.97] transition-all">
                          {file.mime_type?.startsWith('image/') && thumbnails[file.id] ? (
                            <div className="w-full h-16 bg-black/30"><img src={thumbnails[file.id]} alt="" className="w-full h-full object-cover" /></div>
                          ) : (
                            <div className="w-full h-16 flex items-center justify-center" style={{ backgroundColor: color + '08' }}>
                              <Icon size={24} style={{ color }} />
                            </div>
                          )}
                          <div className="px-2 py-1.5">
                            <p className="text-[11px] text-white font-medium truncate">{file.original_filename}</p>
                            <p className="text-[10px] text-white/20">{new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Folders */}
              {subfolders.length > 0 && (
                <div className="mb-4">
                  <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold mb-2 px-1">Folders</p>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
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
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold">Files</p>
                    {!selectMode && files.length > 1 && (
                      <button onClick={() => setSelectMode(true)} className="text-[11px] text-white/25 hover:text-white/50 px-2 py-1 rounded-lg hover:bg-white/5">Select</button>
                    )}
                  </div>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
                      {files.map(file => {
                        const Icon = getFileIcon(file.mime_type);
                        const color = getFileColor(file.mime_type);
                        return (
                          <button key={file.id} onClick={() => selectMode ? toggleSelect(file.id) : openPreview(file)}
                            className={`relative bg-[#141414] border rounded-2xl overflow-hidden text-left hover:border-white/10 transition-all active:scale-[0.98] group ${selected.has(file.id) ? 'border-[#3b8dd4]/40 bg-[#3b8dd4]/[0.05]' : 'border-white/5'}`}>
                            {/* Select checkbox */}
                            {selectMode && (
                              <div className="absolute top-2 left-2 z-10">
                                {selected.has(file.id)
                                  ? <CheckSquare size={18} className="text-[#3b8dd4]" />
                                  : <Square size={18} className="text-white/25" />}
                              </div>
                            )}
                            {/* Thumbnail for images */}
                            {file.mime_type?.startsWith('image/') && thumbnails[file.id] ? (
                              <div className="w-full h-28 bg-black/30 relative">
                                <img src={thumbnails[file.id]} alt="" className="w-full h-full object-cover" />
                                {!selectMode && <button onClick={e => { e.stopPropagation(); openFileMenu(file.id); }}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/70 hover:bg-black/70 transition-colors">
                                  <MoreVertical size={14} />
                                </button>}
                              </div>
                            ) : (
                              <div className="flex items-start justify-between p-4 pb-2">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '12' }}>
                                  <Icon size={22} style={{ color }} />
                                </div>
                                {!selectMode && <button onClick={e => { e.stopPropagation(); openFileMenu(file.id); }}
                                  className="p-1.5 rounded-full text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                                  <MoreVertical size={16} />
                                </button>}
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
                      {files.map(file => <FileListItem key={file.id} file={file} onTap={openPreview} onMenu={openFileMenu} menuOpen={menuOpen} selectMode={selectMode} isSelected={selected.has(file.id)} onToggle={toggleSelect} />)}
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

        {/* ── FAB — collapsible, bottom-right ── */}
        {!showTrash && driveZone !== 'shared' && (
          <>
            {/* Backdrop to close FAB */}
            {fabOpen && <div className="fixed inset-0 z-29" onClick={() => setFabOpen(false)} />}
            <div className="fixed bottom-5 right-3 z-30 flex flex-col items-end gap-2"
              style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
              {uploading && (
                <div className="w-[calc(100vw-2rem)] max-w-sm px-3 py-2 bg-[#111] border border-[#3b8dd4]/30 rounded-xl shadow-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-[#3b8dd4] shrink-0" />
                    <p className="text-[12px] text-[#3b8dd4] leading-snug truncate flex-1">{uploadProgress}</p>
                  </div>
                </div>
              )}
              {/* Expanded options */}
              {fabOpen && (
                <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button onClick={() => { setShowNewFolder(true); setFabOpen(false); }}
                    className="flex items-center gap-2 px-3 h-9 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg text-white/50 text-[13px] font-medium hover:bg-white/5 transition-colors">
                    <FolderPlus size={15} className="text-[#3b8dd4]" /> New Folder
                  </button>
                  <button onClick={() => {
                    setFabOpen(false);
                    if ((window as any).RONative?.isNativeApp?.()) {
                      (window as any).RONative.openUploader(userEmail, currentPath);
                    } else {
                      const params = new URLSearchParams({ user: userEmail, folder: currentPath });
                      const a = document.createElement('a');
                      a.href = `/admin/drive/upload-files?${params}`;
                      a.target = '_blank';
                      a.rel = 'noopener noreferrer';
                      a.click();
                    }
                  }} disabled={uploading}
                    className="flex items-center gap-2 px-3 h-9 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg text-white/50 text-[13px] font-medium hover:bg-white/5 transition-colors">
                    <FileIcon size={15} className="text-white/40" /> Upload Files
                  </button>
                  <button onClick={() => { setFabOpen(false); document.getElementById('ro-drive-media-input')?.click(); }} disabled={uploading}
                    className="flex items-center gap-2 px-3 h-9 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg text-white/50 text-[13px] font-medium hover:bg-white/5 transition-colors">
                    <Image size={15} className="text-[#22C55E]" /> Photos
                  </button>
                  <button onClick={() => { setShowUrlDownload(true); setFabOpen(false); }}
                    className="flex items-center gap-2 px-3 h-9 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg text-white/50 text-[13px] font-medium hover:bg-white/5 transition-colors">
                    <Link2 size={15} className="text-[#C9A84C]" /> From URL
                  </button>
                </div>
              )}
              {/* Main FAB toggle */}
              <button onClick={() => setFabOpen(!fabOpen)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${fabOpen ? 'bg-white/10 border border-white/10 rotate-45' : 'bg-[#3b8dd4] shadow-[#3b8dd4]/30'}`}>
                <Plus size={22} className={fabOpen ? 'text-white/60' : 'text-white'} />
              </button>
            </div>
          </>
        )}

        {/* ── File Preview/Info Screen ── */}
        {previewFile && (
          <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col">
            {/* Preview header */}
            <div className="flex items-center gap-2 px-2 py-2 border-b border-white/5">
              <button onClick={() => window.history.back()} className="w-11 h-11 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/5 active:bg-white/10">
                <ChevronLeft size={26} />
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
                  {/* Office docs — docx, xlsx, pptx via Microsoft Office Online viewer */}
                  {(previewFile.mime_type?.includes('word') || previewFile.mime_type?.includes('spreadsheet') || previewFile.mime_type?.includes('presentation') ||
                    previewFile.mime_type?.includes('msword') || previewFile.mime_type?.includes('excel') || previewFile.mime_type?.includes('powerpoint') ||
                    previewFile.original_filename?.match(/\.(docx?|xlsx?|pptx?)$/i)) && (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
                      className="w-full h-full rounded-lg border border-white/10 bg-white"
                      style={{ minHeight: '80vh' }}
                    />
                  )}
                  {!previewFile.mime_type?.startsWith('image/') && !previewFile.mime_type?.startsWith('video/') && !previewFile.mime_type?.startsWith('audio/') && !previewFile.mime_type?.includes('pdf') &&
                   !previewFile.mime_type?.includes('word') && !previewFile.mime_type?.includes('spreadsheet') && !previewFile.mime_type?.includes('presentation') &&
                   !previewFile.mime_type?.includes('msword') && !previewFile.mime_type?.includes('excel') && !previewFile.mime_type?.includes('powerpoint') &&
                   !previewFile.original_filename?.match(/\.(docx?|xlsx?|pptx?)$/i) && (
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
                <button onClick={() => openShareSheet('file', previewFile.folder || '/', previewFile.id)}
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
                    <button onClick={() => openShareSheet('file', file.folder || '/', file.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10">
                      <Share2 size={20} /> Share
                    </button>
                    <button onClick={() => { setMoveFile(file); setMovePath('/'); setMenuOpen(null); }}
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
              <button onClick={() => openShareSheet('folder', menuOpen!)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#3b8dd4] hover:bg-[#3b8dd4]/10">
                <Share2 size={20} /> Share Folder
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

        {/* ── URL Download modal ── */}
        {showUrlDownload && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowUrlDownload(false)}>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="text-[17px] font-semibold text-white mb-1">Download from URL</h3>
              <p className="text-[12px] text-white/30 mb-4">Paste any file URL — the server will download it to your current folder</p>
              <input type="url" value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)}
                placeholder="https://example.com/file.pdf" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleUrlDownload()}
                className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 mb-4" />
              <div className="flex gap-2">
                <button onClick={() => { setShowUrlDownload(false); setDownloadUrl(''); }}
                  className="flex-1 py-2.5 text-[14px] text-white/40 border border-white/10 rounded-xl hover:bg-white/5">
                  Cancel
                </button>
                <button onClick={handleUrlDownload} disabled={!downloadUrl.trim() || urlDownloading}
                  className="flex-1 py-2.5 text-[14px] bg-[#C9A84C] text-black font-semibold rounded-xl hover:bg-[#C9A84C]/90 disabled:opacity-40">
                  {urlDownloading ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Share options sheet ── */}
        {shareSheet && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShareSheet(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2" />

              {/* Header */}
              <div className="px-5 pt-1 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-white">
                    Share {shareSheet.type === 'folder' ? 'Folder' : 'File'}
                  </h3>
                  <p className="text-[12px] text-white/30 mt-0.5 truncate max-w-[250px]">
                    {shareSheet.type === 'folder' ? (shareSheet.path === '/' ? 'Root Drive' : shareSheet.path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')) : 'Selected file'}
                  </p>
                </div>
                <button onClick={() => setShareSheet(null)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mx-5 mb-4 p-1 bg-[#0a0a0a] rounded-xl">
                <button onClick={() => setShareSheetTab('create')}
                  className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors ${shareSheetTab === 'create' ? 'bg-[#3b8dd4] text-white' : 'text-white/40 hover:text-white/60'}`}>
                  Create Link
                </button>
                <button onClick={() => setShareSheetTab('manage')}
                  className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors ${shareSheetTab === 'manage' ? 'bg-[#3b8dd4] text-white' : 'text-white/40 hover:text-white/60'}`}>
                  Manage ({activeShares.filter(s => !s.expired).length})
                </button>
              </div>

              {shareSheetTab === 'create' ? (
                <div className="px-5 pb-3">
                  {/* Quick share buttons */}
                  <div className="space-y-2.5 mb-5">
                    <button onClick={() => createShare('read')} disabled={shareLoading}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#3b8dd4]/10 border border-[#3b8dd4]/20 rounded-xl hover:bg-[#3b8dd4]/15 transition-colors active:scale-[0.98]">
                      <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/20 flex items-center justify-center">
                        <Eye size={20} className="text-[#3b8dd4]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] text-white font-medium">View Only</p>
                        <p className="text-[12px] text-white/30">Recipients can view and download</p>
                      </div>
                      <Copy size={16} className="text-white/20" />
                    </button>

                    <button onClick={() => createShare('readwrite')} disabled={shareLoading}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl hover:bg-[#C9A84C]/15 transition-colors active:scale-[0.98]">
                      <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center">
                        <Share2 size={20} className="text-[#C9A84C]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] text-white font-medium">Full Access</p>
                        <p className="text-[12px] text-white/30">Upload, create folders, and delete</p>
                      </div>
                      <Copy size={16} className="text-white/20" />
                    </button>
                  </div>

                  {/* Advanced options (folder shares only) */}
                  {shareSheet.type === 'folder' && (
                    <div className="space-y-3">
                      <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold">Options</p>

                      {/* Password */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                        <Lock size={18} className="text-white/30 shrink-0" />
                        <input type="text" value={sharePassword} onChange={e => setSharePassword(e.target.value)}
                          placeholder="Password (optional)"
                          className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 focus:outline-none" />
                        {sharePassword && (
                          <button onClick={() => setSharePassword('')} className="p-1 text-white/20 hover:text-white/40">
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Expiration */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                        <Clock size={18} className="text-white/30 shrink-0" />
                        <select value={shareExpiry} onChange={e => setShareExpiry(Number(e.target.value))}
                          className="flex-1 bg-transparent text-[14px] text-white focus:outline-none appearance-none cursor-pointer">
                          <option value={7} className="bg-[#1a1a1a]">Expires in 7 days</option>
                          <option value={30} className="bg-[#1a1a1a]">Expires in 30 days</option>
                          <option value={90} className="bg-[#1a1a1a]">Expires in 90 days</option>
                          <option value={0} className="bg-[#1a1a1a]">Never expires</option>
                        </select>
                      </div>

                      {sharePassword && (
                        <p className="text-[12px] text-[#C9A84C]/60 px-1">
                          Password-protected links always create a new share
                        </p>
                      )}
                    </div>
                  )}

                  {/* Share with specific user */}
                  {adminUsers.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <p className="text-[12px] text-white/25 uppercase tracking-wider font-semibold">Share with User</p>
                      <div className="flex gap-2">
                        <select value={shareUserEmail} onChange={e => setShareUserEmail(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-[#0a0a0a] border border-white/5 rounded-xl text-[14px] text-white focus:outline-none appearance-none cursor-pointer">
                          <option value="" className="bg-[#1a1a1a]">Select user...</option>
                          {adminUsers.map(email => (
                            <option key={email} value={email} className="bg-[#1a1a1a]">{email}</option>
                          ))}
                        </select>
                        <select value={shareUserPerm} onChange={e => setShareUserPerm(e.target.value as any)}
                          className="px-3 py-2.5 bg-[#0a0a0a] border border-white/5 rounded-xl text-[13px] text-white/60 focus:outline-none appearance-none cursor-pointer">
                          <option value="read" className="bg-[#1a1a1a]">View</option>
                          <option value="readwrite" className="bg-[#1a1a1a]">Edit</option>
                        </select>
                      </div>
                      <button onClick={shareWithUser} disabled={!shareUserEmail || shareLoading}
                        className="w-full py-2.5 bg-white/5 border border-white/10 text-white/60 font-medium text-[14px] rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30">
                        <Users size={16} className="inline mr-2" />Share with User
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5 pb-3">
                  {shareLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-[#3b8dd4]" />
                    </div>
                  ) : activeShares.length === 0 ? (
                    <div className="text-center py-8">
                      <Link2 size={32} className="text-white/10 mx-auto mb-2" />
                      <p className="text-white/25 text-[14px]">No share links yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeShares.map(share => (
                        <div key={share.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${share.expired ? 'bg-red-500/5 border-red-500/10 opacity-50' : 'bg-[#0a0a0a] border-white/5'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[13px] font-medium ${share.permission === 'readwrite' ? 'text-[#C9A84C]' : 'text-[#3b8dd4]'}`}>
                                {share.permission === 'readwrite' ? 'Full Access' : 'View Only'}
                              </span>
                              {share.has_password && <Lock size={12} className="text-white/30" />}
                              {share.expired && <span className="text-[11px] text-red-400">Expired</span>}
                            </div>
                            <p className="text-[11px] text-white/20">
                              {share.accessed_count || 0} view{share.accessed_count !== 1 ? 's' : ''}
                              {share.expires_at ? ` · Expires ${new Date(share.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ' · Never expires'}
                            </p>
                          </div>
                          {!share.expired && (
                            <button onClick={() => copyLink(share.link)}
                              className="p-2 rounded-lg text-white/30 hover:text-[#3b8dd4] hover:bg-[#3b8dd4]/10 transition-colors">
                              <Copy size={16} />
                            </button>
                          )}
                          <button onClick={() => deleteShareLink(share.id, shareSheet.type)}
                            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Move file picker ── */}
        {moveFile && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setMoveFile(null)}>
            <div className="w-full max-w-lg bg-[#141414] border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2" />
              <div className="px-5 pb-3 border-b border-white/5">
                <h3 className="text-[17px] font-bold text-white">Move &ldquo;{moveFile.original_filename}&rdquo;</h3>
                <p className="text-[12px] text-white/30 mt-0.5">Select destination folder</p>
              </div>

              {/* Breadcrumb for move path */}
              <div className="flex items-center gap-1 px-5 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => setMovePath('/')}
                  className={`text-[13px] font-medium shrink-0 ${movePath === '/' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                  Root
                </button>
                {movePath.split('/').filter(Boolean).map((seg, i, arr) => (
                  <div key={i} className="flex items-center shrink-0">
                    <ChevronRight size={12} className="text-white/15 mx-0.5" />
                    <button onClick={() => setMovePath('/' + arr.slice(0, i + 1).join('/'))}
                      className={`text-[13px] font-medium capitalize ${i === arr.length - 1 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                      {seg.replace(/-/g, ' ')}
                    </button>
                  </div>
                ))}
              </div>

              {/* Folder list */}
              <div className="flex-1 overflow-y-auto px-3">
                {movePath !== '/' && (
                  <button onClick={() => {
                    const segs = movePath.split('/').filter(Boolean);
                    setMovePath('/' + segs.slice(0, -1).join('/') || '/');
                  }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/40 hover:bg-white/[0.03]">
                    <ChevronLeft size={18} /> Back
                  </button>
                )}
                {getMoveFolders().map(([name, path]) => (
                  <button key={path} onClick={() => setMovePath(path)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors active:bg-white/[0.05]">
                    <div className="w-9 h-9 rounded-lg bg-[#3b8dd4]/10 flex items-center justify-center shrink-0">
                      <Folder size={18} className="text-[#3b8dd4]" />
                    </div>
                    <span className="text-[14px] text-white font-medium capitalize truncate">{name.replace(/-/g, ' ')}</span>
                    <ChevronRight size={16} className="text-white/15 ml-auto shrink-0" />
                  </button>
                ))}
                {getMoveFolders().length === 0 && movePath === '/' && (
                  <p className="text-center text-white/20 text-[13px] py-6">No subfolders — file will move to root</p>
                )}
              </div>

              {/* Move here button */}
              <div className="px-5 pt-3 flex gap-2">
                <button onClick={() => setMoveFile(null)}
                  className="flex-1 py-3 text-[14px] text-white/40 border border-white/10 rounded-xl hover:bg-white/5">
                  Cancel
                </button>
                <button onClick={handleMoveFile}
                  className="flex-1 py-3 text-[14px] bg-[#3b8dd4] text-white font-semibold rounded-xl hover:bg-[#3b8dd4]/90">
                  Move Here
                </button>
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
    </AuthGuard>
  );
}

// ── File list item (reusable for list view + search results) ──
function FileListItem({ file, onTap, onMenu, menuOpen, selectMode, isSelected, onToggle }: {
  file: UserFile; onTap: (f: UserFile) => void; onMenu: (id: string) => void; menuOpen: string | null;
  selectMode?: boolean; isSelected?: boolean; onToggle?: (id: string) => void;
}) {
  const Icon = getFileIcon(file.mime_type);
  const color = getFileColor(file.mime_type);
  return (
    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors active:bg-white/[0.05] ${isSelected ? 'bg-[#3b8dd4]/[0.05]' : ''}`}
      onClick={() => selectMode && onToggle ? onToggle(file.id) : undefined}>
      {selectMode ? (
        <div className="shrink-0">
          {isSelected ? <CheckSquare size={20} className="text-[#3b8dd4]" /> : <Square size={20} className="text-white/25" />}
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '12' }}>
          <Icon size={20} style={{ color }} />
        </div>
      )}
      <button onClick={() => !selectMode && onTap(file)} className="flex-1 min-w-0 text-left">
        <p className="text-[15px] text-white font-medium truncate">{file.original_filename}</p>
        <p className="text-[12px] text-white/25">{formatSize(file.file_size)} &middot; {new Date(file.created_at).toLocaleDateString()}</p>
      </button>
      {!selectMode && (
        <button onClick={() => onMenu(file.id)} className="p-2 rounded-full text-white/15 hover:text-white/40 hover:bg-white/5 shrink-0">
          <MoreVertical size={18} />
        </button>
      )}
    </div>
  );
}
