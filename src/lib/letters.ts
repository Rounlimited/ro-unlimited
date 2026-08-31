/**
 * Company letters — "draw up whatever I ask, on letterhead, looks official."
 *
 * JR types what he needs in plain words. Claude writes the letter. It prints
 * on RO letterhead with the logo, contact details and his license list.
 */

export const COMPANY = {
  name: 'RO Unlimited Construction & Development',
  short: 'RO Unlimited',
  phone: '(864) 304-0139',
  email: 'build@rounlimited.com',
  site: 'rounlimited.com',
  // Street address isn't stored anywhere in the app yet — set it here (or in
  // Settings later) and it appears under the logo on every letter.
  address: '',
  area: 'Serving the Upstate — Greenville, Easley, Anderson, Seneca & Pickens',
  licenses: [
    'General Contractor — Building',
    'Boring & Tunneling',
    'Water & Sewer',
    'Specialty — Masonry',
    'Specialty — Concrete',
    'Highway — Roads & Bridges',
    'Grading',
  ],
  signer: 'JR Osborne',
  signerTitle: 'Owner',
};

export interface LetterType {
  id: string;
  label: string;
  hint: string;
  /** Extra steer for the writer. */
  guidance: string;
}

export const LETTER_TYPES: LetterType[] = [
  {
    id: 'letter', label: 'General Letter', hint: 'Anything at all',
    guidance: 'A straightforward business letter.',
  },
  {
    id: 'notice_delay', label: 'Notice of Delay', hint: 'Weather, permits, materials',
    guidance:
      'A notice of delay. State the cause plainly, the effect on the schedule, that RO is working to recover the time, and that no additional cost is implied unless stated. Professional, never defensive.',
  },
  {
    id: 'change_request', label: 'Change Order Request', hint: 'Extra work, added scope',
    guidance:
      'A change order request. Describe the added or changed work, why it is needed, and that the work will proceed on written approval. Leave the price to a figure the user supplies — never invent one.',
  },
  {
    id: 'authority', label: 'Letter to a Utility or County', hint: 'Inspections, releases, permits',
    guidance:
      'A letter to a utility, county or municipal authority. Reference the job location, state the specific request or the action taken, and give a contact for follow-up. Respectful and precise.',
  },
  {
    id: 'completion', label: 'Certificate of Completion', hint: 'Work finished',
    guidance:
      'A statement that the described work is complete in accordance with the contract documents, with the completion date and a line for acknowledgement.',
  },
  {
    id: 'warranty', label: 'Warranty Letter', hint: 'What is covered, how long',
    guidance:
      'A warranty letter stating what is covered, the period, what is excluded (owner damage, normal settlement, work by others), and how to make a claim. Never invent a warranty period the user did not give.',
  },
  {
    id: 'proposal_cover', label: 'Proposal Cover Letter', hint: 'Goes with a bid',
    guidance: 'A short cover letter to accompany a proposal or bid package.',
  },
  {
    id: 'demand', label: 'Payment Demand', hint: 'Past due',
    guidance:
      'A firm but professional demand for payment. State the amount and how far past due, request payment by a date, and note that lien rights are reserved. Never threaten anything beyond that.',
  },
];

export const letterType = (id?: string | null) =>
  LETTER_TYPES.find((t) => t.id === id) || LETTER_TYPES[0];

/** The instruction Claude writes against. */
export function letterSystemPrompt(): string {
  return `You write business correspondence for ${COMPANY.name}, a licensed construction contractor in Upstate South Carolina, owned by ${COMPANY.signer}.

Write the way a competent contractor writes: direct, courteous, specific. Short paragraphs. No corporate padding, no filler openings like "I hope this letter finds you well", no exclamation marks.

Hard rules:
- Never invent facts. No dollar amounts, dates, permit numbers, job addresses or names unless the user supplied them. If a detail is needed and missing, write a clearly marked blank like [DATE] or [AMOUNT] so it can be filled in.
- Never promise anything legally binding that the user did not ask for.
- American spelling. No markdown, no headings, no bullet characters — plain paragraphs only.
- The letterhead already carries the company name, phone, email, licenses and the date. Do not repeat them in the body, and do not write a letterhead, address block, date line, salutation or signature block — those are added around your text.

Return ONLY valid JSON, no code fence:
{"title":"short internal name for this document","subject":"the RE: line","recipient_name":"who it is addressed to, or empty","salutation":"Dear Mr. Smith:","body":"the letter body, paragraphs separated by blank lines","closing":"Sincerely"}`;
}
