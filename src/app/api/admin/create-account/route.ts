import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — create a Supabase auth account for an employee
export async function POST(req: NextRequest) {
  try {
    const { email, password, role, intake_id, employee_id } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role || 'employee' },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Link to employee profile if provided
    if (employee_id && authData.user) {
      const supabase = createAdminClient();
      await supabase.from('employee_profiles').update({
        user_id: authData.user.id,
        work_email: email,
        updated_at: new Date().toISOString(),
      }).eq('id', employee_id);
    }

    // Log the account creation
    if (authData.user) {
      const supabase = createAdminClient();
      await supabase.from('activity_log').insert({
        user_id: authData.user.id,
        action: 'account_created',
        details: { email, role: role || 'employee', intake_id, employee_id },
      });
    }

    return NextResponse.json({ ok: true, user_id: authData.user?.id });
  } catch (err) {
    console.error('[create-account] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
