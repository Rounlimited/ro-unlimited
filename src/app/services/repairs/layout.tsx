import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Repair and handyman services in Upstate SC: drywall, interior and exterior painting, decks, fences, doors and windows, concrete patchwork and punch lists.';

export const metadata: Metadata = pageMeta({
  title: 'Repair & Handyman Services | Upstate SC',
  description: DESCRIPTION,
  path: '/services/repairs',
  image: '/images/services/repairs/repairs-hero.jpg',
  imageAlt: 'Repair work by RO Unlimited',
});

const structuredData = [
  serviceLd({
    name: 'Repair Services',
    description: DESCRIPTION,
    path: '/services/repairs',
    serviceType: ['Handyman services', 'Drywall repair', 'Painting', 'Deck building', 'Fence installation', 'Concrete repair'],
    image: '/images/services/repairs/repairs-hero.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: 'Repairs', path: '/services/repairs' }]),
];

export default function RepairsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/services/repairs" />
      {children}
    </>
  );
}
