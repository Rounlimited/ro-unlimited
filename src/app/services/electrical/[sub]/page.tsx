'use client';

import { useParams } from 'next/navigation';
import { ELECTRICAL_SUB_SERVICES } from '@/lib/electrical-data';
import SubServicePage from '@/components/sections/SubServicePage';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function ElectricalSubPage() {
  const params = useParams();
  const slug = params?.sub as string;
  const subService = ELECTRICAL_SUB_SERVICES.find(s => s.slug === slug);

  if (!subService) {
    return (
      <div className="min-h-screen bg-ro-black flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-ro-white font-heading text-3xl uppercase mb-4">Service Not Found</h1>
          <p className="text-ro-gray-400 mb-8">The electrical service you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/services/electrical" className="inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase">
            Back to Electrical Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SubServicePage
      subService={subService}
      parentSlug="electrical"
      parentLabel="Electrical"
      icon={Zap}
      allSubServices={ELECTRICAL_SUB_SERVICES}
    />
  );
}
