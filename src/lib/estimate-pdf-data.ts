import { generateEstimatePDF } from '@/lib/estimate-pdf';
import { getOptionsWithChoices } from '@/lib/estimate-options';

/**
 * Load everything the PDF needs for an already-fetched estimate row
 * (customer joined) and render it. Shared by the admin route (by id) and
 * the customer route (by share token) so both produce the same document.
 */
export async function renderEstimatePdf(supabase: any, estimate: any): Promise<Buffer> {
  estimate.scope_of_work = estimate.project_description;
  const [{ data: lineItems }, { data: paymentSchedule }] = await Promise.all([
    supabase.from('estimate_line_items').select('*').eq('estimate_id', estimate.id).order('phase').order('sort_order'),
    supabase.from('estimate_payment_schedules').select('*').eq('estimate_id', estimate.id).order('sort_order'),
  ]);
  let disclaimers: any[] = [];
  if (estimate.disclaimer_ids?.length) {
    const { data } = await supabase.from('disclaimers').select('*').in('id', estimate.disclaimer_ids);
    disclaimers = data || [];
  }
  const options = await getOptionsWithChoices(supabase, estimate.id);
  return generateEstimatePDF(estimate, lineItems || [], paymentSchedule || [], disclaimers, options);
}

export function pdfHeaders(estimateNumber: string): Record<string, string> {
  return {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${String(estimateNumber || 'estimate').replace(/\s/g, '_')}.pdf"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}
