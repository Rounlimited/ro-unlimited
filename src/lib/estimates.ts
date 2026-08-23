// Shared helpers for the Estimates system

export interface EstimateTotals {
  subtotal: number;
  overhead_amount: number;
  markup_amount: number;
  tax_amount: number;
  contingency_amount: number;
  total: number;
}

interface LineItemForCalc {
  quantity: number;
  unit_cost: number;
  markup_percent?: number | null;
}

interface EstimateForCalc {
  overhead_percent?: number | null;
  markup_percent?: number | null;
  tax_percent?: number | null;
  contingency_percent?: number | null;
  permit_fees?: number | null;
}

export function recalcEstimateTotals(
  lineItems: LineItemForCalc[],
  estimate: EstimateForCalc
): EstimateTotals {
  const subtotal = lineItems.reduce(
    (sum, item) =>
      sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100),
    0
  );
  const overhead_amount = (subtotal * (estimate.overhead_percent || 0)) / 100;
  const markup_amount = (subtotal * (estimate.markup_percent || 0)) / 100;
  const taxable = subtotal + overhead_amount + markup_amount;
  const tax_amount = (taxable * (estimate.tax_percent || 0)) / 100;
  const contingency_amount = (subtotal * (estimate.contingency_percent || 0)) / 100;
  const total =
    subtotal +
    overhead_amount +
    markup_amount +
    tax_amount +
    (estimate.permit_fees || 0) +
    contingency_amount;

  return { subtotal, overhead_amount, markup_amount, tax_amount, contingency_amount, total };
}

/* ─── Estimate date ──────────────────────────────────────────
   `estimate_date` (DATE, optional) is the day the estimate was actually
   prepared with the customer — it can differ from `created_at`, which is
   just when it was typed into the system. Every customer-facing date
   (PDF, live link, list) goes through this so they agree.
   A bare YYYY-MM-DD is given a local-noon time so `new Date()` never
   slides it to the previous day in US time zones. */
export function estimateDisplayDate(e: { estimate_date?: string | null; sent_at?: string | null; created_at?: string | null }): string | null {
  if (e.estimate_date) {
    const d = String(e.estimate_date).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : String(e.estimate_date);
  }
  return e.sent_at || e.created_at || null;
}

/** YYYY-MM-DD for an <input type="date">, from an ISO string or DATE column. */
export function toDateInputValue(v: string | null | undefined): string {
  if (!v) return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
