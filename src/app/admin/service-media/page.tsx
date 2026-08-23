'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { ROOFING_SUB_SERVICES } from '@/lib/roofing-data';
import { ELECTRICAL_SUB_SERVICES } from '@/lib/electrical-data';
import { PLUMBING_SUB_SERVICES } from '@/lib/plumbing-data';
import { SEPTIC_SUB_SERVICES } from '@/lib/septic-data';
import { REPAIRS_SUB_SERVICES } from '@/lib/repairs-data';
import {
  Plus, Loader2, Trash2, Image as ImageIcon, Upload, GripVertical,
  Zap, HardHat, Pipette, Droplets, Wrench, ChevronDown, Check, X, ArrowLeft,
} from 'lucide-react';

interface ServiceImage {
  id: string;
  division: string;
  service_id: string;
  image_type: 'hero' | 'card' | 'gallery';
  image_url: string;
  sort_order: number;
}

const DIVISIONS = [
  { id: 'roofing', label: 'Roofing', icon: HardHat, services: ROOFING_SUB_SERVICES },
  { id: 'electrical', label: 'Electrical', icon: Zap, services: ELECTRICAL_SUB_SERVICES },
  { id: 'plumbing', label: 'Plumbing', icon: Pipette, services: PLUMBING_SUB_SERVICES },
  { id: 'septic', label: 'Septic', icon: Droplets, services: SEPTIC_SUB_SERVICES },
  { id: 'repairs', label: 'Repairs', icon: Wrench, services: REPAIRS_SUB_SERVICES },
];

