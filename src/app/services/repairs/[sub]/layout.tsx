import type { Metadata } from 'next';
import { REPAIRS_SUB_SERVICES } from '@/lib/repairs-data';

type Props = { params: Promise<{ sub: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const svc = REPAIRS_SUB_SERVICES.find(s => s.slug === sub);

  if (!svc) return { title: 'Service Not Found — RO Unlimited' };

  return {
    title: `${svc.title} — Repair Services | RO Unlimited`,
    description: svc.heroDescription,
    keywords: svc.seoKeywords,
    alternates: { canonical: `https://rounlimited.com/services/repairs/${svc.slug}` },
    openGraph: {
      title: `${svc.title} — RO Unlimited Repairs`,
      description: svc.heroDescription,
      url: `https://rounlimited.com/services/repairs/${svc.slug}`,
      type: 'website',
      images: [{ url: `https://rounlimited.com${svc.heroImage}`, width: 1200, height: 630 }],
    },
  };
}

export default function RepairsSubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
