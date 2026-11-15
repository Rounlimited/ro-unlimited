import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Septic services in Upstate SC: tank pumping, inspection, repair, new installation, drain field restoration, system replacement and sewer line jetting.';

export const metadata: Metadata = pageMeta({
  title: 'Septic Installation, Repair & Pumping | Upstate SC',
  description: DESCRIPTION,
  path: '/services/septic',
  image: '/images/services/septic/septic-hero.jpg',
  imageAlt: 'Septic system work by RO Unlimited',
});

const structuredData = [
  serviceLd({
    name: 'Septic Services',
    description: DESCRIPTION,
    path: '/services/septic',
    serviceType: ['Septic system installation', 'Septic repair', 'Septic tank pumping', 'Septic inspection', 'Drain field repair'],
    image: '/images/services/septic/septic-hero.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: 'Septic', path: '/services/septic' }]),
];

export default function SepticLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/services/septic" />
      {children}
    </>
  );
}
