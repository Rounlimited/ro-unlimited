'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * Spanish for the customer pages — a translation LAYER, not a rewrite.
 *
 * When the language is 'es', PageTranslator walks the page's visible text
 * (plus placeholder / aria-label / title), sends phrases it hasn't seen to
 * /api/translate (Claude, cached server-side forever), and swaps the text in
 * place. React's split text runs ("Opened ", "3", " times") are joined so a
 * sentence is translated whole. A MutationObserver re-translates anything
 * React changes. Switching back restores the exact English.
 * Skips: numbers/money-only text, emails, URLs, inputs, and anything inside
 * [data-no-translate]. Translations are also kept on the device so repeat
 * visits are instant.
 */
export type Lang = 'en' | 'es';
const KEY = 'ro-lang';
const CACHE_KEY = 'ro-tr-es-v1';

/* ── language store (shared by the switch, the translator, and anything that asks) ── */
let current: Lang = 'en';
const subs = new Set<() => void>();
try { if (typeof window !== 'undefined') { const q = new URLSearchParams(window.location.search).get('lang'); const s = (q === 'es' || q === 'en') ? q : localStorage.getItem(KEY); if (s === 'es') current = 'es'; } } catch {}
export function getLang(): Lang { return current; }
export function setLang(l: Lang) {
  if (l === current) return; current = l;
  try { localStorage.setItem(KEY, l); } catch {}
  try { document.documentElement.lang = l; } catch {}
  subs.forEach((f) => f());
}
export function useLang(): Lang {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current, () => 'en');
}

/* ── translation memory ── */
const mem = new Map<string, string>();
let memLoaded = false;
function loadMem() {
  if (memLoaded) return; memLoaded = true;
  try { const o = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); for (const k of Object.keys(o)) mem.set(k, o[k]); } catch {}
}
let saveT: any = null;
function saveMem() {
  if (saveT) return;
  saveT = setTimeout(() => {
    saveT = null;
    try {
      const entries = Array.from(mem.entries()).slice(-2500); // keep it bounded
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }, 800);
}

/* ── what to translate ── */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG', 'TITLE']);
const ATTRS = ['placeholder', 'aria-label', 'title'];
const worth = (s: string) => {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/[A-Za-z]{2,}/.test(t)) return false;                    // numbers, money, punctuation
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(t)) return false;        // email
  if (/^(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org)\/)/i.test(t)) return false; // url
  if (/^(RO-[A-Z]+-\d|DEMO-)/.test(t)) return false;            // doc numbers
  return true;
};
const skipEl = (el: Element | null): boolean => {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName)) return true;
    if (e.hasAttribute && (e.hasAttribute('data-no-translate') || e.getAttribute('contenteditable') === 'true' || e.getAttribute('translate') === 'no')) return true;
  }
  return false;
};

type Group = { nodes: Text[]; src: string };
const original = new WeakMap<Node, string>();          // text node → English it held
const applied = new WeakMap<Node, string>();           // text node → what we last wrote
const attrOrig = new WeakMap<Element, Record<string, string>>();
let applying = false;

function collect(root: Node): { groups: Group[]; attrs: { el: Element; name: string; src: string }[] } {
  const groups: Group[] = []; const attrs: { el: Element; name: string; src: string }[] = [];
  const seenParents = new Set<Node>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const parent = n.parentNode as Element | null;
    if (!parent || seenParents.has(parent) || skipEl(parent)) continue;
    // join this text node with adjacent text-node siblings (React interpolation)
    const run: Text[] = [];
    let first: Node | null = n; while (first.previousSibling && first.previousSibling.nodeType === 3) first = first.previousSibling;
    for (let x: Node | null = first; x && x.nodeType === 3; x = x.nextSibling) run.push(x as Text);
    // only treat as one sentence when the parent holds nothing but this text run
    const onlyText = Array.from(parent.childNodes).every((c) => c.nodeType === 3);
    const nodes = onlyText ? run : [n as Text];
    if (onlyText) seenParents.add(parent);
    const src = nodes.map((t) => (original.has(t) && applied.get(t) === t.nodeValue ? original.get(t)! : t.nodeValue || '')).join('');
    if (worth(src)) groups.push({ nodes, src });
  }
  if (root instanceof Element || root === document.body) {
    const els = (root as Element).querySelectorAll ? (root as Element).querySelectorAll('[placeholder],[aria-label],[title]') : [];
    els.forEach((el) => {
      if (skipEl(el)) return;
      const o = attrOrig.get(el) || {};
      for (const name of ATTRS) {
        const v = el.getAttribute(name); if (!v) continue;
        const src = o[name] && el.getAttribute('data-tr-' + name) === v ? o[name] : v;
        if (worth(src)) attrs.push({ el, name, src });
      }
    });
  }
  return { groups, attrs };
}

function lead(s: string) { const m = s.match(/^\s*/); return m ? m[0] : ''; }
function tail(s: string) { const m = s.match(/\s*$/); return m ? m[0] : ''; }

