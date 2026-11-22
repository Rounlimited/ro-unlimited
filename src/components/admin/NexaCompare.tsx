'use client';
/**
 * NexaBids: compare the sheet on screen with a newer version of it (an addendum or a revised set).
 * He picks the new PDF from his phone; nothing is uploaded. Both are drawn the same size and laid over each other:
 * red is on the old sheet only (taken away), blue is on the new sheet only (added), grey did not change.
 * His measurements that sit where something changed are listed, so he knows what to measure again.
 */
import { useEffect, useRef, useState } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TakeoffItem } from '@/lib/takeoff';

type Props = { doc: any; page: number; pageLabel: string; items: TakeoffItem[]; onClose: () => void };
const WIDE = 1800;                   // both sheets are drawn this many pixels wide
const CELL = 24;                     // the sheet is checked for change in squares of this size

async function drawPage(pg: any, width: number, height?: number): Promise<{ canvas: HTMLCanvasElement; k: number; ratio: number }> {
  const vp1 = pg.getViewport({ scale: 1 }); const k = width / vp1.width; const vp = pg.getViewport({ scale: k });
  const c = document.createElement('canvas'); c.width = width; c.height = height || Math.round(vp.height);
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: ctx, viewport: vp }).promise;
  return { canvas: c, k, ratio: vp1.width / vp1.height };
}
/** 1 where the picture has ink. */
function inkOf(c: HTMLCanvasElement): Uint8Array {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; const out = new Uint8Array(c.width * c.height);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) if (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 < 175) out[j] = 1;
  return out;
}
/** Ink spread by r pixels, so a line that only moved by a hair is not called a change. */
function spread(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const mid = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { const o = y * w; let last = -1e9; for (let x = 0; x < w; x++) { if (src[o + x]) last = x; if (x - last <= r) mid[o + x] = 1; } last = 1e9; for (let x = w - 1; x >= 0; x--) { if (src[o + x]) last = x; if (last - x <= r) mid[o + x] = 1; } }
  for (let x = 0; x < w; x++) { let last = -1e9; for (let y = 0; y < h; y++) { if (mid[y * w + x]) last = y; if (y - last <= r) out[y * w + x] = 1; } last = 1e9; for (let y = h - 1; y >= 0; y--) { if (mid[y * w + x]) last = y; if (last - y <= r) out[y * w + x] = 1; } }
  return out;
}

