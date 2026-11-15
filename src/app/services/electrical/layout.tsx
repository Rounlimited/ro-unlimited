import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Licensed electrical services in Upstate SC: panel upgrades, rewiring, EV chargers, generators, solar and battery storage, lighting and surge protection.';

export const metadata: Metadata = pageMeta({
  title: 'Electrical Services | Greenville & Upstate SC',
  description: DESCRIPTION,
  path: '/services/electrical',
  image: '/images/services/electrical/electrical-hero.jpg',
  imageAlt: 'Electrical work by RO Unlimited',
});

const structuredData = [
  serviceLd({
    name: 'Electrical Services',
    description: DESCRIPTION,
    path: '/services/electrical',
    serviceType: ['Electrical services', 'Panel upgrades', 'Rewiring', 'EV charger installation', 'Generator installation'],
    image: '/images/services/electrical/electrical-hero.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: 'Electrical', path: '/services/electrical' }]),
];

export default function ElectricalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/services/electrical" />
      {children}
    </>
  );
}
