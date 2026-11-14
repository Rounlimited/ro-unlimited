import { createAdminClient } from '@/lib/supabase/server';

/**
 * Mail-client rules: blocked senders, custom folders and filters (sender / subject / words → folder).
 * Stored as one JSON row in `app_settings` (key 'email_rules'). A DB row, not Storage: the Storage CDN
 * served stale copies for up to an hour in the Den Chai build.
 *
 * Patterns: "user@domain" (exact) or "@domain" (that domain and any subdomain of it).
 * Filters run in list order; the first one that matches wins. Blocked senders always win (→ Spam).
 *
 * Folders belong to mailboxes: a folder with `accounts` only shows for, and only files mail received by,
 * those mailboxes (empty = every mailbox). site@ has its own folders, jr@ its own, and so on.
 *
 * Customer mail is never filed: a sender whose address is on a customer record always stays in the Inbox
 * (unless JR blocked that exact sender himself).
 */
const KEY = 'email_rules';

export const SYSTEM_FOLDERS = new Set(['inbox', 'sent', 'drafts', 'starred', 'trash', 'spam', 'archive']);
/** targets a filter may use besides custom folders */
export const SYSTEM_TARGETS = new Set(['spam', 'archive']);

export type EmailFolderDef = { key: string; label: string; icon?: string; notify?: boolean; accounts?: string[] };
export type EmailRule = { id: string; folder: string; from?: string[]; subject?: string; body?: string; note?: string };
export type EmailRules = { blocked: string[]; folders: EmailFolderDef[]; rules: EmailRule[] };

type Admin = ReturnType<typeof createAdminClient>;

export const normalizePattern = (p: unknown) => String(p || '').trim().toLowerCase();

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'folder';

export const newId = () => Math.random().toString(36).slice(2, 10);

/** "x@messaging.yelp.com" matches "@yelp.com" and "@messaging.yelp.com"; exact addresses match exactly. */
export function patternMatches(pattern: string, email: string): boolean {
  const p = normalizePattern(pattern), e = normalizePattern(email);
  if (!p || !e) return false;
  if (p.startsWith('@')) return e.endsWith(p) || e.endsWith('.' + p.slice(1));
  return e === p;
}

function textMatches(pattern: string | undefined, text: string): boolean {
  if (!pattern) return true;
  try { return new RegExp(pattern, 'i').test(text || ''); }
  catch { return (text || '').toLowerCase().includes(pattern.toLowerCase()); }
}

/** body === undefined means "body not loaded": a filter that needs words in the email then does not match. */
export function ruleMatches(rule: EmailRule, fromEmail: string, subject: string, body?: string): boolean {
  const froms = (rule.from || []).filter(Boolean);
  if (!froms.length && !rule.subject && !rule.body) return false; // an empty filter never matches
  if (froms.length && !froms.some((p) => patternMatches(p, fromEmail))) return false;
  if (!textMatches(rule.subject, subject)) return false;
  if (rule.body) return body !== undefined && textMatches(rule.body, body);
  return true;
}

/** sender + subject part of a filter passes (used to decide whose body must be loaded) */
function headMatches(rule: EmailRule, fromEmail: string, subject: string): boolean {
  const froms = (rule.from || []).filter(Boolean);
  if (froms.length && !froms.some((p) => patternMatches(p, fromEmail))) return false;
  return textMatches(rule.subject, subject);
}

function clean(j: Partial<EmailRules> | null | undefined): EmailRules {
  const folders = Array.isArray(j?.folders)
    ? j!.folders.filter((f) => f && f.key && f.label).map((f) => ({
        key: slugify(String(f.key)), label: String(f.label).trim().slice(0, 40),
        ...(f.icon ? { icon: String(f.icon) } : {}), ...(f.notify ? { notify: true } : {}),
        ...(Array.isArray(f.accounts) && f.accounts.length ? { accounts: Array.from(new Set(f.accounts.map(normalizePattern).filter((a) => a.includes('@')))) } : {}),
      }))
    : [];
  const keys = new Set(folders.map((f) => f.key));
  const rules = Array.isArray(j?.rules)
    ? j!.rules.filter((r) => r && r.folder && (keys.has(r.folder) || SYSTEM_TARGETS.has(r.folder)))
        .map((r) => ({
          id: String(r.id || newId()),
          folder: String(r.folder),
          ...(Array.isArray(r.from) && r.from.length ? { from: r.from.map(normalizePattern).filter(Boolean) } : {}),
          ...(r.subject ? { subject: String(r.subject).slice(0, 1000) } : {}),
          ...(r.body ? { body: String(r.body).slice(0, 1000) } : {}),
          ...(r.note ? { note: String(r.note).slice(0, 120) } : {}),
        }))
    : [];
  const blocked = Array.isArray(j?.blocked) ? Array.from(new Set(j!.blocked.map(normalizePattern).filter(Boolean))) : [];
  return { blocked, folders, rules };
}

export async function getRules(supabase: Admin = createAdminClient()): Promise<EmailRules> {
  try {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', KEY).maybeSingle();
    if (error) throw new Error(error.message);
    return clean((data?.value as Partial<EmailRules>) || null);
  } catch {
    return clean(null);
  }
}

