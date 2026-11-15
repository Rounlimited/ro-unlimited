import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

const DESCRIPTION = 'Site work for commercial projects in Greenville, Easley, Greer and across Upstate SC: clearing, mass grading, building pads, stormwater and erosion control.';

export const metadata: Metadata = pageMeta({
  title: 'Site Work & Land Grading Contractor | Upstate SC',
  description: DESCRIPTION,
  path: '/grading',
  keywords: ['site work contractor Greenville SC', 'land grading Upstate SC', 'site development contractor SC', 'mass grading Easley SC', 'site preparation Greer SC', 'erosion control contractor SC', 'building pad grading'],
});

const structuredData = [
  serviceLd({
    name: 'Site Development & Grading',
    description: DESCRIPTION,
    path: '/grading',
    serviceType: ['Site work', 'Land grading', 'Site preparation', 'Clearing and mass grading', 'Stormwater management', 'Erosion and sediment control'],
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Site Development & Grading', path: '/grading' }]),
];

export default function GradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/grading" />
      {children}
    </>
  );
}
