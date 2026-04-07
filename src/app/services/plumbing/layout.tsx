import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plumbing Repair & Installation | RO Unlimited Services',
  description: 'Fast, reliable plumbing repair and installation in Upstate SC. Pipe repair, water heater replacement, fixture installs, drain clearing, and emergency service by RO Unlimited. Call (864) 304-0139.',
  openGraph: {
    title: 'Plumbing Repair & Installation — RO Unlimited Services',
    description: 'From leaking pipes to water heater failures, RO\'s plumbing crew responds fast and fixes it right. No hourly padding, no surprise charges.',
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
