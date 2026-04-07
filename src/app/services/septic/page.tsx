'use client';

import { SERVICE_CATEGORIES } from '@/lib/services-data';
import ServicePageTemplate from '@/components/sections/ServicePageTemplate';

const category = SERVICE_CATEGORIES.find(c => c.id === 'septic')!;

export default function SepticPage() {
  return <ServicePageTemplate category={category} />;
}
