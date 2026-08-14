import type { Metadata } from 'next';
import { getUtilitySubService, UTILITY_SUB_SERVICES } from '@/lib/utilities-data';

// Per-sub-service metadata. The page itself is a client component, so titles,
// descriptions, and canonicals are generated here from utilities-data —
// otherwise every sub-page carried the root metadata and a canonical pointing
// at the homepage.
export function generateStaticParams() {
  return UTILITY_SUB_SERVICES.map((s) => ({ sub: s.slug }));
}

export function generateMetadata({ params }: { params: { sub: string } }): Metadata {
  const s = getUtilitySubService(params.sub);
  if (!s) return {};
  const url = `https://rounlimited.com/utilities/${s.slug}`;
  // heroDescription is written for humans; it doubles as the meta description,
  // trimmed to a SERP-safe length on a word boundary.
  const desc =
    s.heroDescription.length > 158
      ? s.heroDescription.slice(0, 155).replace(/\s+\S*$/, '') + '…'
      : s.heroDescription;
  return {
    title: `${s.title} | Greenville–Easley SC`,
    description: desc,
    keywords: s.seoKeywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${s.title} — RO Unlimited Utility Division`,
      description: desc,
      url,
      images: [{ url: `https://rounlimited.com${s.heroImage}`, width: 1200, height: 630 }],
    },
  };
}

export default function UtilitySubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