function applyAll(groups: Group[], attrs: { el: Element; name: string; src: string }[]) {
  applying = true;
  try {
    for (const g of groups) {
      const tr = mem.get(g.src.trim()); if (!tr) continue;
      const out = lead(g.src) + tr + tail(g.src);
      g.nodes.forEach((t, i) => {
        if (!original.has(t) || applied.get(t) !== t.nodeValue) original.set(t, t.nodeValue || '');
        const v = i === 0 ? out : '';
        if (t.nodeValue !== v) t.nodeValue = v;
        applied.set(t, v);
      });
    }
    for (const a of attrs) {
      const tr = mem.get(a.src.trim()); if (!tr) continue;
      const o = attrOrig.get(a.el) || {}; o[a.name] = a.src; attrOrig.set(a.el, o);
      a.el.setAttribute(a.name, tr); a.el.setAttribute('data-tr-' + a.name, tr);
    }
  } finally { applying = false; }
}

function restoreAll() {
  applying = true;
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if (original.has(n) && applied.get(n) === n.nodeValue) { n.nodeValue = original.get(n)!; applied.delete(n); }
    }
    document.querySelectorAll('[data-tr-placeholder],[data-tr-aria-label],[data-tr-title]').forEach((el) => {
      const o = attrOrig.get(el) || {};
      for (const name of ATTRS) { if (el.getAttribute('data-tr-' + name) && o[name]) el.setAttribute(name, o[name]); el.removeAttribute('data-tr-' + name); }
    });
  } finally { applying = false; }
}

let inflight = 0;
const pendSubs = new Set<() => void>();
const setInflight = (d: number) => { inflight = Math.max(0, inflight + d); pendSubs.forEach((f) => f()); };
export function useTranslating(): boolean {
  return useSyncExternalStore((cb) => { pendSubs.add(cb); return () => { pendSubs.delete(cb); }; }, () => inflight > 0, () => false);
}

async function translatePass(token: string | null) {
  if (current !== 'es' || typeof document === 'undefined') return;
  loadMem();
  const { groups, attrs } = collect(document.body);
  const need = Array.from(new Set([...groups.map((g) => g.src.trim()), ...attrs.map((a) => a.src.trim())])).filter((s) => !mem.has(s));
  applyAll(groups, attrs);                       // what we already know, instantly
  if (!need.length) return;
  setInflight(1);
  try {
    for (let i = 0; i < need.length; i += 200) {
      const chunk = need.slice(i, i + 200);
      const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: 'es', texts: chunk, token }) });
      if (!r.ok) break;
      const j = await r.json();
      const map = (j && j.map) || {};
      for (const k of Object.keys(map)) mem.set(k, map[k]);
      saveMem();
      if (current !== 'es') return;
      const again = collect(document.body); applyAll(again.groups, again.attrs);
    }
  } catch { /* network: stay in English for what's missing */ } finally { setInflight(-1); }
}

/** Mount once per customer page. `token` = the Project Page token (omit inside the signed-in portal). */
export default function PageTranslator({ token }: { token?: string | null }) {
  const lang = useLang();
  useEffect(() => {
    try { document.documentElement.lang = lang; } catch {}
    if (lang !== 'es') { restoreAll(); return; }
    let t: any = null;
    const run = () => { t = null; translatePass(token || null); };
    run();
    const obs = new MutationObserver((muts) => {
      if (applying) return;
      // ignore mutations that are only our own writes
      if (muts.every((m) => m.type === 'characterData' && applied.get(m.target) === (m.target as Text).nodeValue)) return;
      if (!t) t = setTimeout(run, 350);
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    return () => { obs.disconnect(); if (t) clearTimeout(t); };
  }, [lang, token]);
  return null;
}

/** EN | ES pill. `dark` for the black portal/admin-style headers. */
export function LangSwitch({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const lang = useLang();
  const busy = useTranslating();
  const base = dark ? { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.18)', on: '#D4B965', onText: '#111', off: 'rgba(255,255,255,0.75)' }
    : { bg: '#fff', border: '#e5e0d2', on: '#C9A84C', onText: '#111', off: '#4b5563' };
  return (
    <div data-no-translate className={'inline-flex items-center rounded-full p-1 gap-1 ' + className} style={{ background: base.bg, border: '1px solid ' + base.border }} role="group" aria-label="Language / Idioma">
      {(['en', 'es'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
          className="min-w-[48px] min-h-[38px] px-3 rounded-full text-[14px] font-bold transition-colors duration-200 flex items-center justify-center gap-1"
          style={lang === l ? { background: base.on, color: base.onText } : { color: base.off }}>
          {l === 'en' ? 'EN' : 'ES'}
          {l === 'es' && lang === 'es' && busy ? <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: base.onText }} /> : null}
        </button>
      ))}
    </div>
  );
}
