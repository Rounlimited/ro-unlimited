"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Inbox, Send, FileEdit, Star, Trash2, AlertOctagon,
  Search, ChevronLeft, MailOpen, Reply, Forward, Mail,
  X, Check, Loader2, Users, Paperclip, Menu, Pencil,
  MoreVertical, ChevronDown, RefreshCw, Plus, Bold, Italic,
  Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Link2,
  EyeOff, CheckSquare, Square, Download, Eye, FileText, Image,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { createClient } from "@/lib/supabase/client";

// ── Types ──
interface Thread {
  thread_id: string; subject: string; to_email: string; from_email: string;
  latest_message: string; latest_body_preview: string; latest_direction: string;
  message_count: number; unread_count: number; starred: boolean;
  has_attachments: boolean; lead_id: string | null; created_at: string;
}
interface Message {
  id: string; thread_id: string; direction: string; from_email: string;
  to_email: string; subject: string; body_html: string | null;
  body_text: string | null; read: boolean; starred: boolean;
  folder: string; created_at: string; cc_emails: string[]; bcc_emails: string[];
  attachments: { id: string; filename: string; content_type: string; size_bytes: number; s3_url: string }[];
}
interface EmailAccount { id?: string; email: string; display_name: string; color: string; initials: string; is_default?: boolean; }

type Folder = "inbox" | "sent" | "drafts" | "starred" | "trash" | "spam";
type ComposeMode = "new" | "reply" | "forward" | null;
type View = "list" | "thread" | "compose" | "accounts";

const FOLDERS: { key: Folder; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "spam", label: "Spam", icon: AlertOctagon },
];

function getInitial(str: string): string { return str.charAt(0).toUpperCase(); }
function avatarColor(email: string): string {
  const colors = ["#D4772C", "#C9A84C", "#3b8dd4", "#22C55E", "#EC4899", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316", "#EAB308"];
  let h = 0; for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Tiptap Toolbar ──
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const Btn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} type="button"
      className={`p-1.5 rounded transition-colors ${active ? "bg-[#D4772C]/20 text-[#D4772C]" : "text-white/40 hover:text-white/70"}`}>
      {children}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-0.5 px-3 py-1.5 border-b border-white/5 bg-black/20">
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Btn>
      <span className="w-px bg-white/10 mx-1" />
      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
      <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Btn>
      <span className="w-px bg-white/10 mx-1" />
      <Btn active={editor.isActive("link")} onClick={() => {
        if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
        const url = window.prompt("Enter URL:"); if (url) editor.chain().focus().setLink({ href: url }).run();
      }}><Link2 size={16} /></Btn>
    </div>
  );
}

