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
 * One tap on a line takes the whole run it belongs to: it follows connected pieces end to end, through bends.
 * CAD files often break one line into many pieces and cross it with others, so where several pieces meet it
 * carries straight on (within 15 degrees) if exactly one piece does, and stops otherwise.
 */
export function traceRun(v: SheetVectors | null, pt: Pt, r: number): Pt[] | null {
  if (!v) return null;
  let first = -1; let fd = r;
  for (const s of near(v, pt, r)) { const [a, b] = seg(v, s); const q = closestOn(a, b, pt); const d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < fd) { fd = d; first = s; } }
  if (first < 0) return null;
  const tol = 1.0;
  const k = (p: Pt) => `${Math.round(p[0] / 0.5)},${Math.round(p[1] / 0.5)}`;
  const touching = (p: Pt): number[] => near(v, p, tol * 2).filter((s) => { const [a, b] = seg(v, s); return Math.hypot(a[0] - p[0], a[1] - p[1]) < tol || Math.hypot(b[0] - p[0], b[1] - p[1]) < tol; });
  const used = new Set<number>([first]);
  const walk = (from: Pt, prev: Pt): Pt[] => {
    const pts: Pt[] = []; let p = from; let before = prev;
    for (let guard = 0; guard < 5000; guard++) {
      const cand = touching(p).filter((s) => !used.has(s));
      if (!cand.length) break;
      const hx = p[0] - before[0], hy = p[1] - before[1]; const hl = Math.hypot(hx, hy) || 1;
      const far = (s: number): Pt => { const [a, b] = seg(v, s); return Math.hypot(a[0] - p[0], a[1] - p[1]) < tol ? b : a; };
      let pick = -1;
      if (cand.length === 1) pick = cand[0];
      else {
        const straight = cand.filter((s) => { const q = far(s); const dx = q[0] - p[0], dy = q[1] - p[1]; const dl = Math.hypot(dx, dy) || 1; return (hx * dx + hy * dy) / (hl * dl) > 0.966; });
        if (straight.length === 1) pick = straight[0];
      }
      if (pick < 0) break;
      used.add(pick); before = p; p = far(pick); pts.push(p);
    }
    return pts;
  };
  const [a, b] = seg(v, first);
  const back = walk(a, b).reverse(); const fwd = walk(b, a);
  const run = [...back, a, b, ...fwd];
  return run.filter((p, i) => i === 0 || k(p) !== k(run[i - 1]));
}

/* ── Symbols ──────────────────────────────────────────────────────────
   A CAD symbol (a catch basin, a light, a door tag) is the same little drawing stamped again and again. Line
   pieces that touch are grouped; a small group is a symbol candidate, described by how many pieces it has and
   their lengths, which does not change when the symbol is moved or turned. */
type Comp = { cx: number; cy: number; size: number; sig: string };
const compCache = new WeakMap<SheetVectors, { of: Int32Array; comps: Comp[] }>();
function components(v: SheetVectors) {
  const hit = compCache.get(v); if (hit) return hit;
  const parent = new Int32Array(v.count); for (let i = 0; i < v.count; i++) parent[i] = i;
  const find = (x: number): number => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const ends = new Map<number, number>();
  for (let s = 0; s < v.count; s++) for (let e = 0; e < 2; e++) {
    const kk = Math.round(v.segs[s * 4 + e * 2] * 2) * 200_003 + Math.round(v.segs[s * 4 + e * 2 + 1] * 2);
    const o = ends.get(kk); if (o === undefined) ends.set(kk, s); else { const ra = find(s), rb = find(o); if (ra !== rb) parent[ra] = rb; }
  }
  const groups = new Map<number, number[]>();
  for (let s = 0; s < v.count; s++) { const r = find(s); const g = groups.get(r); if (g) g.push(s); else groups.set(r, [s]); }
  const of = new Int32Array(v.count).fill(-1); const comps: Comp[] = [];
  groups.forEach((list) => {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity; let total = 0; let mx = 0; let mn = Infinity;
    for (const s of list) {
      const ax = v.segs[s * 4], ay = v.segs[s * 4 + 1], bx = v.segs[s * 4 + 2], by = v.segs[s * 4 + 3];
      x1 = Math.min(x1, ax, bx); y1 = Math.min(y1, ay, by); x2 = Math.max(x2, ax, bx); y2 = Math.max(y2, ay, by);
      const l = Math.hypot(bx - ax, by - ay); total += l; mx = Math.max(mx, l); mn = Math.min(mn, l);
    }
    const size = Math.max(x2 - x1, y2 - y1);
    const symbol = list.length >= 2 && list.length <= 400 && size >= 2 && size <= 90;
    const idx = comps.length;
    comps.push({ cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, size, sig: symbol ? `${list.length}|${Math.round(total)}|${Math.round(mx * 2)}|${Math.round(mn * 2)}` : '' });
    for (const s of list) of[s] = idx;
  });
  const out = { of, comps }; compCache.set(v, out); return out;
}

