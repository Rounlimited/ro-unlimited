import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';
import { rollUpProgress } from '@/lib/reporting';

/**
 * Customer questions — the loop that stops the texts.
 *
 * A customer types a question on their project page (project_messages,
 * author 'customer'). Before this file existed it sat there: no reply
 * screen, no notification. Now: anyone on the team answers from the
 * Questions inbox, the Job Room, or the AI ("answer Greg: yes, until
 * backfill"); the answer lands in the thread on the customer's page and the
 * customer gets an email that it's there. `assigned_to` is ready for when
 * other managers answer their own jobs; today everything is JR's.
 */

export interface OpenQuestion {
  id: string;
  estimate_id: string;
  body: string;
  author_name: string | null;
  created_at: string;
  answered_at: string | null;
  answered_by: string | null;
  assigned_to: string | null;
  estimate: { id: string; estimate_number: string; project_name: string | null; share_token: string | null; division: string | null; customer: { first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; phone: string | null } | null };
  answer?: { body: string; author_name: string | null; created_at: string } | null;
}

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function customerDisplayName(c: any): string {
  return c?.first_name || c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'there';
}

/** Open (unanswered) customer questions across every job, newest first, plus the recently answered ones. */
export async function listQuestions(supabase: ReturnType<typeof createAdminClient>, opts: { limit?: number; estimateId?: string } = {}) {
  const limit = opts.limit || 100;
  let q = supabase
    .from('project_messages')
    .select('id, estimate_id, body, author, author_name, created_at, answered_at, answered_by, assigned_to, estimate:estimates(id, estimate_number, project_name, share_token, division, customer:customers(first_name, last_name, company_name, email, phone))')
    .eq('author', 'customer')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (opts.estimateId) q = q.eq('estimate_id', opts.estimateId);
  const { data } = await q;
  const rows = (data || []) as any[];

  // Attach the first RO reply that came after each question (what the customer saw).
  const estIds = Array.from(new Set(rows.map((r) => r.estimate_id)));
  let replies: any[] = [];
  if (estIds.length) {
    const { data: rep } = await supabase
      .from('project_messages')
      .select('estimate_id, body, author_name, created_at, reply_to')
      .eq('author', 'ro').in('estimate_id', estIds)
      .order('created_at', { ascending: true });
    replies = rep || [];
  }
  const withAnswers: OpenQuestion[] = rows.map((r) => {
    const direct = replies.find((x) => x.reply_to === r.id);
    const after = direct || replies.find((x) => x.estimate_id === r.estimate_id && x.created_at > r.created_at);
    return { ...r, answer: after ? { body: after.body, author_name: after.author_name, created_at: after.created_at } : null };
  });

  const open = withAnswers.filter((r) => !r.answered_at);
  const answered = withAnswers.filter((r) => !!r.answered_at);
  const times = answered
    .filter((r) => r.answer)
    .map((r) => (new Date(r.answer!.created_at).getTime() - new Date(r.created_at).getTime()) / 3600000)
    .filter((h) => h >= 0 && h < 24 * 14);
  const avgAnswerHours = times.length ? Math.round((times.reduce((s, h) => s + h, 0) / times.length) * 10) / 10 : null;
  const oldestOpenHours = open.length ? Math.round((Date.now() - new Date(open[open.length - 1].created_at).getTime()) / 3600000) : 0;
  return { open, answered, avg_answer_hours: avgAnswerHours, oldest_open_hours: oldestOpenHours };
}

/**
 * Post an answer into a project's thread, mark the customer's open questions
 * answered, and (by default) email the customer that the answer is on their page.
 */
