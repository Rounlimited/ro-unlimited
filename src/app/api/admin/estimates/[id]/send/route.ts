import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL, logEmail } from '@/lib/email';
import { Resend } from 'resend';
import crypto from 'crypto';

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

    // No PDF is generated or attached anymore — the link is the estimate,
    // and the PDF download lives behind it.

    // Generate share token (32 char hex)
    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // 60-day expiry

    await supabase.from('estimates').update({
      share_token: shareToken,
      share_token_expires_at: expiresAt.toISOString(),
    }).eq('id', id);

    // Ensure email accounts are loaded
    await fetchEmailAccounts();

    const senderEmail = from_email || DEFAULT_FROM_EMAIL;
    const fromHeader = getFromHeader(senderEmail);
    const recipientName = to_name || [estimate.customer?.first_name, estimate.customer?.last_name].filter(Boolean).join(' ') || 'Customer';

    // Build estimate summary for the email body
    const validUntil = estimate.valid_until
      ? new Date(estimate.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';

    const viewLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/estimate/${shareToken}`;

    // The LINK is the estimate. It's where they review, pick options, sign,
    // and later follow the whole job — so the email points at exactly one
    // thing. No PDF attached; the download lives behind the link.
    const bodyContent = `
      ${message ? `<p>${message}</p>` : ''}
      <p style="font-size:16px;">Your ${estimate.document_mode === 'quick_quote' ? 'quote' : 'estimate'} for
        <strong>${estimate.project_name || estimate.estimate_number}</strong> is ready.
        Review it, choose your options, and sign — all from your secure link:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="background-color:#C9A84C;border-radius:10px;padding:16px 36px;">
            <a href="${viewLink}" style="color:#000;text-decoration:none;font-size:17px;font-weight:700;display:inline-block;">View &amp; Sign Your Estimate</a>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;width:100%;">
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;width:140px;">Estimate #</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${estimate.estimate_number}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;">Total</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">$${Number(estimate.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;">Valid Until</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;">${validUntil}</td>
        </tr>
      </table>
      <p style="color:#bbb;font-size:14px;">That link stays with your project — once you approve, it's where you'll follow progress, photos, reports and invoices from the first day to the last.</p>
      <p style="color:#999;font-size:13px;">Prefer paper? There's a Download PDF button on the same page.</p>
    `;

    const subject = `Estimate ${estimate.estimate_number}${estimate.project_name ? ` — ${estimate.project_name}` : ''}`;
    const html = buildEmailHtml(recipientName, bodyContent, subject, senderEmail);

    // Send via Resend
    const { data: sendData, error: sendErr } = await resend.emails.send({
      from: fromHeader,
      to: to_email,
      subject,
      html,
      // Tags come back on Resend's delivered/opened/clicked webhooks, which is
      // how those events find their way onto this estimate's timeline.
      tags: [{ name: 'doc_type', value: 'estimate' }, { name: 'doc_id', value: id }],
    });

    if (sendErr) {
      console.error('[estimates/send] Resend error:', sendErr);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Timeline: "Sent by email to …" (internal — staff action, not a customer view)
    try {
      await supabase.from('document_events').insert({
        doc_type: 'estimate', doc_id: id, event: 'email_sent', internal: true,
        meta: { to: to_email, resend_id: sendData?.id || null, by: senderEmail },
      });
    } catch { /* non-critical */ }

    // Log to email_messages so it appears in the sent box
    await logEmail({
      direction: 'outbound',
      from_email: senderEmail,
      to_email: to_email,
      subject,
      body_html: html,
      body_text: `Estimate ${estimate.estimate_number}${message ? ` — ${message}` : ''}`,
      folder: 'sent',
      has_attachments: false,
      read: true,
    });

    // Update estimate status to sent
    const now = new Date().toISOString();
    await supabase
      .from('estimates')
      .update({ status: 'sent', sent_at: now, updated_at: now })
      .eq('id', id);

    // Insert status history record
    await supabase.from('estimate_status_history').insert({
      estimate_id: id,
      old_status: estimate.status,
      new_status: 'sent',
      notes: `Sent to ${to_email}`,
    });

    return NextResponse.json({ ok: true, sent_to: to_email, share_link: viewLink });
  } catch (err) {
    console.error('[estimates/send] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
