import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['viewed', 'accepted', 'declined', 'expired', 'revised'],
  viewed: ['accepted', 'declined', 'expired', 'revised'],
  accepted: ['revised'],
  declined: ['revised'],
  expired: ['revised'],
  revised: ['sent'],
};

// Timestamp field for each status
const STATUS_TIMESTAMPS: Record<string, string> = {
  sent: 'sent_at',
  viewed: 'viewed_at',
  accepted: 'accepted_at',
  declined: 'declined_at',
};

// PATCH — update estimate status with validation
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get current estimate
    const { data: estimate, error: fetchErr } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const currentStatus = estimate.status;

    // "any → revised" is always allowed; otherwise check valid transitions
    if (status !== 'revised') {
      const allowed = VALID_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from '${currentStatus}' to '${status}'` },
          { status: 400 }
        );
      }
    }

    // Build update payload
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: now,
    };

    // Set corresponding timestamp
    const tsField = STATUS_TIMESTAMPS[status];
    if (tsField) {
      updatePayload[tsField] = now;
    }

    // If revising, increment version
    if (status === 'revised') {
      updatePayload.version = (estimate.version || 1) + 1;
    }

    const { data, error } = await supabase
      .from('estimates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Insert status history record
    await supabase.from('estimate_status_history').insert({
      estimate_id: id,
      from_status: currentStatus,
      to_status: status,
      notes: notes || null,
      changed_by: body.changed_by || null,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[estimates/status] PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
