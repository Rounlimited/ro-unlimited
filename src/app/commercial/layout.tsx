import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Ground-up commercial construction in Greenville, Spartanburg, Anderson and Upstate SC, plus Northeast Georgia: retail, offices, warehouses and steel buildings.';

export const metadata: Metadata = pageMeta({
  title: 'Commercial Construction | Greenville & Upstate SC',
  description: DESCRIPTION,
  path: '/commercial',
  image: '/images/divisions/commercial-building-v2.jpg',
  imageAlt: 'Commercial building constructed by RO Unlimited',
  keywords: ['commercial general contractor Greenville SC', 'commercial construction Upstate SC', 'commercial contractor Spartanburg SC', 'commercial builder Anderson SC', 'steel building construction SC', 'retail construction contractor SC', 'commercial contractor Northeast Georgia'],
});

const structuredData = [
  serviceLd({
    name: 'Commercial Construction',
    description: DESCRIPTION,
    path: '/commercial',
    serviceType: ['Commercial construction', 'General contracting', 'Ground-up commercial buildings', 'Retail and restaurant buildouts', 'Steel building construction'],
    image: '/images/divisions/commercial-building-v2.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Commercial Construction', path: '/commercial' }]),
];

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/commercial" />
      {children}
    </>
  );
}
