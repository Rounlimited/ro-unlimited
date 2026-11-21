'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Ruler, Plus, Check, Undo2, X, Trash2, Loader2, Pencil, Send, AlertTriangle, Maximize, ChevronDown, ChevronUp } from 'lucide-react';
import {
  type Pt, type TakeoffData, type TakeoffItem, type TakeoffKind, type TakeoffUnit,
  TAKEOFF_COLORS, UNITS_FOR, KIND_LABEL, PRINTED_SCALES, emptyTakeoff, normalizeTakeoff, itemQuantity, fmtQty, money,
  pathLength, polygonArea, scaleFromKnown, scaleFromPrinted, scaleWords, parseFeet, takeoffLines,
} from '@/lib/takeoff';

/**
 * Bid from Plans: the measuring screen. The plan sheet is drawn from the PDF; what he measures is drawn on top
 * of it. Drag moves the sheet, two fingers (or the wheel) zoom, a tap places a point.
 */
type View = { k: number; x: number; y: number };
type Est = { id: string; estimate_number: string; project_name: string | null; status: string; customer: { first_name: string | null; last_name: string | null; company_name: string | null } | null };
const uid = () => Math.random().toString(36).slice(2, 10);
const inputCls = 'w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/20 text-[18px] text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A84C]';
const labelCls = 'block text-[15px] font-semibold text-white/80 mb-1.5';

