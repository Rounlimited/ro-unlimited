import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL, logEmail } from '@/lib/email';
import { rollUpProgress } from '@/lib/reporting';
import { Resend } from 'resend';

type RouteContext = { params: { id: string } };

const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

/**
 * "Let the customer know" — a short nudge email that their live project page
 * has moved, with the current percent and the latest log line. Sent only when
 * JR taps the button; a same-day repeat asks him to confirm first so a busy
 * thumb can't email a customer three times in an afternoon.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json().catch(() => ({}));

    const { data: est, error } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, share_token, signed_at, progress_notified_at, customer:customers(first_name, company_name, email)')
      .eq('id', params.id)
      .single();
    if (error || !est) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (!est.signed_at) return NextResponse.json({ error: 'Not a signed job yet — nothing to update them on.' }, { status: 400 });

    const customer: any = est.customer;
    const to_email = body.to_email || customer?.email || null;
    if (!to_email) {
      return NextResponse.json({ emailed: false, error: 'No customer email on file — text them their project link instead.' });
    }

    // One nudge a day unless JR insists.
    if (!body.force && est.progress_notified_at) {
      const hours = (Date.now() - new Date(est.progress_notified_at).getTime()) / 3600000;
      if (hours < 20) {
        return NextResponse.json({
          warning: 'Already emailed them today — tap again to send anyway.',
          last_notified: est.progress_notified_at,
        });
      }
    }

    const [itemsRes, progRes, logRes] = await Promise.all([
      supabase.from('estimate_line_items').select('phase, total, sort_order').eq('estimate_id', params.id),
      supabase.from('estimate_phase_progress').select('phase, percent_complete, weight, sort_order, custom').eq('estimate_id', params.id),
      supabase.from('job_log_entries')
        .select('entry_date, type, text')
        .eq('estimate_id', params.id)
        .eq('include_in_report', true)
        .order('entry_date', { ascending: false })
        .limit(1),
    ]);

    const roll = rollUpProgress(itemsRes.data || [], progRes.data || []);
    const inProgress = roll.phases.find((p) => p.percent > 0 && p.percent < 100)?.phase || null;
    const latest = (logRes.data || [])[0];

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    const link = `${siteUrl}/estimate/${est.share_token}`;
    const name = customer?.first_name || customer?.company_name || 'there';
    const project = est.project_name || est.estimate_number;
    const subject = `${project} — your project has an update`;

    const latestLine = latest?.text
      ? `<p style="margin:0 0 16px;color:#444">${esc(new Date(latest.entry_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }))} — ${esc(latest.text)}</p>`
      : '';

    const bodyHtml = `
      <p style="margin:0 0 16px">Hi ${esc(name)},</p>
      <p style="margin:0 0 16px">Quick note — your project page for ${esc(project)} just got an update.</p>
      <p style="margin:0 0 16px;font-size:17px"><strong>${roll.percent}% complete overall${inProgress ? ` — currently working on ${esc(inProgress)}` : ''}.</strong></p>
      ${latestLine}
      <p style="margin:0 0 28px">
        <a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;
          padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">See Your Project</a>
      </p>
      <p style="margin:0;color:#666">Questions any time — (864) 304-0139.</p>`;

    await fetchEmailAccounts();
    const senderEmail = body.from_email || DEFAULT_FROM_EMAIL;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendErr } = await resend.emails.send({
      from: getFromHeader(senderEmail),
      to: to_email,
      subject,
      html: buildEmailHtml(name, bodyHtml, subject, senderEmail),
    });
    if (sendErr) return NextResponse.json({ emailed: false, error: `Email failed: ${sendErr.message}` });

    await supabase.from('estimates').update({ progress_notified_at: new Date().toISOString() }).eq('id', params.id);
    await logEmail({
      direction: 'outbound', to_email, from_email: senderEmail, subject,
      body_text: `${roll.percent}% complete${latest?.text ? ' — ' + latest.text : ''}`, folder: 'sent',
    }).catch(() => {});

    return NextResponse.json({ emailed: true, to: to_email, percent: roll.percent });
  } catch (err) {
    console.error('[estimates/notify-update] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
