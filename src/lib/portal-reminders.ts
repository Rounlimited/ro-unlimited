import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';
import { emailCustomerFact, fmtDay } from '@/lib/customer-notify';

/**
 * The background nudges that keep a job from going quiet. Runs from
 * /api/cron/reminders (daily on Vercel, hourly from Supabase pg_cron).
 *
 * Customer side (plain fact emails, each at most once per window):
 *  - a change order waiting on them 3+ days
 *  - a request from RO due within 3 days or overdue (every 3 days)
 *  - an update posted 3+ days ago they haven't opened (once per 7 days)
 * JR side (team alerts):
 *  - active job with no customer-visible update in 7 days
 *  - customer hasn't opened their page in 14 days while updates were posted
 */
export async function runPortalReminders() {
  const supabase = createAdminClient();
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const out = { co_reminders: 0, request_reminders: 0, update_reminders: 0, stale_jobs: 0, quiet_customers: 0 };

  // Active jobs = signed, not completed, link not paused.
  const { data: jobs } = await supabase.from('estimates')
    .select('id, estimate_number, project_name, division, signed_at, last_viewed_at, update_reminder_at, stale_nudged_at, quiet_nudged_at, customer:customers(first_name, company_name, email)')
    .not('signed_at', 'is', null).is('completed_at', null).neq('link_enabled', false);
  const active = (jobs || []) as any[];
  if (!active.length) return out;
  const ids = active.map((j) => j.id);

  // 1. Change orders waiting on the customer 3+ days.
  try {
    const { data: cos } = await supabase.from('change_orders').select('id, estimate_id, title, amount, days_added, created_at, customer_reminded_at')
      .in('estimate_id', ids).eq('status', 'pending').lte('created_at', iso(now - 3 * 86400000)).is('customer_reminded_at', null).limit(30);
    for (const co of cos || []) {
      const r = await emailCustomerFact({ estimateId: co.estimate_id, kind: 'needed', subjectTail: 'a change order is waiting on you', headline: `Still waiting on your decision: ${co.title} (${Number(co.amount) >= 0 ? '+' : '−'}$${Math.round(Math.abs(co.amount)).toLocaleString()}${co.days_added ? `, ${co.days_added} day${co.days_added === 1 ? '' : 's'} added` : ''}).`, detail: 'Nothing extra gets built until you approve or decline it on your page. One tap either way.', anchor: 'change-orders', button: 'Review the Change Order' });
      await supabase.from('change_orders').update({ customer_reminded_at: iso(now) }).eq('id', co.id);
      if (r.emailed) out.co_reminders++;
    }
  } catch (e) { console.error('[portal-reminders] change orders', e); }

  // 2. Requests from RO due soon / overdue (remind every 3 days).
  try {
    const soon = new Date(now + 3 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const { data: reqs } = await supabase.from('customer_requests').select('id, estimate_id, title, kind, due_on, reminded_at, created_at')
      .in('estimate_id', ids).eq('status', 'open').not('due_on', 'is', null).lte('due_on', soon)
      .or(`reminded_at.is.null,reminded_at.lte.${iso(now - 3 * 86400000)}`).limit(30);
    for (const rq of reqs || []) {
      if (new Date(rq.created_at).getTime() > now - 86400000) continue; // they were just asked
      const overdue = rq.due_on < today;
      const r = await emailCustomerFact({ estimateId: rq.estimate_id, kind: 'needed', subjectTail: overdue ? `we still need: ${rq.title}` : `reminder: ${rq.title} by ${fmtDay(rq.due_on)}`, headline: overdue ? `We still need ${rq.title} — it was due ${fmtDay(rq.due_on)}.` : `Reminder: we need ${rq.title} by ${fmtDay(rq.due_on)}.`, detail: rq.kind === 'document' ? 'A clear photo of it from your phone is fine — upload it on your page.' : 'You can answer right on your page.', anchor: 'requests', button: rq.kind === 'document' ? 'Upload It' : 'Open Your Project' });
      await supabase.from('customer_requests').update({ reminded_at: iso(now) }).eq('id', rq.id);
      if (r.emailed) out.request_reminders++;
    }
  } catch (e) { console.error('[portal-reminders] requests', e); }

  // 3. An update they haven't opened (3+ days old, page not viewed since), once per 7 days.
  try {
    const { data: recent } = await supabase.from('job_log_entries').select('estimate_id, created_at, text').in('estimate_id', ids).eq('type', 'update').eq('include_in_report', true)
      .gte('created_at', iso(now - 14 * 86400000)).lte('created_at', iso(now - 3 * 86400000)).order('created_at', { ascending: false });
    const seen = new Set<string>();
    for (const u of recent || []) {
      if (seen.has(u.estimate_id)) continue; seen.add(u.estimate_id);
      const job = active.find((j) => j.id === u.estimate_id); if (!job) continue;
      if (job.last_viewed_at && new Date(job.last_viewed_at) > new Date(u.created_at)) continue;
      if (job.update_reminder_at && new Date(job.update_reminder_at).getTime() > now - 7 * 86400000) continue;
      const r = await emailCustomerFact({ estimateId: job.id, kind: 'update', subjectTail: 'an update is waiting for you', headline: 'RO posted an update on your project a few days ago.', detail: String(u.text || '').slice(0, 240), button: 'Read the Update' });
      await supabase.from('estimates').update({ update_reminder_at: iso(now) }).eq('id', job.id);
      if (r.emailed) out.update_reminders++;
    }
  } catch (e) { console.error('[portal-reminders] unopened updates', e); }

  // 4 + 5. JR nudges: stale jobs and quiet customers.
  try {
    const { data: lastVisible } = await supabase.from('job_log_entries').select('estimate_id, entry_date').in('estimate_id', ids).eq('include_in_report', true).order('entry_date', { ascending: false });
    const last = new Map<string, string>();
    for (const l of lastVisible || []) if (!last.has(l.estimate_id)) last.set(l.estimate_id, l.entry_date);
    for (const job of active) {
      const c = job.customer || {};
      const who = c.first_name || c.company_name || 'the customer';
      const lastDate = last.get(job.id) || String(job.signed_at).slice(0, 10);
      const daysSince = Math.floor((now - new Date(lastDate + 'T12:00:00').getTime()) / 86400000);
      if (daysSince >= 7 && (!job.stale_nudged_at || new Date(job.stale_nudged_at).getTime() < now - 7 * 86400000)) {
        await notifyTeam({ type: 'stale_job', title: `${job.project_name || job.estimate_number}: nothing posted for ${who} in ${daysSince} days`, body: 'Silence reads as "something is wrong". Two lines and a photo from the Job Room keeps them off the phone.', url: `/admin/jobs/${job.id}`, reference_id: job.id, division: job.division || null, tag: `stale-${job.id}` } as any);
        await supabase.from('estimates').update({ stale_nudged_at: iso(now) }).eq('id', job.id);
        out.stale_jobs++;
      }
      const lastView = job.last_viewed_at ? new Date(job.last_viewed_at).getTime() : 0;
      const postedRecently = daysSince < 14;
      if (postedRecently && (!lastView || lastView < now - 14 * 86400000) && (!job.quiet_nudged_at || new Date(job.quiet_nudged_at).getTime() < now - 14 * 86400000)) {
        await notifyTeam({ type: 'customer_quiet', title: `${who} hasn't opened their page in ${lastView ? Math.floor((now - lastView) / 86400000) + ' days' : 'a while'} — ${job.project_name || job.estimate_number}`, body: c.email ? 'Updates are posting but they are not looking. Worth a text with their link, or a call.' : 'They have no email on file — add one in Customer Portal so updates reach them.', url: `/admin/portal`, reference_id: job.id, division: job.division || null, tag: `quiet-${job.id}` } as any);
        await supabase.from('estimates').update({ quiet_nudged_at: iso(now) }).eq('id', job.id);
        out.quiet_customers++;
      }
    }
  } catch (e) { console.error('[portal-reminders] nudges', e); }
  return out;
}
