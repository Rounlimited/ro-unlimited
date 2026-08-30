import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL, logEmail } from '@/lib/email';
import { Resend } from 'resend';

type RouteContext = { params: { id: string } };

const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

/**
 * Send a progress report — or just mark it sent so JR can text the link.
 * Body: { to_email?, skip_email? }.  Nothing reaches a customer until this
 * runs, and it only ever runs from JR pressing send.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const body = await req.json().catch(() => ({}));

    const { data: report, error } = await supabase
      .from('progress_reports').select('*').eq('id', params.id).single();
    if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const { data: estimate } = await supabase
      .from('estimates')
      .select('estimate_number, project_name, customer:customers(first_name, last_name, company_name, email)')
      .eq('id', report.estimate_id)
      .single();

    const customer: any = estimate?.customer;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    const link = `${siteUrl}/r/${report.share_token}`;
    const to_email = body.to_email || customer?.email || null;

    // Mark it sent first — the link has to work the moment JR texts it.
    await supabase.from('progress_reports')
      .update({ status: 'sent', sent_at: new Date().toISOString(), sent_to: to_email })
      .eq('id', params.id);

    if (body.skip_email || !to_email) {
      return NextResponse.json({
        sent: true, link, emailed: false,
        note: to_email ? 'Link is live — text it to them.' : 'No customer email on file; link is live to text.',
      });
    }

    const name = customer?.first_name || customer?.company_name || 'there';
    const project = estimate?.project_name || 'your project';
    const subject = `${project} — progress update (${report.percent}% complete)`;

    const bodyHtml = `
      <p style="margin:0 0 16px">Hi ${esc(name)},</p>
      <p style="margin:0 0 16px">Here's where we stand on ${esc(project)} as of
        ${new Date(report.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
      <p style="margin:0 0 16px;font-size:17px"><strong>${report.percent}% complete overall.</strong></p>
      <p style="margin:0 0 24px">${esc(report.summary || '')}</p>
      <p style="margin:0 0 28px">
        <a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;
          padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">View Full Report</a>
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

    if (sendErr) {
      // The link is live regardless — say so rather than implying nothing happened.
      return NextResponse.json({
        sent: true, link, emailed: false,
        error: `Link is live, but the email failed: ${sendErr.message}`,
      });
    }

    await logEmail({
      direction: 'outbound', to_email, from_email: senderEmail, subject,
      body_text: report.summary || '', folder: 'sent',
    }).catch(() => {});

    return NextResponse.json({ sent: true, link, emailed: true, to: to_email });
  } catch (err) {
    console.error('[reports/send] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
