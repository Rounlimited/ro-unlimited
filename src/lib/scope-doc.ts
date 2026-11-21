/**
 * Scope of Work as a structured document.
 *
 * The scope is stored as editor HTML (estimates.project_description). This
 * file turns that HTML into numbered sections, paragraphs and real tables so
 * the customer page, the admin screens and the PDF all lay it out the same
 * way. Pure string work, no DOM, so it runs on the server (PDF) and in the
 * browser alike.
 */

export type ScopeRow = { cells: string[]; group?: boolean };       // cells are inline HTML
export type ScopeTable = { head: string[] | null; rows: ScopeRow[]; cols: number };
export type ScopeBlock =
  | { kind: 'html'; html: string }
  | { kind: 'sub'; html: string }                                   // a sub-heading inside a section
  | { kind: 'table'; table: ScopeTable };
export type ScopeSection = { id: string; title: string | null; blocks: ScopeBlock[] };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', deg: '°', times: '×', frac12: '½', frac14: '¼', frac34: '¾' };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Visible text of a piece of HTML (line breaks kept as \n). */
export function scopeText(html: string): string {
  return decodeEntities(
    (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
      .replace(/<\/(td|th)>/gi, '\t')
      .replace(/<[^>]+>/g, ''),
  ).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ── Cleaning ─────────────────────────────────────────────────────
   Whatever is pasted (Word, Google Docs, a web page, the AI) is cut down
   to the handful of tags a scope needs. Everything else loses its tag and
   keeps its words. */

const RENAME: Record<string, string> = { b: 'strong', i: 'em', h1: 'h2', h4: 'h3', h5: 'h3', h6: 'h3', strike: 's', del: 's' };
const KEEP = new Set(['p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'br', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td']);
const DROP_WITH_CONTENT = ['script', 'style', 'head', 'title', 'colgroup', 'svg', 'object', 'iframe', 'noscript', 'xml', 'template'];

export function cleanScopeHtml(input: string): string {
  let html = String(input || '');
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<!doctype[^>]*>/gi, '');
  for (const t of DROP_WITH_CONTENT) html = html.replace(new RegExp(`<${t}\\b[\\s\\S]*?<\\/${t}>`, 'gi'), '');
  html = html.replace(/<\/?(o|w|v|m|st1):[^>]*>/gi, '');

  html = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_m, slash: string, rawTag: string, attrs: string) => {
    let tag = rawTag.toLowerCase();
    tag = RENAME[tag] || tag;
    if (!KEEP.has(tag)) {
      // block-ish wrappers become a break so their words don't run together
      return /^(div|section|article|header|footer|figure|figcaption|dd|dt|caption)$/.test(tag) ? (slash ? '<br>' : '') : '';
    }
    if (slash) return tag === 'br' ? '' : `</${tag}>`;
    if (tag === 'br') return '<br>';
    if (tag === 'a') {
      const href = (attrs.match(/href\s*=\s*"([^"]*)"/i) || attrs.match(/href\s*=\s*'([^']*)'/i) || [])[1] || '';
      return /^(https?:|mailto:|tel:)/i.test(href.trim()) ? `<a href="${href.trim().replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">` : '<a>';
    }
    if (tag === 'td' || tag === 'th') {
      const cs = Number((attrs.match(/colspan\s*=\s*["']?(\d+)/i) || [])[1]) || 1;
      const rs = Number((attrs.match(/rowspan\s*=\s*["']?(\d+)/i) || [])[1]) || 1;
      return `<${tag}${cs > 1 ? ` colspan="${Math.min(cs, 20)}"` : ''}${rs > 1 ? ` rowspan="${Math.min(rs, 50)}"` : ''}>`;
    }
    return `<${tag}>`;
  });

  return html
    .replace(/<a>([\s\S]*?)<\/a>/g, '$1')
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .replace(/<(p|h2|h3|li|strong|em|u|s|blockquote)>\s*(<br>\s*)*<\/\1>/g, '')
    .replace(/ /g, ' ')
    .trim();
}

/* ── Parsing ──────────────────────────────────────────────────────── */

type Top = { tag: string | null; html: string; inner: string };

/** Splits HTML into its top-level elements (loose text becomes a paragraph). */
function topLevel(html: string): Top[] {
  const out: Top[] = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  const VOID = new Set(['br', 'hr', 'img', 'col', 'input', 'meta', 'link']);
  const INLINE = /^(strong|em|u|s|a|span|b|i|code|sub|sup|mark|small)$/;
  let depth = 0;
  let start = 0;        // start of the element being collected
  let innerStart = 0;
  let openTag = '';
  let last = 0;         // end of the last finished top-level piece
  let m: RegExpExecArray | null;
  const loose = (s: string) => { if (scopeText(s)) out.push({ tag: null, html: `<p>${s.trim()}</p>`, inner: s.trim() }); };
  while ((m = re.exec(html))) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (VOID.has(tag) || m[3] === '/' || INLINE.test(tag)) continue;   // inline tags never open or close a block
    if (!closing) {
      if (depth === 0) {
        loose(html.slice(last, m.index));
        start = m.index; innerStart = re.lastIndex; openTag = tag;
      }
      depth += 1;
    } else if (depth > 0) {
      depth -= 1;
      if (depth === 0) {
        out.push({ tag: openTag, html: html.slice(start, re.lastIndex), inner: html.slice(innerStart, m.index) });
        last = re.lastIndex;
      }
    }
  }
  if (depth > 0) out.push({ tag: openTag, html: html.slice(start), inner: html.slice(innerStart) });
  else loose(html.slice(last));
  return out;
}

const cellInline = (inner: string) =>
  inner
    .replace(/<\/p>\s*<p[^>]*>/gi, '<br>')
    .replace(/<\/?(p|div)[^>]*>/gi, '')
    .replace(/<\/li>\s*<li[^>]*>/gi, '<br>')
    .replace(/<\/?(ul|ol|li|h[1-6]|blockquote)[^>]*>/gi, '')
    .replace(/^(\s*<br>\s*)+|(\s*<br>\s*)+$/g, '')
    .trim();

export function parseTable(tableHtml: string): ScopeTable | null {
  const rowsRaw = tableHtml.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  if (!rowsRaw.length) return null;
  type Raw = { cells: { html: string; th: boolean; cs: number }[] };
  const raw: Raw[] = rowsRaw.map((r) => {
    const cells: Raw['cells'] = [];
    const cre = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let c: RegExpExecArray | null;
    while ((c = cre.exec(r))) {
      cells.push({ html: cellInline(c[3]), th: c[1].toLowerCase() === 'th', cs: Number((c[2].match(/colspan\s*=\s*["']?(\d+)/i) || [])[1]) || 1 });
    }
    return { cells };
  }).filter((r) => r.cells.length);
  if (!raw.length) return null;
  const cols = Math.max(...raw.map((r) => r.cells.reduce((n, c) => n + c.cs, 0)));
  if (cols < 1) return null;

  const toRow = (r: Raw): ScopeRow => {
    if (r.cells.length === 1 && cols > 1) return { cells: [r.cells[0].html], group: true };
    const cells: string[] = [];
    for (const c of r.cells) { cells.push(c.html); for (let i = 1; i < c.cs; i++) cells.push(''); }
    while (cells.length < cols) cells.push('');
    return { cells: cells.slice(0, cols) };
  };

  let head: string[] | null = null;
  let body = raw;
  const first = raw[0];
  const firstFull = first.cells.length === cols || first.cells.reduce((n, c) => n + c.cs, 0) === cols;
  if (firstFull && first.cells.length > 1 && raw.length > 1) {
    const allTh = first.cells.every((c) => c.th);
    // A pasted Word/Docs table has no <th>: short label-like cells with no bare numbers read as a header.
    const looksLikeHead = first.cells.every((c) => {
      const t = scopeText(c.html);
      return t.length > 0 && t.length <= 40 && !/^[\d\s.,$%/()-]+$/.test(t);
    }) && raw.slice(1).some((r) => r.cells.some((c) => scopeText(c.html).length > 40 || /\d/.test(scopeText(c.html))));
    if (allTh || looksLikeHead) { head = toRow(first).cells; body = raw.slice(1); }
  }
  const rows = body.map(toRow).filter((r) => r.cells.some((c) => scopeText(c)));
  if (!rows.length && !head) return null;
  return { head, rows, cols };
}

const stripNumber = (t: string) => t.replace(/^\s*(?:section\s+)?\d{1,2}\s*[.):-]\s+/i, '').trim();

/** The scope as sections. A scope with no headings comes back as one untitled section. */
export function parseScope(html: string): ScopeSection[] {
  const src = String(html || '').trim();
  if (!src || !scopeText(src)) return [];
  const sections: ScopeSection[] = [];
  let cur: ScopeSection | null = null;
  const section = (title: string | null) => { cur = { id: `scope-${sections.length + 1}`, title, blocks: [] }; sections.push(cur); return cur; };
  const push = (b: ScopeBlock) => {
    const s = cur || section(null);
    const lastB = s.blocks[s.blocks.length - 1];
    if (b.kind === 'html' && lastB && lastB.kind === 'html') lastB.html += b.html;
    else s.blocks.push(b);
  };

  for (const el of topLevel(src)) {
    if (el.tag === 'h1' || el.tag === 'h2') {
      const title = stripNumber(scopeText(el.inner).replace(/\s+/g, ' '));
      if (title) section(title);
      continue;
    }
    if (el.tag && /^h[3-6]$/.test(el.tag)) { if (scopeText(el.inner)) push({ kind: 'sub', html: el.inner.replace(/<\/?(p|div)[^>]*>/gi, '') }); continue; }
    if (el.tag === 'table') {
      const table = parseTable(el.html);
      if (table) push({ kind: 'table', table });
      continue;
    }
    if (!scopeText(el.html)) continue;
    push({ kind: 'html', html: el.html });
  }
  return sections.filter((s) => s.title || s.blocks.length);
}

export function scopeStats(html: string): { sections: number; tables: number; words: number } {
  const sections = parseScope(html);
  return {
    sections: sections.filter((s) => s.title).length,
    tables: sections.reduce((n, s) => n + s.blocks.filter((b) => b.kind === 'table').length, 0),
    words: scopeText(html).split(/\s+/).filter(Boolean).length,
  };
}

/**
 * A table pasted into a box that has no tables arrives as one value per
 * line ("4 ton" / "each" / "York" / "ZYG05D" ...). A long run of very short
 * paragraphs is the tell.
 */
export function looksScrambled(html: string): boolean {
  if (!html) return false;
  const lines: string[] = [];
  for (const el of topLevel(html)) {
    if (el.tag === 'p' || el.tag === null) {
      for (const part of el.inner.split(/<br\s*\/?>/i)) { const t = scopeText(part); if (t) lines.push(t); }
    } else lines.push('#break#'.repeat(4));
  }
  let run = 0; let best = 0;
  for (const l of lines) { if (l.length <= 18) { run += 1; best = Math.max(best, run); } else run = 0; }
  return best >= 14;
}

/** Long enough, or flat enough, that organizing it would clearly help. */
export function couldUseOrganizing(html: string): boolean {
  const st = scopeStats(html);
  return st.words >= 220 && st.sections === 0;
}
