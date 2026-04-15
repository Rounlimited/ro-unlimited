import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plumbing Services — Repairs, Water Heaters, Drains & More | RO Unlimited',
  description: 'Licensed plumbing services in Upstate SC by RO Unlimited. Pipe repair & re-piping, water heater installation, drain cleaning, gas lines, water filtration, emergency plumbing. Call (864) 304-0139.',
  openGraph: {
    title: 'Plumbing Services — RO Unlimited',
    description: 'Pipe repair, water heaters, drain cleaning, gas lines, water filtration, renovation plumbing, and 24hr emergency service — fast response, honest pricing.',
    url: 'https://rounlimited.com/services/plumbing',
    siteName: 'RO Unlimited',
    type: 'website',
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/plumbing',
  },
};

export default function PlumbingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
