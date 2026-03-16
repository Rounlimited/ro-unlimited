import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

type RouteContext = { params: { id: string } };

// POST — generate or return existing share link
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Check if estimate already has a valid share token
    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('share_token, share_token_expires_at, estimate_number')
      .eq('id', id)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    let token = estimate.share_token;
    const now = new Date();
    const expiresAt = estimate.share_token_expires_at
      ? new Date(estimate.share_token_expires_at)
      : null;

    // Generate new token if none exists or expired
    if (!token || !expiresAt || expiresAt < now) {
      token = crypto.randomBytes(16).toString('hex');
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 60);

      await supabase.from('estimates').update({
        share_token: token,
        share_token_expires_at: newExpiry.toISOString(),
      }).eq('id', id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    const link = `${baseUrl}/estimate/${token}`;

    return NextResponse.json({ link, token });
  } catch (err) {
    console.error('[share-link] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
