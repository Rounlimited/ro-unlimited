import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Vercel cron: runs at 12:00 UTC (8:00am EST) daily
// vercel.json: { "path": "/api/cron/daily-briefing", "schedule": "0 12 * * *" }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch all data in parallel
  const [
    { data: todayTasks },
    { data: overdueTasks },
    { data: upcomingTasks },
    { data: staleEstimates },
    { data: expiringEstimates },
    { data: unreadEmails },
    { data: newLeads },
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('due_date', todayStr).not('status', 'in', '("done","cancelled")').order('due_time', { ascending: true }),
    supabase.from('tasks').select('*').lt('due_date', todayStr).not('status', 'in', '("done","cancelled")'),
    supabase.from('tasks').select('*').gt('due_date', todayStr).lte('due_date', sevenDaysFromNow).not('status', 'in', '("done","cancelled")').order('due_date').limit(5),
    supabase.from('estimates').select('id, estimate_number, project_name, total, sent_at, status, customer:customers(first_name, last_name)').eq('status', 'sent').lt('sent_at', threeDaysAgo).order('sent_at').limit(5),
    supabase.from('estimates').select('id, estimate_number, project_name, total, valid_until, status, customer:customers(first_name, last_name)').in('status', ['sent', 'viewed']).lte('valid_until', sevenDaysFromNow).not('valid_until', 'is', null).order('valid_until').limit(3),
    supabase.from('email_messages').select('id, subject, from_email').eq('direction', 'inbound').eq('read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('intakes').select('id, name, service_type, created_at').gte('created_at', yesterdayStr).order('created_at', { ascending: false }).limit(3),
  ]);

  // Build context string for AI
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lines: string[] = [
    `Today is ${dayOfWeek}, ${dateLabel}.`,
    '',
  ];

  if (todayTasks?.length) {
    lines.push(`TASKS DUE TODAY (${todayTasks.length}):`);
    todayTasks.forEach((t: any) => {
      const time = t.due_time ? `${formatTime(t.due_time)} — ` : '';
      lines.push(`- ${time}${t.title}${t.linked_label ? ` (${t.linked_label})` : ''} [${t.priority}]`);
    });
    lines.push('');
  }

  if (overdueTasks?.length) {
    lines.push(`OVERDUE TASKS (${overdueTasks.length}):`);
    overdueTasks.forEach((t: any) => {
      const daysAgo = Math.floor((now.getTime() - new Date(t.due_date).getTime()) / 86400000);
      lines.push(`- ${t.title} (${daysAgo} day${daysAgo > 1 ? 's' : ''} overdue)`);
    });
    lines.push('');
  }

  if (upcomingTasks?.length) {
    lines.push(`UPCOMING THIS WEEK (${upcomingTasks.length}):`);
    upcomingTasks.forEach((t: any) => {
      const d = new Date(t.due_date + 'T12:00:00');
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      lines.push(`- ${label}: ${t.title}`);
    });
    lines.push('');
  }

  if (staleEstimates?.length) {
    lines.push(`ESTIMATES NEEDING FOLLOW-UP (${staleEstimates.length}):`);
    staleEstimates.forEach((e: any) => {
      const c = e.customer as any;
      const name = c ? `${c.first_name} ${c.last_name}` : 'Customer';
      const daysAgo = Math.floor((now.getTime() - new Date(e.sent_at).getTime()) / 86400000);
      lines.push(`- ${e.estimate_number} (${name}) — $${(e.total || 0).toLocaleString()} — sent ${daysAgo} days ago`);
    });
    lines.push('');
  }

  if (expiringEstimates?.length) {
    lines.push(`EXPIRING SOON:`);
    expiringEstimates.forEach((e: any) => {
      const c = e.customer as any;
      const name = c ? `${c.first_name} ${c.last_name}` : 'Customer';
      lines.push(`- ${e.estimate_number} (${name}) expires ${e.valid_until}`);
    });
    lines.push('');
  }

  if (unreadEmails?.length) lines.push(`UNREAD EMAILS: ${unreadEmails.length} in inbox`);
  if (newLeads?.length) {
    lines.push(`NEW LEADS SINCE YESTERDAY: ${newLeads.length}`);
    newLeads.forEach((l: any) => lines.push(`- ${l.name} (${l.service_type})`));
  }

  const context = lines.join('\n');

  // Generate AI briefing
  let briefingText = '';
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const grokKey = process.env.GROK_API_KEY;

  const prompt = `You are RO Assistant for RO Unlimited Construction. Generate a concise, energetic morning briefing for the owner. Use the data below. Be specific, use numbers, call out urgency where needed. Format with clear sections using emoji headers. Keep it scannable — no fluff. End with one short motivational line.

${context}`;

  if (grokKey) {
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'grok-4-1-fast', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      });
      if (res.ok) {
        const d = await res.json();
        briefingText = d.choices?.[0]?.message?.content || '';
      }
    } catch { /* fall through */ }
  }

  if (!briefingText && claudeKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      });
      if (res.ok) {
        const d = await res.json();
        briefingText = d.content?.[0]?.text || '';
      }
    } catch { /* fall through */ }
  }

  if (!briefingText) {
    // Fallback: plain text summary
    const taskCount = (todayTasks?.length || 0) + (overdueTasks?.length || 0);
    briefingText = `Good morning! You have ${taskCount} task${taskCount !== 1 ? 's' : ''} to tackle today${overdueTasks?.length ? `, including ${overdueTasks.length} overdue` : ''}. ${staleEstimates?.length ? `${staleEstimates.length} estimate${staleEstimates.length > 1 ? 's' : ''} need follow-up. ` : ''}Let's get to work.`;
  }

  // Store as an admin notification so it shows in the bell
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
  const taskCount = (todayTasks?.length || 0) + (overdueTasks?.length || 0);

  // Save briefing to notifications table
  await supabase.from('admin_notifications').insert({
    type: 'daily_briefing',
    title: `Morning Briefing — ${dayOfWeek}`,
    message: briefingText.slice(0, 500),
    entity_type: 'briefing',
    entity_id: null,
    action_url: '/admin',
    read: false,
  }).catch(() => {});

  // Send push notification (short summary)
  const pushSummary = `${todayTasks?.length || 0} today, ${overdueTasks?.length || 0} overdue${staleEstimates?.length ? `, ${staleEstimates.length} estimates need follow-up` : ''}`;
  await fetch(`${siteUrl}/api/admin/push-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-push-secret': process.env.PUSH_SECRET || '' },
    body: JSON.stringify({
      title: `☀️ Good morning — ${dayOfWeek}`,
      body: pushSummary,
      url: '/admin',
      tag: 'daily-briefing',
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, taskCount, briefing: briefingText.slice(0, 200) });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}
