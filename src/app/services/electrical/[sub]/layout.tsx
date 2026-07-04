import type { Metadata } from 'next';
import { ELECTRICAL_SUB_SERVICES } from '@/lib/electrical-data';

type Props = { params: Promise<{ sub: string }> };

export function generateStaticParams() {
  return ELECTRICAL_SUB_SERVICES.map(s => ({ sub: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const svc = ELECTRICAL_SUB_SERVICES.find(s => s.slug === sub);

  if (!svc) return { title: 'Service Not Found — RO Unlimited' };

  return {
    title: `${svc.title} — Electrical Services | RO Unlimited`,
    description: svc.heroDescription,
    keywords: svc.seoKeywords,
    alternates: { canonical: `https://rounlimited.com/services/electrical/${svc.slug}` },
    openGraph: {
      title: `${svc.title} — RO Unlimited Electrical`,
      description: svc.heroDescription,
      url: `https://rounlimited.com/services/electrical/${svc.slug}`,
      type: 'website',
      images: [{ url: `https://rounlimited.com${svc.heroImage}`, width: 1200, height: 630 }],
    },
  };
}

export default function ElectricalSubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
