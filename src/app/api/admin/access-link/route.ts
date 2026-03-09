import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sanityWriteClient, sanityClient } from '@/lib/sanity/client';
import crypto from 'crypto';

// POST — generate a 24-hour magic access link for the current developer account
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate a Supabase magic link for this user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (error || !data?.properties?.hashed_token) {
      throw error || new Error('Failed to generate magic link');
    }

    // The hashed_token from Supabase is what we'll use to construct the verify URL
    const supabaseToken = data.properties.hashed_token;

    // Create our own short-lived wrapper token stored in Sanity
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await sanityWriteClient.createOrReplace({
      _id: `access-${token}`,
      _type: 'inviteToken',        // reuse inviteToken type — same schema works
      token,
      role: 'access_link',
      label: `Access link for ${email}`,
      used: false,
      expiresAt,
      createdAt: new Date().toISOString(),
      // Store the supabase token to exchange on use
      supabaseToken,
      email,
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    const accessLink = `${baseUrl}/admin/access/${token}`;

    return NextResponse.json({ success: true, accessLink, expiresAt });
  } catch (error: any) {
    console.error('Generate access link error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate access link' }, { status: 500 });
  }
}

// GET — validate/exchange an access token (called by the access page)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const record = await sanityClient.fetch(
      `*[_type == "inviteToken" && token == $token && !used && role == "access_link"][0]`,
      { token }
    );

    if (!record) {
      return NextResponse.json({ error: 'Invalid or already used access link' }, { status: 404 });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This access link has expired' }, { status: 410 });
    }

    // Mark as used immediately (single use)
    await sanityWriteClient.patch(`access-${token}`).set({
      used: true,
      usedAt: new Date().toISOString(),
    }).commit();

    return NextResponse.json({
      valid: true,
      supabaseToken: record.supabaseToken,
      email: record.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
