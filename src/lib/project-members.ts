import crypto from 'crypto';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';

/**
 * People on this project — extra people the owner's Project Page is shared
 * with (spouse, architect, lender, property manager...). JR manages them in
 * Link Controls → People.
 *
 *  - Each person gets a PERSONAL link: /estimate/<token>, token starts "p-".
 *    Every customer API route resolves a token through resolveToken(), so a
 *    personal link works everywhere the owner's link does, and removing the
 *    person (revoked_at) kills only their link, instantly.
 *  - role 'viewer'   → sees the page, can ask questions / leave feedback.
 *    role 'approver' → can also approve or decline change orders, answer
 *                      requests (uploads) and pick options.
 *    Signing the contract is the owner's alone (never a member).
 *  - Activity is stamped with the person: document_events.meta.member_id,
 *    project_messages / job_feedback.member_id, customer_requests.
 *    submitted_member_id, change_orders.decided_member_id + decided_by.
 *  - Members can also sign in at /my with their email; their shared projects
 *    open through their personal token so the same rules apply.
 */
export type MemberRole = 'viewer' | 'approver';
export type Member = {
  id: string; estimate_id: string; name: string; email: string | null; phone: string | null; label: string | null;
  role: MemberRole; token: string; added_by: string | null; invited_at: string | null; first_seen_at: string | null;
  last_seen_at: string | null; view_count: number; revoked_at: string | null; created_at: string;
};
export type Viewer = { kind: 'owner' } | { kind: 'member'; id: string; name: string; label: string | null; role: MemberRole };

export const MEMBER_PREFIX = 'p-';
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com').replace(/\/$/, '');
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const norm = (e: string | null | undefined) => String(e || '').trim().toLowerCase();

export const memberLink = (m: { token: string }) => `${SITE()}/estimate/${m.token}`;
export const newMemberToken = () => MEMBER_PREFIX + crypto.randomBytes(12).toString('hex');
export const viewerOf = (m: Member | null): Viewer => (m ? { kind: 'member', id: m.id, name: m.name, label: m.label, role: m.role } : { kind: 'owner' });
/** Who may approve change orders, answer requests, pick options. */
export const canAct = (m: Member | null) => !m || m.role === 'approver';
/** Short "who did it" string for logs, alerts and records. */
export const whoLabel = (m: Member | null, fallback = 'Customer') => (m ? `${m.name}${m.label ? ' (' + m.label + ')' : ''}` : fallback);

/**
 * Map whatever token is in the URL to the project's share token.
 * Owner links pass straight through. A personal link maps to its project —
 * or to a token that matches nothing when the person was removed.
 */
export async function resolveToken(raw: string): Promise<{ token: string; member: Member | null }> {
  const t = String(raw || '');
  if (!t.startsWith(MEMBER_PREFIX)) return { token: t, member: null };
  const supabase = createAdminClient();
  const { data: m } = await supabase.from('project_members').select('*').eq('token', t).is('revoked_at', null).maybeSingle();
  if (!m) return { token: '__no_such_link__', member: null };
  const { data: est } = await supabase.from('estimates').select('share_token').eq('id', m.estimate_id).maybeSingle();
  if (!est || !est.share_token) return { token: '__no_such_link__', member: null };
  return { token: est.share_token, member: m as Member };
}

/** Called on a page view through a personal link. First view alerts RO once. */
export async function touchMember(m: Member, project: { id: string; project_name?: string | null; estimate_number?: string }) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const first = !m.first_seen_at;
  await supabase.from('project_members').update({ last_seen_at: now, view_count: (m.view_count || 0) + 1, ...(first ? { first_seen_at: now } : {}) }).eq('id', m.id);
  if (first) {
    try {
      const { notifyTeam } = await import('@/lib/alerts');
      await notifyTeam({ type: 'member_first_view', title: `${whoLabel(m)} opened the Project Page — ${project.project_name || project.estimate_number || ''}`.trim(), body: m.role === 'approver' ? 'They can approve changes.' : 'View only.', url: `/admin/estimates/${project.id}`, reference_id: project.id, tag: `member-${m.id}` } as any);
    } catch { /* alert is best-effort */ }
  }
}

