import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Vercel cron: runs every hour — sends push notifications for tasks that are due
// vercel.json: { "path": "/api/cron/reminders", "schedule": "0 * * * *" }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
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

  if (!dueTasks?.length) return NextResponse.json({ fired: 0 });

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

  return NextResponse.json({ fired, checked: dueTasks.length });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}
