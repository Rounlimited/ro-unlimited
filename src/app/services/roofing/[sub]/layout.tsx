import type { Metadata } from 'next';
import { ROOFING_SUB_SERVICES } from '@/lib/roofing-data';
import { pageMeta, subServiceTitle } from '@/lib/seo';

type Props = { params: { sub: string } };

// Only the slugs in the data file exist. Anything else is a real 404, not a
// "Service Not Found" screen served with a 200 (which Google files as a
// soft 404 and keeps re-crawling).
export const dynamicParams = false;

export function generateStaticParams() {
  return ROOFING_SUB_SERVICES.map(s => ({ sub: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const svc = ROOFING_SUB_SERVICES.find(s => s.slug === params.sub);
  if (!svc) return { title: 'Service Not Found', robots: { index: false, follow: true } };

  return pageMeta({
    title: subServiceTitle(svc.title, 'Roofing', ['roof']),
    description: svc.heroDescription,
    path: `/services/roofing/${svc.slug}`,
    image: svc.heroImage,
    imageAlt: `${svc.title} by RO Unlimited`,
    keywords: svc.seoKeywords,
  });
}

export default function RoofingSubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
