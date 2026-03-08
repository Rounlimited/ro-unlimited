'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Video, Image, Type, Check, Loader2, Trash2, Eye, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SiteSettings {
 heroVideoUrl?: string;
 heroVideoId?: string;
}

export default function SiteEditor() {
 const [settings, setSettings] = useState<SiteSettings>({});
 const [uploading, setUploading] = useState(false);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [dragOver, setDragOver] = useState(false);
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const [loading, setLoading] = useState(true);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Fetch current settings on mount
 useEffect(() => {
 fetchSettings();
 }, []);

 const fetchSettings = async () => {
 try {
 setLoading(true);
 const res = await fetch('/api/admin/settings');
 if (res.ok) {
 const data = await res.json();
 setSettings(data);
 }
 } catch (e) {
 console.error('Failed to fetch settings:', e);
 } finally {
 setLoading(false);
 }
 };

 const handleUpload = async (file: File) => {
 if (!file.type.startsWith('video/')) {
 setMessage({ type: 'error', text: 'Please upload a video file (MP4, WebM, MOV)' });
 return;
 }

 // Max 100MB
 if (file.size > 100 * 1024 * 1024) {
 setMessage({ type: 'error', text: 'Video must be under 100MB' });
 return;
 }

 setUploading(true);
 setUploadProgress(0);
 setMessage(null);

 try {
 const formData = new FormData();
 formData.append('file', file);
 formData.append('type', 'heroVideo');

 // Simulate progress since fetch doesn't support progress
 const progressInterval = setInterval(() => {
 setUploadProgress(prev => Math.min(prev + 5, 90));
 }, 300);

 const res = await fetch('/api/admin/upload', {
 method: 'POST',
 body: formData,
 });

 clearInterval(progressInterval);
 setUploadProgress(100);

 if (res.ok) {
 const data = await res.json();
 setSettings(prev => ({
 ...prev,
 heroVideoUrl: data.url,
 heroVideoId: data.assetId,
 }));
 setMessage({ type: 'success', text: 'Hero video uploaded! It will appear on the site within 60 seconds.' });
 } else {
 const err = await res.json();
 setMessage({ type: 'error', text: err.error || 'Upload failed' });
 }
 } catch (e) {
 setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
 } finally {
 setUploading(false);
 setTimeout(() => setUploadProgress(0), 2000);
 }
 };

 const handleDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(false);
 const file = e.dataTransfer.files[0];
 if (file) handleUpload(file);
 }, []);

 const handleDelete = async () => {
 if (!confirm('Remove the hero video? The site will show the default gradient background.')) return;
 try {
 const res = await fetch('/api/admin/settings', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ heroVideo: null }),
 });
 if (res.ok) {
 setSettings(prev => ({ ...prev, heroVideoUrl: undefined, heroVideoId: undefined }));
 setMessage({ type: 'success', text: 'Hero video removed.' });
 }
 } catch (e) {
 setMessage({ type: 'error', text: 'Failed to remove video.' });
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
 </div>
 );
 }

 return (
 <div>
 <div className="mb-8 flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3"><Link href="/admin" className="text-white/30 hover:text-white transition-colors"><ArrowLeft size={18} /></Link><h1 className="text-2xl font-bold tracking-tight">Site Editor</h1></div>
 <p className="text-white/40 text-sm mt-1">Upload videos, photos, and edit site content.</p>
 </div>
 <button
 onClick={fetchSettings}
 className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all"
 >
 <RefreshCw size={12} /> Refresh
 </button>
 </div>

 {/* Status message */}
 {message && (
 <div className={`mb-6 p-4 rounded-lg border ${
 message.type === 'success'
 ? 'bg-green-500/10 border-green-500/20 text-green-400'
 : 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}>
 <div className="flex items-center gap-2 text-sm">
 {message.type === 'success' ? <Check size={14} /> : null}
 {message.text}
 </div>
 </div>
 )}

 {/* === HERO VIDEO SECTION === */}
 <section className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
 <div className="p-6 border-b border-white/5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-[#C9A84C]/10 flex items-center justify-center rounded">
 <Video size={16} className="text-[#C9A84C]" />
 </div>
 <div>
 <h2 className="text-lg font-semibold">Hero Video</h2>
 <p className="text-white/40 text-xs">Background video for the homepage hero section</p>
 </div>
 </div>
 </div>

 <div className="p-6">
 {/* Current video preview */}
 {settings.heroVideoUrl ? (
 <div className="mb-6">
 <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/5">
 <video
 src={settings.heroVideoUrl}
 className="w-full h-full object-cover"
 autoPlay
 loop
 muted
 playsInline
 />
 <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider">
 <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
 Live
 </div>
 </div>
 <div className="flex items-center justify-between mt-3">
 <span className="text-white/30 text-xs">Currently active on homepage</span>
 <div className="flex gap-2">
 <a
 href="/"
 target="_blank"
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all"
 >
 <Eye size={12} /> Preview
 </a>
 <button
 onClick={handleDelete}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400/60 hover:text-red-400 border border-red-400/10 hover:border-red-400/20 rounded transition-all"
 >
 <Trash2 size={12} /> Remove
 </button>
 </div>
 </div>
 </div>
 ) : null}

 {/* Upload zone */}
 <div
 className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer ${
 dragOver
 ? 'border-[#C9A84C] bg-[#C9A84C]/5'
 : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
 } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
 onDragOver={e => { e.preventDefault(); setDragOver(true); }}
 onDragLeave={() => setDragOver(false)}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 >
 <input
 ref={fileInputRef}
 type="file"
 accept="video/mp4,video/webm,video/quicktime"
 className="hidden"
 onChange={e => {
 const file = e.target.files?.[0];
 if (file) handleUpload(file);
 }}
 />

 {uploading ? (
 <div>
 <Loader2 className="mx-auto mb-3 animate-spin text-[#C9A84C]" size={32} />
 <div className="text-sm text-white/60 mb-3">Uploading to Sanity CDN...</div>
 <div className="w-48 mx-auto h-1.5 bg-white/5 rounded-full overflow-hidden">
 <div
 className="h-full bg-[#C9A84C] rounded-full transition-all duration-300"
 style={{ width: uploadProgress + '%' }}
 />
 </div>
 <div className="text-[10px] text-white/30 mt-2">{uploadProgress}%</div>
 </div>
 ) : (
 <div>
 <Upload className="mx-auto mb-3 text-white/20" size={32} />
 <div className="text-sm text-white/60 mb-1">
 {settings.heroVideoUrl ? 'Replace hero video' : 'Upload hero video'}
 </div>
 <div className="text-xs text-white/30">
 Drag & drop or click to browse. MP4, WebM, MOV. Max 100MB.
 </div>
 <div className="text-[10px] text-white/20 mt-3">
 Recommended: 1920x1080 or higher, 15-30 seconds, looping footage
 </div>
 </div>
 )}
 </div>
 </div>
 </section>

 {/* === FUTURE SECTIONS PLACEHOLDER === */}
 <section className="mt-6 bg-[#111111] border border-white/5 rounded-lg p-6 opacity-40">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-8 h-8 bg-white/5 flex items-center justify-center rounded">
 <Image size={16} className="text-white/30" />
 </div>
 <div>
 <h2 className="text-lg font-semibold">Division Photos</h2>
 <p className="text-white/40 text-xs">Upload project photos for each division page</p>
 </div>
 </div>
 <div className="text-white/20 text-sm">Coming next ------ upload and manage portfolio photos for Residential, Commercial, Land Grading, and Build Process pages.</div>
 </section>

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
 <div className="text-white/20 text-sm">Coming soon ------ edit all site text directly from this dashboard.</div>
 </section>
 </div>
 );
}

