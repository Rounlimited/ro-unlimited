import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Septic Services — Pumping, Repair, Installation & Drain Field Work | RO Unlimited',
  description: 'Septic services in Upstate SC by RO Unlimited. Tank pumping, inspection, repair, new installation, drain field restoration, system replacement, sewer line jetting, and 24/7 emergency response. DHEC-permitted installs. Call (864) 304-0139.',
  openGraph: {
    title: 'Septic Services — RO Unlimited',
    description: 'Pumping, inspections, repairs, installations, drain field restoration, line jetting, and emergency response — done right, DHEC permitted, and built to last.',
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
