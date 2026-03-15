import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — list email accounts assigned to this employee
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_email_access')
      .select('*, email_accounts(*)')
      .eq('employee_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[employees/[id]/email-access] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — grant email access to employee
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { email_account_id } = await req.json();

    if (!email_account_id) {
      return NextResponse.json({ error: 'email_account_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_email_access')
      .insert({ employee_id: id, email_account_id })
      .select('*, email_accounts(*)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Employee already has access to this email account' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[employees/[id]/email-access] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — revoke email access from employee
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const emailAccountId = req.nextUrl.searchParams.get('email_account_id');

    if (!emailAccountId) {
      return NextResponse.json({ error: 'email_account_id query param required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('employee_email_access')
      .delete()
      .eq('employee_id', id)
      .eq('email_account_id', emailAccountId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[employees/[id]/email-access] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
