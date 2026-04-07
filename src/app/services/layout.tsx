import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RO Services — Roofing, Plumbing, Electrical, Septic & Repairs | RO Unlimited',
  description: 'RO Unlimited\'s Services Division handles roofing, plumbing, electrical, septic systems, and general repairs across Upstate SC, Georgia, and North Carolina. Licensed, insured, 25+ years experience. Call (864) 304-0139.',
  openGraph: {
    title: 'RO Services — Roofing, Plumbing, Electrical, Septic & Repairs',
    description: 'Dedicated crews for every job, big or small. Roofing, plumbing, electrical, septic, and general repairs from a company with 25+ years of construction experience.',
    url: 'https://rounlimited.com/services',
    siteName: 'RO Unlimited',
    type: 'website',
  },
  alternates: {
    canonical: 'https://rounlimited.com/services',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
