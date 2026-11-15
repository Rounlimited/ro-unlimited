import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Licensed plumbing services in Upstate SC: pipe repair and re-piping, water heaters, drain cleaning, gas lines, water filtration and emergency plumbing.';

export const metadata: Metadata = pageMeta({
  title: 'Plumbing Services | Greenville & Upstate SC',
  description: DESCRIPTION,
  path: '/services/plumbing',
  image: '/images/services/plumbing/plumbing-hero.jpg',
  imageAlt: 'Plumbing work by RO Unlimited',
});

const structuredData = [
  serviceLd({
    name: 'Plumbing Services',
    description: DESCRIPTION,
    path: '/services/plumbing',
    serviceType: ['Plumbing', 'Pipe repair and re-piping', 'Water heater installation', 'Drain cleaning', 'Gas line services'],
    image: '/images/services/plumbing/plumbing-hero.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: 'Plumbing', path: '/services/plumbing' }]),
];

export default function PlumbingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/services/plumbing" />
      {children}
    </>
  );
}
