import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story — 25+ Years of Construction in the Tri-State',
  description: 'Learn the story behind RO Unlimited — 25+ years of commercial construction, site development, and service work across Georgia, South Carolina, and North Carolina. Family-owned. Built on showing up.',
  alternates: { canonical: 'https://rounlimited.com/our-story' },
  openGraph: {
    title: 'Our Story — RO Unlimited',
    description: 'A quarter century of building it right across the tri-state. The story behind RO Unlimited.',
    url: 'https://rounlimited.com/our-story',
    siteName: 'RO Unlimited',
    type: 'website',
  },
};

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
