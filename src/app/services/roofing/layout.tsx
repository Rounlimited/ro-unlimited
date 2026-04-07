import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roof Repair & Replacement in Upstate SC | RO Unlimited Services',
  description: 'Roof repair, storm damage restoration, and full roof replacement by RO Unlimited. Licensed roofing contractor serving Greenville, Spartanburg, and Upstate South Carolina. Free estimates. Call (864) 304-0139.',
  openGraph: {
    title: 'Roof Repair & Replacement — RO Unlimited Services',
    description: 'From storm damage repairs to full roof replacements, RO handles residential and light commercial roofing with licensed crews and quality materials.',
    url: 'https://rounlimited.com/services/roofing',
    siteName: 'RO Unlimited',
    type: 'website',
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/roofing',
  },
};

export default function RoofingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
