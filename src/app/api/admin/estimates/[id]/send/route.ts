import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL } from '@/lib/email';
import { Resend } from 'resend';

type RouteContext = { params: { id: string } };

const resend = new Resend(process.env.RESEND_API_KEY);

// POST — send estimate to customer via email
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { to_email, to_name, message, from_email } = body;

    if (!to_email) {
      return NextResponse.json({ error: 'to_email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch estimate with customer info
    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .select('*, customer:customers(first_name, last_name, company_name, email)')
      .eq('id', id)
      .single();

    if (estErr || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Ensure email accounts are loaded
    await fetchEmailAccounts();

    const senderEmail = from_email || DEFAULT_FROM_EMAIL;
    const fromHeader = getFromHeader(senderEmail);
    const recipientName = to_name || [estimate.customer?.first_name, estimate.customer?.last_name].filter(Boolean).join(' ') || 'Customer';

    // Build estimate summary for the email body
    const validUntil = estimate.valid_until
      ? new Date(estimate.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';

    const total = typeof estimate.total === 'number'
      ? estimate.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : '$0.00';

    const viewLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/estimate/${id}`;

    const bodyContent = `
      ${message ? `<p>${message}</p>` : ''}
      <p>Please find your estimate details below:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;width:100%;">
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;width:140px;">Estimate #</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${estimate.estimate_number}</td>
        </tr>
        ${estimate.project_name ? `
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;">Project</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${estimate.project_name}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;">Total</td>
          <td style="padding:8px 0;color:#C9A84C;font-size:18px;font-weight:700;">${total}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;">Valid Until</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;">${validUntil}</td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#C9A84C;border-radius:6px;padding:12px 28px;">
            <a href="${viewLink}" style="color:#000;text-decoration:none;font-size:14px;font-weight:700;display:inline-block;">View Estimate</a>
          </td>
        </tr>
      </table>
    `;

    const subject = `Estimate ${estimate.estimate_number}${estimate.project_name ? ` — ${estimate.project_name}` : ''}`;
    const html = buildEmailHtml(recipientName, bodyContent, subject, senderEmail);

    // Send via Resend
    const { error: sendErr } = await resend.emails.send({
      from: fromHeader,
      to: to_email,
      subject,
      html,
    });

    if (sendErr) {
      console.error('[estimates/send] Resend error:', sendErr);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Update estimate status to sent
    const now = new Date().toISOString();
    await supabase
      .from('estimates')
      .update({ status: 'sent', sent_at: now, updated_at: now })
      .eq('id', id);

    // Insert status history record
    await supabase.from('estimate_status_history').insert({
      estimate_id: id,
      from_status: estimate.status,
      to_status: 'sent',
      notes: `Sent to ${to_email}`,
    });

    return NextResponse.json({ ok: true, sent_to: to_email });
  } catch (err) {
    console.error('[estimates/send] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
