import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd, serviceLd } from '@/lib/seo';

// The hub page is a client component, so its metadata lives here. Without
// this, /utilities inherited the ROOT metadata and Google read the
// division's money page as a duplicate of the homepage.
const DESCRIPTION = 'Licensed underground utility contractor serving Greenville, Easley, Spartanburg and Anderson, SC: water taps, water lines, sewer, storm drainage and septic.';

export const metadata: Metadata = pageMeta({
  title: 'Underground Utility Contractor | Greenville, SC',
  description: DESCRIPTION,
  path: '/utilities',
  image: '/images/utilities/jr-hot-tap.jpg',
  imageAlt: 'RO Unlimited hot tap on a live water main',
  keywords: ['underground utility contractor Greenville SC', 'underground utilities Upstate SC', 'water main tap contractor SC', 'sanitary sewer contractor Easley SC', 'storm drainage contractor Spartanburg SC', 'water line installation Anderson SC', 'commercial septic contractor SC'],
});

const structuredData = [
  serviceLd({
    name: 'Underground Utilities',
    description: DESCRIPTION,
    path: '/utilities',
    serviceType: ['Underground utility construction', 'Water main taps and hot taps', 'Water line installation', 'Sanitary sewer installation', 'Storm drainage', 'Commercial septic systems', 'Grease interceptors'],
    image: '/images/utilities/jr-hot-tap.jpg',
  }),
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Underground Utilities', path: '/utilities' }]),
];

export default function UtilitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/utilities" />
      {children}
    </>
  );
}
