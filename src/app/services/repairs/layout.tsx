import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home & Property Repairs — Drywall, Decks, Fencing & More | RO Unlimited',
  description: 'General home and property repairs in Upstate SC by RO Unlimited. Drywall, painting, deck building, fence installation, door and window replacement, concrete work. No job too small. Call (864) 304-0139.',
  openGraph: {
    title: 'General Repairs — RO Unlimited Services',
    description: 'Drywall, painting, decks, fencing, concrete patchwork, doors, windows, and everything in between. RO handles the small jobs with the same quality as a full build.',
    url: 'https://rounlimited.com/services/repairs',
    siteName: 'RO Unlimited',
    type: 'website',
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/repairs',
  },
};

export default function RepairsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
