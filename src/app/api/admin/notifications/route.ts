import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list notifications (unread by default)
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const unreadOnly = req.nextUrl.searchParams.get('unread') !== 'false';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also get unread count
    const { count } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    return NextResponse.json({ notifications: data || [], unread_count: count || 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { ids, all } = await req.json();
    const supabase = createAdminClient();

    if (all) {
      await supabase.from('admin_notifications').update({ read: true }).eq('read', false);
    } else if (ids?.length) {
      await supabase.from('admin_notifications').update({ read: true }).in('id', ids);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