/* A symbol is recognised two ways, because CAD files draw them differently:
   "group": its line pieces touch each other and nothing else (a stand-alone symbol);
   "box":   it has a closed outline (a square light fixture, a round manhole); it is described by the outline's size
            and by the pieces drawn wholly inside it, so wiring or pipe running into it does not change it. */
export type SymbolKey = { how: 'group' | 'box'; sig: string } | { how: 'pattern'; segs: number[]; r: number };

type Box = { cx: number; cy: number; w: number; h: number; sig: string };
const boxCache = new WeakMap<SheetVectors, Box[]>();
function boxes(v: SheetVectors): Box[] {
  const hit = boxCache.get(v); if (hit) return hit;
  const out: Box[] = [];
  for (const poly of v.shapes) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const q of poly) { x1 = Math.min(x1, q[0]); y1 = Math.min(y1, q[1]); x2 = Math.max(x2, q[0]); y2 = Math.max(y2, q[1]); }
    const w = x2 - x1, h = y2 - y1;
    if (w < 3 || h < 3 || w > 90 || h > 90) continue;
    // pieces drawn wholly inside the outline (a little slack for the outline itself)
    const m = 0.4; let n = 0; let len = 0;
    const seen = new Set<number>();
    for (let cx = Math.floor(x1 / v.cell); cx <= Math.floor(x2 / v.cell); cx++) for (let cy = Math.floor(y1 / v.cell); cy <= Math.floor(y2 / v.cell); cy++) {
      for (const sg of v.grid.get(key(cx, cy)) || []) {
        if (seen.has(sg)) continue; seen.add(sg);
        const ax = v.segs[sg * 4], ay = v.segs[sg * 4 + 1], bx = v.segs[sg * 4 + 2], by = v.segs[sg * 4 + 3];
        if (ax >= x1 - m && ax <= x2 + m && bx >= x1 - m && bx <= x2 + m && ay >= y1 - m && ay <= y2 + m && by >= y1 - m && by <= y2 + m) { n++; len += Math.hypot(bx - ax, by - ay); }
      }
    }
    const lo = Math.min(w, h), hi = Math.max(w, h);
    out.push({ cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, w, h, sig: `${Math.round(lo)}x${Math.round(hi)}|${poly.length}|${n}|${Math.round(len / 2)}` });
  }
  boxCache.set(v, out); return out;
}
const spread = (pts: Pt[]): Pt[] => { const out: Pt[] = []; for (const p of pts) if (!out.some((o) => Math.hypot(o[0] - p[0], o[1] - p[1]) < 2.5)) out.push(p); return out; };

/* "pattern": the symbol's own pieces, measured from its middle. Anywhere on a sheet where all of those pieces are
   drawn again (moved, or turned to any angle) is the same symbol. Pieces that merely run INTO it (a wire, a pipe) are
   not part of the pattern, and a place with much more drawn inside it is a different symbol (a square with an X is
   not a plain square). */
