/**
 * NexaBids report: a real PDF file made on the phone. Page one is the quantity list (with prices if asked for);
 * after it comes one page for every sheet that has marks, showing the sheet with the marks drawn on it and a key.
 * Written by hand (a PDF is plain text plus the pictures), so nothing extra has to be downloaded to make it.
 */
import { bidTotals, fmtQty, itemCost, itemQuantity, money, type TakeoffData, type TakeoffItem } from './takeoff';

type Img = { jpeg: Uint8Array; w: number; h: number };
const ascii = (s: string) => String(s ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e]/g, '?');
const esc = (s: string) => ascii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const hexRgb = (hex: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); const n = m ? parseInt(m[1], 16) : 0x888888; return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => v.toFixed(3)).join(' '); };

/** One sheet as a picture with the marks drawn on it. `k` turns sheet points into picture pixels. */
export function drawMarks(ctx: CanvasRenderingContext2D, items: TakeoffItem[], page: number, k: number, numbers: Map<string, number>) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const it of items) {
    const n = numbers.get(it.id);
    for (const s of it.shapes) {
      if (s.page !== page || !s.pts.length) continue;
      ctx.strokeStyle = it.color; ctx.fillStyle = it.color;
      if (it.kind === 'count') {
        for (const p of s.pts) { ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(p[0] * k, p[1] * k, 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      } else {
        ctx.beginPath(); s.pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * k, p[1] * k) : ctx.moveTo(p[0] * k, p[1] * k)));
        if (it.kind === 'area') { ctx.closePath(); ctx.globalAlpha = s.minus ? 0.45 : 0.28; ctx.fillStyle = s.minus ? '#000' : it.color; ctx.fill(); ctx.globalAlpha = 1; }
        ctx.lineWidth = 4; if (s.minus) ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]);
      }
      // the item's number, on a white tag, at the middle of the shape
      if (n) {
        const cx = (s.pts.reduce((t, p) => t + p[0], 0) / s.pts.length) * k, cy = (s.pts.reduce((t, p) => t + p[1], 0) / s.pts.length) * k - (it.kind === 'count' ? 22 : 0);
        const label = String(n); ctx.font = 'bold 22px sans-serif'; const tw = ctx.measureText(label).width + 12;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = it.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(cx - tw / 2, cy - 14, tw, 28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, cy + 1);
      }
    }
  }
}

