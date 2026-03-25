/**
 * Commercial RFP — Sanity shape + GROQ for the admin app.
 * Public submissions are created via /api/contact; staff read/update only through /admin + /api/admin/commercial-rfps.
 */

export const COMMERCIAL_RFP_STATUSES = ['new', 'in_review', 'contacted', 'closed'] as const;
export type CommercialRfpStatus = (typeof COMMERCIAL_RFP_STATUSES)[number];

export type CommercialRfpListItem = {
  _id: string;
  organizationName: string;
  contactName: string;
  email: string;
  phone: string;
  projectType: string;
  scope: string;
  status: string;
  submittedAt: string | null;
  submittedFromHost: string | null;
};

export type CommercialRfpDetail = CommercialRfpListItem & {
  squareFootage: string | null;
  locationCityState: string | null;
  desiredStartDate: string | null;
  budgetRange: string | null;
  description: string | null;
  referralSource: string | null;
  notes: string | null;
};

/** Fields returned by list endpoint */
export const commercialRfpListProjection = `{
  _id,
  organizationName,
  contactName,
  email,
  phone,
  projectType,
  scope,
  status,
  submittedAt,
  submittedFromHost
}`;

/** Full document for detail view */
export const commercialRfpDetailProjection = `{
  _id,
  organizationName,
  contactName,
  email,
  phone,
  projectType,
  scope,
  squareFootage,
  locationCityState,
  desiredStartDate,
  budgetRange,
  description,
  referralSource,
  status,
  notes,
  submittedAt,
  submittedFromHost
}`;

export function isCommercialRfpStatus(v: string): v is CommercialRfpStatus {
  return (COMMERCIAL_RFP_STATUSES as readonly string[]).includes(v);
}
