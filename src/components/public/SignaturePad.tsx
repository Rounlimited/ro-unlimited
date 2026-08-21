'use client';

import { useEffect, useRef } from 'react';
import { Eraser } from 'lucide-react';

/**
 * Draw-to-sign canvas — touch-first, pointer events, devicePixelRatio-aware.
 * Shared by the public invoice (/i/) and estimate (/estimate/) pages.
 * Emits a PNG data URL on every stroke end, null on clear.
 */
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drawing.current = true;
          const ctx = canvasRef.current!.getContext('2d')!;
          const { x, y } = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext('2d')!;
          const { x, y } = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          hasInk.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (hasInk.current) onChange(canvasRef.current!.toDataURL('image/png'));
        }}
      />
      <button
        type="button"
        onClick={() => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasInk.current = false;
          onChange(null);
        }}
        className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold text-gray-400 min-h-[44px] px-2"
      >
        <Eraser size={15} /> Clear
      </button>
    </div>
  );
}