export default function TakeoffPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [data, setData] = useState<TakeoffData>(emptyTakeoff());
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState('Opening the plans…');
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 });
  const [mode, setMode] = useState<'move' | 'scale' | 'draw'>('move');
  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState<Pt[]>([]);
  const [scalePts, setScalePts] = useState<Pt[]>([]);
  const [sheet, setSheet] = useState<null | 'scale' | 'item' | 'send'>(null);
  const [editing, setEditing] = useState<TakeoffItem | null>(null);
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved');
  const [panelOpen, setPanelOpen] = useState(true);

  const boxRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const sharpRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<any>(null);
  const pageRef = useRef<any>(null);
  const tasks = useRef<{ base?: any; sharp?: any }>({});
  const viewRef = useRef(view); viewRef.current = view;
  const [sharpOn, setSharpOn] = useState(false);
  const [boxSize, setBoxSize] = useState('');
  useEffect(() => {
    const box = boxRef.current; if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setBoxSize(box.clientWidth + 'x' + box.clientHeight));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  /* ── open ── */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch('/api/admin/takeoffs/' + id);
        const row = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(row.error || 'Could not open those plans.');
        if (!row.file_url) throw new Error('The plan file is missing. Delete this one and bring the PDF in again.');
        setName(row.name || 'Plans'); setData(normalizeTakeoff(row.data));
        // @ts-ignore pdf.js is served from /public so the bundler leaves it alone
        const pdfjs = await import(/* webpackIgnore: true */ '/pdfjs/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const doc = await pdfjs.getDocument({ url: row.file_url }).promise;
        if (dead) return;
        docRef.current = doc; setPages(doc.numPages); setLoading('');
        if (row.page_count !== doc.numPages) fetch('/api/admin/takeoffs/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page_count: doc.numPages }) }).catch(() => null);
      } catch (e) {
        if (!dead) { setLoadError(e instanceof Error && e.message ? e.message : 'Could not open those plans.'); setLoading(''); }
      }
    })();
    return () => { dead = true; try { docRef.current?.destroy(); } catch { /* closing */ } };
  }, [id]);

  /* ── save (a moment after the last change) ── */
  const dirty = useRef(false);
  const change = useCallback((fn: (d: TakeoffData) => TakeoffData) => { dirty.current = true; setSaved('saving'); setData((d) => fn(d)); }, []);
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(async () => {
      const r = await fetch('/api/admin/takeoffs/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => null);
      setSaved(r && r.ok ? 'saved' : 'error');
    }, 900);
    return () => clearTimeout(t);
  }, [data, id]);

  /* ── draw the sheet ── */
  const fit = useCallback((w: number, h: number) => {
    const box = boxRef.current; if (!box) return;
    const k = Math.min(box.clientWidth / w, box.clientHeight / h) * 0.98;
    setView({ k, x: (box.clientWidth - w * k) / 2, y: (box.clientHeight - h * k) / 2 });
  }, []);

  useEffect(() => {
    const doc = docRef.current; if (!doc || !pages) return;
    let dead = false;
    (async () => {
      setSharpOn(false);
      const pg = await doc.getPage(page);
      if (dead) return;
      pageRef.current = pg;
      const v1 = pg.getViewport({ scale: 1 });
      setSize({ w: v1.width, h: v1.height });
      fit(v1.width, v1.height);
      const R = Math.min(2, Math.sqrt(9_000_000 / (v1.width * v1.height)));     // whole sheet, kept under what a phone can hold
      const vp = pg.getViewport({ scale: R });
      const c = baseRef.current; if (!c) return;
      try { tasks.current.base?.cancel(); } catch { /* none */ }
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const task = pg.render({ canvasContext: c.getContext('2d')!, viewport: vp });
      tasks.current.base = task;
      task.promise.catch(() => null);
    })();
    return () => { dead = true; };
  }, [page, pages, fit]);

  // When the view comes to rest, the part on screen is drawn again at full sharpness.
  useEffect(() => {
    setSharpOn(false);
    const pg = pageRef.current; const c = sharpRef.current; const box = boxRef.current;
    if (!pg || !c || !box || !size) return;
    const t = setTimeout(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const W = Math.floor(box.clientWidth * dpr); const H = Math.floor(box.clientHeight * dpr);
      if (!W || !H) return;
      try { tasks.current.sharp?.cancel(); } catch { /* none */ }
      c.width = W; c.height = H; c.style.width = box.clientWidth + 'px'; c.style.height = box.clientHeight + 'px';
      const vp = pg.getViewport({ scale: view.k * dpr, offsetX: view.x * dpr, offsetY: view.y * dpr });
      const ctx = c.getContext('2d')!; ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, W, H);
      const task = pg.render({ canvasContext: ctx, viewport: vp });
      tasks.current.sharp = task;
      task.promise.then(() => {
        // pdf.js paints the whole canvas white first; everything outside the sheet goes back to the dark surround
        const px = view.x * dpr; const py = view.y * dpr; const pw = size.w * view.k * dpr; const ph = size.h * view.k * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, W, Math.max(0, py)); ctx.fillRect(0, py + ph, W, Math.max(0, H - py - ph));
        ctx.fillRect(0, 0, Math.max(0, px), H); ctx.fillRect(px + pw, 0, Math.max(0, W - px - pw), H);
        setSharpOn(true);
      }).catch(() => null);
    }, 260);
    return () => clearTimeout(t);
  }, [view, size, page, boxSize]);

  /* ── touch and mouse ── */
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startX: number; startY: number; t: number; moved: boolean; view: View; pinch?: { d: number; mx: number; my: number } } | null>(null);
  const local = (e: { clientX: number; clientY: number }) => { const r = boxRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const zoomAt = (v: View, mx: number, my: number, k: number): View => {
    const nk = Math.max(0.05, Math.min(40, k));
    return { k: nk, x: mx - ((mx - v.x) / v.k) * nk, y: my - ((my - v.y) / v.k) * nk };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = local(e); ptrs.current.set(e.pointerId, p);
    if (ptrs.current.size === 1) gesture.current = { startX: p.x, startY: p.y, t: Date.now(), moved: false, view: viewRef.current };
    else if (ptrs.current.size === 2 && gesture.current) {
      const [a, b] = Array.from(ptrs.current.values());
      gesture.current = { ...gesture.current, moved: true, view: viewRef.current, pinch: { d: Math.hypot(b.x - a.x, b.y - a.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 } };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId) || !gesture.current) return;
    const p = local(e); ptrs.current.set(e.pointerId, p);
    const g = gesture.current;
    if (ptrs.current.size >= 2 && g.pinch) {
      const [a, b] = Array.from(ptrs.current.values());
      const d = Math.hypot(b.x - a.x, b.y - a.y); const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
      const z = zoomAt(g.view, g.pinch.mx, g.pinch.my, g.view.k * (d / Math.max(1, g.pinch.d)));
      setView({ k: z.k, x: z.x + (mx - g.pinch.mx), y: z.y + (my - g.pinch.my) });
    } else if (ptrs.current.size === 1 && !g.pinch) {
      const dx = p.x - g.startX; const dy = p.y - g.startY;
      if (!g.moved && Math.hypot(dx, dy) > 8) g.moved = true;
      if (g.moved) setView({ k: g.view.k, x: g.view.x + dx, y: g.view.y + dy });
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const g = gesture.current; const p = ptrs.current.get(e.pointerId);
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) {
      if (g && p && !g.moved && Date.now() - g.t < 700) tap([(p.x - viewRef.current.x) / viewRef.current.k, (p.y - viewRef.current.y) / viewRef.current.k]);
      gesture.current = null;
    } else if (g) {
      const rest = Array.from(ptrs.current.values())[0];
      gesture.current = { startX: rest.x, startY: rest.y, t: 0, moved: true, view: viewRef.current };
    }
  };
  const onWheel = (e: React.WheelEvent) => { const p = local(e); setView((v) => zoomAt(v, p.x, p.y, v.k * Math.exp(-e.deltaY * 0.0015))); };

  /* ── measuring ── */
  const active = data.items.find((i) => i.id === activeId) || null;
  const ftPerPt = Number(data.scales[String(page)]) || 0;

  const tap = (pt: Pt) => {
    if (!size || pt[0] < 0 || pt[1] < 0 || pt[0] > size.w || pt[1] > size.h) return;
    if (mode === 'scale') {
      const next = [...scalePts, pt].slice(-2);
      setScalePts(next);
      if (next.length === 2) setSheet('scale');
      return;
    }
    if (mode !== 'draw' || !active) return;
    if (active.kind === 'count') {
      change((d) => ({ ...d, items: d.items.map((it) => {
        if (it.id !== active.id) return it;
        const has = it.shapes.find((s) => s.page === page);
        return { ...it, shapes: has ? it.shapes.map((s) => (s === has ? { ...s, pts: [...s.pts, pt] } : s)) : [...it.shapes, { id: uid(), page, pts: [pt] }] };
      }) }));
    } else setDraft((p) => [...p, pt]);
  };
  const finishShape = () => {
    if (!active || active.kind === 'count') return;
    const need = active.kind === 'area' ? 3 : 2;
    if (draft.length >= need) change((d) => ({ ...d, items: d.items.map((it) => (it.id === active.id ? { ...it, shapes: [...it.shapes, { id: uid(), page, pts: draft }] } : it)) }));
    setDraft([]);
  };
  const undo = () => {
    if (draft.length) { setDraft((p) => p.slice(0, -1)); return; }
    if (!active) return;
    change((d) => ({ ...d, items: d.items.map((it) => {
      if (it.id !== active.id || !it.shapes.length) return it;
      if (it.kind === 'count') {
        const here = [...it.shapes].reverse().find((s) => s.page === page && s.pts.length);
        if (!here) return it;
        return { ...it, shapes: it.shapes.map((s) => (s === here ? { ...s, pts: s.pts.slice(0, -1) } : s)).filter((s) => s.pts.length) };
      }
      return { ...it, shapes: it.shapes.slice(0, -1) };
    }) }));
  };
  const pick = (itemId: string) => { setDraft([]); setScalePts([]); setActiveId(itemId); setMode('draw'); };
  const stop = () => { setDraft([]); setScalePts([]); setMode('move'); };

  const draftReadout = useMemo(() => {
    if (!active || active.kind === 'count' || draft.length < 2) return '';
    if (!ftPerPt) return 'Set the scale to see the size';
    if (active.kind === 'length') return `${fmtQty(pathLength(draft) * ftPerPt, 'LF')} LF so far`;
    return draft.length >= 3 ? `${fmtQty(polygonArea(draft) * ftPerPt * ftPerPt, 'SF')} SF so far` : '';
  }, [active, draft, ftPerPt]);

  const total = useMemo(() => data.items.reduce((t, it) => t + itemQuantity(it, data.scales).quantity * (Number(it.unitCost) || 0), 0), [data]);
  const linesReady = useMemo(() => takeoffLines(data).length, [data]);
  const sw = 2.2 / view.k;   // line weight that stays the same on screen at any zoom
  const dot = 6 / view.k;

  if (loadError) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle size={36} className="text-red-300" />
        <p className="text-[19px] text-white max-w-md leading-snug">{loadError}</p>
        <button onClick={() => router.push('/admin/takeoff')} className="min-h-[52px] px-6 rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Back to plans</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a] text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* top bar */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 bg-[#111]">
        <button onClick={() => router.push('/admin/takeoff')} aria-label="Back to plans" className="w-12 h-12 rounded-xl flex items-center justify-center active:bg-white/10 shrink-0"><ArrowLeft size={24} /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold leading-tight truncate">{name}</p>
          <p className={`text-[14px] leading-tight ${saved === 'error' ? 'text-red-300' : 'text-white/70'}`}>{saved === 'saving' ? 'Saving…' : saved === 'error' ? 'Not saved. Check the connection.' : 'Saved'}</p>
        </div>
        {pages > 0 && (
          <div className="flex items-center shrink-0">
            <button disabled={page <= 1} onClick={() => { stop(); setPage((p) => p - 1); }} aria-label="Sheet before" className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-30 active:bg-white/10"><ChevronLeft size={26} /></button>
            <span className="text-[16px] font-semibold whitespace-nowrap px-1">Sheet {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => { stop(); setPage((p) => p + 1); }} aria-label="Next sheet" className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-30 active:bg-white/10"><ChevronRight size={26} /></button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* the sheet */}
        <div ref={boxRef} className="relative flex-1 min-h-0 min-w-0 overflow-hidden bg-[#2a2a2a] select-none"
          style={{ touchAction: 'none', cursor: mode === 'move' ? 'grab' : 'crosshair' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
          {loading && <p className="absolute inset-0 flex items-center justify-center gap-2 text-[18px] text-white/90"><Loader2 size={24} className="animate-spin" /> {loading}</p>}
          {size && (
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: size.w, height: size.h, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
              <canvas ref={baseRef} className="absolute inset-0 w-full h-full bg-white" />
            </div>
          )}
          <canvas ref={sharpRef} className="absolute left-0 top-0 pointer-events-none" style={{ opacity: sharpOn ? 1 : 0 }} />
          {size && (
            <svg className="absolute left-0 top-0 origin-top-left pointer-events-none overflow-visible" width={size.w} height={size.h}
              style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
              {data.items.map((it) => it.shapes.filter((s) => s.page === page).map((s) => (
                it.kind === 'count'
                  ? s.pts.map((p, i) => (<g key={s.id + i}><circle cx={p[0]} cy={p[1]} r={dot * 1.5} fill={it.color} fillOpacity={0.35} stroke={it.color} strokeWidth={sw} /><circle cx={p[0]} cy={p[1]} r={dot * 0.4} fill={it.color} /></g>))
                  : it.kind === 'area'
                    ? <polygon key={s.id} points={s.pts.map((p) => p.join(',')).join(' ')} fill={it.color} fillOpacity={it.id === activeId ? 0.34 : 0.22} stroke={it.color} strokeWidth={sw} strokeLinejoin="round" />
                    : <polyline key={s.id} points={s.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={it.color} strokeWidth={sw * (it.id === activeId ? 2 : 1.5)} strokeLinejoin="round" strokeLinecap="round" />
              )))}
              {active && draft.length > 0 && (<>
                {active.kind === 'area' && draft.length >= 3 && <polygon points={draft.map((p) => p.join(',')).join(' ')} fill={active.color} fillOpacity={0.2} stroke="none" />}
                <polyline points={draft.map((p) => p.join(',')).join(' ')} fill="none" stroke={active.color} strokeWidth={sw * 1.6} strokeDasharray={`${sw * 4} ${sw * 3}`} strokeLinejoin="round" />
                {draft.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={dot} fill="#fff" stroke={active.color} strokeWidth={sw} />)}
              </>)}
              {scalePts.length > 0 && (<>
                {scalePts.length === 2 && <line x1={scalePts[0][0]} y1={scalePts[0][1]} x2={scalePts[1][0]} y2={scalePts[1][1]} stroke="#FF2D95" strokeWidth={sw * 1.6} />}
                {scalePts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={dot} fill="#fff" stroke="#FF2D95" strokeWidth={sw * 1.4} />)}
              </>)}
            </svg>
          )}
          {size && <button onClick={() => fit(size.w, size.h)} onPointerDown={(e) => e.stopPropagation()} aria-label="Fit the whole sheet" className="absolute right-3 top-3 w-12 h-12 rounded-xl bg-black/75 border border-white/25 flex items-center justify-center"><Maximize size={22} /></button>}

        </div>

        {/* items */}
        <div className="lg:w-[380px] shrink-0 bg-[#111] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[46vh] lg:max-h-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* what to do right now */}
          {mode !== 'move' && (
            <div className="m-2 rounded-2xl bg-black border border-[#C9A84C]/60 p-3">
              <p className="text-[17px] font-semibold leading-snug">
                {mode === 'scale'
                  ? (scalePts.length === 0 ? 'Tap one end of a line you know the length of.' : scalePts.length === 1 ? 'Now tap the other end.' : 'Type the real length.')
                  : active?.kind === 'count' ? `Tap each ${active.name}. ${active.shapes.filter((s) => s.page === page).reduce((n, s) => n + s.pts.length, 0)} on this sheet.`
                  : active?.kind === 'area' ? `Tap each corner of the ${active.name}, then Finish.` : `Tap along the ${active?.name}, then Finish.`}
                {draftReadout && <span className="text-[#E5C76B]"> {draftReadout}</span>}
              </p>
              <p className="text-[15px] text-white/75">Drag to move the sheet. Two fingers to zoom.</p>
              <div className="flex gap-2 mt-2.5">
                {mode === 'draw' && <button onClick={undo} className="min-h-[52px] px-4 rounded-xl border border-white/30 text-[17px] font-semibold flex items-center gap-2"><Undo2 size={20} /> Undo</button>}
                {mode === 'draw' && active && active.kind !== 'count' && (
                  <button onClick={finishShape} disabled={draft.length < (active.kind === 'area' ? 3 : 2)} className="flex-1 min-h-[52px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Check size={22} /> Finish this one</button>
                )}
                <button onClick={stop} className={`min-h-[52px] px-5 rounded-xl text-[17px] font-semibold ${mode === 'draw' && active?.kind === 'count' ? 'flex-1 bg-[#C9A84C] text-black font-bold' : 'border border-white/30'}`}>{mode === 'scale' ? 'Cancel' : 'Done'}</button>
              </div>
            </div>
          )}
          <div className={`${mode !== 'move' ? 'hidden lg:flex' : 'flex'} flex-col flex-1 min-h-0`}>
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
            <button onClick={() => { setDraft([]); setScalePts([]); setMode('scale'); }}
              className={`flex-1 min-h-[52px] rounded-xl px-3 text-left flex items-center gap-2.5 border ${ftPerPt ? 'border-white/20 bg-white/5' : 'border-[#f0a04b] bg-[#f0a04b]/15'}`}>
              <Ruler size={22} className={ftPerPt ? 'text-[#E5C76B] shrink-0' : 'text-[#f0a04b] shrink-0'} />
              <span className="min-w-0">
                <span className="block text-[17px] font-bold leading-tight">{ftPerPt ? `Scale: ${scaleWords(ftPerPt)}` : 'Set this sheet’s scale first'}</span>
                <span className="block text-[14px] text-white/75 leading-tight truncate">{ftPerPt ? (data.scaleNotes?.[String(page)] || 'Tap to change') : 'Nothing can be measured until it is set'}</span>
              </span>
            </button>
            <button onClick={() => setPanelOpen((o) => !o)} aria-label={panelOpen ? 'Hide the list' : 'Show the list'} className="lg:hidden w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center shrink-0">{panelOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}</button>
          </div>
          <div className={`${panelOpen ? '' : 'hidden lg:block'} flex-1 min-h-0 overflow-y-auto px-3 pb-2 space-y-2`}>
            {data.items.length === 0 && <p className="text-[16px] text-white/80 leading-snug px-1">Add what you want to measure: a pipe run, a slab, catch basins. Then tap it out on the sheet.</p>}
            {data.items.map((it) => {
              const q = itemQuantity(it, data.scales);
              const on = it.id === activeId && mode === 'draw';
              return (
                <div key={it.id} className={`rounded-xl border ${on ? 'border-[#C9A84C] bg-[#C9A84C]/12' : 'border-white/15 bg-white/[0.04]'}`}>
                  <button onClick={() => (on ? stop() : pick(it.id))} className="w-full text-left px-3 py-2.5 flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full shrink-0 border-2 border-white/70" style={{ background: it.color }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[17px] font-bold leading-snug break-words">{it.name}</span>
                      <span className="block text-[15px] text-white/80 leading-snug">
                        {fmtQty(q.quantity, it.unit)} {it.unit}{it.unitCost > 0 ? ` × ${money(it.unitCost)} = ${money(q.quantity * it.unitCost)}` : ' · no price yet'}
                      </span>
                      {q.unscaled > 0 && <span className="block text-[14px] text-[#f0a04b] leading-snug">{q.unscaled} left out: that sheet has no scale</span>}
                    </span>
                    <span className="text-[14px] font-bold text-[#E5C76B] shrink-0">{on ? 'Measuring' : 'Measure'}</span>
                  </button>
                  {it.id === activeId && (
                    <div className="flex gap-2 px-3 pb-2.5">
                      <button onClick={() => { setEditing(it); setSheet('item'); }} className="flex-1 min-h-[48px] rounded-lg border border-white/25 text-[16px] font-semibold flex items-center justify-center gap-1.5"><Pencil size={18} /> Name and price</button>
                      <button onClick={undo} className="min-h-[48px] px-3 rounded-lg border border-white/25 text-[16px] font-semibold flex items-center gap-1.5"><Undo2 size={18} /> Undo last</button>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => { setEditing(null); setSheet('item'); }} className="w-full min-h-[52px] rounded-xl border-2 border-dashed border-white/30 text-[17px] font-semibold flex items-center justify-center gap-2"><Plus size={22} /> Add something to measure</button>
          </div>
          <div className="px-3 pt-2 pb-2.5 border-t border-white/10">
            <button onClick={() => setSheet('send')} disabled={!linesReady} className="w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-40">
              <Send size={20} /> Send to an estimate{total > 0 ? ` · ${money(total)}` : ''}
            </button>
          </div>
          </div>
        </div>
      </div>

      {sheet === 'scale' && (
        <ScaleSheet pts={scalePts} current={ftPerPt} pages={pages}
          onClose={() => { setSheet(null); stop(); }}
          onSet={(v, note, all) => {
            change((d) => {
              const scales = { ...d.scales }; const notes = { ...(d.scaleNotes || {}) };
              const targets = all ? Array.from({ length: pages }, (_, i) => String(i + 1)) : [String(page)];
              for (const p of targets) { if (p === String(page) || !scales[p]) { scales[p] = v; notes[p] = note; } }
              return { ...d, scales, scaleNotes: notes };
            });
            setSheet(null); stop();
          }} />
      )}
      {sheet === 'item' && (
        <ItemSheet item={editing} colorIndex={data.items.length}
          onClose={() => setSheet(null)}
          onDelete={editing ? () => { change((d) => ({ ...d, items: d.items.filter((i) => i.id !== editing.id) })); setSheet(null); stop(); setActiveId(''); } : undefined}
          onSave={(it) => {
            change((d) => ({ ...d, items: d.items.some((i) => i.id === it.id) ? d.items.map((i) => (i.id === it.id ? { ...it, shapes: i.shapes } : i)) : [...d.items, it] }));
            setSheet(null);
            if (!editing) pick(it.id);
          }} />
      )}
      {sheet === 'send' && <SendSheet takeoffId={id} data={data} planName={name} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/75 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/20 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="flex-1 text-[21px] font-bold leading-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-12 h-12 rounded-xl flex items-center justify-center active:bg-white/10"><X size={24} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScaleSheet({ pts, current, pages, onSet, onClose }: { pts: Pt[]; current: number; pages: number; onSet: (ftPerPt: number, note: string, all: boolean) => void; onClose: () => void }) {
  const [feet, setFeet] = useState('');
  const [all, setAll] = useState(false);
  const [err, setErr] = useState('');
  const known = () => {
    const f = parseFeet(feet);
    const v = f && pts.length === 2 ? scaleFromKnown(pts[0], pts[1], f) : null;
    if (!v) { setErr('Type the length in feet, like 40 or 40 6 for 40 feet 6 inches.'); return; }
    onSet(v, `Set from a ${feet.trim()} ft line you tapped`, all);
  };
  return (
    <Sheet title="Set the scale" onClose={onClose}>
      {pts.length === 2 ? (<>
        <label className={labelCls}>How long is the line you tapped, in real life?</label>
        <input autoFocus inputMode="decimal" value={feet} onChange={(e) => { setFeet(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && known()} placeholder="Feet, like 40 or 40 6" className={inputCls} />
        {err && <p className="text-[16px] text-red-200 mt-2">{err}</p>}
        <p className="text-[15px] text-white/75 mt-2 leading-snug">Best is a long dimension printed on the sheet. The longer the line, the truer the scale.</p>
      </>) : <p className="text-[17px] text-white/85">Tap two ends of a known length on the sheet first.</p>}
      {pages > 1 && (
        <button type="button" role="switch" aria-checked={all} onClick={() => setAll((a) => !a)} className="mt-3 w-full min-h-[52px] rounded-xl border border-white/20 px-3 flex items-center gap-3 text-left">
          <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${all ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/50 text-transparent'}`}><Check size={18} /></span>
          <span className="text-[16px] leading-snug">Also use it on the other sheets that have no scale yet</span>
        </button>
      )}
      {pts.length === 2 && <button onClick={known} className="mt-3 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Set the scale</button>}
      <p className="text-[15px] font-semibold text-white/80 mt-5 mb-2">Or use the scale printed on the sheet</p>
      <div className="grid grid-cols-3 gap-2">
        {PRINTED_SCALES.map((p) => (
          <button key={p.label} onClick={() => onSet(scaleFromPrinted(p.feetPerInch)!, 'Printed scale. Check it against a dimension.', all)}
            className={`min-h-[48px] rounded-lg border text-[16px] font-semibold ${current && Math.abs(current * 72 - p.feetPerInch) < 0.01 ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>{p.label}</button>
        ))}
      </div>
      <p className="text-[15px] text-[#f0a04b] mt-2 leading-snug">A printed scale is only right if the PDF is at full size. Measure one dimension you know to check it.</p>
    </Sheet>
  );
}

function ItemSheet({ item, colorIndex, onSave, onDelete, onClose }: { item: TakeoffItem | null; colorIndex: number; onSave: (it: TakeoffItem) => void; onDelete?: () => void; onClose: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [kind, setKind] = useState<TakeoffKind>(item?.kind || 'length');
  const [unit, setUnit] = useState<TakeoffUnit>(item?.unit || 'LF');
  const [price, setPrice] = useState(item?.unitCost ? String(item.unitCost) : '');
  const [depth, setDepth] = useState(item?.depthIn ? String(item.depthIn) : '');
  const [waste, setWaste] = useState(item?.wastePct ? String(item.wastePct) : '');
  const [color, setColor] = useState(item?.color || TAKEOFF_COLORS[colorIndex % TAKEOFF_COLORS.length]);
  const [err, setErr] = useState('');
  const [sure, setSure] = useState(false);
  const setK = (k: TakeoffKind) => { setKind(k); setUnit(UNITS_FOR[k][0]); };
  const save = () => {
    if (!name.trim()) { setErr('Give it a name, like 8 inch water main.'); return; }
    if (unit === 'CY' && !(Number(depth) > 0)) { setErr('Cubic yards needs the thickness in inches.'); return; }
    onSave({ id: item?.id || uid(), name: name.trim().slice(0, 120), kind, unit, color, unitCost: Math.max(0, Number(price) || 0), depthIn: unit === 'CY' ? Number(depth) : undefined, wastePct: Number(waste) > 0 ? Number(waste) : undefined, shapes: item?.shapes || [] });
  };
  return (
    <Sheet title={item ? 'Name and price' : 'What are you measuring?'} onClose={onClose}>
      <label className={labelCls}>Name</label>
      <input autoFocus={!item} value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="8 inch water main, building slab, catch basins" className={inputCls} />
      {!item && (<>
        <label className={`${labelCls} mt-3`}>How is it measured?</label>
        <div className="grid grid-cols-3 gap-2">
          {(['length', 'area', 'count'] as TakeoffKind[]).map((k) => (
            <button key={k} onClick={() => setK(k)} className={`min-h-[64px] rounded-xl border text-[17px] font-bold leading-tight ${kind === k ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>
              {KIND_LABEL[k]}<span className="block text-[13px] font-normal text-white/75">{k === 'length' ? 'pipe, curb, wall' : k === 'area' ? 'slab, paving' : 'each one'}</span>
            </button>
          ))}
        </div>
      </>)}
      {kind === 'area' && (<>
        <label className={`${labelCls} mt-3`}>Unit</label>
        <div className="grid grid-cols-3 gap-2">
          {UNITS_FOR.area.map((u) => <button key={u} onClick={() => setUnit(u)} className={`min-h-[48px] rounded-lg border text-[17px] font-bold ${unit === u ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>{u === 'SF' ? 'Square feet' : u === 'SY' ? 'Square yards' : 'Cubic yards'}</button>)}
        </div>
        {unit === 'CY' && (<><label className={`${labelCls} mt-3`}>Thickness, in inches</label><input inputMode="decimal" value={depth} onChange={(e) => { setDepth(e.target.value); setErr(''); }} placeholder="6" className={inputCls} /></>)}
      </>)}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div><label className={labelCls}>Your price per {unit}</label><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Can add later" className={inputCls} /></div>
        <div><label className={labelCls}>Extra for waste, %</label><input inputMode="decimal" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="0" className={inputCls} /></div>
      </div>
      <label className={`${labelCls} mt-3`}>Color on the sheet</label>
      <div className="flex flex-wrap gap-2">
        {TAKEOFF_COLORS.map((c) => <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`} className={`w-12 h-12 rounded-full border-4 ${color === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} />)}
      </div>
      {err && <p className="text-[16px] text-red-200 mt-3">{err}</p>}
      <button onClick={save} className="mt-4 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">{item ? 'Save' : 'Start measuring'}</button>
      {onDelete && (
        <button onClick={() => (sure ? onDelete() : setSure(true))} className={`mt-2 w-full min-h-[52px] rounded-xl border text-[17px] font-semibold flex items-center justify-center gap-2 ${sure ? 'border-red-400 bg-red-500/20 text-red-100' : 'border-white/25 text-white/85'}`}>
          <Trash2 size={20} /> {sure ? 'Tap again to delete it and its measuring' : 'Delete this item'}
        </button>
      )}
    </Sheet>
  );
}

function SendSheet({ takeoffId, data, planName, onClose }: { takeoffId: string; data: TakeoffData; planName: string; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [list, setList] = useState<Est[] | null>(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<null | { added: number; estimate_id: string; estimate_number: string; total: number; fixed_price: boolean }>(null);
  const lines = useMemo(() => takeoffLines(data), [data]);
  const unpriced = lines.filter((l) => !(l.unit_cost > 0)).length;
  const unscaled = data.items.reduce((n, it) => n + itemQuantity(it, data.scales).unscaled, 0);
  useEffect(() => {
    const t = setTimeout(async () => {
      const r = await fetch('/api/admin/takeoffs?estimates=1&q=' + encodeURIComponent(q)).catch(() => null);
      setList(r && r.ok ? await r.json().catch(() => []) : []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const send = async (e: Est) => {
    setBusy(e.id); setErr('');
    // The measuring is saved first so the server works from exactly what is on screen.
    await fetch('/api/admin/takeoffs/' + takeoffId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => null);
    const r = await fetch('/api/admin/takeoffs/' + takeoffId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'export', estimate_id: e.id }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy('');
    if (!r || !r.ok) { setErr(d.error || 'That did not go through. Try again.'); return; }
    setDone(d);
  };
  const who = (e: Est) => e.customer?.company_name || [e.customer?.first_name, e.customer?.last_name].filter(Boolean).join(' ') || '';

  if (done) {
    return (
      <Sheet title="Sent to the estimate" onClose={onClose}>
        <p className="text-[18px] leading-relaxed">{done.added} line{done.added === 1 ? '' : 's'} added to {done.estimate_number}, under “From plans: {planName}”.</p>
        <p className="text-[17px] text-white/85 leading-relaxed mt-2">
          {done.fixed_price ? `That estimate has a fixed price of ${money(done.total)}, so the lines are there for reference and the price did not change.` : `The estimate total is now ${money(done.total)}.`}
        </p>
        <button onClick={() => router.push('/admin/estimates/' + done.estimate_id)} className="mt-4 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Open the estimate</button>
        <button onClick={onClose} className="mt-2 w-full min-h-[52px] rounded-xl border border-white/25 text-[17px] font-semibold">Keep measuring</button>
      </Sheet>
    );
  }
  return (
    <Sheet title="Send to an estimate" onClose={onClose}>
      <p className="text-[17px] leading-relaxed">{lines.length} line{lines.length === 1 ? '' : 's'} will be added. Nothing is sent to a customer.</p>
      {unpriced > 0 && <p className="text-[16px] text-[#f0a04b] leading-snug mt-1.5">{unpriced} {unpriced === 1 ? 'has' : 'have'} no price yet and will go in at $0 for you to price on the estimate.</p>}
      {unscaled > 0 && <p className="text-[16px] text-[#f0a04b] leading-snug mt-1.5">{unscaled} measurement{unscaled === 1 ? ' is' : 's are'} left out because the sheet has no scale.</p>}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find the estimate by name or number" className={`${inputCls} mt-3`} />
      {err && <p className="text-[16px] text-red-200 mt-2">{err}</p>}
      <div className="mt-2 space-y-2">
        {list === null && <p className="text-[16px] text-white/75 flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading…</p>}
        {list && list.length === 0 && <p className="text-[16px] text-white/85 leading-snug">No open estimate matches. Start the estimate first (Estimates, then New), then come back and send these to it.</p>}
        {(list || []).map((e) => (
          <button key={e.id} disabled={!!busy} onClick={() => send(e)} className="w-full text-left rounded-xl border border-white/20 bg-white/[0.04] px-3.5 py-3 flex items-center gap-3 disabled:opacity-60">
            <span className="flex-1 min-w-0">
              <span className="block text-[17px] font-bold leading-snug break-words">{e.project_name || e.estimate_number}</span>
              <span className="block text-[15px] text-white/75 leading-snug">{[e.estimate_number, who(e), e.status].filter(Boolean).join(' · ')}</span>
            </span>
            {busy === e.id ? <Loader2 size={22} className="animate-spin shrink-0" /> : <Send size={20} className="text-[#E5C76B] shrink-0" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
