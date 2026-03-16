import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { token: string } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = params;
    const supabase = createAdminClient();

    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('*, customer:customers(first_name, last_name, company_name, email, phone)')
      .eq('share_token', token)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: 'Estimate not found or link expired' }, { status: 404 });
    }

    // Check expiration
    if (estimate.share_token_expires_at && new Date(estimate.share_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This estimate link has expired' }, { status: 410 });
    }

    // Remap project_description
    estimate.scope_of_work = estimate.project_description;

    // Fetch related data
    const [{ data: lineItems }, { data: paymentSchedule }, disclaimerResult] = await Promise.all([
      supabase.from('estimate_line_items').select('*').eq('estimate_id', estimate.id).order('phase').order('sort_order'),
      supabase.from('estimate_payment_schedules').select('*').eq('estimate_id', estimate.id).order('sort_order'),
      estimate.disclaimer_ids?.length
        ? supabase.from('disclaimers').select('id, title, body').in('id', estimate.disclaimer_ids)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Mark as viewed if currently sent
    if (estimate.status === 'sent') {
      const now = new Date().toISOString();
      await supabase.from('estimates').update({ status: 'viewed', viewed_at: now }).eq('id', estimate.id);
      await supabase.from('estimate_status_history').insert({
        estimate_id: estimate.id,
        old_status: 'sent',
        new_status: 'viewed',
        notes: 'Customer opened estimate link',
      });
    }

    // Strip sensitive fields
    const {
      share_token: _st,
      share_token_expires_at: _ste,
      notes: _n,
      internal_notes: _in,
      ...safeEstimate
    } = estimate;

    return NextResponse.json({
      ...safeEstimate,
      line_items: lineItems || [],
      payment_schedule: paymentSchedule || [],
      disclaimers: disclaimerResult?.data || [],
    });
  } catch (err) {
    console.error('[estimate/token] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
