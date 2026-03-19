'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2, FileIcon, ArrowLeft } from 'lucide-react';

export default function UploadFilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ uploaded: number; errors: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get params from URL
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const userEmail = params?.get('user') || '';
  const folder = params?.get('folder') || '/';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length || !userEmail) return;
    setUploading(true);
    let uploaded = 0;
    let errors = '';
    const UPLOAD_BASE = 'https://upload.rounlimited.com';
    const BOT_TOKEN = '8749047502:AAGIy6qsa_6R81FW88XX1REn3MBTc8NJ7dc';
    const CHAT_ID = '8195603202';

    for (const file of files) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setProgress(`Uploading ${file.name} (${sizeMB} MB)...`);

      try {
        const tgForm = new FormData();
        tgForm.append('chat_id', CHAT_ID);
        tgForm.append('document', file, file.name);
        tgForm.append('caption', `${userEmail} | ${folder} | ${file.name}`);

        const tgRes = await fetch(`${UPLOAD_BASE}/bot${BOT_TOKEN}/sendDocument`, {
          method: 'POST', body: tgForm,
        });
        const tgData = await tgRes.json();

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
          uploaded++;
        } else {
          errors += `${file.name}: ${tgData.description || 'failed'}. `;
        }
      } catch (err) {
        errors += `${file.name}: ${err instanceof Error ? err.message : 'error'}. `;
      }
    }

    setUploading(false);
    setProgress('');
    setResult({ uploaded, errors });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-5">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#3b8dd4]/15 flex items-center justify-center">
            <Upload size={20} className="text-[#3b8dd4]" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-white">Upload Files</h1>
            <p className="text-[13px] text-white/30">to RO Drive{folder !== '/' ? ` → ${folder}` : ''}</p>
          </div>
        </div>

        {result ? (
          // Result
          <div className="text-center py-10">
            {result.uploaded > 0 ? (
              <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
            ) : (
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            )}
            <p className="text-[18px] font-bold text-white mb-2">
              {result.uploaded > 0 ? `${result.uploaded} file${result.uploaded > 1 ? 's' : ''} uploaded!` : 'Upload failed'}
            </p>
            {result.errors && (
              <p className="text-[14px] text-red-400 mb-4 break-words">{result.errors}</p>
            )}
            <p className="text-[14px] text-white/30 mb-6">You can close this tab and go back to RO Drive.</p>
            <button onClick={() => window.close()}
              className="px-6 py-3 bg-[#3b8dd4] text-white font-bold text-[15px] rounded-xl">
              Close
            </button>
          </div>
        ) : uploading ? (
          // Uploading
          <div className="text-center py-10">
            <Loader2 size={48} className="text-[#3b8dd4] animate-spin mx-auto mb-4" />
            <p className="text-[16px] font-semibold text-white mb-2">Uploading...</p>
            <p className="text-[14px] text-[#3b8dd4] break-words">{progress}</p>
          </div>
        ) : (
          // File picker
          <>
            {files.length === 0 ? (
              <label className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-[#3b8dd4]/30 transition-colors">
                <FileIcon size={40} className="text-white/15 mb-4" />
                <p className="text-[16px] text-white/40 mb-1">Tap to select files</p>
                <p className="text-[13px] text-white/20">PDFs, documents, images, videos, anything</p>
                <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-[#141414] border border-white/5 rounded-xl">
                      <FileIcon size={18} className="text-[#3b8dd4] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-white truncate">{f.name}</p>
                        <p className="text-[12px] text-white/25">{(f.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setFiles([]); if (inputRef.current) inputRef.current.value = ''; }}
                    className="flex-1 py-3 text-[15px] text-white/40 border border-white/10 rounded-xl font-medium">
                    Clear
                  </button>
                  <button onClick={handleUpload}
                    className="flex-1 py-3 bg-[#3b8dd4] text-white font-bold text-[15px] rounded-xl">
                    Upload {files.length} file{files.length > 1 ? 's' : ''}
                  </button>
                </div>

                <button onClick={() => inputRef.current?.click()}
                  className="w-full mt-3 py-2 text-[14px] text-white/30 hover:text-white/50">
                  + Add more files
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
