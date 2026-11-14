"use client";

/**
 * RO Unlimited mail client (rounlimited.com/admin/inbox). Port of the NexaVision / Den Chai / JHPS
 * phone-first client, adapted for RO: black/gold, light + dark, large type and 48px targets for JR,
 * full screen with its own menu + Dashboard button, three panes on a computer screen.
 *
 *  - Opens instantly: lists, mailboxes, rules and conversations render from the device's saved copy
 *    (IndexedDB, src/lib/mail-cache.ts) and refresh in the background.
 *  - Folders & filters: custom folders, filters (sender / subject / words), blocked senders, Archive.
 *    The inbound webhook files new mail by them; folders with alerts off are filed quietly.
 *  - Swipe left = Archive (Trash empties itself after 30 days, Archive keeps mail), swipe right =
 *    read/unread, long-press or avatar tap = select. Every move has Undo.
 *  - Under each email sent from here: open / click / website tracking (src/lib/email-tracking.ts).
 *  - Reopens the last-used mailbox (localStorage ro_inbox_account, '__all__' = All mailboxes).
 *  - Every sub-view is a browser history entry, so the phone's Back button walks back through the views.
 *
 * Components are declared at module level on purpose: a component created inside AdminInbox's render
 * would be a new type on every render and remount its whole subtree (NexaVision perf lesson).
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox, Send, FileEdit, Star, Trash2, AlertOctagon, Archive,
  Search, RefreshCw, ChevronLeft, MailOpen, Mail,
  Reply, ReplyAll, Forward, X, Check, Loader2,
  Paperclip, Menu, Pencil, MoreVertical, ChevronDown, ChevronUp, Plus,
  LayoutDashboard, Sun, Moon, Download, Copy, Palette, Undo2, ShieldAlert,
  ArchiveRestore, CheckCircle2, Circle, Settings, Info,
  Folder, FolderPlus, FolderInput, Receipt, Banknote, Landmark, ShieldCheck, Newspaper, Truck,
  ListFilter, ArrowUp, ArrowDown, Bell, BellOff, Wrench, Megaphone, Building2, FileText, Tag,
  UserRound, HardHat, Users,
} from "lucide-react";
import EmailBody from "./mail/EmailBody";
import RefreshBar from "./mail/RefreshBar";
import { useCached, fetchJson, cacheGet, cacheSet } from "@/lib/mail-cache";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

const API = "/api/email";
const ACCOUNTS_API = "/api/admin/email-accounts";
const ALL_ACCOUNTS = "__all__";
const ACCOUNT_KEY = "ro_inbox_account";
const THEME_KEY = "ro_inbox_theme";
const DRAFT_KEY = "inbox:draft";
const PAGE = 60;

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ── Types ──
interface Thread {
  thread_id: string; subject: string; to_email: string; from_email: string;
  counterpart?: string; account?: string; customer_name?: string;
  latest_message: string; latest_body_preview: string; latest_direction: string;
  message_count: number; unread_count: number; starred: boolean;
  has_attachments: boolean; lead_id?: string | null; created_at: string;
}
interface Attachment { id: string; filename: string; content_type: string; size_bytes: number; s3_url: string }
type TrackEv = { at: string; event: "open" | "click" | "site"; url: string | null; automated: boolean; why: string | null; device: string; place: string };
interface Message {
  id: string; thread_id: string; direction: string; from_email: string; to_email: string; subject: string;
  body_html: string | null; body_text: string | null; read: boolean; starred: boolean; is_draft?: boolean;
  folder: string; created_at: string; cc_emails: string[] | null; bcc_emails: string[] | null;
  attachments: Attachment[]; tracking?: TrackEv[] | null;
}
interface EmailAccount { id?: string; email: string; display_name: string; color: string; initials: string; is_default?: boolean }
interface ComposeFile { path: string; filename: string; content_type: string; size_bytes: number }
interface Draft { to: string; cc: string; bcc: string; subject: string; body: string; from: string; savedAt: number }
interface CustomFolder { key: string; label: string; icon?: string; notify?: boolean }
interface FilterRule { id: string; folder: string; from?: string[]; subject?: string; body?: string; note?: string }
interface Rules { blocked: string[]; folders: CustomFolder[]; rules: FilterRule[] }
type ThreadsData = { threads: Thread[]; folderCounts: Record<string, number> };
type ComposeMode = "new" | "reply" | "replyAll" | "forward" | null;
type View = "list" | "thread" | "compose" | "accounts" | "rules";

const FOLDERS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "spam", label: "Spam", icon: AlertOctagon },
  { key: "trash", label: "Trash", icon: Trash2 },
];
const FOLDER_LABEL: Record<string, string> = Object.fromEntries(FOLDERS.map((f) => [f.key, f.label]));
/** icons a custom folder can use (stored by name) */
const FOLDER_ICONS: Record<string, React.ElementType> = {
  folder: Folder, building: Building2, shield: ShieldCheck, news: Newspaper, megaphone: Megaphone, vendor: Truck,
  bank: Landmark, bill: Receipt, money: Banknote, social: Users, tag: Tag, wrench: Wrench, doc: FileText,
  customer: UserRound, job: HardHat, star: Star,
};
const iconFor = (name?: string): React.ElementType => FOLDER_ICONS[name || ""] || Folder;
const INPUT_CLS = "w-full min-h-[48px] px-3.5 py-2.5 bg-mail-bg border border-mail-line/20 rounded-xl text-[17px] text-mail-text placeholder:text-mail-muted focus:outline-none focus:border-mail-gold";
const ICON_BTN = "w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-mail-sub hover:bg-mail-line/10 active:bg-mail-line/15";

// ── Small helpers ──
const GENERIC_LOCAL = new Set(["no-reply", "noreply", "donotreply", "do-not-reply", "info", "sales", "admin", "support", "hello", "mail", "news", "newsletter", "notifications", "notification", "team", "contact", "alerts", "alert", "service", "billing", "help", "marketing", "updates", "bounce", "mailer-daemon", "postmaster", "security", "account", "accounts", "hey"]);
const OWN_DOMAIN = "rounlimited.com";
/** "no-reply@accounts.google.com" → "google.com"; "john@acme.com" → "john"; our own mailboxes keep their name */
function senderLabel(email: string): string {
  const [local = "", domain = ""] = (email || "").toLowerCase().split("@");
  if (domain === OWN_DOMAIN && (local === "noreply" || local === "no-reply")) return "Website form";
  if ((GENERIC_LOCAL.has(local) || local.endsWith("-noreply") || local.endsWith("noreply")) && domain && domain !== OWN_DOMAIN)
    return domain.replace(/^(www|mail|email|e|m|info|accounts?|notifications?|news|updates)\./, "");
  return local || email || "unknown";
}
function avatarColor(email: string): string {
  const colors = ["#C9A84C", "#D4772C", "#3b8dd4", "#22C55E", "#EC4899", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316", "#A3A3A3"];
  let h = 0;
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function fmtWhen(d: string, long = false) {
  const t = new Date(d), now = new Date();
  const time = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (t.toDateString() === now.toDateString()) return long ? `Today, ${time}` : time;
  const date = t.toLocaleDateString("en-US", t.getFullYear() === now.getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
  return long ? `${date}, ${time}` : date;
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000 && new Date(d).toDateString() === new Date().toDateString()) return fmtWhen(d);
  return fmtWhen(d);
}
/** mailbox badge colours: a dark brand colour (navy, black) gets a solid chip with white letters so it stays readable */
function chipStyle(color: string): React.CSSProperties {
  const m = /^#?([0-9a-f]{6})$/i.exec(color || "");
  if (!m) return { backgroundColor: "rgba(201,168,76,.2)", color: "#C9A84C" };
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.35 ? { backgroundColor: "#" + m[1], color: "#ffffff" } : { backgroundColor: "#" + m[1] + "33", color: "#" + m[1] };
}
const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const cleanPreview = (s: string) => (s || "").replace(/\[image:[^\]]*\]/gi, " ").replace(/\s+/g, " ").trim();
const snippet = (m: Message) => cleanPreview(m.body_text || (m.body_html || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")).slice(0, 160);
const sortNewest = (a: Thread, b: Thread) => new Date(b.latest_message).getTime() - new Date(a.latest_message).getTime();

/** The quoted history a reply carries ("On … wrote:" + the earlier messages). Hidden by default, like Gmail. */
const QUOTE_HTML = /class=["'][^"']*(gmail_quote|yahoo_quoted|moz-cite-prefix)|type=["']cite["']|id=["'](divRplyFwdMsg|appendonsend)["']/i;
const QUOTE_TEXT = /\n\s*(On .{4,200}wrote:|-{2,}\s*Original Message\s*-{2,}|From: .+\n(Sent|Date): )/i;
function stripQuotedText(t: string): string {
  const m = t.match(QUOTE_TEXT);
  let out = m && m.index !== undefined ? t.slice(0, m.index) : t;
  const lines = out.split("\n");
  let cut = lines.length;
  while (cut > 0 && (!lines[cut - 1].trim() || lines[cut - 1].startsWith(">"))) cut--;
  if (lines.slice(cut).some((l) => l.startsWith(">"))) out = lines.slice(0, cut).join("\n");
  return out.trimEnd();
}
const hasQuoted = (m: { body_html: string | null; body_text: string | null }) =>
  m.body_html ? QUOTE_HTML.test(m.body_html) : stripQuotedText(m.body_text || "") !== (m.body_text || "").trimEnd();

/** Plain-text email bodies with tappable links */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s<>"']+)/gi);
  return (
    <>
      {parts.map((p, i) => {
        if (!/^(https?:\/\/|www\.)/i.test(p)) return <span key={i}>{p}</span>;
        const m = p.match(/^(.*?)([.,;:!?)\]]*)$/) || [p, p, ""];
        const url = m[1], trail = m[2];
        return (
          <span key={i}>
            <a href={url.startsWith("www.") ? `https://${url}` : url} target="_blank" rel="noopener noreferrer" className="text-mail-gold underline break-all">{url}</a>{trail}
          </span>
        );
      })}
    </>
  );
}

/**
 * Under each email sent from this inbox: did they open it, on what, and did they go to the website.
 * Machine opens (mail scanners, Apple Mail preloading) are shown separately so they are never mistaken
 * for the customer. Data: threads POST → message.tracking (src/lib/email-tracking.ts).
 */
function EmailTracking({ events }: { events: TrackEv[] | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (events === undefined || events === null) return null;
  const real = events.filter((e) => !e.automated);
  const opens = real.filter((e) => e.event === "open");
  const clicks = real.filter((e) => e.event === "click");
  const site = real.filter((e) => e.event === "site");
  const machine = events.filter((e) => e.automated);
  const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const short = (u: string | null) => (u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || "link";
  const last = real[real.length - 1];
  const headline = !real.length
    ? (machine.length ? "Not opened yet (only automatic mail-scanner checks so far)" : "Not opened yet")
    : `Opened ${opens.length || 0}×${clicks.length ? ` · clicked ${clicks.length}×` : ""}${site.length ? ` · ${site.length} website page${site.length === 1 ? "" : "s"}` : ""}`;
  const label = (e: TrackEv) => e.event === "open" ? "Opened the email" : e.event === "click" ? `Clicked ${short(e.url)}` : `Viewed ${e.url === "/" ? "the home page" : short(e.url)} on the website`;
  return (
    <div className="mt-3 mx-1 rounded-xl border border-mail-line/15 bg-mail-line/[0.04]" data-tracking>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2.5 px-3.5 py-3 min-h-[52px] text-left" aria-expanded={open}>
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: real.length ? "#35d07f" : "rgba(128,128,128,0.55)" }} />
        <span className="flex-1 text-[16px] font-semibold text-mail-text">{headline}</span>
        {last && <span className="text-[14px] text-mail-muted shrink-0">{when(last.at)}</span>}
        <ChevronDown size={18} className={cn("text-mail-muted transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-2.5">
          {!events.length && <p className="text-[16px] text-mail-sub">Nothing yet. It shows here the moment they open it or tap a link.</p>}
          {events.map((e, i) => (
            <div key={i} className={cn("flex gap-3 text-[16px]", e.automated && "opacity-70")}>
              <span className="text-mail-muted w-[124px] shrink-0">{when(e.at)}</span>
              <span className="text-mail-text">
                {e.automated ? "Automatic check" : label(e)}
                {(e.device || e.place) && <span className="text-mail-sub"> · {[e.device, e.place].filter(Boolean).join(" · ")}</span>}
                {e.automated && e.why && <span className="block text-[14px] text-mail-muted">{e.why}</span>}
              </span>
            </div>
          ))}
          <p className="text-[14px] text-mail-muted pt-1">Opens can be missed if their email app blocks pictures. Clicks and website visits are reliable.</p>
        </div>
      )}
    </div>
  );
}

