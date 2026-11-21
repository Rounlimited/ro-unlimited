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
  wid?: Float32Array;            // drawn thickness of each segment, in points
  dash?: Uint8Array;             // 1 = drawn with a dash pattern (hidden or overhead lines)
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
  let lw = 1; const lws: number[] = []; const wid: number[] = [];
  let dashed = 0; const dss: number[] = []; const dash: number[] = [];
  const segs: number[] = [];
  const shapes: Pt[][] = [];
  const push = (a: Pt, b: Pt) => { if (segs.length / 4 < MAX_SEGS && Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3) { segs.push(a[0], a[1], b[0], b[1]); wid.push(lw * Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]))); dash.push(dashed); } };
  const P = (x: number, y: number) => { const q = ap(ctm, x, y); return ap(base, q[0], q[1]); };

  for (let i = 0; i < list.fnArray.length; i++) {
    const fn = list.fnArray[i]; const args = list.argsArray[i];
    if (fn === OPS.save) { stack.push(ctm); lws.push(lw); dss.push(dashed); }
    else if (fn === OPS.restore) { ctm = stack.pop() || [1, 0, 0, 1, 0, 0]; lw = lws.pop() ?? lw; dashed = dss.pop() ?? dashed; }
    else if (fn === OPS.setDash) dashed = Array.isArray(args?.[0]) && args[0].length > 0 ? 1 : 0;
    else if (fn === OPS.setLineWidth) lw = Number(args?.[0]) || 0;
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
  return { segs: f, count, wid: new Float32Array(wid), dash: new Uint8Array(dash), shapes: shapes.filter((p) => polyArea(p) > 4), grid, cell };
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

/* ── Fill: flood the space around a tap out to the lines that enclose it ── */
type Raster = { w: number; h: number; x0: number; y0: number; res: number; wall: Uint8Array; grown: Map<number, Uint8Array>; whole: boolean };
type FillPrep = { tiers: number[]; dash: Uint8Array; bridges: Map<string, Float32Array>; rasters: Map<string, Raster>; box: [number, number, number, number] };
const prepCache = new WeakMap<SheetVectors, FillPrep>();
const GAPS = [0, 14, 44, 76];                      // widest opening (in points) that gets a piece of wall drawn across it
const CLOSE_LEVELS = [3, 6, 12, 20];               // fallback: how far lines are thickened and thinned back
let fillSeen: Uint8Array | null = null; let fillStack: Int32Array | null = null;

function prepOf(v: SheetVectors): FillPrep {
  const hit = prepCache.get(v); if (hit) return hit;
  // dashed lines drawn as rows of short pieces: a short piece with another short piece straight ahead across a small gap
  const dash = new Uint8Array(v.count); if (v.dash) dash.set(v.dash);
  const lenOf = (i: number) => Math.hypot(v.segs[i * 4 + 2] - v.segs[i * 4], v.segs[i * 4 + 3] - v.segs[i * 4 + 1]);
  for (let i = 0; i < v.count; i++) {
    const L = lenOf(i); if (L < 1.2 || L > 16) continue;
    const ax = v.segs[i * 4], ay = v.segs[i * 4 + 1], bx = v.segs[i * 4 + 2], by = v.segs[i * 4 + 3]; const ux = (bx - ax) / L, uy = (by - ay) / L;
    for (const [px, py, dx, dy] of [[bx, by, ux, uy], [ax, ay, -ux, -uy]]) {
      for (const j of near(v, [px + dx * 5, py + dy * 5], 6)) {
        if (j === i) continue; const Lj = lenOf(j); if (Lj < 1.2 || Lj > 16) continue;
        const cx = v.segs[j * 4], cy = v.segs[j * 4 + 1], ex = v.segs[j * 4 + 2], ey = v.segs[j * 4 + 3];
        if (Math.abs(((ex - cx) * dy - (ey - cy) * dx) / Lj) > 0.06) continue;                       // not in line
        const t1 = (cx - px) * dx + (cy - py) * dy, t2 = (ex - px) * dx + (ey - py) * dy; const nearT = Math.min(t1, t2);
        const off = Math.abs((cx - px) * dy - (cy - py) * dx);
        if (nearT >= 0.8 && nearT <= 10 && off < 0.7) { dash[i] = 1; dash[j] = 1; }
      }
    }
  }
  // dimension lines: a long line with two or more short slanted tick marks whose middles sit on it
  {
    const ticks = new Map<number, number[]>();
    for (let t = 0; t < v.count; t++) {
      const Lt = lenOf(t); if (Lt < 3 || Lt > 14) continue;
      const tx = (v.segs[t * 4 + 2] - v.segs[t * 4]) / Lt, ty = (v.segs[t * 4 + 3] - v.segs[t * 4 + 1]) / Lt;
      const mx = (v.segs[t * 4] + v.segs[t * 4 + 2]) / 2, my = (v.segs[t * 4 + 1] + v.segs[t * 4 + 3]) / 2;
      for (const j of near(v, [mx, my], 1.5)) {
        if (j === t) continue; const Lj = lenOf(j); if (Lj < 20) continue;
        const jx = (v.segs[j * 4 + 2] - v.segs[j * 4]) / Lj, jy = (v.segs[j * 4 + 3] - v.segs[j * 4 + 1]) / Lj;
        const cos = Math.abs(tx * jx + ty * jy); if (cos < 0.5 || cos > 0.87) continue;               // not slanted across it
        const c = closestOn([v.segs[j * 4], v.segs[j * 4 + 1]], [v.segs[j * 4 + 2], v.segs[j * 4 + 3]], [mx, my]);
        if (Math.hypot(c[0] - mx, c[1] - my) > 0.45) continue;
        const a = ticks.get(j); if (a) a.push(t); else ticks.set(j, [t]);
      }
    }
    // ticks are few and far apart; hatching crosses a wall line many times, and that is not a dimension
    ticks.forEach((ts, j) => {
      if (ts.length < 2 || ts.length > lenOf(j) / 30 + 2) return;
      // how many other lines END on this one? more than a couple means it is a wall face, not a dimension
      const A: Pt = [v.segs[j * 4], v.segs[j * 4 + 1]], B: Pt = [v.segs[j * 4 + 2], v.segs[j * 4 + 3]]; const L = lenOf(j); const seenK = new Set<number>(); let touch = 0;
      for (let d = 0; d <= L && touch <= 2; d += 10) {
        for (const k of near(v, [A[0] + ((B[0] - A[0]) * d) / L, A[1] + ((B[1] - A[1]) * d) / L], 6)) {
          if (k === j || seenK.has(k) || ts.includes(k)) continue; seenK.add(k);
          for (const e of [[v.segs[k * 4], v.segs[k * 4 + 1]], [v.segs[k * 4 + 2], v.segs[k * 4 + 3]]] as Pt[]) {
            const c = closestOn(A, B, e); if (Math.hypot(c[0] - e[0], c[1] - e[1]) > 0.4) continue;
            if (Math.hypot(c[0] - A[0], c[1] - A[1]) < 1 || Math.hypot(c[0] - B[0], c[1] - B[1]) < 1) continue;      // meeting at its own ends does not count
            touch++; break;
          }
        }
      }
      if (touch > 2) return;
      dash[j] = 1; for (const t of ts) dash[t] = 1;
    });
  }
  // line thicknesses worth trying on their own, heaviest first; the last one (0) is every line
  const tiers: number[] = [];
  if (v.wid) {
    const len = new Map<number, number>(); let total = 0;
    for (let i = 0; i < v.count; i++) { if (dash[i]) continue; const k = Math.round(v.wid[i] * 100) / 100; const l = lenOf(i); len.set(k, (len.get(k) || 0) + l); total += l; }
    let cum = 0; for (const wd of Array.from(len.keys()).sort((p, q) => q - p)) { cum += len.get(wd)!; if (cum > total * 0.03 && cum < total * 0.97 && wd > 0 && tiers.length < 3) tiers.push(wd); }
  }
  tiers.push(0);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (let i = 0; i < v.count * 4; i += 2) { const x = v.segs[i], y = v.segs[i + 1]; if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
  const p: FillPrep = { tiers, dash, bridges: new Map(), rasters: new Map(), box: [x1, y1, x2, y2] };
  prepCache.set(v, p); return p;
}
const usable = (v: SheetVectors, P: FillPrep, s: number, minW: number) => !P.dash[s] && !(minW > 0 && v.wid && v.wid[s] < minW - 0.005);

/** The missing pieces of wall: a straight bridge between two line ends that point at each other across a gap up to G. */
function bridgesOf(v: SheetVectors, P: FillPrep, minW: number, G: number): Float32Array {
  const k = minW + '|' + G; const hit = P.bridges.get(k); if (hit) return hit;
  // every end of every line long enough to be a wall face: where it is and which way it points on past its end
  const ex: number[] = [], ey: number[] = [], dx: number[] = [], dy: number[] = [];
  for (let s = 0; s < v.count; s++) {
    if (!usable(v, P, s, minW)) continue;
    const ax = v.segs[s * 4], ay = v.segs[s * 4 + 1], bx = v.segs[s * 4 + 2], by = v.segs[s * 4 + 3]; const L = Math.hypot(bx - ax, by - ay); if (L < 7) continue;
    ex.push(bx, ax); ey.push(by, ay); dx.push((bx - ax) / L, (ax - bx) / L); dy.push((by - ay) / L, (ay - by) / L);
  }
  const cell = Math.max(8, G); const grid = new Map<number, number[]>();
  for (let i = 0; i < ex.length; i++) { const kk = Math.floor(ex[i] / cell) * 100003 + Math.floor(ey[i] / cell); const g = grid.get(kk); if (g) g.push(i); else grid.set(kk, [i]); }
  const out: number[] = [];
  for (let i = 0; i < ex.length; i++) {
    let best = -1, bd = G + 0.01; const cx = Math.floor(ex[i] / cell), cy = Math.floor(ey[i] / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) for (const j of grid.get(gx * 100003 + gy) || []) {
      if (j === i || j === (i ^ 1)) continue;
      const qx = ex[j] - ex[i], qy = ey[j] - ey[i]; const dist = Math.hypot(qx, qy); if (dist < 1.5 || dist >= bd) continue;
      if ((qx * dx[i] + qy * dy[i]) / dist < 0.995) continue;                 // not straight ahead of this end
      if ((-qx * dx[j] - qy * dy[j]) / dist < 0.995) continue;                // the other end does not point back
      best = j; bd = dist;
    }
    if (best > i) out.push(ex[i], ey[i], ex[best], ey[best]);
    else if (best >= 0 && best < i) out.push(ex[best], ey[best], ex[i], ey[i]);
  }
  const arr = new Float32Array(out); P.bridges.set(k, arr); return arr;
}

function rasterOf(v: SheetVectors, P: FillPrep, minW: number, G: number, win: [number, number, number, number] | null): Raster | null {
  const [sx1, sy1, sx2, sy2] = P.box; if (!(sx2 > sx1) || !(sy2 > sy1)) return null;
  const x1 = win ? Math.max(sx1, win[0]) : sx1, y1 = win ? Math.max(sy1, win[1]) : sy1, x2 = win ? Math.min(sx2, win[2]) : sx2, y2 = win ? Math.min(sy2, win[3]) : sy2;
  if (!(x2 > x1) || !(y2 > y1)) return null;
  const whole = x1 <= sx1 && y1 <= sy1 && x2 >= sx2 && y2 >= sy2;
  const k = [minW, G, Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)].join('|'); const hit = P.rasters.get(k); if (hit) return hit;
  let res = 1; while (((x2 - x1) / res + 8) * ((y2 - y1) / res + 8) > 5_000_000) res *= 1.25;
  const x0 = x1 - 4 * res, y0 = y1 - 4 * res; const w = Math.ceil((x2 - x1) / res) + 8, h = Math.ceil((y2 - y1) / res) + 8;
  const wall = new Uint8Array(w * h);
  const line = (px: number, py: number, qx: number, qy: number) => {
    if (Math.max(px, qx) < x1 - 2 || Math.min(px, qx) > x2 + 2 || Math.max(py, qy) < y1 - 2 || Math.min(py, qy) > y2 + 2) return;
    const ax = (px - x0) / res, ay = (py - y0) / res, bx = (qx - x0) / res, by = (qy - y0) / res;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2));
    for (let i = 0; i <= n; i++) { const x = Math.floor(ax + ((bx - ax) * i) / n), y = Math.floor(ay + ((by - ay) * i) / n); if (x >= 0 && y >= 0 && x < w && y < h) wall[y * w + x] = 1; }
  };
  for (let s = 0; s < v.count; s++) if (usable(v, P, s, minW)) line(v.segs[s * 4], v.segs[s * 4 + 1], v.segs[s * 4 + 2], v.segs[s * 4 + 3]);
  if (G > 0) { const b = bridgesOf(v, P, minW, G); for (let i = 0; i < b.length; i += 4) line(b[i], b[i + 1], b[i + 2], b[i + 3]); }
  const r: Raster = { w, h, x0, y0, res, wall, grown: new Map(), whole };
  if (P.rasters.size > 14) P.rasters.clear();
  P.rasters.set(k, r); return r;
}
/** Every cell within d cells (square reach) of a set cell. */
function grow(src: Uint8Array, w: number, h: number, d: number): Uint8Array {
  const mid = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { const o = y * w; let last = -1e9; for (let x = 0; x < w; x++) { if (src[o + x]) last = x; if (x - last <= d) mid[o + x] = 1; } last = 1e9; for (let x = w - 1; x >= 0; x--) { if (src[o + x]) last = x; if (last - x <= d) mid[o + x] = 1; } }
  for (let x = 0; x < w; x++) { let last = -1e9; for (let y = 0; y < h; y++) { if (mid[y * w + x]) last = y; if (y - last <= d) out[y * w + x] = 1; } last = 1e9; for (let y = h - 1; y >= 0; y--) { if (mid[y * w + x]) last = y; if (last - y <= d) out[y * w + x] = 1; } }
  return out;
}
/** Straightens a traced outline (a closed ring): drops points within tol of the line between the points kept. */
function simplify(p: Pt[], tol: number): Pt[] {
  if (p.length < 4) return p;
  let far = 0, fd = -1;
  for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[0][0], p[i][1] - p[0][1]); if (d > fd) { fd = d; far = i; } }
  const q = [...p, p[0]]; const keep = new Uint8Array(q.length); keep[0] = 1; keep[far] = 1;
  const st: [number, number][] = [[0, far], [far, p.length]];
  while (st.length) {
    const [i, j] = st.pop()!; let m = -1, md = tol;
    for (let k = i + 1; k < j; k++) { const c = closestOn(q[i], q[j], q[k]); const d = Math.hypot(c[0] - q[k][0], c[1] - q[k][1]); if (d > md) { md = d; m = k; } }
    if (m > 0) { keep[m] = 1; st.push([i, m], [m, j]); }
  }
  return p.filter((_, i) => keep[i]);
}

