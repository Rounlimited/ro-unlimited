import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { reconcilePayments } from '@/lib/invoices';
import { buildEmailHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL, logEmail } from '@/lib/email';
import { Resend } from 'resend';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const fmt$ = (n: any) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// POST — record a payment on the ledger. amount_paid + status recompute from
// the ledger sum; a payment covering the balance flips the invoice to paid.
// Pass send_receipt: true to email the customer a receipt (paid-in-full gets
// the PAID-stamped PDF attached; partial gets the updated balance).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    const { data: inv } = await supabase
      .from('invoices')
      .select('*, customer:customers(first_name, last_name, company_name, email, phone, address, city, state, zip)')
      .eq('id', params.id)
      .single();
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (inv.status === 'cancelled') {
      return NextResponse.json({ error: 'Invoice is cancelled — reactivate it before recording payments' }, { status: 409 });
    }

    const { data: payment, error } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: params.id,
        amount,
        method: body.method || 'check',
        reference: body.reference || null,
        paid_date: body.paid_date || new Date().toISOString().slice(0, 10),
        notes: body.notes || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const invoice = await reconcilePayments(supabase, params.id);

    // ── Optional receipt email ──
    let receipt_sent = false;
    const email = inv.customer?.email || inv.bill_to?.email;
    if (body.send_receipt && email && invoice) {
      try {
        const isPaid = invoice.status === 'paid';
        const balance = Number(invoice.total) - Number(invoice.amount_paid);
        const name = inv.customer
          ? [inv.customer.first_name, inv.customer.last_name].filter(Boolean).join(' ') || inv.customer.company_name
          : inv.bill_to?.name || inv.bill_to?.company;
        const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
        const viewLink = inv.share_token ? `${site}/i/${inv.share_token}` : null;

        await fetchEmailAccounts();
        const senderEmail = DEFAULT_FROM_EMAIL;
        const subject = isPaid
          ? `Receipt — Invoice ${inv.invoice_number} paid in full`
          : `Payment received — ${fmt$(amount)} on Invoice ${inv.invoice_number}`;
        const bodyContent = `
          <p>We've received your payment of <strong>${fmt$(amount)}</strong> on invoice ${inv.invoice_number}${inv.project_name ? ` (${inv.project_name})` : ''} — thank you.</p>
          ${isPaid
            ? `<p>That settles the invoice in full. A stamped receipt is attached for your records.</p>${viewLink ? `<p style="color:#999;font-size:13px;">Got 30 seconds? <a href="${viewLink}" style="color:#C9A84C;font-weight:700;">Tell us how we did</a> — it means a lot to a working crew.</p>` : ''}`
            : `<p>Remaining balance: <strong>${fmt$(balance)}</strong>${invoice.due_date ? ` due ${new Date(invoice.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.</p>`}
          ${viewLink ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 8px;">
            <tr><td style="background-color:#C9A84C;border-radius:6px;padding:12px 28px;">
              <a href="${viewLink}" style="color:#000;text-decoration:none;font-size:14px;font-weight:700;display:inline-block;">View ${isPaid ? 'Receipt' : 'Invoice'} Online</a>
            </td></tr>
          </table>` : ''}
        `;
        const html = buildEmailHtml(name || 'Customer', bodyContent, subject, senderEmail);

        const attachments = [];
        if (isPaid) {
          const { data: allPayments } = await supabase
            .from('invoice_payments').select('*').eq('invoice_id', params.id).order('paid_date');
          const pdf = await generateInvoicePDF({ ...inv, ...invoice }, allPayments || []);
          attachments.push({ filename: `${inv.invoice_number}-receipt.pdf`, content: pdf });
        }

        const { error: sendErr } = await resend.emails.send({
          from: getFromHeader(senderEmail), to: email, subject, html,
          ...(attachments.length ? { attachments } : {}),
        });
        if (!sendErr) {
          receipt_sent = true;
          await logEmail({
            direction: 'outbound', from_email: senderEmail, to_email: email, subject,
            body_html: html, body_text: subject, folder: 'sent',
            has_attachments: attachments.length > 0, read: true,
          });
        }
      } catch (e) {
        console.error('[invoice payments] receipt email failed:', e);
        // payment stands even if the receipt email fails
      }
    }

    return NextResponse.json({ payment, invoice, receipt_sent });
  } catch (err) {
    console.error('[invoice payments] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE ?payment_id=… — remove a mis-entered payment; ledger reconciles.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const paymentId = new URL(req.url).searchParams.get('payment_id');
    if (!paymentId) return NextResponse.json({ error: 'payment_id query param required' }, { status: 400 });

    const { error } = await supabase
      .from('invoice_payments').delete().eq('id', paymentId).eq('invoice_id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const invoice = await reconcilePayments(supabase, params.id);
    return NextResponse.json({ deleted: true, invoice });
  } catch (err) {
    console.error('[invoice payments] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
