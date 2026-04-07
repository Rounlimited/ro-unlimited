'use client';

import { SERVICE_CATEGORIES } from '@/lib/services-data';
import ServicePageTemplate from '@/components/sections/ServicePageTemplate';

const category = SERVICE_CATEGORIES.find(c => c.id === 'roofing')!;

export default function RoofingPage() {
  return <ServicePageTemplate category={category} />;
}
