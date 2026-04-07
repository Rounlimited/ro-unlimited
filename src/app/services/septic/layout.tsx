import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Septic System Repair & Installation | RO Unlimited Services',
  description: 'Septic system repair, replacement, and new installation in Upstate SC by RO Unlimited. Soil testing, permitting, drain field work, and full system installs. Licensed contractor. Call (864) 304-0139.',
  openGraph: {
    title: 'Septic System Repair & Installation — RO Unlimited Services',
    description: 'RO handles the full lifecycle of septic systems — diagnosing failures, repairing drain fields, replacing tanks, and installing new systems.',
    url: 'https://rounlimited.com/services/septic',
    siteName: 'RO Unlimited',
    type: 'website',
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/septic',
  },
};

export default function SepticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