export async function replyToQuestion(args: {
  estimateId: string; body: string; answeredBy: string; questionId?: string | null; notify?: boolean; fromEmail?: string | null;
}): Promise<{ message: any; emailed: boolean; to: string | null; error?: string }> {
  const supabase = createAdminClient();
  const text = String(args.body || '').trim();
  if (!text) return { message: null, emailed: false, to: null, error: 'Write the answer first' };

  const { data: est } = await supabase
    .from('estimates')
    .select('id, estimate_number, project_name, share_token, link_enabled, customer:customers(first_name, last_name, company_name, email)')
    .eq('id', args.estimateId)
    .single();
  if (!est) return { message: null, emailed: false, to: null, error: 'Job not found' };

  const now = new Date().toISOString();
  const { data: msg, error } = await supabase
    .from('project_messages')
    .insert({ estimate_id: est.id, author: 'ro', author_name: args.answeredBy || 'RO Unlimited', body: text, reply_to: args.questionId || null })
    .select()
    .single();
  if (error) return { message: null, emailed: false, to: null, error: error.message };

  // Everything the customer asked that's still open on this job is now answered.
  let mark = supabase.from('project_messages')
    .update({ answered_at: now, answered_by: args.answeredBy || 'RO Unlimited' })
    .eq('estimate_id', est.id).eq('author', 'customer').is('answered_at', null);
  if (args.questionId) mark = mark.lte('created_at', now);
  await mark;

  // Which question is this answering (for the email)?
  let question: any = null;
  if (args.questionId) {
    const { data } = await supabase.from('project_messages').select('body, author_name').eq('id', args.questionId).maybeSingle();
    question = data;
  } else {
    const { data } = await supabase.from('project_messages').select('body, author_name').eq('estimate_id', est.id).eq('author', 'customer').order('created_at', { ascending: false }).limit(1).maybeSingle();
    question = data;
  }

  const c: any = est.customer;
  const to = c?.email || null;
  if (args.notify === false || !to) return { message: msg, emailed: false, to };

  try {
    await fetchEmailAccounts();
    const sender = args.fromEmail || DEFAULT_FROM_EMAIL;
    const project = est.project_name || est.estimate_number;
    const name = customerDisplayName(c);
    const link = `${SITE()}/estimate/${est.share_token}#questions`;
    const subject = `Your question about ${project} — answered`;
    const bodyHtml = `
      <p style="margin:0 0 16px">Hi ${esc(name)},</p>
      <p style="margin:0 0 16px">We answered your question on your project page.</p>
      ${question?.body ? `<p style="margin:0 0 8px;color:#666;font-size:15px">You asked:</p><p style="margin:0 0 16px;padding:12px 16px;background:#f5f3ec;border-left:3px solid #C9A84C;color:#333">${esc(question.body)}</p>` : ''}
      <p style="margin:0 0 8px;color:#666;font-size:15px">Our answer:</p>
      <p style="margin:0 0 20px;padding:12px 16px;background:#fdf6e7;border-left:3px solid #C9A84C;color:#222;font-size:17px;white-space:pre-line">${esc(text)}</p>
      <p style="margin:0 0 28px">
        <a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">Open Your Project Page</a>
      </p>
      <p style="margin:0;color:#666">Reply right there with any follow-up, or call (864) 304-0139.</p>`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendErr } = await resend.emails.send({ from: getFromHeader(sender), to, subject, html: buildEmailHtml(name, bodyHtml, subject, sender) });
    if (sendErr) return { message: msg, emailed: false, to, error: `Answer posted, but the email failed: ${sendErr.message}` };
    await logEmail({ direction: 'outbound', to_email: to, from_email: sender, subject, body_text: text, folder: 'sent' }).catch(() => {});
    return { message: msg, emailed: true, to };
  } catch (e: any) {
    return { message: msg, emailed: false, to, error: `Answer posted, but the email failed: ${e?.message || e}` };
  }
}

/**
 * Draft an answer from the job's own records. JR edits or sends. Facts only:
 * what the log says, where the phases stand, what's on the schedule. It is
 * told to say "JR will confirm" rather than invent, and to label dates as
 * estimated. Owner copy rules: no crew/schedule promises.
 */
