/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared PDF preview/download helpers for the admin app.
//
// iOS WebKit constraints that shaped this code:
// - Rendering every page to a scale-2 PNG data-URL in a tight loop wedges the
//   main thread and blows the canvas memory budget → the whole PWA freezes
//   (no taps register) and the user has to force-close the app.
// - window.open() is unreliable in standalone (installed) PWAs; the share
//   sheet via navigator.share({ files }) is the dependable way to let the
//   user save/print/AirDrop a PDF.

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

let pdfjsLoaded: Promise<any> | null = null;
export function loadPdfJs(): Promise<any> {
  if (pdfjsLoaded) return pdfjsLoaded;
  pdfjsLoaded = new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) { resolve((window as any).pdfjsLib); return; }
    const s = document.createElement('script');
    s.src = `${PDFJS_CDN}/pdf.min.js`;
    s.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(lib);
    };
    s.onerror = () => { pdfjsLoaded = null; reject(new Error('Failed to load PDF renderer')); };
    document.head.appendChild(s);
  });
  return pdfjsLoaded;
}

/**
 * Render a PDF to page images without freezing the UI:
 * - JPEG instead of PNG (5–10x smaller strings held in memory)
 * - white background fill (JPEG has no alpha)
 * - canvas buffers released after each page (iOS canvas memory budget)
 * - yields to the event loop between pages so taps keep working
 * - scale adapts to page count to bound total memory
 * Pass onPage to show pages progressively as they render.
 */
export async function renderPdfToImages(
  url: string,
  onPage?: (dataUrl: string, index: number, total: number) => void,
): Promise<string[]> {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument(url).promise;
  const total: number = pdf.numPages;
  const scale = total > 6 ? 1.5 : 2;
  const pageImages: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Release the canvas bitmap immediately — iOS caps total canvas memory
    canvas.width = 0;
    canvas.height = 0;

    pageImages.push(dataUrl);
    onPage?.(dataUrl, i - 1, total);

    // Yield so the UI (Back/Close buttons, scrolling) stays responsive
    await new Promise(r => setTimeout(r, 0));
  }

  return pageImages;
}

const isIOS = () =>
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Download/save a PDF blob in a way that works everywhere, including the
 * installed iOS PWA: share sheet on iOS (Save to Files / Print / AirDrop),
 * anchor download elsewhere, window.open as a last resort.
 */
export async function downloadPdfBlob(blob: Blob, filename: string, fallbackUrl?: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (isIOS() && (navigator as any).canShare?.({ files: [file] })) {
    try {
      await (navigator as any).share({ files: [file], title: filename });
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') return true; // user closed the sheet
      // fall through to anchor download
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return true;
  } catch {
    if (fallbackUrl) window.open(fallbackUrl, '_blank');
    return false;
  }
}
