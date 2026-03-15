import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list all employees, with optional status filter
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const status = req.nextUrl.searchParams.get('status');

    let query = supabase
      .from('employee_profiles')
      .select('*, employee_email_access(count)')
      .order('last_name', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[employees] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new employee profile with optional email access
export async function POST(req: NextRequest) {
  try {
    const {
      first_name,
      last_name,
      phone,
      title,
      department,
      hire_date,
      pay_rate,
      pay_type,
      employment_type,
      email_access,
      notes,
    } = await req.json();

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Create employee profile
    const { data: profile, error: profileError } = await supabase
      .from('employee_profiles')
      .insert({
        first_name,
        last_name,
        phone: phone || null,
        title: title || null,
        department: department || null,
        hire_date: hire_date || null,
        pay_rate: pay_rate || null,
        pay_type: pay_type || null,
        employment_type: employment_type || null,
        notes: notes || null,
        status: 'active',
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Grant email access if provided
    if (email_access && Array.isArray(email_access) && email_access.length > 0) {
      const rows = email_access.map((email_account_id: string) => ({
        employee_id: profile.id,
        email_account_id,
      }));

      const { error: accessError } = await supabase
        .from('employee_email_access')
        .insert(rows);

      if (accessError) {
        console.error('[employees] email access insert error:', accessError);
      }
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error('[employees] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — terminate an employee (soft delete via status change)
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 });

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_profiles')
      .update({ status: 'terminated', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[employees] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
