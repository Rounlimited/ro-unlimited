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
 * Shows exactly how the video will look on each device at the current scale.
 * Works on mobile admin screens — stacks vertically.
 */
export default function VideoFraming({ videoUrl, initialScale = 1, onScaleChange, label }: VideoFramingProps) {
  const [scale, setScale] = useState(initialScale);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const desktopRef = useRef<HTMLVideoElement>(null);
  const mobileRef = useRef<HTMLVideoElement>(null);

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

  const videoStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-4 sm:p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <ZoomIn size={14} className="text-[#C9A84C]" />
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">{label} — Video Framing</span>
      </div>

      {/* Preview boxes — side by side on larger screens, stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Desktop preview — 16:9 */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Monitor size={12} className="text-white/30" />
            <span className="text-white/30 text-[10px] uppercase tracking-wider">Desktop 16:9</span>
          </div>
          <div className="relative w-full overflow-hidden rounded border border-white/10 bg-black" style={{ aspectRatio: '16/9' }}>
            <video
              ref={desktopRef}
              src={videoUrl}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={videoStyle}
            />
          </div>
        </div>

        {/* Mobile preview — 9:16 */}
        <div className="w-full sm:w-28 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Smartphone size={12} className="text-white/30" />
            <span className="text-white/30 text-[10px] uppercase tracking-wider">Mobile 9:16</span>
          </div>
          <div className="relative overflow-hidden rounded border border-white/10 bg-black mx-auto" style={{ aspectRatio: '9/16', maxHeight: '180px' }}>
            <video
              ref={mobileRef}
              src={videoUrl}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={videoStyle}
            />
          </div>
        </div>
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 mb-4">
        <ZoomOut size={14} className="text-white/20 flex-shrink-0" />
        <div className="flex-1 relative">
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.05"
            value={scale}
            onChange={e => handleSliderChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C9A84C] [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(201,168,76,0.5)]"
          />
        </div>
        <ZoomIn size={14} className="text-white/20 flex-shrink-0" />
        <span className="text-white/40 text-xs font-mono w-12 text-right">{scale.toFixed(2)}x</span>
      </div>

      {/* Quick presets + save */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 1.25, 1.5, 1.75, 2].map(v => (
            <button key={v} onClick={() => handleSliderChange(v)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${Math.abs(scale - v) < 0.03 ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30' : 'bg-white/5 text-white/30 border border-white/5 hover:border-white/10'}`}>
              {v}x
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 hover:bg-[#C9A84C]/20'} disabled:opacity-50`}>
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Apply Zoom'}
        </button>
      </div>
    </div>
  );
}
