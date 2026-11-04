import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';
import { runPortalReminders } from '@/lib/portal-reminders';
import { runServiceReminders } from '@/lib/handover';

export const dynamic = 'force-dynamic';

// Vercel cron: once a day at 11:00 UTC (7am ET) — Hobby plan allows daily crons only.
// Task reminders due in the last hour + customer questions waiting > 4h.
// vercel.json: { "path": "/api/cron/reminders", "schedule": "0 11 * * *" }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // Customer questions waiting more than 4 hours: push JR (again every 4h).
  let nudged = 0;
  try {
    const cutoff = new Date(now.getTime() - 4 * 3600000).toISOString();
    const { data: stale } = await supabase
      .from('project_messages')
      .select('id, body, created_at, nudged_at, estimate:estimates(id, estimate_number, project_name, division, customer:customers(first_name, company_name))')
      .eq('author', 'customer').is('answered_at', null).lte('created_at', cutoff)
      .or(`nudged_at.is.null,nudged_at.lte.${cutoff}`)
      .limit(20);
    for (const q of (stale || []) as any[]) {
      const e = q.estimate; const c = e?.customer;
      const hrs = Math.round((now.getTime() - new Date(q.created_at).getTime()) / 3600000);
      await notifyTeam({
        type: 'question_waiting',
        title: `${c?.first_name || c?.company_name || 'A customer'} is still waiting — ${e?.project_name || e?.estimate_number}`,
        body: `${hrs}h with no answer: "${String(q.body).slice(0, 110)}"`,
        url: '/admin/questions', reference_id: e?.id || null, division: e?.division || null, tag: `question-waiting-${q.id}`,
      } as any);
      await supabase.from('project_messages').update({ nudged_at: now.toISOString() }).eq('id', q.id);
      nudged++;
    }
  } catch (e) { console.error('[cron/reminders] question nudge failed', e); }

  // Portal: customer reminders (change orders, requests, unopened updates) + JR nudges (stale job, quiet customer).
  let portal: any = null;
  try { portal = await runPortalReminders(); } catch (e) { console.error('[cron/reminders] portal reminders failed', e); }
  try { portal = { ...(portal || {}), service: await runServiceReminders() }; } catch (e) { console.error('[cron/reminders] service reminders failed', e); }

  // Look back 65 min to catch anything from last cron run (with overlap buffer)
  const windowStart = new Date(now.getTime() - 65 * 60 * 1000).toISOString();

  const { data: dueTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('reminder_sent', false)
    .not('remind_at', 'is', null)
    .lte('remind_at', now.toISOString())
    .gte('remind_at', windowStart)
    .not('status', 'in', '("done","cancelled")');

  if (!dueTasks?.length) return NextResponse.json({ fired: 0, nudged, portal });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
  let fired = 0;

  for (const task of dueTasks) {
    const catEmoji: Record<string, string> = {
      job_site: '🏗️', customer: '👤', vendor: '🚚',
      permit: '📋', employee: '👷', financial: '💰', general: '📌',
    };
    const emoji = catEmoji[task.category] || '📌';
    const timeStr = task.due_time ? ` at ${formatTime(task.due_time)}` : '';
    const body = task.description
      ? task.description.slice(0, 80)
      : task.linked_label
        ? `Linked to: ${task.linked_label}`
        : `Due${timeStr} · ${task.category}`;

    try {
      await fetch(`${siteUrl}/api/admin/push-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-push-secret': process.env.PUSH_SECRET || '' },
        body: JSON.stringify({
          title: `${emoji} ${task.title}`,
          body,
          url: '/admin/tasks',
          tag: `task-${task.id}`,
        }),
      });

      // Mark as sent
      await supabase
        .from('tasks')
        .update({ reminder_sent: true, updated_at: new Date().toISOString() })
        .eq('id', task.id);

      fired++;
    } catch (err) {
      console.error('[reminders] Failed to push task', task.id, err);
    }
  }

  return NextResponse.json({ fired, checked: dueTasks.length, nudged, portal });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}
