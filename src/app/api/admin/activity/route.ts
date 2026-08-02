import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser, roleOf } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST — log a page view or action (requires a logged-in session)
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user_id, user_email, action, page, details, user_agent } = await req.json();
    if (!user_email || !action) {
      return NextResponse.json({ error: 'Missing user_email or action' }, { status: 400 });
    }
    const supabase = createAdminClient();
    await supabase.from('user_activity').insert({
      user_id: user_id || null,
      user_email,
      action,
      page: page || null,
      details: details || {},
      user_agent: user_agent || null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Activity log error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// GET — fetch activity (super_admin only, verified from the real session)
export async function GET(req: NextRequest) {
  try {
    const viewer = await getServerUser();
    if (!viewer || roleOf(viewer) !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const supabase = createAdminClient();
    const { data: { users } } = await supabase.auth.admin.listUsers();

    const days = parseInt(req.nextUrl.searchParams.get('days') || '7');
    const userFilter = req.nextUrl.searchParams.get('user_email');
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let query = supabase
      .from('user_activity')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);

    if (userFilter) {
      query = query.eq('user_email', userFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Also get push subscription info
    const { data: pushSubs } = await supabase
      .from('push_subscriptions')
      .select('*');

    // Get all admin users for context
    const allUsers = users?.map(u => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || 'admin',
      name: u.user_metadata?.name || u.email?.split('@')[0],
      last_sign_in: u.last_sign_in_at,
      created_at: u.created_at,
    })) || [];

    return NextResponse.json({
      activity: data || [],
      push_subscriptions: pushSubs || [],
      users: allUsers,
    });
  } catch (err) {
    console.error('Activity fetch error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
