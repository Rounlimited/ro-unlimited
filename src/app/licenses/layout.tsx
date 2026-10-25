import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Licenses & Classifications — SC General, Mechanical & Septic Licenses',
  description: 'RO Unlimited’s South Carolina license classifications: General Contractor CLG.127704 (Building, Grading, Water & Sewer, Concrete, Boring & Tunneling, Highway, Masonry, Marine, Public Electrical Utility), Mechanical Contractor CLM.119115 (Plumbing, Electrical, Air Conditioning) and Tier 2 Onsite Wastewater Installer OSWWI0837. Verify on SC LLR.',
  alternates: { canonical: 'https://rounlimited.com/licenses' },
  openGraph: {
    title: 'Licenses & Classifications — RO Unlimited',
    description: 'Thirteen South Carolina license classifications plus a Georgia general contractor license, under one roof. Numbers, scopes and where to verify them.',
    url: 'https://rounlimited.com/licenses',
    siteName: 'RO Unlimited',
    type: 'website',
    images: [{ url: 'https://rounlimited.com/ro-licenses-card.png', width: 1080, height: 1920, alt: 'RO Unlimited South Carolina license classifications' }],
  },
};

export default function LicensesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
