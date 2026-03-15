import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { token: string } };

// GET — validate token and return form config (PUBLIC — no auth)
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('employee_intakes')
      .select('id, token, status, candidate_name, candidate_phone, position_title, department, employment_type, required_sections, personal_info, employment_info, certifications_info, documents_info, agreements_info, uploaded_files, current_step, expires_at')
      .eq('token', params.token)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // Check if already submitted/approved
    if (data.status === 'approved') {
      return NextResponse.json({ error: 'This application has already been approved' }, { status: 410 });
    }
    if (data.status === 'submitted') {
      return NextResponse.json({ status: 'submitted', message: 'Your application has been submitted and is under review' });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — auto-save step data (PUBLIC — no auth)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
      status: 'in_progress',
    };

    if (body.current_step !== undefined) updates.current_step = body.current_step;
    if (body.personal_info) updates.personal_info = body.personal_info;
    if (body.employment_info) updates.employment_info = body.employment_info;
    if (body.certifications_info) updates.certifications_info = body.certifications_info;
    if (body.documents_info) updates.documents_info = body.documents_info;
    if (body.agreements_info) updates.agreements_info = body.agreements_info;
    if (body.uploaded_files) updates.uploaded_files = body.uploaded_files;
    // Update candidate name if they filled it in
    if (body.personal_info?.first_name) {
      updates.candidate_name = `${body.personal_info.first_name} ${body.personal_info.last_name || ''}`.trim();
    }

    const { error } = await supabase
      .from('employee_intakes')
      .update(updates)
      .eq('token', params.token);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — final submit (PUBLIC — no auth)
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();

    // Get the intake to verify it exists and is valid
    const { data: intake, error: fetchErr } = await supabase
      .from('employee_intakes')
      .select('id, candidate_name, status')
      .eq('token', params.token)
      .single();

    if (fetchErr || !intake) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
    if (intake.status === 'submitted' || intake.status === 'approved') {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
    }

    // Mark as submitted
    await supabase.from('employee_intakes').update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('token', params.token);

    // Create admin notification
    await supabase.from('admin_notifications').insert({
      type: 'intake_submitted',
      title: 'New Intake Submission',
      body: `${intake.candidate_name || 'A candidate'} submitted their onboarding form`,
      url: `/admin/intakes/${intake.id}`,
      reference_id: intake.id,
    });

    // Send push notification
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      await fetch(`${siteUrl}/api/admin/push-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-push-secret': process.env.PUSH_SECRET || '' },
        body: JSON.stringify({
          title: 'New Intake Submission',
          body: `${intake.candidate_name || 'A candidate'} submitted their onboarding form`,
          url: `/admin/intakes/${intake.id}`,
          tag: 'intake-' + intake.id,
        }),
      });
    } catch {}

    return NextResponse.json({ ok: true, message: 'Application submitted successfully' });
  } catch (err) {
    console.error('[intake] POST submit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