export async function ensureShareToken(estimateId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: est } = await supabase.from('estimates').select('share_token').eq('id', estimateId).maybeSingle();
  if (!est) return null;
  if (est.share_token) return est.share_token;
  const token = crypto.randomBytes(16).toString('hex');
  await supabase.from('estimates').update({ share_token: token }).eq('id', estimateId);
  return token;
}

export type MemberActivity = { at: string; what: string };
export type MemberRow = Member & { link: string; activity: MemberActivity[] };

/** Everyone on the project (removed people last), each with their recent activity. */
export async function listMembers(estimateId: string): Promise<MemberRow[]> {
  const supabase = createAdminClient();
  const { data: members } = await supabase.from('project_members').select('*').eq('estimate_id', estimateId).order('created_at', { ascending: true });
  const list = (members || []) as Member[];
  if (!list.length) return [];
  const ids = list.map((m) => m.id);
  const [ev, msgs, fb, reqs, cos] = await Promise.all([
    supabase.from('document_events').select('event, created_at, meta, device_type, os').eq('doc_id', estimateId).not('meta->>member_id', 'is', null).order('created_at', { ascending: false }).limit(300),
    supabase.from('project_messages').select('member_id, created_at, body').eq('estimate_id', estimateId).in('member_id', ids),
    supabase.from('job_feedback').select('member_id, created_at, kind, rating').eq('estimate_id', estimateId).in('member_id', ids),
    supabase.from('customer_requests').select('submitted_member_id, submitted_at, title').eq('estimate_id', estimateId).in('submitted_member_id', ids),
    supabase.from('change_orders').select('decided_member_id, approved_at, declined_at, status, title').eq('estimate_id', estimateId).in('decided_member_id', ids),
  ]);
  const by = new Map<string, MemberActivity[]>(); const push = (id: string, a: MemberActivity) => { const l = by.get(id) || []; l.push(a); by.set(id, l); };
  const device = (e: any) => (e.device_type === 'Phone' ? (e.os === 'iOS' ? 'iPhone' : e.os === 'Android' ? 'Android phone' : 'phone') : String(e.device_type || '').toLowerCase());
  for (const e of ev.data || []) {
    const id = e.meta && e.meta.member_id; if (!id) continue;
    const what = e.event === 'link_view' ? `Opened the page${device(e) ? ' on ' + device(e) : ''}` : e.event === 'pdf_download' || e.event === 'pdf_view' ? 'Downloaded the PDF' : e.event === 'time_on_page' ? '' : '';
    if (what) push(id, { at: e.created_at, what });
  }
  for (const m of msgs.data || []) if (m.member_id) push(m.member_id, { at: m.created_at, what: `Asked: “${String(m.body || '').slice(0, 60)}”` });
  for (const f of fb.data || []) if (f.member_id) push(f.member_id, { at: f.created_at, what: f.rating ? `Rated ${f.rating}★` : 'Left feedback' });
  for (const r of reqs.data || []) if (r.submitted_member_id && r.submitted_at) push(r.submitted_member_id, { at: r.submitted_at, what: `Sent “${r.title}”` });
  for (const c of cos.data || []) if (c.decided_member_id) push(c.decided_member_id, { at: c.approved_at || c.declined_at, what: `${c.status === 'approved' ? 'Approved' : 'Declined'} change: ${c.title}` });
  return list
    .map((m) => ({ ...m, link: memberLink(m), activity: (by.get(m.id) || []).filter((a) => a.at).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12) }))
    .sort((a, b) => (a.revoked_at ? 1 : 0) - (b.revoked_at ? 1 : 0));
}

