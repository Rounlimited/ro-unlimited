import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rollUpProgress } from '@/lib/reporting';

type RouteContext = { params: { id: string } };

/**
 * The Job Room — everything JR knows about a job that the customer never
 * sees, in one payload: progress, money position, real costs and margin,
 * the full log (private entries included), his notes, and how often the
 * customer has actually been looking.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const [estRes, itemsRes, progRes, costsRes, invRes, logRes, fbRes, schedRes, msgRes, reqRes, inspRes] = await Promise.all([
      supabase
        .from('estimates')
        .select(`id, estimate_number, project_name, total, division, share_token,
          signed_at, signed_name, completed_at, completion_note, warranty_months,
          schedule_status, budget_status, status_reason, status_note, status_updated_at,
          reporting_cadence, reporting_day, next_report_due, progress_notified_at,
          internal_notes, view_count, first_viewed_at, last_viewed_at, pdf_count,
          feedback_enabled, reviews_enabled, show_schedule, show_inspections, show_photos, show_assistant,
          project_address, project_city,
          customer:customers(id, first_name, last_name, company_name, email, phone)`)
        .eq('id', id)
        .single(),
      supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', id),
      supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order, custom').eq('estimate_id', id),
      supabase.from('job_costs').select('id, spent_on, category, amount, vendor, note').eq('estimate_id', id)
        .order('spent_on', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('invoices').select('id, invoice_number, total, amount_paid, status, due_date').eq('estimate_id', id),
      supabase.from('job_log_entries').select('id, entry_date, type, text, reason, include_in_report, created_at, photos')
        .eq('estimate_id', id).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(60),
      supabase.from('job_feedback').select('id, kind, section, question, answer, rating, body, created_at, seen_at')
        .eq('estimate_id', id).order('created_at', { ascending: false }).limit(30),
      supabase.from('job_schedule_items').select('id, title, kind, starts_on, ends_on, done_at')
        .eq('estimate_id', id).is('done_at', null).gte('starts_on', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
        .order('starts_on', { ascending: true }).limit(8),
      supabase.from('project_messages').select('id, author, author_name, body, created_at, answered_at')
        .eq('estimate_id', id).order('created_at', { ascending: true }).limit(40),
      supabase.from('customer_requests').select('id, kind, title, details, due_on, status, response_text, files, created_at, notified_at, submitted_at, done_at')
        .eq('estimate_id', id).order('created_at', { ascending: false }).limit(30),
      supabase.from('job_inspections').select('*').eq('estimate_id', id).order('scheduled_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(30),
    ]);

    if (estRes.error || !estRes.data) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const est: any = estRes.data;

    const total = Number(est.total || 0);
    const roll = rollUpProgress(itemsRes.data || [], progRes.data || [], total);
    const earned = roll.totalValue > 0 ? roll.earned : total * (roll.percent / 100);

    const costs = costsRes.data || [];
    const spent = costs.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    for (const c of costs) byCategory[c.category] = (byCategory[c.category] || 0) + Number(c.amount || 0);

    const invoices = (invRes.data || []) as any[];
    const billed = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled')
      .reduce((s, i) => s + Number(i.total || 0), 0);
    const paid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);

    const log = logRes.data || [];
    const rainDays = new Set(log.filter((l: any) => l.type === 'rain').map((l: any) => l.entry_date)).size;
    const daysOnJob = est.signed_at
      ? Math.max(0, Math.floor((Date.now() - new Date(est.signed_at).getTime()) / 86400000))
      : 0;

    const messages = (msgRes.data || []) as any[];

    // Portal pulse: are they looking, what do they read, is the assistant carrying its weight.
    const d7 = new Date(Date.now() - 7 * 86400000).toISOString(), d30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const [ev7, ev30, asst] = await Promise.all([
      supabase.from('document_events').select('event').eq('doc_type', 'estimate').eq('doc_id', id).eq('internal', false).eq('event', 'link_view').gte('created_at', d7),
      supabase.from('document_events').select('event, meta').eq('doc_type', 'estimate').eq('doc_id', id).eq('internal', false).in('event', ['section_seen', 'time_on_page', 'link_view']).gte('created_at', d30),
      supabase.from('assistant_logs').select('handoff, helpful, confidence, created_at, question').eq('estimate_id', id).gte('created_at', d30).order('created_at', { ascending: false }),
    ]);
    const sections: Record<string, number> = {}; let secs = 0, secN = 0, opens30 = 0;
    for (const e of ev30.data || []) {
      if (e.event === 'section_seen') { const s = (e.meta as any)?.section; if (s) sections[s] = (sections[s] || 0) + 1; }
      else if (e.event === 'time_on_page') { const t = Number((e.meta as any)?.seconds || 0); if (t > 0) { secs += t; secN++; } }
      else if (e.event === 'link_view') opens30++;
    }
    const custQs = messages.filter((m) => m.author === 'customer');
    const answered = custQs.filter((m) => m.answered_at);
    const avgAnswerH = answered.length ? Math.round(answered.reduce((s, m) => s + (new Date(m.answered_at).getTime() - new Date(m.created_at).getTime()) / 3600000, 0) / answered.length * 10) / 10 : null;
    const lastVisible = log.find((l: any) => l.include_in_report);
    const portal = {
      opens_7d: (ev7.data || []).length, opens_30d: opens30, last_viewed_at: est.last_viewed_at || null,
      avg_seconds: secN ? Math.round(secs / secN) : null, sections,
      questions: { asked: custQs.length, answered: answered.length, open: custQs.length - answered.length, avg_answer_hours: avgAnswerH },
      assistant: { asks_30d: (asst.data || []).length, answered_30d: (asst.data || []).filter((a: any) => !a.handoff).length, handoffs_30d: (asst.data || []).filter((a: any) => a.handoff).length, helpful_yes: (asst.data || []).filter((a: any) => a.helpful === true).length, helpful_no: (asst.data || []).filter((a: any) => a.helpful === false).length, recent: (asst.data || []).slice(0, 5).map((a: any) => ({ question: a.question, handoff: a.handoff, helpful: a.helpful })) },
      last_visible_entry: lastVisible?.entry_date || null,
      days_since_update: lastVisible ? Math.floor((Date.now() - new Date(lastVisible.entry_date + 'T12:00:00').getTime()) / 86400000) : null,
    };
    return NextResponse.json({
      estimate: est,
      messages,
      open_questions: messages.filter((m) => m.author === 'customer' && !m.answered_at).length,
      requests: reqRes.data || [],
      inspections: inspRes.data || [],
      portal,
      progress: {
        percent: roll.percent,
        phases: roll.phases,
        total_value: roll.totalValue,
      },
      money: {
        contract: Math.round(total),
        earned: Math.round(earned),
        spent: Math.round(spent),
        margin: Math.round(earned - spent),
        billed: Math.round(billed),
        paid: Math.round(paid),
        unbilled: Math.round(earned - billed),
        by_category: byCategory,
      },
      costs,
      invoices,
      log,
      rain_days: rainDays,
      days_on_job: daysOnJob,
      feedback: fbRes.data || [],
      feedback_unseen: (fbRes.data || []).filter((f: any) => !f.seen_at).length,
      upcoming: schedRes.data || [],
    });
  } catch (err) {
    console.error('[jobs/room] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
