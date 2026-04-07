'use client';

import { SERVICE_CATEGORIES } from '@/lib/services-data';
import ServicePageTemplate from '@/components/sections/ServicePageTemplate';

const category = SERVICE_CATEGORIES.find(c => c.id === 'electrical')!;

export default function ElectricalPage() {
  return <ServicePageTemplate category={category} />;
}
