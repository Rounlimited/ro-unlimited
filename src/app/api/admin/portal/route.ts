import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { requestLoginLink, setPassword } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

/**
 * Customer Portal control for the admin app: who can get in, who has been
 * in, what's waiting on them — and the levers (send a sign-in link, set a
 * temporary password, sign them out everywhere, fix an email).
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [custRes, estRes, acctRes, sessRes, reqRes, msgRes, prefRes] = await Promise.all([
      supabase.from('customers').select('id, first_name, last_name, company_name, email, phone, created_at').order('created_at', { ascending: false }),
      supabase.from('estimates').select('id, customer_id, project_name, estimate_number, status, signed_at, completed_at, share_token, link_enabled').neq('status', 'draft'),
      supabase.from('customer_accounts').select('email, password_set_at, locked_until'),
      supabase.from('customer_sessions').select('email, created_at, last_seen_at, expires_at'),
      supabase.from('customer_requests').select('estimate_id, status'),
      supabase.from('project_messages').select('estimate_id, author, answered_at').eq('author', 'customer').is('answered_at', null),
      supabase.from('customer_prefs').select('email, frequency'),
    ]);
    const norm = (e: string | null | undefined) => String(e || '').trim().toLowerCase();
    const acct = new Map((acctRes.data || []).map((a: any) => [a.email, a]));
    const prefs = new Map((prefRes.data || []).map((p: any) => [p.email, p.frequency]));
    const sess = new Map<string, { count: number; last: string | null; first: string | null }>();
    for (const s of sessRes.data || []) {
      const k = norm(s.email); const cur = sess.get(k) || { count: 0, last: null, first: null };
      const seen = s.last_seen_at || s.created_at;
      cur.count++; if (!cur.last || seen > cur.last) cur.last = seen; if (!cur.first || s.created_at < cur.first) cur.first = s.created_at;
      sess.set(k, cur);
    }
    const byCust = new Map<string, any[]>();
    for (const e of estRes.data || []) { const a = byCust.get(e.customer_id) || []; a.push(e); byCust.set(e.customer_id, a); }
    const reqByEst = new Map<string, { open: number; submitted: number }>();
    for (const r of reqRes.data || []) { const c = reqByEst.get(r.estimate_id) || { open: 0, submitted: 0 }; if (r.status === 'open') c.open++; if (r.status === 'submitted') c.submitted++; reqByEst.set(r.estimate_id, c); }
    const qByEst = new Map<string, number>();
    for (const m of msgRes.data || []) qByEst.set(m.estimate_id, (qByEst.get(m.estimate_id) || 0) + 1);

    const customers = (custRes.data || []).map((c: any) => {
      const email = norm(c.email);
      const ests = byCust.get(c.id) || [];
      const projects = ests.map((e: any) => ({
        id: e.id, name: e.project_name || e.estimate_number, number: e.estimate_number,
        stage: e.completed_at ? 'complete' : e.signed_at ? 'running' : e.status,
        share_href: e.share_token && e.link_enabled !== false ? `/estimate/${e.share_token}` : null,
        requests: reqByEst.get(e.id) || { open: 0, submitted: 0 }, questions_waiting: qByEst.get(e.id) || 0,
      }));
      const s = email ? sess.get(email) : undefined;
      const a = email ? acct.get(email) : undefined;
      return {
        id: c.id, name: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.company_name || 'Unnamed', company: c.company_name, email: c.email, phone: c.phone,
        access: !email ? 'no_email' : a ? 'password' : s ? 'link' : 'never',
        locked: !!(a?.locked_until && new Date(a.locked_until) > new Date()),
        last_seen: s?.last || null, first_seen: s?.first || null, sessions: s?.count || 0,
        frequency: (email && prefs.get(email)) || 'every',
        projects,
        waiting: projects.reduce((n: number, p: any) => n + p.requests.open, 0),
        came_back: projects.reduce((n: number, p: any) => n + p.requests.submitted, 0),
        questions_waiting: projects.reduce((n: number, p: any) => n + p.questions_waiting, 0),
      };
    }).filter((c: any) => c.projects.length > 0 || c.email);
    const stats = {
      customers: customers.length,
      can_sign_in: customers.filter((c: any) => c.access !== 'no_email').length,
      no_email: customers.filter((c: any) => c.access === 'no_email').length,
      signed_in_week: customers.filter((c: any) => c.last_seen && c.last_seen > weekAgo).length,
      have_password: customers.filter((c: any) => c.access === 'password').length,
      requests_waiting: customers.reduce((n: number, c: any) => n + c.waiting, 0),
      came_back: customers.reduce((n: number, c: any) => n + c.came_back, 0),
      questions_waiting: customers.reduce((n: number, c: any) => n + c.questions_waiting, 0),
    };
    return NextResponse.json({ stats, customers });
  } catch (err) {
    console.error('[admin/portal] GET', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** { action: 'send_link' | 'set_password' | 'sign_out' | 'set_email', customer_id, password?, email? } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();
    const { data: c } = await supabase.from('customers').select('id, email, first_name, company_name').eq('id', body.customer_id).maybeSingle();
    if (!c) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    if (body.action === 'set_email') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'That does not look like an email address' }, { status: 400 });
      await supabase.from('customers').update({ email }).eq('id', c.id);
      return NextResponse.json({ ok: true, email });
    }
    if (!c.email) return NextResponse.json({ error: 'No email on file — add one first' }, { status: 400 });
    if (body.action === 'send_link') {
      await requestLoginLink(c.email);
      return NextResponse.json({ ok: true, sent_to: c.email });
    }
    if (body.action === 'set_password') {
      const password = String(body.password || '') || ('RO-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + crypto.randomInt(1000, 9999));
      const out = await setPassword(c.email, password);
      if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
      return NextResponse.json({ ok: true, password, email: c.email });
    }
    if (body.action === 'sign_out') {
      await supabase.from('customer_sessions').delete().ilike('email', c.email);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[admin/portal] POST', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
