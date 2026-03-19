import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — fetch preferences for a user (auto-create defaults if none exist)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ preferences: data });
    }

    // Create defaults for new user
    const { data: newRecord, error: insertError } = await supabase
      .from('user_preferences')
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: newRecord });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update preference fields for a user
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, ...fields } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updatePayload: Record<string, unknown> = {};

    // For JSONB fields, merge with existing values
    for (const jsonbField of ['feature_flags', 'custom_settings']) {
      if (fields[jsonbField] && typeof fields[jsonbField] === 'object') {
        const { data: current } = await supabase
          .from('user_preferences')
          .select(jsonbField)
          .eq('user_id', user_id)
          .maybeSingle();

        const existing = (current?.[jsonbField] as Record<string, unknown>) || {};
        updatePayload[jsonbField] = { ...existing, ...fields[jsonbField] };
        delete fields[jsonbField];
      }
    }

    // Whitelist simple fields
    const allowedFields = [
      'theme', 'font_size', 'animations_enabled', 'compact_mode',
      'push_notifications', 'email_notifications',
    ];

    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updatePayload[key] = fields[key];
      }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updatePayload)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: upserted, error: upsertErr } = await supabase
          .from('user_preferences')
          .upsert({ user_id, ...updatePayload })
          .select()
          .single();

        if (upsertErr) {
          return NextResponse.json({ error: upsertErr.message }, { status: 500 });
        }
        return NextResponse.json({ preferences: upserted });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
