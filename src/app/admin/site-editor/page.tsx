'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Video, Image, Type, Check, Loader2, Trash2, Eye, RefreshCw, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

interface SiteSettings {
  heroVideoUrl?: string;
  heroVideoId?: string;
  commercialVideoUrl?: string;
  commercialVideoId?: string;
}

type UploadTarget = 'heroVideo' | 'commercialVideo';

interface UploadSectionState {
  uploading: boolean;
  progress: number;
  dragOver: boolean;
}

const defaultUploadState: UploadSectionState = { uploading: false, progress: 0, dragOver: false };

export default function SiteEditor() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [heroState, setHeroState] = useState<UploadSectionState>({ ...defaultUploadState });
  const [commState, setCommState] = useState<UploadSectionState>({ ...defaultUploadState });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const commInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpload = async (file: File, target: UploadTarget) => {
    const setState = target === 'heroVideo' ? setHeroState : setCommState;
    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please upload a video file (MP4, WebM, MOV)' });
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Video must be under 200MB' });
      return;
    }
    setState(s => ({ ...s, uploading: true, progress: 0 }));
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', target);
      const interval = setInterval(() => setState(s => ({ ...s, progress: Math.min(s.progress + 5, 90) })), 400);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      clearInterval(interval);
      setState(s => ({ ...s, progress: 100 }));
      if (res.ok) {
        const data = await res.json();
        if (target === 'heroVideo') {
          setSettings(p => ({ ...p, heroVideoUrl: data.url, heroVideoId: data.assetId }));
          setMessage({ type: 'success', text: 'Homepage hero video uploaded! Live within 60 seconds.' });
        } else {
          setSettings(p => ({ ...p, commercialVideoUrl: data.url, commercialVideoId: data.assetId }));
          setMessage({ type: 'success', text: 'Commercial page video uploaded! Live within 60 seconds.' });
        }
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Upload failed' });
      }
    } catch { setMessage({ type: 'error', text: 'Upload failed. Please try again.' }); }
    finally { setState(s => ({ ...s, uploading: false })); setTimeout(() => setState(s => ({ ...s, progress: 0 })), 2000); }
  };

  const handleDelete = async (target: UploadTarget) => {
    const label = target === 'heroVideo' ? 'homepage hero video' : 'Commercial page video';
    if (!confirm(`Remove the ${label}?`)) return;
    try {
      const body = target === 'heroVideo' ? { heroVideo: null } : { commercialVideo: null };
      const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        if (target === 'heroVideo') setSettings(p => ({ ...p, heroVideoUrl: undefined, heroVideoId: undefined }));
        else setSettings(p => ({ ...p, commercialVideoUrl: undefined, commercialVideoId: undefined }));
        setMessage({ type: 'success', text: 'Video removed.' });
      }
    } catch { setMessage({ type: 'error', text: 'Failed to remove video.' }); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
    </div>
  );

  const VideoUploadSection = ({
    target, title, description, previewHref, currentUrl, state,
    inputRef, accentColor,
  }: {
    target: UploadTarget; title: string; description: string; previewHref: string;
    currentUrl?: string; state: UploadSectionState;
    inputRef: React.RefObject<HTMLInputElement>; accentColor: string;
  }) => (
    <section className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: `${accentColor}18` }}>
            <Video size={16} style={{ color: accentColor }} />
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
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/30 text-xs">Currently active on {previewHref === '/' ? 'homepage' : 'commercial page'}</span>
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
          onDragOver={e => { e.preventDefault(); target === 'heroVideo' ? setHeroState(s => ({ ...s, dragOver: true })) : setCommState(s => ({ ...s, dragOver: true })); }}
          onDragLeave={() => target === 'heroVideo' ? setHeroState(s => ({ ...s, dragOver: false })) : setCommState(s => ({ ...s, dragOver: false }))}
          onDrop={e => { e.preventDefault(); target === 'heroVideo' ? setHeroState(s => ({ ...s, dragOver: false })) : setCommState(s => ({ ...s, dragOver: false })); const f = e.dataTransfer.files[0]; if (f) handleUpload(f, target); }}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, target); }} />
          {state.uploading ? (
            <div>
              <Loader2 className="mx-auto mb-3 animate-spin text-[#C9A84C]" size={32} />
              <div className="text-sm text-white/60 mb-3">Uploading to Sanity CDN...</div>
              <div className="w-48 mx-auto h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-300" style={{ width: state.progress + '%' }} />
              </div>
              <div className="text-[10px] text-white/30 mt-2">{state.progress}%</div>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto mb-3 text-white/20" size={32} />
              <div className="text-sm text-white/60 mb-1">{currentUrl ? 'Replace video' : 'Upload video'}</div>
              <div className="text-xs text-white/30">Drag & drop or click to browse. MP4, WebM, MOV. Max 200MB.</div>
              <div className="text-[10px] text-white/20 mt-3">Recommended: 1920×1080 or higher, loops cleanly</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

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

      <VideoUploadSection
        target="heroVideo"
        title="Homepage Hero Video"
        description="Background video for the main homepage hero section"
        previewHref="/"
        currentUrl={settings.heroVideoUrl}
        state={heroState}
        inputRef={heroInputRef}
        accentColor="#C9A84C"
      />

      <div className="mt-6">
        <VideoUploadSection
          target="commercialVideo"
          title="Commercial Division Hero Video"
          description="Full-bleed background video for the Commercial page hero"
          previewHref="/commercial"
          currentUrl={settings.commercialVideoUrl}
          state={commState}
          inputRef={commInputRef}
          accentColor="#60a5fa"
        />
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
        <div className="text-white/20 text-sm">Coming soon — edit all site text directly from this dashboard.</div>
      </section>
    </div>
  );
}
