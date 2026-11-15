import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd } from '@/lib/seo';

const DESCRIPTION = 'South Carolina general contractor, mechanical and onsite wastewater license classifications held by RO Unlimited, plus a Georgia general contractor license.';

export const metadata: Metadata = pageMeta({
  title: 'Contractor Licenses: South Carolina & Georgia',
  description: DESCRIPTION,
  path: '/licenses',
  image: '/og-licenses.png',
  imageAlt: 'RO Unlimited South Carolina license classifications',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Licenses', path: '/licenses' }]),
];

export default function LicensesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/licenses" />
      {children}
    </>
  );
}
