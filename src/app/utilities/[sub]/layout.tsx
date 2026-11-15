import type { Metadata } from 'next';
import { getUtilitySubService, UTILITY_SUB_SERVICES } from '@/lib/utilities-data';
import { pageMeta } from '@/lib/seo';

// Per-sub-service metadata. The page itself is a client component, so titles,
// descriptions, and canonicals are generated here from utilities-data.

// Unknown slugs are a real 404 (not a 200 "Service Not Found" screen).
export const dynamicParams = false;

export function generateStaticParams() {
  return UTILITY_SUB_SERVICES.map((s) => ({ sub: s.slug }));
}

export function generateMetadata({ params }: { params: { sub: string } }): Metadata {
  const s = getUtilitySubService(params.sub);
  if (!s) return { title: 'Service Not Found', robots: { index: false, follow: true } };
  return pageMeta({
    title: `${s.title} | Greenville, SC`,
    // heroDescription is written for humans; pageMeta trims it to a
    // search-result-safe length on a word boundary.
    description: s.heroDescription,
    path: `/utilities/${s.slug}`,
    image: s.heroImage,
    imageAlt: `${s.title} by RO Unlimited`,
    keywords: s.seoKeywords,
  });
}

export default function UtilitySubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
