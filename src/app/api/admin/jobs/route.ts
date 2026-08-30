import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { nextDueDate } from '@/lib/progress-reports';

/**
 * Track a job that never went through the estimator — JR bid it on paper, or
 * it's an old contract, and he just wants progress and reports on it.
 *
 * It becomes a minimal signed contract record (RO-JOB-…), so the Progress tab,
 * the reports, the customer link and the AI all work on it unchanged.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();

    const projectName = (body.project_name || '').trim();
    if (!projectName) return NextResponse.json({ error: 'Give the job a name' }, { status: 400 });

    // Customer: existing, or created inline from a name.
    let customerId = body.customer_id || null;
    if (!customerId && body.customer_name) {
      const parts = String(body.customer_name).trim().split(/\s+/);
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .insert({
          first_name: parts[0] || String(body.customer_name).trim(),
          last_name: parts.slice(1).join(' ') || null,
          company_name: body.company_name || null,
          email: body.customer_email || null,
          phone: body.customer_phone || null,
        })
        .select('id')
        .single();
      if (custErr) return NextResponse.json({ error: custErr.message }, { status: 400 });
      customerId = cust.id;
    }
    if (!customerId) return NextResponse.json({ error: 'Pick a customer or type a name' }, { status: 400 });

    const year = new Date().getFullYear();
    const prefix = `RO-JOB-${year}-`;
    const { data: existing } = await supabase
      .from('estimates')
      .select('estimate_number')
      .like('estimate_number', `${prefix}%`)
      .order('estimate_number', { ascending: false })
      .limit(1);

    let nextNum = 101;
    if (existing && existing.length) {
      const last = parseInt(existing[0].estimate_number.replace(prefix, ''), 10);
      if (!isNaN(last)) nextNum = last + 1;
    }
    const estimate_number = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const cadence = body.reporting_cadence || 'weekly';
    const day = body.reporting_day || 'Friday';
    const now = new Date().toISOString();

    // Signed on creation: the work is already happening, so progress and
    // reporting apply from day one.
    const { data: job, error } = await supabase
      .from('estimates')
      .insert({
        estimate_number,
        customer_id: customerId,
        document_mode: 'contract',
        status: 'accepted',
        project_name: projectName,
        division: body.division || null,
        project_address: body.project_address || null,
        total: body.total ? Number(body.total) : 0,
        estimate_date: new Date().toISOString().slice(0, 10),
        signed_at: now,
        signed_name: body.signed_name || 'On file',
        reporting_cadence: cadence,
        reporting_day: day,
        reporting_includes: body.reporting_includes || ['completed', 'percent', 'photos', 'upcoming'],
        next_report_due: nextDueDate(cadence, day),
      })
      .select('id, estimate_number')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Optional starting phases, in the order given.
    const phases: string[] = Array.isArray(body.phases)
      ? body.phases.map((p: any) => String(typeof p === 'string' ? p : p.phase).trim()).filter(Boolean)
      : [];
    if (phases.length) {
      await supabase.from('estimate_phase_progress').insert(
        phases.map((phase, i) => ({
          estimate_id: job.id,
          phase,
          percent_complete: 0,
          custom: true,
          sort_order: i,
          weight: Array.isArray(body.phases) && typeof body.phases[i] === 'object' && body.phases[i].weight
            ? Number(body.phases[i].weight)
            : null,
        })),
      );
    }

    return NextResponse.json({ job: { ...job, phases: phases.length } });
  } catch (err) {
    console.error('[jobs] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