type SheetItem = { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean; hint?: string };
/** Bottom action sheet (thumb-reachable menu); a centred card on a computer */
function ActionSheet({ title, items, onClose }: { title?: string; items: SheetItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-mail-panel border border-mail-line/15 rounded-t-3xl sm:rounded-3xl pt-2 ro-mail-up"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()} role="menu">
        <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-mail-line/25" />
        {title && <p className="px-5 py-2.5 text-[15px] font-medium text-mail-sub leading-snug line-clamp-3 break-words">{title}</p>}
        {items.map((it) => (
          <button key={it.label} onClick={() => { onClose(); it.onClick(); }} role="menuitem"
            className={cn("w-full flex items-center gap-4 px-5 min-h-[56px] py-3 text-[17px] text-left hover:bg-mail-line/[0.06] active:bg-mail-line/10", it.danger ? "text-mail-danger" : "text-mail-text")}>
            <it.icon size={22} className={it.danger ? "" : "text-mail-sub"} />
            <span className="flex-1">{it.label}</span>
            {it.hint && <span className="text-[15px] text-mail-muted">{it.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** List row wrapper: swipe left → archive/trash, swipe right → read/unread, long-press → select */
function SwipeRow({ children, onLeft, onRight, onLongPress, disabled, leftLabel, rightLabel }: {
  children: React.ReactNode; onLeft?: () => void; onRight: () => void; onLongPress: () => void; disabled?: boolean; leftLabel: string; rightLabel: string;
}) {
  const [dx, setDx] = useState(0);
  const [settle, setSettle] = useState(false);
  const st = useRef<{ x: number; y: number; lock: "" | "h" | "v"; id: number } | null>(null);
  const dxRef = useRef(0);
  const moved = useRef(false);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const set = (v: number) => { dxRef.current = v; setDx(v); };
  const clearPress = () => { if (press.current) { clearTimeout(press.current); press.current = null; } };

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button > 0) return;
    st.current = { x: e.clientX, y: e.clientY, lock: "", id: e.pointerId };
    moved.current = false; setSettle(false);
    clearPress();
    press.current = setTimeout(() => { press.current = null; st.current = null; moved.current = true; onLongPress(); }, 480);
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = st.current; if (!s) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (!s.lock) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      clearPress();
      s.lock = Math.abs(mx) > Math.abs(my) * 1.2 && e.pointerType !== "mouse" ? "h" : "v";
      if (s.lock === "h") { try { e.currentTarget.setPointerCapture(s.id); } catch { /* ignore */ } }
    }
    if (s.lock !== "h") return;
    moved.current = true;
    const lim = e.currentTarget.clientWidth * 0.6;
    set(Math.max(onLeft ? -lim : 0, Math.min(lim, mx)));
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    clearPress();
    const s = st.current; st.current = null;
    if (!s || s.lock !== "h") return;
    const w = e.currentTarget.clientWidth, th = Math.min(110, w * 0.28), v = dxRef.current;
    setSettle(true);
    if (v < -th && onLeft) { set(-w); setTimeout(() => { onLeft(); set(0); }, 160); }
    else if (v > th) { set(0); onRight(); }
    else set(0);
  };
  const cancel = () => { clearPress(); st.current = null; setSettle(true); set(0); };

  return (
    <div className="relative overflow-hidden select-none" style={{ touchAction: "pan-y" }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onPointerLeave={(e) => { if (st.current?.lock !== "h") cancel(); else up(e); }}
      onContextMenu={(e) => e.preventDefault()}
      onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; } }}>
      {dx !== 0 && (
        <div className={cn("absolute inset-0 flex items-center px-6 text-[16px] font-bold", dx < 0 ? "justify-end bg-mail-gold/25 text-mail-gold" : "justify-start bg-mail-ok/20 text-mail-ok")}>
          {dx < 0 ? <>{leftLabel} <Archive size={22} className="ml-2" /></> : <><MailOpen size={22} className="mr-2" /> {rightLabel}</>}
        </div>
      )}
      <div className="relative bg-mail-bg" style={{ transform: `translateX(${dx}px)`, transition: settle ? "transform .18s ease-out" : "none" }}>{children}</div>
    </div>
  );
}

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener("change", on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else mq.removeListener(on); };
  }, []);
  return wide;
}

