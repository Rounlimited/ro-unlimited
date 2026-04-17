import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repair Services — Drywall, Painting, Decks, Fences, Doors, Concrete & More | RO Unlimited',
  description: 'Repair and handyman services in Upstate SC by RO Unlimited. Drywall repair, interior and exterior painting, deck building, fence installation, door and window replacement, concrete patchwork, and punch-list handyman service. Call (864) 304-0139.',
  openGraph: {
    title: 'Repair Services — RO Unlimited',
    description: 'Drywall, painting, decks, fences, doors, windows, concrete, and punch-list handyman service — all done with the same quality and care as a full build.',
    url: 'https://rounlimited.com/services/repairs',
    siteName: 'RO Unlimited',
    type: 'website',
    images: [{ url: 'https://rounlimited.com/images/services/repairs/repairs-hero.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/repairs',
  },
};

export default function RepairsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
