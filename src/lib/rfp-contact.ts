/** Commercial RFP contact — shared options for /contact form and /api/contact */

export const RFP_PROJECT_TYPES = [
  { value: 'qsr', label: 'QSR / Restaurant' },
  { value: 'retail', label: 'Retail' },
  { value: 'bank', label: 'Bank / Financial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'strip_mall', label: 'Strip mall' },
  { value: 'office', label: 'Office' },
  { value: 'other_commercial', label: 'Other commercial' },
  { value: 'residential', label: 'Residential' },
] as const;

export const RFP_SCOPES = [
  { value: 'new_construction', label: 'New construction' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'tenant_buildout', label: 'Tenant buildout' },
  { value: 'site_work', label: 'Site work only' },
] as const;

export const RFP_BUDGET_RANGES = [
  { value: '', label: 'Prefer not to say' },
  { value: 'under_500k', label: 'Under $500k' },
  { value: '500k_1m', label: '$500k – $1M' },
  { value: '1m_5m', label: '$1M – $5M' },
  { value: '5m_plus', label: '$5M+' },
] as const;

export const RFP_REFERRAL_SOURCES = [
  { value: '', label: 'Select one (optional)' },
  { value: 'referral', label: 'Referral' },
  { value: 'google', label: 'Google / search' },
  { value: 'social', label: 'Social media' },
  { value: 'jobsite', label: 'Saw our work / jobsite' },
  { value: 'franchise', label: 'Franchisor / brand list' },
  { value: 'other', label: 'Other' },
] as const;

export type RfpPayload = {
  organizationName: string;
  contactName: string;
  email: string;
  phone: string;
  projectType: string;
  scope: string;
  squareFootage: string;
  locationCityState: string;
  desiredStartDate: string;
  budgetRange: string;
  description: string;
  referralSource: string;
};
