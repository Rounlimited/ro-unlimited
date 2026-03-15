import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — single intake detail
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('employee_intakes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update status (reviewed/rejected)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.status) updates.status = body.status;
    if (body.reviewed_by) updates.reviewed_by = body.reviewed_by;
    if (body.review_notes !== undefined) updates.review_notes = body.review_notes;
    if (body.status === 'reviewed' || body.status === 'rejected') updates.reviewed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('employee_intakes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — approve intake → convert to employee profile
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();

    // Get the intake
    const { data: intake, error: fetchErr } = await supabase
      .from('employee_intakes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchErr || !intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 });

    const p = intake.personal_info || {};
    const e = intake.employment_info || {};
    const c = intake.certifications_info || {};

    // Create employee profile
    const { data: profile, error: profileErr } = await supabase
      .from('employee_profiles')
      .insert({
        first_name: p.first_name || intake.candidate_name?.split(' ')[0] || 'Unknown',
        last_name: p.last_name || intake.candidate_name?.split(' ').slice(1).join(' ') || '',
        phone: p.phone || intake.candidate_phone || null,
        personal_email: p.email || null,
        date_of_birth: p.date_of_birth || null,
        address: p.address_street || null,
        city: p.address_city || null,
        state: p.address_state || null,
        zip: p.address_zip || null,
        emergency_contact_name: p.emergency_contact_name || null,
        emergency_contact_phone: p.emergency_contact_phone || null,
        emergency_contact_relation: p.emergency_contact_relationship || null,
        title: intake.position_title || e.trade_primary || null,
        department: intake.department || null,
        employment_type: intake.employment_type || e.employment_type || null,
        trade: e.trade_primary || null,
        languages: e.languages_spoken || null,
        drivers_license_number: c.drivers_license_number || null,
        drivers_license_state: c.drivers_license_state || null,
        drivers_license_expiry: c.drivers_license_expiry || null,
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: `Created from intake form. Previous employer: ${e.previous_employer || 'N/A'}. Years exp: ${e.years_experience || 'N/A'}.`,
      })
      .select()
      .single();

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    // Create document records from uploaded files
    const files = intake.uploaded_files || [];
    if (files.length > 0) {
      const docRows = files.map((f: any) => ({
        employee_id: profile.id,
        name: f.name || 'Uploaded document',
        doc_type: f.category || 'other',
        file_url: f.url,
        notes: `Uploaded during intake on ${new Date(intake.submitted_at || intake.created_at).toLocaleDateString()}`,
      }));
      await supabase.from('employee_documents').insert(docRows);
    }

    // Update intake status
    await supabase.from('employee_intakes').update({
      status: 'approved',
      employee_id: profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', params.id);

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: profile.user_id || '00000000-0000-0000-0000-000000000000',
      action: 'intake_approved',
      details: { intake_id: params.id, employee_name: `${profile.first_name} ${profile.last_name}` },
    });

    // Create notification
    await supabase.from('admin_notifications').insert({
      type: 'intake_approved',
      title: 'Intake Approved',
      body: `${profile.first_name} ${profile.last_name} is now an active employee`,
      url: `/admin/employees/${profile.id}`,
      reference_id: profile.id,
    });

    return NextResponse.json({ ok: true, employee_id: profile.id, profile });
  } catch (err) {
    console.error('[intakes] PUT approve error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
