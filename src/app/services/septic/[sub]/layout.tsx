import type { Metadata } from 'next';
import { SEPTIC_SUB_SERVICES } from '@/lib/septic-data';

type Props = { params: Promise<{ sub: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const svc = SEPTIC_SUB_SERVICES.find(s => s.slug === sub);

  if (!svc) return { title: 'Service Not Found — RO Unlimited' };

  return {
    title: `${svc.title} — Septic Services | RO Unlimited`,
    description: svc.heroDescription,
    keywords: svc.seoKeywords,
    alternates: { canonical: `https://rounlimited.com/services/septic/${svc.slug}` },
    openGraph: {
      title: `${svc.title} — RO Unlimited Septic`,
      description: svc.heroDescription,
      url: `https://rounlimited.com/services/septic/${svc.slug}`,
      type: 'website',
      images: [{ url: `https://rounlimited.com${svc.heroImage}`, width: 1200, height: 630 }],
    },
  };
}

export default function SepticSubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
