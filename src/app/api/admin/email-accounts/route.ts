import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — return email accounts (filtered by role for employees)
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const userId = req.nextUrl.searchParams.get('user_id');
    const role = req.nextUrl.searchParams.get('role');

    // Fetch all active accounts
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('active', true)
      .order('is_default', { ascending: false })
      .order('email');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If employee role, filter to only assigned accounts
    if (role === 'employee' && userId) {
      const { data: access } = await supabase
        .from('employee_email_access')
        .select('email_account_id')
        .eq('user_id', userId);

      const allowedIds = new Set((access || []).map(a => a.email_account_id));
      const filtered = (accounts || []).filter(a => allowedIds.has(a.id));
      return NextResponse.json(filtered);
    }

    return NextResponse.json(accounts || []);
  } catch (err) {
    console.error('[email-accounts] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new email account (admin/super_admin only)
export async function POST(req: NextRequest) {
  try {
    const { email, display_name, color, initials } = await req.json();

    if (!email || !email.endsWith('@rounlimited.com')) {
      return NextResponse.json({ error: 'Email must end with @rounlimited.com' }, { status: 400 });
    }
    if (!display_name || !initials) {
      return NextResponse.json({ error: 'display_name and initials are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('email_accounts')
      .insert({
        email: email.toLowerCase(),
        display_name,
        color: color || '#C9A84C',
        initials: initials.toUpperCase().slice(0, 2),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email account already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[email-accounts] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update account display_name/color/initials
export async function PATCH(req: NextRequest) {
  try {
    const { id, display_name, color, initials } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    const updates: Record<string, any> = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (color !== undefined) updates.color = color;
    if (initials !== undefined) updates.initials = initials.toUpperCase().slice(0, 2);

    const { data, error } = await supabase
      .from('email_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — soft-delete (deactivate) an email account
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('email_accounts')
      .update({ active: false })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
