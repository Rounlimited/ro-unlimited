import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Called by Vercel cron (vercel.json) — checks for stale estimates and creates notifications
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.PUSH_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Find estimates sent >3 days ago with no status change
  const { data: staleEstimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, project_name, total, sent_at, status, customer:customers(first_name, last_name, email)')
    .eq('status', 'sent')
    .lt('sent_at', threeDaysAgo.toISOString())
    .order('sent_at', { ascending: true });

  // Find estimates viewed but not accepted >3 days
  const { data: viewedEstimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, project_name, total, viewed_at, status, customer:customers(first_name, last_name, email)')
    .eq('status', 'viewed')
    .lt('viewed_at', threeDaysAgo.toISOString())
    .order('viewed_at', { ascending: true });

  // Find estimates expiring within 7 days
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: expiringEstimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, project_name, total, valid_until, status, customer:customers(first_name, last_name)')
    .in('status', ['sent', 'viewed'])
    .not('valid_until', 'is', null)
    .lt('valid_until', weekFromNow.toISOString())
    .gt('valid_until', now.toISOString());

  const notifications: { type: string; title: string; message: string; entity_type: string; entity_id: string; action_url: string }[] = [];

  // Stale sent estimates
  for (const e of staleEstimates || []) {
    const customer = e.customer as any;
    const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Customer';
    const daysSent = Math.floor((now.getTime() - new Date(e.sent_at!).getTime()) / (24 * 60 * 60 * 1000));

    // Check if we already sent this notification today
    const { data: existing } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('entity_id', e.id)
      .eq('type', 'follow_up')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (!existing?.length) {
      notifications.push({
        type: 'follow_up',
        title: `Follow up: ${name}`,
        message: `${e.project_name} ($${(e.total || 0).toLocaleString()}) was sent ${daysSent} days ago with no response.`,
        entity_type: 'estimate',
        entity_id: e.id,
        action_url: `/admin/estimates/${e.id}`,
      });
    }
  }

  // Viewed but not accepted
  for (const e of viewedEstimates || []) {
    const customer = e.customer as any;
    const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Customer';

    const { data: existing } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('entity_id', e.id)
      .eq('type', 'hot_lead')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (!existing?.length) {
      notifications.push({
        type: 'hot_lead',
        title: `Hot lead: ${name}`,
        message: `Viewed ${e.project_name} ($${(e.total || 0).toLocaleString()}) but hasn't accepted yet.`,
        entity_type: 'estimate',
        entity_id: e.id,
        action_url: `/admin/estimates/${e.id}`,
      });
    }
  }

  // Expiring soon
  for (const e of expiringEstimates || []) {
    const customer = e.customer as any;
    const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Customer';
    const daysLeft = Math.ceil((new Date(e.valid_until!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    const { data: existing } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('entity_id', e.id)
      .eq('type', 'expiring')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (!existing?.length) {
      notifications.push({
        type: 'expiring',
        title: `Expiring: ${name}`,
        message: `${e.project_name} expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`,
        entity_type: 'estimate',
        entity_id: e.id,
        action_url: `/admin/estimates/${e.id}`,
      });
    }
  }

  // Insert notifications
  if (notifications.length > 0) {
    await supabase.from('admin_notifications').insert(notifications);

    // Send push notification if any follow-ups
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      await fetch(`${siteUrl}/api/admin/push-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-push-secret': process.env.PUSH_SECRET || '',
        },
        body: JSON.stringify({
          title: `${notifications.length} estimate${notifications.length > 1 ? 's' : ''} need attention`,
          body: notifications[0].message,
          url: '/admin',
          tag: 'follow-up-' + now.toISOString().split('T')[0],
        }),
      });
    } catch {}
  }

  return NextResponse.json({
    checked: {
      stale: staleEstimates?.length || 0,
      viewed: viewedEstimates?.length || 0,
      expiring: expiringEstimates?.length || 0,
    },
    notifications_created: notifications.length,
  });
}