export async function addMember(estimateId: string, input: { name: string; email?: string | null; phone?: string | null; label?: string | null; role?: MemberRole; added_by?: string | null }): Promise<{ member: Member } | { error: string }> {
  const name = String(input.name || '').trim().slice(0, 120);
  if (!name) return { error: 'Type their name.' };
  const email = norm(input.email) || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email doesn’t look right.' };
  if (!(await ensureShareToken(estimateId))) return { error: 'Project not found.' };
  const supabase = createAdminClient();
  if (email) {
    const { data: dup } = await supabase.from('project_members').select('id').eq('estimate_id', estimateId).ilike('email', email).is('revoked_at', null).maybeSingle();
    if (dup) return { error: 'That email is already on this project.' };
  }
  const { data, error } = await supabase.from('project_members').insert({
    estimate_id: estimateId, name, email, phone: String(input.phone || '').trim() || null, label: String(input.label || '').trim().slice(0, 40) || null,
    role: input.role === 'approver' ? 'approver' : 'viewer', token: newMemberToken(), added_by: input.added_by || null,
  }).select('*').single();
  if (error || !data) return { error: (error && error.message) || 'Could not add them.' };
  return { member: data as Member };
}

export async function updateMember(id: string, patch: { role?: MemberRole; name?: string; email?: string | null; phone?: string | null; label?: string | null; revoke?: boolean; restore?: boolean }) {
  const p: Record<string, unknown> = {};
  if (patch.role) p.role = patch.role === 'approver' ? 'approver' : 'viewer';
  if (typeof patch.name === 'string' && patch.name.trim()) p.name = patch.name.trim().slice(0, 120);
  if (patch.email !== undefined) p.email = norm(patch.email) || null;
  if (patch.phone !== undefined) p.phone = String(patch.phone || '').trim() || null;
  if (patch.label !== undefined) p.label = String(patch.label || '').trim().slice(0, 40) || null;
  // Removing someone also retires their link token, so an old copy never works again.
  if (patch.revoke) { p.revoked_at = new Date().toISOString(); p.token = newMemberToken(); }
  if (patch.restore) { p.revoked_at = null; p.token = newMemberToken(); }
  const { data, error } = await createAdminClient().from('project_members').update(p).eq('id', id).select('*').single();
  if (error || !data) return { error: (error && error.message) || 'Could not update.' };
  return { member: data as Member };
}

/** Email the person their personal link. */
export async function sendMemberInvite(m: Member): Promise<{ ok: true } | { error: string }> {
  if (!m.email) return { error: 'No email on file for them — text the link instead.' };
  const supabase = createAdminClient();
  const { data: est } = await supabase.from('estimates').select('project_name, estimate_number, customer:customers(first_name, last_name, company_name)').eq('id', m.estimate_id).maybeSingle();
  const proj = (est && String(est.project_name || '').trim()) || (est && est.estimate_number) || 'your project';
  const c: any = est && (est as any).customer;
  const owner = c ? (c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ').trim()) : '';
  const link = memberLink(m);
  const subject = `You’ve been added to the ${proj} project page`;
  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${esc(m.name.split(' ')[0] || m.name)},</p>
    <p style="margin:0 0 16px">RO Unlimited added you to the project page for <strong>${esc(proj)}</strong>${owner ? ` (${esc(owner)})` : ''}. It shows progress, what’s coming up, permits and inspections, and updates with photos.</p>
    <p style="margin:0 0 20px">${m.role === 'approver' ? 'You can also approve changes and send documents from the page.' : 'You can view the page and ask questions.'}</p>
    <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">Open the Project Page</a></p>
    <p style="margin:0;color:#666;font-size:14px">This link is just for you — please don’t forward it. You can also sign in any time at rounlimited.com/my with this email.</p>`;
  try {
    await fetchEmailAccounts();
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: getFromHeader(DEFAULT_FROM_EMAIL), to: m.email, subject, html: buildEmailHtml(m.name, bodyHtml, subject, DEFAULT_FROM_EMAIL) });
    await logEmail({ direction: 'outbound', to_email: m.email, from_email: DEFAULT_FROM_EMAIL, subject, body_text: `Project page invite: ${link}`, folder: 'sent' }).catch(() => {});
    await supabase.from('project_members').update({ invited_at: new Date().toISOString() }).eq('id', m.id);
    return { ok: true };
  } catch (e) { console.error('[project-members] invite failed', e); return { error: 'Email failed — try again or text the link.' }; }
}

/** Active memberships for a signed-in email (portal /my). */
export async function membershipsFor(email: string): Promise<Member[]> {
  const e = norm(email); if (!e) return [];
  const { data } = await createAdminClient().from('project_members').select('*').ilike('email', e).is('revoked_at', null);
  return (data || []) as Member[];
}
