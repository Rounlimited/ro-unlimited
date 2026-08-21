import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL, logEmail } from '@/lib/email';
import { Resend } from 'resend';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { newShareToken } from '@/lib/invoices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt$ = (n: any) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// POST — email the invoice: branded PDF attached + the fancy share link.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { to_email, to_name, message, from_email } = body;
    if (!to_email) return NextResponse.json({ error: 'to_email is required' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(first_name, last_name, company_name, email, phone, address, city, state, zip)')
      .eq('id', params.id)
      .single();
    if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'Invoice is cancelled' }, { status: 409 });
    }

    // Make sure the link is live: token exists (older rows may predate it),
    // switch on, expiry at least 180 days out. Paid links stay up as receipts.
    let token = invoice.share_token;
    if (!token) token = newShareToken();
    const minExpiry = new Date();
    minExpiry.setDate(minExpiry.getDate() + 180);
    const expiresAt = invoice.share_token_expires_at && new Date(invoice.share_token_expires_at) > minExpiry
      ? invoice.share_token_expires_at
      : minExpiry.toISOString();
    await supabase.from('invoices').update({
      share_token: token,
      share_token_expires_at: expiresAt,
      link_enabled: true,
    }).eq('id', params.id);

    const { data: payments } = await supabase
      .from('invoice_payments').select('*').eq('invoice_id', params.id).order('paid_date');

    const pdfBuffer = await generateInvoicePDF(invoice, payments || []);

    await fetchEmailAccounts();
    const senderEmail = from_email || DEFAULT_FROM_EMAIL;
    const fromHeader = getFromHeader(senderEmail);
    const fallbackName = invoice.customer
      ? [invoice.customer.first_name, invoice.customer.last_name].filter(Boolean).join(' ')
      : invoice.bill_to?.name;
    const recipientName = to_name || fallbackName || 'Customer';

    const balance = Number(invoice.total) - Number(invoice.amount_paid);
    const dueStr = invoice.due_date
      ? new Date(invoice.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;
    const viewLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/i/${token}`;

    const rows: string[] = [
      `<tr><td style="padding:8px 0;color:#999;font-size:13px;width:140px;">Invoice #</td><td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${invoice.invoice_number}</td></tr>`,
    ];
    if (invoice.project_name) rows.push(`<tr><td style="padding:8px 0;color:#999;font-size:13px;">Project</td><td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${invoice.project_name}</td></tr>`);
    if (invoice.milestone_label) rows.push(`<tr><td style="padding:8px 0;color:#999;font-size:13px;">Billing</td><td style="padding:8px 0;color:#fff;font-size:14px;">${invoice.milestone_label}</td></tr>`);
    rows.push(`<tr><td style="padding:8px 0;color:#999;font-size:13px;">Amount Due</td><td style="padding:8px 0;color:#C9A84C;font-size:16px;font-weight:700;">${fmt$(balance)}</td></tr>`);
    if (dueStr) rows.push(`<tr><td style="padding:8px 0;color:#999;font-size:13px;">Due Date</td><td style="padding:8px 0;color:#fff;font-size:14px;">${dueStr}</td></tr>`);

    const bodyContent = `
      ${message ? `<p>${message}</p>` : ''}
      <p>Your invoice from RO Unlimited is attached as a PDF, and you can view it online any time using the button below.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;width:100%;">${rows.join('')}</table>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#C9A84C;border-radius:6px;padding:12px 28px;">
            <a href="${viewLink}" style="color:#000;text-decoration:none;font-size:14px;font-weight:700;display:inline-block;">View Invoice Online</a>
          </td>
        </tr>
      </table>
      <p style="color:#999;font-size:13px;margin-top:20px;">${invoice.payment_instructions || 'Checks payable to RO Unlimited Construction & Development. For ACH or payment questions, call (864) 304-0139.'}</p>
    `;

    const subject = `Invoice ${invoice.invoice_number} — ${fmt$(balance)}${dueStr ? ` due ${dueStr}` : ''}`;
    const html = buildEmailHtml(recipientName, bodyContent, subject, senderEmail);

    const { error: sendErr } = await resend.emails.send({
      from: fromHeader,
      to: to_email,
      subject,
      html,
      attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer }],
    });
    if (sendErr) {
      console.error('[invoice send] Resend error:', sendErr);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    await logEmail({
      direction: 'outbound',
      from_email: senderEmail,
      to_email,
      subject,
      body_html: html,
      body_text: `Invoice ${invoice.invoice_number} — balance ${fmt$(balance)}`,
      folder: 'sent',
      has_attachments: true,
      read: true,
    });

    const now = new Date().toISOString();
    const patch: Record<string, any> = { sent_at: now, updated_at: now };
    if (invoice.status === 'draft') patch.status = 'sent';
    await supabase.from('invoices').update(patch).eq('id', params.id);

    return NextResponse.json({ sent: true, view_link: viewLink });
  } catch (err) {
    console.error('[invoice send] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
