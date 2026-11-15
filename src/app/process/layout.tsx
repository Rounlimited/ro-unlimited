import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd } from '@/lib/seo';

const DESCRIPTION = 'How RO Unlimited takes a project from raw land to final walkthrough: design, planning, permitting, site work, construction management and quality checks.';

export const metadata: Metadata = pageMeta({
  title: 'Our Construction Process | Upstate SC Contractor',
  description: DESCRIPTION,
  path: '/process',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Our Process', path: '/process' }]),
];

export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/process" />
      {children}
    </>
  );
}
