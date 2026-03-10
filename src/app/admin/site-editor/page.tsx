'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Video, Type, Check, Loader2, Trash2, Eye, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SiteSettings {
  heroVideoUrl?: string;
  commercialVideoUrl?: string;
  residentialVideoUrl?: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  dragOver: boolean;
}

type Target = 'heroVideo' | 'commercialVideo' | 'residentialVideo';
const fresh = (): UploadState => ({ uploading: false, progress: 0, dragOver: false });

// Upload directly from browser → Sanity CDN using project subdomain (CORS allowed)
// Then save the asset reference via our API (tiny JSON, no size limit issue)
async function uploadVideo(
  file: File,
  target: Target,
  onProgress: (pct: number) => void
): Promise<{ assetId: string; url: string }> {
  // Get write token from our API (never hardcoded client-side in source)
  const cfgRes = await fetch('/api/admin/upload-config');
  if (!cfgRes.ok) throw new Error('Could not get upload config');
  const { token, dataset, apiVersion } = await cfgRes.json();

  // Upload direct to Sanity using PROJECT SUBDOMAIN — this is what allows CORS
  // api.sanity.io (without subdomain) does NOT return ACAO header
  const uploadUrl = `https://3at2yyx0.api.sanity.io/v${apiVersion}/assets/files/${dataset}?filename=${encodeURIComponent(file.name)}`;

  const assetData = await new Promise<{ _id: string; url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ _id: data.document._id, url: data.document.url });
        } catch { reject(new Error('Invalid response from Sanity')); }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText)?.error?.description || msg; } catch {}
        reject(new Error(msg));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error — check your connection and try again')));
    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.send(file);
  });

  onProgress(95);

  // Save asset ref to siteSettings via our API (small JSON call, no size limit)
  await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field: target, assetRef: assetData._id }),
  });

  onProgress(100);
  return { assetId: assetData._id, url: assetData.url };
}

