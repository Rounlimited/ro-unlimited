/**
 * Bid from Plans: the measuring math.
 *
 * A plan sheet is a PDF page. Every point is stored in the page's own units (PDF points, 72 to the inch on
 * paper), so a measurement stays true at any zoom. A sheet's scale is "feet on the ground per point on the
 * sheet"; nothing can be measured on a sheet until its scale is set.
 */

export type Pt = [number, number];
export type TakeoffKind = 'length' | 'area' | 'count';
export type TakeoffUnit = 'LF' | 'SF' | 'SY' | 'CY' | 'EA';
export type TakeoffShape = { id: string; page: number; pts: Pt[] };
export type TakeoffItem = {
  id: string;
  name: string;
  kind: TakeoffKind;
  unit: TakeoffUnit;
  color: string;
  unitCost: number;          // his price per unit; 0 until he prices it
  depthIn?: number;          // area items in CY: thickness in inches
  wastePct?: number;         // extra added on top of what was measured
  printedQty?: number;       // a quantity the plans themselves state (read by the AI or typed), in this item's unit
  printedNote?: string;      // where that came from, e.g. "Sheet E.1, light fixture schedule"
  group?: string;            // the trade it belongs to (becomes the phase on the estimate)
  hint?: string;             // what to measure for it, in words (from the AI's draft list)
  hintPage?: number;         // the sheet to measure it on
  shapes: TakeoffShape[];
};
export type TakeoffData = {
  scales: Record<string, number>;      // page number -> feet per point
  scaleNotes?: Record<string, string>; // page number -> how the scale was set, in words
  items: TakeoffItem[];
  pricing?: BidPricing;                // overhead, profit, contingency and the floor he will not bid under
  draftTaken?: boolean;                // he has been through the AI's draft list once
};

export const TAKEOFF_COLORS = ['#E5484D', '#3B8DD4', '#35D07F', '#F0A04B', '#B57BEE', '#12B5CB', '#E93D82', '#C9A84C'];
export const UNITS_FOR: Record<TakeoffKind, TakeoffUnit[]> = { length: ['LF'], area: ['SF', 'SY', 'CY'], count: ['EA'] };
export const KIND_LABEL: Record<TakeoffKind, string> = { length: 'Length', area: 'Area', count: 'Count' };

export const emptyTakeoff = (): TakeoffData => ({ scales: {}, scaleNotes: {}, items: [] });

export function normalizeTakeoff(raw: unknown): TakeoffData {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Partial<TakeoffData>;
  return {
    scales: d.scales && typeof d.scales === 'object' ? d.scales : {},
    scaleNotes: d.scaleNotes && typeof d.scaleNotes === 'object' ? d.scaleNotes : {},
    items: Array.isArray(d.items) ? d.items.filter((i) => i && Array.isArray(i.shapes)) : [],
    pricing: cleanPricing(d.pricing),
    draftTaken: !!d.draftTaken,
  };
}

export const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Length of a run of points, in sheet points. */
export function pathLength(pts: Pt[]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += dist(pts[i - 1], pts[i]);
  return n;
}