export default function AdminInbox() {
  const router = useRouter();
  const wide = useWide();

  // ── Theme: light/dark for the mail client only (saved on the device) ──
  const [light, setLight] = useState(false);
  useEffect(() => { try { setLight(localStorage.getItem(THEME_KEY) === "light"); } catch { /* ignore */ } }, []);
  const toggleTheme = () => setLight((l) => { const n = !l; try { localStorage.setItem(THEME_KEY, n ? "light" : "dark"); } catch { /* ignore */ } return n; });
  const goDashboard = () => router.push("/admin");

  // ── State ──
  const [view, setView] = useState<View>("list");
  const [folder, setFolder] = useState<string>("inbox");
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const selectedRef = useRef<Thread | null>(null);
  useEffect(() => { selectedRef.current = selectedThread; }, [selectedThread]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // conversation
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAllMsgs, setShowAllMsgs] = useState(false);
  const [quotesShown, setQuotesShown] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Set<string>>(new Set());
  const [originalColors, setOriginalColors] = useState<Set<string>>(new Set());
  const [msgMenu, setMsgMenu] = useState<Message | null>(null);
  const [threadMenu, setThreadMenu] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // list selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectMode = selected.size > 0;
  const [selMenu, setSelMenu] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState<{ title: string; label: string; onConfirm: () => void } | null>(null);

  // compose
  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeFiles, setComposeFiles] = useState<ComposeFile[]>([]);
  const [composeOrig, setComposeOrig] = useState<Message | null>(null);
  const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
  const [showOrig, setShowOrig] = useState(false);
  const [discardSheet, setDiscardSheet] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [uploading, setUploading] = useState(0);
  const composeFileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // toast (with optional Undo)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = (msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), undo ? 6000 : 3500);
  };

  // ── Mailboxes, rules: saved copy first, refreshed in the background ──
  const accountsQ = useCached<EmailAccount[]>("inbox:accounts", async (signal) => {
    const d = await fetchJson<EmailAccount[] | { accounts: EmailAccount[] }>(ACCOUNTS_API, { cache: "no-store", signal });
    return Array.isArray(d) ? d : d?.accounts || [];
  });
  const accounts = useMemo(() => accountsQ.data || [], [accountsQ.data]);
  const accountByEmail = useMemo(() => new Map(accounts.map((a) => [a.email.toLowerCase(), a])), [accounts]);
  const rulesQ = useCached<Rules>("inbox:rules", async (signal) => fetchJson<Rules>(`${API}/rules`, { cache: "no-store", signal }));
  const blocked = useMemo(() => rulesQ.data?.blocked || [], [rulesQ.data]);
  const customFolders = useMemo(() => rulesQ.data?.folders || [], [rulesQ.data]);
  const filters = useMemo(() => rulesQ.data?.rules || [], [rulesQ.data]);
  const folderLabel = (k: string) => FOLDER_LABEL[k] || customFolders.find((f) => f.key === k)?.label || k;
  const [movePick, setMovePick] = useState<{ ids: string[]; after?: () => void } | null>(null);
  const [filePick, setFilePick] = useState<string | null>(null);
  const [folderForm, setFolderForm] = useState<{ key?: string; label: string; icon: string; notify: boolean } | null>(null);
  const [filterForm, setFilterForm] = useState<{ id?: string; from: string; subject: string; body: string; folder: string } | null>(null);
  const [rulesBusy, setRulesBusy] = useState(false);
  const [activeAccount, setActiveAccount] = useState<EmailAccount | null>(null);
  const [fromAccount, setFromAccount] = useState("");

  // mailbox management
  const [accountForm, setAccountForm] = useState<{ id?: string; email: string; display_name: string; color: string; initials: string } | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const PRESET_COLORS = ["#C9A84C", "#D4772C", "#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#EC4899", "#8B5CF6", "#06B6D4", "#A3A3A3"];

  // ── Pick the mailbox once the list is known: reopen the last one used (or All), else the default ──
  const accountsInitialized = useRef(false);
  const [accountReady, setAccountReady] = useState(false);
  useEffect(() => {
    if (accountsInitialized.current || !accounts.length) return;
    accountsInitialized.current = true;
    let saved: string | null = null;
    try { saved = localStorage.getItem(ACCOUNT_KEY); } catch { /* ignore */ }
    const def = accounts.find((a) => a.is_default) || accounts[0];
    if (saved === ALL_ACCOUNTS) { setActiveAccount(null); setFromAccount(def.email); }
    else {
      const pick = (saved && accounts.find((a) => a.email === saved)) || def;
      setActiveAccount(pick); setFromAccount(pick.email);
    }
    setAccountReady(true);
  }, [accounts]);
  useEffect(() => { if (!accountsQ.loading && !accounts.length) setAccountReady(true); }, [accountsQ.loading, accounts.length]);
  useEffect(() => {
    if (!accountsInitialized.current) return;
    try { localStorage.setItem(ACCOUNT_KEY, activeAccount ? activeAccount.email : ALL_ACCOUNTS); } catch { /* ignore */ }
  }, [activeAccount]);

  // ── Navigation: every sub-view is a history entry so the phone's Back button walks back through
  //    compose → conversation → list instead of leaving the mail client. Next's own history state is kept.
  const goToView = useCallback((v: View, replace = false) => {
    try {
      const st = { ...(window.history.state || {}), roMailView: v };
      if (replace && window.history.state?.roMailView) window.history.replaceState(st, ""); else window.history.pushState(st, "");
    } catch { /* ignore */ }
    setView(v);
  }, []);
  const back = useCallback(() => {
    if (typeof window !== "undefined" && window.history.state?.roMailView) window.history.back();
    else { setView("list"); setSelectedThread(null); setComposeMode(null); }
  }, []);
  /** jump straight to the list (drawer / folder taps) */
  const toList = useCallback(() => {
    setSelectedThread(null); setComposeMode(null); setView("list");
    try { if (window.history.state?.roMailView) window.history.replaceState({ ...window.history.state, roMailView: "list" }, ""); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      setDrawerOpen(false);
      const v = ((e.state && e.state.roMailView) as View | undefined) || "list";
      if (v === "list") { setSelectedThread(null); setComposeMode(null); setView("list"); return; }
      if (v === "thread" && !selectedRef.current) { setView("list"); return; }
      setView(v);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // full-screen app: the page underneath must never scroll or pull-to-refresh
  useEffect(() => {
    const b = document.body, h = document.documentElement;
    const prev = [b.style.overflow, b.style.overscrollBehavior, h.style.overscrollBehavior];
    b.style.overflow = "hidden"; b.style.overscrollBehavior = "none"; h.style.overscrollBehavior = "none";
    return () => { b.style.overflow = prev[0]; b.style.overscrollBehavior = prev[1]; h.style.overscrollBehavior = prev[2]; };
  }, []);

  // ── Threads: saved copy on screen immediately, fresh list in the background ──
  const threadsKey = accountReady ? `inbox:threads:${folder}:${activeAccount ? activeAccount.email : "all"}` : null;
  const threadsQ = useCached<ThreadsData>(threadsKey, async (signal) => {
    const params = new URLSearchParams({ folder });
    if (activeAccount) params.set("account", activeAccount.email);
    const data = await fetchJson<ThreadsData>(`${API}/threads?${params}`, { cache: "no-store", signal });
    return { threads: data.threads || [], folderCounts: data.folderCounts || {} };
  });
  const threads = useMemo(() => threadsQ.data?.threads || [], [threadsQ.data]);
  const folderCounts = threadsQ.data?.folderCounts || {};
  const loading = !accountReady || threadsQ.loading;
  const fetchThreads = threadsQ.refresh;
  const setThreads = (fn: (prev: Thread[]) => Thread[]) =>
    threadsQ.mutate((cur) => ({ threads: fn(cur?.threads || []), folderCounts: cur?.folderCounts || {} }));

  // new mail while the app is open: refresh the list every 60 s while visible
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") fetchThreads(); }, 60000);
    return () => clearInterval(t);
  }, [fetchThreads]);

  const otherParty = (t: Thread) => t.counterpart || t.to_email;
  const partyName = (t: Thread) => t.customer_name || senderLabel(otherParty(t));
  const accountName = (email: string) => accountByEmail.get((email || "").toLowerCase())?.display_name;
  const mailboxOf = (t: Thread) => t.account || t.from_email;

  const knownAddresses = useMemo(() => {
    const s = new Set<string>();
    for (const t of threads) s.add(otherParty(t).toLowerCase());
    for (const a of accounts) s.delete(a.email.toLowerCase());
    return Array.from(s).filter((e) => e.includes("@")).slice(0, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, accounts]);

  // local draft?
  useEffect(() => { cacheGet<Draft | null>(DRAFT_KEY).then((d) => setHasDraft(!!d?.v && !!(d.v.to || d.v.subject || d.v.body))); }, []);

  // ── Open a conversation: saved copy at once, then refresh it (the server marks it read) ──
  const [threadError, setThreadError] = useState<string | null>(null);
  const openThread = async (thread: Thread) => {
    const replace = view === "thread" && wide;
    setSelectedThread(thread);
    selectedRef.current = thread;
    setExpanded(new Set()); setDetails(new Set()); setOriginalColors(new Set()); setShowAllMsgs(false); setQuotesShown(new Set());
    setMessages([]);
    goToView("thread", replace);
    setThreadError(null);
    const key = `inbox:thread:${thread.thread_id}:${activeAccount?.email || "all"}`;
    const saved = await cacheGet<Message[]>(key);
    /** a conversation opened from a phone alert starts as a stub; fill its header from the messages */
    const fillStub = (list: Message[]) => {
      if (thread.subject || !list.length) return;
      const last = list[list.length - 1];
      const out = last.direction === "outbound";
      const full: Thread = { ...thread, subject: list[0].subject, counterpart: (out ? last.to_email : last.from_email).toLowerCase(), account: (out ? last.from_email : last.to_email).toLowerCase(),
        to_email: out ? last.to_email : last.from_email, from_email: out ? last.from_email : last.to_email, message_count: list.length };
      selectedRef.current = full;
      setSelectedThread(full);
    };
    const applyMessages = (list: Message[]) => {
      setMessages(list);
      const open = new Set<string>();
      list.forEach((m, i) => { if (i === list.length - 1 || !m.read) open.add(m.id); });
      setExpanded(open);
    };
    if (saved?.v?.length && selectedRef.current?.thread_id === thread.thread_id) { applyMessages(saved.v); fillStub(saved.v); }
    setLoadingThread(!saved?.v?.length);
    try {
      const data = await fetchJson<{ messages: Message[] }>(`${API}/threads`, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ thread_id: thread.thread_id, account: activeAccount?.email }),
      });
      if (selectedRef.current?.thread_id !== thread.thread_id) return;
      const list = data.messages || [];
      if (saved?.v?.length) setMessages(list); else applyMessages(list);
      fillStub(list);
      cacheSet(key, list);
      if (thread.unread_count > 0) {
        setThreads((prev) => prev.map((t) => (t.thread_id === thread.thread_id ? { ...t, unread_count: 0 } : t)));
        threadsQ.mutate((cur) => cur ? { ...cur, folderCounts: { ...cur.folderCounts, [folder]: Math.max(0, (cur.folderCounts[folder] || 0) - thread.unread_count) } } : { threads: [], folderCounts: {} });
      }
    } catch (e) {
      setThreadError((e as Error)?.message || "Could not load this conversation");
    } finally {
      setLoadingThread(false);
    }
  };
  useEffect(() => {
    if (view === "thread" && scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [selectedThread?.thread_id, view]);

  // deep link from a phone alert: /admin/inbox?thread=<id>
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || !accountReady) return;
    const id = new URLSearchParams(window.location.search).get("thread");
    if (!id) { deepLinked.current = true; return; }
    if (threadsQ.loading && !threads.length) return;
    deepLinked.current = true;
    try { window.history.replaceState(window.history.state, "", "/admin/inbox"); } catch { /* ignore */ }
    const t = threads.find((x) => x.thread_id === id);
    openThread(t || {
      thread_id: id, subject: "", to_email: "", from_email: "", latest_message: new Date().toISOString(),
      latest_body_preview: "", latest_direction: "inbound", message_count: 0, unread_count: 0, starred: false, has_attachments: false, created_at: new Date().toISOString(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountReady, threads, threadsQ.loading]);

  // ── Thread actions: tell the server at once, update the screen optimistically, re-sync afterwards.
  //    Undo waits for the original request to finish so it can never overtake it.
  const threadAction = async (action: string, threadIds?: string[], opts?: { quiet?: boolean; value?: string }) => {
    const ids = threadIds || (selectedThread ? [selectedThread.thread_id] : []);
    if (!ids.length) return;
    const idSet = new Set(ids);
    const removed = threads.filter((t) => idSet.has(t.thread_id));
    const label = ids.length > 1 ? `${ids.length} conversations` : "Conversation";
    let undone = false;
    const req = (async () => {
      try {
        const r = await fetch(`${API}/threads`, {
          method: action === "delete" ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ thread_ids: ids, action, value: opts?.value, account: activeAccount?.email }),
        });
        if (!r.ok) throw new Error(String(r.status));
      } catch {
        showToast("Could not reach the server. The change was not saved.");
      }
    })();
    const leaves = ["trash", "spam", "restore", "delete", "move", "archive"].includes(action);
    if (leaves) {
      setThreads((prev) => prev.filter((t) => !idSet.has(t.thread_id)));
      if (!opts?.quiet) {
        // Undo = put it back where we are looking now
        const backHere: [string, string?] = folder === "spam" ? ["spam"] : folder === "trash" ? ["trash"] : folder === "archive" ? ["archive"]
          : FOLDER_LABEL[folder] ? ["restore"] : ["move", folder];
        const undoAction = action === "delete" ? null : backHere;
        const msg = action === "trash" ? `${label} moved to Trash` : action === "spam" ? `${label} marked as spam` : action === "restore" ? `${label} moved to Inbox`
          : action === "archive" ? `${label} archived` : action === "move" ? `${label} moved to ${folderLabel(opts?.value || "")}` : `${label} deleted forever`;
        showToast(msg, undoAction ? () => {
          undone = true;
          setThreads((prev) => [...removed, ...prev].sort(sortNewest));
          req.then(() => threadAction(undoAction[0], ids, { quiet: true, value: undoAction[1] }));
        } : undefined);
      }
    } else if (action === "mark_read" || action === "mark_unread") {
      setThreads((prev) => prev.map((t) => (idSet.has(t.thread_id) ? { ...t, unread_count: action === "mark_read" ? 0 : Math.max(1, t.unread_count) } : t)));
      if (!opts?.quiet) showToast(action === "mark_read" ? "Marked as read" : "Marked as unread");
    } else if (action === "star" || action === "unstar") {
      setThreads((prev) => prev.map((t) => (idSet.has(t.thread_id) ? { ...t, starred: action === "star" } : t)));
      if (selectedThread && idSet.has(selectedThread.thread_id)) setSelectedThread({ ...selectedThread, starred: action === "star" });
    }
    await req;
    if (!undone) fetchThreads();
  };
  const emptyTrash = () => setConfirmSheet({
    title: `Delete everything in Trash forever? ${folderCounts.trash || threads.length} messages. This cannot be undone.`,
    label: "Empty Trash",
    onConfirm: async () => {
      setThreads(() => []);
      try {
        const r = await fetch(`${API}/threads`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empty_trash: true, account: activeAccount?.email }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || String(r.status));
        showToast(`Trash emptied: ${j.deleted || 0} deleted`);
      } catch { showToast("Could not reach the server. Trash was not emptied."); }
      fetchThreads();
    },
  });
  const toggleSelect = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bulk = (action: string) => { const ids = Array.from(selected); setSelected(new Set()); threadAction(action, ids); };

  // ── Clean-up by sender: "user@domain" or "@domain" ──
  const domainOf = (e: string) => "@" + ((e || "").split("@")[1] || "");
  const fromMatches = (t: Thread, p: string) => { const o = otherParty(t).toLowerCase(); return p.startsWith("@") ? (o.endsWith(p) || o.endsWith("." + p.slice(1))) : o === p; };
  const countFrom = (p: string) => threads.filter((t) => fromMatches(t, p)).length;
  const selectFrom = (patterns: string[]) => {
    const ps = patterns.map((x) => x.toLowerCase());
    setSelected(new Set(filtered.filter((t) => ps.some((p) => fromMatches(t, p))).map((t) => t.thread_id)));
  };
  const senderAction = async (action: "trash_from" | "spam_from", pattern: string) => {
    const p = pattern.toLowerCase();
    setThreads((prev) => prev.filter((t) => !fromMatches(t, p)));
    setSelected(new Set());
    try {
      const r = await fetch(`${API}/threads`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, value: p, account: activeAccount?.email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || String(r.status));
      const n = Number(j.updated || 0);
      showToast(`${n} message${n === 1 ? "" : "s"} from ${p} moved to ${action === "trash_from" ? "Trash" : "Spam"}`);
    } catch { showToast("Could not reach the server. The change was not saved."); }
    fetchThreads();
  };

  // ── Folders & filters (server keeps the rule set; every answer carries the saved copy) ──
  const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
  const rulesPost = async (body: Record<string, unknown>): Promise<{ moved?: number; rules?: Rules; folder?: CustomFolder }> => {
    setRulesBusy(true);
    try {
      const r = await fetch(`${API}/rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      if (j.rules) rulesQ.mutate(() => j.rules as Rules);
      return j;
    } finally { setRulesBusy(false); }
  };
  const blockSender = async (pattern: string) => {
    const p = pattern.toLowerCase();
    setSelected(new Set());
    try {
      const j = await rulesPost({ action: "block", pattern: p });
      setThreads((prev) => prev.filter((t) => !fromMatches(t, p)));
      showToast(`Blocked ${p}: ${j.moved || 0} moved to Spam`);
    } catch (e) { showToast(errMsg(e)); }
    fetchThreads();
  };
  const unblockSender = (p: string) => rulesPost({ action: "unblock", pattern: p }).then(() => showToast(`Unblocked ${p}`)).catch((e) => showToast(errMsg(e)));
  const targetLabel = (k: string) => (k === "spam" ? "Spam" : k === "archive" ? "Archive" : folderLabel(k));
  const saveFolderForm = async (e: React.FormEvent) => {
    e.preventDefault(); if (!folderForm) return;
    try {
      const j = await rulesPost(folderForm.key
        ? { action: "folder_update", key: folderForm.key, label: folderForm.label, icon: folderForm.icon, notify: folderForm.notify }
        : { action: "folder_add", label: folderForm.label, icon: folderForm.icon, notify: folderForm.notify });
      setFolderForm(null);
      if (j.folder && filterForm && !filterForm.folder) setFilterForm({ ...filterForm, folder: j.folder.key });
    } catch (err) { showToast(errMsg(err)); }
  };
  const updateFolder = (key: string, patch: Record<string, unknown>) => rulesPost({ action: "folder_update", key, ...patch }).catch((err) => showToast(errMsg(err)));
  const deleteFolder = async (key: string) => {
    try {
      const j = await rulesPost({ action: "folder_delete", key });
      showToast(`Folder deleted. ${j.moved || 0} back in the Inbox`);
      if (folder === key) setFolder("inbox");
      fetchThreads();
    } catch (err) { showToast(errMsg(err)); }
  };
  const addFilter = async (f: { from?: string; subject?: string; folder: string }) => {
    try {
      const j = await rulesPost({ action: "rule_add", ...f });
      showToast(`Filter saved. ${j.moved || 0} moved to ${targetLabel(f.folder)}`);
      fetchThreads();
    } catch (err) { showToast(errMsg(err)); }
  };
  const saveFilterForm = async (e: React.FormEvent) => {
    e.preventDefault(); if (!filterForm) return;
    try {
      const payload = { from: filterForm.from, subject: filterForm.subject, body: filterForm.body, folder: filterForm.folder };
      if (filterForm.id) { await rulesPost({ action: "rule_update", id: filterForm.id, ...payload }); showToast("Filter updated"); }
      else { const j = await rulesPost({ action: "rule_add", ...payload }); showToast(`Filter saved. ${j.moved || 0} moved to ${targetLabel(filterForm.folder)}`); }
      setFilterForm(null);
      fetchThreads();
    } catch (err) { showToast(errMsg(err)); }
  };
  const runFilters = async () => {
    try {
      const j = await rulesPost({ action: "apply", account: activeAccount?.email });
      showToast(`Filters ran. ${j.moved || 0} moved`);
      fetchThreads();
    } catch (err) { showToast(errMsg(err)); }
  };
  // a folder deleted elsewhere while we were looking at it → back to the Inbox
  useEffect(() => {
    if (rulesQ.data && !FOLDER_LABEL[folder] && !rulesQ.data.folders.some((f) => f.key === folder)) setFolder("inbox");
  }, [rulesQ.data, folder]);
  const confirmTrashFrom = (p: string, after?: () => void) => setConfirmSheet({
    title: `Move every message from ${p} to Trash? ${countFrom(p)} in this list now, older ones too. Trash empties itself after 30 days.`,
    label: `Trash all from ${p}`, onConfirm: () => { senderAction("trash_from", p); after?.(); },
  });
  const confirmBlock = (p: string, after?: () => void) => setConfirmSheet({
    title: `Block ${p}? Everything from ${p.startsWith("@") ? "that company" : "that address"} moves to Spam now, and new mail from it goes straight to Spam.`,
    label: `Block ${p}`, onConfirm: () => { blockSender(p); after?.(); },
  });

  // ── Mailbox management ──
  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault(); if (!accountForm) return;
    setSavingAccount(true);
    const initials = (accountForm.initials || accountForm.display_name.split(" ").map((w) => w[0]).join("")).toUpperCase().slice(0, 2);
    try {
      const r = await fetch(ACCOUNTS_API, {
        method: accountForm.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm.id
          ? { id: accountForm.id, display_name: accountForm.display_name, color: accountForm.color, initials }
          : { email: accountForm.email.trim().toLowerCase(), display_name: accountForm.display_name, color: accountForm.color, initials }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not save the mailbox");
      showToast(accountForm.id ? "Mailbox updated" : "Mailbox added");
      setAccountForm(null);
      accountsQ.refresh();
    } catch (err) { showToast(errMsg(err)); }
    finally { setSavingAccount(false); }
  };
  const removeAccount = (a: EmailAccount) => setConfirmSheet({
    title: `Remove the mailbox ${a.email}? Its mail stays saved; it just leaves the mailbox list.`,
    label: `Remove ${a.email}`,
    onConfirm: async () => {
      await fetch(`${ACCOUNTS_API}?id=${encodeURIComponent(a.id || "")}`, { method: "DELETE" }).catch(() => {});
      if (activeAccount?.email === a.email) setActiveAccount(null);
      accountsQ.refresh();
      showToast("Mailbox removed");
    },
  });

  // ── Compose ──
  const startCompose = async (mode: ComposeMode, msg?: Message) => {
    setComposeMode(mode);
    setFromAccount(activeAccount?.email || accounts.find((a) => a.is_default)?.email || accounts[0]?.email || "");
    setShowCcBcc(false); setComposeCc(""); setComposeBcc(""); setComposeFiles([]); setComposeOrig(null); setShowOrig(false); setComposeDraftId(null);
    if (mode === "new" && msg?.is_draft) {
      // a saved draft from the Drafts folder: continue it (sending removes the draft)
      setComposeTo(msg.to_email || ""); setComposeSubject(msg.subject === "(no subject)" ? "" : msg.subject || ""); setComposeBody(msg.body_text || snippet(msg));
      if ((msg.cc_emails || []).length) { setComposeCc((msg.cc_emails || []).join(", ")); setShowCcBcc(true); }
      setComposeDraftId(msg.id);
    } else if (mode === "new") {
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
      const d = await cacheGet<Draft | null>(DRAFT_KEY);
      if (d?.v && (d.v.to || d.v.subject || d.v.body)) {
        setComposeTo(d.v.to); setComposeSubject(d.v.subject); setComposeBody(d.v.body); setComposeCc(d.v.cc); setComposeBcc(d.v.bcc);
        if (d.v.cc || d.v.bcc) setShowCcBcc(true);
        if (d.v.from) setFromAccount(d.v.from);
        showToast("Your unsent message is back");
      }
    } else if ((mode === "reply" || mode === "replyAll") && msg) {
      const me = (msg.direction === "inbound" ? msg.to_email : msg.from_email).toLowerCase();
      setComposeTo(msg.direction === "inbound" ? msg.from_email : msg.to_email);
      setComposeSubject(/^re:/i.test(msg.subject) ? msg.subject : `Re: ${msg.subject}`);
      setComposeBody("");
      setComposeOrig(msg);
      if (mode === "replyAll") {
        const cc = (msg.cc_emails || []).filter((e) => e && e.toLowerCase() !== me && !accountByEmail.has(e.toLowerCase()));
        if (cc.length) { setComposeCc(cc.join(", ")); setShowCcBcc(true); }
      }
      if (msg.direction === "inbound" && accountByEmail.has(me)) setFromAccount(accountByEmail.get(me)!.email);
      else if (msg.direction === "outbound" && accountByEmail.has(me)) setFromAccount(accountByEmail.get(me)!.email);
    } else if (mode === "forward" && msg) {
      setComposeTo("");
      setComposeSubject(`Fwd: ${msg.subject.replace(/^fwd?:\s*/i, "")}`);
      setComposeBody(`\n\n---------- Forwarded message ----------\nFrom: ${msg.from_email}\nDate: ${new Date(msg.created_at).toLocaleString()}\nSubject: ${msg.subject}\nTo: ${msg.to_email}\n\n${msg.body_text || snippet(msg)}`);
      setComposeOrig(msg);
    }
    goToView("compose");
    setTimeout(() => { if (mode === "reply" || mode === "replyAll") bodyRef.current?.focus(); }, 250);
  };
  const composeDirty = !!(composeTo || composeSubject || composeBody.trim() || composeFiles.length);
  const closeCompose = () => { if (composeMode === "new" && !composeDraftId && composeDirty) setDiscardSheet(true); else back(); };
  const saveDraft = async () => {
    await cacheSet<Draft>(DRAFT_KEY, { to: composeTo, cc: composeCc, bcc: composeBcc, subject: composeSubject, body: composeBody, from: fromAccount, savedAt: Date.now() });
    setHasDraft(true); showToast("Saved on this device. Tap Compose to finish it."); back();
  };
  const discardDraft = async () => { await cacheSet<Draft | null>(DRAFT_KEY, null); setHasDraft(false); back(); };
  const splitList = (s: string) => s.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || sending || uploading) return;
    setSending(true);
    const isReply = (composeMode === "reply" || composeMode === "replyAll") && selectedThread;
    const endpoint = isReply ? `${API}/reply` : `${API}/compose`;
    const cc = splitList(composeCc), bcc = splitList(composeBcc);
    const to = composeTo.trim();
    const payload = isReply
      ? { thread_id: selectedThread!.thread_id, to_email: to, to_name: selectedThread!.customer_name, subject: composeSubject, reply_body: composeBody, from_email: fromAccount, attachments: composeFiles, cc_emails: cc }
      : { to_email: to, subject: composeSubject, body: composeBody, from_email: fromAccount, cc_emails: cc, bcc_emails: bcc, attachments: composeFiles, draft_id: composeDraftId || undefined };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Send failed (${res.status})`); }
      if (composeMode === "new" && !composeDraftId) { await cacheSet<Draft | null>(DRAFT_KEY, null); setHasDraft(false); }
      showToast("Sent");
      const reopen = isReply ? selectedThread : null;
      back();
      fetchThreads();
      if (reopen) setTimeout(() => openThread(reopen), 450);
    } catch (e) {
      showToast((e as Error).message || "Could not send");
    } finally { setSending(false); }
  };
  // attachments go straight from the device to Supabase Storage (Vercel caps request bodies at ~4.5 MB);
  // compose/reply get the paths and attach the files server-side (src/lib/email.ts loadOutboundAttachments)
  const addFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const MAX_FILE = 15 * 1024 * 1024, MAX_TOTAL = 30 * 1024 * 1024;
    let total = composeFiles.reduce((s, f) => s + f.size_bytes, 0);
    const supa = createBrowserSupabase();
    const files = Array.from(list);
    for (const file of files) {
      if (file.size > MAX_FILE) { showToast(`${file.name} is over 15 MB, too large to send`); continue; }
      if (total + file.size > MAX_TOTAL) { showToast("Attachments are limited to 30 MB in total"); break; }
      setUploading((n) => n + 1);
      try {
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-90);
        const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
        const path = `outbound/${rand}/${safe}`;
        const type = file.type || "application/octet-stream";
        const { error } = await supa.storage.from("email-attachments").upload(path, file, { contentType: type });
        if (error) throw new Error(error.message);
        total += file.size;
        setComposeFiles((prev) => [...prev, { path, filename: file.name, content_type: type, size_bytes: file.size }]);
      } catch { showToast(`Could not upload ${file.name}`); }
      finally { setUploading((n) => n - 1); }
    }
    if (composeFileRef.current) composeFileRef.current.value = "";
  };

  // ── List paging + pull to refresh ──
  const [shown, setShown] = useState(PAGE);
  useEffect(() => { setShown(PAGE); setSelected(new Set()); }, [folder, activeAccount, search]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, threads.length, search, view]);
  const pull = useRef<number | null>(null);
  const [pullPx, setPullPx] = useState(0);

  const filtered = useMemo(() => threads.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase().trim();
    return (t.subject || "").toLowerCase().includes(s) || otherParty(t).toLowerCase().includes(s) || (t.account || "").toLowerCase().includes(s)
      || (t.customer_name || "").toLowerCase().includes(s) || (t.latest_body_preview || "").toLowerCase().includes(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [threads, search]);

  const lastMessage = messages[messages.length - 1];
  const replyTarget = [...messages].reverse().find((m) => m.direction === "inbound") || lastMessage;
  const canReplyAll = !!replyTarget && (replyTarget.cc_emails || []).filter((e) => !accountByEmail.has((e || "").toLowerCase())).length > 0;
  const draftMsg = messages.find((m) => m.is_draft);

  const safeTop = { paddingTop: "calc(0.25rem + env(safe-area-inset-top))" };
  const isSystem = (k: string) => !!FOLDER_LABEL[k];
  const leftAction = folder === "trash" ? null : (folder === "archive" || folder === "spam" || folder === "sent" || folder === "drafts") ? "trash" : "archive";

  // ═══════════════════════════════════════════
  // SHARED OVERLAYS
  // ═══════════════════════════════════════════
  const toastEl = toast && (
    <div className="fixed bottom-24 inset-x-0 z-[95] flex justify-center px-4 pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="pointer-events-auto flex items-center gap-3 pl-5 pr-2 py-2 max-w-full bg-mail-panel border border-mail-gold/40 rounded-full text-[16px] text-mail-text shadow-2xl ro-mail-up" role="status">
        <span className="truncate min-w-0">{toast.msg}</span>
        {toast.undo ? (
          <button onClick={() => { toast.undo?.(); setToast(null); }} className="shrink-0 flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-mail-gold text-mail-ink text-[16px] font-bold"><Undo2 size={17} /> Undo</button>
        ) : <span className="w-2" />}
      </div>
    </div>
  );
  const sheetsEl = (
    <>
      {movePick && (
        <ActionSheet title="Move to" onClose={() => setMovePick(null)} items={[
          ...(folder !== "inbox" ? [{ icon: Inbox, label: "Inbox", onClick: () => { setSelected(new Set()); threadAction("restore", movePick.ids); movePick.after?.(); } }] : []),
          ...(folder !== "archive" ? [{ icon: Archive, label: "Archive", onClick: () => { setSelected(new Set()); threadAction("archive", movePick.ids); movePick.after?.(); } }] : []),
          ...customFolders.filter((f) => f.key !== folder).map((f) => ({ icon: iconFor(f.icon), label: f.label, onClick: () => { setSelected(new Set()); threadAction("move", movePick.ids, { value: f.key }); movePick.after?.(); } })),
          { icon: FolderPlus, label: "New folder…", onClick: () => { setFolderForm({ label: "", icon: "folder", notify: false }); goToView("rules"); } },
        ]} />
      )}
      {filePick && (
        <ActionSheet title={`Always file mail from ${filePick} in…`} onClose={() => setFilePick(null)} items={[
          ...customFolders.map((f) => ({ icon: iconFor(f.icon), label: f.label, onClick: () => addFilter({ from: filePick, folder: f.key }) })),
          { icon: Archive, label: "Archive", onClick: () => addFilter({ from: filePick, folder: "archive" }) },
          { icon: ShieldAlert, label: "Spam", onClick: () => addFilter({ from: filePick, folder: "spam" }) },
          { icon: FolderPlus, label: "New folder…", onClick: () => { setFolderForm({ label: "", icon: "folder", notify: false }); setFilterForm({ from: filePick, subject: "", body: "", folder: "" }); goToView("rules"); } },
        ]} />
      )}
      {confirmSheet && (
        <ActionSheet title={confirmSheet.title} onClose={() => setConfirmSheet(null)} items={[
          { icon: Check, label: confirmSheet.label, danger: true, onClick: confirmSheet.onConfirm },
          { icon: X, label: "Cancel", onClick: () => {} },
        ]} />
      )}
      {discardSheet && (
        <ActionSheet title="You have an unsent message" onClose={() => setDiscardSheet(false)} items={[
          { icon: FileEdit, label: "Keep it on this device for later", onClick: saveDraft },
          { icon: Trash2, label: "Throw it away", onClick: discardDraft, danger: true },
        ]} />
      )}
    </>
  );

  // ═══════════════════════════════════════════
  // FOLDER NAV (drawer on a phone, side bar on a computer)
  // ═══════════════════════════════════════════
  const pickFolder = (k: string) => { setFolder(k); setDrawerOpen(false); setSearch(""); toList(); };
  const navBtn = (key: string, label: string, Icon: React.ElementType, count?: number, strong?: boolean) => (
    <button key={key} onClick={() => pickFolder(key)} aria-current={folder === key ? "page" : undefined}
      className={cn("w-full flex items-center gap-4 px-4 min-h-[52px] rounded-full text-[17px] font-medium transition-colors mb-0.5",
        folder === key ? "bg-mail-gold/15 text-mail-gold" : "text-mail-sub hover:bg-mail-line/[0.06]")}>
      <Icon size={22} className="shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {(count || 0) > 0 && <span className={cn("text-[15px] font-bold", strong ? "text-mail-gold" : "text-mail-muted")}>{count}</span>}
    </button>
  );
  const navEl = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-5 pb-3" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ro-co-mark-v2.png" alt="" className="w-9 h-9 rounded-lg bg-black object-contain" />
        <span className="flex-1 font-heading text-[22px] font-semibold tracking-wide text-mail-text">RO Mail</span>
      </div>
      <button onClick={() => { setDrawerOpen(false); goToView("accounts"); }} className="mx-3 mb-3 flex items-center gap-3 px-3.5 min-h-[60px] py-2 rounded-2xl bg-mail-line/[0.05] border border-mail-line/15 text-left" aria-label="Switch mailbox">
        <span className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
          style={activeAccount ? chipStyle(activeAccount.color) : { backgroundColor: "rgba(201,168,76,.2)", color: "#C9A84C" }}>
          {activeAccount ? activeAccount.initials : "All"}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-semibold text-mail-text truncate">{activeAccount ? activeAccount.display_name : "All mailboxes"}</span>
          <span className="block text-[15px] text-mail-muted truncate">{activeAccount ? activeAccount.email : `${accounts.length} mailboxes`}</span>
        </span>
        <ChevronDown size={20} className="text-mail-muted shrink-0" />
      </button>
      <nav className="flex-1 overflow-y-auto px-2 min-h-0" aria-label="Folders">
        {FOLDERS.map((f) => navBtn(f.key, f.label, f.icon, f.key === "inbox" || f.key === "drafts" || f.key === "spam" ? folderCounts[f.key] : undefined, f.key === "inbox"))}
        {customFolders.length > 0 && <p className="px-4 pt-4 pb-1 text-[14px] font-bold uppercase tracking-wider text-mail-muted">Folders</p>}
        {customFolders.map((f) => navBtn(f.key, f.label, iconFor(f.icon), folderCounts[f.key]))}
        <button onClick={() => { setDrawerOpen(false); goToView("rules"); }} className="w-full flex items-center gap-4 px-4 min-h-[52px] rounded-full text-[17px] font-medium text-mail-sub hover:bg-mail-line/[0.06]">
          <ListFilter size={22} /> <span className="flex-1 text-left">Folders &amp; filters</span>
        </button>
        <div className="h-px bg-mail-line/10 my-3 mx-4" />
        <button onClick={goDashboard} className="w-full flex items-center gap-4 px-4 min-h-[52px] rounded-full text-[17px] font-medium text-mail-sub hover:bg-mail-line/[0.06]">
          <LayoutDashboard size={22} /> <span className="flex-1 text-left">Back to Dashboard</span>
        </button>
        <button onClick={() => { setDrawerOpen(false); goToView("accounts"); }} className="w-full flex items-center gap-4 px-4 min-h-[52px] rounded-full text-[17px] font-medium text-mail-sub hover:bg-mail-line/[0.06]">
          <Settings size={22} /> <span className="flex-1 text-left">Mailboxes</span>
        </button>
      </nav>
      <button onClick={toggleTheme} className="flex items-center gap-4 mx-2 px-4 min-h-[56px] rounded-full text-[17px] font-medium text-mail-sub hover:bg-mail-line/[0.06]"
        style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }} aria-pressed={light}>
        {light ? <Moon size={22} /> : <Sun size={22} />}
        <span className="flex-1 text-left">{light ? "Dark mode" : "Light mode"}</span>
        <span className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", light ? "bg-mail-gold" : "bg-mail-line/25")}>
          <span className={cn("inline-block h-6 w-6 rounded-full bg-white shadow transition-transform", light ? "translate-x-5" : "translate-x-0.5")} />
        </span>
      </button>
    </div>
  );
  const drawerEl = drawerOpen && !wide && (
    <div className="fixed inset-0 z-[80]" onClick={() => setDrawerOpen(false)}>
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-mail-panel ro-mail-left shadow-2xl" onClick={(e) => e.stopPropagation()}>{navEl}</div>
    </div>
  );

  // ═══════════════════════════════════════════
  // MAILBOXES
  // ═══════════════════════════════════════════
  const headerBar = (title: string, right?: React.ReactNode, onBack: () => void = back, closeIcon = false) => (
    <div className="flex items-center gap-1 px-1.5 py-1 border-b border-mail-line/10 shrink-0" style={safeTop}>
      <button onClick={onBack} aria-label={closeIcon ? "Close" : "Back"} className={ICON_BTN}>{closeIcon ? <X size={26} /> : <ChevronLeft size={28} />}</button>
      <h2 className="flex-1 min-w-0 truncate text-[20px] font-semibold text-mail-text">{title}</h2>
      {right}
    </div>
  );
  const accountsPane = view === "accounts" && (
    <div className="flex flex-col h-full min-h-0">
      {headerBar("Mailboxes", (
        <button onClick={() => setAccountForm({ email: "", display_name: "", color: "#C9A84C", initials: "" })} className="flex items-center gap-1.5 min-h-[44px] px-4 mr-1 rounded-full bg-mail-gold text-mail-ink text-[16px] font-bold">
          <Plus size={18} /> Add
        </button>
      ))}
      <div className="flex-1 overflow-y-auto min-h-0">
        <button onClick={() => { setActiveAccount(null); back(); }}
          className={cn("w-full flex items-center gap-4 px-5 min-h-[72px] py-3 border-b border-mail-line/10 hover:bg-mail-line/[0.04]", !activeAccount && "bg-mail-gold/10")}>
          <span className="w-12 h-12 rounded-full bg-mail-raised flex items-center justify-center shrink-0"><Mail size={22} className="text-mail-gold" /></span>
          <span className="flex-1 text-left">
            <span className="block text-[18px] font-semibold text-mail-text">All mailboxes</span>
            <span className="block text-[15px] text-mail-muted">Everything that comes in, in one list</span>
          </span>
          {!activeAccount && <Check size={22} className="text-mail-gold shrink-0" />}
        </button>
        {accounts.map((a) => (
          <div key={a.email} className={cn("flex items-center gap-3 pl-5 pr-2 min-h-[72px] py-2 border-b border-mail-line/10", activeAccount?.email === a.email && "bg-mail-gold/10")}>
            <button onClick={() => { setActiveAccount(a); setFromAccount(a.email); back(); }} className="flex-1 min-w-0 flex items-center gap-4 text-left min-h-[56px]">
              <span className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0" style={chipStyle(a.color)}>{a.initials}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-[18px] font-semibold text-mail-text truncate">{a.display_name}</span>
                  {a.is_default && <span className="text-[12px] font-bold text-mail-gold bg-mail-gold/15 px-1.5 py-0.5 rounded shrink-0">MAIN</span>}
                </span>
                <span className="block text-[15px] text-mail-muted truncate">{a.email}</span>
              </span>
              {activeAccount?.email === a.email && <Check size={22} className="text-mail-gold shrink-0" />}
            </button>
            <button onClick={() => setAccountForm({ id: a.id, email: a.email, display_name: a.display_name, color: a.color, initials: a.initials })} aria-label={`Edit ${a.email}`} className={ICON_BTN}><Pencil size={19} /></button>
            <button onClick={() => removeAccount(a)} aria-label={`Remove ${a.email}`} className={cn(ICON_BTN, "hover:text-mail-danger")}><Trash2 size={19} /></button>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-center text-mail-muted text-[17px] py-16">{accountsQ.loading ? "Loading mailboxes…" : "No mailboxes yet. Tap Add to set one up."}</p>}
        <button onClick={() => goToView("rules")} className="mx-4 my-6 flex items-center gap-3 px-4 min-h-[64px] rounded-2xl bg-mail-line/[0.05] border border-mail-line/15 text-left w-[calc(100%-2rem)]">
          <ListFilter size={22} className="text-mail-gold shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-[17px] font-semibold text-mail-text">Folders, filters &amp; blocked senders</span>
            <span className="block text-[15px] text-mail-muted truncate">{customFolders.length} folders · {filters.length} filters · {blocked.length} blocked</span>
          </span>
          <ChevronDown size={20} className="text-mail-muted -rotate-90" />
        </button>
      </div>
      {accountForm && (
        <div className="fixed inset-0 z-[85] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setAccountForm(null)}>
          <form onSubmit={saveAccount} onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-mail-panel border border-mail-line/15 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 ro-mail-up"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-semibold text-mail-text">{accountForm.id ? "Edit mailbox" : "New mailbox"}</h3>
              <button type="button" onClick={() => setAccountForm(null)} aria-label="Close" className={ICON_BTN}><X size={22} /></button>
            </div>
            <label className="block"><span className="block text-[16px] text-mail-sub mb-1.5">Email address</span>
              <input type="email" required disabled={!!accountForm.id} value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} placeholder="name@rounlimited.com" className={cn(INPUT_CLS, accountForm.id && "opacity-60")} />
            </label>
            <label className="block"><span className="block text-[16px] text-mail-sub mb-1.5">Name people see</span>
              <input required value={accountForm.display_name} onChange={(e) => setAccountForm({ ...accountForm, display_name: e.target.value })} placeholder="RO Unlimited" className={INPUT_CLS} />
            </label>
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <label className="block"><span className="block text-[16px] text-mail-sub mb-1.5">Initials</span>
                <input maxLength={2} value={accountForm.initials} onChange={(e) => setAccountForm({ ...accountForm, initials: e.target.value.toUpperCase() })} placeholder="Auto" className={INPUT_CLS} />
              </label>
              <div><span className="block text-[16px] text-mail-sub mb-1.5">Colour</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setAccountForm({ ...accountForm, color: c })} aria-label={`Colour ${c}`}
                      className={cn("w-9 h-9 rounded-full border-2", accountForm.color === c ? "border-mail-text scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" disabled={savingAccount} className="w-full min-h-[52px] rounded-2xl bg-mail-gold text-mail-ink font-bold text-[17px] disabled:opacity-50 flex items-center justify-center gap-2">
              {savingAccount ? <Loader2 size={20} className="animate-spin" /> : accountForm.id ? "Save changes" : "Add mailbox"}
            </button>
          </form>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════
  // FOLDERS & FILTERS
  // ═══════════════════════════════════════════
  const rulesPane = view === "rules" && (
    <div className="flex flex-col h-full min-h-0">
      {headerBar("Folders & filters", (
        <button onClick={runFilters} disabled={rulesBusy || filters.length === 0} className="flex items-center gap-1.5 min-h-[44px] px-4 mr-1 rounded-full bg-mail-line/[0.06] border border-mail-line/20 text-[16px] font-semibold text-mail-sub disabled:opacity-50">
          {rulesBusy ? <Loader2 size={17} className="animate-spin" /> : <ListFilter size={17} />} Run filters
        </button>
      ))}
      <div className="flex-1 overflow-y-auto min-h-0 pb-16">
        <section className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[19px] font-semibold text-mail-text">Folders</h3>
            <button onClick={() => setFolderForm({ label: "", icon: "folder", notify: false })} className="flex items-center gap-1.5 min-h-[44px] px-3 text-[16px] font-bold text-mail-gold rounded-full hover:bg-mail-line/[0.06]"><Plus size={18} /> New folder</button>
          </div>
          <p className="text-[16px] text-mail-sub mt-1 mb-2 leading-snug">Your own folders show in the menu. The bell turns phone alerts on for mail filed there. Off means it is filed quietly.</p>
          {customFolders.length === 0 && !folderForm && <p className="text-[17px] text-mail-muted py-3">No folders yet.</p>}
          {customFolders.map((f) => { const I = iconFor(f.icon); const n = filters.filter((r) => r.folder === f.key).length; return (
            <div key={f.key} className="flex items-center gap-2 py-1.5 border-b border-mail-line/10">
              <button onClick={() => pickFolder(f.key)} className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-[56px]">
                <I size={22} className="text-mail-gold shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[17px] font-medium text-mail-text truncate">{f.label}</span>
                  <span className="block text-[15px] text-mail-muted">{n} {n === 1 ? "filter" : "filters"}{(folderCounts[f.key] || 0) > 0 ? ` · ${folderCounts[f.key]} unread` : ""}{f.notify ? " · alerts on" : ""}</span>
                </span>
              </button>
              <button onClick={() => updateFolder(f.key, { notify: !f.notify })} aria-label={f.notify ? `Turn alerts off for ${f.label}` : `Turn alerts on for ${f.label}`} className={cn(ICON_BTN, f.notify && "text-mail-gold")}>{f.notify ? <Bell size={20} /> : <BellOff size={20} />}</button>
              <button onClick={() => setFolderForm({ key: f.key, label: f.label, icon: f.icon || "folder", notify: !!f.notify })} aria-label={`Rename ${f.label}`} className={ICON_BTN}><Pencil size={19} /></button>
              <button onClick={() => setConfirmSheet({ title: `Delete the folder "${f.label}"? Its mail goes back to the Inbox and its filters are removed.`, label: "Delete folder", onConfirm: () => deleteFolder(f.key) })} aria-label={`Delete ${f.label}`} className={cn(ICON_BTN, "hover:text-mail-danger")}><Trash2 size={19} /></button>
            </div>
          ); })}
          {folderForm && (
            <form onSubmit={saveFolderForm} className="mt-3 p-4 rounded-2xl bg-mail-panel border border-mail-line/15 space-y-3">
              <input autoFocus value={folderForm.label} onChange={(e) => setFolderForm({ ...folderForm, label: e.target.value })} placeholder="Folder name" aria-label="Folder name" className={INPUT_CLS} />
              <div className="flex flex-wrap gap-2">
                {Object.keys(FOLDER_ICONS).map((k) => { const I = FOLDER_ICONS[k]; return (
                  <button type="button" key={k} onClick={() => setFolderForm({ ...folderForm, icon: k })} aria-label={`Icon ${k}`}
                    className={cn("w-12 h-12 rounded-full flex items-center justify-center border", folderForm.icon === k ? "border-mail-gold text-mail-gold bg-mail-gold/15" : "border-mail-line/20 text-mail-sub")}><I size={20} /></button>
                ); })}
              </div>
              <label className="flex items-center gap-3 min-h-[48px] text-[17px] text-mail-text">
                <input type="checkbox" checked={folderForm.notify} onChange={(e) => setFolderForm({ ...folderForm, notify: e.target.checked })} className="w-6 h-6 accent-[#C9A84C]" />
                Phone alert when mail is filed here
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setFolderForm(null)} className="min-h-[48px] px-5 rounded-full bg-mail-line/[0.06] border border-mail-line/20 text-[17px] text-mail-sub">Cancel</button>
                <button type="submit" disabled={rulesBusy || !folderForm.label.trim()} className="min-h-[48px] px-5 rounded-full bg-mail-gold text-mail-ink text-[17px] font-bold disabled:opacity-50">{folderForm.key ? "Save" : "Create"}</button>
              </div>
            </form>
          )}
        </section>

        <section className="px-5 pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[19px] font-semibold text-mail-text">Filters</h3>
            <button onClick={() => setFilterForm({ from: "", subject: "", body: "", folder: customFolders[0]?.key || "archive" })} className="flex items-center gap-1.5 min-h-[44px] px-3 text-[16px] font-bold text-mail-gold rounded-full hover:bg-mail-line/[0.06]"><Plus size={18} /> New filter</button>
          </div>
          <p className="text-[16px] text-mail-sub mt-1 mb-2 leading-snug">Checked top to bottom on every new email; the first match decides the folder. Sender: an address, or @company.com for everything from that company. Use | for &ldquo;or&rdquo;. Mail from your customers always stays in the Inbox.</p>
          {filters.length === 0 && !filterForm && <p className="text-[17px] text-mail-muted py-3">No filters yet. Open a conversation&apos;s menu and choose &ldquo;Always file … in&rdquo; to make one fast.</p>}
          {filters.map((r, i) => (
            <div key={r.id} className="flex items-start gap-1 py-2 border-b border-mail-line/10">
              <span className="text-[15px] font-bold text-mail-muted w-6 pt-3 shrink-0 text-right">{i + 1}</span>
              <button onClick={() => setFilterForm({ id: r.id, from: (r.from || []).join(", "), subject: r.subject || "", body: r.body || "", folder: r.folder })} className="flex-1 min-w-0 text-left px-2 py-2 min-h-[48px]">
                {r.from?.length ? <span className="block text-[16px] text-mail-text break-words">From {r.from.join(", ")}</span> : null}
                {r.subject ? <span className="block text-[16px] text-mail-text break-words">Subject has <span className="font-mono text-[15px] text-mail-sub">{r.subject}</span></span> : null}
                {r.body ? <span className="block text-[16px] text-mail-text break-words">Email has <span className="font-mono text-[15px] text-mail-sub">{r.body}</span></span> : null}
                <span className="block text-[16px] font-semibold text-mail-gold mt-0.5">→ {targetLabel(r.folder)}{r.note ? <span className="font-normal text-mail-muted"> · {r.note}</span> : null}</span>
              </button>
              <div className="flex items-center shrink-0">
                <button disabled={i === 0 || rulesBusy} onClick={() => rulesPost({ action: "rule_move", id: r.id, dir: "up" }).catch((err) => showToast(errMsg(err)))} aria-label="Move up" className={cn(ICON_BTN, "w-11 disabled:opacity-30")}><ArrowUp size={19} /></button>
                <button disabled={i === filters.length - 1 || rulesBusy} onClick={() => rulesPost({ action: "rule_move", id: r.id, dir: "down" }).catch((err) => showToast(errMsg(err)))} aria-label="Move down" className={cn(ICON_BTN, "w-11 disabled:opacity-30")}><ArrowDown size={19} /></button>
                <button disabled={rulesBusy} onClick={() => setConfirmSheet({ title: "Remove this filter? Mail already filed stays where it is.", label: "Remove filter", onConfirm: () => rulesPost({ action: "rule_delete", id: r.id }).then(() => showToast("Filter removed")).catch((err) => showToast(errMsg(err))) })} aria-label="Remove filter" className={cn(ICON_BTN, "w-11 hover:text-mail-danger")}><Trash2 size={19} /></button>
              </div>
            </div>
          ))}
          {filterForm && (
            <form onSubmit={saveFilterForm} className="mt-3 p-4 rounded-2xl bg-mail-panel border border-mail-line/15 space-y-3">
              <label className="block"><span className="block text-[16px] font-medium text-mail-sub mb-1">From</span>
                <input value={filterForm.from} onChange={(e) => setFilterForm({ ...filterForm, from: e.target.value })} placeholder="name@company.com or @company.com" className={INPUT_CLS} inputMode="email" autoCapitalize="none" />
              </label>
              <label className="block"><span className="block text-[16px] font-medium text-mail-sub mb-1">Subject has <span className="text-mail-muted font-normal">(optional)</span></span>
                <input value={filterForm.subject} onChange={(e) => setFilterForm({ ...filterForm, subject: e.target.value })} placeholder="invoice|receipt" className={INPUT_CLS} autoCapitalize="none" />
              </label>
              <label className="block"><span className="block text-[16px] font-medium text-mail-sub mb-1">Words in the email <span className="text-mail-muted font-normal">(optional)</span></span>
                <input value={filterForm.body} onChange={(e) => setFilterForm({ ...filterForm, body: e.target.value })} placeholder="unsubscribe|webinar" className={INPUT_CLS} autoCapitalize="none" />
              </label>
              <label className="block"><span className="block text-[16px] font-medium text-mail-sub mb-1">Move to</span>
                <select value={filterForm.folder} onChange={(e) => setFilterForm({ ...filterForm, folder: e.target.value })} className={INPUT_CLS}>
                  <option value="">Pick a folder…</option>
                  {customFolders.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  <option value="archive">Archive</option>
                  <option value="spam">Spam</option>
                </select>
              </label>
              {!filterForm.folder && <button type="button" onClick={() => setFolderForm({ label: "", icon: "folder", notify: false })} className="text-[16px] font-bold text-mail-gold min-h-[44px]">+ Make a new folder first</button>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setFilterForm(null)} className="min-h-[48px] px-5 rounded-full bg-mail-line/[0.06] border border-mail-line/20 text-[17px] text-mail-sub">Cancel</button>
                <button type="submit" disabled={rulesBusy || !filterForm.folder || (!filterForm.from.trim() && !filterForm.subject.trim() && !filterForm.body.trim())} className="min-h-[48px] px-5 rounded-full bg-mail-gold text-mail-ink text-[17px] font-bold disabled:opacity-50">{filterForm.id ? "Save" : "Save & run"}</button>
              </div>
            </form>
          )}
        </section>

        <section className="px-5 pt-8">
          <h3 className="text-[19px] font-semibold text-mail-text">Blocked senders</h3>
          <p className="text-[16px] text-mail-sub mt-1 mb-2">Mail from these goes straight to Spam. Block one from a conversation&apos;s menu or from a selection.</p>
          {blocked.length === 0 ? <p className="text-[17px] text-mail-muted py-3">Nothing blocked yet.</p> : blocked.map((bp) => (
            <div key={bp} className="flex items-center gap-3 min-h-[56px] border-b border-mail-line/10">
              <ShieldAlert size={20} className="text-mail-muted shrink-0" />
              <span className="flex-1 text-[17px] text-mail-text truncate">{bp}</span>
              <button onClick={() => unblockSender(bp)} className="min-h-[44px] px-4 text-[16px] font-bold text-mail-gold rounded-full hover:bg-mail-line/[0.06]">Unblock</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // COMPOSE
  // ═══════════════════════════════════════════
  const composeTitle = composeMode === "new" ? (composeDraftId ? "Finish draft" : "New message") : composeMode === "forward" ? "Forward" : composeMode === "replyAll" ? "Reply all" : "Reply";
  const canSend = !!composeTo.trim() && !!composeSubject.trim() && !!composeBody.trim() && !sending && uploading === 0;
  const composePane = view === "compose" && (
    <div className="flex flex-col h-full min-h-0">
      {headerBar(composeTitle, (
        <>
          <button onClick={() => composeFileRef.current?.click()} aria-label="Attach files" className={ICON_BTN}>{uploading ? <Loader2 size={22} className="animate-spin" /> : <Paperclip size={23} />}</button>
          <button onClick={handleSend} disabled={!canSend} aria-label="Send"
            className="ml-1 mr-1 flex items-center gap-2 min-h-[48px] pl-5 pr-4 bg-mail-gold text-mail-ink font-bold text-[17px] rounded-full disabled:opacity-40">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <>Send <Send size={18} /></>}
          </button>
        </>
      ), closeCompose, true)}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        <div className="px-4">
          {accounts.length > 1 && (
            <label className="flex items-center gap-3 min-h-[56px] border-b border-mail-line/10 min-w-0">
              <span className="text-mail-muted text-[16px] w-[68px] shrink-0">From</span>
              <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="flex-1 min-w-0 w-full min-h-[44px] bg-transparent text-[17px] text-mail-text focus:outline-none truncate">
                {accounts.map((a) => <option key={a.email} value={a.email}>{a.display_name} ({a.email})</option>)}
              </select>
            </label>
          )}
          <div className="flex items-center gap-3 min-h-[56px] border-b border-mail-line/10">
            <span className="text-mail-muted text-[16px] w-[68px] shrink-0">To</span>
            <input type="email" list="ro-known-addresses" autoComplete="off" autoCapitalize="none" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="name@example.com" aria-label="To"
              className="flex-1 min-w-0 min-h-[44px] bg-transparent text-[17px] text-mail-text placeholder:text-mail-muted focus:outline-none" />
            {!showCcBcc && <button onClick={() => setShowCcBcc(true)} className="min-h-[44px] px-3 text-[16px] text-mail-gold font-semibold">Cc/Bcc</button>}
          </div>
          <datalist id="ro-known-addresses">{knownAddresses.map((a) => <option key={a} value={a} />)}</datalist>
          {showCcBcc && (
            <>
              <div className="flex items-center gap-3 min-h-[56px] border-b border-mail-line/10">
                <span className="text-mail-muted text-[16px] w-[68px] shrink-0">Cc</span>
                <input type="text" list="ro-known-addresses" autoCapitalize="none" value={composeCc} onChange={(e) => setComposeCc(e.target.value)} placeholder="Separate with commas" aria-label="Cc"
                  className="flex-1 min-w-0 min-h-[44px] bg-transparent text-[17px] text-mail-text placeholder:text-mail-muted focus:outline-none" />
              </div>
              {composeMode !== "reply" && composeMode !== "replyAll" && (
                <div className="flex items-center gap-3 min-h-[56px] border-b border-mail-line/10">
                  <span className="text-mail-muted text-[16px] w-[68px] shrink-0">Bcc</span>
                  <input type="text" list="ro-known-addresses" autoCapitalize="none" value={composeBcc} onChange={(e) => setComposeBcc(e.target.value)} aria-label="Bcc"
                    className="flex-1 min-w-0 min-h-[44px] bg-transparent text-[17px] text-mail-text placeholder:text-mail-muted focus:outline-none" />
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-3 min-h-[56px] border-b border-mail-line/10">
            <span className="text-mail-muted text-[16px] w-[68px] shrink-0">Subject</span>
            <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject" aria-label="Subject"
              className="flex-1 min-w-0 min-h-[44px] bg-transparent text-[17px] text-mail-text placeholder:text-mail-muted focus:outline-none" />
          </div>
        </div>
        <textarea ref={bodyRef} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message" aria-label="Message"
          className="flex-1 w-full min-h-[38vh] px-4 py-3 bg-transparent text-[18px] text-mail-text placeholder:text-mail-muted focus:outline-none resize-none leading-relaxed" />
        <input ref={composeFileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        {composeFiles.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {composeFiles.map((f, i) => (
                <div key={f.path} className="flex items-center gap-2 pl-3.5 pr-1 min-h-[48px] bg-mail-line/[0.05] border border-mail-line/15 rounded-xl text-[15px] text-mail-sub">
                  <Paperclip size={16} className="text-mail-gold shrink-0" />
                  <span className="truncate max-w-[170px]">{f.filename}</span>
                  <span className="text-mail-muted">{fmtSize(f.size_bytes)}</span>
                  <button onClick={() => setComposeFiles((prev) => prev.filter((_, j) => j !== i))} aria-label={`Remove ${f.filename}`} className="w-11 h-11 flex items-center justify-center rounded-full text-mail-muted hover:text-mail-danger"><X size={18} /></button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[14px] text-mail-muted">Up to 15 MB per file, 30 MB in total</p>
          </div>
        )}
        {composeOrig && composeMode !== "forward" && (
          <div className="mx-4 mb-4 rounded-2xl border border-mail-line/15 bg-mail-line/[0.03] overflow-hidden">
            <button onClick={() => setShowOrig((s) => !s)} className="w-full flex items-center gap-2 px-3.5 min-h-[52px] text-left">
              <Reply size={18} className="text-mail-muted shrink-0" />
              <span className="flex-1 text-[15px] text-mail-sub truncate">Replying to {senderLabel(composeOrig.from_email)} · {fmtWhen(composeOrig.created_at, true)}</span>
              {showOrig ? <ChevronUp size={20} className="text-mail-muted" /> : <ChevronDown size={20} className="text-mail-muted" />}
            </button>
            {showOrig && (
              <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto">
                {composeOrig.body_html ? <div className="rounded-xl overflow-hidden"><EmailBody html={composeOrig.body_html} dark={!light} /></div>
                  : <pre className="text-[16px] text-mail-sub whitespace-pre-wrap font-body leading-relaxed">{composeOrig.body_text || "(no content)"}</pre>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // CONVERSATION
  // ═══════════════════════════════════════════
  let threadPane: React.ReactNode = null;
  if (view === "thread" && selectedThread) {
    const t = selectedThread;
    const acct = accountByEmail.get((mailboxOf(t) || "").toLowerCase());
    const inTrash = folder === "trash", inSpam = folder === "spam", inArchive = folder === "archive";
    const toggleIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => setter((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); showToast("Copied"); } catch { showToast(s); } };
    const afterLeave = (action: string, value?: string) => { threadAction(action, [t.thread_id], value ? { value } : undefined); back(); };
    const party = otherParty(t).toLowerCase();
    const ordered = [...messages].reverse();
    const visible = showAllMsgs ? ordered : ordered.filter((m, i) => i === 0 || !m.read);
    const hidden = ordered.length - visible.length;

    threadPane = (
      <div className="flex flex-col h-full min-h-0">
        {/* Toolbar */}
        <div className="flex items-center px-1 py-1 border-b border-mail-line/10 shrink-0" style={safeTop}>
          <button onClick={back} aria-label="Back to the list" className={ICON_BTN}>{wide ? <X size={26} /> : <ChevronLeft size={30} />}</button>
          <div className="flex-1" />
          {inTrash || inSpam || inArchive || !isSystem(folder) ? (
            <button onClick={() => afterLeave("restore")} aria-label="Move to Inbox" title="Move to Inbox" className={ICON_BTN}><ArchiveRestore size={23} /></button>
          ) : folder !== "sent" && folder !== "drafts" ? (
            <button onClick={() => afterLeave("archive")} aria-label="Archive" title="Archive" className={ICON_BTN}><Archive size={23} /></button>
          ) : null}
          <button onClick={() => afterLeave(inTrash ? "delete" : "trash")} aria-label={inTrash ? "Delete forever" : "Move to Trash"} title={inTrash ? "Delete forever" : "Trash"} className={cn(ICON_BTN, "hover:text-mail-danger")}><Trash2 size={23} /></button>
          <button onClick={() => afterLeave("mark_unread")} aria-label="Mark unread" title="Mark unread" className={ICON_BTN}><Mail size={23} /></button>
          <button onClick={() => threadAction(t.starred ? "unstar" : "star")} aria-label={t.starred ? "Unstar" : "Star"} className={ICON_BTN}>
            <Star size={23} className={t.starred ? "fill-mail-gold text-mail-gold" : ""} />
          </button>
          <button onClick={() => setThreadMenu(true)} aria-label="More actions" className={ICON_BTN}><MoreVertical size={23} /></button>
        </div>

        <div ref={scrollerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-[24px] font-bold text-mail-text leading-snug break-words">{t.subject || (loadingThread ? "" : "(no subject)")}</h1>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[14px] font-semibold text-mail-sub bg-mail-line/[0.06] border border-mail-line/15 rounded-md px-2 py-0.5">{folderLabel(folder)}</span>
              {acct ? (
                <span className="flex items-center gap-1.5 text-[14px] font-semibold text-mail-sub bg-mail-line/[0.06] border border-mail-line/15 rounded-md px-2 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acct.color }} /> {acct.email}
                </span>
              ) : mailboxOf(t) ? <span className="text-[14px] text-mail-muted">{mailboxOf(t)}</span> : null}
              {t.customer_name && <span className="flex items-center gap-1 text-[14px] font-semibold text-mail-gold"><UserRound size={15} /> Customer</span>}
            </div>
          </div>

          {threadError && (
            <div className="mx-4 mb-2 flex items-center gap-2 text-[16px] text-mail-warn">
              <span className="flex-1">{messages.length ? "Could not refresh. Showing the saved copy." : threadError}</span>
              <button onClick={() => openThread(t)} className="min-h-[44px] px-3 font-bold text-mail-gold">Retry</button>
            </div>
          )}

          <div className="px-2.5 sm:px-3 pb-8 space-y-3">
            {loadingThread && !messages.length ? (
              <div className="flex justify-center py-16"><Loader2 size={28} className="text-mail-gold animate-spin" /></div>
            ) : (
              <>
                {visible.map((msg) => {
                  const open = expanded.has(msg.id);
                  const hasQuote = hasQuoted(msg);
                  const showQuote = quotesShown.has(msg.id);
                  const who = msg.from_email;
                  const out = msg.direction === "outbound";
                  const name = out ? (accountName(who) || senderLabel(who)) : (t.customer_name && who.toLowerCase() === party ? t.customer_name : senderLabel(who));
                  return (
                    <div key={msg.id} className="bg-mail-panel border border-mail-line/10 rounded-2xl" data-message={msg.id}>
                      <div role="button" tabIndex={0} onClick={() => toggleIn(setExpanded, msg.id)} onKeyDown={(e) => e.key === "Enter" && toggleIn(setExpanded, msg.id)}
                        className="flex items-center gap-3 px-3.5 py-3 min-h-[64px] cursor-pointer select-none">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[17px] font-bold shrink-0" style={{ backgroundColor: avatarColor(who) + "33", color: avatarColor(who) }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={cn("text-[18px] truncate", open ? "font-bold text-mail-text" : "font-semibold text-mail-sub")}>{out ? `${name} (you)` : name}</span>
                            <span className="ml-auto text-[15px] text-mail-muted shrink-0">{fmtWhen(msg.created_at)}</span>
                          </div>
                          {open ? (
                            <button onClick={(e) => { e.stopPropagation(); toggleIn(setDetails, msg.id); }} className="flex items-center gap-1 text-[15px] text-mail-muted max-w-full min-h-[32px]">
                              <span className="truncate">to {msg.to_email}{(msg.cc_emails || []).length ? ` +${(msg.cc_emails || []).length}` : ""}</span><ChevronDown size={16} className={cn("shrink-0 transition-transform", details.has(msg.id) && "rotate-180")} />
                            </button>
                          ) : (
                            <p className="text-[16px] text-mail-muted truncate">{snippet(msg) || "(no content)"}</p>
                          )}
                        </div>
                        {open && !msg.is_draft && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); startCompose("reply", msg); }} aria-label="Reply to this message" className={ICON_BTN}><Reply size={22} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setMsgMenu(msg); }} aria-label="Message options" className={cn(ICON_BTN, "-mr-1.5")}><MoreVertical size={22} /></button>
                          </>
                        )}
                      </div>
                      {open && details.has(msg.id) && (
                        <div className="mx-3.5 mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[15px] rounded-xl bg-mail-line/[0.05] border border-mail-line/10 p-3">
                          <span className="text-mail-muted">From</span><span className="text-mail-text break-all">{msg.from_email}</span>
                          <span className="text-mail-muted">To</span><span className="text-mail-text break-all">{msg.to_email}</span>
                          {(msg.cc_emails || []).length > 0 && <><span className="text-mail-muted">Cc</span><span className="text-mail-text break-all">{(msg.cc_emails || []).join(", ")}</span></>}
                          <span className="text-mail-muted">Date</span><span className="text-mail-text">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                      )}
                      {open && (
                        <div className="px-1.5 pb-3">
                          {msg.body_html ? (
                            <div className="rounded-xl overflow-hidden"><EmailBody html={msg.body_html} dark={!light} original={originalColors.has(msg.id)} hideQuotes={!showQuote} /></div>
                          ) : (
                            <pre className="px-2.5 py-1 text-[18px] text-mail-text whitespace-pre-wrap break-words font-body leading-relaxed"><Linkified text={(showQuote ? msg.body_text : stripQuotedText(msg.body_text || "")) || "(no content)"} /></pre>
                          )}
                          {hasQuote && (
                            <button onClick={() => toggleIn(setQuotesShown, msg.id)} aria-label={showQuote ? "Hide the earlier emails quoted here" : "Show the earlier emails quoted here"}
                              className="mt-1.5 ml-1 min-h-[40px] px-4 rounded-full bg-mail-line/[0.06] border border-mail-line/15 text-mail-sub text-[15px] font-semibold">{showQuote ? "Hide quoted text" : "••• Show quoted text"}</button>
                          )}
                          {msg.attachments?.length > 0 && (
                            <div className="mt-2.5 px-1">
                              <p className="text-[15px] font-medium text-mail-muted mb-1.5 flex items-center gap-1.5"><Paperclip size={15} /> {msg.attachments.length} attachment{msg.attachments.length > 1 ? "s" : ""}</p>
                              <div className="flex flex-wrap gap-2">
                                {msg.attachments.map((att) => att.content_type?.startsWith("image/") && att.s3_url ? (
                                  <a key={att.id} href={att.s3_url} target="_blank" rel="noopener noreferrer" className="block w-[31%] min-w-[110px] rounded-xl overflow-hidden border border-mail-line/15 bg-mail-line/[0.05]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={att.s3_url} alt={att.filename} className="w-full h-28 object-cover" loading="lazy" />
                                    <span className="block px-2 py-1.5 text-[14px] text-mail-sub truncate">{att.filename}</span>
                                  </a>
                                ) : (
                                  <span key={att.id} className="flex items-center bg-mail-line/[0.05] border border-mail-line/15 rounded-xl text-[15px] text-mail-gold overflow-hidden">
                                    <a href={att.s3_url || undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 min-h-[48px] max-w-[240px]">
                                      <FileText size={17} className="shrink-0" /> <span className="truncate">{att.filename}</span>
                                      {att.size_bytes > 0 && <span className="text-mail-muted shrink-0">{fmtSize(att.size_bytes)}</span>}
                                    </a>
                                    <a href={att.s3_url || undefined} download={att.filename} aria-label={`Download ${att.filename}`} className="w-12 min-h-[48px] flex items-center justify-center border-l border-mail-line/15 text-mail-muted hover:text-mail-gold"><Download size={18} /></a>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {out && !msg.is_draft && <EmailTracking events={msg.tracking} />}
                        </div>
                      )}
                    </div>
                  );
                })}
                {hidden > 0 && (
                  <button onClick={() => setShowAllMsgs(true)} className="w-full flex items-center gap-3 py-2">
                    <span className="flex-1 h-px bg-mail-line/15" />
                    <span className="min-h-[44px] flex items-center px-4 rounded-full bg-mail-line/[0.06] border border-mail-line/15 text-[16px] font-semibold text-mail-sub">{hidden} earlier message{hidden === 1 ? "" : "s"}</span>
                    <span className="flex-1 h-px bg-mail-line/15" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reply bar */}
        <div className="flex items-center gap-2 px-3 pt-2.5 border-t border-mail-line/10 shrink-0" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}>
          {draftMsg ? (
            <button onClick={() => startCompose("new", draftMsg)} className="flex-1 flex items-center justify-center gap-2 min-h-[52px] bg-mail-gold text-mail-ink rounded-full text-[17px] font-bold">
              <Pencil size={19} /> Finish and send this draft
            </button>
          ) : (
            <>
              <button onClick={() => replyTarget && startCompose("reply", replyTarget)} disabled={!replyTarget}
                className="flex-1 flex items-center justify-center gap-2 min-h-[52px] bg-mail-gold text-mail-ink rounded-full text-[17px] font-bold disabled:opacity-40">
                <Reply size={20} /> Reply
              </button>
              {canReplyAll && (
                <button onClick={() => replyTarget && startCompose("replyAll", replyTarget)}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[52px] bg-mail-line/[0.06] border border-mail-line/20 rounded-full text-[17px] font-semibold text-mail-text">
                  <ReplyAll size={20} /> Reply all
                </button>
              )}
              <button onClick={() => lastMessage && startCompose("forward", lastMessage)} disabled={!lastMessage}
                className="flex-1 flex items-center justify-center gap-2 min-h-[52px] bg-mail-line/[0.06] border border-mail-line/20 rounded-full text-[17px] font-semibold text-mail-text disabled:opacity-40">
                <Forward size={20} /> Forward
              </button>
            </>
          )}
        </div>

        {threadMenu && (
          <ActionSheet title={t.subject} onClose={() => setThreadMenu(false)} items={[
            ...(inTrash || inSpam || inArchive || !isSystem(folder) ? [{ icon: ArchiveRestore, label: "Move to Inbox", onClick: () => afterLeave("restore") }] : []),
            ...(!inArchive && folder !== "sent" && folder !== "drafts" ? [{ icon: Archive, label: "Archive", onClick: () => afterLeave("archive") }] : []),
            ...(folder !== "sent" && folder !== "drafts" ? [{ icon: FolderInput, label: "Move to…", onClick: () => setMovePick({ ids: [t.thread_id], after: back }) }] : []),
            { icon: Mail, label: "Mark as unread", onClick: () => afterLeave("mark_unread") },
            ...(folder !== "sent" && party && !party.endsWith("@" + OWN_DOMAIN) ? [
              { icon: ListFilter, label: `Always file ${partyName(t)} in…`, onClick: () => setFilePick(party) },
              { icon: Search, label: `All mail from ${partyName(t)}`, hint: String(countFrom(party)), onClick: () => { setSearch(party); back(); } },
              ...(!inSpam ? [{ icon: ShieldAlert, label: "Mark as spam", onClick: () => afterLeave("spam") }] : []),
              { icon: Trash2, label: `Trash all from ${partyName(t)}`, onClick: () => confirmTrashFrom(party, back) },
              { icon: ShieldAlert, label: `Block ${party}`, onClick: () => confirmBlock(party, back) },
              ...(domainOf(party).length > 1 ? [{ icon: ShieldAlert, label: `Block everything from ${domainOf(party)}`, onClick: () => confirmBlock(domainOf(party), back) }] : []),
            ] : []),
            { icon: light ? Moon : Sun, label: light ? "Dark mode" : "Light mode", onClick: toggleTheme },
            ...(inTrash ? [{ icon: Trash2, label: "Delete forever", onClick: () => afterLeave("delete"), danger: true }] : [{ icon: Trash2, label: "Move to Trash", onClick: () => afterLeave("trash"), danger: true }]),
          ]} />
        )}
        {msgMenu && (
          <ActionSheet title={`${senderLabel(msgMenu.from_email)} · ${fmtWhen(msgMenu.created_at, true)}`} onClose={() => setMsgMenu(null)} items={[
            { icon: Reply, label: "Reply", onClick: () => startCompose("reply", msgMenu) },
            ...((msgMenu.cc_emails || []).length ? [{ icon: ReplyAll, label: "Reply all", onClick: () => startCompose("replyAll", msgMenu) }] : []),
            { icon: Forward, label: "Forward", onClick: () => startCompose("forward", msgMenu) },
            ...(msgMenu.body_html && !light ? [{ icon: Palette, label: originalColors.has(msgMenu.id) ? "Match dark mode" : "Show original colors", onClick: () => toggleIn(setOriginalColors, msgMenu.id) }] : []),
            { icon: Info, label: details.has(msgMenu.id) ? "Hide details" : "Show details", onClick: () => toggleIn(setDetails, msgMenu.id) },
            { icon: Copy, label: "Copy sender address", hint: msgMenu.from_email.length > 26 ? undefined : msgMenu.from_email, onClick: () => copy(msgMenu.from_email) },
          ]} />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // LIST
  // ═══════════════════════════════════════════
  const allShownSelected = filtered.length > 0 && filtered.slice(0, shown).every((t) => selected.has(t.thread_id));
  const anyUnreadSelected = filtered.some((t) => selected.has(t.thread_id) && t.unread_count > 0);
  const anyUnstarredSelected = filtered.some((t) => selected.has(t.thread_id) && !t.starred);
  const inTrashL = folder === "trash", inSpamL = folder === "spam";
  const selSenders = folder === "sent" ? [] : Array.from(new Set(filtered.filter((t) => selected.has(t.thread_id)).map((t) => otherParty(t).toLowerCase()).filter((e) => e && !e.endsWith("@" + OWN_DOMAIN))));
  const selDomains = Array.from(new Set(selSenders.map(domainOf).filter((d) => d.length > 1)));
  const noAccess = (threadsQ.error || "").toLowerCase().includes("not authorized");

  const listPane = (
    <div className="flex flex-col h-full min-h-0">
      {selectMode ? (
        <div className="flex items-center px-1 py-1 bg-mail-panel border-b border-mail-line/10 shrink-0" style={safeTop}>
          <button onClick={() => setSelected(new Set())} aria-label="Cancel selection" className={ICON_BTN}><X size={26} /></button>
          <span className="flex-1 text-[19px] font-semibold text-mail-text">{selected.size} selected</span>
          {leftAction && <button onClick={() => bulk(leftAction)} aria-label={leftAction === "archive" ? "Archive" : "Trash"} className={ICON_BTN}>{leftAction === "archive" ? <Archive size={23} /> : <Trash2 size={23} />}</button>}
          <button onClick={() => bulk(anyUnreadSelected ? "mark_read" : "mark_unread")} aria-label={anyUnreadSelected ? "Mark read" : "Mark unread"} className={ICON_BTN}>
            {anyUnreadSelected ? <MailOpen size={23} /> : <Mail size={23} />}
          </button>
          <button onClick={() => bulk(anyUnstarredSelected ? "star" : "unstar")} aria-label="Star" className={ICON_BTN}><Star size={23} /></button>
          <button onClick={() => setSelMenu(true)} aria-label="More actions" className={ICON_BTN}><MoreVertical size={23} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-1.5 py-1.5 shrink-0" style={safeTop}>
          <button onClick={() => (wide ? setSidebarHidden((h) => !h) : setDrawerOpen(true))} aria-label="Menu: folders and mailboxes" className={ICON_BTN}><Menu size={27} /></button>
          {(!wide || sidebarHidden) && (
            <button onClick={goDashboard} aria-label="Back to Dashboard" title="Back to Dashboard"
              className="shrink-0 flex items-center gap-1 min-h-[48px] pl-1.5 pr-3 rounded-full text-[16px] font-semibold text-mail-sub hover:bg-mail-line/10">
              <ChevronLeft size={22} /> Dashboard
            </button>
          )}
          <div className="flex-1 min-w-0 flex items-center gap-2 pl-3.5 pr-1 min-h-[52px] bg-mail-panel rounded-full border border-mail-line/15">
            <Search size={20} className="text-mail-muted shrink-0" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mail" enterKeyHint="search" aria-label="Search mail"
              className="flex-1 min-w-0 w-full min-h-[44px] bg-transparent text-[17px] text-mail-text placeholder:text-mail-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search" className="w-11 h-11 flex items-center justify-center text-mail-muted"><X size={20} /></button>}
            <button onClick={() => goToView("accounts")} aria-label="Switch mailbox" title="Switch mailbox"
              className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
              style={activeAccount ? chipStyle(activeAccount.color) : { backgroundColor: "rgba(201,168,76,.2)", color: "#C9A84C" }}>
              {activeAccount ? activeAccount.initials : "All"}
            </button>
          </div>
        </div>
      )}

      {!selectMode && (
        <div className="flex items-center gap-2 pl-4 pr-1 min-h-[48px] shrink-0">
          <span className="text-[19px] font-bold text-mail-text">{folderLabel(folder)}</span>
          <span className="text-[15px] text-mail-muted truncate">{activeAccount ? activeAccount.email : "All mailboxes"}</span>
          {folder === "inbox" && (folderCounts.inbox || 0) > 0 && <span className="shrink-0 text-[14px] font-bold text-mail-ink bg-mail-gold rounded-full px-2.5 py-0.5">{folderCounts.inbox} new</span>}
          {hasDraft && <button onClick={() => startCompose("new")} className="shrink-0 min-h-[36px] text-[14px] font-bold text-mail-warn bg-mail-warn/15 rounded-full px-3">Unsent message</button>}
          {folder === "trash" && threads.length > 0 && <button onClick={emptyTrash} className="shrink-0 min-h-[36px] text-[14px] font-bold text-mail-danger bg-mail-danger/15 rounded-full px-3">Empty Trash</button>}
          <button onClick={() => fetchThreads()} aria-label="Refresh" className={cn(ICON_BTN, "ml-auto")}>
            <RefreshCw size={21} className={threadsQ.refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      )}
      {folder === "trash" && !selectMode && <p className="px-4 pb-1 text-[15px] text-mail-muted">Mail in Trash is deleted for good 30 days after it was put here.</p>}
      <RefreshBar refreshing={threadsQ.refreshing && threads.length > 0} error={threads.length ? threadsQ.error : null} savedAt={threadsQ.savedAt} onRetry={() => fetchThreads()} />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        onTouchStart={(e) => { pull.current = e.currentTarget.scrollTop <= 0 ? e.touches[0].clientY : null; }}
        onTouchMove={(e) => { if (pull.current === null) return; const dy = e.touches[0].clientY - pull.current; setPullPx(dy > 0 && e.currentTarget.scrollTop <= 0 ? Math.min(90, dy * 0.45) : 0); }}
        onTouchEnd={() => { if (pullPx >= 60) fetchThreads(); setPullPx(0); pull.current = null; }}>
        {pullPx > 0 && (
          <div className="flex items-center justify-center text-mail-gold overflow-hidden" style={{ height: pullPx }}>
            <RefreshCw size={24} style={{ transform: `rotate(${pullPx * 4}deg)`, opacity: Math.min(1, pullPx / 60) }} />
          </div>
        )}
        {loading && !threads.length ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="text-mail-gold animate-spin" /></div>
        ) : threadsQ.error && !threads.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-4">
            <Mail size={44} className="text-mail-muted" />
            <p className="text-mail-sub text-[17px]">{noAccess ? "Your login does not have access to the company mail." : "This mailbox could not be loaded."}</p>
            {!noAccess && <button onClick={() => fetchThreads()} className="min-h-[48px] px-6 rounded-full bg-mail-gold text-mail-ink text-[17px] font-bold">Try again</button>}
            <button onClick={goDashboard} className="min-h-[48px] px-6 rounded-full border border-mail-line/20 text-mail-text text-[17px] font-semibold">Back to Dashboard</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Mail size={44} className="text-mail-muted mb-4" />
            <p className="text-mail-sub text-[17px]">{search ? "Nothing matches your search." : folder === "inbox" ? "You're all caught up." : `Nothing in ${folderLabel(folder)}.`}</p>
          </div>
        ) : filtered.slice(0, shown).map((thread) => {
          const other = otherParty(thread);
          const name = partyName(thread);
          const unread = thread.unread_count > 0;
          const isSel = selected.has(thread.thread_id);
          const isOpen = wide && view === "thread" && selectedThread?.thread_id === thread.thread_id;
          const mailbox = (mailboxOf(thread) || "").toLowerCase();
          const acct = accountByEmail.get(mailbox);
          const color = avatarColor(other);
          return (
            <SwipeRow key={thread.thread_id} disabled={selectMode}
              leftLabel={leftAction === "trash" ? "Trash" : "Archive"} rightLabel={unread ? "Mark read" : "Mark unread"}
              onLeft={leftAction ? () => threadAction(leftAction, [thread.thread_id]) : undefined}
              onRight={() => threadAction(unread ? "mark_read" : "mark_unread", [thread.thread_id])}
              onLongPress={() => { if (navigator.vibrate) navigator.vibrate(10); toggleSelect(thread.thread_id); }}>
              <div role="button" tabIndex={0} data-thread={thread.thread_id}
                onClick={() => (selectMode ? toggleSelect(thread.thread_id) : openThread(thread))}
                onKeyDown={(e) => e.key === "Enter" && openThread(thread)}
                className={cn("w-full flex items-start gap-3 pl-3 pr-1 py-3.5 text-left cursor-pointer border-b border-mail-line/10 transition-colors active:bg-mail-line/[0.05]",
                  isSel ? "bg-mail-gold/15" : isOpen ? "bg-mail-gold/10" : unread && "bg-mail-gold/[0.05]")}>
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(thread.thread_id); }} aria-label={isSel ? "Deselect" : "Select"}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold shrink-0"
                  style={isSel ? undefined : { backgroundColor: color + "33", color }}>
                  {isSel ? <CheckCircle2 size={30} className="text-mail-gold" /> : selectMode ? <Circle size={30} className="text-mail-muted" /> : name.charAt(0).toUpperCase()}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {unread && <span className="w-2.5 h-2.5 rounded-full bg-mail-gold shrink-0" aria-label="Unread" />}
                    <span className={cn("text-[18px] truncate", unread ? "font-bold text-mail-text" : "font-semibold text-mail-sub")}>{folder === "sent" ? `To ${name}` : name}</span>
                    {thread.message_count > 1 && <span className="text-[15px] text-mail-muted shrink-0">{thread.message_count}</span>}
                    {thread.has_attachments && <Paperclip size={15} className="text-mail-muted shrink-0" />}
                    <span className="flex-1" />
                    <span className={cn("text-[15px] shrink-0", unread ? "text-mail-gold font-bold" : "text-mail-muted")}>{timeAgo(thread.latest_message)}</span>
                  </div>
                  <p className={cn("text-[17px] truncate mt-0.5", unread ? "font-semibold text-mail-text" : "text-mail-sub")}>{thread.subject || "(no subject)"}</p>
                  <p className="text-[16px] text-mail-muted truncate mt-0.5">
                    {!activeAccount && mailbox && (
                      <span className="inline-flex items-center gap-1.5 mr-2 font-semibold text-mail-sub">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acct?.color || "#C9A84C" }} />to {mailbox.split("@")[0]}@
                      </span>
                    )}
                    {cleanPreview(thread.latest_body_preview) || " "}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); threadAction(thread.starred ? "unstar" : "star", [thread.thread_id]); }} aria-label={thread.starred ? "Unstar" : "Star"} className="w-12 h-12 shrink-0 flex items-center justify-center">
                  <Star size={22} className={thread.starred ? "fill-mail-gold text-mail-gold" : "text-mail-muted/60"} />
                </button>
              </div>
            </SwipeRow>
          );
        })}
        {filtered.length > shown && <div ref={sentinel} className="py-5 text-center text-[15px] text-mail-muted">{filtered.length - shown} more…</div>}
        {!loading && filtered.length > 0 && filtered.length <= shown && <div className="py-6 text-center text-[15px] text-mail-muted">{filtered.length} conversation{filtered.length === 1 ? "" : "s"}{threads.length >= 500 ? " · showing the latest 500" : ""}</div>}
        <div className="h-24" />
      </div>

      {!selectMode && (
        <button onClick={() => startCompose("new")} aria-label="Write a new email"
          className={cn("absolute bottom-5 right-4 z-30 flex items-center gap-2 pl-5 pr-6 min-h-[58px] bg-mail-gold text-mail-ink rounded-2xl shadow-2xl font-bold text-[18px]")}
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <Pencil size={21} /> Compose
        </button>
      )}

      {selMenu && (
        <ActionSheet title={`${selected.size} selected`} onClose={() => setSelMenu(false)} items={[
          { icon: CheckCircle2, label: allShownSelected ? "Clear selection" : "Select all", onClick: () => setSelected(allShownSelected ? new Set() : new Set(filtered.slice(0, shown).map((t) => t.thread_id))) },
          ...(folder !== "sent" && folder !== "drafts" ? [{ icon: FolderInput, label: "Move to…", onClick: () => setMovePick({ ids: Array.from(selected) }) }] : []),
          ...(inTrashL || inSpamL || folder === "archive" || !isSystem(folder) ? [{ icon: ArchiveRestore, label: "Move to Inbox", onClick: () => bulk("restore") }] : []),
          ...(selSenders.length ? [
            { icon: CheckCircle2, label: selSenders.length === 1 ? `Select all from ${selSenders[0]}` : `Select all from these ${selSenders.length} senders`, hint: String(filtered.filter((t) => selSenders.some((p) => fromMatches(t, p))).length), onClick: () => selectFrom(selSenders) },
            ...(selDomains.length ? [{ icon: CheckCircle2, label: selDomains.length === 1 ? `Select all from ${selDomains[0]}` : `Select all from these ${selDomains.length} companies`, hint: String(filtered.filter((t) => selDomains.some((p) => fromMatches(t, p))).length), onClick: () => selectFrom(selDomains) }] : []),
            ...(selSenders.length === 1 ? [
              { icon: Search, label: `Show only ${selSenders[0]}`, onClick: () => { setSearch(selSenders[0]); setSelected(new Set()); } },
              { icon: ListFilter, label: `Always file ${selSenders[0]} in…`, onClick: () => setFilePick(selSenders[0]) },
            ] : []),
            { icon: ShieldAlert, label: selSenders.length === 1 ? `Block ${selSenders[0]}` : `Block these ${selSenders.length} senders`, onClick: () => (selSenders.length === 1 ? confirmBlock(selSenders[0]) : setConfirmSheet({ title: `Block ${selSenders.length} senders? Their mail moves to Spam now and in future.`, label: `Block ${selSenders.length} senders`, onConfirm: () => selSenders.forEach((p) => blockSender(p)) })) },
          ] : []),
          ...(!inSpamL ? [{ icon: ShieldAlert, label: "Mark as spam", onClick: () => bulk("spam") }] : []),
          ...(inTrashL ? [{ icon: Trash2, label: "Delete forever", onClick: () => bulk("delete"), danger: true }] : [{ icon: Trash2, label: "Move to Trash", onClick: () => bulk("trash"), danger: true }]),
        ]} />
      )}
    </div>
  );

  // ═══════════════════════════════════════════
  // LAYOUT: phone = one view at a time; computer = side bar | list | open item
  // ═══════════════════════════════════════════
  const detail = accountsPane || rulesPane || composePane || threadPane;
  return (
    <div className={cn("ro-mail ro-mail-backdrop fixed inset-0 z-[60] flex text-mail-text", light && "ro-mail-light")}>
      {wide ? (
        <>
          {!sidebarHidden && <aside className="w-[290px] shrink-0 border-r border-mail-line/10 bg-mail-panel/60 h-full">{navEl}</aside>}
          <section className="relative w-[440px] xl:w-[500px] shrink-0 border-r border-mail-line/10 h-full">{listPane}</section>
          <main className="relative flex-1 min-w-0 h-full">
            {detail || (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
                <Mail size={52} className="text-mail-gold/70" />
                <p className="text-[19px] text-mail-sub">Pick a conversation to read it here.</p>
                <button onClick={goDashboard} className="mt-2 min-h-[48px] px-6 rounded-full border border-mail-line/20 text-[17px] font-semibold text-mail-text flex items-center gap-2"><LayoutDashboard size={20} /> Back to Dashboard</button>
              </div>
            )}
          </main>
        </>
      ) : (
        <div className="relative flex-1 min-w-0 h-full">{view === "list" || !detail ? listPane : detail}</div>
      )}
      {drawerEl}
      {sheetsEl}
      {toastEl}
    </div>
  );
}
