'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Download, Send, Loader2 } from 'lucide-react';
import { renderPdfToImages, downloadPdfBlob } from '@/lib/pdf-preview';

export default function EstimatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [estimateNumber, setEstimateNumber] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pdfBlobRef = useRef<Blob | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Refs for pinch/pan state
  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const gestureRef = useRef({
    isPinching: false,
    isPanning: false,
    isScrolling: false,
    startDist: 0,
    startScale: 1,
    panStartX: 0,
    panStartY: 0,
    panStartTx: 0,
    panStartTy: 0,
    scrollStartY: 0,
    scrollStartTop: 0,
  });

  const applyTransform = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const s = scaleRef.current;
    if (s <= 1) {
      el.style.transform = "none";
    } else {
      el.style.transform = `scale(${s}) translate(${txRef.current / s}px, ${tyRef.current / s}px)`;
    }
  }, []);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    txRef.current = 0;
    tyRef.current = 0;
    applyTransform();
    setZoomLevel(1);
  }, [applyTransform]);

  // Fetch PDF blob on mount
  useEffect(() => {
    if (!estimateId) return;
    const fetchPdf = async () => {
      setPdfLoading(true);
      setPdfError('');
      try {
        const res = await fetch(`/api/admin/estimates/${estimateId}/pdf?t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to generate PDF');

        // Extract estimate number from content-disposition header
        const disposition = res.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          setEstimateNumber(filenameMatch[1].replace('.pdf', '').replace(/_/g, ' '));
        }

        const blob = await res.blob();
        pdfBlobRef.current = blob;
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch {
        setPdfError('Failed to generate PDF');
      } finally {
        setPdfLoading(false);
      }
    };
    fetchPdf();

    return () => {
      // Cleanup blob URL on unmount
      setPdfBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [estimateId]);

  // Render PDF pages when blob is ready — pages appear progressively so the
  // UI (and the Back button) never freezes on large estimates (iOS fix)
  const renderPdf = useCallback(async (url: string) => {
    setRendering(true);
    setRenderError(false);
    setPages([]);

    try {
      await renderPdfToImages(url, (dataUrl) => {
        setPages(prev => [...prev, dataUrl]);
        setRendering(false); // show pages as soon as the first one is ready
      });
    } catch (err) {
      console.error("PDF render error:", err);
      setRenderError(true);
    }
    setRendering(false);
  }, []);

  useEffect(() => {
    if (pdfBlobUrl && !pdfLoading) {
      renderPdf(pdfBlobUrl);
    }
  }, [pdfBlobUrl, pdfLoading, renderPdf]);

  // Touch event handling
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || pages.length === 0) return;

    const getDist = (t: TouchList) => {
      const dx = t[1].clientX - t[0].clientX;
      const dy = t[1].clientY - t[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const g = gestureRef.current;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        g.isPinching = true;
        g.isPanning = false;
        g.isScrolling = false;
        g.startDist = getDist(e.touches);
        g.startScale = scaleRef.current;
      } else if (e.touches.length === 1) {
        if (scaleRef.current > 1.05) {
          e.preventDefault();
          g.isPanning = true;
          g.isScrolling = false;
          g.panStartX = e.touches[0].clientX;
          g.panStartY = e.touches[0].clientY;
          g.panStartTx = txRef.current;
          g.panStartTy = tyRef.current;
        } else {
          g.isScrolling = true;
          g.isPanning = false;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (g.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const dist = getDist(e.touches);
        const newScale = Math.min(5, Math.max(1, g.startScale * (dist / g.startDist)));
        scaleRef.current = newScale;
        if (newScale <= 1.01) {
          txRef.current = 0;
          tyRef.current = 0;
        }
        applyTransform();
      } else if (g.isPanning && e.touches.length === 1 && scaleRef.current > 1.05) {
        e.preventDefault();
        txRef.current = g.panStartTx + (e.touches[0].clientX - g.panStartX);
        tyRef.current = g.panStartTy + (e.touches[0].clientY - g.panStartY);
        applyTransform();
      }
    };

    const onTouchEnd = () => {
      if (g.isPinching) {
        g.isPinching = false;
        if (scaleRef.current < 1.05) {
          scaleRef.current = 1;
          txRef.current = 0;
          tyRef.current = 0;
          applyTransform();
        }
        setZoomLevel(scaleRef.current);
      }
      g.isPanning = false;
      g.isScrolling = false;
    };

    scrollEl.addEventListener("touchstart", onTouchStart, { passive: false });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollEl.addEventListener("touchend", onTouchEnd);

    return () => {
      scrollEl.removeEventListener("touchstart", onTouchStart);
      scrollEl.removeEventListener("touchmove", onTouchMove);
      scrollEl.removeEventListener("touchend", onTouchEnd);
    };
  }, [pages.length, applyTransform]);

  const handleDownload = async () => {
    const apiUrl = `/api/admin/estimates/${estimateId}/pdf?t=${Date.now()}`;
    setDownloading(true);
    try {
      let blob = pdfBlobRef.current;
      if (!blob) {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('PDF fetch failed');
        blob = await res.blob();
      }
      const filename = `${(estimateNumber || 'Estimate').replace(/\s+/g, '_')}.pdf`;
      // iOS PWA: opens the share sheet (Save to Files / Print / AirDrop);
      // desktop/Android: normal file download
      await downloadPdfBlob(blob, filename, apiUrl);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(apiUrl, '_blank');
    }
    setDownloading(false);
  };

  const showSpinner = pdfLoading || rendering;
  const isZoomed = zoomLevel > 1.05;

  return (
    <div className="h-full overflow-hidden bg-[#0a0a0a] flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur-sm border-b border-[#C9A84C]/15 px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.push(`/admin/estimates/${estimateId}`)}
            className="flex items-center gap-1 text-[14px] text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-1.5">
            {isZoomed && (
              <button
                onClick={resetZoom}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-lg hover:bg-[#C9A84C]/20 transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={!pdfBlobUrl || downloading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/10 text-white text-[13px] font-medium rounded-lg hover:bg-white/15 transition-colors disabled:opacity-30"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => router.push(`/admin/estimates/${estimateId}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A84C] text-black text-[13px] font-semibold rounded-lg hover:bg-[#C9A84C]/90 transition-colors"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF content area */}
      <div
        ref={scrollRef}
        className="flex-1 relative"
        style={{
          overflow: isZoomed ? "hidden" : "auto",
          WebkitOverflowScrolling: isZoomed ? undefined : "touch",
          touchAction: isZoomed ? "none" : "auto",
        }}
      >
        {showSpinner ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 size={40} className="animate-spin text-[#C9A84C]" />
            <div className="text-[14px] text-[#C9A84C] font-semibold">
              {pdfLoading ? "Generating PDF..." : "Rendering pages..."}
            </div>
            <div className="text-[12px] text-white/30">
              This takes a few seconds
            </div>
          </div>
        ) : pdfError || renderError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-[36px]">&#9888;</div>
            <div className="text-[14px] text-red-400 font-semibold">
              {pdfError || "Failed to render PDF"}
            </div>
            <div className="text-[12px] text-white/30">
              Try again or check your estimate data
            </div>
            <button
              onClick={() => router.push(`/admin/estimates/${estimateId}`)}
              className="mt-4 px-5 py-2.5 text-[14px] text-white/60 border border-white/10 rounded-lg hover:bg-white/5"
            >
              Go Back
            </button>
          </div>
        ) : pages.length > 0 ? (
          <div
            ref={contentRef}
            style={{
              padding: 16,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              transformOrigin: "top center",
            }}
          >
            {pages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Page ${i + 1}`}
                draggable={false}
                style={{
                  width: "100%", maxWidth: 800,
                  borderRadius: 4,
                  boxShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              />
            ))}
            {/* Bottom spacer for safe-area */}
            <div style={{ height: 96 }} />
          </div>
        ) : null}
      </div>

      {/* Floating Back pill — always tappable escape hatch on iPhone,
          reachable with a thumb even if the top toolbar is missed */}
      <button
        onClick={() => router.push(`/admin/estimates/${estimateId}`)}
        className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#C9A84C] text-black text-[14px] font-semibold shadow-[0_4px_24px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <ChevronLeft size={18} />
        Back to Estimate
      </button>
    </div>
  );
}