/** Area inside a closed outline, in square sheet points (shoelace). */
export function polygonArea(pts: Pt[]): number {
  if (pts.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]; const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** What one shape measures on the ground, in the item's base unit (LF, SF or EA). null = that sheet has no scale yet. */
export function shapeMeasure(kind: TakeoffKind, shape: TakeoffShape, scales: Record<string, number>): number | null {
  if (kind === 'count') return shape.pts.length;
  const ftPerPt = Number(scales[String(shape.page)]);
  if (!(ftPerPt > 0)) return null;
  return kind === 'length' ? pathLength(shape.pts) * ftPerPt : polygonArea(shape.pts) * ftPerPt * ftPerPt;
}

/** An item's total in its own unit, waste included. `unscaled` counts shapes left out because their sheet has no scale. */
export function itemQuantity(item: TakeoffItem, scales: Record<string, number>): { quantity: number; measured: number; unscaled: number } {
  let base = 0; let unscaled = 0;
  for (const s of item.shapes) {
    const m = shapeMeasure(item.kind, s, scales);
    if (m === null) unscaled++; else base += m;
  }
  let q = base;
  if (item.kind === 'area' && item.unit === 'SY') q = base / 9;
  if (item.kind === 'area' && item.unit === 'CY') q = (base * (Math.max(0, Number(item.depthIn) || 0) / 12)) / 27;
  const measured = q;
  // Nothing measured yet: the quantity the plans print stands in, so the item can be priced straight away.
  const printed = Math.max(0, Number(item.printedQty) || 0);
  if (!item.shapes.length && printed > 0) q = printed;
  q = q * (1 + Math.max(0, Number(item.wastePct) || 0) / 100);
  return { quantity: q, measured, unscaled };
}

/** Counts are whole; everything else is shown to one decimal under 100 and whole above. */
export function fmtQty(q: number, unit: TakeoffUnit): string {
  if (unit === 'EA') return String(Math.round(q));
  const v = q >= 100 ? Math.round(q) : Math.round(q * 10) / 10;
  return v.toLocaleString('en-US');
}
/** The number that goes on the estimate line: counts whole, the rest to two decimals. */
export const lineQty = (q: number, unit: TakeoffUnit) => (unit === 'EA' ? Math.round(q) : Math.round(q * 100) / 100);

export const money = (n: number) => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Feet on the ground per sheet point, from two tapped points and the real distance between them. */
export function scaleFromKnown(a: Pt, b: Pt, feet: number): number | null {
  const d = dist(a, b);
  return d > 0.5 && feet > 0 ? feet / d : null;
}
/** A printed scale: `feetPerInch` feet on the ground for each inch on the paper (1" = 40' gives 40; 1/4" = 1' gives 4). */
export const scaleFromPrinted = (feetPerInch: number) => (feetPerInch > 0 ? feetPerInch / 72 : null);

export const PRINTED_SCALES: { label: string; feetPerInch: number }[] = [
  { label: '1" = 10\'', feetPerInch: 10 }, { label: '1" = 20\'', feetPerInch: 20 }, { label: '1" = 30\'', feetPerInch: 30 },
  { label: '1" = 40\'', feetPerInch: 40 }, { label: '1" = 50\'', feetPerInch: 50 }, { label: '1" = 60\'', feetPerInch: 60 },
  { label: '1" = 100\'', feetPerInch: 100 }, { label: '1/8" = 1\'', feetPerInch: 8 }, { label: '3/16" = 1\'', feetPerInch: 16 / 3 },
  { label: '1/4" = 1\'', feetPerInch: 4 }, { label: '1/2" = 1\'', feetPerInch: 2 },
];

/** "1 inch = 40 ft" style wording for a stored scale. */
export function scaleWords(ftPerPt: number): string {
  const perInch = ftPerPt * 72;
  const hit = PRINTED_SCALES.find((p) => Math.abs(p.feetPerInch - perInch) / p.feetPerInch < 0.004);
  if (hit) return hit.label;
  return `1" = ${perInch >= 10 ? Math.round(perInch * 10) / 10 : Math.round(perInch * 100) / 100}'`;
}

/** Feet and inches typed loosely: "40", "40.5", "40 6", "40' 6\"", "40-6". */
export function parseFeet(input: string): number | null {
  const t = String(input || '').trim().toLowerCase().replace(/feet|foot|ft/g, "'").replace(/inches|inch|in\b/g, '"');
  if (!t) return null;
  const m = t.match(/^(\d+(?:\.\d+)?)\s*'?\s*(?:[-\s]\s*(\d+(?:\.\d+)?)\s*"?)?$/);
  if (!m) return null;
  const v = Number(m[1]) + (m[2] ? Number(m[2]) / 12 : 0);
  return v > 0 ? v : null;
}

export type TakeoffLine = { description: string; quantity: number; unit: string; unit_cost: number; phase: string; category: string };

/** The estimate lines a takeoff turns into. Items with nothing measured are left out. */
export function takeoffLines(data: TakeoffData, phase = 'From plans'): TakeoffLine[] {
  return data.items.map((it) => {
    const { quantity } = itemQuantity(it, data.scales);
    return { description: it.name.trim() || 'Unnamed item', quantity: lineQty(quantity, it.unit), unit: it.unit, unit_cost: Math.max(0, Number(it.unitCost) || 0), phase: it.group ? it.group.slice(0, 60) : phase, category: 'other' };
  }).filter((l) => l.quantity > 0);
}

/**
 * Scales printed on a sheet, read from its text: 1" = 40', 1/4" = 1'-0", 1 1/2" = 1'-0", 3" = 1'-0".
 * Most common first. A sheet of details can print several; a plan sheet usually prints one.
 */
export function findPrintedScales(words: string[]): { label: string; feetPerInch: number; times: number }[] {
  const text = words.join(' ').replace(/[\u201d\u2033]/g, '"').replace(/[\u2019\u2032]/g, "'").replace(/\s+/g, ' ');
  const hits = new Map<string, { label: string; feetPerInch: number; times: number }>();
  const add = (label: string, fpi: number) => {
    if (!(fpi > 0.01 && fpi < 2000)) return;
    const key = fpi.toFixed(4); const h = hits.get(key);
    if (h) h.times++; else hits.set(key, { label, feetPerInch: fpi, times: 1 });
  };
  // 1" = 40'   1 inch = 40 ft   1 IN = 40 FEET
  for (const m of Array.from(text.matchAll(/\b1\s*(?:"|in\.?|inch)\s*=\s*(\d+(?:\.\d+)?)\s*(?:'|ft\.?|feet)(?!\s*-?\s*\d)/gi))) add(`1" = ${m[1]}'`, Number(m[1]));
  // 1/4" = 1'-0"   1 1/2" = 1'-0"   3" = 1'-0"
  for (const m of Array.from(text.matchAll(/(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)\s*"\s*=\s*1\s*'\s*(?:-\s*0\s*"?)?/g))) {
    const inches = (Number(m[1]) || 0) + Number(m[2]) / Number(m[3]);
    if (inches > 0) add(`${m[1] ? m[1] + ' ' : ''}${m[2]}/${m[3]}" = 1'`, 1 / inches);
  }
  for (const m of Array.from(text.matchAll(/(?<![\/\d])(\d+(?:\.\d+)?)\s*"\s*=\s*1\s*'\s*-\s*0\s*"?/g))) add(`${m[1]}" = 1'`, 1 / Number(m[1]));
  return Array.from(hits.values()).sort((a, b) => b.times - a.times).slice(0, 5);
}

/** Measured against what the plans print: 'match' within 5%, 'differ' beyond, null when there are not both. */
export function qtyAgreement(item: TakeoffItem, scales: Record<string, number>): { state: 'match' | 'differ'; measured: number; printed: number; offPct: number } | null {
  const printed = Math.max(0, Number(item.printedQty) || 0);
  if (!(printed > 0) || !item.shapes.length) return null;
  const { measured } = itemQuantity(item, scales);
  if (!(measured > 0)) return null;
  const offPct = Math.round((Math.abs(measured - printed) / printed) * 1000) / 10;
  return { state: offPct <= 5 ? 'match' : 'differ', measured, printed, offPct };
}

/* ── What the AI read off the sheets (filled in by the plan reader on the worker machine) ── */
export type AiSheet = {
  number: string; title: string; discipline: string;
  scales: { scale: string; applies_to: string }[];
  legend: { symbol: string; meaning: string }[];
  schedules: { name: string; columns: string[]; rows: string[][] }[];
  quantities: { item: string; quantity: number; unit: string; printed: string }[];
  notes: string[]; scanned?: boolean; error?: string;
};
/** The AI's draft of everything to price, built from what it read off the sheets. A quantity is only ever one the plans state. */
export type DraftItem = { name: string; group: string; unit: string; quantity: number | null; source: 'table' | 'printed' | 'measure' | 'lump'; page: number; sheet: string; measure: string; note: string };
export type AiDraft = { status: 'queued' | 'working' | 'done' | 'error'; summary?: string; items?: DraftItem[]; watch_outs?: string[]; error?: string; updated_at?: string };
export type AiRead = { status: 'queued' | 'working' | 'done' | 'error'; draft?: AiDraft; done?: number; total?: number; sheets?: Record<string, AiSheet>; error?: string; started_at?: string; finished_at?: string; updated_at?: string };

/** Which of our units a printed unit maps to. */
export function unitFromPrinted(u: string): { kind: TakeoffKind; unit: TakeoffUnit } {
  const t = String(u || '').toUpperCase();
  if (t === 'LF') return { kind: 'length', unit: 'LF' };
  if (t === 'SF') return { kind: 'area', unit: 'SF' };
  if (t === 'SY') return { kind: 'area', unit: 'SY' };
  if (t === 'CY') return { kind: 'area', unit: 'CY' };
  return { kind: 'count', unit: 'EA' };
}

/* ── Pricing the bid ──────────────────────────────────────────────────
   Same arithmetic as the estimate itself: overhead, profit and contingency are each a percent of the cost of the
   work, added on top. The floor is the lowest profit percent he is willing to bid at. */
export type BidPricing = { overheadPct: number; profitPct: number; contingencyPct: number; floorPct: number };
const pct = (v: unknown) => Math.min(500, Math.max(0, Math.round((Number(v) || 0) * 100) / 100));
export function cleanPricing(p: unknown): BidPricing | undefined {
  if (!p || typeof p !== 'object') return undefined;
  const q = p as Partial<BidPricing>;
  return { overheadPct: pct(q.overheadPct), profitPct: pct(q.profitPct), contingencyPct: pct(q.contingencyPct), floorPct: pct(q.floorPct) };
}
export function bidTotals(data: TakeoffData) {
  const p = data.pricing || { overheadPct: 0, profitPct: 0, contingencyPct: 0, floorPct: 0 };
  let cost = 0; let unpriced = 0;
  for (const it of data.items) { const q = itemQuantity(it, data.scales).quantity; if (q > 0 && !(it.unitCost > 0)) unpriced++; cost += lineQty(q, it.unit) * (Number(it.unitCost) || 0); }
  const overhead = (cost * p.overheadPct) / 100, profit = (cost * p.profitPct) / 100, contingency = (cost * p.contingencyPct) / 100;
  const price = cost + overhead + profit + contingency;
  return { cost, overhead, profit, contingency, price, unpriced, marginOfPrice: price > 0 ? (profit / price) * 100 : 0, belowFloor: p.floorPct > 0 && cost > 0 && p.profitPct < p.floorPct, pricing: p };
}
