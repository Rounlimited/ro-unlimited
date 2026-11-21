/**
 * NexaBids phase 2: the drawing's own lines.
 *
 * Most plan sets are PDFs exported from CAD, so every wall, pipe run and curb line is stored in the file as exact
 * line work. This reads that line work out of one sheet (with pdf.js, in the browser, no AI) so a tap can snap to a
 * real corner, a whole run can be taken with one tap, and a closed outline can be taken by tapping inside it.
 * All points are in the same sheet units the measuring screen uses (pdf.js viewport at scale 1, top-left origin).
 */
import type { Pt } from './takeoff';

type M = [number, number, number, number, number, number];
const mul = (a: M, b: M): M => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const ap = (m: M, x: number, y: number): Pt => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export type SheetVectors = {
  segs: Float32Array;            // x1,y1,x2,y2 per segment
  count: number;
  shapes: Pt[][];                // closed outlines (closed paths and rectangles)
  grid: Map<number, number[]>;   // cell -> segment numbers
  cell: number;
};

const MAX_SEGS = 400_000;
const key = (cx: number, cy: number) => cx * 100_003 + cy;

/** Reads the line work of one pdf.js page. `OPS` is pdfjsLib.OPS. Returns null when the sheet has no line work (a scan). */
export async function readSheetVectors(page: any, OPS: any): Promise<SheetVectors | null> {
  const list = await page.getOperatorList();
  const base = page.getViewport({ scale: 1 }).transform as M;
  let ctm: M = [1, 0, 0, 1, 0, 0];
  const stack: M[] = [];
  const segs: number[] = [];
  const shapes: Pt[][] = [];
  const push = (a: Pt, b: Pt) => { if (segs.length / 4 < MAX_SEGS && Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3) segs.push(a[0], a[1], b[0], b[1]); };
  const P = (x: number, y: number) => { const q = ap(ctm, x, y); return ap(base, q[0], q[1]); };

  for (let i = 0; i < list.fnArray.length; i++) {
    const fn = list.fnArray[i]; const args = list.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = mul(ctm, args as M);
    else if (fn === OPS.paintFormXObjectBegin) { stack.push(ctm); if (Array.isArray(args?.[0]) && args[0].length === 6) ctm = mul(ctm, args[0] as M); }
    else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.constructPath) {
      const ops: number[] = args?.[0] || []; const c: number[] = args?.[1] || [];
      let k = 0; let cur: Pt | null = null; let start: Pt | null = null; let poly: Pt[] = [];
      const endPoly = (closed: boolean) => { if (closed && poly.length >= 3) shapes.push(poly); poly = []; };
      for (const op of ops) {
        if (op === OPS.moveTo) { endPoly(false); cur = P(c[k], c[k + 1]); start = cur; poly = [cur]; k += 2; }
        else if (op === OPS.lineTo) { const n = P(c[k], c[k + 1]); if (cur) push(cur, n); cur = n; poly.push(n); k += 2; }
        else if (op === OPS.curveTo) { const n = P(c[k + 4], c[k + 5]); if (cur) push(cur, n); cur = n; poly.push(n); k += 6; }
        else if (op === OPS.curveTo2 || op === OPS.curveTo3) { const n = P(c[k + 2], c[k + 3]); if (cur) push(cur, n); cur = n; poly.push(n); k += 4; }
        else if (op === OPS.closePath) { if (cur && start) push(cur, start); cur = start; endPoly(true); if (start) poly = [start]; }
        else if (op === OPS.rectangle) {
          const x = c[k], y = c[k + 1], w = c[k + 2], h = c[k + 3]; k += 4;
          const r = [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)];
          for (let j = 0; j < 4; j++) push(r[j], r[(j + 1) % 4]);
          shapes.push(r); cur = r[0]; start = r[0];
        }
      }
    }
  }
  const count = segs.length / 4;
  if (count < 3) return null;                                             // a scanned sheet has no line work at all
  const cell = 12;
  const grid = new Map<number, number[]>();
  const f = new Float32Array(segs);
  for (let s = 0; s < count; s++) {
    const x1 = f[s * 4], y1 = f[s * 4 + 1], x2 = f[s * 4 + 2], y2 = f[s * 4 + 3];
    const cx1 = Math.floor(Math.min(x1, x2) / cell), cx2 = Math.floor(Math.max(x1, x2) / cell);
    const cy1 = Math.floor(Math.min(y1, y2) / cell), cy2 = Math.floor(Math.max(y1, y2) / cell);
    if ((cx2 - cx1 + 1) * (cy2 - cy1 + 1) > 400) continue;              // very long lines (sheet border) are skipped for snapping
    for (let cx = cx1; cx <= cx2; cx++) for (let cy = cy1; cy <= cy2; cy++) {
      const kk = key(cx, cy); const a = grid.get(kk); if (a) a.push(s); else grid.set(kk, [s]);
    }
  }
  return { segs: f, count, shapes: shapes.filter((p) => polyArea(p) > 4), grid, cell };
}

