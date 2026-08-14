'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Waves } from 'lucide-react';
import { UTILITY_SUB_SERVICES, getUtilitySubService } from '@/lib/utilities-data';
import SubServicePage from '@/components/sections/SubServicePage';
import UtilityPlanBackdrop from '@/components/sections/UtilityPlanBackdrop';

export default function UtilitySubPage() {
  const params = useParams();
  const slug = params?.sub as string;
  const subService = getUtilitySubService(slug);

  if (!subService) {
    return (
      <div className="min-h-screen bg-ro-black flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-ro-white font-heading text-3xl uppercase mb-4">Service Not Found</h1>
          <p className="text-ro-gray-400 mb-8">That underground utilities page doesn&apos;t exist.</p>
          <Link
            href="/utilities"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ro-gold text-ro-black font-heading text-xs tracking-[0.15em] uppercase"
          >
            Back to Underground Utilities
          </Link>
        </div>
      </div>
    );
  }

  return (
    // .ud-theme flips every ro-gold class inside to Utility Division orange
    // (CSS-var token swap — see globals.css); the plan-sheet backdrop shows
    // through the template's transparent sections.
    <div className="ud-theme relative">
      <UtilityPlanBackdrop />
      <SubServicePage
        subService={subService}
        // basePath '' + parentSlug 'utilities' resolves to /utilities/<slug>,
        // since these sit at the top level rather than under /services.
        basePath=""
        parentSlug="utilities"
        parentLabel="Underground Utilities"
        icon={Waves}
        allSubServices={UTILITY_SUB_SERVICES}
      />
    </div>
  );
}
