import type { Metadata } from 'next';
import { PLUMBING_SUB_SERVICES } from '@/lib/plumbing-data';

type Props = { params: Promise<{ sub: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const svc = PLUMBING_SUB_SERVICES.find(s => s.slug === sub);

  if (!svc) return { title: 'Service Not Found — RO Unlimited' };

  return {
    title: `${svc.title} — Plumbing Services | RO Unlimited`,
    description: svc.heroDescription,
    keywords: svc.seoKeywords,
    alternates: { canonical: `https://rounlimited.com/services/plumbing/${svc.slug}` },
    openGraph: {
      title: `${svc.title} — RO Unlimited Plumbing`,
      description: svc.heroDescription,
      url: `https://rounlimited.com/services/plumbing/${svc.slug}`,
      type: 'website',
      images: [{ url: `https://rounlimited.com${svc.heroImage}`, width: 1200, height: 630 }],
    },
  };
}

export default function PlumbingSubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
