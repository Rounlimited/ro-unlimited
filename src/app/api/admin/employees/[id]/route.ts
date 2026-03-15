import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — full employee detail with related data
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('employee_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch related data in parallel
    const [emailResult, docsResult, equipResult, activityResult] = await Promise.all([
      supabase
        .from('employee_email_access')
        .select('*, email_accounts(*)')
        .eq('employee_id', id),
      supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('employee_equipment')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_log')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({
      ...profile,
      email_access: emailResult.data || [],
      documents: docsResult.data || [],
      equipment: equipResult.data || [],
      activity_log: activityResult.data || [],
    });
  } catch (err) {
    console.error('[employees/[id]] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update employee profile fields
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();

    // Remove fields that shouldn't be directly updated
    delete body.id;
    delete body.created_at;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_profiles')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[employees/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — change employee status with activity log entry
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { status } = await req.json();

    const validStatuses = ['active', 'suspended', 'terminated'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current status for the log
    const { data: current } = await supabase
      .from('employee_profiles')
      .select('status')
      .eq('id', id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Update status
    const { data, error } = await supabase
      .from('employee_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log the status change
    await supabase.from('activity_log').insert({
      employee_id: id,
      action: 'status_change',
      details: `Status changed from "${current.status}" to "${status}"`,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[employees/[id]] PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
