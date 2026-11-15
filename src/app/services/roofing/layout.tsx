import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Roof repair, storm damage restoration and roof replacement in Greenville, Spartanburg and Upstate South Carolina. Licensed and insured. Call (864) 304-0139.';

export const metadata: Metadata = pageMeta({
  title: 'Roof Repair & Replacement | Greenville & Upstate SC',
  description: DESCRIPTION,
  path: '/services/roofing',
  image: '/images/services/roofing/roofing-hero.jpg',
  imageAlt: 'Roofing work by RO Unlimited',
});

const structuredData = [
  serviceLd({
    name: 'Roofing Services',
    description: DESCRIPTION,
    path: '/services/roofing',
    serviceType: ['Roofing', 'Roof repair', 'Roof replacement', 'Storm damage roof repair'],
    image: '/images/services/roofing/roofing-hero.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: 'Roofing', path: '/services/roofing' }]),
];

export default function RoofingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/services/roofing" />
      {children}
    </>
  );
}
