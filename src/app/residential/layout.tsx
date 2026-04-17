import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Residential Construction — Custom Homes & Luxury Renovations | RO Unlimited',
  description: 'Residential builder in Upstate SC by RO Unlimited. Custom home framing, ground-up new builds, complex structural shells, luxury interior renovations, modern industrial design, and vaulted ceilings. 25+ years experience. Call (864) 304-0139.',
  keywords: ['custom home builder Greenville SC', 'residential construction Upstate SC', 'luxury renovation SC', 'home framing contractor', 'new home builder Greenville', 'modern industrial home design'],
  alternates: { canonical: 'https://rounlimited.com/residential' },
  openGraph: {
    title: 'Residential Division — RO Unlimited',
    description: 'Custom homes, luxury renovations, and complex structural framing in Upstate SC. 25+ years of building it right.',
    url: 'https://rounlimited.com/residential',
    siteName: 'RO Unlimited',
    type: 'website',
    images: [{ url: 'https://rounlimited.com/images/divisions/residential-hero.jpg', width: 1200, height: 630 }],
  },
};

export default function ResidentialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
