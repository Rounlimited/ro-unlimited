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
  Sparkles, FileUp, Undo2, Redo2, Trash2, Eye, Pencil, X, Check, Rows3, Columns3,
} from 'lucide-react';
import ScopeView from '@/components/estimates/ScopeView';
import ScopeOrganizer from '@/components/admin/estimates/ScopeOrganizer';
import { cleanScopeHtml, couldUseOrganizing, looksScrambled, scopeStats, scopeText } from '@/lib/scope-doc';

interface Props {
  content: string;
  onSave: (html: string) => void;
}

/**
 * Scope of Work editor.
 *
 * A scope is a document: sections with headings, and tables (equipment
 * schedules, item / basis lists). The editor keeps tables as tables when they
 * are pasted, saves as you type, and notices when what you pasted came in
 * scrambled or as one long run — then offers to organize it for you.
 */
export default function WizardStep3({ content, onSave }: Props) {
  const [sheet, setSheet] = useState<null | 'tidy' | 'import'>(null);
  const [preview, setPreview] = useState(false);
  const [html, setHtml] = useState(content || '');
  const [dismissed, setDismissed] = useState(false);
  const [undoHtml, setUndoHtml] = useState<string | null>(null);
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const [, force] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const lastSent = useRef(content || '');

  const push = (value: string, now = false) => {
    setHtml(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const send = () => { lastSent.current = value; onSaveRef.current(value); };
    if (now) send(); else saveTimer.current = setTimeout(send, 500);
  };

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
      // Word, Google Docs and web pages bring a lot of junk; keep the words, headings, lists and tables.
      transformPastedHTML: (pasted) => {
        try {
          const clean = cleanScopeHtml(pasted);
          const tables = (clean.match(/<table/g) || []).length;
          if (tables) setPasteNote(`${tables} table${tables === 1 ? '' : 's'} pasted in as ${tables === 1 ? 'a table' : 'tables'}.`);
          return clean;
        } catch { return pasted; }
      },
    },
    onUpdate: ({ editor: e }) => push(e.getHTML()),
    onBlur: ({ editor: e }) => push(e.getHTML(), true),
    onSelectionUpdate: () => force((n) => n + 1),
  });

  // Content arriving from outside (a template being filled in) replaces the editor's.
  useEffect(() => {
    if (!editor || content === lastSent.current) return;
    if (content !== editor.getHTML()) editor.commands.setContent(content || '', { emitUpdate: false });
    lastSent.current = content || '';
    setHtml(content || '');
  }, [content, editor]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  useEffect(() => { if (!pasteNote) return; const t = setTimeout(() => setPasteNote(null), 5000); return () => clearTimeout(t); }, [pasteNote]);

  const stats = useMemo(() => scopeStats(html), [html]);
  const scrambled = useMemo(() => looksScrambled(html), [html]);
  const flat = useMemo(() => !scrambled && couldUseOrganizing(html), [html, scrambled]);
  const hasText = useMemo(() => !!scopeText(html), [html]);
  useEffect(() => { if (!scrambled && !flat) setDismissed(false); }, [scrambled, flat]);

  if (!editor) return null;

  const replaceAll = (next: string, keepUndo: boolean) => {
    const before = editor.getHTML();
    editor.commands.setContent(next, { emitUpdate: false });
    const now = editor.getHTML();
    push(now, true);
    setUndoHtml(keepUndo && scopeText(before) ? before : null);
    setDismissed(true);
    setPreview(true);
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

  return (
    <div className="space-y-4">
      <p className="text-[17px] text-white/75 leading-relaxed">
        What the job includes. This is what the customer reads, so sections and tables make it easy to follow.
      </p>

      {/* The two shortcuts: have it organized, or bring a whole document in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button type="button" disabled={!hasText} onClick={() => setSheet('tidy')}
          className="min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[17px] font-bold flex items-center justify-center gap-2 disabled:opacity-35 active:scale-[0.99]">
          <Sparkles size={20} /> Tidy it up for me
        </button>
        <button type="button" onClick={() => setSheet('import')}
          className="min-h-[56px] rounded-xl border border-white/25 text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:bg-white/5">
          <FileUp size={20} /> Bring in a document
        </button>
      </div>

      {(scrambled || flat) && !dismissed && (
        <div className="rounded-xl border border-[#f0a04b]/60 bg-[#f0a04b]/12 px-4 py-3.5">
          <p className="text-[17px] font-semibold text-white leading-snug">
            {scrambled ? 'This looks like a table that lost its columns.' : 'This is one long run of text.'}
          </p>
          <p className="text-[16px] text-white/80 mt-1 leading-snug">
            {scrambled
              ? 'The values came in one per line, so a customer can’t tell what goes with what. It can be rebuilt into a proper table.'
              : 'It can be split into sections with headings, and tables where they fit, without changing your wording.'}
          </p>
          <div className="flex gap-2.5 mt-3">
            <button type="button" onClick={() => setSheet('tidy')}
              className="min-h-[48px] px-4 rounded-lg bg-[#f0a04b] text-black text-[16px] font-bold flex items-center gap-2"><Sparkles size={18} /> {scrambled ? 'Rebuild it' : 'Organize it'}</button>
            <button type="button" onClick={() => setDismissed(true)}
              className="min-h-[48px] px-4 rounded-lg text-white/85 text-[16px] font-semibold active:bg-white/10">Leave it</button>
          </div>
        </div>
      )}

      {undoHtml !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-[#35d07f]/40 bg-[#35d07f]/10 px-4 py-2.5">
          <Check size={20} className="text-[#5fe0a0] shrink-0" />
          <p className="flex-1 text-[16px] text-white">The scope was replaced with the organized one.</p>
          <button type="button" onClick={() => { const b = undoHtml; setUndoHtml(null); editor.commands.setContent(b, { emitUpdate: false }); push(editor.getHTML(), true); }}
            className="min-h-[44px] px-3 rounded-lg text-[16px] font-bold text-white underline underline-offset-2">Put mine back</button>
          <button type="button" onClick={() => setUndoHtml(null)} aria-label="Dismiss" className="w-11 h-11 flex items-center justify-center text-white/70"><X size={19} /></button>
        </div>
      )}

      <div className="border border-white/15 rounded-xl overflow-hidden bg-[#111]">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-[#0d0d0d]">
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
                <Tool wide onClick={() => { if (window.confirm('Remove this whole table?')) editor.chain().focus().deleteTable().run(); }} label="Remove the whole table"><Trash2 size={18} /> Table</Tool>
              </div>
            )}

            {pasteNote && (
              <div className="px-4 py-2 border-b border-white/10 bg-[#35d07f]/10 text-[16px] text-white flex items-center gap-2"><Check size={18} className="text-[#5fe0a0]" /> {pasteNote}</div>
            )}

            <div className="scope-editor"><EditorContent editor={editor} /></div>
          </>
        )}

        {preview && (
          <div className="p-4 sm:p-5">
            {hasText
              ? <ScopeView html={html} theme="dark" size={17} />
              : <p className="text-[17px] text-white/60">Nothing written yet.</p>}
          </div>
        )}
      </div>

      {sheet && (
        <ScopeOrganizer mode={sheet} currentHtml={editor.getHTML()}
          onClose={() => setSheet(null)}
          onUse={(next) => { setSheet(null); replaceAll(next, true); }} />
      )}
    </div>
  );
}
