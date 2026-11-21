'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ListTree } from 'lucide-react';
import { cleanScopeHtml, parseScope, scopeText, type ScopeBlock, type ScopeSection, type ScopeTable } from '@/lib/scope-doc';

/**
 * The Scope of Work, laid out as a document instead of one long run of text:
 * numbered sections you can jump between, and real tables. On a phone a wide
 * table turns into one card per row (label beside value) so nothing runs off
 * the side of the screen.
 *
 * `theme="light"` is the customer's page, `theme="dark"` the admin screens.
 */
type Theme = 'light' | 'dark';

const T = {
  light: {
    text: 'text-gray-700', strong: '[&_strong]:text-gray-900', sub: 'text-gray-900',
    title: 'text-gray-900', badge: 'bg-[#C9A84C] text-black', rule: 'border-gray-200',
    chip: 'bg-gray-100 text-gray-800 border-gray-200 active:bg-gray-200', chipNum: 'text-[#9a7b1f]',
    th: 'bg-[#f5f2ed] text-gray-900', td: 'text-gray-700', tBorder: 'border-gray-200', zebra: 'even:bg-gray-50/70',
    group: 'bg-gray-100 text-gray-900', card: 'bg-white border-gray-200', label: 'text-gray-500', link: '[&_a]:text-[#9a7b1f]',
    muted: 'text-gray-500', quote: '[&_blockquote]:border-gray-300',
    bar: 'bg-white/95 border-gray-200', chipOn: 'bg-[#C9A84C] text-black border-[#C9A84C]',
  },
  dark: {
    text: 'text-white/80', strong: '[&_strong]:text-white', sub: 'text-white',
    title: 'text-white', badge: 'bg-[#C9A84C] text-black', rule: 'border-white/10',
    chip: 'bg-white/5 text-white/85 border-white/15 active:bg-white/10', chipNum: 'text-[#D4B965]',
    th: 'bg-white/10 text-white', td: 'text-white/80', tBorder: 'border-white/12', zebra: 'even:bg-white/[0.03]',
    group: 'bg-white/10 text-white', card: 'bg-white/[0.03] border-white/12', label: 'text-white/55', link: '[&_a]:text-[#D4B965]',
    muted: 'text-white/55', quote: '[&_blockquote]:border-white/25',
    bar: 'bg-[#0d0d0d]/95 border-white/15', chipOn: 'bg-[#C9A84C] text-black border-[#C9A84C]',
  },
} as const;

const RICH = '[&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1.5 [&_li>p]:mb-0 [&_ul_ul]:mt-1.5 [&_ul_ul]:mb-0 [&_strong]:font-semibold [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:my-3 break-words';