/** One flood. d = 0 floods the lines as drawn (plus bridges); d > 0 first closes every gap up to 2d (the fallback). */
function fillOnce(v: SheetVectors, R: Raster, pt: Pt, d: number): { pts: Pt[]; area: number } | 'leak' | null {
  const { w, h, res } = R; let tx = Math.floor((pt[0] - R.x0) / res), ty = Math.floor((pt[1] - R.y0) / res);
  if (tx < 1 || ty < 1 || tx >= w - 1 || ty >= h - 1) return null;
  if (R.wall[ty * w + tx]) return null;                                // right on a line
  let g = R.wall;
  if (d > 0) {
    let c = R.grown.get(d);
    if (!c) { const fat = grow(R.wall, w, h, d); for (let i = 0; i < fat.length; i++) fat[i] = fat[i] ? 0 : 1; c = grow(fat, w, h, d); for (let i = 0; i < c.length; i++) c[i] = c[i] ? 0 : 1; R.grown.set(d, c); }
    g = c;
    if (g[ty * w + tx]) {
      let best = -1, bd = Infinity; const reach = 2 * d + 2;
      for (let y = Math.max(1, ty - reach); y <= Math.min(h - 2, ty + reach); y++) for (let x = Math.max(1, tx - reach); x <= Math.min(w - 2, tx + reach); x++) {
        if (g[y * w + x]) continue; const dd = (x - tx) * (x - tx) + (y - ty) * (y - ty); if (dd < bd) { bd = dd; best = y * w + x; }
      }
      if (best < 0) return null;
      tx = best % w; ty = (best - tx) / w;
    }
  }
  if (!fillSeen || fillSeen.length !== w * h) { fillSeen = new Uint8Array(w * h); fillStack = new Int32Array(w * h); } else fillSeen.fill(0);
  const seen = fillSeen, st = fillStack!; let n = 0, cells = 0; let bx1 = tx, bx2 = tx, by1 = ty, by2 = ty; const cap = R.whole ? w * h * 0.4 : Infinity;
  st[n++] = ty * w + tx; seen[ty * w + tx] = 1;
  while (n) {
    const c = st[--n]; cells++; const x = c % w, y = (c - x) / w;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || cells > cap) return 'leak';
    if (x < bx1) bx1 = x; if (x > bx2) bx2 = x; if (y < by1) by1 = y; if (y > by2) by2 = y;
    if (!g[c - 1] && !seen[c - 1]) { seen[c - 1] = 1; st[n++] = c - 1; }
    if (!g[c + 1] && !seen[c + 1]) { seen[c + 1] = 1; st[n++] = c + 1; }
    if (!g[c - w] && !seen[c - w]) { seen[c - w] = 1; st[n++] = c - w; }
    if (!g[c + w] && !seen[c + w]) { seen[c + w] = 1; st[n++] = c + w; }
  }
  if (cells < 12) return null;
  if (d > 0) {
    // the tight spots the closing covered (not lines themselves) go to whichever open space is nearest
    const m = 2 * d + 3; const wx1 = Math.max(1, bx1 - m), wy1 = Math.max(1, by1 - m), wx2 = Math.min(w - 2, bx2 + m), wy2 = Math.min(h - 2, by2 + m);
    const ww = wx2 - wx1 + 1, wh = wy2 - wy1 + 1; const lab = new Uint8Array(ww * wh); const q = new Int32Array(ww * wh); let qh = 0, qt = 0;
    for (let y = wy1; y <= wy2; y++) for (let x = wx1; x <= wx2; x++) { const c = y * w + x; if (!g[c]) { const i = (y - wy1) * ww + (x - wx1); lab[i] = seen[c] ? 1 : 2; q[qt++] = i; } }
    while (qh < qt) {
      const i = q[qh++]; const x = i % ww, y = (i - x) / ww; const l = lab[i];
      const tryCell = (nx: number, ny: number) => { if (nx < 0 || ny < 0 || nx >= ww || ny >= wh) return; const j = ny * ww + nx; if (lab[j]) return; if (R.wall[(ny + wy1) * w + nx + wx1]) return; lab[j] = l; q[qt++] = j; };
      tryCell(x - 1, y); tryCell(x + 1, y); tryCell(x, y - 1); tryCell(x, y + 1);
    }
    for (let i = 0; i < ww * wh; i++) if (lab[i] === 1) { const x = (i % ww) + wx1, y = Math.floor(i / ww) + wy1; seen[y * w + x] = 1; if (x < bx1) bx1 = x; if (x > bx2) bx2 = x; if (y < by1) by1 = y; if (y > by2) by2 = y; }
  }
  const ox = Math.max(0, bx1 - 2), oy = Math.max(0, by1 - 2); const ww = Math.min(w, bx2 + 3) - ox, wh = Math.min(h, by2 + 3) - oy;
  const full = new Uint8Array(ww * wh); for (let y = by1; y <= by2; y++) for (let x = bx1; x <= bx2; x++) if (seen[y * w + x]) full[(y - oy) * ww + (x - ox)] = 1;
  let sx = -1, sy = -1; for (let i = 0; i < ww * wh; i++) if (full[i]) { sx = i % ww; sy = (i - sx) / ww; break; }
  if (sx < 0) return null;
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < ww && y < wh && full[y * ww + x] === 1;
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const L = [[0, -1], [0, 0], [-1, 0], [-1, -1]], Rr = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
  // walk the outside edge, keeping the filled cells on the right
  const ring: Pt[] = [[sx, sy]]; let x = sx, y = sy, dir = 0, steps = 0;
  do {
    let nd = dir;
    if (at(x + L[dir][0], y + L[dir][1])) nd = (dir + 3) % 4; else if (!at(x + Rr[dir][0], y + Rr[dir][1])) nd = (dir + 1) % 4;
    if (nd !== dir) { ring.push([x, y]); dir = nd; }
    x += DX[dir]; y += DY[dir];
  } while (++steps < 2_000_000 && !(x === sx && y === sy));
  if (ring.length < 3) return null;
  let pts = simplify(ring.map((p) => [R.x0 + (p[0] + ox) * res, R.y0 + (p[1] + oy) * res] as Pt), 1.6 * res);
  pts = pts.map((p) => { const sn = snapPoint(v, p, 3.2 * res); return sn.kind === 'corner' ? sn.pt : p; });   // onto the drawing's own corners
  pts = pts.filter((p, i) => { const q = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5; });
  pts = simplify(pts, 0.8 * res);
  return pts.length < 3 ? null : { pts, area: polyArea(pts) };
}