export default function ServiceMediaPage() {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const division = DIVISIONS.find(d => d.id === selectedDivision);
  const service = division?.services.find(s => s.id === selectedService);

  const fetchImages = useCallback(async () => {
    if (!selectedDivision || !selectedService) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/service-images?division=${selectedDivision}&serviceId=${selectedService}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch { setImages([]); }
    finally { setLoading(false); }
  }, [selectedDivision, selectedService]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // Get the hardcoded fallback images from the data file
  const getDefaultImages = () => {
    if (!service) return { hero: '', card: '', gallery: [] as string[] };
    return {
      hero: service.heroImage,
      card: service.cardImage,
      gallery: service.galleryImages || [],
    };
  };

  // Merge DB images with defaults
  const heroImage = images.find(i => i.image_type === 'hero')?.image_url || getDefaultImages().hero;
  const cardImage = images.find(i => i.image_type === 'card')?.image_url || getDefaultImages().card;
  const galleryImages = images.filter(i => i.image_type === 'gallery').sort((a, b) => a.sort_order - b.sort_order);
  const defaultGallery = getDefaultImages().gallery;

  const uploadImage = async (file: File, imageType: 'hero' | 'card' | 'gallery') => {
    if (!selectedDivision || !selectedService) return;
    setUploading(imageType);
    try {
      // Upload to Sanity CDN
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);

      // Save to Supabase
      await fetch('/api/admin/service-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: selectedDivision,
          service_id: selectedService,
          image_type: imageType,
          image_url: uploadData.url,
          sort_order: imageType === 'gallery' ? galleryImages.length : 0,
        }),
      });

      await fetchImages();
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(null);
      setUploadKey(prev => prev + 1);
    }
  };

  const deleteImage = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/admin/service-images?id=${id}`, { method: 'DELETE' });
      await fetchImages();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeleting(null);
    }
  };

  const handleFileSelect = (imageType: 'hero' | 'card' | 'gallery') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (imageType === 'gallery') {
      Array.from(files).forEach(f => uploadImage(f, 'gallery'));
    } else {
      uploadImage(files[0], imageType);
    }
    setUploadKey(prev => prev + 1);
  };

  // ── DIVISION/SERVICE PICKER ──
  if (!selectedDivision) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a]">
        <AdminHeader title="Service Media" subtitle="Manage images for all service pages" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-white font-heading text-xl uppercase tracking-wider mb-6">Select Division</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIVISIONS.map(d => {
              const DivIcon = d.icon;
              return (
                <button key={d.id} onClick={() => setSelectedDivision(d.id)}
                  className="flex items-center gap-4 p-6 border border-gray-800 bg-gray-900/50 hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/5 transition-all duration-300 cursor-pointer text-left">
                  <div className="w-12 h-12 flex items-center justify-center border border-[#C9A84C]/20 bg-[#C9A84C]/5">
                    <DivIcon size={24} className="text-[#C9A84C]" />
                  </div>
                  <div>
                    <h3 className="text-white font-heading text-lg uppercase tracking-wider">{d.label}</h3>
                    <p className="text-gray-500 text-sm">{d.services.length} sub-services</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedService) {
    return (
      <div className="h-full overflow-y-auto bg-[#0a0a0a]">
        <AdminHeader title={`${division!.label} — Service Media`} subtitle="Select a sub-service to manage images" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button onClick={() => setSelectedDivision(null)}
            className="flex items-center gap-2 text-[#C9A84C]/60 text-sm font-mono uppercase tracking-wider mb-6 hover:text-[#C9A84C] transition-colors cursor-pointer">
            <ArrowLeft size={14} /> All Divisions
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {division!.services.map(svc => (
              <button key={svc.id} onClick={() => setSelectedService(svc.id)}
                className="flex items-center gap-4 p-5 border border-gray-800 bg-gray-900/50 hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/5 transition-all duration-300 cursor-pointer text-left">
                <img src={svc.cardImage} alt="" className="w-14 h-14 object-cover border border-gray-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-heading text-sm uppercase tracking-wider truncate">{svc.title}</h3>
                  <p className="text-gray-500 text-xs truncate">{svc.tagline}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── IMAGE MANAGER ──
  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <AdminHeader title={service!.title} subtitle={`${division!.label} Division — Image Management`} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider mb-8">
          <button onClick={() => { setSelectedDivision(null); setSelectedService(null); }}
            className="text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors cursor-pointer">Divisions</button>
          <span className="text-gray-700">/</span>
          <button onClick={() => setSelectedService(null)}
            className="text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors cursor-pointer">{division!.label}</button>
          <span className="text-gray-700">/</span>
          <span className="text-white">{service!.title}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-[#C9A84C] animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── HERO IMAGE ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-heading text-lg uppercase tracking-wider">Hero Image</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] text-xs font-mono uppercase tracking-wider cursor-pointer hover:bg-[#C9A84C]/20 transition-colors">
                  {uploading === 'hero' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Replace
                  <input key={`hero-${uploadKey}`} type="file" accept="image/*" className="hidden" onChange={handleFileSelect('hero')} />
                </label>
              </div>
              <div className="relative aspect-[21/9] overflow-hidden border border-gray-800 bg-gray-900">
                <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-gray-400 text-[10px] font-mono">
                  {images.find(i => i.image_type === 'hero') ? 'CUSTOM' : 'DEFAULT'}
                </div>
              </div>
            </div>

            {/* ── CARD IMAGE ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-heading text-lg uppercase tracking-wider">Card Thumbnail</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] text-xs font-mono uppercase tracking-wider cursor-pointer hover:bg-[#C9A84C]/20 transition-colors">
                  {uploading === 'card' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Replace
                  <input key={`card-${uploadKey}`} type="file" accept="image/*" className="hidden" onChange={handleFileSelect('card')} />
                </label>
              </div>
              <div className="w-48 relative aspect-[4/3] overflow-hidden border border-gray-800 bg-gray-900">
                <img src={cardImage} alt="Card" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-gray-400 text-[10px] font-mono">
                  {images.find(i => i.image_type === 'card') ? 'CUSTOM' : 'DEFAULT'}
                </div>
              </div>
            </div>

            {/* ── GALLERY IMAGES ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-heading text-lg uppercase tracking-wider">
                  Gallery Images
                  <span className="text-gray-600 text-sm ml-2">({galleryImages.length > 0 ? galleryImages.length : defaultGallery.length})</span>
                </h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] text-xs font-mono uppercase tracking-wider cursor-pointer hover:bg-[#C9A84C]/20 transition-colors">
                  {uploading === 'gallery' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Photos
                  <input key={`gallery-${uploadKey}`} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect('gallery')} />
                </label>
              </div>

              {/* Custom gallery images from DB */}
              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {galleryImages.map((img) => (
                    <div key={img.id} className="group relative aspect-[4/3] overflow-hidden border border-gray-800 bg-gray-900">
                      <img src={img.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-600/80 text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-200 cursor-pointer hover:bg-red-500"
                      >
                        {deleting === img.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-[#C9A84C] text-[10px] font-mono">
                        CUSTOM
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Show defaults with label */
                <div>
                  <p className="text-gray-500 text-sm mb-3">Showing default images from code. Upload custom images to override.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {defaultGallery.map((url, i) => (
                      <div key={i} className="relative aspect-[4/3] overflow-hidden border border-gray-800/50 bg-gray-900 opacity-60">
                        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-gray-500 text-[10px] font-mono">
                          DEFAULT
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── PREVIEW LINK ── */}
            <div className="border-t border-gray-800 pt-8">
              <a href={`/services/${selectedDivision}/${service!.slug}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#C9A84C]/60 text-sm font-mono uppercase tracking-wider hover:text-[#C9A84C] transition-colors">
                Preview Live Page →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
