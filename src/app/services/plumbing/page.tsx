'use client';

import { SERVICE_CATEGORIES } from '@/lib/services-data';
import ServicePageTemplate from '@/components/sections/ServicePageTemplate';

const category = SERVICE_CATEGORIES.find(c => c.id === 'plumbing')!;

export default function PlumbingPage() {
  return <ServicePageTemplate category={category} />;
}
