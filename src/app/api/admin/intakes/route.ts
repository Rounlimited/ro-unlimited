import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

// GET — list all intakes
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const status = req.nextUrl.searchParams.get('status');

    let query = supabase
      .from('employee_intakes')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[intakes] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new intake (minimal or full info)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = randomBytes(20).toString('hex');

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('employee_intakes')
      .insert({
        token,
        candidate_name: body.candidate_name || null,
        candidate_phone: body.candidate_phone || null,
        position_title: body.position_title || null,
        department: body.department || null,
        employment_type: body.employment_type || null,
        required_sections: body.required_sections || ['personal', 'employment', 'certifications', 'documents', 'agreements'],
        created_by: body.created_by || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    return NextResponse.json({ ...data, intake_url: `${siteUrl}/intake/${token}` });
  } catch (err) {
    console.error('[intakes] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
