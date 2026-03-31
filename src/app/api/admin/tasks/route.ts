import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — list tasks with optional filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = req.nextUrl;
    const filter = searchParams.get('filter') || 'all'; // today, overdue, upcoming, all
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // pending, done, snoozed, all
    const limit = parseInt(searchParams.get('limit') || '100');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('due_time', { ascending: true, nullsFirst: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (!status) {
      // Default: exclude done/cancelled
      query = query.not('status', 'in', '("done","cancelled")');
    }

    // Date filter
    if (filter === 'today') {
      query = query.or(`due_date.eq.${todayStr},due_date.lt.${todayStr}`);
    } else if (filter === 'overdue') {
      query = query.lt('due_date', todayStr);
    } else if (filter === 'upcoming') {
      query = query.gt('due_date', todayStr).lte('due_date', weekFromNow);
    }

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Separate overdue from today for UI convenience
    const tasks = data || [];
    const overdue = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'done');
    const dueToday = tasks.filter(t => t.due_date === todayStr);
    const upcoming = tasks.filter(t => t.due_date && t.due_date > todayStr);
    const noDueDate = tasks.filter(t => !t.due_date);

    return NextResponse.json({ tasks, overdue, dueToday, upcoming, noDueDate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create a task
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();

    const {
      title, description, category = 'general', priority = 'medium',
      due_date, due_time, remind_minutes_before,
      recurrence_type = 'none', recurrence_interval = 1, recurrence_days, recurrence_end_date,
      linked_type, linked_id, linked_label, tags, notes,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    // Compute remind_at from due_date + due_time - remind_minutes_before
    let remind_at: string | null = null;
    if (due_date && remind_minutes_before != null) {
      const timeStr = due_time || '09:00';
      const dt = new Date(`${due_date}T${timeStr}:00`);
      dt.setMinutes(dt.getMinutes() - (remind_minutes_before || 0));
      remind_at = dt.toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description || null,
        category,
        priority,
        status: 'pending',
        due_date: due_date || null,
        due_time: due_time || null,
        remind_at,
        reminder_sent: false,
        recurrence_type,
        recurrence_interval,
        recurrence_days: recurrence_days || null,
        recurrence_end_date: recurrence_end_date || null,
        linked_type: linked_type || null,
        linked_id: linked_id || null,
        linked_label: linked_label || null,
        tags: tags || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
