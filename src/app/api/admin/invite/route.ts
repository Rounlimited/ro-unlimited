import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate invite link — user clicks it and sets their own password
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { role: role || 'admin' },
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://rounlimited.nexavisiongroup.com' : 'http://localhost:3000'}/admin`,
      },
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      // The invite link from Supabase
      inviteLink: data?.properties?.action_link || null,
      email,
    });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: error.message || 'Invite failed' }, { status: 500 });
  }
}

// List all users
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || 'admin',
      name: u.user_metadata?.name || null,
      lastSignIn: u.last_sign_in_at,
      createdAt: u.created_at,
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