// ── Attachment Preview (Gmail-style inline preview + download) ──
function AttachmentPreview({ attachments }: { attachments: Message["attachments"] }) {
  const [previewAtt, setPreviewAtt] = useState<Message["attachments"][0] | null>(null);

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getIcon(ct: string) {
    if (ct.startsWith("image/")) return <Image size={18} className="text-blue-400" />;
    if (ct === "application/pdf") return <FileText size={18} className="text-red-400" />;
    return <Paperclip size={18} className="text-[#C9A84C]" />;
  }

  function isPreviewable(ct: string) {
    return ct.startsWith("image/") || ct === "application/pdf";
  }

  return (
    <>
      <div className="mt-4 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/10">
          <Paperclip size={14} className="text-white/40" />
          <span className="text-[13px] text-white/50 font-medium">
            {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid gap-0 divide-y divide-white/5">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 px-3 py-3 hover:bg-white/[0.03] transition-colors">
              {/* Icon/Thumbnail */}
              {att.content_type.startsWith("image/") ? (
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 cursor-pointer"
                  onClick={() => setPreviewAtt(att)}>
                  <img src={att.s3_url} alt={att.filename}
                    className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {getIcon(att.content_type)}
                </div>
              )}
              {/* File info — constrained width so buttons always show */}
              <div className="min-w-0" style={{ flex: '1 1 0', maxWidth: 'calc(100% - 120px)' }}>
                <p className="text-[13px] text-white/80 font-medium truncate">{att.filename}</p>
                <p className="text-[11px] text-white/30">{formatSize(att.size_bytes)}</p>
              </div>
              {/* Actions — always visible */}
              <div className="flex items-center gap-0 flex-shrink-0 ml-auto">
                {isPreviewable(att.content_type) && (
                  <button onClick={() => setPreviewAtt(att)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                    title="Preview">
                    <Eye size={18} />
                  </button>
                )}
                <a href={att.s3_url} download={att.filename} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-[#C9A84C] transition-colors"
                  title="Download">
                  <Download size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fullscreen Preview Modal ── */}
      {previewAtt && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
          onClick={() => setPreviewAtt(null)}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 min-w-0">
              {getIcon(previewAtt.content_type)}
              <span className="text-[15px] text-white/80 font-medium truncate">{previewAtt.filename}</span>
              <span className="text-[12px] text-white/30 flex-shrink-0">{formatSize(previewAtt.size_bytes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <a href={previewAtt.s3_url} download={previewAtt.filename} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[13px] text-white/80 transition-colors"
                onClick={e => e.stopPropagation()}>
                <Download size={14} /> Download
              </a>
              <button onClick={() => setPreviewAtt(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors ml-1">
                <X size={20} />
              </button>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4"
            onClick={e => e.stopPropagation()}>
            {previewAtt.content_type.startsWith("image/") ? (
              <img src={previewAtt.s3_url} alt={previewAtt.filename}
                className="max-w-full max-h-full object-contain rounded-lg" />
            ) : previewAtt.content_type === "application/pdf" ? (
              <iframe src={previewAtt.s3_url} title={previewAtt.filename}
                className="w-full h-full rounded-lg bg-white" style={{ maxWidth: 900 }} />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminInbox() {
  // ── State ──
  const [view, setView] = useState<View>("list");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState("");

  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);

  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<EmailAccount | null>(null);
  const [fromAccount, setFromAccount] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout>();
  const showToast = (msg: string) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 3000); };

  // ── Multi-select state ──
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<NodeJS.Timeout>();
  const longPressTriggered = useRef(false);

  // ── Dropdown menu state ──
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [msgMenuOpenId, setMsgMenuOpenId] = useState<string | null>(null);
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);
  const threadMenuRef = useRef<HTMLDivElement>(null);
  const msgMenuRef = useRef<HTMLDivElement>(null);

  // ── User email for persistent state ──
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const persistInitialized = useRef(false);

  // Tiptap editor for compose
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Compose email..." }),
    ],
    editorProps: {
      attributes: { class: "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-[15px] leading-relaxed text-white/90" },
    },
  });

  // ── Get user email from Supabase auth ──
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  // ── Load persistent state when userEmail is available ──
  useEffect(() => {
    if (!userEmail || persistInitialized.current) return;
    try {
      const saved = localStorage.getItem("ro_inbox_state_" + userEmail);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.folder && FOLDERS.some(f => f.key === parsed.folder)) {
          setFolder(parsed.folder);
        }
        // accountEmail will be applied once accounts are loaded
        if (parsed.accountEmail) {
          // Store it temporarily so we can apply it after accounts load
          persistInitialized.current = true;
          (window as any).__ro_inbox_saved_account = parsed.accountEmail;
        } else {
          persistInitialized.current = true;
        }
      } else {
        persistInitialized.current = true;
      }
    } catch {
      persistInitialized.current = true;
    }
  }, [userEmail]);

  // ── Save persistent state when folder or account changes ──
  useEffect(() => {
    if (!userEmail || !persistInitialized.current) return;
    try {
      localStorage.setItem("ro_inbox_state_" + userEmail, JSON.stringify({
        accountEmail: activeAccount?.email || null,
        folder,
      }));
    } catch { /* ignore */ }
  }, [userEmail, activeAccount, folder]);

  // ── Close dropdown menus when clicking outside ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (threadMenuOpen && threadMenuRef.current && !threadMenuRef.current.contains(e.target as Node)) {
        setThreadMenuOpen(false);
      }
      if (msgMenuOpenId && msgMenuRef.current && !msgMenuRef.current.contains(e.target as Node)) {
        setMsgMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [threadMenuOpen, msgMenuOpenId]);

  // ── Fetch accounts ──
  const fetchAccounts = async () => {
    const res = await fetch("/api/admin/email-accounts");
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.accounts || []);
    if (list.length) {
      setAccounts(list);
      if (!activeAccount) {
        // Check if there's a saved account from localStorage
        const savedAccountEmail = (window as any).__ro_inbox_saved_account;
        if (savedAccountEmail) {
          const saved = list.find((a: EmailAccount) => a.email === savedAccountEmail);
          if (saved) {
            setActiveAccount(saved);
            setFromAccount(saved.email);
            delete (window as any).__ro_inbox_saved_account;
            return;
          }
          delete (window as any).__ro_inbox_saved_account;
        }
        const def = list.find((a: EmailAccount) => a.is_default) || list[0];
        setActiveAccount(def);
        setFromAccount(def.email);
      }
    }
  };
  useEffect(() => { fetchAccounts(); }, []);

  // ── Fetch threads ──
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ folder });
    if (activeAccount) params.set("account", activeAccount.email);
    const res = await fetch(`/api/email/threads?${params}`);
    const data = await res.json();
    setThreads(data.threads || []);
    setFolderCounts(data.folderCounts || {});
    setLoading(false);
  }, [folder, activeAccount]);
  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // ── Open thread ──
  const openThread = async (thread: Thread) => {
    setSelectedThread(thread);
    setView("thread");
    setLoadingThread(true);
    const res = await fetch("/api/email/threads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: thread.thread_id, account: activeAccount?.email }),
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingThread(false);
    setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, unread_count: 0 } : t));
  };

  // ── Thread actions ──
  const threadAction = async (action: string, threadIds?: string[]) => {
    const ids = threadIds || (selectedThread ? [selectedThread.thread_id] : []);
    if (!ids.length) return;
    await fetch("/api/email/threads", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_ids: ids, action, account: activeAccount?.email }),
    });
    const toastMap: Record<string, string> = {
      trash: "Moved to trash",
      star: "Starred",
      unstar: "Unstarred",
      mark_unread: "Marked as unread",
      spam: "Moved to spam",
      mark_read: "Marked as read",
    };
    showToast(toastMap[action] || "Updated");
    if ((action === "trash" || action === "mark_unread") && view === "thread") setView("list");
    fetchThreads();
  };

  // ── Multi-select helpers ──
  const enterSelectMode = (threadId: string) => {
    setSelectMode(true);
    setSelectedIds(new Set([threadId]));
  };

  const toggleSelect = (threadId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const batchAction = async (action: string) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await threadAction(action, ids);
    exitSelectMode();
  };

  // ── Long press handlers ──
  const handlePointerDown = (threadId: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      enterSelectMode(threadId);
    }, 500);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handlePointerCancel = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleThreadClick = (thread: Thread) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (selectMode) {
      toggleSelect(thread.thread_id);
    } else {
      openThread(thread);
    }
  };

  // ── Compose ──
  const startCompose = (mode: ComposeMode, replyMsg?: Message) => {
    setComposeMode(mode);
    setFromAccount(activeAccount?.email || accounts[0]?.email || "");
    if (mode === "new") {
      setComposeTo(""); setComposeSubject("");
      editor?.commands.setContent("");
    } else if (mode === "reply" && replyMsg) {
      setComposeTo(replyMsg.direction === "inbound" ? replyMsg.from_email : replyMsg.to_email);
      setComposeSubject(replyMsg.subject.startsWith("Re:") ? replyMsg.subject : `Re: ${replyMsg.subject}`);
      editor?.commands.setContent("");
    } else if (mode === "forward" && replyMsg) {
      setComposeTo("");
      setComposeSubject(`Fwd: ${replyMsg.subject.replace(/^Fwd:\s*/i, "")}`);
      const fwdBody = `<br><br><p style="color:#888">---------- Forwarded message ----------</p><p style="color:#888">From: ${replyMsg.from_email}<br>Date: ${new Date(replyMsg.created_at).toLocaleString()}<br>Subject: ${replyMsg.subject}</p><br>${replyMsg.body_html || replyMsg.body_text || ""}`;
      editor?.commands.setContent(fwdBody);
    }
    setShowCcBcc(false); setComposeCc(""); setComposeBcc("");
    setView("compose");
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject) return;
    setSending(true);
    const html = editor?.getHTML() || "";
    const text = editor?.getText() || "";
    const isReply = composeMode === "reply" && selectedThread;
    const endpoint = isReply ? "/api/email/reply" : "/api/email/compose";
    const payload = isReply
      ? { thread_id: selectedThread!.thread_id, to_email: composeTo, subject: composeSubject, reply_html: html, reply_body: text, from_email: fromAccount }
      : { to_email: composeTo, subject: composeSubject, body_html: html, body: text, from_email: fromAccount, cc_emails: composeCc ? composeCc.split(",").map(e => e.trim()) : [], bcc_emails: composeBcc ? composeBcc.split(",").map(e => e.trim()) : [] };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSending(false);
    if (res.ok) { showToast("Email sent"); setView("list"); fetchThreads(); } else { showToast("Failed to send"); }
  };

  const filtered = threads.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.subject.toLowerCase().includes(s) || t.to_email.toLowerCase().includes(s) || t.from_email.toLowerCase().includes(s) || t.latest_body_preview.toLowerCase().includes(s);
  });

  // ═══════════════════════════════════════════
  // ACCOUNT SWITCHER — Full screen
  // ═══════════════════════════════════════════
  if (view === "accounts") {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          {activeAccount && (
            <>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: activeAccount.color + "25", color: activeAccount.color }}>
                {activeAccount.initials}
              </div>
              <span className="flex-1 text-[15px] text-white truncate">{activeAccount.email}</span>
            </>
          )}
          <button onClick={() => setView("list")} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-lg font-semibold text-white">Switch account</span>
            <ChevronDown size={20} className="text-white/40" />
          </div>
          <button onClick={() => { setActiveAccount(null); setView("list"); }}
            className={`w-full flex items-center gap-4 px-5 py-4 border-t border-white/[0.04] transition-colors hover:bg-white/[0.03] ${!activeAccount ? "bg-[#C9A84C]/5" : ""}`}>
            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
              <Mail size={20} className="text-white/40" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[16px] font-semibold text-white">All Accounts</p>
              <p className="text-[14px] text-white/40">View all inboxes</p>
            </div>
          </button>
          {accounts.map(account => (
            <button key={account.email} onClick={() => { setActiveAccount(account); setFromAccount(account.email); setView("list"); }}
              className={`w-full flex items-center gap-4 px-5 py-4 border-t border-white/[0.04] transition-colors hover:bg-white/[0.03] ${activeAccount?.email === account.email ? "bg-[#C9A84C]/5" : ""}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0" style={{ backgroundColor: account.color + "25", color: account.color }}>
                {account.initials}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[16px] font-semibold text-white truncate">{account.display_name}</p>
                <p className="text-[14px] text-white/40 truncate">{account.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // COMPOSE — Full screen with Tiptap
  // ═══════════════════════════════════════════
  if (view === "compose") {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <button onClick={() => setView(selectedThread ? "thread" : "list")} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
            <X size={24} />
          </button>
          <h2 className="font-semibold text-[17px] text-white flex-1">
            {composeMode === "new" ? "Compose" : composeMode === "reply" ? "Reply" : "Forward"}
          </h2>
          <button onClick={handleSend} disabled={sending || !composeTo || !composeSubject}
            className="px-6 py-2 bg-[#C9A84C] text-black font-bold text-[15px] rounded-full disabled:opacity-40 transition-opacity">
            {sending ? <Loader2 size={18} className="animate-spin" /> : "Send"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {accounts.length > 1 && (
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
              <span className="text-white/40 text-[15px] w-16">From</span>
              <select value={fromAccount} onChange={e => setFromAccount(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-white focus:outline-none">
                {accounts.map(a => <option key={a.email} value={a.email}>{a.display_name} &lt;{a.email}&gt;</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
            <span className="text-white/40 text-[15px] w-16">To</span>
            <input type="email" value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="Recipient"
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none" />
            {!showCcBcc && <button onClick={() => setShowCcBcc(true)} className="text-[13px] text-white/30 hover:text-[#C9A84C] px-2">Cc/Bcc</button>}
          </div>
          {showCcBcc && (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
                <span className="text-white/40 text-[15px] w-16">Cc</span>
                <input type="text" value={composeCc} onChange={e => setComposeCc(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none" />
              </div>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
                <span className="text-white/40 text-[15px] w-16">Bcc</span>
                <input type="text" value={composeBcc} onChange={e => setComposeBcc(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none" />
              </div>
            </>
          )}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
            <span className="text-white/40 text-[15px] w-16">Subject</span>
            <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject"
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none" />
          </div>
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
          {/* Attachment bar */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2">
            <button
              onClick={() => showToast("Attachments coming soon — storage integration pending")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors text-[13px]">
              <Paperclip size={16} />
              Attach file
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // THREAD VIEW — Full screen
  // ═══════════════════════════════════════════
  if (view === "thread" && selectedThread) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-1 px-2 py-2 border-b border-white/5">
          <button onClick={() => { setView("list"); setSelectedThread(null); setThreadMenuOpen(false); }} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
            <ChevronLeft size={26} />
          </button>
          <div className="flex-1" />
          <button onClick={() => threadAction("trash")} className="p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-white/5"><Trash2 size={22} /></button>
          <button onClick={() => threadAction(selectedThread.starred ? "unstar" : "star")} className="p-2 rounded-full text-white/40 hover:text-[#D4772C] hover:bg-white/5"><MailOpen size={22} /></button>
          {/* Thread three-dot menu */}
          <div className="relative" ref={threadMenuRef}>
            <button onClick={() => setThreadMenuOpen(!threadMenuOpen)} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
              <MoreVertical size={22} />
            </button>
            {threadMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => { setThreadMenuOpen(false); threadAction("mark_unread"); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                  <EyeOff size={18} className="text-white/40" /> Mark as unread
                </button>
                <button onClick={() => { setThreadMenuOpen(false); threadAction("spam"); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                  <AlertOctagon size={18} className="text-white/40" /> Move to spam
                </button>
                <button onClick={() => { setThreadMenuOpen(false); threadAction("trash"); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                  <Trash2 size={18} className="text-white/40" /> Move to trash
                </button>
                <button onClick={() => { setThreadMenuOpen(false); threadAction(selectedThread.starred ? "unstar" : "star"); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                  <Star size={18} className="text-white/40" /> {selectedThread.starred ? "Unstar" : "Star"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-[22px] font-bold text-white leading-tight">{selectedThread.subject}</h1>
            <button onClick={() => threadAction(selectedThread.starred ? "unstar" : "star")} className="mt-1 shrink-0">
              <Star size={24} className={selectedThread.starred ? "fill-[#D4772C] text-[#D4772C]" : "text-white/20"} />
            </button>
          </div>
          <span className="inline-block mt-2 text-[12px] font-semibold text-white/40 bg-white/5 border border-white/10 rounded px-2.5 py-0.5">Inbox</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {loadingThread ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="text-[#C9A84C] animate-spin" /></div>
          ) : messages.map(msg => (
            <div key={msg.id} className="bg-[#111]/60 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0" style={{ backgroundColor: avatarColor(msg.from_email) + "30", color: avatarColor(msg.from_email) }}>
                  {getInitial(msg.from_email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-white">{msg.from_email.split("@")[0]}</span>
                    <span className="text-[13px] text-white/30">{new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                  <button
                    onClick={() => setExpandedMsgId(expandedMsgId === msg.id ? null : msg.id)}
                    className="flex items-center gap-1 text-[13px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    to {msg.direction === "outbound" ? msg.to_email : "me"}
                    <ChevronDown size={10} className={`inline transition-transform ${expandedMsgId === msg.id ? "rotate-180" : ""}`} />
                  </button>
                  {expandedMsgId === msg.id && (
                    <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[12px] space-y-1.5">
                      <div className="flex gap-2">
                        <span className="text-white/30 w-12 shrink-0">From</span>
                        <span className="text-white/60">{msg.from_email}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/30 w-12 shrink-0">To</span>
                        <span className="text-white/60">{msg.to_email}</span>
                      </div>
                      {msg.cc_emails?.length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-white/30 w-12 shrink-0">CC</span>
                          <span className="text-white/60">{msg.cc_emails.join(", ")}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <span className="text-white/30 w-12 shrink-0">Date</span>
                        <span className="text-white/60">
                          {new Date(msg.created_at).toLocaleString("en-US", {
                            timeZone: "America/New_York",
                            weekday: "short", month: "short", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit", hour12: true,
                          })} ET
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/30 w-12 shrink-0">Subject</span>
                        <span className="text-white/60">{msg.subject}</span>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => startCompose("reply", msg)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5"><Reply size={20} /></button>
                {/* Per-message three-dot menu */}
                <div className="relative" ref={msgMenuOpenId === msg.id ? msgMenuRef : undefined}>
                  <button onClick={() => setMsgMenuOpenId(msgMenuOpenId === msg.id ? null : msg.id)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5">
                    <MoreVertical size={20} />
                  </button>
                  {msgMenuOpenId === msg.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                      <button onClick={() => { setMsgMenuOpenId(null); startCompose("reply", msg); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                        <Reply size={18} className="text-white/40" /> Reply
                      </button>
                      <button onClick={() => { setMsgMenuOpenId(null); startCompose("forward", msg); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                        <Forward size={18} className="text-white/40" /> Forward
                      </button>
                      <button onClick={() => { setMsgMenuOpenId(null); threadAction("mark_unread"); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-white/80 hover:bg-white/5 transition-colors">
                        <EyeOff size={18} className="text-white/40" /> Mark as unread
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {msg.body_html ? (
                <div className="text-[15px] text-white/80 leading-relaxed overflow-x-auto overflow-y-hidden max-w-full [&_a]:text-[#3b8dd4] [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:table-fixed [&_td]:break-words [&_div]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: msg.body_html }} />
              ) : (
                <pre className="text-[15px] text-white/80 whitespace-pre-wrap font-sans leading-relaxed">{msg.body_text || "(no content)"}</pre>
              )}
              {msg.attachments?.length > 0 && (
                <AttachmentPreview attachments={msg.attachments} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <button onClick={() => startCompose("reply", messages[messages.length - 1])}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-full text-[15px] text-white/60 hover:text-white transition-colors">
            <Reply size={18} /> Reply
          </button>
          <button onClick={() => startCompose("forward", messages[messages.length - 1])}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-full text-[15px] text-white/60 hover:text-white transition-colors">
            <Forward size={18} /> Forward
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // SIDEBAR — Full height, ~80% width
  // ═══════════════════════════════════════════
  const Sidebar = () => (
    <div className="fixed inset-0 z-[60]" onClick={() => setSidebarOpen(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-[#111] flex flex-col" style={{ animation: "slideInLeft 0.25s ease-out" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <span className="font-bold text-[20px] text-[#C9A84C]">RO Mail</span>
          {activeAccount && (
            <button onClick={() => { setSidebarOpen(false); setView("accounts"); }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: activeAccount.color + "25", color: activeAccount.color }}>
              {activeAccount.initials}
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2">
          {FOLDERS.map(f => (
            <button key={f.key} onClick={() => { setFolder(f.key); setSidebarOpen(false); setSelectedThread(null); setView("list"); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-[16px] font-medium transition-colors mb-0.5 ${folder === f.key ? "bg-[#C9A84C]/10 text-[#C9A84C]" : "text-white/50 hover:bg-white/5"}`}>
              <f.icon size={22} />
              <span className="flex-1 text-left">{f.label}</span>
              {(folderCounts[f.key] || 0) > 0 && <span className="text-[15px]">{folderCounts[f.key]}</span>}
            </button>
          ))}
          <div className="h-px bg-white/5 my-3 mx-4" />
          <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-[16px] font-medium text-white/50 hover:bg-white/5">
            <Users size={22} /> <span className="flex-1 text-left">Contacts</span>
          </button>
          {folder === "trash" && (folderCounts.trash || 0) > 0 && (
            <>
              <div className="h-px bg-white/5 my-3 mx-4" />
              <button onClick={async () => {
                if (!confirm('Permanently delete all emails in trash?')) return;
                const trashThreads = threads.map(t => t.thread_id);
                if (trashThreads.length) {
                  await fetch("/api/email/threads", {
                    method: "DELETE", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ thread_ids: trashThreads, account: activeAccount?.email }),
                  });
                  showToast("Trash emptied");
                  setSidebarOpen(false);
                  fetchThreads();
                }
              }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-[16px] font-medium text-red-400 hover:bg-red-500/10">
                <Trash2 size={22} /> <span className="flex-1 text-left">Empty Trash</span>
              </button>
            </>
          )}
        </nav>
      </div>
      <style>{`@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );

  // ═══════════════════════════════════════════
  // MAIN LIST VIEW
  // ═══════════════════════════════════════════
  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] relative">
      {sidebarOpen && <Sidebar />}

      {/* Batch action bar — shown in select mode */}
      {selectMode && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#111] border-b border-white/5">
          <button onClick={exitSelectMode} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
            <X size={22} />
          </button>
          <span className="text-[16px] font-semibold text-white">{selectedIds.size} selected</span>
          <button onClick={() => {
            if (selectedIds.size === filtered.length) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(filtered.map(t => t.thread_id)));
            }
          }} className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-white/40 border border-white/10 hover:text-white hover:bg-white/5 ml-1" title="Select all">
            {selectedIds.size === filtered.length ? 'None' : 'All'}
          </button>
          <div className="flex-1" />
          <button onClick={() => batchAction("mark_read")} className="p-2 rounded-full text-white/40 hover:text-[#3b8dd4] hover:bg-white/5" title="Mark read">
            <MailOpen size={20} />
          </button>
          <button onClick={() => batchAction("mark_unread")} className="p-2 rounded-full text-white/40 hover:text-[#C9A84C] hover:bg-white/5" title="Mark unread">
            <EyeOff size={20} />
          </button>
          <button onClick={() => batchAction((() => { const allStarred = filtered.filter(t => selectedIds.has(t.thread_id)).every(t => t.starred); return allStarred ? "unstar" : "star"; })())}
            className="p-2 rounded-full text-white/40 hover:text-[#D4772C] hover:bg-white/5" title="Star/Unstar">
            <Star size={20} />
          </button>
          <button onClick={() => batchAction("trash")} className="p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-white/5" title="Trash">
            <Trash2 size={20} />
          </button>
        </div>
      )}

      {/* Top bar — Gmail style (hidden in select mode) */}
      {!selectMode && (
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5">
            <Menu size={26} />
          </button>
          <div className="flex-1 relative">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1a] rounded-full border border-white/5">
              <Search size={20} className="text-white/30 shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search in mail"
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none" />
            </div>
          </div>
          <button onClick={() => setView("accounts")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={activeAccount ? { backgroundColor: activeAccount.color + "25", color: activeAccount.color } : { backgroundColor: "#1a1a1a", color: "#888" }}>
            {activeAccount ? activeAccount.initials : "All"}
          </button>
        </div>
      )}

      {/* Folder label */}
      {!selectMode && (
        <div className="px-5 py-1.5">
          <span className="text-[15px] font-medium text-white/30 capitalize">{folder}</span>
        </div>
      )}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="text-[#C9A84C] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Mail size={44} className="text-white/10 mb-4" />
            <p className="text-white/30 text-[16px]">{search ? "No emails match your search." : "No emails in this folder."}</p>
          </div>
        ) : filtered.map(thread => {
          const senderEmail = folder === "sent" ? thread.to_email : thread.from_email;
          const senderName = senderEmail.split("@")[0];
          const isSelected = selectedIds.has(thread.thread_id);
          return (
            <button key={thread.thread_id}
              onPointerDown={() => handlePointerDown(thread.thread_id)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onContextMenu={e => { e.preventDefault(); if (!selectMode) enterSelectMode(thread.thread_id); }}
              onClick={() => handleThreadClick(thread)}
              className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors active:bg-white/[0.03] ${thread.unread_count > 0 ? "bg-[#C9A84C]/[0.02]" : ""} ${isSelected ? "bg-[#C9A84C]/[0.08]" : ""}`}>
              {/* Avatar or checkbox in select mode */}
              {/* Avatar — tap to enter select mode / toggle selection */}
              <div onClick={e => { e.stopPropagation(); if (selectMode) { setSelectedIds(prev => { const n = new Set(prev); n.has(thread.thread_id) ? n.delete(thread.thread_id) : n.add(thread.thread_id); return n; }); } else { enterSelectMode(thread.thread_id); } }}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all"
                style={isSelected
                  ? { border: '2px solid #C9A84C', backgroundColor: '#C9A84C20' }
                  : selectMode
                    ? { border: '2px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent' }
                    : { backgroundColor: avatarColor(senderEmail) + '25', color: avatarColor(senderEmail) }
                }>
                {isSelected ? <Check size={20} className="text-[#C9A84C]" />
                  : selectMode ? <span className="w-5 h-5" />
                  : <span className="text-[15px] font-bold">{getInitial(senderName)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[16px] truncate ${thread.unread_count > 0 ? "font-bold text-white" : "font-medium text-white/60"}`}>
                    {senderName}
                  </span>
                  {thread.message_count > 1 && <span className="text-[13px] text-white/25">{thread.message_count}</span>}
                  <span className="ml-auto text-[13px] text-white/25 shrink-0">{timeAgo(thread.latest_message)}</span>
                  {thread.unread_count > 0 && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] shrink-0" />}
                </div>
                <p className={`text-[15px] truncate mt-0.5 ${thread.unread_count > 0 ? "font-semibold text-white" : "text-white/50"}`}>
                  {thread.subject}
                </p>
                <p className="text-[14px] text-white/25 truncate mt-0.5">{thread.latest_body_preview}</p>
              </div>
              {!selectMode && (
                <button onClick={e => { e.stopPropagation(); threadAction(thread.starred ? "unstar" : "star", [thread.thread_id]); }}
                  className="mt-1.5 shrink-0 p-1">
                  <Star size={20} className={thread.starred ? "fill-[#D4772C] text-[#D4772C]" : "text-white/10"} />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* FAB Compose */}
      {!selectMode && (
        <button onClick={() => startCompose("new")}
          className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 z-30 flex items-center gap-2 px-6 py-4 bg-[#1a1a1a] border border-[#C9A84C]/20 rounded-2xl shadow-lg shadow-[#C9A84C]/5 text-[#C9A84C] font-bold text-[15px] hover:bg-[#222] transition-colors"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <Pencil size={20} /> Compose
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 lg:bottom-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#1a1a1a] border border-[#C9A84C]/30 rounded-full text-[15px] text-[#C9A84C] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
