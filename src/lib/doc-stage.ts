/**
 * A document's label follows its life, not its birth.
 *
 * Every doc is born a Quote, an Estimate, or a Proposal (document_mode).
 * The moment the customer signs, it IS a contract — whatever it was born as —
 * and once work is underway or finished, the page says so. JR's rule: nothing
 * a customer signed should still be titled "Estimate".
 */

export interface DocStageInput {
  document_mode?: string | null;
  signed_at?: string | null;
  completed_at?: string | null;
  /** the customer API's computed stage, when available ('in_progress' etc.) */
  stage?: string | null;
}

export interface DocStageOut {
  key: 'quote' | 'estimate' | 'proposal' | 'contract' | 'active' | 'complete';
  /** Title-case word for pages and chips */
  label: string;
  /** ALL-CAPS title for the printed PDF */
  pdfTitle: string;
}

export function docStage(e: DocStageInput): DocStageOut {
  if (e.completed_at) return { key: 'complete', label: 'Completed Project', pdfTitle: 'CONTRACT' };
  if (e.signed_at && e.stage === 'in_progress') return { key: 'active', label: 'Active Project', pdfTitle: 'CONTRACT' };
  if (e.signed_at) return { key: 'contract', label: 'Contract', pdfTitle: 'CONTRACT' };
  const mode = e.document_mode || 'estimate';
  if (mode === 'quick_quote') return { key: 'quote', label: 'Quote', pdfTitle: 'QUICK QUOTE' };
  if (mode === 'contract') return { key: 'proposal', label: 'Proposal', pdfTitle: 'PROPOSAL' };
  if (mode === 'change_order') return { key: 'estimate', label: 'Change Order', pdfTitle: 'CHANGE ORDER' };
  return { key: 'estimate', label: 'Estimate', pdfTitle: 'ESTIMATE' };
}