const polyArea = (p: Pt[]) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(a) / 2; };

function near(v: SheetVectors, pt: Pt, r: number): number[] {
  const out = new Set<number>();
  const c1x = Math.floor((pt[0] - r) / v.cell), c2x = Math.floor((pt[0] + r) / v.cell);
  const c1y = Math.floor((pt[1] - r) / v.cell), c2y = Math.floor((pt[1] + r) / v.cell);
  for (let cx = c1x; cx <= c2x; cx++) for (let cy = c1y; cy <= c2y; cy++) for (const s of v.grid.get(key(cx, cy)) || []) out.add(s);
  return Array.from(out);
}
const seg = (v: SheetVectors, s: number): [Pt, Pt] => [[v.segs[s * 4], v.segs[s * 4 + 1]], [v.segs[s * 4 + 2], v.segs[s * 4 + 3]]];
function closestOn(a: Pt, b: Pt, p: Pt): Pt {
  const dx = b[0] - a[0], dy = b[1] - a[1]; const L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Moves a tap onto the drawing: a corner or line end if one is within r, else the nearest line within r. */
export function snapPoint(v: SheetVectors | null, pt: Pt, r: number): { pt: Pt; kind: 'corner' | 'line' | 'none' } {
  if (!v) return { pt, kind: 'none' };
  let best: Pt | null = null; let bd = r;
  const cand = near(v, pt, r);
  for (const s of cand) for (const e of seg(v, s)) { const d = Math.hypot(e[0] - pt[0], e[1] - pt[1]); if (d < bd) { bd = d; best = e; } }
  if (best) return { pt: best, kind: 'corner' };
  let lbest: Pt | null = null; let ld = r * 0.7;
  for (const s of cand) { const [a, b] = seg(v, s); const q = closestOn(a, b, pt); const d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < ld) { ld = d; lbest = q; } }
  return lbest ? { pt: lbest, kind: 'line' } : { pt, kind: 'none' };
}

/**
 * One tap on a line takes the whole run it belongs to: it follows connected pieces end to end, through bends,
 * and stops where the line branches or ends. Returns the run as points, or null if no line is under the tap.
 */
export function traceRun(v: SheetVectors | null, pt: Pt, r: number): Pt[] | null {
  if (!v) return null;
  let first = -1; let fd = r;
  for (const s of near(v, pt, r)) { const [a, b] = seg(v, s); const q = closestOn(a, b, pt); const d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < fd) { fd = d; first = s; } }
  if (first < 0) return null;
  const tol = 0.6;
  const k = (p: Pt) => `${Math.round(p[0] / tol)},${Math.round(p[1] / tol)}`;
  const atEnd = (p: Pt): number[] => near(v, p, tol * 2).filter((s) => { const [a, b] = seg(v, s); return Math.hypot(a[0] - p[0], a[1] - p[1]) < tol || Math.hypot(b[0] - p[0], b[1] - p[1]) < tol; });
  const used = new Set<number>([first]);
  const walk = (from: Pt): Pt[] => {
    const pts: Pt[] = []; let p = from;
    for (let guard = 0; guard < 5000; guard++) {
      const nxt = atEnd(p).filter((s) => !used.has(s));
      if (nxt.length !== 1) break;                                         // the run ends, or it branches
      const s = nxt[0]; used.add(s); const [a, b] = seg(v, s);
      p = Math.hypot(a[0] - p[0], a[1] - p[1]) < tol ? b : a; pts.push(p);
    }
    return pts;
  };
  const [a, b] = seg(v, first);
  const back = walk(a).reverse(); const fwd = walk(b);
  const run = [...back, a, b, ...fwd];
  return run.filter((p, i) => i === 0 || k(p) !== k(run[i - 1]));
}

/** The smallest closed outline on the drawing that contains the tap (a room, a slab, a paved area). */
export function shapeAt(v: SheetVectors | null, pt: Pt): Pt[] | null {
  if (!v) return null;
  let best: Pt[] | null = null; let ba = Infinity;
  for (const poly of v.shapes) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (!inside) continue;
    const a = polyArea(poly); if (a < ba) { ba = a; best = poly; }
  }
  return best;
}