export default function NexaCompare({ doc, page, pageLabel, items, onClose }: Props) {
  const [newDoc, setNewDoc] = useState<any>(null);
  const [newPages, setNewPages] = useState(0);
  const [newPage, setNewPage] = useState(1);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<null | { url: string; changedPct: number; added: number; removed: number; affected: string[]; sizeWarn: boolean }>(null);
  const [zoom, setZoom] = useState(1);
  const urlRef = useRef('');
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); try { newDoc?.destroy(); } catch { /* closing */ } }, [newDoc]);

  const pick = async (file: File | undefined) => {
    if (!file) return; setError(''); setResult(null);
    if (!/\.pdf$/i.test(file.name)) { setError('The new version needs to be a PDF file.'); return; }
    setBusy('Opening the new file…');
    try {
      // @ts-ignore pdf.js is served from /public so the bundler leaves it alone
      const pdfjs = await import(/* webpackIgnore: true */ '/pdfjs/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      const d = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      setNewDoc(d); setNewPages(d.numPages); setFileName(file.name);
      setNewPage(d.numPages === doc.numPages ? page : 1);     // the same set, revised: the same sheet number is the likely match
    } catch { setError('That file would not open. Make sure it is a PDF and try again.'); }
    setBusy('');
  };

  const compare = async () => {
    if (!newDoc) return; setBusy('Comparing the two sheets…'); setError(''); setResult(null);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const a = await drawPage(await doc.getPage(page), WIDE);
      const b = await drawPage(await newDoc.getPage(newPage), WIDE, a.canvas.height);
      const w = a.canvas.width, h = a.canvas.height;
      const ia = inkOf(a.canvas), ib = inkOf(b.canvas); const sa = spread(ia, w, h, 2), sb = spread(ib, w, h, 2);
      const out = document.createElement('canvas'); out.width = w; out.height = h; const ctx = out.getContext('2d')!; const img = ctx.createImageData(w, h); const px = img.data;
      const cw = Math.ceil(w / CELL), ch = Math.ceil(h / CELL); const cells = new Uint16Array(cw * ch); let added = 0, removed = 0, ink = 0;
      for (let y = 0, j = 0; y < h; y++) for (let x = 0; x < w; x++, j++) {
        const o = j * 4; let r = 255, g = 255, bl = 255;
        if (ia[j] && !sb[j]) { r = 225; g = 30; bl = 30; removed++; cells[Math.floor(y / CELL) * cw + Math.floor(x / CELL)]++; }
        else if (ib[j] && !sa[j]) { r = 20; g = 90; bl = 235; added++; cells[Math.floor(y / CELL) * cw + Math.floor(x / CELL)]++; }
        else if (ia[j] || ib[j]) { r = g = bl = 150; }
        if (ia[j] || ib[j]) ink++;
        px[o] = r; px[o + 1] = g; px[o + 2] = bl; px[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const hot = (x: number, y: number) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = cx + dx, Y = cy + dy; if (X >= 0 && Y >= 0 && X < cw && Y < ch && cells[Y * cw + X] >= 8) return true; } return false; };
      // his measurements on this sheet that sit where something changed
      const affected: string[] = [];
      for (const it of items) {
        let hit = false;
        for (const s of it.shapes) {
          if (s.page !== page || hit) continue;
          const pts = it.kind === 'area' ? [...s.pts, s.pts[0]] : s.pts;
          for (let i = 0; i < pts.length && !hit; i++) {
            if (hot(pts[i][0] * a.k, pts[i][1] * a.k)) { hit = true; break; }
            if (it.kind !== 'count' && i > 0) { const n = Math.ceil(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) * a.k / CELL); for (let t = 1; t < n && !hit; t++) if (hot((pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * t) / n) * a.k, (pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * t) / n) * a.k)) hit = true; }
          }
          // an area is also touched when the change is inside it (a wall moved in the middle of a room)
          if (!hit && it.kind === 'area' && s.pts.length >= 3) {
            const P = s.pts.map((p) => [p[0] * a.k, p[1] * a.k]); const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
            const inside = (x: number, y: number) => { let inn = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) inn = !inn; return inn; };
            for (let cy = Math.max(0, Math.floor(Math.min(...ys) / CELL)); cy <= Math.min(ch - 1, Math.floor(Math.max(...ys) / CELL)) && !hit; cy++)
              for (let cx = Math.max(0, Math.floor(Math.min(...xs) / CELL)); cx <= Math.min(cw - 1, Math.floor(Math.max(...xs) / CELL)); cx++)
                if (cells[cy * cw + cx] >= 8 && inside((cx + 0.5) * CELL, (cy + 0.5) * CELL)) { hit = true; break; }
          }
        }
        if (hit) affected.push(it.name);
      }
      // circle the places that changed, so they can be found on a big sheet
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
      for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) if (cells[cy * cw + cx] >= 8) ctx.strokeRect(cx * CELL - 6, cy * CELL - 6, CELL + 12, CELL + 12);
      const blob: Blob | null = await new Promise((res) => out.toBlob((bb) => res(bb), 'image/png'));
      if (!blob) throw new Error('picture');
      if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = URL.createObjectURL(blob);
      setResult({ url: urlRef.current, changedPct: ink ? ((added + removed) / ink) * 100 : 0, added, removed, affected, sizeWarn: Math.abs(a.ratio - b.ratio) > 0.02 }); setZoom(1);
    } catch { setError('Could not compare those two sheets. Try again, or pick a different page of the new file.'); }
    setBusy('');
  };

  const same = result && result.added + result.removed < 40;
  return (
    <div className="fixed inset-0 z-[90] bg-[#0a0a0a] text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--nxb-nav, 0px))' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/15">
        <h2 className="flex-1 min-w-0 text-[19px] font-bold leading-tight">What changed on this sheet?<span className="block text-[14px] font-normal text-white/75 truncate">{pageLabel}</span></h2>
        <button onClick={onClose} aria-label="Close" className="w-12 h-12 rounded-xl flex items-center justify-center active:bg-white/10"><X size={26} /></button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {!result && (
          <div className="max-w-lg mx-auto">
            <p className="text-[17px] leading-relaxed">When the architect or engineer sends a <b>new version</b> of a sheet (an addendum or a revision), pick that PDF here. The app lays the new one over the one you measured and shows exactly what changed.</p>
            <ol className="mt-3 space-y-2 text-[17px] leading-snug list-decimal pl-6">
              <li>Press the button and pick the new PDF from your phone.</li>
              <li>If the new file has more than one page, choose the page that is this sheet.</li>
              <li>Press <b>Compare</b>.</li>
            </ol>
            <label className="mt-4 flex min-h-[60px] items-center justify-center rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold px-4 text-center cursor-pointer">
              {fileName ? 'Pick a different file' : 'Pick the new PDF'}
              <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {fileName && (
              <div className="mt-3 rounded-xl border border-white/20 bg-white/[0.04] p-3">
                <p className="text-[16px] break-words"><b>{fileName}</b> · {newPages} page{newPages === 1 ? '' : 's'}</p>
                {newPages > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => setNewPage((p) => Math.max(1, p - 1))} aria-label="Page before" className="w-14 h-14 rounded-xl border border-white/30 flex items-center justify-center"><ChevronLeft size={26} /></button>
                    <p className="flex-1 text-center text-[17px] font-bold">Use page {newPage} of {newPages}</p>
                    <button onClick={() => setNewPage((p) => Math.min(newPages, p + 1))} aria-label="Page after" className="w-14 h-14 rounded-xl border border-white/30 flex items-center justify-center"><ChevronRight size={26} /></button>
                  </div>
                )}
                <button onClick={compare} disabled={!!busy} className="mt-3 w-full min-h-[58px] rounded-xl bg-[#4ade80] text-black text-[19px] font-bold disabled:opacity-50">Compare</button>
              </div>
            )}
          </div>
        )}
        {busy && <p className="mt-4 text-[17px] text-[#7dd3fc] flex items-center justify-center gap-2"><Loader2 size={22} className="animate-spin" /> {busy}</p>}
        {error && <p className="mt-4 text-[17px] text-red-200 text-center">{error}</p>}
        {result && (
          <div>
            <div className={`rounded-xl border px-3 py-2.5 ${same ? 'border-[#4ade80]/70 bg-[#4ade80]/10' : 'border-[#f59e0b]/80 bg-[#f59e0b]/10'}`}>
              <p className="text-[19px] font-bold leading-snug">{same ? 'No changes found. The two sheets match.' : 'This sheet changed.'}</p>
              {!same && <p className="text-[16px] leading-snug mt-1"><b className="text-[#ff6b6b]">Red</b> was on your sheet and is gone. <b className="text-[#6ea8ff]">Blue</b> is new. Grey did not change. Orange boxes mark the spots.</p>}
              {result.sizeWarn && <p className="text-[15px] leading-snug mt-1 text-[#fcd34d]">These two pages are different shapes, so this may be the wrong page of the new file. Go back and try another page.</p>}
            </div>
            {!same && (
              <div className="mt-2 rounded-xl border border-white/20 bg-white/[0.04] px-3 py-2.5">
                {result.affected.length ? (<>
                  <p className="text-[17px] font-bold leading-snug">Measure these again. They sit where something changed:</p>
                  <ul className="mt-1 list-disc pl-6 text-[17px] leading-snug">{result.affected.map((n, i) => <li key={i}>{n}</li>)}</ul>
                </>) : <p className="text-[17px] leading-snug">None of your measurements on this sheet sit on a spot that changed. Still look at the red and blue before you trust that.</p>}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <button onClick={() => setZoom((z) => Math.max(1, z / 1.6))} disabled={zoom <= 1} className="flex-1 min-h-[52px] rounded-xl border border-white/30 text-[17px] font-bold disabled:opacity-35">Zoom out</button>
              <button onClick={() => setZoom((z) => Math.min(8, z * 1.6))} className="flex-1 min-h-[52px] rounded-xl border border-white/30 text-[17px] font-bold">Zoom in</button>
              <button onClick={() => setResult(null)} className="flex-1 min-h-[52px] rounded-xl border border-white/30 text-[17px] font-bold">Another page</button>
            </div>
            <div className="mt-2 overflow-auto rounded-lg border border-white/20 bg-white" style={{ maxHeight: '70vh' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="The two versions laid over each other" style={{ width: `${zoom * 100}%`, maxWidth: 'none', display: 'block' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
