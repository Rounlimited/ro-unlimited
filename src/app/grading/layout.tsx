import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';
import { GRADING_FAQS } from '@/lib/grading-data';

const DESCRIPTION = 'Site work for commercial projects in Greenville, Easley, Greer and across Upstate SC: clearing, mass grading, building pads, stormwater and erosion control.';
const OG_IMAGE = '/images/grading/px-dozer-mass-grading-9577586.jpg';

export const metadata: Metadata = pageMeta({
  title: 'Site Work & Land Grading Contractor | Upstate SC',
  description: DESCRIPTION,
  path: '/grading',
  image: OG_IMAGE,
  imageAlt: 'Bulldozer grading red soil on a commercial site',
  keywords: ['site work contractor Greenville SC', 'land grading Upstate SC', 'site development contractor SC', 'mass grading Easley SC', 'site preparation Greer SC', 'erosion control contractor SC', 'building pad grading', 'land clearing contractor Upstate SC', 'stormwater detention pond contractor SC'],
});

const structuredData = [
  serviceLd({
    name: 'Site Development & Grading',
    description: DESCRIPTION,
    path: '/grading',
    serviceType: ['Site work', 'Land grading', 'Land clearing and grubbing', 'Site preparation', 'Clearing and mass grading', 'Building pads', 'Stormwater management', 'Erosion and sediment control', 'Driveway and parking subgrade'],
    image: OG_IMAGE,
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Site Development & Grading', path: '/grading' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GRADING_FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
];

export default function GradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/grading" />
      {children}
    </>
  );
}
