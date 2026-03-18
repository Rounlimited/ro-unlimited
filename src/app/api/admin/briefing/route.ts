import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel
  const [
    { data: estimates },
    { data: recentEmails },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('estimates')
      .select('id, estimate_number, project_name, total, status, sent_at, viewed_at, created_at, customer:customers(first_name, last_name, company_name)')
      .not('status', 'eq', 'revised')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('email_messages')
      .select('id, direction, from_email, subject, read, created_at')
      .eq('direction', 'inbound')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('activity_log')
      .select('action, details, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const allEstimates = estimates || [];
  const unreadEmails = recentEmails || [];

  // Estimate stats
  const drafts = allEstimates.filter(e => e.status === 'draft');
  const sent = allEstimates.filter(e => e.status === 'sent');
  const viewed = allEstimates.filter(e => e.status === 'viewed');
  const accepted = allEstimates.filter(e => e.status === 'accepted');
  const declined = allEstimates.filter(e => e.status === 'declined');

  // Pipeline value (drafts + sent + viewed)
  const pipelineValue = [...drafts, ...sent, ...viewed].reduce((sum, e) => sum + (e.total || 0), 0);
  const acceptedValue = accepted.reduce((sum, e) => sum + (e.total || 0), 0);

  // Follow-ups needed: sent >3 days ago, no response
  const needsFollowUp = sent.filter(e => {
    if (!e.sent_at) return false;
    return new Date(e.sent_at) < threeDaysAgo;
  });

  // Viewed but not accepted: customer is interested
  const hotLeads = viewed.filter(e => {
    if (!e.viewed_at) return false;
    return new Date(e.viewed_at) > sevenDaysAgo;
  });

  // Build briefing items
  const items: { type: 'action' | 'info' | 'alert'; icon: string; text: string; link?: string }[] = [];

  // Unread emails
  if (unreadEmails.length > 0) {
    items.push({
      type: 'action',
      icon: '📧',
      text: `**${unreadEmails.length} unread email${unreadEmails.length > 1 ? 's'  : ''}** waiting in your inbox`,
      link: '/admin/inbox',
    });
  }

  // Follow-ups
  if (needsFollowUp.length > 0) {
    for (const e of needsFollowUp.slice(0, 3)) {
      const customer = e.customer as any;
      const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
      const daysSent = Math.floor((now.getTime() - new Date(e.sent_at!).getTime()) / (24 * 60 * 60 * 1000));
      items.push({
        type: 'alert',
        icon: '⏰',
        text: `**${name}** — ${e.project_name} ($${(e.total || 0).toLocaleString()}) sent ${daysSent} days ago, no response`,
        link: `/admin/estimates/${e.id}`,
      });
    }
    if (needsFollowUp.length > 3) {
      items.push({ type: 'alert', icon: '⏰', text: `+ ${needsFollowUp.length - 3} more estimates need follow-up` });
    }
  }

  // Hot leads (viewed recently)
  if (hotLeads.length > 0) {
    for (const e of hotLeads.slice(0, 2)) {
      const customer = e.customer as any;
      const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
      items.push({
        type: 'info',
        icon: '🔥',
        text: `**${name}** viewed ${e.project_name} ($${(e.total || 0).toLocaleString()}) — consider reaching out`,
        link: `/admin/estimates/${e.id}`,
      });
    }
  }

  // Drafts reminder
  if (drafts.length > 0) {
    items.push({
      type: 'info',
      icon: '📝',
      text: `**${drafts.length} draft estimate${drafts.length > 1 ? 's' : ''}** not yet sent`,
      link: '/admin/estimates',
    });
  }

  // Pipeline summary
  items.push({
    type: 'info',
    icon: '💰',
    text: `Pipeline: **$${pipelineValue.toLocaleString()}** across ${sent.length + viewed.length + drafts.length} active estimates`,
  });

  if (accepted.length > 0) {
    items.push({
      type: 'info',
      icon: '✅',
      text: `Won: **$${acceptedValue.toLocaleString()}** across ${accepted.length} accepted estimate${accepted.length > 1 ? 's' : ''}`,
    });
  }

  // No activity check
  if (items.length <= 2) {
    items.unshift({
      type: 'info',
      icon: '☀️',
      text: 'All caught up! No urgent items today.',
    });
  }

  return NextResponse.json({
    briefing: items,
    stats: {
      unreadEmails: unreadEmails.length,
      drafts: drafts.length,
      sent: sent.length,
      viewed: viewed.length,
      accepted: accepted.length,
      declined: declined.length,
      needsFollowUp: needsFollowUp.length,
      pipelineValue,
      acceptedValue,
    },
  });
}
