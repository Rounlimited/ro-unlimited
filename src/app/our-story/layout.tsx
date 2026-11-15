import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd } from '@/lib/seo';

const DESCRIPTION = 'The story behind RO Unlimited Construction & Development: 25+ years of commercial construction, site development and utilities in South Carolina and Georgia.';

export const metadata: Metadata = pageMeta({
  title: 'About RO Unlimited | General Contractor in Easley, SC',
  brand: false,
  description: DESCRIPTION,
  path: '/our-story',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Our Story', path: '/our-story' }]),
];

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/our-story" />
      {children}
    </>
  );
}
