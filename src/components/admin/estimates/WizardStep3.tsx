'use client';

import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Link as LinkIcon,
} from 'lucide-react';

interface Props {
  content: string;
  onSave: (html: string) => void;
}

export default function WizardStep3({ content, onSave }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Describe the scope of work, project details, specifications...' }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
        style: 'min-height:200px;outline:none;color:#e8ddd0;font-size:15px;line-height:1.7;padding:16px 18px;',
      },
    },
    onBlur: ({ editor: e }) => {
      onSave(e.getHTML());
    },
  });

  // Update editor content when prop changes (e.g., template fill)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const ToolBtn = ({
    active, onClick, children, label,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`p-2 rounded-md transition-colors ${
        active ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-white/50">
        Write a detailed scope of work for this project. This will appear on the estimate document.
      </p>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#111]">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/10 bg-[#0d0d0d] flex-wrap">
          <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold">
            <Bold size={16} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic">
            <Italic size={16} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Underline">
            <Underline size={16} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough">
            <Strikethrough size={16} />
          </ToolBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet List">
            <List size={16} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Ordered List">
            <ListOrdered size={16} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Blockquote">
            <Quote size={16} />
          </ToolBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolBtn
            active={editor.isActive('link')}
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              const url = window.prompt('Enter URL:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            label="Link"
          >
            <LinkIcon size={16} />
          </ToolBtn>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
