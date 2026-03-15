import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — list skills for employee
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('employee_skills')
      .select('*')
      .eq('employee_id', params.id)
      .order('category')
      .order('skill_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — add or update a skill (upsert by employee_id + skill_name)
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { skill_name, category, proficiency, assessed_by, notes } = await req.json();
    if (!skill_name) return NextResponse.json({ error: 'skill_name required' }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('employee_skills')
      .upsert({
        employee_id: params.id,
        skill_name,
        category: category || 'general',
        proficiency: proficiency || 1,
        assessed_date: new Date().toISOString().split('T')[0],
        assessed_by: assessed_by || null,
        notes: notes || null,
      }, { onConflict: 'employee_id,skill_name' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove a skill
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const skillId = req.nextUrl.searchParams.get('skill_id');
    if (!skillId) return NextResponse.json({ error: 'skill_id required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('employee_skills')
      .delete()
      .eq('id', skillId)
      .eq('employee_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