/**
 * Tap inside a space (a room, a slab, paving): every sensible outline around the tap, biggest first, and which one to
 * show first. Heavy lines are tried alone first, because walls are drawn heavy and notes thin; doorways are closed by
 * bridging wall ends that face each other, narrow openings first.
 */
export function fillOptions(v: SheetVectors | null, pt: Pt): { options: { pts: Pt[]; area: number }[]; pick: number } | null {
  if (!v) return null;
  const P = prepOf(v); if (!(P.box[2] > P.box[0])) return null;
  const big = (r: ReturnType<typeof fillOptionsAt>) => !!r && r.options[0].area >= 300;
  const first = fillOptionsAt(v, P, pt); if (big(first)) return first;
  // the tap is on lettering or inside a little tag box: look just beside it
  for (const reach of [16, 32]) for (let a = 0; a < 8; a++) {
    const r = fillOptionsAt(v, P, [pt[0] + Math.cos((a * Math.PI) / 4) * reach, pt[1] + Math.sin((a * Math.PI) / 4) * reach]);
    if (big(r)) return r;
  }
  return first;
}
function fillOptionsAt(v: SheetVectors, P: FillPrep, pt: Pt): { options: { pts: Pt[]; area: number }[]; pick: number } | null {
  type Opt = { pts: Pt[]; area: number; tier: number };
  const run = (win: [number, number, number, number] | null): Opt[] => {
    const found: Opt[] = []; const add = (f: { pts: Pt[]; area: number }, tier: number) => { if (!found.some((o) => Math.abs(o.area - f.area) < Math.max(o.area, f.area) * 0.04)) found.push({ ...f, tier }); };
    P.tiers.forEach((t, ti) => {
      for (const G of GAPS) { const R = rasterOf(v, P, t, G, win); if (!R) continue; const f = fillOnce(v, R, pt, 0); if (f === null) break; if (f !== 'leak') add(f, ti); }
    });
    if (!found.length) P.tiers.forEach((t, ti) => {                    // nothing by bridging: thicken the lines instead
      const R = rasterOf(v, P, t, 0, win); if (!R) return;
      for (const d of CLOSE_LEVELS) { const f = fillOnce(v, R, pt, d); if (f === null) break; if (f !== 'leak') add(f, ti); }
    });
    return found;
  };
  // only the part of the sheet around the tap; the whole sheet if the space is bigger than that
  const c: Pt = [Math.round(pt[0] / 300) * 300, Math.round(pt[1] / 300) * 300];
  let found = run([c[0] - 750, c[1] - 750, c[0] + 750, c[1] + 750]);
  if (!found.length) found = run(null);
  if (!found.length) return null;
  // outlines made by the heaviest lines (walls) come first; thinner lines are only used when those give no choice
  const top = Math.min(...found.map((o) => o.tier));
  { const main = found.filter((o) => o.tier === top); if (main.length >= 2) found = main; }
  found.sort((p, q) => q.area - p.area);
  // show first: the smallest tidy outline (few corners, fills most of its own box, not a sliver); otherwise the biggest
  let pick = 0;
  found.forEach((o, i) => {
    if (o.tier !== top) return;
    const xs = o.pts.map((p) => p[0]), ys = o.pts.map((p) => p[1]); const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    if (o.pts.length <= 14 && Math.min(bw, bh) >= 10 && o.area >= bw * bh * 0.55 && o.area >= Math.max(700, found[0].area * 0.04)) pick = i;
  });
  return { options: found, pick };
}
