'use client';

import { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';

interface VideoFramingProps {
  videoUrl: string;
  initialScale?: number;
  onScaleChange: (scale: number) => void;
  label: string;
}

/**
 * VideoFraming — dual-preview (desktop 16:9 + mobile 9:16) with zoom slider.
 * Scale range: 0.5 (zoomed out, shows more) → 1.0 (default cover) → 1.5 (zoomed in)
 * The video uses object-fit:cover + transform:scale so zooming out reveals more content.
 */
export default function VideoFraming({ videoUrl, initialScale = 1, onScaleChange, label }: VideoFramingProps) {
  const [scale, setScale] = useState(initialScale);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setScale(initialScale); }, [initialScale]);

  const handleSliderChange = (val: number) => {
    setScale(val);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onScaleChange(scale);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // At scale=1, video is 100% (standard object-cover behavior)
  // Below 1, we use object-fit:contain which shows more of the video
  // Above 1, we scale up from cover which zooms in
  // We map the slider so the user sees: left=zoomed out, right=zoomed in
  const isZoomedOut = scale < 1;

  const videoStyle: React.CSSProperties = isZoomedOut
    ? {
        // Zoomed out: blend between contain and cover
        // At 0.5, it's mostly contain. At 1.0, it's cover.
        objectFit: 'contain' as const,
        // Scale the contain view up proportionally so there's less black bar
        // At scale=0.5 → transform scale ~1.0 (pure contain)
        // At scale=0.99 → transform scale high enough to almost match cover
        transform: `scale(${1 + (scale - 0.5) * 1.5})`,
        transformOrigin: 'center center',
        background: '#000',
      }
    : {
        // Zoomed in: standard cover + scale up
        objectFit: 'cover' as const,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      };

  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-4 sm:p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ZoomIn size={14} className="text-[#C9A84C]" />
          <span className="text-white/60 text-xs font-mono uppercase tracking-wider">{label} — Video Framing</span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isZoomedOut ? 'bg-blue-500/10 text-blue-400' : scale > 1 ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-white/30'}`}>
          {isZoomedOut ? 'WIDE' : scale > 1 ? 'TIGHT' : 'DEFAULT'}
        </span>
      </div>

      {/* Preview boxes — side by side on wider, stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Desktop preview — 16:9 */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Monitor size={12} className="text-white/30" />
            <span className="text-white/30 text-[10px] uppercase tracking-wider">Desktop 16:9</span>
          </div>
          <div className="relative w-full overflow-hidden rounded border border-white/10 bg-black" style={{ aspectRatio: '16/9' }}>
            <video
              src={videoUrl}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full"
              style={videoStyle}
            />
            {/* Center crosshair */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            </div>
          </div>
        </div>

        {/* Mobile preview — 9:16 */}
        <div className="w-full sm:w-28 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Smartphone size={12} className="text-white/30" />
            <span className="text-white/30 text-[10px] uppercase tracking-wider">Mobile</span>
          </div>
          <div className="relative overflow-hidden rounded border border-white/10 bg-black mx-auto" style={{ aspectRatio: '9/16', maxHeight: '200px' }}>
            <video
              src={videoUrl}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full"
              style={videoStyle}
            />
            {/* Center crosshair */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Zoom slider — full range: zoomed out ← → zoomed in */}
      <div className="mb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/20 text-[10px] uppercase tracking-wider">See more</span>
          <span className="text-white/20 text-[10px] uppercase tracking-wider">Tighter crop</span>
        </div>
        <div className="flex items-center gap-3">
          <ZoomOut size={14} className="text-white/20 flex-shrink-0" />
          <div className="flex-1 relative">
            {/* Track background with center marker */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-white/10 rounded-full">
              {/* Center marker at 1.0 (default) position: (1.0 - 0.5) / (1.5 - 0.5) = 50% */}
              <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: '50%' }} />
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.02"
              value={scale}
              onChange={e => handleSliderChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-transparent rounded-full appearance-none cursor-pointer relative z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C9A84C] [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(201,168,76,0.6)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#000]"
            />
          </div>
          <ZoomIn size={14} className="text-white/20 flex-shrink-0" />
          <span className="text-white/40 text-xs font-mono w-14 text-right">{scale.toFixed(2)}x</span>
        </div>
      </div>

      {/* Quick presets + save */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { v: 0.5, label: 'Wide' },
            { v: 0.7, label: '0.7x' },
            { v: 0.85, label: '0.85x' },
            { v: 1.0, label: 'Default' },
            { v: 1.2, label: '1.2x' },
            { v: 1.5, label: 'Tight' },
          ].map(({ v, label: l }) => (
            <button key={v} onClick={() => handleSliderChange(v)}
              className={`px-2 py-1 text-[10px] font-mono rounded transition-all ${Math.abs(scale - v) < 0.03 ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30' : 'bg-white/5 text-white/30 border border-white/5 hover:border-white/10'}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all ml-2 flex-shrink-0 ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 hover:bg-[#C9A84C]/20'} disabled:opacity-50`}>
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Apply'}
        </button>
      </div>
    </div>
  );
}
