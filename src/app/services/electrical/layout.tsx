import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Electrical Services — Panel Upgrades, EV Chargers, Solar & More | RO Unlimited',
  description: 'Licensed electrical services in Upstate SC by RO Unlimited. Panel upgrades, rewiring, EV charger installation, solar & battery storage, generators, smart home automation, lighting design, and surge protection. Call (864) 304-0139.',
  openGraph: {
    title: 'Electrical Services — RO Unlimited',
    description: 'Panel upgrades, EV chargers, solar & battery, generators, smart home automation, lighting, and more — handled by licensed electricians in Upstate SC.',
    url: 'https://rounlimited.com/services/electrical',
    siteName: 'RO Unlimited',
    type: 'website',
    images: [{ url: 'https://rounlimited.com/images/services/electrical/electrical-hero.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://rounlimited.com/services/electrical',
  },
};

export default function ElectricalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
