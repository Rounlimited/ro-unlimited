'use client';

import { SERVICE_CATEGORIES } from '@/lib/services-data';
import ServicePageTemplate from '@/components/sections/ServicePageTemplate';

const category = SERVICE_CATEGORIES.find(c => c.id === 'repairs')!;

export default function RepairsPage() {
  return <ServicePageTemplate category={category} />;
}