function patternsAt(v: SheetVectors, pt: Pt): { segs: number[]; r: number; at: Pt }[] {
  const pool = near(v, pt, 44).map((sg) => seg(v, sg));
  const inside = (R: number, c: Pt) => pool.filter(([p, q]) => Math.hypot(p[0] - c[0], p[1] - c[1]) <= R && Math.hypot(q[0] - c[0], q[1] - c[1]) <= R);
  // Grow a circle from the tap. Each time nothing new falls wholly inside it for a while, that is the edge of
  // something: first an inner part (a dot), later the whole symbol. Every such edge is a candidate pattern.
  const out: { segs: number[]; r: number; at: Pt }[] = []; let lastN = 0;
  for (let t = 4; t <= 34; t += 1) {
    const n = inside(t, pt).length;
    if (n < 2 || n === lastN || n !== inside(t + 4, pt).length) continue;
    lastN = n;
    let picked = inside(t, pt);
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const [p, q] of picked) { x1 = Math.min(x1, p[0], q[0]); y1 = Math.min(y1, p[1], q[1]); x2 = Math.max(x2, p[0], q[0]); y2 = Math.max(y2, p[1], q[1]); }
    const c: Pt = [(x1 + x2) / 2, (y1 + y2) / 2];
    const rad = Math.max(...picked.map(([p, q]) => Math.max(Math.hypot(p[0] - c[0], p[1] - c[1]), Math.hypot(q[0] - c[0], q[1] - c[1])))) + 0.6;
    picked = inside(rad, c);
    if (picked.length < 2 || picked.length > 140 || rad < 2) continue;
    const segs: number[] = [];
    for (const [p, q] of picked) segs.push(p[0] - c[0], p[1] - c[1], q[0] - c[0], q[1] - c[1]);
    out.push({ segs, r: rad, at: c });
  }
  return out.reverse().slice(0, 4);          // the whole symbol first
}
function findPattern(v: SheetVectors, segs: number[], r: number): Pt[] {
  const n = segs.length / 4; if (n < 2) return [];
  const lens: number[] = []; let total = 0;
  for (let i = 0; i < n; i++) { const l = Math.hypot(segs[i * 4 + 2] - segs[i * 4], segs[i * 4 + 3] - segs[i * 4 + 1]); lens.push(l); total += l; }
  // start from the longest pieces (up to three different lengths), in case one of them is a stray wire
  const order = lens.map((l, i) => i).sort((x, y) => lens[y] - lens[x]);
  const anchors: number[] = [];
  for (const i of order) { if (lens[i] < 1.2) break; if (!anchors.some((k) => Math.abs(lens[k] - lens[i]) < 0.5)) anchors.push(i); if (anchors.length === 3) break; }
  if (!anchors.length) return [];
  const tol = 1.1;
  const hasSeg = (px: number, py: number, qx: number, qy: number) => {
    for (const sg of near(v, [px, py], tol)) {
      const ax = v.segs[sg * 4], ay = v.segs[sg * 4 + 1], bx = v.segs[sg * 4 + 2], by = v.segs[sg * 4 + 3];
      if ((Math.abs(ax - px) < tol && Math.abs(ay - py) < tol && Math.abs(bx - qx) < tol && Math.abs(by - qy) < tol) || (Math.abs(bx - px) < tol && Math.abs(by - py) < tol && Math.abs(ax - qx) < tol && Math.abs(ay - qy) < tol)) return true;
    }
    return false;
  };
  const tried = new Set<string>(); const out: Pt[] = [];
  for (const ai of anchors) {
    const La = lens[ai]; const lenTol = Math.max(0.35, La * 0.015);
    const amx = (segs[ai * 4] + segs[ai * 4 + 2]) / 2, amy = (segs[ai * 4 + 1] + segs[ai * 4 + 3]) / 2;
    const ath = Math.atan2(segs[ai * 4 + 3] - segs[ai * 4 + 1], segs[ai * 4 + 2] - segs[ai * 4]);
    for (let sg = 0; sg < v.count; sg++) {
      const ax = v.segs[sg * 4], ay = v.segs[sg * 4 + 1], bx = v.segs[sg * 4 + 2], by = v.segs[sg * 4 + 3];
      if (Math.abs(Math.hypot(bx - ax, by - ay) - La) > lenTol) continue;
      const mx = (ax + bx) / 2, my = (ay + by) / 2; const base = Math.atan2(by - ay, bx - ax);
      for (const th of [base, base + Math.PI]) {
        const rot = th - ath; const co = Math.cos(rot), si = Math.sin(rot);
        const cx = mx - (amx * co - amy * si), cy = my - (amx * si + amy * co);
        const k = Math.round(cx) + ',' + Math.round(cy) + ',' + Math.round(((rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / 0.09);
        if (tried.has(k)) continue; tried.add(k);
        if (out.some((o) => Math.hypot(o[0] - cx, o[1] - cy) < Math.max(2.5, r * 0.5))) continue;
        // how much of the pattern's line is drawn here, by length
        let got = 0; let lost = 0;
        for (let i = 0; i < n && lost <= total * 0.2; i++) {
          const px = cx + segs[i * 4] * co - segs[i * 4 + 1] * si, py = cy + segs[i * 4] * si + segs[i * 4 + 1] * co;
          const qx = cx + segs[i * 4 + 2] * co - segs[i * 4 + 3] * si, qy = cy + segs[i * 4 + 2] * si + segs[i * 4 + 3] * co;
          if (hasSeg(px, py, qx, qy)) got += lens[i]; else lost += lens[i];
        }
        if (got < total * 0.8) continue;
        // a place with a lot more line drawn wholly inside it is a different symbol (a square with an X in it)
        let inLen = 0;
        for (const o of near(v, [cx, cy], r)) { const [p1, p2] = seg(v, o); if (Math.hypot(p1[0] - cx, p1[1] - cy) <= r && Math.hypot(p2[0] - cx, p2[1] - cy) <= r) inLen += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); }
        if (inLen > total * 1.25 + 3) continue;
        out.push([cx, cy]);
        if (out.length > 3000) return out;
      }
    }
  }
  return out;
}

/** Every place on this sheet where the described symbol is drawn. */
export function findSymbols(v: SheetVectors | null, k: SymbolKey): Pt[] {
  if (!v) return [];
  if (k.how === 'pattern') return findPattern(v, k.segs, k.r);
  if (k.how === 'group') return spread(components(v).comps.filter((c) => c.sig === k.sig).map((c) => [c.cx, c.cy] as Pt));
  return spread(boxes(v).filter((bx) => bx.sig === k.sig).map((bx) => [bx.cx, bx.cy] as Pt));
}

/** What symbol is under the tap: its description (to look for it elsewhere) and every match on this sheet, tapped one first. */
export function symbolAt(v: SheetVectors | null, pt: Pt, r: number): { key: SymbolKey; pts: Pt[] } | null {
  if (!v) return null;
  const cands: { key: SymbolKey; at: Pt }[] = [];
  let first = -1; let fd = r;
  for (const sg of near(v, pt, r)) { const [p1, p2] = seg(v, sg); const q = closestOn(p1, p2, pt); const d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < fd) { fd = d; first = sg; } }
  if (first >= 0) { const { of, comps } = components(v); const mine = comps[of[first]]; if (mine && mine.sig) cands.push({ key: { how: 'group', sig: mine.sig }, at: [mine.cx, mine.cy] }); }
  // the smallest closed outline the tap is in (or right beside)
  let best: Box | null = null;
  for (const bx of boxes(v)) {
    if (pt[0] < bx.cx - bx.w / 2 - r || pt[0] > bx.cx + bx.w / 2 + r || pt[1] < bx.cy - bx.h / 2 - r || pt[1] > bx.cy + bx.h / 2 + r) continue;
    if (!best || bx.w * bx.h < best.w * best.h) best = bx;
  }
  if (best) cands.push({ key: { how: 'box', sig: best.sig }, at: [best.cx, best.cy] });
  // its own pieces as a pattern: the most dependable way, so it wins a tie
  let pats = patternsAt(v, pt);
  if (!pats.length && first >= 0) { const [p1, p2] = seg(v, first); pats = patternsAt(v, closestOn(p1, p2, pt)); }
  // the biggest pattern (the whole symbol) that is drawn at least twice on the sheet is the answer
  for (const pat of pats) {
    const key: SymbolKey = { how: 'pattern', segs: pat.segs.map((x) => Math.round(x * 100) / 100), r: Math.round(pat.r * 100) / 100 };
    const all = findPattern(v, pat.segs, pat.r);
    if (all.length >= 2 && all.length <= 2000) { const mine = all.reduce((bi, p, i) => (Math.hypot(p[0] - pat.at[0], p[1] - pat.at[1]) < Math.hypot(all[bi][0] - pat.at[0], all[bi][1] - pat.at[1]) ? i : bi), 0); return { key, pts: [all[mine], ...all.filter((_, i) => i !== mine)] }; }
  }
  let out: { key: SymbolKey; pts: Pt[] } | null = null;
  for (const c of cands) {
    const all = findSymbols(v, c.key);
    if (all.length > 2000) continue;
    const mine = all.reduce((bi, p, i) => (Math.hypot(p[0] - c.at[0], p[1] - c.at[1]) < Math.hypot(all[bi][0] - c.at[0], all[bi][1] - c.at[1]) ? i : bi), 0);
    const pts = all.length ? [all[mine], ...all.filter((_, i) => i !== mine)] : [c.at];
    if (!out || pts.length > out.pts.length) out = { key: c.key, pts };
  }
  return out;
}

