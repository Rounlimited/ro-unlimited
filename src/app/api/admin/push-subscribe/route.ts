import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Save push subscription
export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    // Upsert by endpoint (unique per device/browser)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys?.p256dh || '',
          keys_auth: subscription.keys?.auth || '',
          subscription_json: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('[Push] Save subscription error:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Push] Subscribe error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
