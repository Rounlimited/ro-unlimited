"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";

// --- Types ---
type EmailFolder = "inbox" | "sent" | "drafts" | "trash" | "spam" | "starred";

interface EmailThread {
  thread_id: string; subject: string; to_email: string; from_email: string;
  latest_message: string; latest_body_preview: string; latest_direction: string;
  message_count: number; unread_count: number; starred: boolean;
  has_attachments: boolean; lead_id: string | null; created_at: string;
  customer_name?: string;
}

interface EmailMessage {
  id: string; thread_id: string; lead_id: string | null;
  direction: "outbound" | "inbound"; from_email: string; to_email: string;
  subject: string; body_html: string | null; body_text: string | null;
  resend_message_id: string | null; read: boolean; starred: boolean;
  folder: string; has_attachments: boolean; is_draft: boolean; created_at: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  id: string; message_id: string; filename: string; content_type: string;
  size_bytes: number; s3_key: string; s3_url: string;
}

interface EmailContact {
  id: string; name: string; email: string; phone: string | null;
  company: string | null; category: string; notes: string | null; starred: boolean;
}

interface FolderCounts {
  inbox: number; sent: number; starred: number; drafts: number; trash: number; spam: number;
}

// --- Multi-Account Config (mirrors server-side) ---
interface EmailAccount {
  email: string; display_name: string; color: string; initials: string;
}
const EMAIL_ACCOUNTS: EmailAccount[] = [
  { email: "build@rounlimited.com", display_name: "RO Unlimited", color: "#D4772C", initials: "RO" },
  { email: "jr@rounlimited.com", display_name: "JR — RO Unlimited", color: "#1B2A4A", initials: "JR" },
  { email: "info@rounlimited.com", display_name: "RO Unlimited Info", color: "#2a6a4a", initials: "IN" },
  { email: "sarah@rounlimited.com", display_name: "Sarah — RO Unlimited", color: "#7C3AED", initials: "SA" },
  { email: "david@rounlimited.com", display_name: "David — RO Unlimited", color: "#0891B2", initials: "DA" },
];
const DEFAULT_FROM = "build@rounlimited.com";
function getAccount(email: string) { return EMAIL_ACCOUNTS.find(a => a.email === email) || EMAIL_ACCOUNTS[0]; }

// --- Helpers ---
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function shortTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function getInitials(name: string | undefined, email: string): string {
  if (name) return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  return email.split("@")[0].substring(0, 2).toUpperCase();
}
function htmlToText(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\n{3,}/g, "\n\n").trim();
}

