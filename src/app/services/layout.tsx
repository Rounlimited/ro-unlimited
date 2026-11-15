import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd } from '@/lib/seo';

const DESCRIPTION = 'Roofing, plumbing, electrical, septic and general repair services across Upstate South Carolina and Northeast Georgia from a licensed, insured contractor.';

export const metadata: Metadata = pageMeta({
  title: 'Roofing, Plumbing, Electrical & Septic | Upstate SC',
  description: DESCRIPTION,
  path: '/services',
  image: '/images/services/hub/hub-roofing.jpg',
  imageAlt: 'RO Unlimited roofing, plumbing, electrical, septic and repair services',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }]),
];

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/services" />
      {children}
    </>
  );
}
