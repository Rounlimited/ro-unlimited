import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';
import { notifyTeam } from '@/lib/alerts';

/**
 * Requests from RO to the customer — the county-portal "corrections" pattern.
 * "We need the HOA approval letter by Friday" becomes a row the customer sees
 * under Needs You, with an upload button, instead of a text JR has to chase.
 * open → submitted (customer answered/uploaded) → done (JR closes it).
 */
import { REQUEST_KINDS, type RequestKind } from '@/lib/customer-request-kinds';
export { REQUEST_KINDS, type RequestKind };

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtDue = (d?: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : null;

export async function listRequests(estimateId: string) {
  const { data } = await createAdminClient().from('customer_requests').select('*').eq('estimate_id', estimateId).order('created_at', { ascending: false });
  return data || [];
}

export async function createRequest(args: { estimateId: string; kind: RequestKind | string; title: string; details?: string | null; due_on?: string | null; createdBy: string; notify?: boolean }) {
  const supabase = createAdminClient();
  const title = String(args.title || '').trim();
  if (!title) return { error: 'Say what you need from them' };
  const kind = (REQUEST_KINDS.some((k) => k.id === args.kind) ? args.kind : 'other') as RequestKind;
  const { data: row, error } = await supabase.from('customer_requests')
    .insert({ estimate_id: args.estimateId, kind, title, details: args.details || null, due_on: args.due_on || null, created_by: args.createdBy || 'RO Unlimited' })
    .select().single();
  if (error) return { error: error.message };

  let emailed = false;
  if (args.notify !== false) {
    const { data: est } = await supabase.from('estimates').select('project_name, estimate_number, share_token, customer:customers(first_name, company_name, email)').eq('id', args.estimateId).single();
    const c: any = est?.customer;
    if (c?.email && est?.share_token) {
      try {
        await fetchEmailAccounts();
        const project = est.project_name || est.estimate_number;
        const name = c.first_name || c.company_name || 'there';
        const due = fmtDue(row.due_on);
        const subject = `${project} — we need something from you${due ? ' by ' + due : ''}`;
        const link = `${SITE()}/estimate/${est.share_token}#requests`;
        const bodyHtml = `
          <p style="margin:0 0 16px">Hi ${esc(name)},</p>
          <p style="margin:0 0 12px">To keep ${esc(project)} moving we need:</p>
          <p style="margin:0 0 16px;padding:12px 16px;background:#fdf6e7;border-left:3px solid #C9A84C;font-size:18px;font-weight:bold;color:#222">${esc(title)}${due ? `<span style="display:block;font-size:14px;font-weight:normal;color:#8a6d20;margin-top:4px">Needed by ${esc(due)}</span>` : ''}</p>
          ${row.details ? `<p style="margin:0 0 16px;color:#444">${esc(row.details)}</p>` : ''}
          <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">${kind === 'document' ? 'Upload It Here' : 'Open Your Project Page'}</a></p>
          <p style="margin:0;color:#666">You can send it right from your phone on that page. Questions — (864) 304-0139.</p>`;
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: sendErr } = await resend.emails.send({ from: getFromHeader(DEFAULT_FROM_EMAIL), to: c.email, subject, html: buildEmailHtml(name, bodyHtml, subject, DEFAULT_FROM_EMAIL) });
        if (!sendErr) {
          emailed = true;
          await supabase.from('customer_requests').update({ notified_at: new Date().toISOString() }).eq('id', row.id);
          await logEmail({ direction: 'outbound', to_email: c.email, from_email: DEFAULT_FROM_EMAIL, subject, body_text: title + (row.details ? ' — ' + row.details : ''), folder: 'sent' }).catch(() => {});
        }
      } catch (e) { console.error('[customer-requests] email failed', e); }
    }
  }
  return { request: row, emailed };
}

/** Customer answered or uploaded. */
export async function submitRequest(args: { estimateId: string; requestId: string; text?: string | null; files: { url: string; name: string; size?: number; type?: string }[]; member?: { id: string; name: string; label: string | null } | null }) {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from('customer_requests').select('id, title, status, files').eq('id', args.requestId).eq('estimate_id', args.estimateId).maybeSingle();
  if (!row) return { error: 'Request not found' };
  if (row.status === 'done' || row.status === 'cancelled') return { error: 'This request is already closed' };
  const files = [...(Array.isArray(row.files) ? row.files : []), ...args.files];
  const { data: upd, error } = await supabase.from('customer_requests')
    .update({ status: 'submitted', response_text: args.text || null, files, submitted_at: new Date().toISOString(), submitted_member_id: args.member ? args.member.id : null })
    .eq('id', row.id).select().single();
  if (error) return { error: error.message };

  const { data: est } = await supabase.from('estimates').select('id, project_name, estimate_number, division, customer:customers(first_name, company_name)').eq('id', args.estimateId).single();
  const c: any = est?.customer;
  await notifyTeam({
    type: 'request_submitted',
    title: `${args.member ? args.member.name + (args.member.label ? ' (' + args.member.label + ')' : '') : (c?.first_name || c?.company_name || 'Customer')} sent: ${row.title} — ${est?.project_name || est?.estimate_number}`,
    body: args.files.length ? `${args.files.length} file${args.files.length === 1 ? '' : 's'} uploaded${args.text ? ' · ' + String(args.text).slice(0, 100) : ''}` : String(args.text || '').slice(0, 160),
    url: `/admin/jobs/${args.estimateId}`, reference_id: args.estimateId, division: est?.division || null, tag: `request-${row.id}`,
  } as any);
  return { request: upd };
}

export async function setRequestStatus(estimateId: string, requestId: string, status: 'open' | 'done' | 'cancelled') {
  const patch: any = { status };
  if (status === 'done') patch.done_at = new Date().toISOString();
  const { data, error } = await createAdminClient().from('customer_requests').update(patch).eq('id', requestId).eq('estimate_id', estimateId).select().single();
  return error ? { error: error.message } : { request: data };
}