export async function buildReport(opts: {
  name: string; company?: string; data: TakeoffData; withPrices: boolean; pages: number;
  sheetLabel: (p: number) => string; sheetImage: (p: number, numbers: Map<string, number>) => Promise<Img | null>; onStep?: (text: string) => void;
}): Promise<Blob> {
  const { data } = opts;
  const chunks: (Uint8Array | string)[] = []; const offsets: number[] = []; let pos = 0; const enc = new TextEncoder();
  const put = (c: Uint8Array | string) => { const b = typeof c === 'string' ? enc.encode(c) : c; chunks.push(b); pos += b.length; };
  let nObj = 0; const reserve = () => ++nObj;
  const obj = (id: number, body: string, stream?: Uint8Array) => { offsets[id] = pos; put(`${id} 0 obj\n${body}\n`); if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); } put('endobj\n'); };
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const catalog = reserve(), pagesId = reserve(), font = reserve(), bold = reserve();
  const kids: number[] = [];
  const addPage = (w: number, h: number, content: string, xobj?: { id: number }) => {
    const c = reserve(), p = reserve(); const bytes = enc.encode(content);
    obj(c, `<< /Length ${bytes.length} >>`, bytes);
    obj(p, `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${w} ${h}] /Contents ${c} 0 R /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >>${xobj ? ` /XObject << /Im0 ${xobj.id} 0 R >>` : ''} >> >>`);
    kids.push(p);
  };
  const text = (x: number, y: number, size: number, s: string, b = false, rgb = '0 0 0') => `BT /${b ? 'F2' : 'F1'} ${size} Tf ${rgb} rg ${x.toFixed(1)} ${y.toFixed(1)} Td (${esc(s)}) Tj ET\n`;
  const right = (x: number, y: number, size: number, s: string, b = false) => text(x - ascii(s).length * size * 0.6, y, size, s, b);

  // every item gets a number, used in the list and on the sheets
  const live = data.items.filter((it) => itemCost(it, data.scales).qty > 0 || it.shapes.length);
  const numbers = new Map<string, number>(); live.forEach((it, i) => numbers.set(it.id, i + 1));

  /* ── the quantity list ── */
  const W = 612, H = 792, L = 40; const b = bidTotals(data);
  type Row = { kind: 'head' | 'item' | 'part' | 'gap'; cells: string[] };
  const rows: Row[] = []; let group = '\u0000';
  for (const it of live) {
    const g = it.alt ? 'Alternates (not in the base bid)' : it.group || 'Other';
    if (g !== group) { if (rows.length) rows.push({ kind: 'gap', cells: [] }); rows.push({ kind: 'head', cells: [g] }); group = g; }
    const c = itemCost(it, data.scales); const from = it.shapes.length ? 'measured' : it.printedNote ? 'from plans' : 'typed';
    rows.push({ kind: 'item', cells: [String(numbers.get(it.id)), it.name, fmtQty(c.qty, it.unit), it.unit, opts.withPrices && it.unitCost ? money(it.unitCost) : '', opts.withPrices && c.main ? money(c.main) : '', from] });
    for (const p of c.parts) if (p.quantity > 0) rows.push({ kind: 'part', cells: ['', '  ' + p.name, String(Math.round(p.quantity * 100) / 100), p.unit || 'EA', opts.withPrices && p.unitCost ? money(p.unitCost) : '', opts.withPrices && p.total ? money(p.total) : '', ''] });
    if (c.hours > 0) rows.push({ kind: 'part', cells: ['', '  Labor', String(c.hours), 'HR', opts.withPrices && c.laborRate ? money(c.laborRate) : '', opts.withPrices && c.labor ? money(c.labor) : '', ''] });
  }
  const nameW = opts.withPrices ? 40 : 58;
  const cols = opts.withPrices ? { n: L, name: L + 24, qty: 372, unit: 380, price: 478, total: 572 } : { n: L, name: L + 24, qty: 470, unit: 478, price: 0, total: 0 };
  let content = ''; let y = 0; let pageNo = 0;
  const startPage = () => {
    pageNo++; content = '';
    content += text(L, H - 50, 16, opts.name.slice(0, 54), true);
    content += text(L, H - 68, 9, `${opts.company ? opts.company + '  |  ' : ''}Quantity report  |  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  |  page ${pageNo}`, false, '0.35 0.35 0.35');
    y = H - 96;
    content += text(cols.n, y, 8, '#', true) + text(cols.name, y, 8, 'ITEM', true) + right(cols.qty, y, 8, 'QUANTITY', true) + text(cols.unit, y, 8, 'UNIT', true);
    if (opts.withPrices) content += right(cols.price, y, 8, 'PRICE', true) + right(cols.total, y, 8, 'TOTAL', true); else content += text(520, y, 8, 'SOURCE', true);
    content += `0.6 G 0.5 w ${L} ${y - 4} m ${W - L} ${y - 4} l S\n`; y -= 18;
  };
  const endPage = () => addPage(W, H, content);
  startPage();
  for (const r of rows) {
    if (y < 70) { endPage(); startPage(); }
    if (r.kind === 'gap') { y -= 6; continue; }
    if (r.kind === 'head') { content += text(L, y, 10, r.cells[0].slice(0, 70).toUpperCase(), true, '0.45 0.33 0.05'); y -= 15; continue; }
    const sz = r.kind === 'item' ? 9 : 8; const c = r.cells;
    content += text(cols.n, y, sz, c[0], true) + text(cols.name, y, sz, c[1].slice(0, nameW)) + right(cols.qty, y, sz, c[2], r.kind === 'item') + text(cols.unit, y, sz, c[3]);
    if (opts.withPrices) content += right(cols.price, y, sz, c[4]) + right(cols.total, y, sz, c[5]); else if (c[6]) content += text(520, y, 7, c[6], false, '0.4 0.4 0.4');
    y -= r.kind === 'item' ? 14 : 12;
  }
  if (!rows.length) { content += text(L, y, 10, 'Nothing has been measured or priced yet.'); y -= 16; }
  if (opts.withPrices && b.cost > 0) {
    if (y < 150) { endPage(); startPage(); }
    y -= 8; content += `0.6 G 0.5 w 330 ${y + 8} m ${W - L} ${y + 8} l S\n`;
    const line = (label: string, v: number, bd = false) => { content += right(cols.price, y, bd ? 11 : 9, label, bd) + right(cols.total, y, bd ? 11 : 9, money(v), bd); y -= bd ? 18 : 14; };
    line('Cost of the work', b.cost);
    if (b.overhead) line(`Overhead ${b.pricing.overheadPct}%`, b.overhead);
    if (b.profit) line(`Profit ${b.pricing.profitPct}%`, b.profit);
    if (b.contingency) line(`Contingency ${b.pricing.contingencyPct}%`, b.contingency);
    line('Bid price', b.price, true);
    if (b.hours > 0) { content += right(cols.total, y, 8, `Labor in this bid: ${Math.round(b.hours).toLocaleString()} hours`); y -= 12; }
    for (const a of b.alternates) { content += right(cols.total, y, 8, `Alternate, add: ${a.name.slice(0, 40)}  ${money(a.price)}`); y -= 12; }
  }
  content += text(L, 36, 7, 'Quantities were measured from the plan sheets named in this report. Check them against the plans before ordering or pricing.', false, '0.4 0.4 0.4');
  endPage();

  /* ── one page per sheet that has marks ── */
  const marked = Array.from(new Set(live.flatMap((it) => it.shapes.map((s) => s.page)))).filter((p) => p >= 1 && p <= opts.pages).sort((a, b2) => a - b2);
  for (let i = 0; i < marked.length; i++) {
    const p = marked[i]; opts.onStep?.(`Drawing sheet ${i + 1} of ${marked.length}…`);
    const img = await opts.sheetImage(p, numbers); if (!img) continue;
    const im = reserve(); obj(im, `<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>`, img.jpeg);
    const PW = 792, PH = 612; const here = live.filter((it) => it.shapes.some((s) => s.page === p));
    const keyRows = Math.ceil(here.length / 2); const keyH = Math.min(150, 20 + keyRows * 11); const top = 34;
    const availW = PW - 40, availH = PH - top - keyH - 14; const sc = Math.min(availW / img.w, availH / img.h); const dw = img.w * sc, dh = img.h * sc;
    let c = text(20, PH - 22, 11, `${opts.sheetLabel(p) || 'Sheet ' + p}`.slice(0, 80), true) + right(PW - 20, PH - 22, 8, `${opts.name.slice(0, 40)}  |  sheet ${p} of ${opts.pages}`);
    c += `q ${dw.toFixed(1)} 0 0 ${dh.toFixed(1)} ${((PW - dw) / 2).toFixed(1)} ${(keyH + 8 + (availH - dh) / 2).toFixed(1)} cm /Im0 Do Q\n`;
    here.slice(0, 24).forEach((it, j) => {
      const col = j % 2, rowI = Math.floor(j / 2); const x = 20 + col * 380, yy = keyH - 8 - rowI * 11;
      const onPage: TakeoffItem = { ...it, shapes: it.shapes.filter((s) => s.page === p), printedQty: undefined, times: undefined };
      const q = itemQuantity(onPage, data.scales);
      c += `${hexRgb(it.color)} rg ${x} ${yy - 1} 8 8 re f\n` + text(x + 12, yy, 8, `${numbers.get(it.id)}  ${it.name.slice(0, 38)}`, true) + right(x + 360, yy, 8, `${fmtQty(q.quantity, it.unit)} ${it.unit} on this sheet`);
    });
    addPage(PW, PH, c, { id: im });
  }

  obj(font, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  obj(bold, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');
  obj(pagesId, `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`);
  obj(catalog, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  const xref = pos; put(`xref\n0 ${nObj + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= nObj; i++) put(String(offsets[i] || 0).padStart(10, '0') + ' 00000 n \n');
  put(`trailer\n<< /Size ${nObj + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks.map((c) => (typeof c === 'string' ? enc.encode(c) : c)) as BlobPart[], { type: 'application/pdf' });
}
