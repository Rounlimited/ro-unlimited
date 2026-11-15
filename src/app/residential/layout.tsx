import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Custom home construction in Upstate South Carolina: ground-up new builds, framing, structural shells and interior renovations by a licensed general contractor.';

export const metadata: Metadata = pageMeta({
  title: 'Custom Home Construction | Upstate SC',
  description: DESCRIPTION,
  path: '/residential',
  image: '/images/divisions/residential-home-v2.jpg',
  imageAlt: 'Custom home built by RO Unlimited',
  keywords: ['custom home builder Greenville SC', 'residential construction Upstate SC', 'home framing contractor SC', 'new home construction Easley SC'],
});

const structuredData = [
  serviceLd({
    name: 'Residential Construction',
    description: DESCRIPTION,
    path: '/residential',
    serviceType: ['Custom home construction', 'Home framing', 'Residential renovation'],
    image: '/images/divisions/residential-home-v2.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Residential Construction', path: '/residential' }]),
];

export default function ResidentialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/residential" />
      {children}
    </>
  );
}