export async function draftAnswer(estimateId: string, questionId?: string | null): Promise<{ draft: string | null; error?: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { draft: null, error: 'AI drafting is not configured' };
  const supabase = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);
  const [estRes, itemsRes, progRes, logRes, schedRes, msgRes] = await Promise.all([
    supabase.from('estimates').select('id, estimate_number, project_name, document_mode, signed_at, completed_at, project_description, customer:customers(first_name, last_name, company_name)').eq('id', estimateId).single(),
    supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', estimateId),
    supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order, custom').eq('estimate_id', estimateId),
    supabase.from('job_log_entries').select('entry_date, type, text, include_in_report').eq('estimate_id', estimateId).order('entry_date', { ascending: false }).limit(10),
    supabase.from('job_schedule_items').select('title, kind, starts_on, ends_on, done_at').eq('estimate_id', estimateId).gte('starts_on', today).order('starts_on', { ascending: true }).limit(8),
    supabase.from('project_messages').select('id, author, author_name, body, created_at').eq('estimate_id', estimateId).order('created_at', { ascending: true }).limit(30),
  ]);
  const est: any = estRes.data;
  if (!est) return { draft: null, error: 'Job not found' };
  const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
  const thread = (msgRes.data || []) as any[];
  const question = questionId ? thread.find((m) => m.id === questionId) : [...thread].reverse().find((m) => m.author === 'customer');
  if (!question) return { draft: null, error: 'No open question on this job' };

  const facts = [
    `Project: ${est.project_name || est.estimate_number} (${est.document_mode === 'contract' ? 'signed contract' : 'estimate'}${est.signed_at ? ', signed ' + est.signed_at.slice(0, 10) : ''}${est.completed_at ? ', completed ' + est.completed_at.slice(0, 10) : ''})`,
    `Customer: ${customerDisplayName(est.customer)}`,
    `Overall progress: ${roll.percent}%` + (roll.phases.length ? ' — ' + roll.phases.map((p) => `${p.phase} ${p.percent}%`).join(', ') : ''),
    `Scope (as written on the document): ${String(est.project_description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 900)}`,
    'Job log (newest first; entries marked [internal] are NOT visible to the customer — never quote them, only use them to know the truth):',
    ...(logRes.data || []).map((l: any) => `  ${l.entry_date} ${l.type}${l.include_in_report ? '' : ' [internal]'}: ${l.text || ''}`),
    'Upcoming schedule items (dates are estimates):',
    ...(schedRes.data || []).map((s: any) => `  ${s.starts_on}${s.ends_on ? '–' + s.ends_on : ''} ${s.kind}: ${s.title}`),
    'Question thread so far:',
    ...thread.map((m) => `  ${m.author === 'ro' ? 'RO' : 'Customer'} (${m.created_at.slice(0, 10)}): ${m.body}`),
  ].join('\n');

  const system = `You draft replies to customers for RO Unlimited Construction & Development (Easley, SC), written in the owner's voice: plain, direct, friendly, 2–4 short sentences, no corporate tone, no emojis.
Rules:
- Answer ONLY from the facts given. If the facts don't settle it, say what you do know and end with "JR will confirm the rest" — never invent dates, prices, inspections or results.
- Any date is an estimate: write "estimated" or "should be" — never promise a date.
- Never promise crews, schedules or who does the work. Never say "our crew", "in-house", "self-performed", "guaranteed".
- Never mention internal log entries, costs, margins or status flags.
- Money: only numbers that appear in the facts.
- Sign-off is handled elsewhere: do not add a greeting or signature, just the answer.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-5', max_tokens: 400, system,
      messages: [{ role: 'user', content: `FACTS\n${facts}\n\nCUSTOMER'S QUESTION (today is ${today}):\n${question.body}\n\nDraft the reply.` }],
    }),
  });
  if (!res.ok) { console.error('[questions/draft] Claude error', res.status, await res.text().catch(() => '')); return { draft: null, error: 'The drafter is unavailable right now' }; }
  const data = await res.json();
  const draft = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  return { draft: draft || null };
}
