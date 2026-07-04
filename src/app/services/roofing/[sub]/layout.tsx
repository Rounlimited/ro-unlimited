import type { Metadata } from 'next';
import { ROOFING_SUB_SERVICES } from '@/lib/roofing-data';

type Props = { params: Promise<{ sub: string }> };

export function generateStaticParams() {
  return ROOFING_SUB_SERVICES.map(s => ({ sub: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const svc = ROOFING_SUB_SERVICES.find(s => s.slug === sub);

  if (!svc) return { title: 'Service Not Found — RO Unlimited' };

  return {
    title: `${svc.title} — Roofing Services | RO Unlimited`,
    description: svc.heroDescription,
    keywords: svc.seoKeywords,
    alternates: { canonical: `https://rounlimited.com/services/roofing/${svc.slug}` },
    openGraph: {
      title: `${svc.title} — RO Unlimited Roofing`,
      description: svc.heroDescription,
      url: `https://rounlimited.com/services/roofing/${svc.slug}`,
      type: 'website',
      images: [{ url: `https://rounlimited.com${svc.heroImage}`, width: 1200, height: 630 }],
    },
  };
}

export default function RoofingSubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
