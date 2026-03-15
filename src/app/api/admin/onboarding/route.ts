import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — fetch onboarding record for a user (upsert if not exists)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Try to fetch existing record
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If record exists, return it
    if (data) {
      return NextResponse.json({ onboarding: data });
    }

    // Otherwise create a new record with defaults
    const { data: newRecord, error: insertError } = await supabase
      .from('user_onboarding')
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ onboarding: newRecord });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update onboarding fields for a user
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

    // For tours_completed, merge with existing values
    if (fields.tours_completed && typeof fields.tours_completed === 'object') {
      const { data: current } = await supabase
        .from('user_onboarding')
        .select('tours_completed')
        .eq('user_id', user_id)
        .maybeSingle();

      const existingTours = (current?.tours_completed as Record<string, boolean>) || {};
      updatePayload.tours_completed = { ...existingTours, ...fields.tours_completed };
      delete fields.tours_completed;
    }

    // For help_articles_viewed, merge unique article IDs with existing
    if (fields.help_articles_viewed !== undefined) {
      if (Array.isArray(fields.help_articles_viewed)) {
        const { data: current } = await supabase
          .from('user_onboarding')
          .select('help_articles_viewed')
          .eq('user_id', user_id)
          .maybeSingle();

        const existingArticles = (current?.help_articles_viewed as string[]) || [];
        const merged = [...new Set([...existingArticles, ...fields.help_articles_viewed])];
        updatePayload.help_articles_viewed = merged;
      }
      delete fields.help_articles_viewed;
    }

    // Whitelist simple boolean fields
    const allowedFields = [
      'welcome_completed',
      'first_estimate_created',
      'first_template_created',
      'first_customer_added',
      'onboarding_dismissed',
    ];

    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updatePayload[key] = fields[key];
      }
    }

    const { data, error } = await supabase
      .from('user_onboarding')
      .update(updatePayload)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      // No row found — upsert: create then return
      if (error.code === 'PGRST116') {
        const { data: upserted, error: upsertErr } = await supabase
          .from('user_onboarding')
          .upsert({ user_id, ...updatePayload })
          .select()
          .single();

        if (upsertErr) {
          return NextResponse.json({ error: upsertErr.message }, { status: 500 });
        }
        return NextResponse.json({ onboarding: upserted });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ onboarding: data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
