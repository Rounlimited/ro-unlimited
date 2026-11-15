// Admin inbox: list threads (slim), open one conversation (POST), mutate (PATCH), permanent delete (DELETE).
import { NextRequest, NextResponse } from 'next/server';
import { trackingFor } from '@/lib/email-tracking';
import { createAdminClient } from '@/lib/supabase/server';
import { requireEmailAccess } from '@/lib/email-auth';
import { SYSTEM_FOLDERS } from '@/lib/email-rules';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Kept fast on a phone: ONE slim query (no message bodies, paged past Supabase's 1000-row cap) builds the
// thread list AND the folder counts; plain-text previews are fetched only for the newest threads shown.
const LIST_COLS = 'id, thread_id, lead_id, subject, to_email, from_email, direction, read, starred, folder, is_draft, has_attachments, created_at';
const PREVIEW_THREADS = 200;
const MAX_THREADS = 500;

type Row = {
  id: string; thread_id: string; lead_id: string | null; subject: string; to_email: string; from_email: string;
  direction: string; read: boolean; starred: boolean; folder: string; is_draft: boolean; has_attachments: boolean; created_at: string;
};

const lc = (s: string | null | undefined) => (s || '').toLowerCase();
const noStore = { 'Cache-Control': 'private, no-store' };

function inFolder(m: Row, folder: string) {
  if (folder === 'trash') return m.folder === 'trash';
  if (folder === 'drafts') return m.is_draft && m.folder !== 'trash';
  if (folder === 'starred') return m.starred && m.folder !== 'trash';
  if (folder === 'sent') return m.direction === 'outbound' && !m.is_draft && m.folder !== 'trash';
  if (folder === 'spam') return m.folder === 'spam';
  if (folder === 'archive') return !m.is_draft && m.folder === 'archive';
  // All mail: everything in the mailbox, whatever folder it is filed in (not Spam, Trash or unsent drafts)
  if (folder === 'all') return !m.is_draft && m.folder !== 'trash' && m.folder !== 'spam';
  // custom folder (Folders & filters): exactly the mail filed there
  if (!SYSTEM_FOLDERS.has(folder)) return !m.is_draft && m.folder === folder;
  // Inbox: received mail still in the inbox + our own sent replies (so a thread shows its latest reply)
  return !m.is_draft && (m.folder === 'inbox' || m.folder === 'sent');
}

export async function GET(req: NextRequest) {
  const auth = await requireEmailAccess();
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || 'inbox';
  const account = lc(searchParams.get('account')) || null; // null = all accounts
  const supabase = createAdminClient();

  try {
    // 1) every message, slim columns only, newest first
    const rows: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from('email_messages').select(LIST_COLS).order('created_at', { ascending: false }).range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...((data || []) as Row[]));
      if (!data || data.length < 1000) break;
    }

    // 2) folder counts (same rows, no second query). Inbox/custom = unread; the rest = totals.
    const folderCounts: Record<string, number> = { inbox: 0, all: 0, sent: 0, starred: 0, drafts: 0, trash: 0, spam: 0, archive: 0 };
    const mine = (m: Row) => !account || (m.direction === 'inbound' ? lc(m.to_email) === account : lc(m.from_email) === account);
    for (const m of rows) {
      if (!mine(m)) continue;
      if (m.is_draft && m.folder !== 'trash') folderCounts.drafts++;
      if (m.starred && m.folder !== 'trash') folderCounts.starred++;
      if (m.folder === 'trash') folderCounts.trash++;
      if (m.folder === 'spam' && !m.read) folderCounts.spam++;
      if (!m.read && m.folder === 'inbox' && !m.is_draft) folderCounts.inbox++;
      if (!m.read && !m.is_draft && m.direction === 'inbound' && m.folder !== 'trash' && m.folder !== 'spam') folderCounts.all++;
      if (!m.read && !m.is_draft && !SYSTEM_FOLDERS.has(m.folder)) folderCounts[m.folder] = (folderCounts[m.folder] || 0) + 1;
      if (m.direction === 'outbound' && !m.is_draft && m.folder !== 'trash') folderCounts.sent++;
    }

    // 3) group the shown folder into threads
    type ThreadAcc = {
      thread_id: string; subject: string; to_email: string; from_email: string; counterpart: string; account: string;
      latest_message: string; latest_message_id: string; latest_body_preview: string; latest_direction: string;
      message_count: number; unread_count: number; starred: boolean; has_attachments: boolean;
      lead_id: string | null; created_at: string; has_inbound: boolean; customer_name?: string;
    };
    const threadMap = new Map<string, ThreadAcc>();
    for (const msg of rows) {
      if (!inFolder(msg, folder)) continue;
      if (account) {
        const inbox = folder === 'inbox';
        const skip = inbox ? (msg.direction === 'inbound' ? lc(msg.to_email) !== account : lc(msg.from_email) !== account)
          : folder === 'sent' ? lc(msg.from_email) !== account
          : lc(msg.from_email) !== account && lc(msg.to_email) !== account;
        if (skip) continue;
      }
      if (!threadMap.has(msg.thread_id)) {
        const out = msg.direction === 'outbound';
        threadMap.set(msg.thread_id, {
          thread_id: msg.thread_id,
          subject: msg.subject,
          // legacy shape: to_email = the other party, from_email = our mailbox
          to_email: out ? msg.to_email : msg.from_email,
          from_email: out ? msg.from_email : msg.to_email,
          counterpart: lc(out ? msg.to_email : msg.from_email),
          account: lc(out ? msg.from_email : msg.to_email),
          latest_message: msg.created_at,
          latest_message_id: msg.id,
          latest_body_preview: '',
          latest_direction: msg.direction,
          message_count: 0, unread_count: 0,
          starred: !!msg.starred, has_attachments: !!msg.has_attachments,
          lead_id: msg.lead_id,
          created_at: msg.created_at,
          has_inbound: msg.direction === 'inbound',
        });
      }
      const t = threadMap.get(msg.thread_id)!;
      t.message_count++;
      if (!msg.read) t.unread_count++;
      if (msg.starred) t.starred = true;
      if (msg.has_attachments) t.has_attachments = true;
      if (msg.direction === 'inbound') t.has_inbound = true;
      if (!t.lead_id && msg.lead_id) t.lead_id = msg.lead_id;
    }
    // Inbox shows only threads with at least one received message
    if (folder === 'inbox') {
      for (const [id, t] of Array.from(threadMap.entries())) if (!t.has_inbound) threadMap.delete(id);
    }

    const threads = Array.from(threadMap.values())
      .sort((a, b) => new Date(b.latest_message).getTime() - new Date(a.latest_message).getTime())
      .slice(0, MAX_THREADS);

    // 4) previews: plain text of the latest message, only for the threads that will be shown first
    const ids = threads.slice(0, PREVIEW_THREADS).map((t) => t.latest_message_id);
    if (ids.length) {
      const preview = new Map<string, string>();
      const { data: texts } = await supabase.from('email_messages').select('id, body_text').in('id', ids);
      const needHtml: string[] = [];
      for (const r of texts || []) {
        if (r.body_text && String(r.body_text).trim()) preview.set(r.id as string, String(r.body_text).replace(/\s+/g, ' ').slice(0, 160));
        else needHtml.push(r.id as string);
      }
      if (needHtml.length) {
        const { data: htmls } = await supabase.from('email_messages').select('id, body_html').in('id', needHtml);
        for (const r of htmls || []) {
          const plain = String(r.body_html || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
          preview.set(r.id as string, plain.slice(0, 160));
        }
      }
      for (const t of threads) t.latest_body_preview = preview.get(t.latest_message_id) || '';
    }

    // 5) names: a customer record with that address, then an address-book contact
    const emails = Array.from(new Set(threads.map((t) => t.counterpart).filter(Boolean)));
    if (emails.length) {
      const [{ data: customers }, { data: contacts }] = await Promise.all([
        supabase.from('customers').select('first_name, last_name, company_name, email').not('email', 'is', null),
        supabase.from('email_contacts').select('name, email').in('email', emails),
      ]);
      const names = new Map<string, string>();
      for (const c of contacts || []) if (c.name) names.set(lc(c.email), c.name);
      for (const c of customers || []) {
        const n = [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.company_name;
        if (n && c.email) names.set(lc(c.email), n);
      }
      for (const t of threads) if (names.has(t.counterpart)) t.customer_name = names.get(t.counterpart);
    }

    return NextResponse.json({ threads, folderCounts }, { headers: noStore });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Could not load mail' }, { status: 500, headers: noStore });
  }
}

// ── POST: open one conversation (marks it read) with attachments + open/click tracking per sent message ──
export async function POST(req: NextRequest) {
  const auth = await requireEmailAccess();
  if (!auth.ok) return auth.res;
  const supabase = createAdminClient();
  const { thread_id, account: rawAccount } = await req.json().catch(() => ({}));
  if (!thread_id) return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 });
  const account = lc(rawAccount) || null;

  const { data: all, error } = await supabase
    .from('email_messages').select('*').eq('thread_id', thread_id).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = account ? (all || []).filter((m) => lc(m.from_email) === account || lc(m.to_email) === account) : (all || []);
  const unreadIds = messages.filter((m) => !m.read).map((m) => m.id);
  if (unreadIds.length) await supabase.from('email_messages').update({ read: true }).in('id', unreadIds);

  const messageIds = messages.map((m) => m.id);
  const { data: attachments } = messageIds.length
    ? await supabase.from('email_attachments').select('*').in('message_id', messageIds)
    : { data: [] as Record<string, unknown>[] };
  const attMap = new Map<string, Record<string, unknown>[]>();
  for (const att of attachments || []) {
    const k = att.message_id as string;
    if (!attMap.has(k)) attMap.set(k, []);
    attMap.get(k)!.push(att);
  }
  const tracked = await trackingFor(messages.filter((m) => m.direction === 'outbound' && m.track_token).map((m) => m.id));
  const out = messages.map((m) => ({
    ...m, read: true,
    attachments: attMap.get(m.id) || [],
    tracking: m.track_token ? (tracked[m.id] || []) : null,
  }));
  return NextResponse.json({ messages: out }, { headers: noStore });
}

