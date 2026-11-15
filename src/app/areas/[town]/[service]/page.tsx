import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import AreaPageView from '@/components/areas/AreaPageView';
import { AREA_KINDS, AREA_PAGES, areaPath, getAreaPage } from '@/lib/areas-data';
import { breadcrumbLd, cityLd, faqLd, pageMeta, serviceLd } from '@/lib/seo';

// Town-and-service landing pages. All content lives in src/lib/areas-data.ts:
// add a town there and it is built, linked from the hub and listed in the
// sitemap with no change here.

// Unknown town or service = a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return AREA_PAGES.map((p) => ({ town: p.town, service: p.service }));
}

type Params = { params: { town: string; service: string } };

export function generateMetadata({ params }: Params): Metadata {
  const page = getAreaPage(params.town, params.service);
  if (!page) return { title: 'Not Found', robots: { index: false, follow: true } };
  return pageMeta({
    title: page.metaTitle,
    description: page.metaDescription,
    path: areaPath(page),
    image: page.heroImage,
    imageAlt: page.heroAlt,
  });
}

export default function AreaServicePage({ params }: Params) {
  const page = getAreaPage(params.town, params.service);
  if (!page) notFound();
  const kind = AREA_KINDS[page.kind];
  const path = areaPath(page);

  const structuredData = [
    // Service with the town as areaServed. Deliberately NOT a LocalBusiness
    // per town: RO is a service-area business with no premises there.
    serviceLd({
      name: page.h1,
      description: page.metaDescription,
      path,
      serviceType: kind.serviceTypes,
      image: page.heroImage,
      areaServed: page.cities.map((c) => cityLd(c.name, c.state)),
    }),
    breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: 'Service Areas', path: '/areas' },
      { name: page.h1, path },
    ]),
    faqLd(page.faq),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <AreaPageView page={page} />
    </>
  );
}
