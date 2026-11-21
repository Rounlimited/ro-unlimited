'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TableKit } from '@tiptap/extension-table';
import {
  Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading2, Heading3, Table2,
  Sparkles, FileUp, Undo2, Redo2, Trash2, Eye, Pencil, X, Check, Rows3, Columns3, Send, ScanSearch,
  ClipboardPaste, ArrowUp, ArrowDown, ListChecks, ShieldAlert, Wand2, ChevronDown, Type,
} from 'lucide-react';
import ScopeView from '@/components/estimates/ScopeView';
import ScopeOrganizer, { type Intake } from '@/components/admin/estimates/ScopeOrganizer';
import ScopeAssistant from '@/components/admin/estimates/ScopeAssistant';
import ScopeLines, { type DraftLine } from '@/components/admin/estimates/ScopeLines';
import {
  applyScopeRules, cleanScopeHtml, couldUseOrganizing, deleteSection, looksLikeMarkdown, looksScrambled,
  markdownFromPlainParagraphs, markdownToScopeHtml, moveSection, removeBlocks, renameSection, replaceSection,
  ruleLabel, sameRule, scopeStats, scopeText, scopeWarnings, sectionHtml,
  type ScopeRule, type ScopeWarning,
} from '@/lib/scope-doc';

interface Props {
  content: string;
  onSave: (html: string) => void;
  /** When given, "Draft the price list from this scope" is offered and its items are handed here. */
  onAddLines?: (items: DraftLine[]) => void;
}

