import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// PATCH — update task (complete, snooze, reschedule, edit fields)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id } = params;

    const allowed = [
      'title', 'description', 'category', 'priority', 'status',
      'due_date', 'due_time', 'remind_at', 'reminder_sent',
      'recurrence_type', 'recurrence_interval', 'recurrence_days', 'recurrence_end_date',
      'linked_type', 'linked_id', 'linked_label', 'tags', 'notes',
      'completed_at', 'snoozed_until',
    ];

    const updates: any = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Auto-set completed_at when marking done
    if (body.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    // Recompute remind_at if due_date/due_time/remind_minutes_before changed
    if ((body.due_date || body.due_time) && body.remind_minutes_before != null) {
      const { data: existing } = await supabase.from('tasks').select('due_date, due_time').eq('id', id).single();
      const dateStr = body.due_date || existing?.due_date;
      const timeStr = body.due_time || existing?.due_time || '09:00';
      if (dateStr) {
        const dt = new Date(`${dateStr}T${timeStr}:00`);
        dt.setMinutes(dt.getMinutes() - body.remind_minutes_before);
        updates.remind_at = dt.toISOString();
        updates.reminder_sent = false;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If completing a recurring task, spawn the next occurrence
    if (body.status === 'done' && data?.recurrence_type && data.recurrence_type !== 'none') {
      await spawnNextRecurrence(supabase, data);
    }

    return NextResponse.json({ task: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — soft delete (set status = cancelled) or hard delete
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { hard } = await req.json().catch(() => ({ hard: false }));

    if (hard) {
      await supabase.from('tasks').delete().eq('id', params.id);
    } else {
      await supabase.from('tasks').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', params.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function spawnNextRecurrence(supabase: any, task: any) {
  if (!task.due_date) return;
  const d = new Date(task.due_date);

  if (task.recurrence_type === 'daily') {
    d.setDate(d.getDate() + (task.recurrence_interval || 1));
  } else if (task.recurrence_type === 'weekdays') {
    do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  } else if (task.recurrence_type === 'weekly') {
    d.setDate(d.getDate() + 7 * (task.recurrence_interval || 1));
  } else if (task.recurrence_type === 'monthly') {
    d.setMonth(d.getMonth() + (task.recurrence_interval || 1));
  } else {
    return;
  }

  const nextDate = d.toISOString().split('T')[0];
  if (task.recurrence_end_date && nextDate > task.recurrence_end_date) return;

  let remind_at = null;
  if (task.remind_at && task.due_date) {
    const diff = new Date(task.remind_at).getTime() - new Date(`${task.due_date}T${task.due_time || '09:00'}`).getTime();
    const nextDt = new Date(`${nextDate}T${task.due_time || '09:00'}`);
    nextDt.setTime(nextDt.getTime() + diff);
    remind_at = nextDt.toISOString();
  }

  await supabase.from('tasks').insert({
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: 'pending',
    due_date: nextDate,
    due_time: task.due_time,
    remind_at,
    reminder_sent: false,
    recurrence_type: task.recurrence_type,
    recurrence_interval: task.recurrence_interval,
    recurrence_days: task.recurrence_days,
    recurrence_end_date: task.recurrence_end_date,
    linked_type: task.linked_type,
    linked_id: task.linked_id,
    linked_label: task.linked_label,
    tags: task.tags,
    notes: task.notes,
    updated_at: new Date().toISOString(),
  });
}
