'use client';

import { useParams } from 'next/navigation';
import { PLUMBING_SUB_SERVICES } from '@/lib/plumbing-data';
import SubServicePage from '@/components/sections/SubServicePage';
import { Pipette } from 'lucide-react';
import Link from 'next/link';

export default function PlumbingSubPage() {
  const params = useParams();
  const slug = params?.sub as string;
  const subService = PLUMBING_SUB_SERVICES.find(s => s.slug === slug);

  if (!subService) {
    return (
      <div className="min-h-screen bg-ro-black flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-ro-white font-heading text-3xl uppercase mb-4">Service Not Found</h1>
          <p className="text-ro-gray-400 mb-8">The plumbing service you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/services/plumbing" className="inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase">
            Back to Plumbing Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SubServicePage
      subService={subService}
      parentSlug="plumbing"
      parentLabel="Plumbing"
      icon={Pipette}
      allSubServices={PLUMBING_SUB_SERVICES}
    />
  );
}
