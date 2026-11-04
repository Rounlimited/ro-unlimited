import { NextRequest, NextResponse } from 'next/server';
import { withLiveAmounts } from '@/lib/estimates';
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

    // JR's pause switch — the whole document goes quiet until he flips it back.
    if (estimate.link_enabled === false) {
      return NextResponse.json({ error: 'This link is paused for updates', paused: true }, { status: 423 });
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
    if (!internal && req.nextUrl.searchParams.get('from') === 'email') {
      await recordDocumentEvent({ req, docType: 'estimate', doc: estimate, event: 'email_clicked', visitorId: visitor.id });
    }

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
    let changeOrders: any[] = [];
    let messages: any[] = [];
    let requests: any[] = [];
    let nextUp: any = null;
    let schedule: any[] = [];
    let inspections: any[] = [];
    let glossary: any[] = [];
    let rainDays = 0;
    let balanceDue = 0;
    let payHref: string | null = null;
    let feedbackRating: number | null = null;

    // Live job progress — only once the customer has signed and JR has actually
    // set a phase. Percentages only: his schedule/budget flags stay internal.
    let progress: any = null;
    if (estimate.signed_at) {
      const { data: progressRows } = await supabase
        .from('estimate_phase_progress')
        .select('phase, percent_complete, weight, sort_order, custom, updated_at')
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
      // Complete is JR's call — he closes it out. A bar reaching 100% shows
      // complete too, but the warranty and the "how did we do" only appear
      // once he's actually signed the job off.
      stage = estimate.completed_at
        ? 'complete'
        : progress ? (progress.percent >= 100 ? 'complete' : 'in_progress') : 'signed';

      const { data: fb } = await supabase
        .from('project_feedback').select('rating').eq('estimate_id', estimate.id).maybeSingle();
      feedbackRating = fb?.rating ?? null;

      // What happened, in JR's words. Only entries he's left switched on —
      // the ON/OFF on each log entry is exactly this decision.
      const { data: logRows } = await supabase
        .from('job_log_entries')
        .select('entry_date, type, text, photos')
        .eq('estimate_id', estimate.id)
        .eq('include_in_report', true)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40);
      const showPhotos = estimate.show_photos !== false;
      story = (logRows || []).map((e) => ({
        entry_date: e.entry_date,
        type: e.type,
        text: e.text || (e.type === 'rain' ? null : ''),
        photos: showPhotos && Array.isArray((e as any).photos) ? (e as any).photos.filter((p: any) => p && p.url).map((p: any) => ({ url: p.url, caption: p.caption || null })) : [],
      }));
      rainDays = new Set((logRows || []).filter((e) => e.type === 'rain').map((e) => e.entry_date)).size;

      // Jobsite photos already attached to the job (JR's per-job Photos switch).
      sitePhotos = showPhotos && Array.isArray(estimate.photos)
        ? (estimate.photos as any[]).slice(-12).reverse().map((ph) => ({
            url: ph.url, caption: ph.caption || null,
          }))
        : [];

      // Extra work waiting on them, and the thread of questions.
      const [coRes, msgRes] = await Promise.all([
        supabase.from('change_orders')
          .select('id, number, title, description, amount, days_added, status, approved_at, approved_name')
          .eq('estimate_id', estimate.id).neq('status', 'draft')
          .order('created_at', { ascending: false }),
        supabase.from('project_messages')
          .select('id, author, author_name, body, created_at, answered_at')
          .eq('estimate_id', estimate.id)
          .order('created_at', { ascending: true }).limit(60),
      ]);
      changeOrders = coRes.data || [];
      messages = msgRes.data || [];

      // Things RO has asked them for (documents, choices, answers) and the
      // next thing on the calendar — the two lines a customer actually wants.
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const [reqRes, nextRes] = await Promise.all([
        supabase.from('customer_requests')
          .select('id, kind, title, details, due_on, status, response_text, files, created_at, submitted_at, done_at')
          .eq('estimate_id', estimate.id).neq('status', 'cancelled')
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('job_schedule_items').select('title, kind, starts_on')
          .eq('estimate_id', estimate.id).gte('starts_on', today).is('done_at', null)
          .order('starts_on', { ascending: true }).limit(1).maybeSingle(),
      ]);
      requests = (reqRes.data || []).map((r) => ({ ...r, files: Array.isArray(r.files) ? r.files.map((f: any) => ({ name: f.name, url: f.url })) : [] }));
      nextUp = estimate.show_schedule !== false && nextRes.data ? { title: nextRes.data.title, kind: nextRes.data.kind, starts_on: nextRes.data.starts_on } : null;

      // County-grade transparency: the two-week look-ahead, permits and
      // inspections, and the timeline extras (approvals, payments, what they sent).
      const twoWeeks = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const [schedRes, inspRes, paidRes] = await Promise.all([
        estimate.show_schedule !== false
          ? supabase.from('job_schedule_items').select('id, title, kind, starts_on, ends_on').eq('estimate_id', estimate.id).is('done_at', null).gte('starts_on', today).lte('starts_on', twoWeeks).order('starts_on', { ascending: true }).limit(12)
          : Promise.resolve({ data: [] as any[] }),
        estimate.show_inspections !== false
          ? supabase.from('job_inspections').select('id, record_type, title, agency, reference, scheduled_on, time_window, status, result_on, notes').eq('estimate_id', estimate.id).order('scheduled_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(20)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from('invoices').select('invoice_number, paid_at, total').eq('estimate_id', estimate.id).eq('status', 'paid').not('paid_at', 'is', null),
      ]);
      schedule = schedRes.data || [];
      inspections = inspRes.data || [];
      const extras: any[] = [];
      for (const co of changeOrders) if (co.status === 'approved' && co.approved_at) extras.push({ entry_date: String(co.approved_at).slice(0, 10), type: 'approval', text: `Change order approved: ${co.title}`, photos: [] });
      for (const inv of paidRes.data || []) extras.push({ entry_date: String(inv.paid_at).slice(0, 10), type: 'payment', text: `Payment received — thank you (Invoice ${inv.invoice_number})`, photos: [] });
      for (const r of requests) if (r.submitted_at) extras.push({ entry_date: String(r.submitted_at).slice(0, 10), type: 'request', text: `You sent: ${r.title}`, photos: [] });
      if (extras.length) story = [...story, ...extras].sort((a, b) => (a.entry_date < b.entry_date ? 1 : a.entry_date > b.entry_date ? -1 : 0)).slice(0, 60);

      // Plain-language explainers for the words that actually appear on this page.
      const { data: faq } = await supabase.from('portal_faq').select('term, answer').eq('active', true);
      const pageText = [estimate.project_description, ...story.map((s: any) => s.text), ...inspections.map((r: any) => `${r.title} ${r.notes || ''} ${r.status}`), ...schedule.map((s: any) => s.title)].join(' ').toLowerCase();
      glossary = (faq || []).filter((f) => {
        const t = f.term.toLowerCase();
        const stem = t.replace(/\s*\(.*\)$/, '').replace(/s$/, '');
        return pageText.includes(t) || pageText.includes(stem) || (t === 'estimated date' && schedule.length > 0) || (t === 'change order' && changeOrders.length > 0) || (t === 'inspection corrections' && inspections.some((r: any) => r.status === 'corrections'));
      }).slice(0, 6);

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
        if (inv.status !== 'paid' && balance > 0) balanceDue += balance;
        if (inv.status !== 'paid' && balance > 0 && inv.share_token && inv.link_enabled && !payHref) {
          payHref = '/i/' + inv.share_token;
        }
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
      payment_schedule: withLiveAmounts(paymentSchedule || [], Number(estimate.total) || 0),
      disclaimers: disclaimerResult?.data || [],
      options,
      stage,
      progress,
      story,
      site_photos: sitePhotos,
      documents,
      change_orders: changeOrders,
      messages,
      requests,
      next_up: nextUp,
      schedule,
      inspections,
      rain_days: rainDays,
      glossary,
      assistant_enabled: estimate.show_assistant !== false,
      show: { schedule: estimate.show_schedule !== false, inspections: estimate.show_inspections !== false, photos: estimate.show_photos !== false },
      balance_due: Math.round(balanceDue),
      pay_href: payHref,
      completed_at: estimate.completed_at || null,
      completion_note: estimate.completion_note || null,
      warranty_months: estimate.warranty_months ?? null,
      warranty_notes: estimate.warranty_notes || null,
      feedback_rating: feedbackRating,
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
