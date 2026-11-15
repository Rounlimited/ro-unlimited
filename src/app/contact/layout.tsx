import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd } from '@/lib/seo';

const DESCRIPTION = 'Send RO Unlimited your plans or request a quote for commercial construction, site work or utilities in Upstate SC and Northeast Georgia. Call (864) 304-0139.';

export const metadata: Metadata = pageMeta({
  title: 'Contact & Quotes | Upstate SC General Contractor',
  description: DESCRIPTION,
  path: '/contact',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]),
];

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/contact" />
      {children}
    </>
  );
}
