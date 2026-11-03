/** Kinds of things RO can ask a customer for. Shared by the Job Room (client) and the server lib. */
export const REQUEST_KINDS = [
  { id: 'document', label: 'Document', hint: 'Survey, HOA letter, deed, permit paperwork' },
  { id: 'selection', label: 'Selection', hint: 'A choice they need to make' },
  { id: 'signature', label: 'Signature', hint: 'Sign something on their page' },
  { id: 'payment', label: 'Payment', hint: 'Deposit or balance' },
  { id: 'answer', label: 'Answer', hint: 'A question they need to answer' },
  { id: 'other', label: 'Other', hint: '' },
] as const;
export type RequestKind = typeof REQUEST_KINDS[number]['id'];
