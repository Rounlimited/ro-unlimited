import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — list reviews for employee
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('employee_reviews')
      .select('*')
      .eq('employee_id', params.id)
      .order('review_date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[reviews] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new review
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Calculate overall score from category ratings
    const categories = ['job_knowledge', 'work_quality', 'productivity', 'safety_compliance',
      'attendance', 'teamwork', 'communication', 'initiative', 'leadership', 'professionalism'];
    const scores = categories.map(c => body[c]).filter(Boolean);
    const overall = scores.length > 0 ? parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)) : null;

    const { data, error } = await supabase
      .from('employee_reviews')
      .insert({
        employee_id: params.id,
        review_type: body.review_type || 'quarterly',
        review_period: body.review_period || null,
        review_date: body.review_date || new Date().toISOString().split('T')[0],
        reviewer_name: body.reviewer_name || null,
        job_knowledge: body.job_knowledge || null,
        work_quality: body.work_quality || null,
        productivity: body.productivity || null,
        safety_compliance: body.safety_compliance || null,
        attendance: body.attendance || null,
        teamwork: body.teamwork || null,
        communication: body.communication || null,
        initiative: body.initiative || null,
        leadership: body.leadership || null,
        professionalism: body.professionalism || null,
        overall_score: overall,
        strengths: body.strengths || null,
        improvements: body.improvements || null,
        goals: body.goals || null,
        supervisor_comments: body.supervisor_comments || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update employee's overall_score on profile
    if (overall) {
      await supabase.from('employee_profiles').update({
        performance_score: overall,
        updated_at: new Date().toISOString(),
      }).eq('id', params.id);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[reviews] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove a review
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const reviewId = req.nextUrl.searchParams.get('review_id');
    if (!reviewId) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('employee_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('employee_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
