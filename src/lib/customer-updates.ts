import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';
import { rollUpProgress } from '@/lib/reporting';
import { shouldEmailCustomer } from '@/lib/customer-auth';

/**
 * Quick customer update — two lines and a few photos, between the weekly
 * reports. It IS a job-log entry (type 'update', customer-visible, photos
 * attached), so it shows in "What's Been Happening" on their page and in the
 * next report, and it's emailed if the customer wants updates by email.
 */
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function sendUpdate(args: { estimateId: string; body: string; photos?: { url: string; caption?: string | null }[]; sentBy: string; notify?: boolean }) {
  const supabase = createAdminClient();
  const text = String(args.body || '').trim();
  if (!text) return { error: 'Write the update first' };
  const photos = (args.photos || []).filter((p) => p && p.url).slice(0, 12).map((p) => ({ url: p.url, caption: p.caption || null }));
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  const { data: entry, error } = await supabase.from('job_log_entries')
    .insert({ estimate_id: args.estimateId, entry_date: today, type: 'update', text, photos, include_in_report: true, created_by: args.sentBy || 'RO Unlimited' })
    .select().single();
  if (error) return { error: error.message };

  let emailed = false, to: string | null = null, skipped: string | null = null;
  if (args.notify !== false) {
    const { data: est } = await supabase.from('estimates').select('project_name, estimate_number, share_token, customer:customers(first_name, company_name, email)').eq('id', args.estimateId).single();
    const c: any = est?.customer; to = c?.email || null;
    if (!to) skipped = 'no email on file';
    else if (!(await shouldEmailCustomer(to, 'update'))) skipped = 'customer chose fewer emails (they will see it on their page and in the weekly report)';
    else {
      try {
        await fetchEmailAccounts();
        const project = est!.project_name || est!.estimate_number;
        const name = c.first_name || c.company_name || 'there';
        const subject = `${project} — update from RO`;
        const link = `${SITE()}/estimate/${est!.share_token}`;
        const pics = photos.slice(0, 4).map((p) => `<a href="${link}" style="display:inline-block;margin:0 8px 8px 0"><img src="${esc(p.url)}" alt="${esc(p.caption || 'Site photo')}" width="260" style="width:260px;max-width:100%;height:auto;border-radius:8px;display:block"></a>`).join('');
        const bodyHtml = `
          <p style="margin:0 0 16px">Hi ${esc(name)},</p>
          <p style="margin:0 0 16px;font-size:17px;color:#222;white-space:pre-line">${esc(text)}</p>
          ${pics ? `<div style="margin:0 0 16px">${pics}</div>` : ''}
          ${photos.length > 4 ? `<p style="margin:0 0 16px;color:#666">${photos.length - 4} more photo${photos.length - 4 === 1 ? '' : 's'} on your project page.</p>` : ''}
          <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">Open Your Project Page</a></p>
          <p style="margin:0;color:#666">Questions any time — ask on your page or call (864) 304-0139.</p>`;
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: sendErr } = await resend.emails.send({ from: getFromHeader(DEFAULT_FROM_EMAIL), to, subject, html: buildEmailHtml(name, bodyHtml, subject, DEFAULT_FROM_EMAIL) });
        if (sendErr) skipped = 'email failed: ' + sendErr.message;
        else {
          emailed = true;
          await supabase.from('estimates').update({ progress_notified_at: new Date().toISOString() }).eq('id', args.estimateId);
          await logEmail({ direction: 'outbound', to_email: to, from_email: DEFAULT_FROM_EMAIL, subject, body_text: text, folder: 'sent' }).catch(() => {});
        }
      } catch (e: any) { skipped = 'email failed: ' + (e?.message || e); }
    }
  }
  return { entry, emailed, to, skipped };
}

/** Two to four plain sentences from what's been logged since the last update. JR edits or sends. */
export async function draftUpdate(estimateId: string): Promise<{ draft: string | null; error?: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { draft: null, error: 'AI drafting is not configured' };
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [estRes, itemsRes, progRes, logRes, schedRes] = await Promise.all([
    supabase.from('estimates').select('project_name, estimate_number, customer:customers(first_name, company_name)').eq('id', estimateId).single(),
    supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', estimateId),
    supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order, custom').eq('estimate_id', estimateId),
    supabase.from('job_log_entries').select('entry_date, type, text, include_in_report, photos').eq('estimate_id', estimateId).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(14),
    supabase.from('job_schedule_items').select('title, kind, starts_on').eq('estimate_id', estimateId).gte('starts_on', today).is('done_at', null).order('starts_on', { ascending: true }).limit(4),
  ]);
  const est: any = estRes.data; if (!est) return { draft: null, error: 'Job not found' };
  const log = (logRes.data || []) as any[];
  const lastUpdateIdx = log.findIndex((l) => l.type === 'update');
  const since = lastUpdateIdx >= 0 ? log.slice(0, lastUpdateIdx) : log.slice(0, 7);
  const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
  const facts = [
    `Project: ${est.project_name || est.estimate_number}. Customer: ${est.customer?.first_name || est.customer?.company_name || 'the customer'}.`,
    `Progress: ${roll.percent}% overall` + (roll.phases.length ? ' — ' + roll.phases.map((p) => `${p.phase} ${p.percent}%`).join(', ') : ''),
    'Logged since the last update (newest first; [internal] = customer must NOT see it, use only for context):',
    ...since.map((l) => `  ${l.entry_date} ${l.type}${l.include_in_report ? '' : ' [internal]'}: ${l.text || ''}${Array.isArray(l.photos) && l.photos.length ? ` (${l.photos.length} photos)` : ''}`),
    'Coming up (all dates are estimates):',
    ...(schedRes.data || []).map((s: any) => `  ${s.starts_on} ${s.kind}: ${s.title}`),
  ].join('\n');
  const system = `You write short progress updates to customers for RO Unlimited (Easley, SC) in the owner's voice: plain, friendly, specific, 2–4 short sentences, no greeting, no sign-off, no emojis.
Rules: only facts given; never mention [internal] items, costs or margins; any date is "estimated" or "should be" — never a promise; never promise crews, schedules or who does the work (no "our crew", "in-house", "self-performed"); end with what's next if known.`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 350, system, messages: [{ role: 'user', content: `FACTS (today ${today})\n${facts}\n\nWrite the update.` }] }),
  });
  if (!res.ok) { console.error('[customer-updates] Claude error', res.status, await res.text().catch(() => '')); return { draft: null, error: 'The drafter is unavailable right now' }; }
  const data = await res.json();
  const draft = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  return { draft: draft || null };
}
