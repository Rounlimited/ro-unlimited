'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2, X, ChevronDown, Image, FileText, Film, Music, File as FileIcon } from 'lucide-react';

function getIcon(type: string) {
  if (type?.startsWith('image/')) return Image;
  if (type?.startsWith('video/')) return Film;
  if (type?.startsWith('audio/')) return Music;
  if (type?.includes('pdf')) return FileText;
  return FileIcon;
}

function getColor(type: string) {
  if (type?.startsWith('image/')) return '#22C55E';
  if (type?.startsWith('video/')) return '#3b8dd4';
  if (type?.includes('pdf')) return '#EF4444';
  return '#C9A84C';
}

export default function UploadFilesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('');
  const [status, setStatus] = useState<'pick' | 'confirm' | 'uploading' | 'done' | 'error'>('pick');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const userEmail = params?.get('user') || '';
  const [folder, setFolder] = useState(params?.get('folder') || '/');
  const [folders, setFolders] = useState<string[]>(['/']);

  // Fetch available folders
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/admin/drive?user=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => {
        const paths = new Set<string>(['/']);
        (d.files || []).forEach((f: any) => { if (f.folder) paths.add(f.folder); });
        (d.folders || []).forEach((f: any) => { if (f.path) paths.add(f.path); });
        setFolders([...paths].sort());
      })
      .catch(() => {});
  }, [userEmail]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStatus('confirm');

    // Generate preview for images
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleUpload = () => {
    if (!file || !userEmail) return;
    setStatus('uploading');
    setProgress(0);

    const UPLOAD_BASE = 'https://upload.rounlimited.com';
    const BOT_TOKEN = '8749047502:AAGIy6qsa_6R81FW88XX1REn3MBTc8NJ7dc';
    const CHAT_ID = '8195603202';

    const tgForm = new FormData();
    tgForm.append('chat_id', CHAT_ID);
    tgForm.append('document', file, file.name);
    tgForm.append('caption', `${userEmail} | ${folder} | ${file.name}`);

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
        const elapsed = (Date.now() - startTime) / 1000;
        const spd = e.loaded / elapsed;
        setSpeed(spd > 1024 * 1024 ? `${(spd / 1024 / 1024).toFixed(1)} MB/s` : `${(spd / 1024).toFixed(0)} KB/s`);
      }
    });

    xhr.addEventListener('load', async () => {
      try {
        const tgData = JSON.parse(xhr.responseText);
        if (tgData.ok) {
          const doc = tgData.result.document;
          await fetch('/api/admin/drive', {
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
              folder,
            }),
          });
          setUploadedCount(1);
          setStatus('done');
        } else {
          setErrorMsg(tgData.description || 'Upload rejected by server');
          setStatus('error');
        }
      } catch (e) {
        setErrorMsg('Invalid server response');
        setStatus('error');
      }
    });

    xhr.addEventListener('error', () => {
      setErrorMsg('Network error — check your connection');
      setStatus('error');
    });

    xhr.addEventListener('timeout', () => {
      setErrorMsg('Upload timed out');
      setStatus('error');
    });

    xhr.timeout = 600000; // 10 min
    xhr.open('POST', `${UPLOAD_BASE}/bot${BOT_TOKEN}/sendDocument`);
    xhr.send(tgForm);
  };

  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : '0';
  const Icon = file ? getIcon(file.type) : FileIcon;
  const color = file ? getColor(file.type) : '#888';
  const folderName = folder === '/' ? 'RO Drive (root)' : folder.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'RO Drive';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header — like Google Drive */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button onClick={() => window.close()} className="p-2 text-white/40">
          <X size={24} />
        </button>
        <span className="text-[18px] font-bold text-white">Upload to Drive</span>
        {status === 'confirm' ? (
          <button onClick={handleUpload} className="px-5 py-2 bg-[#3b8dd4] text-white font-bold text-[15px] rounded-full">
            Upload
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      <div className="p-5">
        {/* ── PICK FILE ── */}
        {status === 'pick' && (
          <label className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-[#3b8dd4]/30 transition-colors">
            <Upload size={44} className="text-white/15 mb-4" />
            <p className="text-[17px] text-white/50 font-medium mb-1">Tap to select a file</p>
            <p className="text-[14px] text-white/25">PDFs, photos, videos, documents, anything</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelect} />
          </label>
        )}

        {/* ── CONFIRM — Google Drive style ── */}
        {status === 'confirm' && file && (
          <div className="space-y-5">
            {/* File preview */}
            <div className="flex flex-col items-center py-6">
              {preview ? (
                <img src={preview} alt="" className="w-48 h-48 object-cover rounded-2xl border border-white/10 mb-4" />
              ) : (
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: color + '15' }}>
                  <Icon size={48} style={{ color }} />
                </div>
              )}
            </div>

            {/* File name */}
            <div className="border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[12px] text-white/30 mb-1">File name</p>
              <div className="flex items-center gap-2">
                <Icon size={18} style={{ color }} />
                <p className="text-[16px] text-white">{file.name}</p>
              </div>
              <p className="text-[13px] text-white/30 mt-1">{sizeMB} MB</p>
            </div>

            {/* Location (folder picker) */}
            <div className="border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[12px] text-white/30 mb-1">Location</p>
              <div className="flex items-center gap-2">
                <span className="text-[16px]">📁</span>
                <select value={folder} onChange={e => setFolder(e.target.value)}
                  className="flex-1 bg-transparent text-[16px] text-white focus:outline-none appearance-none">
                  {folders.map(f => (
                    <option key={f} value={f} className="bg-[#1a1a1a] text-white">
                      {f === '/' ? 'RO Drive (root)' : f.split('/').filter(Boolean).join(' / ')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="text-white/30" />
              </div>
            </div>

            {/* Account */}
            <div className="border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[12px] text-white/30 mb-1">Account</p>
              <p className="text-[16px] text-white">{userEmail}</p>
            </div>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {status === 'uploading' && (
          <div className="text-center py-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#1a1a1a" strokeWidth="6" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="#3b8dd4" strokeWidth="6" fill="none"
                  strokeDasharray={264} strokeDashoffset={264 - (264 * progress / 100)}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[20px] font-bold text-white">
                {progress}%
              </span>
            </div>
            <p className="text-[16px] text-white font-medium mb-1">{file?.name}</p>
            <p className="text-[14px] text-[#3b8dd4]">{speed}</p>
          </div>
        )}

        {/* ── DONE ── */}
        {status === 'done' && (
          <div className="text-center py-12">
            <CheckCircle2 size={52} className="text-green-400 mx-auto mb-4" />
            <p className="text-[20px] font-bold text-white mb-2">Uploaded!</p>
            <p className="text-[15px] text-white/40 mb-6">{file?.name} is now in your RO Drive</p>
            <button onClick={() => window.close()}
              className="px-8 py-3 bg-[#3b8dd4] text-white font-bold text-[16px] rounded-xl">
              Done
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <div className="text-center py-12">
            <XCircle size={52} className="text-red-400 mx-auto mb-4" />
            <p className="text-[20px] font-bold text-white mb-2">Upload Failed</p>
            <p className="text-[14px] text-red-400 mb-6 break-words px-4">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStatus('confirm'); setErrorMsg(''); }}
                className="px-6 py-3 bg-white/10 text-white font-bold text-[15px] rounded-xl">
                Try Again
              </button>
              <button onClick={() => window.close()}
                className="px-6 py-3 bg-[#3b8dd4] text-white font-bold text-[15px] rounded-xl">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
