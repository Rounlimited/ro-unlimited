import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Invoice core — shared by the API routes now and the AI tools later, so
 * "invoice the deposit on the Miller job" runs the exact same code path as
 * the admin UI.
 *
 * Money model: `invoices.amount_paid` is always the SUM of invoice_payments
 * rows — never hand-edited. Status follows the ledger: paid when the sum
 * covers the total, partial when something's in, and `overdue` is DERIVED at
 * read time from due_date (stored status stays sent/partial so nothing has
 * to un-mark itself when a payment lands late).
 */

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface BillTo {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const DOC_NUMBER_SEED = 240; // same seed idea as estimates — numbering never reveals volume

export function calcTotals(lineItems: InvoiceLineItem[], taxPercent: number) {
  const subtotal = lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  const tax_amount = Math.round(subtotal * (Number(taxPercent) || 0)) / 100;
  return { subtotal, tax_amount, total: subtotal + tax_amount };
}

export function normalizeLineItems(items: any[]): InvoiceLineItem[] {
  return (Array.isArray(items) ? items : []).map((li, i) => {
    const quantity = Number(li.quantity) || 1;
    const unit_price = Number(li.unit_price ?? li.unit_cost) || 0;
    return {
      id: li.id || `li_${Date.now()}_${i}`,
      description: String(li.description || '').trim(),
      quantity,
      unit: li.unit || 'each',
      unit_price,
      amount: li.amount != null ? Number(li.amount) : Math.round(quantity * unit_price * 100) / 100,
    };
  });
}

export async function nextInvoiceNumber(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const prefix = `RO-INV-${new Date().getFullYear()}-`;
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);
  let next = DOC_NUMBER_SEED + 1;
  if (data && data.length > 0) {
    const last = parseInt(data[0].invoice_number.replace(prefix, ''), 10);
    if (!isNaN(last)) next = Math.max(last + 1, DOC_NUMBER_SEED + 1);
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function newShareToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/** Effective status: derives overdue at read time; storage never says "overdue". */
export function effectiveStatus(inv: { status: string; due_date: string | null; total: number; amount_paid: number }): string {
  if (inv.status === 'draft' || inv.status === 'cancelled' || inv.status === 'paid') return inv.status;
  if (inv.due_date && new Date(inv.due_date + 'T23:59:59') < new Date() && Number(inv.amount_paid) < Number(inv.total)) {
    return 'overdue';
  }
  return inv.status;
}

/** Recompute amount_paid + status from the payments ledger. Call after every ledger change. */
export async function reconcilePayments(supabase: ReturnType<typeof createAdminClient>, invoiceId: string) {
  const [{ data: inv }, { data: payments }] = await Promise.all([
    supabase.from('invoices').select('id, total, status, sent_at').eq('id', invoiceId).single(),
    supabase.from('invoice_payments').select('amount').eq('invoice_id', invoiceId),
  ]);
  if (!inv) return null;
  const amount_paid = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  let status = inv.status;
  if (status !== 'cancelled') {
    if (amount_paid >= Number(inv.total) && Number(inv.total) > 0) status = 'paid';
    else if (amount_paid > 0) status = 'partial';
    else if (status === 'paid' || status === 'partial') status = inv.sent_at ? 'sent' : 'draft';
  }
  const patch: Record<string, any> = { amount_paid, status, updated_at: new Date().toISOString() };
  patch.paid_at = status === 'paid' ? new Date().toISOString() : null;
  const { data } = await supabase.from('invoices').update(patch).eq('id', invoiceId).select().single();
  return data;
}

/**
 * Create an invoice — three entry modes sharing one code path:
 *  - from scratch: pass customer_id or bill_to + line_items
 *  - from an estimate: pass estimate_id (pulls customer/project/lines)
 *  - from a milestone: pass estimate_id + milestone_id (single progress-billing
 *    line for that scheduled amount; marks the milestone invoiced)
 */
export async function createInvoice(body: any) {
  const supabase = createAdminClient();

  let customer_id = body.customer_id || null;
  const bill_to: BillTo | null = body.bill_to || null;
  let project_name = body.project_name || null;
  let project_address = body.project_address || null;
  const estimate_id = body.estimate_id || null;
  const milestone_id = body.milestone_id || null;
  let milestone_label: string | null = null;
  let lineItems = normalizeLineItems(body.line_items || []);
  let taxPercent = Number(body.tax_percent) || 0;
  let photos = Array.isArray(body.photos) ? body.photos : [];

  if (estimate_id) {
    const { data: est, error } = await supabase
      .from('estimates')
      .select('id, customer_id, project_name, project_address, project_city, project_state, tax_percent, total, estimate_number, photos')
      .eq('id', estimate_id)
      .single();
    if (error || !est) return { error: 'Estimate not found' };
    customer_id = customer_id || est.customer_id;
    project_name = project_name || est.project_name;
    project_address = project_address ||
      [est.project_address, est.project_city, est.project_state].filter(Boolean).join(', ') || null;
    if (body.tax_percent == null) taxPercent = Number(est.tax_percent) || 0;
    if (!photos.length && Array.isArray(est.photos)) photos = est.photos;

    if (milestone_id) {
      const { data: ms, error: msErr } = await supabase
        .from('estimate_payment_schedules')
        .select('id, milestone, percent, amount, invoice_id')
        .eq('id', milestone_id)
        .eq('estimate_id', estimate_id)
        .single();
      if (msErr || !ms) return { error: 'Milestone not found on that estimate' };
      if (ms.invoice_id) return { error: 'That milestone has already been invoiced', invoice_id: ms.invoice_id };
      milestone_label = ms.milestone;
      if (!lineItems.length) {
        const amt = Number(ms.amount) || Math.round(Number(est.total) * Number(ms.percent)) / 100;
        lineItems = normalizeLineItems([{
          description: `Progress billing — ${ms.milestone} — ${est.project_name || est.estimate_number}`,
          quantity: 1, unit: 'milestone', unit_price: amt, amount: amt,
        }]);
        taxPercent = 0; // milestone amounts come off an estimate total that already handled tax
      }
    } else if (!lineItems.length) {
      // Whole-estimate invoice: pull its line items
      const { data: estLines } = await supabase
        .from('estimate_line_items')
        .select('description, quantity, unit, unit_cost, total')
        .eq('estimate_id', estimate_id)
        .order('sort_order');
      lineItems = normalizeLineItems((estLines || []).map((l) => ({
        description: l.description, quantity: l.quantity, unit: l.unit,
        unit_price: l.unit_cost, amount: l.total,
      })));
    }
  }

  if (!customer_id && !bill_to?.name && !bill_to?.company) {
    return { error: 'Provide customer_id or bill_to with at least a name or company' };
  }
  if (!lineItems.length) return { error: 'At least one line item is required' };

  const { subtotal, tax_amount, total } = calcTotals(lineItems, taxPercent);
  const invoice_number = await nextInvoiceNumber(supabase);

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number,
      customer_id,
      bill_to,
      estimate_id,
      milestone_id,
      milestone_label,
      project_name,
      project_address,
      line_items: lineItems,
      subtotal,
      tax_percent: taxPercent,
      tax_amount,
      total,
      status: 'draft',
      issued_date: body.issued_date || new Date().toISOString().slice(0, 10),
      due_date: body.due_date || null,
      notes: body.notes || null,
      terms: body.terms || null,
      payment_instructions: body.payment_instructions || null,
      photos,
      share_token: newShareToken(),
    })
    .select('*, customer:customers(id, first_name, last_name, company_name, email, phone)')
    .single();

  if (error) return { error: error.message };

  if (milestone_id) {
    await supabase.from('estimate_payment_schedules').update({ invoice_id: data.id }).eq('id', milestone_id);
  }
  return { invoice: data };
}