export default function ScopeView({ html, theme = 'light', size = 15, className = '' }: { html: string; theme?: Theme; size?: number; className?: string }) {
  const sections = useMemo(() => parseScope(cleanScopeHtml(html)), [html]);
  const t = T[theme];
  const titled = sections.filter((s) => s.title);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [stickTop, setStickTop] = useState(0);      // where the page's own fixed header ends, so the bar sits just under it
  const [barH, setBarH] = useState(60);
  const [active, setActive] = useState('');
  const showBar = titled.length >= 3;

  // The section bar stays at the top of the screen while the reader is inside the scope, and marks the
  // section being read. The page above it may have its own fixed header; its height is measured, not assumed.
  useEffect(() => {
    if (!showBar) return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const headerBottom = () => {
      let top = 0;
      for (const x of [window.innerWidth / 2, 24, window.innerWidth - 24]) {
        let y = 2;
        for (let k = 0; k < 5; k++) {
          const el = document.elementFromPoint(x, y);
          if (!el || root.contains(el)) break;
          let p: Element | null = el; let hit: Element | null = null;
          while (p && p !== document.body) {
            const pos = getComputedStyle(p).position;
            if (pos === 'fixed' || pos === 'sticky') hit = p;
            p = p.parentElement;
          }
          if (!hit) break;
          const b = hit.getBoundingClientRect().bottom;
          if (b <= y || b > window.innerHeight * 0.35) break;
          top = Math.max(top, b); y = b + 2;
        }
      }
      return Math.round(top);
    };
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const top = headerBottom();
      setStickTop((v) => (Math.abs(v - top) > 1 ? top : v));
      const h = barRef.current?.offsetHeight || 60;
      setBarH((v) => (Math.abs(v - h) > 1 ? h : v));
      const line = top + h + 28;
      let cur = '';
      for (const el of Array.from(root.querySelectorAll<HTMLElement>('section[data-scope-section]'))) {
        if (el.getBoundingClientRect().top <= line) cur = el.id; else break;
      }
      setActive((v) => (v === cur ? v : cur));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll); };
  }, [showBar, sections.length]);

  // Keep the chip for the section being read in view inside the bar.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !active) return;
    const chip = row.querySelector<HTMLElement>('[data-chip="' + active + '"]');
    if (chip) row.scrollTo({ left: Math.max(0, chip.offsetLeft - 16), behavior: 'smooth' });
  }, [active]);

  if (!sections.length) return null;

  const jump = (id: string) => {
    setClosed((c) => ({ ...c, [id]: false }));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const allClosed = titled.length > 0 && titled.every((s) => closed[s.id]);
  let n = 0;

  return (
    <div ref={rootRef} className={`${t.text} ${className}`} style={{ fontSize: size, lineHeight: 1.65 }}>
      {showBar && (
        <>
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide ${t.muted}`}>
              <ListTree size={15} /> {titled.length} sections
            </span>
            <button type="button" className={`text-[14px] font-semibold underline underline-offset-2 min-h-[44px] px-1 ${t.muted}`}
              onClick={() => setClosed(Object.fromEntries(titled.map((s) => [s.id, !allClosed])))}>
              {allClosed ? 'Open all' : 'Close all'}
            </button>
          </div>
          <div ref={barRef} className={`sticky z-20 -mx-2 px-2 py-2 mb-4 border-b backdrop-blur ${t.bar}`} style={{ top: stickTop }}>
            <div ref={rowRef} className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {titled.map((s, i) => (
                <button key={s.id} type="button" data-chip={s.id} onClick={() => jump(s.id)} aria-current={active === s.id ? 'true' : undefined}
                  className={`shrink-0 max-w-[240px] min-h-[44px] px-3.5 rounded-full border text-[14px] font-medium flex items-center gap-2 transition-colors ${active === s.id ? t.chipOn : t.chip}`}>
                  <span className={`font-bold ${active === s.id ? '' : t.chipNum}`}>{i + 1}</span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-6">
        {sections.map((s) => {
          const num = s.title ? ++n : 0;
          const isClosed = !!closed[s.id];
          return (
            <section key={s.id} id={s.id} data-scope-section="" style={{ scrollMarginTop: (showBar ? stickTop + barH : 0) + 12 }}>
              {s.title && (
                <button type="button" aria-expanded={!isClosed}
                  onClick={() => setClosed((c) => ({ ...c, [s.id]: !c[s.id] }))}
                  className={`w-full flex items-center gap-3 text-left min-h-[48px] pb-2 mb-3 border-b ${t.rule}`}>
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[15px] font-bold ${t.badge}`}>{num}</span>
                  <span className={`flex-1 font-semibold leading-snug ${t.title}`} style={{ fontSize: size + 3 }}>{s.title}</span>
                  <ChevronDown size={20} className={`shrink-0 transition-transform ${t.muted} ${isClosed ? '-rotate-90' : ''}`} />
                </button>
              )}
              {!isClosed && (
                <div className="space-y-4">
                  {s.blocks.map((b, i) => <Block key={i} block={b} theme={theme} size={size} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Block({ block, theme, size }: { block: ScopeBlock; theme: Theme; size: number }) {
  const t = T[theme];
  if (block.kind === 'sub') {
    return <h4 className={`font-semibold pt-1 ${t.sub}`} style={{ fontSize: size + 1 }} dangerouslySetInnerHTML={{ __html: block.html }} />;
  }
  if (block.kind === 'table') return <TableBlock table={block.table} theme={theme} size={size} />;
  return <div className={`${RICH} ${t.strong} ${t.link} ${t.quote}`} dangerouslySetInnerHTML={{ __html: block.html }} />;
}

function TableBlock({ table, theme, size }: { table: ScopeTable; theme: Theme; size: number }) {
  const t = T[theme];
  const { head, rows, cols } = table;
  // Three or more labelled columns don't fit a phone: one card per row instead.
  const cards = !!head && cols >= 3;
  const cell = `[&_strong]:font-semibold ${t.strong} ${t.link} [&_a]:underline break-words`;

  const grid = (
    <div className={`overflow-x-auto rounded-xl border ${t.tBorder}`}>
      <table className="w-full border-collapse text-left" style={{ fontSize: size - 1 }}>
        {head && (
          <thead>
            <tr>{head.map((h, i) => (
              <th key={i} className={`px-3.5 py-2.5 font-semibold align-bottom border-b ${t.tBorder} ${t.th} ${cell}`} dangerouslySetInnerHTML={{ __html: h }} />
            ))}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => r.group ? (
            <tr key={i}><td colSpan={cols} className={`px-3.5 py-2 font-semibold ${t.group} ${cell}`} dangerouslySetInnerHTML={{ __html: r.cells[0] }} /></tr>
          ) : (
            <tr key={i} className={t.zebra}>
              {r.cells.map((c, j) => (
                <td key={j} className={`px-3.5 py-2.5 align-top border-t ${t.tBorder} ${t.td} ${cell} ${!head && j === 0 && cols === 2 ? 'font-semibold w-[38%]' : ''}`}
                  dangerouslySetInnerHTML={{ __html: c }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (!cards) return grid;

  return (
    <>
      <div className="hidden md:block">{grid}</div>
      <div className="md:hidden space-y-2.5">
        {rows.map((r, i) => r.group ? (
          <div key={i} className={`px-3.5 py-2 rounded-lg font-semibold ${t.group} ${cell}`} dangerouslySetInnerHTML={{ __html: r.cells[0] }} />
        ) : (
          <div key={i} className={`rounded-xl border px-3.5 py-3 ${t.card}`}>
            {scopeText(r.cells[0]) && (
              <div className="mb-2">
                <div className={`text-[12px] font-semibold uppercase tracking-wide ${t.label}`} dangerouslySetInnerHTML={{ __html: head![0] }} />
                <div className={`font-semibold ${t.title} ${cell}`} style={{ fontSize: size + 1 }} dangerouslySetInnerHTML={{ __html: r.cells[0] }} />
              </div>
            )}
            <dl className="space-y-1.5">
              {r.cells.slice(1).map((c, j) => scopeText(c) ? (
                <div key={j} className="grid grid-cols-[38%_1fr] gap-3">
                  <dt className={`text-[13px] font-medium pt-0.5 ${t.label} break-words`} dangerouslySetInnerHTML={{ __html: head![j + 1] || '' }} />
                  <dd className={`${t.td} ${cell}`} dangerouslySetInnerHTML={{ __html: c }} />
                </div>
              ) : null)}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

export type { ScopeSection };
