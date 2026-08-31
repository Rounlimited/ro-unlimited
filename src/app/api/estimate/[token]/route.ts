import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOptionsWithChoices, selectionsDelta } from '@/lib/estimate-options';
import { rollUpProgress } from '@/lib/reporting';
import { recordDocumentEvent, visitorFromCookies, visitorCookie } from '@/lib/doc-events';

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

    // Log the open (device, location, repeat visits). Staff opening their own
    // link are recorded as internal and don't count or flip the status.
    const visitor = visitorFromCookies();
    const { internal } = await recordDocumentEvent({ req, docType: 'estimate', doc: estimate, event: 'link_view', visitorId: visitor.id });

    // Mark as viewed if currently sent
    if (estimate.status === 'sent' && !internal) {
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

    /* ── The living project ─────────────────────────────────────
       Before signing this is a proposal. After signing it becomes the place
       the customer follows their job: how far along, what happened when,
       photos from site, and every document in one spot. One link, whole job. */
    const running = !!estimate.signed_at;
    let stage: 'proposal' | 'signed' | 'in_progress' | 'complete' = 'proposal';
    let story: any[] = [];
    let sitePhotos: any[] = [];
    let documents: any[] = [];

    // Live job progress — only once the customer has signed and JR has actually
    // set a phase. Percentages only: his schedule/budget flags stay internal.
    let progress: any = null;
    if (estimate.signed_at) {
      const { data: progressRows } = await supabase
        .from('estimate_phase_progress')
        .select('phase, percent_complete, updated_at')
        .eq('estimate_id', estimate.id);
      if (progressRows && progressRows.length) {
        const roll = rollUpProgress(lineItems || [], progressRows);
        const inProgress = roll.phases.find((ph) => ph.percent > 0 && ph.percent < 100);
        const nextUp = roll.phases.find((ph) => ph.percent === 0);
        progress = {
          percent: roll.percent,
          phases: roll.phases.map((ph) => ({ phase: ph.phase, percent: ph.percent })),
          in_progress: inProgress ? inProgress.phase : null,
          next_up: nextUp ? nextUp.phase : null,
          updated_at: progressRows
            .map((r) => r.updated_at)
            .sort()
            .reverse()[0] || null,
        };
      }
    }

    if (running) {
      stage = progress ? (progress.percent >= 100 ? 'complete' : 'in_progress') : 'signed';

      // What happened, in JR's words. Only entries he's left switched on —
      // the ON/OFF on each log entry is exactly this decision.
      const { data: logRows } = await supabase
        .from('job_log_entries')
        .select('entry_date, type, text')
        .eq('estimate_id', estimate.id)
        .eq('include_in_report', true)
        .order('entry_date', { ascending: false })
        .limit(40);
      story = (logRows || []).map((e) => ({
        entry_date: e.entry_date,
        type: e.type,
        text: e.text || (e.type === 'rain' ? null : ''),
      }));

      // Jobsite photos already attached to the job.
      sitePhotos = Array.isArray(estimate.photos)
        ? (estimate.photos as any[]).slice(-12).reverse().map((ph) => ({
            url: ph.url, caption: ph.caption || null,
          }))
        : [];

      // Their paperwork, in one place: every report sent, every invoice raised.
      const [reportsRes, invoicesRes] = await Promise.all([
        supabase.from('progress_reports')
          .select('share_token, period_end, percent, sent_at')
          .eq('estimate_id', estimate.id).eq('status', 'sent')
          .order('period_end', { ascending: false }),
        supabase.from('invoices')
          .select('invoice_number, total, amount_paid, status, due_date, share_token, link_enabled')
          .eq('estimate_id', estimate.id).neq('status', 'draft').neq('status', 'cancelled')
          .order('created_at', { ascending: false }),
      ]);

      for (const r of reportsRes.data || []) {
        documents.push({
          kind: 'report',
          title: 'Progress report',
          date: r.period_end,
          detail: `${r.percent}% complete`,
          href: r.share_token ? `/r/${r.share_token}` : null,
        });
      }
      for (const inv of invoicesRes.data || []) {
        const balance = Number(inv.total || 0) - Number(inv.amount_paid || 0);
        documents.push({
          kind: 'invoice',
          title: `Invoice ${inv.invoice_number}`,
          date: inv.due_date,
          detail: inv.status === 'paid'
            ? 'Paid in full'
            : balance > 0 ? `$${Math.round(balance).toLocaleString()} due` : 'Issued',
          paid: inv.status === 'paid',
          href: inv.share_token && inv.link_enabled ? `/i/${inv.share_token}` : null,
        });
      }
    }

    const options = await getOptionsWithChoices(supabase, estimate.id);
    const selections_total = estimate.options_materialized_at ? 0 : selectionsDelta(options);

    const res = NextResponse.json({
      ...safeEstimate,
      line_items: lineItems || [],
      payment_schedule: paymentSchedule || [],
      disclaimers: disclaimerResult?.data || [],
      options,
      stage,
      progress,
      story,
      site_photos: sitePhotos,
      documents,
      selections_total,
      final_total: Number(estimate.total) + selections_total,
    });
    if (visitor.isNew) res.headers.append('Set-Cookie', visitorCookie(visitor.id));
    return res;
  } catch (err) {
    console.error('[estimate/token] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
