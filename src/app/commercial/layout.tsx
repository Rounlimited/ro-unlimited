import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commercial Construction — Steel Builds & Retail Storefronts',
  description: 'Commercial builder in Upstate SC by RO Unlimited. Steel and mixed-material construction, retail storefronts, complex sites, development consulting, and large-scale commercial projects. 25+ years experience. Call (864) 304-0139.',
  keywords: ['commercial contractor Greenville SC', 'steel building construction Upstate SC', 'retail storefront builder', 'commercial development SC', 'commercial construction tri-state', 'mixed material commercial build'],
  alternates: { canonical: 'https://rounlimited.com/commercial' },
  openGraph: {
    title: 'Commercial Division — RO Unlimited',
    description: 'Steel builds, retail storefronts, and complex commercial development across the tri-state. Built right, on schedule.',
    url: 'https://rounlimited.com/commercial',
    siteName: 'RO Unlimited',
    type: 'website',
    images: [{ url: 'https://rounlimited.com/images/divisions/commercial-hero.jpg', width: 1200, height: 630 }],
  },
};

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