/**
 * Activate an invoice's share link WITHOUT email — the copy-and-text path.
 * Ensures token + switch on + expiry 180d out, and flips draft → sent
 * (handing out the link IS sending it). Idempotent.
 */
export async function activateInvoiceLink(invoiceId: string): Promise<{ view_link: string; status: string } | { error: string }> {
  const supabase = createAdminClient();
  const { data: inv } = await supabase
    .from('invoices')
    .select('id, status, share_token, share_token_expires_at, sent_at')
    .eq('id', invoiceId)
    .single();
  if (!inv) return { error: 'Invoice not found' };
  if (inv.status === 'cancelled') return { error: 'Invoice is cancelled' };

  const token = inv.share_token || newShareToken();
  const minExpiry = new Date();
  minExpiry.setDate(minExpiry.getDate() + 180);
  const expiresAt = inv.share_token_expires_at && new Date(inv.share_token_expires_at) > minExpiry
    ? inv.share_token_expires_at
    : minExpiry.toISOString();

  const now = new Date().toISOString();
  const patch: Record<string, any> = {
    share_token: token,
    share_token_expires_at: expiresAt,
    link_enabled: true,
    updated_at: now,
  };
  if (inv.status === 'draft') { patch.status = 'sent'; patch.sent_at = inv.sent_at || now; }
  await supabase.from('invoices').update(patch).eq('id', invoiceId);

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
  return { view_link: `${site}/i/${token}`, status: patch.status || inv.status };
}