// --- SVG Icons ---
const IconBack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconCompose = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconSend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconReply = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
const IconForward = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>;
const IconStar = ({ filled }: { filled: boolean }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#D4772C" : "none"} stroke={filled ? "#D4772C" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconContacts = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconAttach = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const IconDraft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconChevron = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

// --- Tiptap Toolbar ---
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const btn = (active: boolean, onClick: () => void, label: string) => (
    <button key={label} onClick={onClick} type="button"
      style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: active ? "rgba(212,119,44,0.2)" : "transparent", color: active ? "#D4772C" : "#7a6a5a", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400, fontFamily: "inherit", lineHeight: 1 }}>
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px", borderBottom: "1px solid #1e2d45", background: "rgba(10,15,24,0.5)" }}>
      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "B")}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "I")}
      {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "U")}
      {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "S")}
      <span style={{ width: 1, background: "#1e2d45", margin: "0 4px" }} />
      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "List")}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "1. List")}
      {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Quote")}
      <span style={{ width: 1, background: "#1e2d45", margin: "0 4px" }} />
      {btn(editor.isActive("link"), () => {
        if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
        const url = window.prompt("Enter URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }, "Link")}
    </div>
  );
}

// --- From Account Selector ---
function FromSelector({ value, onChange }: { value: string; onChange: (email: string) => void }) {
  const [open, setOpen] = useState(false);
  const account = getAccount(value);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} type="button"
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, border: "1px solid #1e2d45", background: "rgba(13,20,32,0.8)", color: "#d0dae8", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: account.color, flexShrink: 0 }} />
        {account.email}
        <IconChevron />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#0d1420", border: "1px solid #1e2d45", borderRadius: 10, zIndex: 200, minWidth: 260, boxShadow: "0 8px 30px rgba(0,0,0,0.6)", overflow: "hidden" }}>
          {EMAIL_ACCOUNTS.map(a => (
            <button key={a.email} onClick={() => { onChange(a.email); setOpen(false); }} type="button"
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: a.email === value ? "rgba(212,119,44,0.08)" : "transparent", color: a.email === value ? "#D4772C" : "#d0dae8", fontSize: 12, cursor: "pointer", textAlign: "left", borderBottom: "1px solid #1e2d4533" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{a.display_name}</span>
                <span style={{ color: "#6a7a8a", marginLeft: 6 }}>{a.email}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export default function AdminInbox() {
  const [activeAccount, setActiveAccount] = useState<string | null>(null); // null = all accounts
  const [activeFolder, setActiveFolder] = useState<EmailFolder>("inbox");
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [folderCounts, setFolderCounts] = useState<FolderCounts>({ inbox: 0, sent: 0, starred: 0, drafts: 0, trash: 0, spam: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedMsgs, setCollapsedMsgs] = useState<Set<string>>(new Set());
  // Compose state (used for both new compose AND reply/forward)
  const [composeMode, setComposeMode] = useState<"closed" | "new" | "reply" | "forward">("closed");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
  const [showCc, setShowCc] = useState(false);
  const [composeCc, setComposeCc] = useState("");
  const [composeFrom, setComposeFrom] = useState(DEFAULT_FROM);
  const [composeQuotedHtml, setComposeQuotedHtml] = useState("");
  // Contacts state
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactModal, setContactModal] = useState<EmailContact | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", company: "", category: "other", notes: "" });
  const [contactSaving, setContactSaving] = useState(false);
  const [toSuggestions, setToSuggestions] = useState<EmailContact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Reply thread context (so we can reference the thread while in full-screen reply)
  const [replyThreadId, setReplyThreadId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const composeEditor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Placeholder.configure({ placeholder: "Write your message..." }), TextStyle, Color],
    content: "",
    editorProps: { attributes: { style: "min-height:120px;outline:none;color:#e8ddd0;font-size:14px;line-height:1.6;padding:12px 14px;" } },
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeThread = useCallback(() => {
    setSelectedThread(null); setMessages([]); setCollapsedMsgs(new Set());
  }, []);

  const closeCompose = useCallback(() => {
    setComposeMode("closed"); setComposeTo(""); setComposeSubject("");
    composeEditor?.commands.clearContent(); setComposeDraftId(null);
    setShowCc(false); setComposeCc(""); setComposeFrom(DEFAULT_FROM);
    setComposeQuotedHtml(""); setReplyThreadId(null);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
  }, [composeEditor]);

  const fetchThreads = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const params = new URLSearchParams({ folder: activeFolder });
      if (activeAccount) params.set("account", activeAccount);
      const res = await fetch(`/api/email/threads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.folderCounts) setFolderCounts(data.folderCounts);
      }
    } catch (e) { console.error("fetch threads:", e); }
    setLoading(false); setRefreshing(false);
  }, [activeFolder, activeAccount]);

  const fetchMessages = useCallback(async (threadId: string) => {
    const res = await fetch("/api/email/threads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, account: activeAccount || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      const msgs: EmailMessage[] = data.messages || [];
      setMessages(msgs);
      setSelectedThread(threadId);
      if (msgs.length > 1) setCollapsedMsgs(new Set(msgs.slice(0, -1).map(m => m.id)));
      else setCollapsedMsgs(new Set());
      setThreads(prev => prev.map(t => t.thread_id === threadId ? { ...t, unread_count: 0 } : t));
    }
  }, [activeAccount]);

  const fetchContacts = useCallback(async (q?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/email/contacts?${params}`);
    if (res.ok) { const data = await res.json(); setContacts(data.contacts || []); }
  }, []);

  const threadAction = async (threadIds: string[], action: string, value?: string) => {
    await fetch("/api/email/threads", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_ids: threadIds, action, value, account: activeAccount || undefined }),
    });
  };

  const toggleStar = async (threadId: string, currentStarred: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setThreads(prev => prev.map(t => t.thread_id === threadId ? { ...t, starred: !currentStarred } : t));
    await threadAction([threadId], currentStarred ? "unstar" : "star");
  };

  const moveToTrash = async (threadIds: string[]) => {
    await threadAction(threadIds, "trash");
    if (selectedThread && threadIds.includes(selectedThread)) closeThread();
    setSelectedIds(new Set()); showToast(`Moved ${threadIds.length} thread${threadIds.length > 1 ? "s" : ""} to trash`);
    fetchThreads(true);
  };

  const permanentDelete = async (threadIds: string[]) => {
    await fetch("/api/email/threads", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_ids: threadIds, account: activeAccount || undefined }),
    });
    if (selectedThread && threadIds.includes(selectedThread)) closeThread();
    setSelectedIds(new Set()); showToast("Permanently deleted"); fetchThreads(true);
  };

  // Unified send — works for new compose, reply, and forward
  const sendCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) return;
    const html = composeEditor?.getHTML() || "";
    if (!html || html === "<p></p>") return;
    setComposeSending(true);

    const isReply = composeMode === "reply" && replyThreadId;
    const endpoint = isReply ? "/api/email/reply" : "/api/email/compose";

    const payload: Record<string, unknown> = {
      to_email: composeTo.trim(),
      subject: composeSubject.trim(),
      from_email: composeFrom,
    };
    if (isReply) {
      payload.thread_id = replyThreadId;
      payload.reply_html = html;
      payload.reply_body = composeEditor?.getText() || "";
      const thread = threads.find(t => t.thread_id === replyThreadId);
      payload.to_name = thread?.customer_name;
      payload.lead_id = thread?.lead_id;
    } else {
      payload.body_html = html;
      payload.draft_id = composeDraftId;
      if (showCc && composeCc.trim()) payload.cc_emails = composeCc.split(",").map(e => e.trim()).filter(Boolean);
    }

    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast(isReply ? "Reply sent!" : "Email sent!");
      closeCompose();
      if (isReply && replyThreadId) fetchMessages(replyThreadId);
      fetchThreads(true);
    } else {
      showToast("Failed to send", "error");
    }
    setComposeSending(false);
  };

  const saveDraft = useCallback(async () => {
    if (composeMode === "closed") return;
    const html = composeEditor?.getHTML() || "";
    const res = await fetch("/api/email/drafts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft_id: composeDraftId, to_email: composeTo, subject: composeSubject || "(no subject)", body_html: html, body_text: composeEditor?.getText() || "" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.draft?.id && !composeDraftId) setComposeDraftId(data.draft.id);
    }
  }, [composeMode, composeTo, composeSubject, composeDraftId, composeEditor]);

  // Open reply — full screen compose pre-filled
  const openReply = () => {
    if (!selectedThread) return;
    const thread = threads.find(t => t.thread_id === selectedThread);
    if (!thread) return;
    const lastMsg = messages[messages.length - 1];
    const replyTo = lastMsg?.direction === "inbound" ? lastMsg.from_email : thread.to_email;
    setReplyThreadId(selectedThread);
    setComposeTo(replyTo);
    setComposeSubject(thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`);
    setComposeFrom(activeAccount || DEFAULT_FROM);
    // Build quoted text
    if (lastMsg) {
      const quotedBody = lastMsg.body_html || lastMsg.body_text?.replace(/\n/g, "<br>") || "";
      const quotedDate = formatDate(lastMsg.created_at);
      const quotedFrom = lastMsg.from_email;
      setComposeQuotedHtml(`<br><br><div style="border-left:2px solid #D4772C;padding-left:12px;margin-top:16px;color:#6a7a8a;font-size:13px;"><p>On ${quotedDate}, ${quotedFrom} wrote:</p>${quotedBody}</div>`);
    }
    composeEditor?.commands.clearContent();
    setComposeMode("reply");
  };

  // Open forward — full screen compose, empty To
  const openForward = () => {
    if (!selectedThread) return;
    const thread = threads.find(t => t.thread_id === selectedThread);
    if (!thread) return;
    const lastMsg = messages[messages.length - 1];
    setReplyThreadId(null); // forward creates new thread
    setComposeTo("");
    setComposeSubject(thread.subject.startsWith("Fwd:") ? thread.subject : `Fwd: ${thread.subject}`);
    setComposeFrom(activeAccount || DEFAULT_FROM);
    if (lastMsg) {
      const fwdBody = lastMsg.body_html || lastMsg.body_text?.replace(/\n/g, "<br>") || "";
      const fwdDate = formatDate(lastMsg.created_at);
      const fwdFrom = lastMsg.from_email;
      const fwdTo = lastMsg.to_email;
      setComposeQuotedHtml(`<br><br><div style="border-left:2px solid #6a7a8a;padding-left:12px;margin-top:16px;color:#6a7a8a;font-size:13px;"><p>---------- Forwarded message ----------<br>From: ${fwdFrom}<br>Date: ${fwdDate}<br>Subject: ${thread.subject}<br>To: ${fwdTo}</p>${fwdBody}</div>`);
    }
    composeEditor?.commands.clearContent();
    setComposeMode("forward");
  };

  const openDraft = (thread: EmailThread) => {
    fetch("/api/email/threads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thread_id: thread.thread_id }) })
      .then(r => r.json()).then(data => {
        const draft = (data.messages || [])[0];
        if (draft) {
          setComposeTo(draft.to_email || ""); setComposeSubject(draft.subject || "");
          composeEditor?.commands.setContent(draft.body_html || draft.body_text || "");
          setComposeDraftId(draft.id); setComposeMode("new");
        }
      });
  };

  const searchContacts = async (q: string) => {
    if (q.length < 2) { setToSuggestions([]); setShowSuggestions(false); return; }
    const res = await fetch(`/api/email/contacts?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setToSuggestions(data.contacts || []);
      setShowSuggestions((data.contacts || []).length > 0);
    }
  };

  const saveContact = async () => {
    setContactSaving(true);
    const res = await fetch("/api/email/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: contactModal?.id ? "update" : "create", contact: { ...contactForm, id: contactModal?.id } }),
    });
    if (res.ok) { showToast("Contact saved!"); setContactModal(null); fetchContacts(); }
    else { showToast("Failed to save", "error"); }
    setContactSaving(false);
  };

  const deleteContact = async (id: string) => {
    await fetch("/api/email/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", contact: { id, name: "", email: "" } }) });
    showToast("Deleted"); fetchContacts();
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filteredThreads = threads.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.customer_name || "").toLowerCase().includes(q) || t.to_email.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.latest_body_preview.toLowerCase().includes(q);
  });

  const allSelected = filteredThreads.length > 0 && selectedIds.size === filteredThreads.length;
  const someSelected = selectedIds.size > 0;
  const selectedThreadData = threads.find(t => t.thread_id === selectedThread);

  useEffect(() => { fetchThreads(); setSelectedIds(new Set()); }, [fetchThreads]);
  useEffect(() => { if (contactsOpen) fetchContacts(); }, [contactsOpen, fetchContacts]);
  useEffect(() => {
    if (composeMode === "closed") return;
    draftTimerRef.current = setInterval(() => saveDraft(), 30000);
    return () => { if (draftTimerRef.current) clearInterval(draftTimerRef.current); };
  }, [composeMode, saveDraft]);

  // Brand colors
  const NAVY = "#1B2A4A";
  const ORANGE = "#D4772C";
  const BG = "#0a0f18";
  const BG2 = "#0d1420";
  const BORDER = "#1e2d45";
  const TEXT = "#d0dae8";
  const MUTED = "#6a7a8a";

  // Is compose/reply/forward fullscreen open?
  const composeOpen = composeMode !== "closed";

  return (
    <div style={{ display: "flex", flex: 1, height: "100%", minHeight: 0, background: BG, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes rouSpin { to { transform: rotate(360deg); } }
        @keyframes rouFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .rou-inbox { animation: rouFadeIn 0.2s ease; }
        .rou-thread-row { transition: background 0.1s; cursor: pointer; }
        .rou-thread-row:hover { background: rgba(27,42,74,0.5) !important; }
        .rou-folder-btn { transition: background 0.15s; cursor: pointer; }
        .rou-folder-btn:hover { background: rgba(212,119,44,0.08) !important; }
        .rou-msg-card { border-bottom: 1px solid ${BORDER}; }
        .rou-msg-card:last-of-type { border-bottom: none; }
        .rou-msg-collapsed { cursor: pointer; }
        .rou-msg-body { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
        .rou-msg-body img { max-width: 100% !important; height: auto !important; }
        .rou-msg-body table { max-width: 100% !important; width: 100% !important; table-layout: fixed !important; }
        .rou-msg-body table[width] { width: 100% !important; }
        .rou-msg-body td, .rou-msg-body th { word-break: break-word !important; overflow-wrap: break-word !important; max-width: 100% !important; }
        .rou-msg-body td img { max-width: 100% !important; height: auto !important; width: auto !important; }
        .rou-msg-body * { max-width: 100% !important; box-sizing: border-box !important; }
        .tiptap-rou .ProseMirror { min-height: 80px; }
        .tiptap-rou .ProseMirror p { margin: 0 0 4px; }
        .tiptap-rou .ProseMirror ul, .tiptap-rou .ProseMirror ol { padding-left: 20px; margin: 4px 0; }
        .tiptap-rou .ProseMirror blockquote { border-left: 3px solid ${ORANGE}; padding-left: 12px; margin: 8px 0; color: #a0b0c0; }
        .tiptap-rou .ProseMirror a { color: ${ORANGE}; text-decoration: underline; }
        .tiptap-rou .ProseMirror:focus { outline: none; }
        .tiptap-rou .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #3a4a5a; pointer-events: none; float: left; height: 0; }
        .rou-inbox button, .rou-inbox input, .rou-inbox select, .rou-inbox textarea { font-family: 'DM Sans', sans-serif; }
        .rou-inbox button { min-height: unset !important; padding: 0 !important; }
        .rou-sidebar-overlay { display: none; }
        @media (max-width: 768px) {
          .rou-sidebar { position: fixed !important; left: 0; top: 0; height: 100vh; z-index: 200; transform: translateX(-100%); transition: transform 0.25s ease; }
          .rou-sidebar.open { transform: translateX(0); }
          .rou-sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 199; }
          .rou-hamburger { display: flex !important; }
        }
        .rou-inbox input, .rou-inbox select, .rou-inbox textarea { font-size: 14px !important; min-height: unset !important; padding: 0 !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, padding: "12px 20px", borderRadius: 8, background: toast.type === "success" ? NAVY : "#8B1A1A", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", border: `1px solid ${toast.type === "success" ? ORANGE : "#cc3333"}` }}>
          {toast.type === "success" ? "OK" : "!"} {toast.message}
        </div>
      )}

      {/* SIDEBAR */}
      {sidebarOpen && <div className="rou-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`rou-sidebar${sidebarOpen ? " open" : ""}`} style={{ width: 220, flexShrink: 0, background: "#070d14", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", position: "relative", top: 0 }}>
        <div style={{ padding: "16px 12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="rou-hamburger" onClick={() => setSidebarOpen(false)}
            style={{ display: "none", alignSelf: "flex-end", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "none", background: "transparent", color: "#6a7a8a", cursor: "pointer", borderRadius: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* Account Switcher */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 }}>
            <button onClick={() => { setActiveAccount(null); setSelectedThread(null); setSelectedIds(new Set()); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px !important", borderRadius: 10, border: activeAccount === null ? `1px solid ${ORANGE}44` : `1px solid transparent`, background: activeAccount === null ? `rgba(212,119,44,0.08)` : "transparent", color: activeAccount === null ? ORANGE : MUTED, fontSize: 12, fontWeight: activeAccount === null ? 700 : 400, cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#888", flexShrink: 0 }} />
              All Accounts
            </button>
            {EMAIL_ACCOUNTS.map(a => (
              <button key={a.email} onClick={() => { setActiveAccount(a.email); setSelectedThread(null); setSelectedIds(new Set()); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px !important", borderRadius: 10, border: activeAccount === a.email ? `1px solid ${a.color}44` : `1px solid transparent`, background: activeAccount === a.email ? `${a.color}14` : "transparent", color: activeAccount === a.email ? a.color : MUTED, fontSize: 12, fontWeight: activeAccount === a.email ? 700 : 400, cursor: "pointer", textAlign: "left", overflow: "hidden" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email.split("@")[0]}</span>
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: BORDER, margin: "0 4px" }} />
          <button onClick={() => { setComposeFrom(activeAccount || DEFAULT_FROM); setComposeMode("new"); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 20px !important", borderRadius: 12, border: `1px solid ${BORDER}`, background: `linear-gradient(135deg, ${NAVY}, #0f1e38)`, color: ORANGE, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            <IconCompose /> Compose
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {(["inbox", "starred", "sent", "drafts", "spam", "trash"] as EmailFolder[]).map(folder => {
            const isActive = activeFolder === folder;
            const count = folderCounts[folder] || 0;
            return (
              <button key={folder} className="rou-folder-btn"
                onClick={() => { setActiveFolder(folder); setSelectedIds(new Set()); setSelectedThread(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px !important", borderRadius: 20, border: "none", fontSize: 13, fontWeight: isActive ? 700 : 400, background: isActive ? `rgba(212,119,44,0.12)` : "transparent", color: isActive ? ORANGE : MUTED, textAlign: "left" }}>
                <span style={{ fontSize: 13, width: 22, textAlign: "center", opacity: 0.7 }}>
                  {folder === "inbox" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>}
                  {folder === "starred" && <IconStar filled={false} />}
                  {folder === "sent" && <IconSend />}
                  {folder === "drafts" && <IconDraft />}
                  {folder === "spam" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                  {folder === "trash" && <IconTrash />}
                </span>
                <span style={{ flex: 1, textTransform: "capitalize" }}>{folder}</span>
                {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? ORANGE : MUTED, background: isActive ? `rgba(212,119,44,0.15)` : `rgba(106,122,138,0.12)`, padding: "2px 8px", borderRadius: 10 }}>{count}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "8px 12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => setContactsOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px !important", borderRadius: 20, border: "none", background: "transparent", color: MUTED, fontSize: 13, cursor: "pointer" }}>
            <IconContacts /> Contacts
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>

        {/* THREAD LIST — hidden when compose is open or thread is selected */}
        {!selectedThread && !composeOpen && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
              <button className="rou-hamburger" onClick={() => setSidebarOpen(true)}
                style={{ display: "none", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "none", background: "transparent", color: "#6a7a8a", cursor: "pointer", flexShrink: 0, borderRadius: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: BG2, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "8px 16px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder={`Search in ${activeFolder}`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", color: TEXT, outline: "none", padding: "4px 0 !important" }} />
              </div>
            </div>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", borderBottom: `1px solid ${BORDER}` }}>
              <button onClick={() => { if (allSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredThreads.map(t => t.thread_id))); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 50, border: "none", background: "transparent", cursor: "pointer", color: someSelected ? ORANGE : "#3a4a5a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {allSelected ? <><rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(212,119,44,0.2)" stroke={ORANGE}/><polyline points="9 12 11.5 14.5 15 9"/></> : someSelected ? <><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="7" y1="12" x2="17" y2="12"/></> : <rect x="3" y="3" width="18" height="18" rx="3"/>}
                </svg>
              </button>
              <button onClick={() => fetchThreads(true)} disabled={refreshing}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 50, border: "none", background: "transparent", cursor: "pointer", color: MUTED }}>
                <span style={{ display: "inline-block", animation: refreshing ? "rouSpin 1s linear infinite" : "none" }}><IconRefresh /></span>
              </button>
              {someSelected && (
                <>
                  <button onClick={() => { threadAction([...selectedIds], "star"); setSelectedIds(new Set()); fetchThreads(true); }} title="Star"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 50, border: "none", background: "transparent", cursor: "pointer" }}>
                    <IconStar filled={false} />
                  </button>
                  {activeFolder === "trash" ? (
                    <>
                      <button onClick={() => { threadAction([...selectedIds], "restore"); setSelectedIds(new Set()); fetchThreads(true); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 50, border: "none", background: "transparent", cursor: "pointer", color: ORANGE }}><IconReply /></button>
                      <button onClick={() => permanentDelete([...selectedIds])}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 50, border: "none", background: "transparent", cursor: "pointer", color: "#cc4444" }}><IconTrash /></button>
                    </>
                  ) : (
                    <button onClick={() => moveToTrash([...selectedIds])}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 50, border: "none", background: "transparent", cursor: "pointer", color: "#8a5a5a" }}><IconTrash /></button>
                  )}
                </>
              )}
              <div style={{ flex: 1 }} />
              {someSelected && <span style={{ fontSize: 11, color: MUTED }}>{selectedIds.size} selected</span>}
            </div>

            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Loading...</div>
              ) : filteredThreads.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, color: MUTED, opacity: 0.4 }}>
                    {activeFolder === "inbox" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>}
                    {activeFolder !== "inbox" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>}
                  </div>
                  <div style={{ color: MUTED, fontSize: 13 }}>{searchQuery ? "No matching threads" : `No emails in ${activeFolder}`}</div>
                </div>
              ) : filteredThreads.map(thread => {
                const isSelected = selectedIds.has(thread.thread_id);
                const isUnread = thread.unread_count > 0;
                const isDraft = activeFolder === "drafts";
                const senderName = thread.customer_name || thread.to_email.split("@")[0];
                // Account color dot — match thread's from/to against known accounts
                const threadAccount = getAccount(thread.latest_direction === "outbound" ? thread.from_email : thread.to_email);
                return (
                  <div key={thread.thread_id} className="rou-thread-row"
                    onClick={() => someSelected ? toggleSelect(thread.thread_id, { stopPropagation: () => {} } as React.MouseEvent) : isDraft ? openDraft(thread) : fetchMessages(thread.thread_id)}
                    style={{ display: "flex", alignItems: "center", gap: 0, padding: "10px 8px 10px 4px", borderBottom: `1px solid ${BORDER}66`, background: isSelected ? `rgba(212,119,44,0.06)` : "transparent", margin: "1px 6px", borderRadius: 4 }}>
                    <div onClick={e => toggleSelect(thread.thread_id, e)} style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isSelected ? ORANGE : "#2a3a4a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isSelected ? <><rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(212,119,44,0.2)" stroke={ORANGE}/><polyline points="9 12 11.5 14.5 15 9"/></> : <rect x="3" y="3" width="18" height="18" rx="3"/>}
                      </svg>
                    </div>
                    <div onClick={e => toggleStar(thread.thread_id, thread.starred, e)} style={{ width: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconStar filled={thread.starred} />
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, marginRight: 10, background: isUnread ? `linear-gradient(135deg, ${NAVY}, ${ORANGE}33)` : "#111e30", border: isUnread ? `1px solid ${ORANGE}44` : `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: isUnread ? ORANGE : MUTED, position: "relative" }}>
                      {isDraft ? <IconDraft /> : getInitials(thread.customer_name, thread.to_email)}
                      {/* Account color dot */}
                      <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: threadAccount.color, border: `2px solid ${BG}` }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: isUnread ? 700 : 400, color: isUnread ? TEXT : "#8090a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isDraft ? <span style={{ color: ORANGE }}>Draft</span> : senderName}
                        </div>
                        <div style={{ fontSize: 11, color: isUnread ? ORANGE : "#3a4a5a", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          {timeAgo(thread.latest_message)}
                          {isUnread && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: ORANGE, marginLeft: 4 }} />}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: isUnread ? 600 : 400, color: isUnread ? "#c0ccd8" : "#5a6a7a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{thread.subject}</div>
                      <div style={{ fontSize: 11, color: "#3a4a5a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                        {thread.latest_direction === "outbound" ? "You: " : ""}{thread.latest_body_preview}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* THREAD DETAIL — no inline reply box, reply/forward buttons in header */}
        {selectedThread && selectedThreadData && !composeOpen && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Thread header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <button onClick={closeThread} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: MUTED }}>
                <IconBack />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedThreadData.subject}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{messages.length} message{messages.length !== 1 ? "s" : ""}</div>
              </div>
              {/* Reply button */}
              <button onClick={openReply} title="Reply"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${BORDER}`, background: `rgba(27,42,74,0.3)`, cursor: "pointer", color: ORANGE }}>
                <IconReply />
              </button>
              {/* Forward button */}
              <button onClick={openForward} title="Forward"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${BORDER}`, background: `rgba(27,42,74,0.3)`, cursor: "pointer", color: MUTED }}>
                <IconForward />
              </button>
              <button onClick={() => toggleStar(selectedThread, selectedThreadData.starred)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px" }}>
                <IconStar filled={selectedThreadData.starred} />
              </button>
              <button onClick={() => moveToTrash([selectedThread])} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "#7a4a4a" }}>
                <IconTrash />
              </button>
            </div>

            {/* Messages — full height, no reply box at bottom */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {messages.map((msg, i) => {
                const isCollapsed = collapsedMsgs.has(msg.id);
                const isOutbound = msg.direction === "outbound";
                const senderLabel = isOutbound ? "You (RO Unlimited)" : msg.from_email;
                const senderInitials = isOutbound ? "RO" : getInitials(undefined, msg.from_email);
                const preview = msg.body_text ? msg.body_text.substring(0, 80) : (msg.body_html ? htmlToText(msg.body_html).substring(0, 80) : "");
                return (
                  <div key={msg.id} className="rou-msg-card" style={{ marginBottom: 8 }}>
                    {isCollapsed ? (
                      <div className="rou-msg-collapsed" onClick={() => setCollapsedMsgs(prev => { const n = new Set(prev); n.delete(msg.id); return n; })}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: BG2, border: `1px solid ${BORDER}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: isOutbound ? `linear-gradient(135deg, ${NAVY}, #0f1e38)` : "#111820", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isOutbound ? ORANGE : MUTED }}>
                          {senderInitials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: isOutbound ? ORANGE : TEXT }}>{isOutbound ? "You" : msg.from_email.split("@")[0]}</span>
                          <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{preview}...</span>
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{shortTime(msg.created_at)}</div>
                      </div>
                    ) : (
                      <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                        {/* Message header */}
                        <div onClick={() => i < messages.length - 1 && setCollapsedMsgs(prev => { const n = new Set(prev); n.add(msg.id); return n; })}
                          style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", cursor: i < messages.length - 1 ? "pointer" : "default" }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: isOutbound ? `linear-gradient(135deg, ${NAVY}, #0f1e38)` : "#111820", border: `1px solid ${isOutbound ? ORANGE + "44" : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isOutbound ? ORANGE : MUTED }}>
                            {senderInitials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: isOutbound ? ORANGE : TEXT }}>{senderLabel}</span>
                              <span style={{ fontSize: 11, color: MUTED }}>{formatDate(msg.created_at)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                              To: {msg.to_email}
                            </div>
                          </div>
                        </div>
                        {/* Body */}
                        <div style={{ padding: "0 16px 16px", overflow: "hidden", maxWidth: "100%" }}>
                          {msg.body_html ? (
                            <div className="rou-msg-body" style={{ fontSize: 14, lineHeight: 1.65, color: TEXT, overflow: "hidden", maxWidth: "100%", wordBreak: "break-word" }}
                              dangerouslySetInnerHTML={{ __html: msg.body_html
                                .replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, "")
                                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                                .replace(/\s+width\s*=\s*["']\d+["']/gi, ' width="100%"')
                                .replace(/\s+height\s*=\s*["']\d+["']/gi, "")
                                .replace(/width\s*:\s*\d{3,}px/gi, "width:100%")
                                .replace(/max-width\s*:\s*\d{3,}px/gi, "max-width:100%")
                                .replace(/min-width\s*:\s*\d{3,}px/gi, "min-width:0")
                              }}
                            />
                          ) : msg.body_text ? (
                            <pre style={{ fontSize: 13, lineHeight: 1.7, color: TEXT, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0 }}>{msg.body_text}</pre>
                          ) : (
                            <div style={{ color: MUTED, fontSize: 13 }}>(no content)</div>
                          )}
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {msg.attachments.map(att => (
                                <a key={att.id} href={att.s3_url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: `rgba(27,42,74,0.4)`, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, textDecoration: "none" }}>
                                  <IconAttach /> {att.filename}
                                  <span style={{ color: MUTED, fontSize: 11 }}>({(att.size_bytes / 1024).toFixed(0)} KB)</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom reply/forward prompt */}
              <div style={{ display: "flex", gap: 8, padding: "16px 4px 24px", justifyContent: "center" }}>
                <button onClick={openReply}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px !important", borderRadius: 10, border: `1px solid ${BORDER}`, background: `linear-gradient(135deg, ${NAVY}, #0f1e38)`, color: ORANGE, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <IconReply /> Reply
                </button>
                <button onClick={openForward}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px !important", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <IconForward /> Forward
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL-SCREEN COMPOSE / REPLY / FORWARD */}
        {composeOpen && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: BG }}>
            {/* Top bar — Send button always visible above keyboard */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: "#070d14" }}>
              <button onClick={closeCompose} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: MUTED }}>
                <IconBack />
              </button>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: TEXT }}>
                {composeMode === "reply" ? "Reply" : composeMode === "forward" ? "Forward" : "New Message"}
              </div>
              {composeMode === "new" && (
                <button onClick={saveDraft} style={{ padding: "6px 12px !important", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>Draft</button>
              )}
              <button onClick={sendCompose} disabled={composeSending}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px !important", borderRadius: 8, border: "none", background: composeSending ? "#1B2A4A" : `linear-gradient(135deg, ${NAVY}, #0f1e38)`, color: composeSending ? MUTED : ORANGE, fontSize: 13, fontWeight: 700, cursor: composeSending ? "default" : "pointer" }}>
                <IconSend /> {composeSending ? "Sending..." : "Send"}
              </button>
            </div>

            {/* Scrollable compose body */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {/* From selector */}
              <div style={{ padding: "10px 18px 6px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: MUTED, width: 40, flexShrink: 0 }}>From</span>
                <FromSelector value={composeFrom} onChange={setComposeFrom} />
              </div>
              {/* To field */}
              <div style={{ padding: "6px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "relative" }}>
                <span style={{ fontSize: 12, color: MUTED, width: 40, flexShrink: 0 }}>To</span>
                <input value={composeTo} onChange={e => { setComposeTo(e.target.value); searchContacts(e.target.value); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="recipient@email.com" style={{ flex: 1, background: "transparent", border: "none", color: TEXT, outline: "none", fontSize: 13, padding: "6px 0 !important", borderBottom: `1px solid ${BORDER}33` }} />
                {composeMode === "new" && (
                  <button onClick={() => setShowCc(!showCc)} style={{ fontSize: 11, color: MUTED, background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px !important" }}>Cc</button>
                )}
                {showSuggestions && toSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 58, right: 0, background: "#0d1420", border: `1px solid ${BORDER}`, borderRadius: 8, zIndex: 100, maxHeight: 180, overflowY: "auto" }}>
                    {toSuggestions.map(c => (
                      <div key={c.id} onClick={() => { setComposeTo(c.email); setShowSuggestions(false); }}
                        style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${BORDER}33` }}
                        onMouseEnter={e => (e.currentTarget.style.background = `rgba(212,119,44,0.08)`)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: NAVY, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: ORANGE }}>{getInitials(c.name, c.email)}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{c.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Cc field */}
              {showCc && composeMode === "new" && (
                <div style={{ padding: "6px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: MUTED, width: 40, flexShrink: 0 }}>Cc</span>
                  <input value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder="cc@email.com"
                    style={{ flex: 1, background: "transparent", border: "none", color: TEXT, outline: "none", fontSize: 13, padding: "6px 0 !important", borderBottom: `1px solid ${BORDER}33` }} />
                </div>
              )}
              {/* Subject */}
              <div style={{ padding: "6px 18px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: MUTED, width: 40, flexShrink: 0 }}>Sub</span>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject"
                  style={{ flex: 1, background: "transparent", border: "none", color: TEXT, outline: "none", fontSize: 13, padding: "6px 0 !important", borderBottom: `1px solid ${BORDER}33` }} />
              </div>
              {/* Separator */}
              <div style={{ height: 1, background: BORDER, margin: "0 18px", flexShrink: 0 }} />
              {/* Editor toolbar */}
              <EditorToolbar editor={composeEditor} />
              {/* Editor body */}
              <div className="tiptap-rou" style={{ flex: 1, minHeight: 200 }}>
                <EditorContent editor={composeEditor} />
              </div>
              {/* Quoted thread (for reply/forward) */}
              {composeQuotedHtml && (
                <div style={{ padding: "0 18px 20px", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: MUTED }}
                    dangerouslySetInnerHTML={{ __html: composeQuotedHtml }} />
                </div>
              )}
            </div>
          </div>
        )}

      </div>{/* end main */}

      {/* CONTACTS PANEL */}
      {contactsOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 540, maxWidth: "calc(100vw - 32px)", background: "#0a0f18", border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Contacts</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setContactModal({ id: "", name: "", email: "", phone: null, company: null, category: "other", notes: null, starred: false }); setContactForm({ name: "", email: "", phone: "", company: "", category: "other", notes: "" }); }}
                  style={{ padding: "6px 14px !important", borderRadius: 6, border: `1px solid ${ORANGE}44`, background: `rgba(212,119,44,0.08)`, color: ORANGE, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ New</button>
                <button onClick={() => setContactsOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", border: "none", background: `rgba(212,119,44,0.1)`, color: ORANGE, cursor: "pointer" }}><IconX /></button>
              </div>
            </div>
            <div style={{ padding: "8px 18px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <input type="text" placeholder="Search contacts..." value={contactSearch} onChange={e => { setContactSearch(e.target.value); fetchContacts(e.target.value); }}
                style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, outline: "none", fontSize: 13, padding: "8px 12px !important" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {contacts.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>No contacts yet</div>
              ) : contacts.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${BORDER}33` }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: NAVY, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: ORANGE }}>
                    {getInitials(c.name, c.email)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{c.email}{c.company ? ` - ${c.company}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setComposeTo(c.email); setContactsOpen(false); setComposeMode("new"); }}
                      style={{ padding: "6px 10px !important", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 11, cursor: "pointer" }}>Email</button>
                    <button onClick={() => { setContactModal(c); setContactForm({ name: c.name, email: c.email, phone: c.phone || "", company: c.company || "", category: c.category, notes: c.notes || "" }); }}
                      style={{ padding: "6px 10px !important", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 11, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteContact(c.id)}
                      style={{ padding: "6px 10px !important", borderRadius: 6, border: `1px solid #3a1a1a`, background: "transparent", color: "#7a4a4a", fontSize: 11, cursor: "pointer" }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTACT FORM MODAL */}
      {contactModal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 440, maxWidth: "calc(100vw - 32px)", background: "#0a0f18", border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{contactModal.id ? "Edit Contact" : "New Contact"}</span>
              <button onClick={() => setContactModal(null)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", border: "none", background: `rgba(212,119,44,0.1)`, color: ORANGE, cursor: "pointer" }}><IconX /></button>
            </div>
            {[
              { key: "name", label: "Name *", type: "text" },
              { key: "email", label: "Email *", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
              { key: "company", label: "Company", type: "text" },
            ].map(({ key, label, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 4 }}>{label}</label>
                <input type={type} value={(contactForm as Record<string, string>)[key]}
                  onChange={e => setContactForm(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, outline: "none", fontSize: 13, padding: "9px 12px !important", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 4 }}>Category</label>
              <select value={contactForm.category} onChange={e => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, outline: "none", fontSize: 13, padding: "9px 12px !important" }}>
                {["customer", "vendor", "contractor", "subcontractor", "other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 4 }}>Notes</label>
              <textarea value={contactForm.notes} onChange={e => setContactForm(prev => ({ ...prev, notes: e.target.value }))} rows={3}
                style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, outline: "none", fontSize: 13, padding: "9px 12px !important", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setContactModal(null)} style={{ padding: "9px 18px !important", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveContact} disabled={contactSaving}
                style={{ padding: "9px 24px !important", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${NAVY}, #0f1e38)`, color: ORANGE, fontSize: 13, fontWeight: 700, cursor: contactSaving ? "default" : "pointer" }}>
                {contactSaving ? "Saving..." : "Save Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