/** Saves and returns the cleaned rule set (callers answer with this object). */
export async function saveRules(rules: EmailRules, supabase: Admin = createAdminClient()): Promise<EmailRules> {
  const cleaned = clean(rules);
  const { error } = await supabase.from('app_settings').upsert({ key: KEY, value: cleaned, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  return cleaned;
}

export function isBlockedBy(rules: EmailRules, fromEmail: string): boolean {
  return rules.blocked.some((p) => patternMatches(p, fromEmail));
}

/** Every customer address on file (lower case). Customer mail always stays in the Inbox. */
export async function customerEmails(supabase: Admin = createAdminClient()): Promise<Set<string>> {
  const out = new Set<string>();
  try {
    const { data } = await supabase.from('customers').select('email').not('email', 'is', null).limit(5000);
    for (const c of data || []) { const e = normalizePattern(c.email); if (e.includes('@')) out.add(e); }
  } catch { /* table missing → no protection list, rules still run */ }
  return out;
}

/** Does this folder belong to the mailbox? (no `accounts` = every mailbox; unknown mailbox = yes) */
export function folderInAccount(f: EmailFolderDef | undefined, account?: string | null): boolean {
  if (!f || !f.accounts?.length || !account) return true;
  return f.accounts.includes(normalizePattern(account));
}

/** Where a message belongs by the rules: 'spam' | custom folder key | 'archive' | null (no rule matched).
 *  `account` = the mailbox that received it; filters whose folder belongs to other mailboxes are skipped. */
export function folderFor(rules: EmailRules, fromEmail: string, subject: string, body?: string, customers?: Set<string>, account?: string | null): string | null {
  const from = normalizePattern(fromEmail);
  // a blocked EXACT address always wins; a blocked domain never swallows a customer
  if (rules.blocked.some((p) => !p.startsWith('@') && p === from)) return 'spam';
  if (customers?.has(from)) return null;
  if (isBlockedBy(rules, from)) return 'spam';
  const byKey = new Map(rules.folders.map((f) => [f.key, f]));
  const hit = rules.rules.find((r) => (SYSTEM_TARGETS.has(r.folder) || folderInAccount(byKey.get(r.folder), account)) && ruleMatches(r, from, subject, body));
  return hit ? hit.folder : null;
}

/** For the inbound webhook: the folder the rules pick (null = Inbox) and whether to alert for it. */
export async function fileFolder(fromEmail: string, subject: string, body: string, account?: string | null): Promise<{ folder: string | null; notify: boolean }> {
  const supabase = createAdminClient();
  const [rules, customers] = await Promise.all([getRules(supabase), customerEmails(supabase)]);
  const folder = folderFor(rules, fromEmail, subject, body, customers, account);
  const notify = folder === null || folder === 'inbox' || !!rules.folders.find((f) => f.key === folder)?.notify;
  return { folder, notify };
}

export const plainBody = (text: string | null | undefined, html: string | null | undefined) =>
  (text || String(html || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')).replace(/\s+/g, ' ').slice(0, 20000);

type Row = { id: string; from_email: string; subject: string | null; folder: string; to_email: string };

export type ApplyPlan = { moved: number; byFolder: Record<string, number>; samples: Record<string, string[]> };

/**
 * Run the filters over mail already in the mailbox. Only received mail still in the Inbox (or a custom
 * folder) moves, and only INTO a folder: a message no filter matches stays where it is, Trash/Spam/Archive
 * are never touched. `onlyRule` limits the pass to one filter; `dryRun` reports without moving anything.
 */
export async function applyRules(
  supabase: Admin, rules: EmailRules, opts: { onlyRule?: string; account?: string; dryRun?: boolean } = {},
): Promise<ApplyPlan> {
  const active = opts.onlyRule ? { ...rules, rules: rules.rules.filter((r) => r.id === opts.onlyRule), blocked: [] } : rules;
  const customers = await customerEmails(supabase);
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = supabase.from('email_messages').select('id, from_email, subject, folder, to_email')
      .eq('direction', 'inbound').eq('is_draft', false).not('folder', 'in', '("trash","spam","archive","sent","drafts")')
      .order('created_at', { ascending: false }).range(from, from + 999);
    if (opts.account) q = q.ilike('to_email', opts.account);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < 1000) break;
  }

  // bodies only for messages a "words in the email" filter could still match
  const bodyRules = active.rules.filter((r) => r.body);
  const bodies = new Map<string, string>();
  if (bodyRules.length) {
    const need = rows.filter((r) => bodyRules.some((br) => headMatches(br, r.from_email, r.subject || ''))).map((r) => r.id);
    for (let i = 0; i < need.length; i += 100) {
      const { data } = await supabase.from('email_messages').select('id, body_text, body_html').in('id', need.slice(i, i + 100));
      for (const b of data || []) bodies.set(b.id as string, plainBody(b.body_text as string, b.body_html as string));
    }
  }

  const byTarget = new Map<string, Row[]>();
  for (const r of rows) {
    const target = folderFor(active, r.from_email, r.subject || '', bodies.get(r.id) ?? (bodyRules.length ? '' : undefined), customers, r.to_email);
    if (!target || target === 'inbox' || target === r.folder) continue;
    if (!byTarget.has(target)) byTarget.set(target, []);
    byTarget.get(target)!.push(r);
  }
  const byFolder: Record<string, number> = {};
  const samples: Record<string, string[]> = {};
  let moved = 0;
  for (const [target, list] of Array.from(byTarget.entries())) {
    byFolder[target] = list.length;
    samples[target] = list.slice(0, 50).map((r) => `${r.from_email} — ${(r.subject || '').slice(0, 70)}`);
    if (opts.dryRun) { moved += list.length; continue; }
    const ids = list.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { error } = await supabase.from('email_messages').update({ folder: target, updated_at: new Date().toISOString() }).in('id', chunk);
      if (error) throw new Error(error.message);
      moved += chunk.length;
    }
  }
  return { moved, byFolder, samples };
}