const api = (body: Record<string, unknown>) =>
  fetch('/api/admin/estimates/scope-organize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/**
 * Scope of Work.
 *
 * One way in: paste it or pick a file, and the screen works out what arrived. Something already laid out
 * (Markdown, Word, real tables) goes in exactly, with no AI. A PDF or a photo goes to the AI. A scrambled or
 * run-together paste goes in as it is and the screen offers to rebuild it.
 *
 * Once it is in: a free scan lists anything a customer should not see, each section can be moved, renamed,
 * removed or handed to the AI on its own, and fixes he makes the same way every time can be remembered.
 */
export default function WizardStep3({ content, onSave, onAddLines }: Props) {
  const [sheet, setSheet] = useState<null | { mode: 'tidy' | 'import'; initial?: Intake }>(null);
  const [preview, setPreview] = useState(false);
  const [ask, setAsk] = useState('');
  const [clearSure, setClearSure] = useState(false);
  const [assist, setAssist] = useState<null | { instruction: string; section?: number }>(null);
  const [sectionAsk, setSectionAsk] = useState<null | { index: number; title: string; text: string }>(null);
  const [renaming, setRenaming] = useState<null | { index: number; from: string; text: string }>(null);
  const [deleteSure, setDeleteSure] = useState<number | null>(null);
  const [lines, setLines] = useState(false);
  const [html, setHtml] = useState(content || '');
  const [dismissed, setDismissed] = useState(false);
  const [undoHtml, setUndoHtml] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rules, setRules] = useState<ScopeRule[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [ruleOffer, setRuleOffer] = useState<ScopeRule | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pasteHelp, setPasteHelp] = useState(false);
  const [, force] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const lastSent = useRef(content || '');
  const rulesRef = useRef<ScopeRule[]>([]);
  rulesRef.current = rules;
  const fileInput = useRef<HTMLInputElement>(null);
  const intakeRef = useRef<(d: { text?: string; html?: string; file?: File }) => boolean>(() => false);

  const push = (value: string, now = false) => {
    setHtml(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const send = () => { lastSent.current = value; onSaveRef.current(value); };
    if (now) send(); else saveTimer.current = setTimeout(send, 500);
  };

  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false, underline: false }),
      UnderlineExt,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Type the scope here, or paste it. Tables paste in as tables.' }),
      TextStyle,
      Color,
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: content || '',
    editorProps: {
      attributes: { class: 'focus:outline-none', style: 'font-size:17px;' },
      // A paste into an EMPTY box is a whole scope arriving: it takes the same smart route as the Paste button.
      // A paste into existing text is an insert; Markdown is still laid out on the way in.
      handlePaste: (_view, event) => {
        try {
          const cd = event.clipboardData; if (!cd) return false;
          const rich = cd.getData('text/html') || ''; const plain = cd.getData('text/plain') || '';
          const ed = editorRef.current;
          if (ed && !scopeText(ed.getHTML()) && (plain.trim() || rich.trim())) {
            if (intakeRef.current({ text: plain, html: rich })) { event.preventDefault(); return true; }
          }
          if (/<(table|h[1-6])\b/i.test(rich)) return false;
          if (!looksLikeMarkdown(plain)) return false;
          const laidOut = cleanScopeHtml(markdownToScopeHtml(plain));
          if (!scopeText(laidOut)) return false;
          event.preventDefault();
          ed?.chain().focus().insertContent(laidOut).run();
          setNote('Laid out as you pasted it.');
          return true;
        } catch { return false; }
      },
      // Word, Google Docs and web pages bring a lot of junk; keep the words, headings, lists and tables.
      transformPastedHTML: (pasted) => { try { return cleanScopeHtml(pasted); } catch { return pasted; } },
    },
    onUpdate: ({ editor: e }) => push(e.getHTML()),
    onBlur: ({ editor: e }) => push(e.getHTML(), true),
    onSelectionUpdate: () => force((n) => n + 1),
  });
  editorRef.current = editor;

  // Content arriving from outside (a template being filled in) replaces the editor's.
  useEffect(() => {
    if (!editor || content === lastSent.current) return;
    if (content !== editor.getHTML()) editor.commands.setContent(content || '', { emitUpdate: false });
    lastSent.current = content || '';
    setHtml(content || '');
  }, [content, editor]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(null), 6000); return () => clearTimeout(t); }, [note]);
  useEffect(() => { api({ action: 'rules_get' }).then((r) => r.json()).then((d) => { if (Array.isArray(d.rules)) setRules(d.rules); }).catch(() => {}); }, []);

  const stats = useMemo(() => scopeStats(html), [html]);
  const scrambled = useMemo(() => looksScrambled(html), [html]);
  const flat = useMemo(() => !scrambled && couldUseOrganizing(html), [html, scrambled]);
  const hasText = useMemo(() => !!scopeText(html), [html]);
  const rawMarkdown = useMemo(() => markdownFromPlainParagraphs(html), [html]);
  const warnings = useMemo(() => scopeWarnings(html).filter((w) => w.fix !== 'layout'), [html]);
  useEffect(() => { if (!scrambled && !flat) setDismissed(false); }, [scrambled, flat]);

  if (!editor) return null;

  /** Puts a new version of the scope in the box. What was there is kept for "Put mine back". */
  const setScope = (next: string, opts: { undo?: boolean; show?: boolean; withRules?: boolean } = {}) => {
    const before = editor.getHTML();
    let value = next;
    if (opts.withRules) {
      const r = applyScopeRules(next, rulesRef.current);
      value = r.html; setApplied(r.applied);
    }
    editor.commands.setContent(value, { emitUpdate: false });
    push(editor.getHTML(), true);
    if (opts.undo !== false) setUndoHtml(scopeText(before) ? before : null);
    setDismissed(false);
    if (opts.show) setPreview(true);
  };

  /* ── One way in ───────────────────────────────────────────────── */
  const intake = (d: { text?: string; html?: string; file?: File }): boolean => {
    setPasteHelp(false);
    if (d.file) {
      const name = d.file.name.toLowerCase();
      const exact = /\.(docx|md|markdown|html?|txt|csv)$/.test(name) || /^text\//.test(d.file.type);
      setSheet({ mode: 'import', initial: { file: d.file, route: exact ? 'exact' : 'ai' } });
      return true;
    }
    const rich = d.html || ''; const plain = (d.text || '').replace(/\r\n?/g, '\n');
    if (/<(table|h[1-6])\b/i.test(rich)) {                                  // came with real tables / headings
      const clean = cleanScopeHtml(rich);
      if (scopeText(clean)) { setScope(clean, { show: true, withRules: true }); setNote('Put in exactly as it was, with its tables.'); return true; }
    }
    if (looksLikeMarkdown(plain)) {                                          // Markdown from another AI or a notes app
      const laidOut = cleanScopeHtml(markdownToScopeHtml(plain));
      if (scopeText(laidOut)) { setScope(laidOut, { show: true, withRules: true }); setNote('Laid out exactly as written: sections and tables.'); return true; }
    }
    if (!plain.trim()) return false;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    setScope(plain.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join(''), { withRules: true });
    setPreview(false);
    return true;                                                             // the screen then offers a rebuild if it needs one
  };
  intakeRef.current = intake;

  const pasteFromClipboard = async () => {
    try {
      let rich = ''; let plain = '';
      const clip = navigator.clipboard;
      if (clip && 'read' in clip) {
        try {
          for (const item of await clip.read()) {
            if (item.types.includes('text/html')) rich = await (await item.getType('text/html')).text();
            if (item.types.includes('text/plain')) plain = await (await item.getType('text/plain')).text();
          }
        } catch { /* fall through to plain text */ }
      }
      if (!rich && !plain && clip?.readText) plain = await clip.readText();
      if (!intake({ text: plain, html: rich })) setPasteHelp(true);
    } catch { setPasteHelp(true); }
  };

  /* ── Rules ────────────────────────────────────────────────────── */
  const saveRules = (next: ScopeRule[]) => {
    setRules(next);
    api({ action: 'rules_set', rules: next }).then((r) => r.json()).then((d) => { if (Array.isArray(d.rules)) setRules(d.rules); }).catch(() => {});
  };
  const addRule = (r: ScopeRule) => { saveRules([...rulesRef.current.filter((x) => !sameRule(x, r)), r]); setRuleOffer(null); setNote('Saved. It will be done for you next time.'); };

  /* ── The scan's fixes ─────────────────────────────────────────── */
  const fixWarning = (w: ScopeWarning) => {
    if (w.fix === 'remove') {
      setScope(removeBlocks(editor.getHTML(), [w.block]));
      if (w.kind === 'author_tag' || w.kind === 'date_line' || w.kind === 'page_number' || w.kind === 'empty_section') {
        const rule: ScopeRule = { kind: 'drop', what: w.kind };
        if (!rulesRef.current.some((x) => sameRule(x, rule))) setRuleOffer(rule);
      }
      return;
    }
    // "Show me": go to the line in the editor
    setPreview(false);
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`.scope-editor .ProseMirror > *:nth-child(${w.block})`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background-color .3s'; el.style.backgroundColor = 'rgba(240,160,75,.35)';
      setTimeout(() => { el.style.backgroundColor = ''; }, 2200);
    }, 120);
  };

  /* ── Section tools ────────────────────────────────────────────── */
  const sectionMove = (i: number, dir: -1 | 1) => setScope(moveSection(editor.getHTML(), i, dir), { show: true });
  const sectionDelete = (i: number) => {
    if (deleteSure !== i) { setDeleteSure(i); setTimeout(() => setDeleteSure((v) => (v === i ? null : v)), 5000); return; }
    setDeleteSure(null); setScope(deleteSection(editor.getHTML(), i), { show: true });
  };
  const sectionRename = () => {
    if (!renaming) return;
    const to = renaming.text.replace(/\s+/g, ' ').trim();
    if (to && to !== renaming.from) {
      setScope(renameSection(editor.getHTML(), renaming.index, to), { show: true });
      const rule: ScopeRule = { kind: 'rename_section', from: renaming.from, to };
      if (!rulesRef.current.some((x) => x.kind === 'rename_section' && sameRule(x, rule) && x.to === to)) setRuleOffer(rule);
    }
    setRenaming(null);
  };

  const clearAll = () => {
    if (!clearSure) { setClearSure(true); setTimeout(() => setClearSure(false), 6000); return; }
    setClearSure(false);
    const before = editor.getHTML();
    editor.commands.clearContent(false);
    push(editor.getHTML(), true);
    setUndoHtml(scopeText(before) ? before : null);
    setApplied([]); setPreview(false);
  };

  const inTable = editor.isActive('table');
  const Tool = ({ active, onClick, label, children, wide }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode; wide?: boolean }) => (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={label} aria-label={label} aria-pressed={!!active}
      className={`shrink-0 min-h-[48px] ${wide ? 'px-3.5 gap-2' : 'min-w-[48px]'} rounded-lg flex items-center justify-center text-[15px] font-semibold transition-colors ${
        active ? 'bg-[#C9A84C]/25 text-[#E5C76B]' : 'text-white/85 active:bg-white/10 hover:bg-white/5'}`}>
      {children}
    </button>
  );
  const Sep = () => <span className="shrink-0 w-px h-7 bg-white/15 mx-1" />;
  const mini = 'shrink-0 min-h-[44px] px-3 rounded-lg border border-white/20 text-[15px] font-semibold text-white/90 flex items-center gap-1.5 active:bg-white/10 disabled:opacity-30';

  const assistHtml = assist ? (assist.section != null ? sectionHtml(editor.getHTML(), assist.section) : editor.getHTML()) : '';

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <p className="text-[17px] text-white/75 leading-relaxed">
        What the job includes. This is what the customer reads, so sections and tables make it easy to follow.
      </p>

      {/* ── One way in: paste it or pick a file; the screen works out the rest ── */}
      <input ref={fileInput} type="file" className="hidden"
        accept=".docx,.pdf,.txt,.md,.markdown,.csv,.html,.htm,image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) intake({ file: f }); }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) intake({ file: f }); else intake({ text: e.dataTransfer.getData('text/plain'), html: e.dataTransfer.getData('text/html') });
        }}
        className={`rounded-xl border-2 border-dashed px-4 ${hasText ? 'py-3' : 'py-6'} transition-colors ${dragOver ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/25 bg-[#111]'}`}>
        {!hasText && (
          <div className="text-center mb-4">
            <p className="text-[20px] font-bold text-white">Paste or drop your scope here</p>
            <p className="text-[16px] text-white/70 mt-1 leading-snug">Any size. Text from another AI, a Word file, a PDF or a photo of the page. It gets laid out as sections and tables.</p>
          </div>
        )}
        {hasText && <p className="text-[15px] font-semibold text-white/70 mb-2">Bring in a different scope (it replaces this one)</p>}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={pasteFromClipboard}
            className={`min-h-[56px] rounded-xl text-[17px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] ${hasText ? 'border border-white/25 text-white' : 'bg-[#C9A84C] text-black'}`}>
            <ClipboardPaste size={20} /> Paste
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}
            className="min-h-[56px] rounded-xl border border-white/25 text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:bg-white/5">
            <FileUp size={20} /> Pick a file
          </button>
        </div>
        {pasteHelp && (
          <p className="mt-3 text-[16px] text-white leading-snug rounded-lg bg-[#f0a04b]/15 border border-[#f0a04b]/50 px-3 py-2.5">
            This phone did not let the button read what you copied. Tap inside the writing box below, hold your finger down, then tap Paste. It works the same way.
          </p>
        )}
      </div>

      {note && (
        <div className="flex items-center gap-2 rounded-xl border border-[#35d07f]/40 bg-[#35d07f]/10 px-4 py-2.5 text-[16px] text-white"><Check size={19} className="text-[#5fe0a0] shrink-0" /> {note}</div>
      )}

      {applied.length > 0 && (
        <div className="rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <Wand2 size={20} className="text-[#D4B965] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-white">Done for you, from your saved rules:</p>
              <ul className="mt-1 space-y-0.5">{applied.map((a, i) => <li key={i} className="text-[15px] text-white/85 break-words">{a}</li>)}</ul>
            </div>
            <button type="button" onClick={() => setApplied([])} aria-label="Dismiss" className="w-11 h-11 -mr-2 -mt-1 flex items-center justify-center text-white/70"><X size={19} /></button>
          </div>
        </div>
      )}

      {undoHtml !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-[#35d07f]/40 bg-[#35d07f]/10 px-4 py-2.5">
          <Check size={20} className="text-[#5fe0a0] shrink-0" />
          <p className="flex-1 text-[16px] text-white">The scope was changed.</p>
          <button type="button" onClick={() => { const b = undoHtml; setUndoHtml(null); setApplied([]); editor.commands.setContent(b, { emitUpdate: false }); push(editor.getHTML(), true); }}
            className="min-h-[44px] px-3 rounded-lg text-[16px] font-bold text-white underline underline-offset-2">Put mine back</button>
          <button type="button" onClick={() => setUndoHtml(null)} aria-label="Dismiss" className="w-11 h-11 flex items-center justify-center text-white/70"><X size={19} /></button>
        </div>
      )}

      {ruleOffer && (
        <div className="rounded-xl border border-[#C9A84C]/50 bg-[#C9A84C]/10 px-4 py-3">
          <p className="text-[17px] font-semibold text-white leading-snug">Do this every time?</p>
          <p className="text-[16px] text-white/85 mt-0.5 leading-snug">{ruleLabel(ruleOffer)}, on every scope you bring in.</p>
          <div className="flex gap-2.5 mt-3">
            <button type="button" onClick={() => addRule(ruleOffer)} className="min-h-[48px] px-4 rounded-lg bg-[#C9A84C] text-black text-[16px] font-bold">Yes, always</button>
            <button type="button" onClick={() => setRuleOffer(null)} className="min-h-[48px] px-4 rounded-lg text-white/85 text-[16px] font-semibold active:bg-white/10">Just this once</button>
          </div>
        </div>
      )}

      {rawMarkdown && (
        <div className="rounded-xl border border-[#35d07f]/50 bg-[#35d07f]/10 px-4 py-3.5">
          <p className="text-[17px] font-semibold text-white leading-snug">This came in as plain text with the layout marks showing.</p>
          <p className="text-[16px] text-white/80 mt-1 leading-snug">The # and | marks are headings and tables. One tap turns them into real sections and tables. Your wording stays exactly the same, and it does not use AI credit.</p>
          <button type="button" onClick={() => setScope(cleanScopeHtml(markdownToScopeHtml(rawMarkdown)), { show: true, withRules: true })}
            className="mt-3 min-h-[52px] px-5 rounded-lg bg-[#35d07f] text-black text-[17px] font-bold flex items-center gap-2"><Check size={20} /> Lay it out</button>
        </div>
      )}

      {(scrambled || flat) && !dismissed && !rawMarkdown && (
        <div className="rounded-xl border border-[#f0a04b]/60 bg-[#f0a04b]/12 px-4 py-3.5">
          <p className="text-[17px] font-semibold text-white leading-snug">
            {scrambled ? 'This looks like a table that lost its columns.' : 'This is one long run of text.'}
          </p>
          <p className="text-[16px] text-white/80 mt-1 leading-snug">
            {scrambled
              ? 'The values came in one per line, so a customer can’t tell what goes with what. The AI can rebuild it into a proper table.'
              : 'The AI can split it into sections with headings, and tables where they fit, without changing your wording.'}
          </p>
          <div className="flex gap-2.5 mt-3">
            <button type="button" onClick={() => setSheet({ mode: 'tidy' })}
              className="min-h-[48px] px-4 rounded-lg bg-[#f0a04b] text-black text-[16px] font-bold flex items-center gap-2"><Sparkles size={18} /> {scrambled ? 'Rebuild it' : 'Organize it'}</button>
            <button type="button" onClick={() => setDismissed(true)}
              className="min-h-[48px] px-4 rounded-lg text-white/85 text-[16px] font-semibold active:bg-white/10">Leave it</button>
          </div>
        </div>
      )}

      {/* ── Before a customer sees it: a free scan for leftovers ── */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-[#f0a04b]/55 bg-[#f0a04b]/10 px-4 py-3.5">
          <p className="flex items-center gap-2 text-[17px] font-bold text-white"><ShieldAlert size={21} className="text-[#f0a04b] shrink-0" /> Before a customer sees this: {warnings.length} thing{warnings.length === 1 ? '' : 's'} to check</p>
          <ul className="mt-2.5 space-y-2.5">
            {warnings.slice(0, 8).map((w, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-white leading-snug">{w.label}</p>
                  <p className="text-[15px] text-white/75 leading-snug break-words">“{w.sample}”</p>
                </div>
                <button type="button" onClick={() => fixWarning(w)}
                  className="shrink-0 min-h-[44px] px-3.5 rounded-lg bg-[#f0a04b] text-black text-[15px] font-bold">{w.fix === 'remove' ? 'Take it out' : 'Show me'}</button>
              </li>
            ))}
          </ul>
          {warnings.length > 8 && <p className="mt-2 text-[15px] text-white/70">and {warnings.length - 8} more.</p>}
        </div>
      )}

      {/* ── The AI working on what is already here ── */}
      {hasText && (
        <div className="rounded-xl border border-white/15 bg-[#111] p-3">
          <label htmlFor="scope-ask" className="flex items-center gap-2 text-[16px] font-semibold text-white mb-2"><Sparkles size={18} className="text-[#D4B965]" /> Ask the AI to change something</label>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const q = ask.trim(); if (q) { push(editor.getHTML(), true); setAssist({ instruction: q }); } }}>
            <input id="scope-ask" value={ask} onChange={(e) => setAsk(e.target.value)} enterKeyHint="send"
              placeholder="e.g. put the fixtures in a table"
              className="flex-1 min-w-0 min-h-[52px] rounded-lg bg-[#0a0a0a] border border-white/20 px-3.5 text-[17px] text-white placeholder:text-white/45 focus:outline-none focus:border-[#C9A84C]" />
            <button type="submit" disabled={!ask.trim()} aria-label="Ask the AI"
              className="shrink-0 min-w-[56px] min-h-[52px] px-4 rounded-lg bg-[#C9A84C] text-black text-[17px] font-bold flex items-center justify-center gap-2 disabled:opacity-35"><Send size={19} /> Ask</button>
          </form>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
            <button type="button" onClick={() => { push(editor.getHTML(), true); setAssist({ instruction: '' }); }}
              className="min-h-[52px] rounded-lg border border-white/25 text-white text-[16px] font-semibold flex items-center justify-center gap-2 active:bg-white/5">
              <ScanSearch size={19} /> Have the AI look it over
            </button>
            <button type="button" onClick={() => setSheet({ mode: 'tidy' })}
              className="min-h-[52px] rounded-lg border border-white/25 text-white text-[16px] font-semibold flex items-center justify-center gap-2 active:bg-white/5">
              <Sparkles size={19} /> Reorganize the whole scope
            </button>
          </div>
          <p className="mt-2 text-[14px] text-white/55 leading-snug">It shows you what it would change first. Nothing changes until you say so.</p>
        </div>
      )}

      <div className="border border-white/15 rounded-xl overflow-hidden bg-[#111] min-w-0 max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-[#0d0d0d]">
          <div className="inline-flex rounded-lg bg-white/5 p-1">
            <button type="button" onClick={() => setPreview(false)} aria-pressed={!preview}
              className={`min-h-[44px] px-3.5 rounded-md text-[16px] font-semibold flex items-center gap-2 ${!preview ? 'bg-[#C9A84C] text-black' : 'text-white/80'}`}><Pencil size={17} /> Write</button>
            <button type="button" onClick={() => { push(editor.getHTML(), true); setPreview(true); }} aria-pressed={preview}
              className={`min-h-[44px] px-3.5 rounded-md text-[16px] font-semibold flex items-center gap-2 ${preview ? 'bg-[#C9A84C] text-black' : 'text-white/80'}`}><Eye size={17} /> How it looks</button>
          </div>
          {hasText && (
            <span className="text-[14px] text-white/60 text-right leading-tight">
              {stats.sections > 0 && <>{stats.sections} section{stats.sections === 1 ? '' : 's'} · </>}
              {stats.tables > 0 && <>{stats.tables} table{stats.tables === 1 ? '' : 's'} · </>}
              {stats.words.toLocaleString()} words
            </span>
          )}
          {hasText && (
            <button type="button" onClick={clearAll}
              className={`shrink-0 min-h-[44px] px-3.5 rounded-md text-[16px] font-semibold flex items-center gap-2 border ${clearSure ? 'bg-red-500 border-red-500 text-white' : 'border-red-400/50 text-red-300 active:bg-red-500/10'}`}>
              <Trash2 size={17} /> {clearSure ? 'Tap again to clear it all' : 'Clear all'}
            </button>
          )}
        </div>

        {!preview && (
          <>
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-[#0d0d0d] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Tool wide active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Section heading"><Heading2 size={20} /> Section</Tool>
              <Tool active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Sub-heading"><Heading3 size={20} /></Tool>
              <Tool wide active={inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="Add a table"><Table2 size={20} /> Table</Tool>
              <Sep />
              <Tool active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold"><Bold size={19} /></Tool>
              <Tool active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic"><Italic size={19} /></Tool>
              <Tool active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Underline"><Underline size={19} /></Tool>
              <Sep />
              <Tool active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list"><List size={20} /></Tool>
              <Tool active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list"><ListOrdered size={20} /></Tool>
              <Tool active={editor.isActive('link')} label="Link" onClick={() => {
                if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
                const url = window.prompt('Web address:');
                if (url) editor.chain().focus().setLink({ href: /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}` }).run();
              }}><LinkIcon size={19} /></Tool>
              <Sep />
              <Tool onClick={() => editor.chain().focus().undo().run()} label="Undo"><Undo2 size={19} /></Tool>
              <Tool onClick={() => editor.chain().focus().redo().run()} label="Redo"><Redo2 size={19} /></Tool>
            </div>

            {inTable && (
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#C9A84C]/30 bg-[#C9A84C]/10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="shrink-0 text-[14px] font-bold uppercase tracking-wide text-[#E5C76B] px-2">Table</span>
                <Tool wide onClick={() => editor.chain().focus().addRowAfter().run()} label="Add a row below"><Rows3 size={18} /> + Row</Tool>
                <Tool wide onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add a column to the right"><Columns3 size={18} /> + Column</Tool>
                <Tool wide onClick={() => editor.chain().focus().deleteRow().run()} label="Remove this row">− Row</Tool>
                <Tool wide onClick={() => editor.chain().focus().deleteColumn().run()} label="Remove this column">− Column</Tool>
                <Tool wide onClick={() => editor.chain().focus().toggleHeaderRow().run()} label="Turn the top row's heading style on or off">Top row heading</Tool>
                <Tool wide onClick={() => editor.chain().focus().deleteTable().run()} label="Remove the whole table"><Trash2 size={18} /> Table</Tool>
              </div>
            )}

            <div className="scope-editor"><EditorContent editor={editor} /></div>
          </>
        )}

        {preview && (
          <div className="p-4 sm:p-5">
            {hasText ? (
              <ScopeView html={html} theme="dark" size={17}
                sectionTools={(i, title, total) => (
                  <div className="mb-3 -mt-1">
                    {renaming && renaming.index === i ? (
                      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sectionRename(); }}>
                        <input autoFocus value={renaming.text} onChange={(e) => setRenaming({ ...renaming, text: e.target.value })} aria-label="Section name"
                          className="flex-1 min-w-0 min-h-[48px] rounded-lg bg-[#0a0a0a] border border-[#C9A84C] px-3 text-[17px] text-white focus:outline-none" />
                        <button type="submit" className="shrink-0 min-h-[48px] px-4 rounded-lg bg-[#C9A84C] text-black text-[16px] font-bold">Save</button>
                        <button type="button" onClick={() => setRenaming(null)} aria-label="Cancel" className="shrink-0 w-12 min-h-[48px] rounded-lg border border-white/20 text-white/80 flex items-center justify-center"><X size={19} /></button>
                      </form>
                    ) : (
                      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button type="button" className={mini} disabled={i === 0} onClick={() => sectionMove(i, -1)} aria-label={`Move ${title} up`}><ArrowUp size={17} /> Up</button>
                        <button type="button" className={mini} disabled={i === total - 1} onClick={() => sectionMove(i, 1)} aria-label={`Move ${title} down`}><ArrowDown size={17} /> Down</button>
                        <button type="button" className={mini} onClick={() => setRenaming({ index: i, from: title, text: title })}><Type size={16} /> Rename</button>
                        <button type="button" className={mini} onClick={() => setSectionAsk({ index: i, title, text: '' })}><Sparkles size={16} className="text-[#D4B965]" /> Ask AI</button>
                        <button type="button" onClick={() => sectionDelete(i)}
                          className={`shrink-0 min-h-[44px] px-3 rounded-lg border text-[15px] font-semibold flex items-center gap-1.5 ${deleteSure === i ? 'bg-red-500 border-red-500 text-white' : 'border-red-400/45 text-red-300'}`}>
                          <Trash2 size={16} /> {deleteSure === i ? 'Tap again to delete' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                )} />
            ) : <p className="text-[17px] text-white/60">Nothing written yet.</p>}
          </div>
        )}
      </div>

      {/* ── The finished scope feeds the price list ── */}
      {hasText && onAddLines && (
        <button type="button" onClick={() => { push(editor.getHTML(), true); setLines(true); }}
          className="w-full min-h-[56px] rounded-xl border border-[#C9A84C]/50 bg-[#C9A84C]/10 text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:bg-[#C9A84C]/20">
          <ListChecks size={21} className="text-[#D4B965]" /> Draft the price list from this scope
        </button>
      )}

      {/* ── What it remembers ── */}
      {rules.length > 0 && (
        <div className="rounded-xl border border-white/15 bg-[#111]">
          <button type="button" onClick={() => setRulesOpen((v) => !v)} aria-expanded={rulesOpen}
            className="w-full min-h-[52px] px-4 flex items-center gap-2 text-left text-[16px] font-semibold text-white">
            <Wand2 size={18} className="text-[#D4B965]" /> <span className="flex-1">Your saved rules ({rules.length})</span>
            <ChevronDown size={19} className={`text-white/60 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
          </button>
          {rulesOpen && (
            <ul className="px-4 pb-3 space-y-2">
              {rules.map((r, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex-1 text-[16px] text-white/90 leading-snug">{ruleLabel(r)}</span>
                  <button type="button" onClick={() => saveRules(rules.filter((_, k) => k !== i))} className="shrink-0 min-h-[44px] px-3 rounded-lg border border-white/20 text-[15px] font-semibold text-white/85">Stop doing this</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Ask the AI about one section ── */}
      {sectionAsk && (
        <div className="fixed inset-0 z-[205] bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={() => setSectionAsk(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-[#111] border border-white/15 p-4" onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
            <p className="text-[14px] font-bold uppercase tracking-wide text-[#E5C76B]">AI, this section only</p>
            <p className="text-[19px] font-bold text-white leading-snug mt-0.5">{sectionAsk.title}</p>
            <form className="mt-3" onSubmit={(e) => { e.preventDefault(); const q = sectionAsk.text.trim(); if (!q) return; push(editor.getHTML(), true); setAssist({ instruction: q, section: sectionAsk.index }); setSectionAsk(null); }}>
              <input autoFocus value={sectionAsk.text} onChange={(e) => setSectionAsk({ ...sectionAsk, text: e.target.value })} enterKeyHint="send"
                placeholder="What should change here?" aria-label="What should change in this section"
                className="w-full min-h-[54px] rounded-lg bg-[#0a0a0a] border border-white/20 px-3.5 text-[17px] text-white placeholder:text-white/45 focus:outline-none focus:border-[#C9A84C]" />
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button type="submit" disabled={!sectionAsk.text.trim()} className="min-h-[54px] rounded-lg bg-[#C9A84C] text-black text-[17px] font-bold flex items-center justify-center gap-2 disabled:opacity-35"><Send size={19} /> Ask</button>
                <button type="button" onClick={() => { push(editor.getHTML(), true); setAssist({ instruction: '', section: sectionAsk.index }); setSectionAsk(null); }}
                  className="min-h-[54px] rounded-lg border border-white/25 text-white text-[16px] font-semibold flex items-center justify-center gap-2"><ScanSearch size={19} /> Look it over</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assist && (
        <ScopeAssistant currentHtml={assistHtml} instruction={assist.instruction}
          onClose={() => setAssist(null)}
          onApply={(next) => {
            const sec = assist.section;
            setAssist(null); setAsk('');
            setScope(sec != null ? replaceSection(editor.getHTML(), sec, next) : next, { show: true });
          }} />
      )}

      {lines && onAddLines && (
        <ScopeLines scopeHtml={editor.getHTML()} onClose={() => setLines(false)}
          onAdd={(items) => { setLines(false); onAddLines(items); setNote(`${items.length} item${items.length === 1 ? '' : 's'} added to the price list. Price them on the next step.`); }} />
      )}

      {sheet && (
        <ScopeOrganizer mode={sheet.mode} currentHtml={editor.getHTML()} initial={sheet.initial}
          onClose={() => setSheet(null)}
          onUse={(next) => { setSheet(null); setScope(next, { show: true, withRules: true }); }} />
      )}
    </div>
  );
}
