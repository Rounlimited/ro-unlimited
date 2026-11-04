/** Status words for permits and inspections — client-safe (no server imports). */
export const INSPECTION_STATUS: Record<string, string> = {
  scheduled: 'Scheduled', passed: 'Passed', corrections: 'Corrections needed', failed: 'Did not pass', reinspection: 'Re-inspection scheduled', cancelled: 'Cancelled',
};
export const PERMIT_STATUS: Record<string, string> = { applied: 'Applied for', issued: 'Issued', closed: 'Closed out', expired: 'Expired' };
