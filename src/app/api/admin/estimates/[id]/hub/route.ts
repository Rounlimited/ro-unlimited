import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { listMembers } from '@/lib/project-members';

export const dynamic = 'force-dynamic';

/**
 * Everything the Project Page hub shows, in one call:
 * project + stage, the link, the owner's sign-in state, people, what the
 * customer sees, a pulse, and ONE activity timeline (owner + shared people).
 * Actions go through the existing routes: /link, /people, PATCH estimate,
 * /api/admin/portal (send_link).
 */
type Act = { at: string; who: string; kind: 'open' | 'pdf' | 'email' | 'question' | 'approve' | 'decline' | 'upload' | 'feedback' | 'sign' | 'options' | 'share'; what: string; detail?: string | null };

const device = (e: any) => (e.device_type === 'Phone' ? (e.os === 'iOS' ? 'iPhone' : e.os === 'Android' ? 'Android phone' : 'phone') : e.device_type === 'Tablet' ? 'tablet' : e.device_type ? 'computer' : '');
const place = (e: any) => [e.city, e.region].filter(Boolean).join(', ');

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const id = params.id;
    const { data: est } = await supabase.from('estimates').select(`id, estimate_number, project_name, status, document_mode, signed_at, signed_name, completed_at, sent_at,
      selections_confirmed_at, share_token, share_token_expires_at, link_enabled, view_count, last_viewed_at, last_viewed_device,
      show_schedule, show_inspections, show_photos, show_assistant, feedback_enabled, reviews_enabled, allow_customer_share,
      reporting_cadence, reporting_day, customer_id, customer:customers(id, first_name, last_name, company_name, email, phone)`).eq('id', id).maybeSingle();
    if (!est) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const e: any = est; const c: any = e.customer;
    const ownerName = c ? (([c.first_name, c.last_name].map((x: any) => String(x || '').trim()).filter(Boolean).join(' ')) || String(c.company_name || '').trim() || 'Customer') : 'Customer';
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com').replace(/\/$/, '');
    const isJob = !!(e.signed_at || e.status === 'accepted');
    const stage = e.completed_at ? 'complete' : isJob ? 'job' : 'estimate';
    const expired = !!(e.share_token_expires_at && new Date(e.share_token_expires_at) < new Date());

    // Owner's portal sign-in state
    const email = c && c.email ? String(c.email).trim().toLowerCase() : '';
    let access: 'no_email' | 'password' | 'link' | 'never' = 'no_email'; let lastSignIn: string | null = null;
    if (email) {
      const [acct, sess] = await Promise.all([
        supabase.from('customer_accounts').select('password_set_at').ilike('email', email).maybeSingle(),
        supabase.from('customer_sessions').select('last_seen_at, created_at').ilike('email', email).order('last_seen_at', { ascending: false }).limit(1),
      ]);
      const s0: any = (sess.data || [])[0];
      lastSignIn = s0 ? (s0.last_seen_at || s0.created_at) : null;
      access = acct.data && (acct.data as any).password_set_at ? 'password' : s0 ? 'link' : 'never';
    }

    const members = await listMembers(id);
    const nameOf = new Map(members.map((m) => [m.id, m.name + (m.label ? ' (' + m.label + ')' : '')]));
    const d7 = Date.now() - 7 * 86400000, d30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const [ev, msgs, cos, reqs, fb] = await Promise.all([
      supabase.from('document_events').select('event, created_at, meta, visitor_id, device_type, os, city, region').eq('doc_type', 'estimate').eq('doc_id', id).eq('internal', false)
        .in('event', ['link_view', 'pdf_view', 'pdf_download', 'email_opened', 'email_clicked', 'time_on_page', 'section_seen']).order('created_at', { ascending: false }).limit(800),
      supabase.from('project_messages').select('created_at, body, author, author_name, member_id').eq('estimate_id', id).eq('author', 'customer').order('created_at', { ascending: false }).limit(40),
      supabase.from('change_orders').select('title, status, approved_at, declined_at, approved_name, decided_by').eq('estimate_id', id).in('status', ['approved', 'declined']),
      supabase.from('customer_requests').select('title, submitted_at, submitted_member_id').eq('estimate_id', id).not('submitted_at', 'is', null),
      supabase.from('job_feedback').select('created_at, kind, rating, body, answer, member_id').eq('estimate_id', id).order('created_at', { ascending: false }).limit(30),
    ]);

    const acts: Act[] = [];
    // Opens: one entry per person per 30-minute visit (not every ping)
    const lastOpen: Record<string, number> = {};
    const events = (ev.data || []) as any[];
    let opens7 = 0, opens30 = 0, secs = 0, secN = 0; const sections: Record<string, number> = {};
    for (const x of [...events].reverse()) {
      const who = (x.meta && x.meta.member_name) || ownerName;
      const t = new Date(x.created_at).getTime();
      if (x.event === 'link_view') {
        if (t >= d7) opens7++; if (x.created_at >= d30) opens30++;
        const key = who + '|' + (x.visitor_id || '');
        if (lastOpen[key] && t - lastOpen[key] < 30 * 60000) { lastOpen[key] = t; continue; }
        lastOpen[key] = t;
        acts.push({ at: x.created_at, who, kind: 'open', what: 'Opened the page', detail: [device(x), place(x)].filter(Boolean).join(' · ') || null });
      } else if (x.event === 'pdf_view' || x.event === 'pdf_download') {
        acts.push({ at: x.created_at, who, kind: 'pdf', what: x.event === 'pdf_download' ? 'Downloaded the PDF' : 'Viewed the PDF', detail: device(x) || null });
      } else if (x.event === 'email_opened' && !(x.meta && x.meta.automated)) {
        acts.push({ at: x.created_at, who: ownerName, kind: 'email', what: 'Opened your email' });
      } else if (x.event === 'email_clicked') {
        acts.push({ at: x.created_at, who: ownerName, kind: 'email', what: 'Clicked the link in your email' });
      } else if (x.event === 'time_on_page' && x.created_at >= d30) {
        const s = Number((x.meta && x.meta.seconds) || 0); if (s > 0) { secs += s; secN++; }
      } else if (x.event === 'section_seen' && x.created_at >= d30) {
        const s = x.meta && x.meta.section; if (s) sections[s] = (sections[s] || 0) + 1;
      }
    }
    for (const m of msgs.data || []) acts.push({ at: m.created_at, who: (m.member_id && nameOf.get(m.member_id)) || m.author_name || ownerName, kind: 'question', what: 'Asked a question', detail: String(m.body || '').slice(0, 140) });
    for (const co of cos.data || []) {
      const at = co.status === 'approved' ? co.approved_at : co.declined_at; if (!at) continue;
      acts.push({ at, who: co.decided_by || co.approved_name || ownerName, kind: co.status === 'approved' ? 'approve' : 'decline', what: `${co.status === 'approved' ? 'Approved' : 'Declined'} a change`, detail: co.title });
    }
    for (const r of reqs.data || []) acts.push({ at: r.submitted_at, who: (r.submitted_member_id && nameOf.get(r.submitted_member_id)) || ownerName, kind: 'upload', what: 'Sent what you asked for', detail: r.title });
    for (const f of fb.data || []) {
      const what = f.rating ? `Rated the job ${f.rating}★` : f.kind === 'pulse' ? 'Answered a check-in' : 'Left a note';
      acts.push({ at: f.created_at, who: (f.member_id && nameOf.get(f.member_id)) || ownerName, kind: 'feedback', what, detail: f.body || f.answer || null });
    }
    if (e.signed_at) acts.push({ at: e.signed_at, who: e.signed_name && e.signed_name !== 'On file' ? e.signed_name : ownerName, kind: 'sign', what: e.signed_name === 'On file' ? 'Became a job' : 'Signed the contract' });
    if (e.selections_confirmed_at) acts.push({ at: e.selections_confirmed_at, who: ownerName, kind: 'options', what: 'Confirmed their options' });
    for (const m of members) acts.push({ at: m.created_at, who: m.added_by === 'owner' ? ownerName : 'RO', kind: 'share', what: `${m.added_by === 'owner' ? 'Shared it with' : 'Added'} ${m.name}${m.label ? ' (' + m.label + ')' : ''}`, detail: m.revoked_at ? 'since removed' : m.role === 'approver' ? 'can approve' : 'can view' });
    acts.sort((a, b) => (a.at < b.at ? 1 : -1));

    const activeMembers = members.filter((m) => !m.revoked_at);
    return NextResponse.json({
      project: { id, number: e.estimate_number, name: String(e.project_name || '').trim() || e.estimate_number, stage, status: e.status, signed: !!e.signed_at, sent_at: e.sent_at, document_mode: e.document_mode },
      link: {
        url: e.share_token ? `${site}/estimate/${e.share_token}` : null, has_link: !!e.share_token, enabled: e.link_enabled !== false, expired,
        expires_at: isJob ? null : e.share_token_expires_at, views: e.view_count || 0, last_viewed_at: e.last_viewed_at, last_device: e.last_viewed_device,
      },
      owner: { name: ownerName, first: (c && (c.first_name || c.company_name)) || ownerName, email: c ? c.email : null, phone: c ? c.phone : null, customer_id: c ? c.id : null, access, last_sign_in: lastSignIn },
      people: { count: activeMembers.length, approvers: activeMembers.filter((m) => m.role === 'approver').length },
      see: {
        show_schedule: e.show_schedule !== false, show_inspections: e.show_inspections !== false, show_photos: e.show_photos !== false, show_assistant: e.show_assistant !== false,
        feedback_enabled: e.feedback_enabled !== false, reviews_enabled: e.reviews_enabled !== false, allow_customer_share: !!e.allow_customer_share,
        reporting_cadence: e.reporting_cadence || 'none', reporting_day: e.reporting_day || null,
      },
      pulse: {
        opens_7d: opens7, opens_30d: opens30, avg_seconds: secN ? Math.round(secs / secN) : null, people: activeMembers.length,
        top_sections: Object.entries(sections).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => ({ section: k, n })),
        questions_open: 0,
      },
      activity: acts.slice(0, 80),
    });
  } catch (err: any) {
    console.error('[hub] GET', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

/** PATCH { reporting_cadence, reporting_day? } — change how often progress reports go out (recomputes the next due date). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const b = await req.json().catch(() => ({}));
    const cadence = ['daily', 'weekly', 'monthly', 'none'].includes(b.reporting_cadence) ? b.reporting_cadence : null;
    if (!cadence) return NextResponse.json({ error: 'Pick daily, weekly, monthly or none' }, { status: 400 });
    const day = typeof b.reporting_day === 'string' && b.reporting_day ? b.reporting_day : 'Friday';
    const { nextDueDate } = await import('@/lib/progress-reports');
    const { error } = await createAdminClient().from('estimates').update({ reporting_cadence: cadence, reporting_day: day, next_report_due: cadence === 'none' ? null : nextDueDate(cadence, day) }).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, reporting_cadence: cadence, reporting_day: day });
  } catch (err: any) { return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 }); }
}
