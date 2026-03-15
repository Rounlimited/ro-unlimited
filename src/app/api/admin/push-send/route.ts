import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:build@rounlimited.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Send push notification to all subscribed devices
export async function POST(req: NextRequest) {
  try {
    // Simple auth check — only allow from internal calls with secret
    const authHeader = req.headers.get('x-push-secret');
    if (authHeader !== process.env.PUSH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url, tag } = await req.json();

    // Get all push subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, subscription_json');

    if (error || !subs?.length) {
      return NextResponse.json({ sent: 0, error: error?.message });
    }

    const payload = JSON.stringify({ title, body, url, tag });

    // Send to all subscriptions, clean up expired ones
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const subscription = JSON.parse(sub.subscription_json);
          await webpush.sendNotification(subscription, payload);
          return 'sent';
        } catch (err: any) {
          // 410 Gone = subscription expired, clean it up
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            return 'expired';
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value === 'sent').length;
    const expired = results.filter((r) => r.status === 'fulfilled' && r.value === 'expired').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ sent, expired, failed });
  } catch (err) {
    console.error('[Push] Send error:', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