// ── PATCH: star/trash/read/move/archive actions (+ clean-up by sender) ──
export async function PATCH(req: NextRequest) {
  const auth = await requireEmailAccess();
  if (!auth.ok) return auth.res;
  const supabase = createAdminClient();
  const { thread_ids, action, value, account: rawAccount } = await req.json().catch(() => ({}));
  const account = lc(rawAccount) || null;
  const now = new Date().toISOString();

  // Clean-up by sender: every received message from "user@domain" (or "@domain") → Trash / Spam
  if (action === 'trash_from' || action === 'spam_from') {
    const v = lc(String(value || '').trim());
    if (!v.includes('@')) return NextResponse.json({ error: 'Missing sender' }, { status: 400 });
    let q = supabase.from('email_messages').update({ folder: action === 'trash_from' ? 'trash' : 'spam', updated_at: now })
      .eq('direction', 'inbound').neq('folder', 'trash');
    q = v.startsWith('@') ? q.or(`from_email.ilike.%${v},from_email.ilike.%.${v.slice(1)}`) : q.ilike('from_email', v);
    if (account) q = q.ilike('to_email', account);
    const { data, error } = await q.select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: data?.length || 0 });
  }

  if (!Array.isArray(thread_ids) || !thread_ids.length || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const updateMap: Record<string, Record<string, unknown>> = {
    star: { starred: true }, unstar: { starred: false },
    trash: { folder: 'trash', updated_at: now }, spam: { folder: 'spam', updated_at: now }, archive: { folder: 'archive', updated_at: now },
    mark_read: { read: true }, mark_unread: { read: false },
  };
  const target = action === 'move' ? String(value || '') : '';
  if (action === 'move' && !/^[a-z0-9][a-z0-9-]{0,40}$/.test(target)) return NextResponse.json({ error: 'Bad folder' }, { status: 400 });
  const update = action === 'move' ? { folder: target, updated_at: now } : updateMap[action];
  if (!update && action !== 'restore') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const { data: msgs } = await supabase
    .from('email_messages').select('id, from_email, to_email, direction, is_draft, read').in('thread_id', thread_ids);
  const mine = (msgs || []).filter((m) => !account || lc(m.from_email) === account || lc(m.to_email) === account);
  if (action === 'restore') {
    // out of Trash/Spam/Archive/a folder: received mail goes back to the Inbox, our own mail back to Sent/Drafts
    const inbound = mine.filter((m) => m.direction !== 'outbound').map((m) => m.id);
    const outbound = mine.filter((m) => m.direction === 'outbound' && !m.is_draft).map((m) => m.id);
    const drafts = mine.filter((m) => m.direction === 'outbound' && m.is_draft).map((m) => m.id);
    if (inbound.length) await supabase.from('email_messages').update({ folder: 'inbox', updated_at: now }).in('id', inbound);
    if (outbound.length) await supabase.from('email_messages').update({ folder: 'sent', updated_at: now }).in('id', outbound);
    if (drafts.length) await supabase.from('email_messages').update({ folder: 'drafts', updated_at: now }).in('id', drafts);
  } else {
    // moving / archiving only files the received mail; our own replies stay in Sent
    const ids = (action === 'move' || action === 'archive' ? mine.filter((m) => m.direction !== 'outbound') : mine).map((m) => m.id);
    if (ids.length) {
      const { error } = await supabase.from('email_messages').update(update).in('id', ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ updated: thread_ids.length });
}

// ── DELETE: permanent (thread_ids, only for mail already in Trash or Spam) or empty the Trash ──
export async function DELETE(req: NextRequest) {
  const auth = await requireEmailAccess();
  if (!auth.ok) return auth.res;
  const supabase = createAdminClient();
  const { thread_ids, empty_trash, account: rawAccount } = await req.json().catch(() => ({}));
  const account = lc(rawAccount) || null;

  let rows: { id: string; from_email: string; to_email: string; folder: string; is_draft: boolean }[] = [];
  if (empty_trash) {
    const { data } = await supabase.from('email_messages').select('id, from_email, to_email, folder, is_draft').eq('folder', 'trash');
    rows = data || [];
  } else {
    if (!Array.isArray(thread_ids) || !thread_ids.length) return NextResponse.json({ error: 'No thread_ids' }, { status: 400 });
    const { data } = await supabase.from('email_messages').select('id, from_email, to_email, folder, is_draft').in('thread_id', thread_ids);
    // forever-delete is only offered in Trash / Spam (and for drafts); never wipe live mail by accident
    rows = (data || []).filter((m) => m.folder === 'trash' || m.folder === 'spam' || m.is_draft);
  }
  const ids = rows.filter((m) => !account || lc(m.from_email) === account || lc(m.to_email) === account).map((m) => m.id);
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    await supabase.from('email_attachments').delete().in('message_id', chunk);
    const { error } = await supabase.from('email_messages').delete().in('id', chunk);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: ids.length });
}
