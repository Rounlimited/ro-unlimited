'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Ruler, Plus, Check, Undo2, X, Trash2, Loader2, Pencil, Send, AlertTriangle, Maximize, Minimize, ChevronDown, ChevronUp, Sparkles, List, HelpCircle, MessageCircle } from 'lucide-react';
import {
  type Pt, type TakeoffData, type TakeoffItem, type TakeoffKind, type TakeoffUnit,
  TAKEOFF_COLORS, UNITS_FOR, KIND_LABEL, PRINTED_SCALES, emptyTakeoff, normalizeTakeoff, itemQuantity, fmtQty, money,
  pathLength, polygonArea, scaleFromKnown, scaleFromPrinted, scaleWords, parseFeet, takeoffLines, findPrintedScales, qtyAgreement, unitFromPrinted, bidTotals, itemCost, bidCsv, labelPoints, type SheetWord, type ItemPart, type AiRead, type AiSheet, type BidPricing, type AiDraft, type DraftItem,
} from '@/lib/takeoff';
import { readSheetVectors, snapPoint, traceRun, shapeAt, symbolAt, symbolInBox, findSymbols, type SheetVectors, type SymbolKey } from '@/lib/takeoff-vectors';

/**
 * Bid from Plans: the measuring screen. The plan sheet is drawn from the PDF; what he measures is drawn on top
 * of it. Drag moves the sheet, two fingers (or the wheel) zoom, a tap places a point.
 */
