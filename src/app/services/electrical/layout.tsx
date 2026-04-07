import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Electrical Services — Panel Upgrades, Rewiring & More | RO Unlimited',
  description: 'Licensed electrical services in Upstate SC by RO Unlimited. Panel upgrades, whole-house rewiring, outlet installation, lighting, and generator hookups. Insured and code-compliant. Call (864) 304-0139.',
  openGraph: {
    title: 'Electrical Services — RO Unlimited Services',
    description: 'Panel upgrades, rewiring, service calls, lighting, and outlet work — all performed by licensed electricians through RO\'s trusted trade network.',
    url: 'https://rounlimited.com/services/electrical',
    siteName: 'RO Unlimited',
    type: 'website',
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/electrical',
  },
};

export default function ElectricalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
