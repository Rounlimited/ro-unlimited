'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, Camera, Loader2, Check, Save, Trash2, ChevronDown,
  X, MapPin, Calendar, Tag, ImageIcon
} from 'lucide-react';

const JOB_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'septic', label: 'Septic' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'grading', label: 'Land Grading' },
  { value: 'steel_frame', label: 'Steel Frame' },
  { value: 'concrete', label: 'Concrete / Foundation' },
  { value: 'framing', label: 'Wood Framing' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial Build' },
  { value: 'general_repair', label: 'General Repair' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'underground', label: 'Underground Utilities' },
  { value: 'interior', label: 'Interior Finishes' },
  { value: 'other', label: 'Other' },
];

interface Photo {
  _id: string;
  url: string;
  filename: string;
  description: string;
  jobType: string;
  location: string;
  date: string;
  uploadedAt: string;
  assetId: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => { fetchPhotos(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processFiles(files);
      // Force React to destroy and recreate the input so it's never "used"
      setUploadKey(prev => prev + 1);
    }
  };

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/photos');
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch { setPhotos([]); }
    finally { setLoading(false); }
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('type', 'image');

        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.error) continue;

        // Create photo document in Sanity
        await fetch('/api/admin/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: uploadData.url,
            filename: uploadData.originalFilename || files[i].name,
            assetId: uploadData.assetId,
          }),
        });
      } catch (e) {
        console.error('Upload failed:', files[i].name, e);
      }
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    fetchPhotos();
  };

  // Save photo metadata
  const savePhoto = async (id: string, updates: Partial<Photo>) => {
    setSaving(id);
    await fetch('/api/admin/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    setPhotos(prev => prev.map(p => p._id === id ? { ...p, ...updates } : p));
    setSaving(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 1500);
  };

  // Delete photo
  const deletePhoto = async (id: string) => {
    await fetch(`/api/admin/photos?id=${id}`, { method: 'DELETE' });
    setPhotos(prev => prev.filter(p => p._id !== id));
    setExpandedId(null);
  };

  const describedCount = photos.filter(p => p.description?.trim()).length;
  const filtered = filter === 'all' ? photos : photos.filter(p => 
    filter === 'needs_desc' ? !p.description?.trim() : p.jobType === filter
  );

  return (
    <div className="theme-page-navy h-full overflow-y-auto bg-[#050810]">
      <AdminHeader title="Project Photos" subtitle={`${photos.length} photo${photos.length !== 1 ? 's' : ''}`} backHref="/admin" />

      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px', zIndex: 0,
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-3 pb-24">

        {/* Upload area */}
        {uploading ? (
          <div className="rounded-2xl p-5 text-center mb-4" style={{ background: '#1a0f04', border: '1px solid rgba(249,115,22,0.3)' }}>
            <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: '#F97316' }} />
            <p className="text-sm font-semibold text-white mb-2">
              Uploading {uploadProgress.current} of {uploadProgress.total}...
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, background: '#F97316' }} />
            </div>
          </div>
        ) : (
          <label className="w-full rounded-2xl p-5 flex flex-col items-center gap-2 mb-4 active:scale-[0.98] transition-all cursor-pointer"
            style={{ background: '#1a0f04', border: '2px dashed rgba(249,115,22,0.4)', display: 'flex' }}
          >
            <input
              key={uploadKey}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
            />
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)' }}>
              <Plus size={26} style={{ color: '#F97316' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#F97316' }}>Upload Photos</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Tap to select photos from your gallery</span>
          </label>
        )}

        {/* Description progress */}
        {photos.length > 0 && (
          <div className="mb-4 rounded-xl px-4 py-3" style={{
            background: describedCount === photos.length ? 'rgba(52,211,153,0.08)' : 'rgba(249,115,22,0.06)',
            border: describedCount === photos.length ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(249,115,22,0.2)',
          }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold" style={{
                color: describedCount === photos.length ? '#34D399' : '#F97316',
              }}>
                {describedCount === photos.length ? '✓ All photos described' : `${describedCount} of ${photos.length} described`}
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {photos.length - describedCount} remaining
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: photos.length ? `${(describedCount / photos.length) * 100}%` : '0%',
                background: describedCount === photos.length ? '#34D399' : '#F97316',
              }} />
            </div>
          </div>
        )}

        {/* Filter pills */}
        {photos.length > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'needs_desc', label: 'Needs Info' },
              ...JOB_TYPES.filter(j => j.value && photos.some(p => p.jobType === j.value))
                .map(j => ({ id: j.value, label: j.label })),
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="px-3 py-1.5 text-[11px] rounded-lg font-medium transition-all"
                style={{
                  background: filter === f.id ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                  border: filter === f.id ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  color: filter === f.id ? '#F97316' : 'rgba(255,255,255,0.3)',
                }}>
                {f.label}
                {f.id === 'needs_desc' && ` (${photos.length - describedCount})`}
              </button>
            ))}
          </div>
        )}

        {/* Photo list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={22} style={{ color: '#F97316' }} />
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#0F1F3D', border: '1px solid rgba(42,74,138,0.3)' }}>
            <Camera size={40} className="mx-auto mb-3" style={{ color: 'rgba(249,115,22,0.25)' }} />
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>No photos yet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Tap the button above to upload project photos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(photo => (
              <PhotoCard
                key={photo._id}
                photo={photo}
                expanded={expandedId === photo._id}
                saving={saving === photo._id}
                saved={saved === photo._id}
                onToggle={() => setExpandedId(expandedId === photo._id ? null : photo._id)}
                onSave={(u) => savePhoto(photo._id, u)}
                onDelete={() => deletePhoto(photo._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Photo Card ──────────────────────────────────────────
function PhotoCard({
  photo, expanded, saving, saved, onToggle, onSave, onDelete
}: {
  photo: Photo; expanded: boolean; saving: boolean; saved: boolean;
  onToggle: () => void; onSave: (u: Partial<Photo>) => void; onDelete: () => void;
}) {
  const [desc, setDesc] = useState(photo.description || '');
  const [jobType, setJobType] = useState(photo.jobType || '');
  const [location, setLocation] = useState(photo.location || '');
  const [date, setDate] = useState(photo.date || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasDesc = !!photo.description?.trim();

  const dirty = desc !== (photo.description || '') ||
    jobType !== (photo.jobType || '') ||
    location !== (photo.location || '') ||
    date !== (photo.date || '');

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.45)',
    border: '1px solid rgba(42,74,138,0.3)', borderRadius: 10,
    padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none',
    colorScheme: 'dark',
  };

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{
      background: '#0F1F3D',
      border: expanded ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(42,74,138,0.25)',
      boxShadow: expanded ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
    }}>
      {/* Thumbnail row */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-2.5 text-left active:bg-white/[0.02]">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/70 truncate">{photo.filename}</p>
          {hasDesc ? (
            <p className="text-[11px] text-white/40 truncate mt-0.5">{photo.description}</p>
          ) : (
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(249,115,22,0.7)' }}>Tap to add description</p>
          )}
          {photo.jobType && (
            <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
              {JOB_TYPES.find(j => j.value === photo.jobType)?.label || photo.jobType}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {hasDesc && <Check size={12} style={{ color: '#34D399' }} />}
          <ChevronDown size={14} style={{
            color: 'rgba(255,255,255,0.2)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} />
        </div>
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: 'rgba(42,74,138,0.2)' }}>
          <div className="mt-3 rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <img src={photo.url} alt="" className="w-full h-auto max-h-[300px] object-contain" />
          </div>

          <div>
            <label className="block text-[10px] text-white/25 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What's in this photo? What kind of work?" rows={2}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <div>
            <label className="block text-[10px] text-white/25 uppercase tracking-widest mb-1.5">Job Type</label>
            <select value={jobType} onChange={e => setJobType(e.target.value)} style={inputStyle}>
              {JOB_TYPES.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-white/25 uppercase tracking-widest mb-1.5">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="City, SC" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] text-white/25 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {confirmDelete ? (
              <div className="flex-1 flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  Cancel
                </button>
                <button onClick={onDelete}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444' }}>
                  Yes, Delete
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <Trash2 size={14} style={{ color: 'rgba(239,68,68,0.5)' }} />
                </button>
                <button
                  onClick={() => onSave({ description: desc, jobType, location, date })}
                  disabled={!dirty && !saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    background: dirty ? 'linear-gradient(135deg, #F97316, #ea580c)' : saved ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                    color: dirty ? '#fff' : saved ? '#34D399' : 'rgba(255,255,255,0.2)',
                    border: dirty ? 'none' : saved ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: dirty ? '0 0 16px rgba(249,115,22,0.3)' : 'none',
                  }}>
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                    : saved ? <><Check size={13} /> Saved</>
                    : dirty ? <><Save size={13} /> Save Info</>
                    : <><Check size={13} /> Up to date</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