/**
 * He drew a box around ONE symbol (two taps, corner to corner). Everything drawn wholly inside the box is the symbol,
 * so there is no guessing where it ends. Returns its description and every match on the sheet, boxed one first.
 */
export function symbolInBox(v: SheetVectors | null, a: Pt, b: Pt): { key: SymbolKey; pts: Pt[] } | null {
  if (!v) return null;
  const x1 = Math.min(a[0], b[0]), x2 = Math.max(a[0], b[0]), y1 = Math.min(a[1], b[1]), y2 = Math.max(a[1], b[1]);
  if (x2 - x1 < 3 || y2 - y1 < 3 || x2 - x1 > 160 || y2 - y1 > 160) return null;
  const c: Pt = [(x1 + x2) / 2, (y1 + y2) / 2]; const reach = Math.hypot(x2 - x1, y2 - y1) / 2 + 1;
  const segs: number[] = []; let far = 0;
  for (const sg of near(v, c, reach)) {
    const [p, q] = seg(v, sg);
    if (p[0] < x1 || p[0] > x2 || q[0] < x1 || q[0] > x2 || p[1] < y1 || p[1] > y2 || q[1] < y1 || q[1] > y2) continue;
    segs.push(p[0], p[1], q[0], q[1]); far = Math.max(far, Math.hypot(p[0] - c[0], p[1] - c[1]), Math.hypot(q[0] - c[0], q[1] - c[1]));
  }
  if (segs.length < 8 || segs.length > 4 * 300) return null;                    // fewer than 2 pieces, or far too many
  // measure the pieces from the middle of what was actually boxed
  let bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;
  for (let i = 0; i < segs.length; i += 2) { bx1 = Math.min(bx1, segs[i]); bx2 = Math.max(bx2, segs[i]); by1 = Math.min(by1, segs[i + 1]); by2 = Math.max(by2, segs[i + 1]); }
  const m: Pt = [(bx1 + bx2) / 2, (by1 + by2) / 2];
  const rel = segs.map((x, i) => Math.round((x - (i % 2 ? m[1] : m[0])) * 100) / 100);
  let rad = 0; for (let i = 0; i < rel.length; i += 2) rad = Math.max(rad, Math.hypot(rel[i], rel[i + 1]));
  const key: SymbolKey = { how: 'pattern', segs: rel, r: Math.round((rad + 0.6) * 100) / 100 };
  const all = findSymbols(v, key);
  if (!all.length) return { key, pts: [m] };
  const mine = all.reduce((bi, p, i) => (Math.hypot(p[0] - m[0], p[1] - m[1]) < Math.hypot(all[bi][0] - m[0], all[bi][1] - m[1]) ? i : bi), 0);
  return { key, pts: [all[mine], ...all.filter((_, i) => i !== mine)] };
}

/** Tap one symbol: the middle of every matching symbol on the sheet (the tapped one first), or null. */
export function matchSymbols(v: SheetVectors | null, pt: Pt, r: number): Pt[] | null {
  const m = symbolAt(v, pt, r);
  return m ? m.pts : null;
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