type View = { k: number; x: number; y: number };
type Est = { id: string; estimate_number: string; project_name: string | null; status: string; customer: { first_name: string | null; last_name: string | null; company_name: string | null } | null };
const uid = () => Math.random().toString(36).slice(2, 10);
/** The words printed on a sheet, each with where it sits (its middle), in the same units the measuring uses. */
async function wordsOf(pg: any): Promise<SheetWord[]> {
  const vp = pg.getViewport({ scale: 1 }); const tc = await pg.getTextContent();
  return (tc.items || []).filter((i: any) => i.str && String(i.str).trim()).map((i: any) => { const [x, y] = vp.convertToViewportPoint(i.transform[4] + (i.width || 0) / 2, i.transform[5] + Math.abs(i.height || 0) / 2); return { s: String(i.str), x, y }; });
}
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
  const [sheet, setSheet] = useState<null | 'scale' | 'item' | 'send' | 'sheets' | 'ai' | 'bid' | 'draft' | 'others' | 'help' | 'ask'>(null);
  // What the AI read off the sheets (names, scales, schedules, notes), and whether this sign-in may start a read
  const [ai, setAi] = useState<AiRead | null>(null);
  const [canRead, setCanRead] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [editing, setEditing] = useState<TakeoffItem | null>(null);
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved');
  const [panelOpen, setPanelOpen] = useState(true);
  // Phase 2: the sheet's own line work, for snapping and one-tap runs and outlines
  const opsRef = useRef<any>(null);
  const vecRef = useRef<SheetVectors | null>(null);
  const [vecState, setVecState] = useState<'reading' | 'ready' | 'none'>('reading');
  const [snapOn, setSnapOn] = useState(true);
  const [pickMode, setPickMode] = useState<'points' | 'whole' | 'tag'>('points');
  const [tagText, setTagText] = useState('');
  const wordsRef = useRef<SheetWord[]>([]);
  const [wordsPage, setWordsPage] = useState(0);
  const [lastSearch, setLastSearch] = useState<null | { how: 'tag'; tag: string } | { how: 'symbol'; key: SymbolKey }>(null);
  const [others, setOthers] = useState<{ page: number; pts: Pt[]; on: boolean }[]>([]);
  const [searching, setSearching] = useState('');
  const [moveStep, setMoveStep] = useState<null | 'pick' | { shape: string; idx: number }>(null);
  const [minusNext, setMinusNext] = useState(false);                  // the next shape is a take-away (an opening)
  const [boxStart, setBoxStart] = useState<Pt | null>(null);          // first corner of the box drawn around one symbol
  // Ask the AI: his questions about this bid and its answers
  const [askJob, setAskJob] = useState('');
  const [askLabel, setAskLabel] = useState('');
  const [askErr, setAskErr] = useState('');
  const [askAbout, setAskAbout] = useState<null | { name: string; note: string }>(null);
  const [snapMark, setSnapMark] = useState<null | { pt: Pt; kind: string }>(null);
  const [foundNote, setFoundNote] = useState('');
  const [erase, setErase] = useState(false);     // the next tap removes the measurement under it
  const [big, setBig] = useState(false);          // the sheet takes the whole screen, the list is put away
  const [found, setFound] = useState<{ label: string; feetPerInch: number; times: number }[]>([]);   // scales this sheet prints on itself

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
        setName(row.name || 'Plans'); setData(normalizeTakeoff(row.data)); setAi(row.ai || null); setCanRead(!!row.can_read);
        // A new bid starts with his usual overhead and profit
        if (!normalizeTakeoff(row.data).pricing) fetch('/api/admin/takeoffs/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pricing_defaults' }) }).then((x) => x.json()).then((d) => { if (!dead && d?.pricing) setData((cur) => (cur.pricing ? cur : { ...cur, pricing: d.pricing })); }).catch(() => null);
        // @ts-ignore pdf.js is served from /public so the bundler leaves it alone
        const pdfjs = await import(/* webpackIgnore: true */ '/pdfjs/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const doc = await pdfjs.getDocument({ url: row.file_url }).promise;
        if (dead) return;
        docRef.current = doc; opsRef.current = pdfjs.OPS; setPages(doc.numPages); setLoading('');
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

  // The first time anyone opens this screen, the short guide opens by itself
  useEffect(() => { try { if (!localStorage.getItem('nexabids-help-1')) { localStorage.setItem('nexabids-help-1', '1'); setSheet('help'); } } catch { /* private mode */ } }, []);

  /* ── the AI plan reader ── */
  // 'Busy' only while the worker keeps reporting in; if it has gone quiet for 5 minutes the read is treated as stopped
  const aiFresh = !!ai?.updated_at && Date.now() - new Date(ai.updated_at).getTime() < 5 * 60000;
  const aiBusy = (ai?.status === 'queued' || ai?.status === 'working') && aiFresh;
  const bidDraft: AiDraft | null = ai?.draft || null;
  const measureBusy = Object.values(ai?.measures || {}).some((m) => (m.status === 'queued' || m.status === 'working') && Date.now() - new Date(m.updated_at || 0).getTime() < 4 * 60000);
  const draftBusy = !!bidDraft && (bidDraft.status === 'queued' || bidDraft.status === 'working') && ai?.status !== 'error' && Date.now() - Math.max(new Date(bidDraft.updated_at || 0).getTime(), new Date(ai?.updated_at || 0).getTime()) < 12 * 60000;
  useEffect(() => {
    if (!aiBusy && !draftBusy && !measureBusy) return;
    const t = setInterval(async () => {
      const r = await fetch('/api/admin/takeoffs/' + id).catch(() => null);
      const row = r && r.ok ? await r.json().catch(() => null) : null;
      if (row?.ai) setAi(row.ai);
    }, 4000);
    return () => clearInterval(t);
  }, [aiBusy, draftBusy, measureBusy, id]);
  const startDraft = async () => {
    setAiNote('');
    const r = await fetch('/api/admin/takeoffs/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'draft' }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setAiNote(d.error || 'Could not start that. Try again.'); return; }
    setAi(d.ai);
  };
  const startRead = async () => {
    setAiNote('');
    const r = await fetch('/api/admin/takeoffs/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read' }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setAiNote(d.error || 'Could not start that. Try again.'); return; }
    setAi(d.ai);
  };
  const aiPage: AiSheet | null = (ai?.sheets && ai.sheets[String(page)]) || null;
  const sheetLabel = (p: number) => { const a = ai?.sheets?.[String(p)]; return a && (a.number || a.title) ? [a.number, a.title].filter(Boolean).join(' · ') : ''; };
  // Scales for this sheet: the ones found in the file's text, plus the ones the AI read from the drawing
  const foundAll = useMemo(() => {
    const out = [...found];
    for (const x of findPrintedScales((aiPage?.scales || []).map((q) => q.scale))) if (!out.some((o) => Math.abs(o.feetPerInch - x.feetPerInch) < 0.001)) out.push(x);
    return out;
  }, [found, aiPage]);
  const barScale = !foundAll.length && (aiPage?.scales || []).some((q) => /bar|graphic/i.test(q.scale + ' ' + q.applies_to));
  const addFromPlans = (nameIn: string, qty: number, unitIn: string, note: string, hint?: string) => {
    const u = unitFromPrinted(unitIn);
    change((d) => ({ ...d, items: [...d.items, { id: uid(), name: nameIn.slice(0, 120), kind: u.kind, unit: u.unit, color: TAKEOFF_COLORS[d.items.length % TAKEOFF_COLORS.length], unitCost: 0,
      printedQty: qty > 0 ? qty : undefined, printedNote: qty > 0 ? note : undefined, hint: qty > 0 ? undefined : hint, hintPage: qty > 0 ? undefined : page, shapes: [] }] }));
  };

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
      vecRef.current = null; setVecState('reading');
      readSheetVectors(pg, opsRef.current).then((v) => { if (!dead) { vecRef.current = v; setVecState(v ? 'ready' : 'none'); } }).catch(() => { if (!dead) setVecState('none'); });
      setFound([]);
      wordsRef.current = []; setWordsPage(0);
      wordsOf(pg).then((w) => { if (!dead) { wordsRef.current = w; setWordsPage(page); setFound(findPrintedScales(w.map((x) => x.s))); } }).catch(() => { if (!dead) setWordsPage(page); });
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

  /* ── Ask the AI ── */
  const ask = async (text: string, about?: { name: string; note: string } | null, whole?: boolean) => {
    const q = text.trim(); if (!q || askJob) return;
    setAskErr('');
    const msgs = [...(data.chat || []), { role: 'user' as const, content: q }];
    change((d) => ({ ...d, chat: msgs.slice(-40) }));
    const r = await fetch('/api/admin/takeoffs/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ask', page, messages: msgs, whole: !!whole, item: about || askAbout || undefined }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok || !d.job) { setAskErr(d.error || 'Could not reach the AI. Try again.'); return; }
    setAskLabel(whole ? 'Going through your whole bid…' : 'Looking at the sheet…'); setAskJob(d.job);
  };
  useEffect(() => {
    if (!askJob) return;
    const t0 = Date.now();
    const t = setInterval(async () => {
      const r = await fetch('/api/admin/takeoffs/' + id + '?job=' + askJob).catch(() => null);
      const d = r && r.ok ? await r.json().catch(() => null) : null;
      if (d?.status === 'done') { clearInterval(t); setAskJob(''); change((x) => ({ ...x, chat: [...(x.chat || []), { role: 'assistant' as const, content: String(d.result || '') }].slice(-40) })); }
      else if (d?.status === 'error') { clearInterval(t); setAskJob(''); setAskErr('The AI could not answer that: ' + String(d.result || 'try again.').slice(0, 160)); }
      else if (Date.now() - t0 > 300000) { clearInterval(t); setAskJob(''); setAskErr('That took too long. Try again.'); }
      else if (d?.label) setAskLabel(Date.now() - t0 > 20000 ? 'Still looking. It studies the drawing before it answers.' : d.label);
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askJob, id]);

  /* ── counting helpers ── */
  const addCountPoints = (itemId: string, pageNo: number, pts: Pt[]) => {
    change((d) => ({ ...d, items: d.items.map((it) => {
      if (it.id !== itemId) return it;
      const has = it.shapes.find((sh) => sh.page === pageNo);
      const old = has ? has.pts : [];
      const fresh = pts.filter((p) => !old.some((o) => Math.hypot(o[0] - p[0], o[1] - p[1]) < 3));
      if (!fresh.length) return it;
      return { ...it, shapes: has ? it.shapes.map((sh) => (sh === has ? { ...sh, pts: [...sh.pts, ...fresh] } : sh)) : [...it.shapes, { id: uid(), page: pageNo, pts: fresh }] };
    }) }));
  };
  const countTag = () => {
    if (!active) return;
    const t = tagText.trim();
    if (!t) { setFoundNote('Type the tag first, exactly as it is printed on the drawing.'); return; }
    const pts = labelPoints(wordsRef.current, t);
    if (!pts.length) { setFoundNote(`No "${t}" is printed on this sheet. Check the spelling, or tap each one instead.`); return; }
    addCountPoints(active.id, page, pts);
    setLastSearch({ how: 'tag', tag: t });
    setFoundNote(`Counted ${pts.length} marked "${t}" on this sheet. Look at the marks, and use Remove one on any that sit in a legend or a table.`);
  };
  const searchOthers = async () => {
    if (!lastSearch || !docRef.current) return;
    setSearching('Looking through the other sheets…');
    const res: { page: number; pts: Pt[]; on: boolean }[] = [];
    for (let p = 1; p <= pages; p++) {
      if (p === page) continue;
      try {
        const pg = await docRef.current.getPage(p);
        const pts = lastSearch.how === 'tag' ? labelPoints(await wordsOf(pg), lastSearch.tag) : findSymbols(await readSheetVectors(pg, opsRef.current), lastSearch.key);
        if (pts.length) res.push({ page: p, pts, on: false });
      } catch { /* that sheet could not be read: skip it */ }
    }
    setSearching(''); setOthers(res); setSheet('others');
  };

  /* ── the AI tries one item: it marks the spot, the drawing's own lines do the measuring ── */
  const startMeasure = async (it: TakeoffItem) => {
    setAiNote('');
    const r = await fetch('/api/admin/takeoffs/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'measure', page: it.hintPage || page, item: { id: it.id, name: it.name, kind: it.kind, hint: it.hint || '' } }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setAiNote(d.error || 'Could not start that. Try again.'); return; }
    setAi(d.ai);
  };
  useEffect(() => {
    if (!size || vecState === 'reading' || wordsPage !== page) return;
    for (const it of data.items) {
      const m = ai?.measures?.[it.id];
      if (!m || m.status !== 'done' || !m.found || m.page !== page || it.aiAt === m.updated_at) continue;
      const pts = (m.points || []).map(([fx, fy]) => [fx * size.w, fy * size.h] as Pt);
      let shapePts: Pt[] = []; let note = m.saw || '';
      if (it.kind === 'count') {
        const byTag = m.tag && !m.counted ? labelPoints(wordsRef.current, m.tag) : [];
        if (m.counted && pts.length) { shapePts = pts; note = m.says || `It counted the tag "${m.tag}" and checked each one.`; }
        else if (byTag.length) { shapePts = byTag; note = `It counted the tag "${m.tag}" printed beside each one.`; }
        else { const sym = pts[0] ? symbolAt(vecRef.current, pts[0], 16) : null; shapePts = sym ? sym.pts : pts.slice(0, 1); if (!sym) note = 'It found one but could not match the rest. Count the others yourself.'; }
      } else {
        let sn = pts.map((p) => snapPoint(vecRef.current, p, 10).pt);
        if (sn.length > 2 && Math.hypot(sn[0][0] - sn[sn.length - 1][0], sn[0][1] - sn[sn.length - 1][1]) < 3) sn = sn.slice(0, -1);
        if (sn.length >= (it.kind === 'area' ? 3 : 2)) shapePts = sn;
        if (m.says) note = m.says;
      }
      const sid = uid();
      change((d) => ({ ...d, items: d.items.map((x) => (x.id !== it.id ? x : { ...x, aiAt: m.updated_at, aiNote: ((m.checked ? '' : 'Not double-checked. ') + note + (m.confidence ? ` (It is ${m.confidence === 'high' ? 'sure' : m.confidence === 'medium' ? 'fairly sure' : 'not sure'}.)` : '')).slice(0, 460), aiCheck: shapePts.length > 0, aiShape: shapePts.length ? sid : undefined, shapes: shapePts.length ? [...x.shapes, { id: sid, page, pts: shapePts }] : x.shapes })) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai, page, size, vecState, wordsPage, data.items]);

  const tap = (raw: Pt) => {
    if (!size || raw[0] < 0 || raw[1] < 0 || raw[0] > size.w || raw[1] > size.h) return;
    const r = 14 / viewRef.current.k;                                   // 14 screen pixels, at any zoom
    if (mode === 'draw' && active && moveStep) {
      const rr = 14 / viewRef.current.k;
      if (moveStep === 'pick') {
        let best: { shape: string; idx: number; pt: Pt } | null = null; let bd = rr * 3;
        for (const sh of active.shapes) { if (sh.page !== page) continue; sh.pts.forEach((q, i) => { const d = Math.hypot(q[0] - raw[0], q[1] - raw[1]); if (d < bd) { bd = d; best = { shape: sh.id, idx: i, pt: q }; } }); }
        const hit = best as { shape: string; idx: number; pt: Pt } | null;
        if (!hit) { setFoundNote('No corner of this item is there. Tap right on the corner you want to move.'); return; }
        setMoveStep({ shape: hit.shape, idx: hit.idx }); setSnapMark({ pt: hit.pt, kind: 'corner' }); setFoundNote('Got it. Now tap where that corner should be.');
        return;
      }
      const to = snapOn ? snapPoint(vecRef.current, raw, rr).pt : raw;
      const mv = moveStep;
      change((d) => ({ ...d, items: d.items.map((it) => (it.id !== active.id ? it : { ...it, shapes: it.shapes.map((sh) => (sh.id !== mv.shape ? sh : { ...sh, pts: sh.pts.map((q, i) => (i === mv.idx ? to : q)) })) })) }));
      setMoveStep(null); setSnapMark(null); setFoundNote('Moved.');
      return;
    }
    if (mode === 'draw' && active && erase) {
      // take away the one measurement of this item nearest the tap
      const dSeg = (a: Pt, b: Pt) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const L = dx * dx + dy * dy; const t = L ? Math.max(0, Math.min(1, ((raw[0] - a[0]) * dx + (raw[1] - a[1]) * dy) / L)) : 0; return Math.hypot(a[0] + t * dx - raw[0], a[1] + t * dy - raw[1]); };
      let best: { shape: string; pt: number } | null = null; let bd = r * 2.5;
      for (const sh of active.shapes) {
        if (sh.page !== page) continue;
        if (active.kind === 'count') sh.pts.forEach((q, i) => { const d = Math.hypot(q[0] - raw[0], q[1] - raw[1]); if (d < bd) { bd = d; best = { shape: sh.id, pt: i }; } });
        else { const n = active.kind === 'area' ? sh.pts.length : sh.pts.length - 1; let inside = false; if (active.kind === 'area') for (let i = 0, j = sh.pts.length - 1; i < sh.pts.length; j = i++) { const [xi, yi] = sh.pts[i], [xj, yj] = sh.pts[j]; if ((yi > raw[1]) !== (yj > raw[1]) && raw[0] < ((xj - xi) * (raw[1] - yi)) / (yj - yi) + xi) inside = !inside; }
          for (let i = 0; i < n; i++) { const d = inside ? 0 : dSeg(sh.pts[i], sh.pts[(i + 1) % sh.pts.length]); if (d < bd) { bd = d; best = { shape: sh.id, pt: -1 }; } } }
      }
      const hit = best as { shape: string; pt: number } | null;
      if (!hit) { setFoundNote('Nothing of this item is there. Tap right on the one to remove.'); return; }
      change((d) => ({ ...d, items: d.items.map((it) => (it.id !== active.id ? it : { ...it, shapes: it.shapes.map((sh) => (sh.id !== hit.shape ? sh : hit.pt < 0 ? { ...sh, pts: [] } : { ...sh, pts: sh.pts.filter((_, i) => i !== hit.pt) })).filter((sh) => sh.pts.length) })) }));
      setErase(false); setFoundNote('Removed.');
      return;
    }
    // One tap takes a whole line run (length) or a whole outline (area), straight from the drawing
    if (mode === 'draw' && active && pickMode === 'whole' && active.kind === 'count') {
      // Tap one symbol and every matching one on the sheet is counted
      // two taps draw a box around one symbol, so the app knows exactly what the symbol is
      if (!boxStart) { setBoxStart(raw); setSnapMark({ pt: raw, kind: 'corner' }); setFoundNote('Good. Now tap the opposite corner, so the box is around just that one.'); return; }
      const sym = symbolInBox(vecRef.current, boxStart, raw) || symbolAt(vecRef.current, [(boxStart[0] + raw[0]) / 2, (boxStart[1] + raw[1]) / 2], r); const found = sym ? sym.pts : null;
      setBoxStart(null); setSnapMark(null);
      if (sym) setLastSearch({ how: 'symbol', key: sym.key });
      if (!found) { setSnapMark({ pt: raw, kind: 'miss' }); setTimeout(() => setSnapMark(null), 900); setFoundNote('Nothing like it was found. Try again with the box snug around one, or use Count a tag.'); return; }
      let added = 0;
      change((d) => ({ ...d, items: d.items.map((it) => {
        if (it.id !== active.id) return it;
        const has = it.shapes.find((s) => s.page === page);
        const old = has ? has.pts : [];
        const fresh = found.filter((p) => !old.some((o) => Math.hypot(o[0] - p[0], o[1] - p[1]) < 3));
        added = fresh.length;
        return { ...it, shapes: has ? it.shapes.map((s) => (s === has ? { ...s, pts: [...s.pts, ...fresh] } : s)) : [...it.shapes, { id: uid(), page, pts: fresh }] };
      }) }));
      setFoundNote(`Found ${found.length} like it on this sheet. It can miss ones that are drawn a little differently: look over the sheet and tap any it missed.`);
      return;
    }
    if (mode === 'draw' && active && pickMode === 'whole' && active.kind !== 'count') {
      const got = active.kind === 'length' ? traceRun(vecRef.current, raw, r) : shapeAt(vecRef.current, raw);
      if (!got || got.length < (active.kind === 'area' ? 3 : 2)) { setSnapMark({ pt: raw, kind: 'miss' }); setTimeout(() => setSnapMark(null), 900); return; }
      change((d) => ({ ...d, items: d.items.map((it) => (it.id === active.id ? { ...it, shapes: [...it.shapes, { id: uid(), page, pts: got, minus: minusNext || undefined }] } : it)) }));
      setMinusNext(false);
      return;
    }
    const sn = snapOn ? snapPoint(vecRef.current, raw, r) : { pt: raw, kind: 'none' as const };
    const pt = sn.pt;
    if (sn.kind !== 'none') { setSnapMark({ pt, kind: sn.kind }); setTimeout(() => setSnapMark(null), 700); }
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
    if (draft.length >= need) change((d) => ({ ...d, items: d.items.map((it) => (it.id === active.id ? { ...it, shapes: [...it.shapes, { id: uid(), page, pts: draft, minus: minusNext || undefined }] } : it)) }));
    setDraft([]); setMinusNext(false);
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
  const pick = (itemId: string) => { setDraft([]); setScalePts([]); setActiveId(itemId); setMode('draw'); setFoundNote(''); setErase(false); setMoveStep(null); setLastSearch(null); setBoxStart(null); setMinusNext(false);
    // an item that came from a table says which tag to count: start there
    const it = data.items.find((x) => x.id === itemId); const tg = it && it.kind === 'count' ? /marked (\S+) on the drawings/.exec(it.hint || '') : null;
    if (tg) { setTagText(tg[1]); setPickMode('tag'); } else setPickMode('points'); };
  const stop = () => { setDraft([]); setScalePts([]); setMode('move'); setErase(false); setMoveStep(null); setBoxStart(null); };

  const draftReadout = useMemo(() => {
    if (!active || active.kind === 'count' || draft.length < 2) return '';
    if (!ftPerPt) return 'Set the scale to see the size';
    if (active.kind === 'length') return `${fmtQty(pathLength(draft) * ftPerPt, 'LF')} LF so far`;
    return draft.length >= 3 ? `${fmtQty(polygonArea(draft) * ftPerPt * ftPerPt, 'SF')} SF so far` : '';
  }, [active, draft, ftPerPt]);

  const bid = useMemo(() => bidTotals(data), [data]);
  // A long list (the AI's draft can be 100+ items) is shown by trade, each trade folding shut
  const hasGroups = data.items.some((i) => i.group);
  const orderedItems = useMemo(() => (hasGroups ? data.items.map((it, i) => ({ it, i })).sort((a, b) => (a.it.group || '').localeCompare(b.it.group || '') || a.i - b.i).map((x) => x.it) : data.items), [data.items, hasGroups]);
  const groupInfo = useMemo(() => { const m: Record<string, { n: number; ready: number }> = {}; for (const it of data.items) { const g = it.group || ''; m[g] = m[g] || { n: 0, ready: 0 }; m[g].n++; if (itemQuantity(it, data.scales).quantity > 0) m[g].ready++; } return m; }, [data]);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const readyCount = Object.values(groupInfo).reduce((n, g) => n + g.ready, 0);
  const total = bid.price;
  const linesReady = useMemo(() => takeoffLines(data).length, [data]);
  const sw = 2.2 / view.k;   // line weight that stays the same on screen at any zoom
  const dot = 6 / view.k;

  if (loadError) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle size={36} className="text-red-300" />
        <p className="text-[19px] text-white max-w-md leading-snug">{loadError}</p>
        <button onClick={() => router.push('/admin/nexabids')} className="min-h-[52px] px-6 rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Back to plans</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a] text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* top bar */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 bg-[#111]">
        <button onClick={() => router.push('/admin/nexabids')} aria-label="Back to plans" className="w-12 h-12 rounded-xl flex items-center justify-center active:bg-white/10 shrink-0"><ArrowLeft size={24} /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold leading-tight truncate">{name}</p>
          <p className={`text-[14px] leading-tight ${saved === 'error' ? 'text-red-300' : 'text-white/70'}`}>{saved === 'saving' ? 'Saving…' : saved === 'error' ? 'Not saved. Check the connection.' : 'Saved'}</p>
        </div>
        {pages > 0 && (
          <div className="flex items-center shrink-0">
            <button disabled={page <= 1} onClick={() => { stop(); setPage((p) => p - 1); }} aria-label="Sheet before" className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-30 active:bg-white/10"><ChevronLeft size={26} /></button>
            <button onClick={() => setSheet('sheets')} className="min-h-[48px] px-2 rounded-xl active:bg-white/10 text-center max-w-[46vw]">
              <span className="block text-[16px] font-semibold whitespace-nowrap">Sheet {page} of {pages}</span>
              {sheetLabel(page) && <span className="block text-[13px] text-[#E5C76B] leading-tight truncate">{sheetLabel(page)}</span>}
            </button>
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
                    ? <polygon key={s.id} points={s.pts.map((p) => p.join(',')).join(' ')} fill={s.minus ? '#000' : it.color} fillOpacity={s.minus ? 0.5 : it.id === activeId ? 0.34 : 0.22} stroke={s.minus ? '#fff' : it.color} strokeWidth={sw} strokeDasharray={s.minus ? `${sw * 3} ${sw * 2}` : undefined} strokeLinejoin="round" />
                    : <polyline key={s.id} points={s.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={it.color} strokeWidth={sw * (it.id === activeId ? 2 : 1.5)} strokeLinejoin="round" strokeLinecap="round" />
              )))}
              {active && draft.length > 0 && (<>
                {active.kind === 'area' && draft.length >= 3 && <polygon points={draft.map((p) => p.join(',')).join(' ')} fill={active.color} fillOpacity={0.2} stroke="none" />}
                <polyline points={draft.map((p) => p.join(',')).join(' ')} fill="none" stroke={active.color} strokeWidth={sw * 1.6} strokeDasharray={`${sw * 4} ${sw * 3}`} strokeLinejoin="round" />
                {draft.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={dot} fill="#fff" stroke={active.color} strokeWidth={sw} />)}
              </>)}
              {boxStart && <circle cx={boxStart[0]} cy={boxStart[1]} r={dot * 1.2} fill="#4ade80" />}
              {snapMark && <circle cx={snapMark.pt[0]} cy={snapMark.pt[1]} r={dot * 2.2} fill="none" stroke={snapMark.kind === 'miss' ? '#f87171' : '#4ade80'} strokeWidth={sw * 1.4} />}
              {scalePts.length > 0 && (<>
                {scalePts.length === 2 && <line x1={scalePts[0][0]} y1={scalePts[0][1]} x2={scalePts[1][0]} y2={scalePts[1][1]} stroke="#FF2D95" strokeWidth={sw * 1.6} />}
                {scalePts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={dot} fill="#fff" stroke="#FF2D95" strokeWidth={sw * 1.4} />)}
              </>)}
            </svg>
          )}
          {size && (
            <div className="absolute right-2 top-2 flex flex-col items-end gap-2" onPointerDown={(e) => e.stopPropagation()}>
              <button onClick={() => { setBig((v) => !v); setTimeout(() => fit(size.w, size.h), 80); }}
                className="min-h-[48px] px-3.5 rounded-xl bg-black/85 border border-white/35 text-[16px] font-bold flex items-center gap-2">
                {big ? <Minimize size={20} /> : <Maximize size={20} />}{big ? 'Show the list' : 'Full screen'}
              </button>
              <button onClick={() => fit(size.w, size.h)} className="min-h-[48px] px-3.5 rounded-xl bg-black/85 border border-white/35 text-[16px] font-bold">Whole sheet</button>
              <button onClick={() => setSheet('help')} className="min-h-[48px] px-3.5 rounded-xl bg-black/85 border border-[#E5C76B]/70 text-[16px] font-bold flex items-center gap-2"><HelpCircle size={20} /> Help</button>
            </div>
          )}

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
              <p className="text-[15px] text-white/75">Drag to move the sheet. Two fingers to zoom.{vecState === 'ready' && snapOn && pickMode === 'points' ? ' Taps snap to the drawing\u2019s corners and lines.' : ''}</p>
              {mode === 'draw' && active && active.kind === 'count' && (
                <div className="mt-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => { setPickMode('points'); setFoundNote(''); }} className={`min-h-[52px] rounded-xl border text-[15px] font-bold leading-tight px-1 ${pickMode === 'points' ? 'border-[#C9A84C] bg-[#C9A84C]/20' : 'border-white/30'}`}>Tap each one</button>
                    <button disabled={vecState !== 'ready'} onClick={() => { setPickMode('whole'); setBoxStart(null); setFoundNote('Tap one corner of a box around ONE of them, then the opposite corner.'); }} className={`min-h-[52px] rounded-xl border text-[15px] font-bold leading-tight px-1 disabled:opacity-40 ${pickMode === 'whole' ? 'border-[#4ade80] bg-[#4ade80]/15' : 'border-white/30'}`}>Box one, find the rest</button>
                    <button onClick={() => { setPickMode('tag'); setFoundNote(''); }} className={`min-h-[52px] rounded-xl border text-[15px] font-bold leading-tight px-1 ${pickMode === 'tag' ? 'border-[#4ade80] bg-[#4ade80]/15' : 'border-white/30'}`}>Count a tag</button>
                  </div>
                  {pickMode === 'tag' && (
                    <div className="mt-2">
                      <p className="text-[15px] text-white/85 leading-snug">If each one has the same letters printed beside it (like A, P-1 or CB), type them and every one on this sheet is counted.</p>
                      <div className="flex gap-2 mt-1.5">
                        <input value={tagText} onChange={(e) => setTagText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && countTag()} placeholder="The tag, like A" className="flex-1 min-w-0 min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/30 text-[18px] text-white placeholder:text-white/40 focus:outline-none focus:border-[#4ade80]" />
                        <button onClick={countTag} className="min-h-[52px] px-5 rounded-xl bg-[#4ade80] text-black text-[17px] font-bold">Count</button>
                      </div>
                    </div>
                  )}
                  {lastSearch && pages > 1 && <button disabled={!!searching} onClick={searchOthers} className="mt-2 w-full min-h-[48px] rounded-xl border border-[#4ade80]/70 text-[16px] font-bold disabled:opacity-60">{searching || 'Look on the other sheets too'}</button>}
                </div>
              )}
              {mode === 'draw' && foundNote && <p className="text-[16px] font-semibold text-[#8fe3a8] mt-2 leading-snug">{foundNote}</p>}
              {mode === 'draw' && active && active.kind !== 'count' && vecState === 'ready' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => { setPickMode('points'); setDraft([]); }} className={`min-h-[48px] rounded-xl border text-[16px] font-bold ${pickMode === 'points' ? 'border-[#C9A84C] bg-[#C9A84C]/20' : 'border-white/30'}`}>{active.kind === 'area' ? 'Tap the corners' : 'Tap point by point'}</button>
                  <button onClick={() => { setPickMode('whole'); setDraft([]); }} className={`min-h-[48px] rounded-xl border text-[16px] font-bold ${pickMode === 'whole' ? 'border-[#4ade80] bg-[#4ade80]/15' : 'border-white/30'}`}>{active.kind === 'area' ? 'Tap inside a shape' : 'Tap a whole line'}</button>
                </div>
              )}
              {vecState === 'ready' && !(mode === 'draw' && pickMode === 'whole') && (
                <button onClick={() => setSnapOn((v) => !v)} className="mt-2 min-h-[44px] px-3 rounded-lg border border-white/25 text-[15px] font-semibold">Snap to the drawing: {snapOn ? 'On' : 'Off'}</button>
              )}
              {vecState === 'none' && <p className="text-[15px] text-[#f0a04b] mt-1">This sheet is a picture (scanned), so there are no drawing lines to snap to.</p>}
              <div className="flex gap-2 mt-2.5">
                {mode === 'draw' && <button onClick={undo} className="min-h-[52px] px-4 rounded-xl border border-white/30 text-[17px] font-semibold flex items-center gap-2"><Undo2 size={20} /> Undo</button>}
                {mode === 'draw' && active && active.kind !== 'count' && <button onClick={() => { setMinusNext((v) => !v); setFoundNote(minusNext ? '' : 'The next one you mark will be taken away from the total, like a door opening or a planter.'); }} className={`min-h-[52px] px-3 rounded-xl border text-[15px] font-bold leading-tight ${minusNext ? 'border-red-400 bg-red-500/25' : 'border-white/30'}`}>{minusNext ? 'Taking away' : 'Take away'}</button>}
                {mode === 'draw' && active && active.kind !== 'count' && (
                  <button onClick={finishShape} disabled={draft.length < (active.kind === 'area' ? 3 : 2)} className="flex-1 min-h-[52px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Check size={22} /> Finish this one</button>
                )}
                <button onClick={stop} className={`min-h-[52px] px-5 rounded-xl text-[17px] font-semibold ${mode === 'draw' && active?.kind === 'count' ? 'flex-1 bg-[#C9A84C] text-black font-bold' : 'border border-white/30'}`}>{mode === 'scale' ? 'Cancel' : 'Done'}</button>
              </div>
            </div>
          )}
          <div className={`${big ? 'hidden' : mode !== 'move' ? 'hidden lg:flex' : 'flex'} flex-col flex-1 min-h-0`}>
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
            <button onClick={() => { setDraft([]); setScalePts([]); setMode('move'); setSheet('scale'); }}
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
            <AiCard ai={ai} busy={aiBusy} canRead={canRead} pages={pages} sheet={aiPage} note={aiNote} onStart={startRead} onOpen={() => setSheet('ai')} />
            {canRead && pages > 0 && (
              <button onClick={() => { setAskAbout(null); setSheet('ask'); }} className="w-full text-left rounded-xl border border-[#7dd3fc]/60 bg-[#7dd3fc]/10 px-3 py-2.5 flex items-center gap-3">
                <MessageCircle size={22} className="text-[#7dd3fc] shrink-0" />
                <span className="flex-1 min-w-0"><span className="block text-[17px] font-bold leading-snug">Ask the AI about this sheet</span><span className="block text-[15px] text-white/85 leading-snug">{(data.chat || []).length ? 'Carry on the conversation' : 'What to check, what is missing, how sure it is'}</span></span>
              </button>
            )}
            {ai?.status === 'done' && <DraftCard draft={bidDraft} busy={draftBusy} canRead={canRead} taken={!!data.draftTaken} onStart={startDraft} onOpen={() => setSheet('draft')} />}
            {data.items.length === 0 && <p className="text-[16px] text-white/80 leading-snug px-1">Add what you want to measure: a pipe run, a slab, catch basins. Then tap it out on the sheet.</p>}
            {data.items.length > 8 && <p className="text-[15px] text-white/80 px-1">{readyCount} of {data.items.length} have a quantity. {data.items.length - readyCount} still to measure.</p>}
            {orderedItems.map((it, idx) => {
              const q = itemQuantity(it, data.scales);
              const on = it.id === activeId && mode === 'draw';
              const g = it.group || ''; const head = hasGroups && (idx === 0 || (orderedItems[idx - 1].group || '') !== g);
              const shut = hasGroups && closedGroups.includes(g) && !on;
              return (
                <Fragment key={it.id}>
                {head && (
                  <button onClick={() => setClosedGroups((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]))} className="w-full min-h-[44px] px-1 pt-1 flex items-center gap-2 text-left">
                    <span className="flex-1 text-[14px] font-bold uppercase tracking-wide text-[#E5C76B]">{g || 'Your own items'} · {groupInfo[g]?.ready || 0} of {groupInfo[g]?.n || 0} ready</span>
                    {closedGroups.includes(g) ? <ChevronDown size={20} className="text-white/70" /> : <ChevronUp size={20} className="text-white/70" />}
                  </button>
                )}
                {!shut && (
                <div className={`rounded-xl border ${on ? 'border-[#C9A84C] bg-[#C9A84C]/12' : 'border-white/15 bg-white/[0.04]'}`}>
                  <button onClick={() => (on ? stop() : pick(it.id))} className="w-full text-left px-3 py-2.5 flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full shrink-0 border-2 border-white/70" style={{ background: it.color }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[17px] font-bold leading-snug break-words">{it.name}</span>
                      <span className="block text-[15px] text-white/80 leading-snug">
                        {it.alt && <b className="text-[#c4b5fd]">Alternate · </b>}{Number(it.times) > 1 && <b className="text-[#E5C76B]">× {it.times} · </b>}{fmtQty(q.quantity, it.unit)} {it.unit}{(() => { const c = itemCost(it, data.scales); return c.parts.length && !(c.qty > 0) ? ' · build-up, nothing measured yet' : c.parts.length ? (c.total > 0 ? ` · build-up of ${c.parts.length + (it.unitCost > 0 ? 1 : 0)} = ${money(c.total)}` : ` · build-up of ${c.parts.length}, no prices yet`) : it.unitCost > 0 ? ` × ${money(it.unitCost)} = ${money(c.total)}` : ' · no price yet'; })()}
                      </span>
                      {q.unscaled > 0 && <span className="block text-[14px] text-[#f0a04b] leading-snug">{q.unscaled} left out: that sheet has no scale</span>}
                      {!!it.hint && !it.shapes.length && !it.printedQty && <span className="block text-[14px] text-[#f0a04b] leading-snug">To measure: {it.hint}</span>}
                      {!!it.printedQty && !it.shapes.length && <span className="block text-[14px] text-[#9ecbff] leading-snug">From the plans{it.printedNote ? `: ${it.printedNote}` : ''}. Not measured.</span>}
                      {(() => { const ag = qtyAgreement(it, data.scales); if (!ag) return null; return ag.state === 'match'
                        ? <span className="block text-[14px] font-semibold text-[#4ade80] leading-snug">Matches the plans ({fmtQty(ag.printed, it.unit)} {it.unit} printed)</span>
                        : <span className="block text-[14px] font-semibold text-[#f0a04b] leading-snug">Check this: the plans say {fmtQty(ag.printed, it.unit)} {it.unit}, you measured {fmtQty(ag.measured, it.unit)} ({ag.offPct}% apart)</span>; })()}
                    </span>
                    <span className="text-[14px] font-bold text-[#E5C76B] shrink-0">{on ? 'Measuring' : 'Measure'}</span>
                  </button>
                  {(() => {
                    const m = ai?.measures?.[it.id];
                    const busy = !!m && (m.status === 'queued' || m.status === 'working') && Date.now() - new Date(m.updated_at || 0).getTime() < 4 * 60000;
                    const where = (p?: number) => (p ? sheetLabel(p) || `sheet ${p}` : 'the sheet');
                    if (busy) return <p className="px-3 pb-2.5 text-[15px] text-[#c4b5fd] flex items-center gap-2"><Loader2 size={18} className="animate-spin shrink-0" /> The AI is looking for it on {where(m!.page)}. About 20 seconds.</p>;
                    if (it.aiCheck) return (
                      <div className="mx-3 mb-2.5 rounded-lg border border-[#a78bfa]/70 bg-[#a78bfa]/12 p-2.5">
                        <p className="text-[16px] font-bold leading-snug">The AI measured this. Check it on the sheet.</p>
                        {it.aiNote && <p className="text-[15px] text-white/90 leading-snug mt-0.5">{it.aiNote}</p>}
                        {canRead && <button onClick={() => { const about = { name: it.name, note: it.aiNote || '' }; setAskAbout(about); setSheet('ask'); ask(`How sure are you about "${it.name}"? What exactly should I check on the sheet?`, about); }} className="mt-2 w-full min-h-[44px] rounded-lg border border-[#a78bfa]/70 text-[15px] font-semibold flex items-center justify-center gap-2"><MessageCircle size={18} /> Ask the AI about this</button>}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <button onClick={() => change((d) => ({ ...d, items: d.items.map((x) => (x.id === it.id ? { ...x, aiCheck: false } : x)) }))} className="min-h-[48px] rounded-lg bg-[#4ade80] text-black text-[16px] font-bold">Looks right</button>
                          <button onClick={() => change((d) => ({ ...d, items: d.items.map((x) => (x.id === it.id ? { ...x, aiCheck: false, shapes: x.shapes.filter((sh) => sh.id !== x.aiShape), aiShape: undefined } : x)) }))} className="min-h-[48px] rounded-lg border border-white/30 text-[16px] font-semibold">Throw it away</button>
                        </div>
                      </div>
                    );
                    if (m?.status === 'done' && m.found && m.page !== page && it.aiAt !== m.updated_at) return <div className="px-3 pb-2.5"><button onClick={() => { stop(); setPage(m.page!); }} className="w-full min-h-[48px] rounded-lg bg-[#a78bfa]/25 border border-[#a78bfa]/70 text-[16px] font-bold">The AI marked it. See it on {where(m.page)}</button></div>;
                    const said = m?.status === 'done' && !m.found ? `The AI could not find it on ${where(m.page)}${m.saw ? ': ' + m.saw : '.'}` : m?.status === 'error' ? `The AI could not do it: ${m.error || 'try again.'}` : it.aiAt && !it.aiShape && !it.shapes.length ? 'The AI could not make it out. Measure this one yourself.' : '';
                    if (!canRead || it.shapes.length || it.printedQty) return said ? <p className="px-3 pb-2 text-[14px] text-[#f0a04b] leading-snug">{said}</p> : null;
                    return (
                      <div className="px-3 pb-2.5">
                        {said && <p className="text-[14px] text-[#f0a04b] leading-snug mb-1.5">{said}</p>}
                        <button onClick={() => startMeasure(it)} className="w-full min-h-[48px] rounded-lg bg-[#a78bfa]/20 border border-[#a78bfa]/70 text-[16px] font-bold flex items-center justify-center gap-2"><Sparkles size={18} /> Let the AI try it{it.hintPage && it.hintPage !== page ? ` on ${where(it.hintPage)}` : ''}</button>
                      </div>
                    );
                  })()}
                  {!!it.hintPage && !it.shapes.length && !it.printedQty && (
                    <div className="px-3 pb-2.5">
                      <button onClick={() => { if (it.hintPage !== page) setPage(it.hintPage!); pick(it.id); }} className="w-full min-h-[48px] rounded-lg bg-[#f0a04b]/20 border border-[#f0a04b]/70 text-[16px] font-bold">Measure it on {sheetLabel(it.hintPage) || `sheet ${it.hintPage}`}</button>
                    </div>
                  )}
                  {it.id === activeId && (
                    <div className="flex flex-wrap gap-2 px-3 pb-2.5">
                      <button onClick={() => { setEditing(it); setSheet('item'); }} className="flex-1 min-h-[48px] rounded-lg border border-white/25 text-[16px] font-semibold flex items-center justify-center gap-1.5"><Pencil size={18} /> Name and price</button>
                      <button onClick={undo} className="min-h-[48px] px-3 rounded-lg border border-white/25 text-[16px] font-semibold flex items-center gap-1.5"><Undo2 size={18} /> Undo last</button>
                      <button onClick={() => { if (!(mode === 'draw' && activeId === it.id)) pick(it.id); setErase(true); setFoundNote('Tap the one to remove.'); }} className={`min-h-[48px] px-3 rounded-lg border text-[16px] font-semibold flex items-center gap-1.5 ${erase ? 'border-red-400 bg-red-500/20' : 'border-white/25'}`}><Trash2 size={18} /> Remove one</button>
                      {it.kind !== 'count' && it.shapes.some((sh) => sh.page === page) && <button onClick={() => { if (!(mode === 'draw' && activeId === it.id)) pick(it.id); setMoveStep('pick'); setFoundNote('Tap the corner you want to move.'); }} className={`min-h-[48px] px-3 rounded-lg border text-[16px] font-semibold ${moveStep ? 'border-[#4ade80] bg-[#4ade80]/15' : 'border-white/25'}`}>Move a corner</button>}
                    </div>
                  )}
                </div>
                )}
                </Fragment>
              );
            })}
            <button onClick={() => { setEditing(null); setSheet('item'); }} className="w-full min-h-[52px] rounded-xl border-2 border-dashed border-white/30 text-[17px] font-semibold flex items-center justify-center gap-2"><Plus size={22} /> Add something to measure</button>
          </div>
          <div className="px-3 pt-2 pb-2.5 border-t border-white/10">
            {data.items.length > 0 && (
              <button onClick={() => setSheet('bid')} className={`w-full min-h-[52px] mb-2 rounded-xl border px-3 text-left flex items-center gap-3 ${bid.belowFloor ? 'border-red-400 bg-red-500/15' : 'border-white/20 bg-white/5'}`}>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-bold leading-tight">Cost {money(bid.cost)} → Bid {money(bid.price)}</span>
                  <span className={`block text-[14px] leading-tight ${bid.belowFloor ? 'text-red-200 font-semibold' : 'text-white/75'}`}>{bid.belowFloor ? `Below your floor of ${bid.pricing.floorPct}% profit` : bid.pricing.overheadPct || bid.pricing.profitPct ? `Overhead ${bid.pricing.overheadPct}% · Profit ${bid.pricing.profitPct}%${bid.unpriced ? ` · ${bid.unpriced} not priced` : ''}` : 'Tap to add overhead and profit'}</span>
                </span>
                <ChevronDown size={22} className="-rotate-90 text-white/70 shrink-0" />
              </button>
            )}
            <button onClick={() => setSheet('send')} disabled={!linesReady} className="w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-40">
              <Send size={20} /> Send to an estimate{total > 0 ? ` · ${money(total)}` : ''}
            </button>
          </div>
          </div>
        </div>
      </div>

      {sheet === 'scale' && (
        <ScaleSheet pts={scalePts} current={ftPerPt} pages={pages} found={foundAll} bar={barScale}
          onMeasure={() => { setSheet(null); setDraft([]); setScalePts([]); setMode('scale'); }}
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
            change((d) => ({ ...d, items: d.items.some((i) => i.id === it.id) ? d.items.map((i) => (i.id === it.id ? { ...i, ...it, shapes: i.shapes } : i)) : [...d.items, it] }));
            setSheet(null);
            if (!editing) pick(it.id);
          }} />
      )}
      {sheet === 'sheets' && (
        <Sheet title="Sheets in this set" onClose={() => setSheet(null)}>
          {!ai?.sheets && <p className="text-[16px] text-white/80 mb-2 leading-snug">Sheet names show here after the AI has read the plans.</p>}
          <div className="space-y-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => { stop(); setPage(p); setSheet(null); }} className={`w-full min-h-[52px] text-left rounded-xl border px-3 py-2 flex items-center gap-3 ${p === page ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/15 bg-white/[0.04]'}`}>
                <span className="w-9 text-[17px] font-bold text-white/80 shrink-0">{p}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold leading-snug break-words">{sheetLabel(p) || `Sheet ${p}`}</span>
                  <span className="block text-[14px] text-white/70 leading-snug">{[ai?.sheets?.[String(p)]?.discipline, data.scales[String(p)] ? `scale ${scaleWords(Number(data.scales[String(p)]))}` : 'no scale yet', data.items.some((it) => it.shapes.some((sh) => sh.page === p)) ? 'measured' : ''].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'ai' && aiPage && (
        <AiSheetView s={aiPage} page={page} onClose={() => setSheet(null)}
          onScale={(fpi, label) => { change((d) => ({ ...d, scales: { ...d.scales, [String(page)]: scaleFromPrinted(fpi)! }, scaleNotes: { ...(d.scaleNotes || {}), [String(page)]: `Printed scale ${label}, read by the AI. Check it against a dimension.` } })); }}
          onAdd={addFromPlans} />
      )}
      {sheet === 'draft' && bidDraft?.status === 'done' && (
        <DraftSheet draft={bidDraft} have={data.items.map((i) => i.name.toLowerCase())} onClose={() => setSheet(null)}
          onAdd={(list) => { change((d) => ({ ...d, draftTaken: true, items: [...d.items, ...list.map((x, k) => { const u = unitFromPrinted(x.unit); return { id: uid(), name: x.name, kind: u.kind, unit: u.unit, color: TAKEOFF_COLORS[(d.items.length + k) % TAKEOFF_COLORS.length], unitCost: 0, group: x.group, alt: (x as any).alt ? true : undefined,
            printedQty: x.quantity || undefined, printedNote: x.quantity ? (x.source === 'table' ? `a table on ${x.sheet || 'the plans'}` : x.source === 'lump' ? 'priced as one lump' : `printed on ${x.sheet || 'the plans'}`) : undefined,
            hint: x.quantity ? undefined : (x.measure || undefined), hintPage: x.quantity ? undefined : (x.page || undefined), shapes: [] }; })] })); setSheet(null); }} />
      )}
      {sheet === 'help' && <HelpSheet onClose={() => setSheet(null)} />}
      {sheet === 'ask' && <AskSheet chat={data.chat || []} busy={!!askJob} label={askLabel} error={askErr} where={sheetLabel(page) || `sheet ${page}`} about={askAbout}
        onAsk={(t) => ask(t)} onReview={() => ask('Check my whole bid. What is missing, what looks doubled, and what looks too low or too high?', null, true)} onClear={() => { change((d) => ({ ...d, chat: [] })); setAskAbout(null); }} onClose={() => setSheet(null)} />}
      {sheet === 'others' && active && (
        <Sheet title="Found on other sheets" onClose={() => setSheet(null)}>
          {others.length === 0 ? <p className="text-[17px] text-white/90 leading-relaxed">Nothing like it is drawn on the other sheets.</p> : (<>
            <p className="text-[16px] text-[#f0a04b] leading-snug">The same thing is often drawn on more than one sheet. Only pick sheets that show a different part of the job, or it gets counted twice.</p>
            <div className="mt-3 space-y-2">
              {others.map((o, i) => (
                <button key={o.page} type="button" role="switch" aria-checked={o.on} onClick={() => setOthers((list) => list.map((x, k) => (k === i ? { ...x, on: !x.on } : x)))}
                  className={`w-full min-h-[56px] text-left rounded-xl border px-3 py-2 flex items-center gap-3 ${o.on ? 'border-[#4ade80] bg-[#4ade80]/12' : 'border-white/20 bg-white/[0.04]'}`}>
                  <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${o.on ? 'bg-[#4ade80] border-[#4ade80] text-black' : 'border-white/50 text-transparent'}`}><Check size={18} /></span>
                  <span className="flex-1 min-w-0"><span className="block text-[17px] font-bold leading-snug break-words">{sheetLabel(o.page) || `Sheet ${o.page}`}</span><span className="block text-[15px] text-white/80">{o.pts.length} found</span></span>
                </button>
              ))}
            </div>
            <button disabled={!others.some((o) => o.on)} onClick={() => { for (const o of others) if (o.on) addCountPoints(active.id, o.page, o.pts); setSheet(null); setFoundNote('Added. Open those sheets to check the marks.'); }} className="mt-4 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold disabled:opacity-40">Add {others.filter((o) => o.on).reduce((n, o) => n + o.pts.length, 0)} from the sheets I picked</button>
          </>)}
        </Sheet>
      )}
      {sheet === 'bid' && <BidSheet takeoffId={id} planName={name} data={data} onChange={(p) => change((d) => ({ ...d, pricing: p }))} onClose={() => setSheet(null)} />}
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

/** A conversation with the AI about this bid. It looks at the sheet he is on, and says how sure it is. */
function AskSheet({ chat, busy, label, error, where, about, onAsk, onReview, onClear, onClose }: { onReview: () => void; chat: { role: 'user' | 'assistant'; content: string }[]; busy: boolean; label: string; error: string; where: string; about: { name: string; note: string } | null; onAsk: (t: string) => void; onClear: () => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [chat.length, busy]);
  const send = () => { const t = text.trim(); if (!t || busy) return; setText(''); onAsk(t); };
  const ideas = ['What should I double-check on this sheet?', 'What on this sheet is missing from my list?', 'How sure are you about what you measured here?', 'Is anything here supplied by the owner?'];
  return (
    <Sheet title="Ask the AI" onClose={onClose}>
      <p className="text-[15px] text-white/80 leading-snug">It looks at <b className="text-white">{where}</b> and at your list before it answers{about ? <>, and knows you are asking about <b className="text-white">{about.name}</b></> : null}. It takes about 30 seconds. It can be wrong: treat what it says as a second opinion.</p>
      <div className="mt-3 space-y-2.5">
        {!busy && <button onClick={onReview} className="w-full min-h-[56px] text-left rounded-xl border border-[#4ade80]/70 bg-[#4ade80]/12 px-3 py-2"><span className="block text-[17px] font-bold leading-snug">Check my whole bid</span><span className="block text-[15px] text-white/85 leading-snug">It goes through your list against everything it read off the plans: what is missing, doubled, or looks off. About a minute.</span></button>}
        {chat.length === 0 && !busy && (
          <div className="space-y-2">
            {ideas.map((q) => <button key={q} onClick={() => onAsk(q)} className="w-full min-h-[52px] text-left rounded-xl border border-[#7dd3fc]/50 bg-[#7dd3fc]/10 px-3 py-2 text-[17px] font-semibold leading-snug">{q}</button>)}
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className={`rounded-2xl px-3.5 py-2.5 ${m.role === 'user' ? 'ml-8 bg-[#C9A84C]/20 border border-[#C9A84C]/50' : 'mr-4 bg-white/[0.06] border border-white/15'}`}>
            <p className="text-[13px] font-bold uppercase tracking-wide text-white/60 mb-0.5">{m.role === 'user' ? 'You' : 'The AI'}</p>
            <p className="text-[17px] leading-relaxed whitespace-pre-line break-words">{m.content}</p>
          </div>
        ))}
        {busy && <p className="text-[16px] text-[#7dd3fc] flex items-center gap-2 px-1"><Loader2 size={20} className="animate-spin shrink-0" /> {label || 'Looking at the sheet…'}</p>}
        {error && <p className="text-[16px] text-red-200 px-1">{error}</p>}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-1 mt-3 bg-[#141414]">
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type your question" className="flex-1 min-w-0 min-h-[54px] px-4 rounded-xl bg-white/5 border border-white/25 text-[18px] text-white placeholder:text-white/40 focus:outline-none focus:border-[#7dd3fc]" />
          <button onClick={send} disabled={busy || !text.trim()} className="min-h-[54px] px-5 rounded-xl bg-[#7dd3fc] text-black text-[17px] font-bold disabled:opacity-40">Ask</button>
        </div>
        {chat.length > 0 && !busy && <button onClick={onClear} className="mt-2 w-full min-h-[44px] rounded-lg text-[15px] text-white/70 font-semibold">Start a new conversation</button>}
      </div>
    </Sheet>
  );
}

/** A short guide in plain words, for someone who has never measured a plan on a screen. */
function HelpSheet({ onClose }: { onClose: () => void }) {
  const steps: [string, string][] = [
    ['Set the scale', 'A plan is a small drawing of a big thing. Tap the orange "Set this sheet’s scale" button. If the app shows a green scale, tap "Use this". Do it once on each sheet you measure.'],
    ['Add what you want to measure', 'Tap "Add something to measure" and give it a name, like "Sidewalk". Pick how it is measured: a length, an area, or a count.'],
    ['Tap it out on the sheet', 'Drag with one finger to move the sheet. Pinch with two fingers to zoom in. A quick tap puts down a point. Zoom in before you tap: it is more exact. Tap "Finish this one" when you have gone all the way around.'],
    ['Let the app do more of it', '"Tap a whole line" takes a whole line in one tap. "Box one, find the rest": tap two corners of a box around one symbol and every matching one is counted. "Count a tag" counts every place a tag like A or P-1 is printed.'],
    ['Made a mistake?', '"Undo" takes back the last tap. "Remove one" takes away a measurement you tap. "Move a corner" lets you fix one corner.'],
    ['Let the AI help', 'The purple button has the AI read every sheet and draft the list of things to price. On an item, "Let the AI try it" has the AI mark it for you and then check its own marks. Always look at what it marked before you keep it. "Ask the AI" lets you ask it anything about the sheet, and it tells you how sure it is.'],
    ['Price it and send it', 'Type your price on each item. Tap the "Cost → Bid" bar to add overhead and profit. Then "Send to an estimate".'],
  ];
  return (
    <Sheet title="How this works" onClose={onClose}>
      <p className="text-[17px] text-white/90 leading-relaxed">You measure right on the plans, and the app adds it up into a bid. Nothing here can break anything, and every change is saved by itself.</p>
      <ol className="mt-3 space-y-2.5">
        {steps.map(([t, d], i) => (
          <li key={i} className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 flex gap-3">
            <span className="w-9 h-9 rounded-full bg-[#C9A84C] text-black text-[18px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="flex-1 min-w-0"><span className="block text-[18px] font-bold leading-snug">{t}</span><span className="block text-[16px] text-white/85 leading-relaxed mt-0.5">{d}</span></span>
          </li>
        ))}
      </ol>
      <p className="text-[15px] text-white/75 leading-snug mt-3">You can open this again any time with the Help button on the sheet.</p>
      <button onClick={onClose} className="mt-3 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Got it</button>
    </Sheet>
  );
}

/** The AI reader's place in the list: start it, watch it, or open what it read on this sheet. */
function AiCard({ ai, busy, canRead, pages, sheet, note, onStart, onOpen }: { ai: AiRead | null; busy: boolean; canRead: boolean; pages: number; sheet: AiSheet | null; note: string; onStart: () => void; onOpen: () => void }) {
  const stopped = ai?.status === 'error' || ((ai?.status === 'queued' || ai?.status === 'working') && !busy);
  if (busy) {
    const pct = ai?.total ? Math.round(((ai.done || 0) / ai.total) * 100) : 0;
    return (
      <div className="rounded-xl border border-[#a78bfa]/60 bg-[#a78bfa]/10 px-3 py-3">
        <p className="text-[17px] font-bold leading-snug flex items-center gap-2"><Loader2 size={20} className="animate-spin text-[#c4b5fd] shrink-0" /> The AI is reading the plans</p>
        <p className="text-[15px] text-white/85 leading-snug mt-0.5">{ai?.total ? `Sheet ${Math.min((ai.done || 0) + 1, ai.total)} of ${ai.total}. You can keep measuring while it works.` : 'Getting the plans ready…'}</p>
        <div className="mt-2 h-2.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full bg-[#a78bfa]" style={{ width: `${pct}%` }} /></div>
      </div>
    );
  }
  if (ai?.status === 'done' || (!stopped && ai?.sheets && Object.keys(ai.sheets).length)) {
    if (!sheet) return null;
    const bits = [sheet.schedules.length ? `${sheet.schedules.length} table${sheet.schedules.length === 1 ? '' : 's'}` : '', sheet.quantities.length ? `${sheet.quantities.length} quantit${sheet.quantities.length === 1 ? 'y' : 'ies'}` : '', sheet.legend.length ? `${sheet.legend.length} symbols` : '', sheet.notes.length ? `${sheet.notes.length} notes` : ''].filter(Boolean);
    return (
      <button onClick={onOpen} className="w-full text-left rounded-xl border border-[#a78bfa]/60 bg-[#a78bfa]/10 px-3 py-2.5 flex items-center gap-3">
        <Sparkles size={22} className="text-[#c4b5fd] shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-bold leading-snug">What the AI read on this sheet</span>
          <span className="block text-[15px] text-white/85 leading-snug">{bits.join(' · ') || 'Nothing to price is printed on this sheet'}</span>
        </span>
        <ChevronDown size={22} className="-rotate-90 text-white/70 shrink-0" />
      </button>
    );
  }
  if (!canRead) return null;
  return (
    <div>
      <button onClick={onStart} className="w-full text-left rounded-xl border border-[#a78bfa]/60 bg-[#a78bfa]/10 px-3 py-2.5 flex items-center gap-3">
        <Sparkles size={22} className="text-[#c4b5fd] shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-bold leading-snug">{stopped ? 'Try the AI read again' : 'Have the AI read these plans'}</span>
          <span className="block text-[15px] text-white/85 leading-snug">{stopped ? (ai?.error || 'It stopped before finishing.') : `Sheet names, scales, schedules and notes. About ${Math.max(1, Math.ceil((pages * 16) / 120))} min.`}</span>
        </span>
      </button>
      {note && <p className="text-[15px] text-red-200 mt-1.5 px-1">{note}</p>}
    </div>
  );
}

/** The AI's draft list of everything to price: start it, watch it, open it. */
function DraftCard({ draft, busy, canRead, taken, onStart, onOpen }: { draft: AiDraft | null; busy: boolean; canRead: boolean; taken: boolean; onStart: () => void; onOpen: () => void }) {
  if (busy) {
    return (
      <div className="rounded-xl border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-3">
        <p className="text-[17px] font-bold leading-snug flex items-center gap-2"><Loader2 size={20} className="animate-spin text-[#8fe3a8] shrink-0" /> Drafting the list of things to price</p>
        <p className="text-[15px] text-white/85 leading-snug mt-0.5">The AI is going through everything it read. About a minute.</p>
      </div>
    );
  }
  if (draft?.status === 'done' && draft.items?.length) {
    const withQty = draft.items.filter((i) => i.quantity).length;
    return (
      <button onClick={onOpen} className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center gap-3 ${taken ? 'border-white/20 bg-white/[0.04]' : 'border-[#4ade80]/70 bg-[#4ade80]/12'}`}>
        <List size={22} className="text-[#8fe3a8] shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-bold leading-snug">{taken ? 'Open the AI’s list again' : `The AI drafted ${draft.items.length} things to price`}</span>
          <span className="block text-[15px] text-white/85 leading-snug">{withQty} with a quantity from the plans · {draft.items.length - withQty} to measure</span>
        </span>
        <ChevronDown size={22} className="-rotate-90 text-white/70 shrink-0" />
      </button>
    );
  }
  if (!canRead) return null;
  return (
    <button onClick={onStart} className="w-full text-left rounded-xl border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-2.5 flex items-center gap-3">
      <List size={22} className="text-[#8fe3a8] shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] font-bold leading-snug">{draft?.status === 'error' || draft ? 'Try drafting the list again' : 'Have the AI draft the list of things to price'}</span>
        <span className="block text-[15px] text-white/85 leading-snug">{draft?.error || 'Everything in the plans, by trade, with a quantity or where to measure it.'}</span>
      </span>
    </button>
  );
}

/** Review the draft: pick what to bring in. Quantities are only ones the plans state; the rest say where to measure. */
function DraftSheet({ draft, have, onAdd, onClose }: { draft: AiDraft; have: string[]; onAdd: (items: DraftItem[]) => void; onClose: () => void }) {
  const items = draft.items || [];
  const [on, setOn] = useState<boolean[]>(() => items.map((i) => !have.includes(i.name.toLowerCase())));
  const [showWatch, setShowWatch] = useState(false);
  const groups = useMemo(() => { const m = new Map<string, number[]>(); items.forEach((it, i) => { m.set(it.group, [...(m.get(it.group) || []), i]); }); return Array.from(m.entries()); }, [items]);
  const count = on.filter(Boolean).length;
  return (
    <Sheet title="The AI’s list of things to price" onClose={onClose}>
      {draft.summary && <p className="text-[17px] text-white/90 leading-relaxed">{draft.summary}</p>}
      <p className="text-[15px] text-[#f0a04b] leading-snug mt-1.5">Drafted by the AI from what the plans print. Check it against the sheets: it can miss things. It never guesses a quantity.</p>
      {(draft.watch_outs || []).length > 0 && (
        <div className="mt-3 rounded-xl border border-[#f0a04b]/60 bg-[#f0a04b]/10">
          <button onClick={() => setShowWatch((v) => !v)} className="w-full min-h-[48px] px-3 text-left flex items-center gap-2"><AlertTriangle size={20} className="text-[#f0a04b] shrink-0" /><span className="flex-1 text-[16px] font-bold">{draft.watch_outs!.length === 1 ? "1 thing" : `${draft.watch_outs!.length} things`} to watch out for</span>{showWatch ? <ChevronUp size={22} /> : <ChevronDown size={22} />}</button>
          {showWatch && <ul className="px-3 pb-3 space-y-1.5">{draft.watch_outs!.map((w, i) => <li key={i} className="text-[16px] text-white/90 leading-snug">• {w}</li>)}</ul>}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={() => setOn(items.map(() => true))} className="flex-1 min-h-[44px] rounded-lg border border-white/25 text-[15px] font-semibold">Pick all</button>
        <button onClick={() => setOn(items.map(() => false))} className="flex-1 min-h-[44px] rounded-lg border border-white/25 text-[15px] font-semibold">Pick none</button>
      </div>
      {groups.map(([name, idx]) => (
        <div key={name}>
          <p className="text-[14px] font-bold uppercase tracking-wide text-[#E5C76B] mt-4 mb-1.5">{name} ({idx.length})</p>
          <div className="space-y-1.5">
            {idx.map((i) => { const it = items[i]; const dup = have.includes(it.name.toLowerCase()); return (
              <button key={i} type="button" role="switch" aria-checked={!!on[i]} onClick={() => setOn((v) => v.map((x, k) => (k === i ? !x : x)))}
                className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-start gap-3 ${on[i] ? 'border-[#C9A84C]/60 bg-[#C9A84C]/10' : 'border-white/15 bg-white/[0.03]'}`}>
                <span className={`shrink-0 mt-0.5 w-7 h-7 rounded-md border-2 flex items-center justify-center ${on[i] ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/40 text-transparent'}`}><Check size={18} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[17px] font-semibold leading-snug break-words">{it.name}</span>
                  {it.quantity
                    ? <span className="block text-[15px] font-semibold text-[#8fe3a8] leading-snug">{it.quantity.toLocaleString('en-US')} {it.unit} · {it.source === 'table' ? `from a table on ${it.sheet || 'the plans'}` : it.source === 'lump' ? 'one lump' : `printed on ${it.sheet || 'the plans'}`}</span>
                    : <span className="block text-[15px] text-[#f0a04b] leading-snug">Measure{it.sheet ? ` on ${it.sheet}` : ''}: {it.measure || 'not stated on the plans'}</span>}
                  {(it as any).alt && <span className="block text-[14px] font-semibold text-[#c4b5fd] leading-snug">Alternate: kept out of the base bid</span>}
                  {it.note && <span className="block text-[14px] text-white/70 leading-snug">{it.note}</span>}
                  {dup && <span className="block text-[14px] text-white/60 leading-snug">Already on your list</span>}
                </span>
              </button>
            ); })}
          </div>
        </div>
      ))}
      <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-1 mt-4 bg-[#141414]">
        <button disabled={!count} onClick={() => onAdd(items.filter((_, i) => on[i]))} className="w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold disabled:opacity-40">Add {count} to my list</button>
      </div>
    </Sheet>
  );
}

/** Everything the AI read on one sheet, each thing with a way to use it. */
function AiSheetView({ s, page, onScale, onAdd, onClose }: { s: AiSheet; page: number; onScale: (feetPerInch: number, label: string) => void; onAdd: (name: string, qty: number, unit: string, note: string, hint?: string) => void; onClose: () => void }) {
  const [open, setOpen] = useState(-1);
  const [added, setAdded] = useState<string[]>([]);
  const [scaled, setScaled] = useState('');
  const where = [s.number, s.title].filter(Boolean).join(' ') || `Sheet ${page}`;
  const add = (key: string, name: string, qty: number, unit: string, note: string) => { onAdd(name, qty, unit, note); setAdded((a) => [...a, key]); };
  const head = 'text-[15px] font-bold uppercase tracking-wide text-[#c4b5fd] mt-5 mb-2';
  return (
    <Sheet title={where} onClose={onClose}>
      <p className="text-[15px] text-[#f0a04b] leading-snug">Read by the AI. Check anything you use against the sheet itself.</p>
      {s.scanned && <p className="text-[15px] text-white/80 leading-snug mt-1">This sheet is a scanned picture, so it was read from the image only.</p>}

      {s.scales.length > 0 && (<>
        <p className={head}>Scales</p>
        <div className="space-y-2">
          {s.scales.map((q, i) => { const p = findPrintedScales([q.scale])[0]; return (
            <div key={i} className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 flex items-center gap-3">
              <span className="flex-1 min-w-0"><span className="block text-[17px] font-bold leading-snug">{q.scale}</span>{q.applies_to && <span className="block text-[15px] text-white/75 leading-snug">{q.applies_to}</span>}</span>
              {p && <button onClick={() => { onScale(p.feetPerInch, p.label); setScaled(q.scale); }} className={`min-h-[48px] px-3 rounded-lg text-[16px] font-bold shrink-0 ${scaled === q.scale ? 'bg-[#4ade80] text-black' : 'bg-[#C9A84C] text-black'}`}>{scaled === q.scale ? 'Set' : 'Use it'}</button>}
            </div>
          ); })}
        </div>
      </>)}

      {s.quantities.length > 0 && (<>
        <p className={head}>Quantities printed on the sheet</p>
        <div className="space-y-2">
          {s.quantities.map((q, i) => (
            <div key={i} className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 flex items-center gap-3">
              <span className="flex-1 min-w-0"><span className="block text-[17px] font-bold leading-snug break-words">{q.quantity.toLocaleString('en-US')} {q.unit} · {q.item}</span>{q.printed && <span className="block text-[14px] text-white/70 leading-snug break-words">Printed: “{q.printed}”</span>}</span>
              <button disabled={added.includes('q' + i)} onClick={() => add('q' + i, q.item, q.quantity, q.unit, where)} className="min-h-[48px] px-3 rounded-lg bg-[#C9A84C] text-black text-[16px] font-bold shrink-0 disabled:bg-[#4ade80]">{added.includes('q' + i) ? 'Added' : 'Add'}</button>
            </div>
          ))}
        </div>
      </>)}

      {s.schedules.length > 0 && (<>
        <p className={head}>Tables on the sheet</p>
        <p className="text-[15px] text-white/80 leading-snug mb-2">A table lists the kinds of a thing, not how many there are. Adding it puts each kind on your list to be counted on the drawing.</p>
        <div className="space-y-2">
          {s.schedules.map((t, i) => (
            <div key={i} className="rounded-xl border border-white/15 bg-white/[0.04]">
              <div className="px-3 py-2.5 flex items-center gap-3">
                <button onClick={() => setOpen(open === i ? -1 : i)} className="flex-1 min-w-0 text-left min-h-[44px]">
                  <span className="block text-[17px] font-bold leading-snug break-words">{t.name}</span>
                  <span className="block text-[15px] text-white/75 leading-snug">{t.rows.length} row{t.rows.length === 1 ? '' : 's'} · tap to {open === i ? 'hide' : 'see'}</span>
                </button>
                <button disabled={added.includes('t' + i) || !t.rows.length} onClick={() => {
                  // A table lists KINDS, not how many. Each kind goes on the list to be counted on the drawing, unless the table has its own quantity column.
                  const qi = t.columns.findIndex((c) => /^(qty\.?|quantity|count|no\.?|number|total)$/i.test(c.trim()));
                  const base = t.name.replace(/\s*schedule\b/i, '').trim() || t.name;
                  t.rows.forEach((rw) => { const q = qi >= 0 ? Number(String(rw[qi] || '').replace(/[^0-9.]/g, '')) : 0; const tag = String(rw[0] || '').trim();
                    onAdd(`${base} ${tag}`.trim() + (rw[1] && rw[1] !== tag && rw[1].length < 44 ? `, ${rw[1]}` : ''), q > 0 ? q : 0, 'EA', `${where}, ${t.name}`, tag ? `Count every one marked ${tag} on the drawings` : 'Count them on the drawings'); });
                  setAdded((a) => [...a, 't' + i]);
                }} className="min-h-[48px] px-3 rounded-lg border border-[#C9A84C] text-[#E5C76B] text-[15px] font-bold shrink-0 disabled:opacity-50 max-w-[46%] leading-tight">{added.includes('t' + i) ? 'Added' : `Add its ${t.rows.length} kind${t.rows.length === 1 ? '' : 's'} to count`}</button>
              </div>
              {open === i && (
                <div className="overflow-x-auto border-t border-white/10">
                  <table className="text-[14px] min-w-full">
                    {t.columns.length > 0 && <thead><tr>{t.columns.map((c, k) => <th key={k} className="text-left font-bold px-2.5 py-2 whitespace-nowrap bg-white/5">{c}</th>)}</tr></thead>}
                    <tbody>{t.rows.map((r, k) => <tr key={k} className="border-t border-white/10">{r.map((c, m) => <td key={m} className="px-2.5 py-2 align-top min-w-[90px]">{c}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </>)}

      {s.notes.length > 0 && (<>
        <p className={head}>Notes that can change the price</p>
        <ul className="space-y-1.5">{s.notes.map((n, i) => <li key={i} className="text-[16px] text-white/90 leading-snug rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">{n}</li>)}</ul>
      </>)}

      {s.legend.length > 0 && (<>
        <p className={head}>Symbols ({s.legend.length})</p>
        <ul className="space-y-1">{s.legend.slice(0, 40).map((l, i) => <li key={i} className="text-[15px] text-white/85 leading-snug"><b className="text-white">{l.symbol || 'Symbol'}</b>: {l.meaning}</li>)}</ul>
      </>)}
      {!s.scales.length && !s.quantities.length && !s.schedules.length && !s.notes.length && !s.legend.length && <p className="text-[17px] text-white/85 mt-3">Nothing to price is printed on this sheet.</p>}
    </Sheet>
  );
}

function ScaleSheet({ pts, current, pages, found, bar, onSet, onMeasure, onClose }: {
  pts: Pt[]; current: number; pages: number; found: { label: string; feetPerInch: number; times: number }[]; bar?: boolean;
  onSet: (ftPerPt: number, note: string, all: boolean) => void; onMeasure: () => void; onClose: () => void;
}) {
  const [feet, setFeet] = useState('');
  const [all, setAll] = useState(false);
  const [err, setErr] = useState('');
  const [more, setMore] = useState(false);
  const known = () => {
    const f = parseFeet(feet);
    const v = f && pts.length === 2 ? scaleFromKnown(pts[0], pts[1], f) : null;
    if (!v) { setErr('Type the length in feet, like 40 or 40 6 for 40 feet 6 inches.'); return; }
    onSet(v, `Set from a ${feet.trim()} ft line you tapped`, all);
  };
  const allBox = pages > 1 && (
    <button type="button" role="switch" aria-checked={all} onClick={() => setAll((a) => !a)} className="mt-4 w-full min-h-[52px] rounded-xl border border-white/20 px-3 flex items-center gap-3 text-left">
      <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${all ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/50 text-transparent'}`}><Check size={18} /></span>
      <span className="text-[16px] leading-snug">Also use it on the other sheets that have no scale yet</span>
    </button>
  );

  // He has tapped the two ends of a line: all that is left is how long it really is.
  if (pts.length === 2) {
    return (
      <Sheet title="How long is that line?" onClose={onClose}>
        <label className={labelCls}>The real length of the line you tapped, in feet</label>
        <input autoFocus inputMode="decimal" value={feet} onChange={(e) => { setFeet(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && known()} placeholder="Like 40, or 40 6 for 40 feet 6 inches" className={inputCls} />
        {err && <p className="text-[16px] text-red-200 mt-2">{err}</p>}
        {allBox}
        <button onClick={known} className="mt-3 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Set the scale</button>
      </Sheet>
    );
  }

  const printed = (label: string, fpi: number) => onSet(scaleFromPrinted(fpi)!, `Printed scale ${label}. Check it against a dimension.`, all);
  return (
    <Sheet title="Set this sheet’s scale" onClose={onClose}>
      <p className="text-[17px] text-white/90 leading-relaxed">The scale tells the app how big things on this sheet really are. Pick one of these ways.</p>

      {found.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#4ade80]/60 bg-[#4ade80]/10 p-3">
          <p className="text-[17px] font-bold leading-snug">{found.length === 1 ? 'This sheet says its scale is' : 'This sheet prints these scales'}</p>
          <div className="mt-2 space-y-2">
            {found.map((s) => (
              <button key={s.label} onClick={() => printed(s.label, s.feetPerInch)} className="w-full min-h-[58px] rounded-xl bg-[#4ade80] text-black text-[20px] font-extrabold px-4 flex items-center justify-between gap-3">
                <span>{s.label}</span><span className="text-[16px] font-bold">Use this</span>
              </button>
            ))}
          </div>
          {found.length > 1 && <p className="text-[15px] text-white/80 leading-snug mt-2">Use the one written under the drawing you are measuring.</p>}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/20 bg-white/[0.04] p-3">
        <p className="text-[17px] font-bold leading-snug">{found.length ? 'Or measure a line you know' : '1. Measure a line you know (most exact)'}</p>
        <p className="text-[16px] text-white/85 leading-snug mt-1">Find a dimension printed on the sheet, like a wall marked 40 feet. Tap one end of it, tap the other end, then type 40.</p>
        {bar && <p className="text-[16px] font-semibold text-[#8fe3a8] leading-snug mt-1.5">This sheet has a scale bar instead of a written scale. Tap the two ends of the bar, then type the number printed at its far end.</p>}
        <button onClick={onMeasure} className="mt-2.5 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2"><Ruler size={22} /> Tap the two ends on the sheet</button>
      </div>

      <div className="mt-4 rounded-xl border border-white/20 bg-white/[0.04] p-3">
        <button onClick={() => setMore((m) => !m)} className="w-full min-h-[48px] text-left flex items-center gap-2">
          <span className="flex-1 text-[17px] font-bold leading-snug">{found.length ? 'Or pick a scale from the list' : '2. Pick the scale written on the sheet'}</span>
          {more ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
        {(more || !found.length) && (<>
          <p className="text-[16px] text-white/85 leading-snug mb-2">It is usually written under the drawing’s title or in the corner box, like SCALE: 1" = 20'.</p>
          <div className="grid grid-cols-3 gap-2">
            {PRINTED_SCALES.map((p) => (
              <button key={p.label} onClick={() => printed(p.label, p.feetPerInch)}
                className={`min-h-[52px] rounded-lg border text-[17px] font-semibold ${current && Math.abs(current * 72 - p.feetPerInch) < 0.01 ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>{p.label}</button>
            ))}
          </div>
        </>)}
      </div>
      {allBox}
      <p className="text-[15px] text-[#f0a04b] mt-3 leading-snug">A printed scale is only right if the PDF is at full size. After setting it, measure one dimension you know to check.</p>
    </Sheet>
  );
}

function ItemSheet({ item, colorIndex, onSave, onDelete, onClose }: { item: TakeoffItem | null; colorIndex: number; onSave: (it: TakeoffItem) => void; onDelete?: () => void; onClose: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [kind, setKind] = useState<TakeoffKind>(item?.kind || 'length');
  const [unit, setUnit] = useState<TakeoffUnit>(item?.unit || 'LF');
  const [price, setPrice] = useState(item?.unitCost ? String(item.unitCost) : '');
  const [depth, setDepth] = useState(item?.depthIn ? String(item.depthIn) : '');
  const [height, setHeight] = useState(item?.heightFt ? String(item.heightFt) : '');
  const [width, setWidth] = useState(item?.widthFt ? String(item.widthFt) : '');
  const [alt, setAlt] = useState(!!item?.alt);
  const [times, setTimes] = useState(item?.times && item.times !== 1 ? String(item.times) : '');
  const [pitch, setPitch] = useState(item?.pitch ? String(item.pitch) : '');
  const [parts, setParts] = useState<{ id: string; name: string; unit: string; per: string; unitCost: string; basis?: 'qty' | 'edge' }[]>(() => (item?.parts || []).map((p) => ({ id: p.id, name: p.name, unit: p.unit, per: String(p.per), unitCost: p.unitCost ? String(p.unitCost) : '', basis: p.basis })));
  const [saved, setSaved] = useState<any[]>([]);
  const tid = typeof window !== 'undefined' ? location.pathname.split('/').pop() : '';
  useEffect(() => { fetch('/api/admin/takeoffs/' + tid, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assemblies' }) }).then((r) => r.json()).then((d) => setSaved(Array.isArray(d.list) ? d.list : [])).catch(() => null); }, [tid]);
  const setPart = (id: string, k: 'name' | 'unit' | 'per' | 'unitCost', v: string) => setParts((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  const [waste, setWaste] = useState(item?.wastePct ? String(item.wastePct) : '');
  const [typed, setTyped] = useState(item?.printedQty ? String(item.printedQty) : '');
  const [color, setColor] = useState(item?.color || TAKEOFF_COLORS[colorIndex % TAKEOFF_COLORS.length]);
  const [err, setErr] = useState('');
  const [sure, setSure] = useState(false);
  const setK = (k: TakeoffKind) => { setKind(k); setUnit(UNITS_FOR[k][0]); };
  const save = () => {
    if (!name.trim()) { setErr('Give it a name, like 8 inch water main.'); return; }
    if (unit === 'CY' && !(Number(depth) > 0)) { setErr(kind === 'length' ? 'Volume needs the depth in inches.' : 'Cubic yards needs the thickness in inches.'); return; }
    if (kind === 'length' && unit === 'SF' && !(Number(height) > 0)) { setErr('Wall area needs the height in feet.'); return; }
    if (kind === 'length' && unit === 'CY' && !(Number(width) > 0)) { setErr('Volume needs the width in feet.'); return; }
    const cleanParts: ItemPart[] = parts.filter((p) => p.name.trim() && Number(p.per) > 0).map((p) => ({ id: p.id, name: p.name.trim().slice(0, 80), unit: p.unit.trim().slice(0, 8) || 'EA', per: Number(p.per), unitCost: Math.max(0, Number(p.unitCost) || 0), basis: kind === 'area' && p.basis === 'edge' ? 'edge' : undefined }));
    if (cleanParts.length) fetch('/api/admin/takeoffs/' + tid, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assembly_save', assembly: { name: name.trim(), kind, unit, heightFt: Number(height) || undefined, widthFt: Number(width) || undefined, depthIn: Number(depth) || undefined, unitCost: Number(price) || 0, parts: cleanParts } }) }).catch(() => null);
    if (Number(price) > 0) fetch('/api/admin/takeoffs/' + (typeof window !== 'undefined' ? location.pathname.split('/').pop() : ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remember_price', name: name.trim(), unit, price: Number(price) }) }).catch(() => null);
    onSave({ id: item?.id || uid(), name: name.trim().slice(0, 120), kind, unit, color, unitCost: Math.max(0, Number(price) || 0), depthIn: unit === 'CY' ? Number(depth) : undefined, heightFt: kind === 'length' && unit === 'SF' ? Number(height) : undefined, widthFt: kind === 'length' && unit === 'CY' ? Number(width) : undefined,
      parts: cleanParts.length ? cleanParts : undefined, alt: alt || undefined, times: Number(times) > 0 && Number(times) !== 1 ? Number(times) : undefined, pitch: kind === 'area' && Number(pitch) > 0 ? Number(pitch) : undefined, wastePct: Number(waste) > 0 ? Number(waste) : undefined,
      printedQty: Number(typed) > 0 ? Number(typed) : undefined, printedNote: Number(typed) > 0 ? (Number(typed) === item?.printedQty && item?.printedNote ? item.printedNote : 'typed in by you') : undefined, shapes: item?.shapes || [] });
  };
  return (
    <Sheet title={item ? 'Name and price' : 'What are you measuring?'} onClose={onClose}>
      <label className={labelCls}>Name</label>
      <input autoFocus={!item} value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="8 inch water main, building slab, catch basins" className={inputCls} />
      <SavedPrices q={name} onPick={(c) => { setName(c.name); setPrice(String(c.default_cost)); if (!item) { const u = String(c.unit || '').toUpperCase(); const k: TakeoffKind | null = u === 'LF' ? 'length' : u === 'EA' ? 'count' : ['SF', 'SY', 'CY'].includes(u) ? 'area' : null; if (k) { setKind(k); setUnit(u as TakeoffUnit); } } }} />
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
      {saved.filter((a) => !name.trim() || a.name.toLowerCase().includes(name.trim().toLowerCase())).slice(0, 4).length > 0 && !item && (
        <div className="mt-2 space-y-1.5">
          <p className="text-[14px] font-semibold text-white/75">Your saved build-ups</p>
          {saved.filter((a) => !name.trim() || a.name.toLowerCase().includes(name.trim().toLowerCase())).slice(0, 4).map((a, i) => (
            <button key={i} type="button" onClick={() => { setName(a.name); if (a.kind) setKind(a.kind); if (a.unit) setUnit(a.unit); setHeight(a.heightFt ? String(a.heightFt) : ''); setWidth(a.widthFt ? String(a.widthFt) : ''); setDepth(a.depthIn ? String(a.depthIn) : ''); setPrice(a.unitCost ? String(a.unitCost) : ''); setParts((a.parts || []).map((p: any) => ({ id: uid(), name: p.name, unit: p.unit, per: String(p.per), unitCost: p.unitCost ? String(p.unitCost) : '' }))); }}
              className="w-full min-h-[48px] text-left rounded-lg border border-[#a78bfa]/50 bg-[#a78bfa]/10 px-3 py-1.5">
              <span className="block text-[16px] font-semibold leading-snug break-words">{a.name}</span>
              <span className="block text-[14px] text-white/75 leading-snug">{(a.parts || []).map((p: any) => p.name).join(', ')}</span>
            </button>
          ))}
        </div>
      )}
      {kind === 'length' && (<>
        <label className={`${labelCls} mt-3`}>Priced by</label>
        <div className="grid grid-cols-1 gap-2">
          {([['LF', 'Feet of length', 'pipe, curb, fence'], ['SF', 'Wall area: length × height', 'block wall, siding, paint'], ['CY', 'Volume: length × width × depth', 'trench, footing']] as [TakeoffUnit, string, string][]).map(([u, label, eg]) => (
            <button key={u} onClick={() => setUnit(u)} className={`min-h-[52px] rounded-lg border px-3 text-left ${unit === u ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}><span className="block text-[17px] font-bold leading-tight">{label}</span><span className="block text-[14px] text-white/70">{eg}</span></button>
          ))}
        </div>
        {unit === 'SF' && (<><label className={`${labelCls} mt-3`}>Height, in feet</label><input inputMode="decimal" value={height} onChange={(e) => { setHeight(e.target.value); setErr(''); }} placeholder="10" className={inputCls} /></>)}
        {unit === 'CY' && (<div className="grid grid-cols-2 gap-2 mt-3"><div><label className={labelCls}>Width, in feet</label><input inputMode="decimal" value={width} onChange={(e) => { setWidth(e.target.value); setErr(''); }} placeholder="2" className={inputCls} /></div><div><label className={labelCls}>Depth, in inches</label><input inputMode="decimal" value={depth} onChange={(e) => { setDepth(e.target.value); setErr(''); }} placeholder="12" className={inputCls} /></div></div>)}
      </>)}
      {kind === 'area' && (<>
        <label className={`${labelCls} mt-3`}>Unit</label>
        <div className="grid grid-cols-3 gap-2">
          {UNITS_FOR.area.map((u) => <button key={u} onClick={() => setUnit(u)} className={`min-h-[48px] rounded-lg border text-[17px] font-bold ${unit === u ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>{u === 'SF' ? 'Square feet' : u === 'SY' ? 'Square yards' : 'Cubic yards'}</button>)}
        </div>
        {unit === 'CY' && (<><label className={`${labelCls} mt-3`}>Thickness, in inches</label><input inputMode="decimal" value={depth} onChange={(e) => { setDepth(e.target.value); setErr(''); }} placeholder="6" className={inputCls} /></>)}
      </>)}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div><label className={labelCls}>{parts.length ? `Labor or own price per ${unit}` : `Your price per ${unit}`}</label><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Can add later" className={inputCls} /></div>
        <div><label className={labelCls}>Extra for waste, %</label><input inputMode="decimal" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="0" className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div><label className={labelCls}>Built how many times?</label><input inputMode="decimal" value={times} onChange={(e) => setTimes(e.target.value)} placeholder="1" className={inputCls} /></div>
        {kind === 'area' && <div><label className={labelCls}>Roof slope: rise in 12</label><input inputMode="decimal" value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Flat" className={inputCls} /></div>}
      </div>
      <p className="text-[14px] text-white/70 leading-snug mt-1">Two identical buildings? Measure one and put 2.{kind === 'area' ? ' For a sloped roof measured from above, put the slope (like 4 for a 4 in 12 roof) and the app adds the extra area.' : ''}</p>
      <label className={`${labelCls} mt-3`}>Already know the quantity? Type it ({unit})</label>
      <input inputMode="decimal" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Leave empty to measure it" className={inputCls} />
      <p className="text-[14px] text-white/70 leading-snug mt-1">Used until you measure it. Once measured, the two are compared.</p>
      <label className={`${labelCls} mt-4`}>Also price with it (a build-up)</label>
      <p className="text-[15px] text-white/75 leading-snug -mt-1 mb-2">Other things that come with every {unit} you measure, like block, grout and rebar for a wall. They follow the measurement by themselves.</p>
      <div className="space-y-2">
        {parts.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/20 bg-white/[0.04] p-2.5">
            <div className="flex gap-2">
              <input value={p.name} onChange={(e) => setPart(p.id, 'name', e.target.value)} placeholder="What, like 8 inch block" className="flex-1 min-w-0 min-h-[48px] px-3 rounded-lg bg-white/5 border border-white/20 text-[17px] focus:outline-none focus:border-[#C9A84C]" />
              <button onClick={() => setParts((ps) => ps.filter((x) => x.id !== p.id))} aria-label="Remove this part" className="w-12 min-h-[48px] rounded-lg border border-white/20 flex items-center justify-center"><X size={20} /></button>
            </div>
            {kind === 'area' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button type="button" onClick={() => setParts((ps) => ps.map((x) => (x.id === p.id ? { ...x, basis: undefined } : x)))} className={`min-h-[44px] rounded-lg border text-[15px] font-semibold ${p.basis !== 'edge' ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>Goes with the area</button>
                <button type="button" onClick={() => setParts((ps) => ps.map((x) => (x.id === p.id ? { ...x, basis: 'edge' } : x)))} className={`min-h-[44px] rounded-lg border text-[15px] font-semibold ${p.basis === 'edge' ? 'border-[#C9A84C] bg-[#C9A84C]/15' : 'border-white/25'}`}>Goes around the edge</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <label className="text-[13px] text-white/75">{p.basis === 'edge' ? 'How many per foot of edge' : `How many per ${unit}`}<input inputMode="decimal" value={p.per} onChange={(e) => setPart(p.id, 'per', e.target.value)} placeholder="1.125" className="mt-1 w-full min-h-[48px] px-2.5 rounded-lg bg-white/5 border border-white/20 text-[17px] text-white focus:outline-none focus:border-[#C9A84C]" /></label>
              <label className="text-[13px] text-white/75">Its unit<input value={p.unit} onChange={(e) => setPart(p.id, 'unit', e.target.value)} placeholder="EA" className="mt-1 w-full min-h-[48px] px-2.5 rounded-lg bg-white/5 border border-white/20 text-[17px] text-white focus:outline-none focus:border-[#C9A84C]" /></label>
              <label className="text-[13px] text-white/75">Price each<input inputMode="decimal" value={p.unitCost} onChange={(e) => setPart(p.id, 'unitCost', e.target.value)} placeholder="0.00" className="mt-1 w-full min-h-[48px] px-2.5 rounded-lg bg-white/5 border border-white/20 text-[17px] text-white focus:outline-none focus:border-[#C9A84C]" /></label>
            </div>
          </div>
        ))}
        <button onClick={() => setParts((ps) => [...ps, { id: uid(), name: '', unit: 'EA', per: '1', unitCost: '' }])} className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-white/30 text-[16px] font-semibold flex items-center justify-center gap-2"><Plus size={20} /> Add a part</button>
      </div>
      <button type="button" role="switch" aria-checked={alt} onClick={() => setAlt((v) => !v)} className="mt-4 w-full min-h-[52px] rounded-xl border border-white/20 px-3 flex items-center gap-3 text-left">
        <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${alt ? 'bg-[#a78bfa] border-[#a78bfa] text-black' : 'border-white/50 text-transparent'}`}><Check size={18} /></span>
        <span className="text-[16px] leading-snug">This is an alternate. Price it, but keep it out of the base bid.</span>
      </button>
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

/** Starts a brand-new estimate for this bid: pick the customer (or type a new one) and the lines go straight in. */
function NewEstimateBox({ planName, busy, onMade }: { planName: string; busy: boolean; onMade: (e: Est) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [project, setProject] = useState(planName.replace(/^EXAMPLE:\s*/i, ''));
  const [found, setFound] = useState<any[]>([]);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open || q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch('/api/admin/customers?search=' + encodeURIComponent(q.trim())).catch(() => null);
      const d = r && r.ok ? await r.json().catch(() => []) : [];
      setFound(Array.isArray(d) ? d.slice(0, 6) : []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);
  const label = (c: any) => c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Customer';
  const make = async (customer: any | null) => {
    setWorking(true); setErr('');
    try {
      let c = customer;
      if (!c) {
        const r = await fetch('/api/admin/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: q.trim() }) });
        c = await r.json().catch(() => ({}));
        if (!r.ok || !c.id) throw new Error(c.error || 'Could not add that customer.');
      }
      const r = await fetch('/api/admin/estimates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: c.id, project_name: project.trim() || planName, document_mode: 'estimate' }) });
      const e = await r.json().catch(() => ({}));
      const est = e.estimate || e;
      if (!r.ok || !est.id) throw new Error(e.error || 'Could not start the estimate.');
      onMade({ id: est.id, estimate_number: est.estimate_number, project_name: est.project_name, status: 'draft', customer: c });
    } catch (x) { setErr(x instanceof Error ? x.message : 'That did not go through.'); }
    setWorking(false);
  };
  if (!open) {
    return <button onClick={() => setOpen(true)} className="mt-3 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2"><Plus size={22} /> Start a new estimate for this bid</button>;
  }
  return (
    <div className="mt-3 rounded-xl border border-[#C9A84C]/60 bg-[#C9A84C]/10 p-3">
      <label className={labelCls}>Project name</label>
      <input value={project} onChange={(e) => setProject(e.target.value)} className={inputCls} />
      <label className={`${labelCls} mt-3`}>Who is it for?</label>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type the customer or company name" className={inputCls} />
      {err && <p className="text-[16px] text-red-200 mt-2">{err}</p>}
      <div className="mt-2 space-y-2">
        {found.map((c) => (
          <button key={c.id} disabled={working || busy} onClick={() => make(c)} className="w-full min-h-[52px] text-left rounded-lg border border-white/25 bg-black/30 px-3 py-2 disabled:opacity-60">
            <span className="block text-[17px] font-bold leading-snug">{label(c)}</span>
            {(c.email || c.phone) && <span className="block text-[15px] text-white/75 leading-snug">{[c.email, c.phone].filter(Boolean).join(' · ')}</span>}
          </button>
        ))}
        {q.trim().length >= 2 && (
          <button disabled={working || busy} onClick={() => make(null)} className="w-full min-h-[52px] rounded-lg border-2 border-dashed border-white/35 text-[17px] font-semibold px-3 disabled:opacity-60 flex items-center justify-center gap-2">
            {working ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} New customer: {q.trim()}
          </button>
        )}
      </div>
    </div>
  );
}

/** Remembered prices that match what he is typing. */
function SavedPrices({ q, onPick }: { q: string; onPick: (c: { name: string; unit: string; default_cost: number }) => void }) {
  const [list, setList] = useState<{ id: string; name: string; unit: string; default_cost: number }[]>([]);
  useEffect(() => {
    const t = q.trim(); if (t.length < 3) { setList([]); return; }
    const h = setTimeout(async () => {
      const r = await fetch('/api/admin/takeoffs?prices=' + encodeURIComponent(t)).catch(() => null);
      const d = r && r.ok ? await r.json().catch(() => []) : [];
      setList((Array.isArray(d) ? d : []).filter((c: any) => Number(c.default_cost) > 0 && c.name.toLowerCase() !== t.toLowerCase()).slice(0, 4));
    }, 300);
    return () => clearTimeout(h);
  }, [q]);
  if (!list.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[14px] font-semibold text-white/75">Your saved prices</p>
      {list.map((c) => (
        <button key={c.id} type="button" onClick={() => { onPick(c); setList([]); }} className="w-full min-h-[48px] text-left rounded-lg border border-white/20 bg-white/[0.04] px-3 py-1.5 flex items-center gap-2">
          <span className="flex-1 min-w-0 text-[16px] font-semibold leading-snug break-words">{c.name}</span>
          <span className="text-[15px] text-[#E5C76B] font-bold shrink-0">{money(Number(c.default_cost))} / {c.unit}</span>
        </button>
      ))}
    </div>
  );
}

/** Cost of the work, then his overhead, profit and contingency on top, with the floor he will not bid under. */
/** The whole bid as plain text, by trade: what to send a supplier or keep for the file. */
function quantityList(name: string, data: TakeoffData): string {
  const b = bidTotals(data); const groups = new Map<string, string[]>();
  for (const it of data.items) {
    const c = itemCost(it, data.scales); if (!(c.qty > 0)) continue;
    const g = it.alt ? 'Alternates' : it.group || 'Items'; const rows = groups.get(g) || [];
    rows.push(`${it.name}: ${c.qty.toLocaleString('en-US')} ${it.unit}` + (it.unitCost > 0 ? ` x ${money(it.unitCost)} = ${money(c.main)}` : ''));
    for (const p of c.parts) rows.push(`   ${p.name}: ${p.quantity.toLocaleString('en-US')} ${p.unit}` + (p.unitCost > 0 ? ` x ${money(p.unitCost)} = ${money(p.total)}` : ''));
    groups.set(g, rows);
  }
  const out = [name, 'Quantities from the plans', ''];
  for (const [g, rows] of Array.from(groups.entries())) out.push(g.toUpperCase(), ...rows, '');
  out.push(`Cost of the work: ${money(b.cost)}`);
  if (b.overhead) out.push(`Overhead ${b.pricing.overheadPct}%: ${money(b.overhead)}`);
  if (b.profit) out.push(`Profit ${b.pricing.profitPct}%: ${money(b.profit)}`);
  if (b.contingency) out.push(`Contingency ${b.pricing.contingencyPct}%: ${money(b.contingency)}`);
  out.push(`Bid price: ${money(b.price)}`);
  for (const a of b.alternates) out.push(`Alternate, ${a.name}: add ${money(a.price)}`);
  return out.join('\n');
}

function BidSheet({ takeoffId, planName, data, onChange, onClose }: { takeoffId: string; planName: string; data: TakeoffData; onChange: (p: BidPricing) => void; onClose: () => void }) {
  const [shared, setShared] = useState('');
  const share = async () => {
    const text = quantityList(planName, data);
    try { if (navigator.share) { await navigator.share({ title: planName, text }); setShared('Shared.'); return; } } catch { /* closed the share sheet: fall through to copy */ }
    try { await navigator.clipboard.writeText(text); setShared('Copied. Paste it into a text or an email.'); } catch { setShared('This phone would not share or copy it.'); }
  };
  const b = bidTotals(data); const p = b.pricing;
  const [saved, setSaved] = useState(false);
  const set = (k: keyof BidPricing, v: string) => { setSaved(false); onChange({ ...p, [k]: Math.max(0, Number(v) || 0) }); };
  const row = (label: string, k: keyof BidPricing, amount: number | null, hint: string) => (
    <div className="flex items-center gap-3 py-2 border-t border-white/10">
      <span className="flex-1 min-w-0"><span className="block text-[17px] font-semibold leading-snug">{label}</span><span className="block text-[14px] text-white/70 leading-snug">{hint}</span></span>
      <span className="flex items-center gap-1.5 shrink-0"><input inputMode="decimal" defaultValue={p[k] ? String(p[k]) : ''} onChange={(e) => set(k, e.target.value)} placeholder="0" className="w-[84px] min-h-[52px] px-3 rounded-xl bg-white/5 border border-white/25 text-[19px] font-bold text-right focus:outline-none focus:border-[#C9A84C]" /><span className="text-[18px] font-bold">%</span></span>
      {amount !== null && <span className="w-[96px] text-right text-[16px] font-semibold text-white/85 shrink-0">{money(amount)}</span>}
    </div>
  );
  const useAlways = async () => {
    await fetch('/api/admin/takeoffs/' + takeoffId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pricing_defaults', pricing: p }) }).catch(() => null);
    setSaved(true);
  };
  return (
    <Sheet title="Price the bid" onClose={onClose}>
      <div className="flex items-center justify-between py-2"><span className="text-[17px] font-semibold">Cost of the work</span><span className="text-[19px] font-bold">{money(b.cost)}</span></div>
      {b.unpriced > 0 && <p className="text-[15px] text-[#f0a04b] leading-snug -mt-1 mb-1">{b.unpriced} item{b.unpriced === 1 ? ' has' : 's have'} no price yet, so the cost is too low.</p>}
      {row('Overhead', 'overheadPct', b.overhead, 'Office, trucks, insurance')}
      {row('Profit', 'profitPct', b.profit, 'What you keep')}
      {row('Contingency', 'contingencyPct', b.contingency, 'Room for surprises')}
      <div className={`mt-2 rounded-xl px-4 py-3 ${b.belowFloor ? 'bg-red-500/20 border border-red-400' : 'bg-[#C9A84C]/15 border border-[#C9A84C]/60'}`}>
        <div className="flex items-center justify-between"><span className="text-[18px] font-bold">Bid price</span><span className="text-[24px] font-extrabold">{money(b.price)}</span></div>
        <p className="text-[15px] text-white/85 leading-snug mt-0.5">Profit is {money(b.profit)}, which is {b.marginOfPrice.toFixed(1)}% of the bid price.</p>
        {b.belowFloor && <p className="text-[16px] font-bold text-red-100 leading-snug mt-1">This is below your floor of {p.floorPct}% profit. Raise the profit, or change the floor.</p>}
      </div>
      {b.alternates.length > 0 && (<>
        <p className="text-[15px] font-bold uppercase tracking-wide text-[#c4b5fd] mt-5 mb-1">Alternates (not in the bid price)</p>
        {b.alternates.map((a, i) => <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-t border-white/10"><span className="text-[16px] leading-snug break-words min-w-0">{a.name}</span><span className="text-[17px] font-bold shrink-0">add {money(a.price)}</span></div>)}
      </>)}
      <p className="text-[15px] font-bold uppercase tracking-wide text-[#E5C76B] mt-5">Your floor</p>
      {row('Lowest profit you will bid at', 'floorPct', null, 'You get a red warning below this')}
      <button onClick={useAlways} className={`mt-4 w-full min-h-[52px] rounded-xl border text-[17px] font-semibold ${saved ? 'border-[#4ade80] text-[#8fe3a8]' : 'border-white/30'}`}>{saved ? 'Saved. New bids start with these.' : 'Use these numbers on every new bid'}</button>
      <button onClick={share} className="mt-2 w-full min-h-[52px] rounded-xl border border-white/30 text-[17px] font-semibold">Share or copy the quantity list</button>
      <button onClick={() => { try { const blob = new Blob(['\ufeff' + bidCsv(planName, data)], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = planName.replace(/[^a-z0-9]+/gi, '-').slice(0, 60) + '-quantities.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); setShared('Saved as a spreadsheet file (opens in Excel or Google Sheets).'); } catch { setShared('This phone would not save the file. Use Share or copy instead.'); } }} className="mt-2 w-full min-h-[52px] rounded-xl border border-white/30 text-[17px] font-semibold">Download as a spreadsheet</button>
      {shared && <p className="text-[15px] text-[#8fe3a8] mt-1.5">{shared}</p>}
      <button onClick={onClose} className="mt-2 w-full min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold">Done</button>
    </Sheet>
  );
}

function SendSheet({ takeoffId, data, planName, onClose }: { takeoffId: string; data: TakeoffData; planName: string; onClose: () => void }) {
  const [withAlts, setWithAlts] = useState(false);
  const router = useRouter();
  const [q, setQ] = useState('');
  const [list, setList] = useState<Est[] | null>(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');      // the estimate he tapped that a customer already has
  const [done, setDone] = useState<null | { added: number; estimate_id: string; estimate_number: string; total: number; fixed_price: boolean }>(null);
  const lines = useMemo(() => takeoffLines(data, 'From plans', withAlts), [data, withAlts]);
  const pr = data.pricing; const hasPricing = !!pr && (pr.overheadPct > 0 || pr.profitPct > 0 || pr.contingencyPct > 0);
  const [applyPricing, setApplyPricing] = useState(true);
  const altCount = data.items.filter((i) => i.alt).length;
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
    if (e.status !== 'draft' && warn !== e.id) { setWarn(e.id); setErr(''); return; }
    setBusy(e.id); setErr('');
    // The measuring is saved first so the server works from exactly what is on screen.
    await fetch('/api/admin/takeoffs/' + takeoffId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => null);
    const r = await fetch('/api/admin/takeoffs/' + takeoffId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'export', estimate_id: e.id, customer_sees_ok: e.status !== 'draft', apply_pricing: hasPricing && applyPricing, include_alts: withAlts }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(''); setWarn('');
    if (!r || !r.ok) { setErr(d.error || 'That did not go through. Try again.'); return; }
    setDone(d);
  };
  const who = (e: Est) => e.customer?.company_name || [e.customer?.first_name, e.customer?.last_name].filter(Boolean).join(' ') || '';

  if (done) {
    return (
      <Sheet title="It is in Estimates now" onClose={onClose}>
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
      <p className="text-[17px] leading-relaxed">{lines.length} line{lines.length === 1 ? '' : 's'} will be added. A draft is the safe place: no customer sees a draft.</p>
      {unpriced > 0 && <p className="text-[16px] text-[#f0a04b] leading-snug mt-1.5">{unpriced} {unpriced === 1 ? 'has' : 'have'} no price yet and will go in at $0 for you to price on the estimate.</p>}
      {unscaled > 0 && <p className="text-[16px] text-[#f0a04b] leading-snug mt-1.5">{unscaled} measurement{unscaled === 1 ? ' is' : 's are'} left out because the sheet has no scale.</p>}
      {altCount > 0 && (
        <button type="button" role="switch" aria-checked={withAlts} onClick={() => setWithAlts((v) => !v)} className="mt-3 w-full min-h-[52px] rounded-xl border border-white/20 px-3 flex items-center gap-3 text-left">
          <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${withAlts ? 'bg-[#a78bfa] border-[#a78bfa] text-black' : 'border-white/50 text-transparent'}`}><Check size={18} /></span>
          <span className="text-[16px] leading-snug">Also send the {altCount} alternate{altCount === 1 ? '' : 's'}. They add to the estimate total.</span>
        </button>
      )}
      {hasPricing && pr && (
        <button type="button" role="switch" aria-checked={applyPricing} onClick={() => setApplyPricing((v) => !v)} className="mt-3 w-full min-h-[52px] rounded-xl border border-white/20 px-3 flex items-center gap-3 text-left">
          <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${applyPricing ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/50 text-transparent'}`}><Check size={18} /></span>
          <span className="text-[16px] leading-snug">Put my overhead {pr.overheadPct}%, profit {pr.profitPct}%{pr.contingencyPct ? ` and contingency ${pr.contingencyPct}%` : ''} on the estimate</span>
        </button>
      )}
      <NewEstimateBox planName={planName} busy={!!busy} onMade={(e) => send(e)} />
      <p className="text-[15px] font-semibold text-white/80 mt-5">Or add to an estimate you already started</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find the estimate by name or number" className={`${inputCls} mt-2`} />
      {err && <p className="text-[16px] text-red-200 mt-2">{err}</p>}
      <div className="mt-2 space-y-2">
        {list === null && <p className="text-[16px] text-white/75 flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading…</p>}
        {list && list.length === 0 && <p className="text-[16px] text-white/85 leading-snug">No open estimate matches.</p>}
        {(list || []).map((e) => (
          <button key={e.id} disabled={!!busy} onClick={() => send(e)} className={`w-full text-left rounded-xl border px-3.5 py-3 flex items-center gap-3 disabled:opacity-60 ${warn === e.id ? 'border-red-400 bg-red-500/15' : e.status === 'draft' ? 'border-white/20 bg-white/[0.04]' : 'border-[#f0a04b]/60 bg-[#f0a04b]/10'}`}>
            <span className="flex-1 min-w-0">
              <span className="block text-[17px] font-bold leading-snug break-words">{e.project_name || e.estimate_number}</span>
              <span className="block text-[15px] text-white/75 leading-snug">{[e.estimate_number, who(e), e.status === 'draft' ? 'Draft' : ''].filter(Boolean).join(' · ')}</span>
              {e.status !== 'draft' && warn !== e.id && <span className="block text-[15px] font-semibold text-[#f0a04b] leading-snug">The customer already has this one</span>}
              {warn === e.id && <span className="block text-[16px] font-semibold text-red-100 leading-snug mt-0.5">The customer will see these lines and the new total on their page right away{unpriced > 0 ? `, and ${unpriced} of them at $0` : ''}. Tap again to add them anyway.</span>}
            </span>
            {busy === e.id ? <Loader2 size={22} className="animate-spin shrink-0" /> : <Send size={20} className="text-[#E5C76B] shrink-0" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
