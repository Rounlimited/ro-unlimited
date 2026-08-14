'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';

/**
 * EstimatePhotos — job-site photo attachments for an estimate ("here's the
 * damage we're pricing"). Stored on the estimate row as a `photos` jsonb
 * array; files live on the Sanity CDN via /api/admin/upload.
 *
 * Phone cameras produce 3–12 MB files and the upload route caps out under
 * Vercel's ~4.5 MB body limit, so every image is re-encoded through a canvas
 * (max 1920px, JPEG q0.85) before upload. That also converts iPhone HEIC to
 * JPEG for free — Safari decodes HEIC natively, and canvas always exports
 * JPEG.
 *
 * Sized for JR: 17px+ text, 48px+ touch targets, high-contrast labels.
 */

export interface EstimatePhoto {
  url: string;
  assetId?: string;
  caption?: string;
  addedAt?: string;
}

interface Props {
  photos: EstimatePhoto[];
  onChange: (photos: EstimatePhoto[]) => void;
  /** Compact mode drops the header line (edit page already has a section title) */
  compact?: boolean;
}

const MAX_DIM = 1920;
const JPEG_QUALITY = 0.85;

async function compressImage(file: File): Promise<Blob> {
  // createImageBitmap handles EXIF orientation on every modern browser
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // undecodable → let the server try the original
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  return blob || file;
}

/** Sanity CDN images accept transform params — request small thumbnails. */
function thumbUrl(url: string): string {
  if (!url.includes('cdn.sanity.io')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}w=480&auto=format`;
}

export default function EstimatePhotos({ photos, onChange, compact }: Props) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  // Snapshot of the latest photos array so parallel uploads never clobber
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    setError(null);
    setUploading(true);
    setProgress({ current: 0, total: files.length });

    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      try {
        const blob = await compressImage(files[i]);
        const formData = new FormData();
        const name = files[i].name.replace(/\.(heic|heif|png|webp)$/i, '.jpg');
        formData.append('file', new File([blob], name, { type: 'image/jpeg' }));
        formData.append('type', 'estimatePhoto');
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || data.error || !data.url) { failed++; continue; }
        const next = [
          ...photosRef.current,
          { url: data.url, assetId: data.assetId, caption: '', addedAt: new Date().toISOString() },
        ];
        photosRef.current = next;
        onChange(next);
      } catch {
        failed++;
      }
    }
    if (failed > 0) setError(`${failed} photo${failed > 1 ? 's' : ''} failed to upload — try again`);
    setUploading(false);
    // allow re-selecting the same file
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const setCaption = (idx: number, caption: string) => {
    const next = photos.map((p, i) => (i === idx ? { ...p, caption } : p));
    onChange(next);
  };

  const removePhoto = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {!compact && (
        <p className="text-[15px] text-white/60 leading-relaxed">
          Attach job-site photos — damage, existing conditions, access issues. They appear in the
          estimate document so the customer sees exactly what the price covers.
        </p>
      )}

      {/* Add buttons — camera opens the phone camera directly, gallery multi-selects */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-3 min-h-[56px] px-5 rounded-xl border-2 border-dashed border-[#C9A84C]/40 text-[#C9A84C] text-[17px] font-medium hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/70 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <Camera size={22} /> Take Photo
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-3 min-h-[56px] px-5 rounded-xl border-2 border-dashed border-white/25 text-white/80 text-[17px] font-medium hover:bg-white/5 hover:border-white/40 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <ImagePlus size={22} /> Add From Gallery
        </button>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading && (
        <div className="flex items-center gap-3 text-[16px] text-[#C9A84C] py-1">
          <Loader2 size={20} className="animate-spin" />
          Uploading {progress.current} of {progress.total}…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-[15px] text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, idx) => (
            <div key={photo.assetId || photo.url} className="rounded-xl overflow-hidden border border-white/10 bg-[#111]">
              <div className="relative aspect-[4/3] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(photo.url)}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full bg-black/75 text-white hover:bg-red-600 active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                value={photo.caption || ''}
                onChange={(e) => setCaption(idx, e.target.value)}
                placeholder="Caption (e.g., water damage — north wall)"
                className="w-full px-3 py-3 bg-transparent text-[16px] text-white/90 placeholder:text-white/35 focus:outline-none focus:bg-white/5"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
