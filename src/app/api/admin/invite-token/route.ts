import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sanityWriteClient, sanityClient } from '@/lib/sanity/client';
import crypto from 'crypto';

// POST - Create a new invite token (no email needed)
export async function POST(req: NextRequest) {
  try {
    const { role, label } = await req.json();
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Store token in Sanity
    await sanityWriteClient.createOrReplace({
      _id: `invite-${token}`,
      _type: 'inviteToken',
      token,
      role: role || 'admin',
      label: label || '',
      used: false,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.nexavisiongroup.com';
    const inviteLink = `${baseUrl}/admin/join/${token}`;

    return NextResponse.json({ success: true, inviteLink, token, expiresAt });
  } catch (error: any) {
    console.error('Create invite token error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invite' }, { status: 500 });
  }
}

// GET - Validate a token (used by the join page)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const invite = await sanityClient.fetch(
      `*[_type == "inviteToken" && token == $token && !used][0]`,
      { token }
    );

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    return NextResponse.json({ valid: true, role: invite.role, label: invite.label });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Redeem a token (create the user account)
export async function PUT(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Token, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Validate token in Sanity
    const invite = await sanityClient.fetch(
      `*[_type == "inviteToken" && token == $token && !used][0]`,
      { token }
    );

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or already used invite link' }, { status: 404 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    // Create user in Supabase with admin API (bypasses signup disabled)
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can log in immediately
      user_metadata: { role: invite.role },
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists. Try signing in instead.' }, { status: 409 });
      }
      throw error;
    }

    // Mark token as used
    await sanityWriteClient.patch(`invite-${token}`).set({
      used: true,
      usedBy: email,
      usedAt: new Date().toISOString(),
    }).commit();

    return NextResponse.json({ success: true, email });
  } catch (error: any) {
    console.error('Redeem invite error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 });
  }
}