export default function SiteEditor() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [heroState, setHeroState] = useState<UploadState>(fresh());
  const [commState, setCommState] = useState<UploadState>(fresh());
  const [resState, setResState] = useState<UploadState>(fresh());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const commInputRef = useRef<HTMLInputElement>(null);
  const resInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpload = async (file: File, target: Target) => {
    const setState = target === 'heroVideo' ? setHeroState : target === 'commercialVideo' ? setCommState : setResState;
    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please upload a video file (MP4, WebM, MOV)' });
      return;
    }
    setState(s => ({ ...s, uploading: true, progress: 0 }));
    setMessage(null);
    try {
      const { url } = await uploadVideo(file, target, pct => setState(s => ({ ...s, progress: pct })));
      if (target === 'heroVideo') {
        setSettings(p => ({ ...p, heroVideoUrl: url }));
        setMessage({ type: 'success', text: 'Homepage hero video uploaded! Live within 60 seconds.' });
      } else if (target === 'commercialVideo') {
        setSettings(p => ({ ...p, commercialVideoUrl: url }));
        setMessage({ type: 'success', text: 'Commercial page video uploaded! Live within 60 seconds.' });
      } else {
        setSettings(p => ({ ...p, residentialVideoUrl: url }));
        setMessage({ type: 'success', text: 'Residential page video uploaded! Live within 60 seconds.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Upload failed. Please try again.' });
    } finally {
      setState(s => ({ ...s, uploading: false }));
      setTimeout(() => setState(s => ({ ...s, progress: 0 })), 2000);
    }
  };

  const handleDelete = async (target: Target) => {
    const label = target === 'heroVideo' ? 'homepage hero video' : target === 'commercialVideo' ? 'Commercial page video' : 'Residential page video';
    if (!confirm(`Remove the ${label}?`)) return;
    try {
      const body = target === 'heroVideo' ? { heroVideo: null } : target === 'commercialVideo' ? { commercialVideo: null } : { residentialVideo: null };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        if (target === 'heroVideo') setSettings(p => ({ ...p, heroVideoUrl: undefined }));
        else if (target === 'commercialVideo') setSettings(p => ({ ...p, commercialVideoUrl: undefined }));
        else setSettings(p => ({ ...p, residentialVideoUrl: undefined }));
        setMessage({ type: 'success', text: 'Video removed.' });
      }
    } catch { setMessage({ type: 'error', text: 'Failed to remove video.' }); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
    </div>
  );

  const VideoSection = ({
    target, title, description, previewHref, currentUrl, state, inputRef, accent,
  }: {
    target: Target; title: string; description: string; previewHref: string;
    currentUrl?: string; state: UploadState;
    inputRef: React.RefObject<HTMLInputElement>; accent: string;
  }) => {
    const setState = target === 'heroVideo' ? setHeroState : target === 'commercialVideo' ? setCommState : setResState;
    return (
      <section className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: `${accent}18` }}>
              <Video size={16} style={{ color: accent }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-white/40 text-xs">{description}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {currentUrl && (
            <div className="mb-6">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/5">
                <video src={currentUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-white/30 text-xs">Currently active on site</span>
                <div className="flex gap-2">
                  <a href={previewHref} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all">
                    <Eye size={12} /> Preview
                  </a>
                  <button onClick={() => handleDelete(target)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400/60 hover:text-red-400 border border-red-400/10 hover:border-red-400/20 rounded transition-all">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}
          <div
            className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer ${state.dragOver ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'} ${state.uploading ? 'pointer-events-none opacity-60' : ''}`}
            onDragOver={e => { e.preventDefault(); setState(s => ({ ...s, dragOver: true })); }}
            onDragLeave={() => setState(s => ({ ...s, dragOver: false }))}
            onDrop={e => { e.preventDefault(); setState(s => ({ ...s, dragOver: false })); const f = e.dataTransfer.files[0]; if (f) handleUpload(f, target); }}
            onClick={() => !state.uploading && inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/mov" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, target); e.target.value = ''; }} />
            {state.uploading ? (
              <div>
                <Loader2 className="mx-auto mb-3 animate-spin text-[#C9A84C]" size={32} />
                <div className="text-sm text-white/60 mb-3">Uploading...</div>
                <div className="w-48 mx-auto h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-200" style={{ width: state.progress + '%' }} />
                </div>
                <div className="text-[10px] text-white/30 mt-2">{state.progress}%</div>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto mb-3 text-white/20" size={32} />
                <div className="text-sm text-white/60 mb-1">{currentUrl ? 'Replace video' : 'Upload video'}</div>
                <div className="text-xs text-white/30">Drag & drop or click · MP4, MOV, WebM · Any size</div>
                <div className="text-[10px] text-white/20 mt-3">Recommended: 1920×1080 or higher</div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-white/30 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
            <h1 className="text-2xl font-bold tracking-tight">Site Editor</h1>
          </div>
          <p className="text-white/40 text-sm mt-1">Upload videos and manage site content.</p>
        </div>
        <button onClick={fetchSettings} className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <div className="flex items-center gap-2 text-sm">
            {message.type === 'success' && <Check size={14} />}
            {message.text}
          </div>
        </div>
      )}

      <VideoSection target="heroVideo" title="Homepage Hero Video"
        description="Background video for the main homepage hero section"
        previewHref="/" currentUrl={settings.heroVideoUrl}
        state={heroState} inputRef={heroInputRef} accent="#C9A84C" />

      <div className="mt-6">
        <VideoSection target="commercialVideo" title="Commercial Division Hero Video"
          description="Full-bleed background video for the Commercial page hero"
          previewHref="/commercial" currentUrl={settings.commercialVideoUrl}
          state={commState} inputRef={commInputRef} accent="#60a5fa" />
      </div>

      <div className="mt-6">
        <VideoSection target="residentialVideo" title="Residential Division Hero Video"
          description="Full-bleed background video for the Residential page hero"
          previewHref="/residential" currentUrl={settings.residentialVideoUrl}
          state={resState} inputRef={resInputRef} accent="#d4a84c" />
      </div>

      <section className="mt-6 bg-[#111111] border border-white/5 rounded-lg p-6 opacity-40">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white/5 flex items-center justify-center rounded">
            <Type size={16} className="text-white/30" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Text & Content</h2>
            <p className="text-white/40 text-xs">Edit headlines, descriptions, and page copy</p>
          </div>
        </div>
        <div className="text-white/20 text-sm">Coming soon — edit all site text from this dashboard.</div>
      </section>
    </div>
  );
}
