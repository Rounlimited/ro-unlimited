import type { MetadataRoute } from 'next';
import { ROOFING_SUB_SERVICES } from '@/lib/roofing-data';
import { ELECTRICAL_SUB_SERVICES } from '@/lib/electrical-data';
import { PLUMBING_SUB_SERVICES } from '@/lib/plumbing-data';
import { SEPTIC_SUB_SERVICES } from '@/lib/septic-data';
import { REPAIRS_SUB_SERVICES } from '@/lib/repairs-data';

const BASE = 'https://rounlimited.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Bump manually when page content meaningfully changes — a lastmod that
  // changes on every request teaches Google to ignore it.
  const lastModified = new Date('2026-07-04');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/commercial`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/residential`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/grading`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/services`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/process`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/our-story`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/join`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const divisionRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/services/roofing`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/services/electrical`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/services/plumbing`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/services/septic`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/services/repairs`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
  ];

  const subServiceRoutes: MetadataRoute.Sitemap = [
    ...ROOFING_SUB_SERVICES.map(s => ({ url: `${BASE}/services/roofing/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...ELECTRICAL_SUB_SERVICES.map(s => ({ url: `${BASE}/services/electrical/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...PLUMBING_SUB_SERVICES.map(s => ({ url: `${BASE}/services/plumbing/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...SEPTIC_SUB_SERVICES.map(s => ({ url: `${BASE}/services/septic/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...REPAIRS_SUB_SERVICES.map(s => ({ url: `${BASE}/services/repairs/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];

  return [...staticRoutes, ...divisionRoutes, ...subServiceRoutes];
}
