import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCustomerSession, getCustomerPrefs, hasPassword } from '@/lib/customer-auth';
import { rollUpProgress } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

/**
 * Everything this customer has with RO, one card per project: where it
 * stands, the last thing we posted, what's waiting on them, what's next.
 * A customer is an email address — every customer row with it counts.
 */
export async function GET() {
  try {
    const s = await getCustomerSession();
    if (!s) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const supabase = createAdminClient();
    const { data: custs } = await supabase.from('customers').select('id, first_name, last_name, company_name').ilike('email', s.email);
    const ids = (custs || []).map((c) => c.id);
    const name = custs?.[0]?.first_name || custs?.[0]?.company_name || null;
    if (!ids.length) return NextResponse.json({ email: s.email, name, projects: [], prefs: await getCustomerPrefs(s.email), has_password: await hasPassword(s.email) });

    const { data: ests } = await supabase.from('estimates')
      .select('id, estimate_number, project_name, project_address, project_city, status, total, share_token, link_enabled, signed_at, completed_at, created_at, sent_at, document_mode')
      .in('customer_id', ids).neq('status', 'draft').order('created_at', { ascending: false }).limit(30);
    const list = (ests || []) as any[];
    if (!list.length) return NextResponse.json({ email: s.email, name, projects: [], prefs: await getCustomerPrefs(s.email), has_password: await hasPassword(s.email) });
    const estIds = list.map((e) => e.id);
    const today = new Date().toISOString().slice(0, 10);

    const [itemsRes, progRes, logRes, coRes, invRes, reqRes, schedRes, msgRes, svcRes] = await Promise.all([
      supabase.from('estimate_line_items').select('estimate_id, phase, total, sort_order').in('estimate_id', estIds),
      supabase.from('estimate_phase_progress').select('estimate_id, phase, percent_complete, weight, sort_order, custom').in('estimate_id', estIds),
      supabase.from('job_log_entries').select('estimate_id, entry_date, type, text, photos, created_at').in('estimate_id', estIds).eq('include_in_report', true).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(200),
      supabase.from('change_orders').select('estimate_id, status').in('estimate_id', estIds).not('status', 'in', '("approved","declined","draft")'),
      supabase.from('invoices').select('estimate_id, total, amount_paid, status').in('estimate_id', estIds).not('status', 'in', '("draft","cancelled","paid")'),
      supabase.from('customer_requests').select('estimate_id, status, title, due_on').in('estimate_id', estIds).eq('status', 'open'),
      supabase.from('job_schedule_items').select('estimate_id, title, starts_on').in('estimate_id', estIds).gte('starts_on', today).is('done_at', null).order('starts_on', { ascending: true }),
      supabase.from('project_messages').select('estimate_id, author, answered_at').in('estimate_id', estIds).eq('author', 'customer'),
      supabase.from('service_reminders').select('estimate_id, title, next_due').in('estimate_id', estIds).eq('active', true).order('next_due', { ascending: true }),
    ]);
    const by = <T extends { estimate_id: string }>(rows: T[] | null) => {
      const m = new Map<string, T[]>();
      for (const r of rows || []) { const a = m.get(r.estimate_id) || []; a.push(r); m.set(r.estimate_id, a); }
      return m;
    };
    const items = by(itemsRes.data), prog = by(progRes.data), logs = by(logRes.data), cos = by(coRes.data), invs = by(invRes.data), reqs = by(reqRes.data), sched = by(schedRes.data), msgs = by(msgRes.data), svcs = by(svcRes.data);

    const projects = list.map((e) => {
      const p = prog.get(e.id) || [];
      const roll = p.length ? rollUpProgress(items.get(e.id) || [], p) : null;
      const percent = roll ? roll.percent : 0;
      const stage = e.completed_at ? 'complete' : e.signed_at ? (roll ? (percent >= 100 ? 'complete' : 'in_progress') : 'signed')
        : ['declined', 'expired'].includes(e.status) ? 'closed' : 'proposal';
      const needs: string[] = [];
      if (!e.signed_at && stage === 'proposal') needs.push(`Review and sign your ${e.document_mode === 'contract' ? 'contract' : 'estimate'}`);
      for (const r of reqs.get(e.id) || []) needs.push(r.title + (r.due_on ? ` (by ${new Date(r.due_on + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : ''));
      const coCount = (cos.get(e.id) || []).length;
      if (coCount) needs.push(coCount === 1 ? 'Approve or decline a change order' : `Approve or decline ${coCount} change orders`);
      const balance = (invs.get(e.id) || []).reduce((s, i) => s + Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)), 0);
      if (balance > 0) needs.push(`Balance due: $${Math.round(balance).toLocaleString()}`);
      const latest = (logs.get(e.id) || [])[0] || null;
      const next = (sched.get(e.id) || [])[0] || null;
      const waiting = (msgs.get(e.id) || []).filter((m) => !m.answered_at).length;
      return {
        id: e.id, number: e.estimate_number, name: e.project_name || e.estimate_number,
        address: [e.project_address, e.project_city].filter(Boolean).join(', ') || null,
        stage, percent, total: Number(e.total || 0),
        href: e.share_token && e.link_enabled !== false ? `/estimate/${e.share_token}` : null,
        latest: latest ? { date: latest.entry_date, text: latest.text || (latest.type === 'rain' ? 'Rained out — no work on site.' : ''), photos: Array.isArray(latest.photos) ? latest.photos.length : 0 } : null,
        needs, next: next ? { date: next.starts_on, title: next.title } : null,
        questions_waiting: waiting,
        next_service: (svcs.get(e.id) || [])[0] ? { title: (svcs.get(e.id) || [])[0].title, date: (svcs.get(e.id) || [])[0].next_due } : null,
        signed_at: e.signed_at, completed_at: e.completed_at,
      };
    });
    const order: Record<string, number> = { in_progress: 0, signed: 1, proposal: 2, complete: 3, closed: 4 };
    projects.sort((a, b) => (order[a.stage] ?? 9) - (order[b.stage] ?? 9));
    return NextResponse.json({ email: s.email, name, projects, prefs: await getCustomerPrefs(s.email), has_password: await hasPassword(s.email) });
  } catch (err) {
    console.error('[my/projects]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
