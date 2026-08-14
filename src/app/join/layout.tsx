import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the RO Network — Trade Partners & Subcontractors',
  description:
    'RO Unlimited partners with proven trade professionals across SC, NC & GA. Framers, electricians, plumbers, finishers — join the network and get steady commercial and residential work.',
  alternates: { canonical: 'https://rounlimited.com/join' },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
