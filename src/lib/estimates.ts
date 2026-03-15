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
