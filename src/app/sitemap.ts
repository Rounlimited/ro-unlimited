import type { MetadataRoute } from 'next';
import { ROOFING_SUB_SERVICES } from '@/lib/roofing-data';
import { ELECTRICAL_SUB_SERVICES } from '@/lib/electrical-data';
import { PLUMBING_SUB_SERVICES } from '@/lib/plumbing-data';
import { SEPTIC_SUB_SERVICES } from '@/lib/septic-data';
import { REPAIRS_SUB_SERVICES } from '@/lib/repairs-data';
import { UTILITY_SUB_SERVICES } from '@/lib/utilities-data';
import { AREA_PAGES, areaPath } from '@/lib/areas-data';

const BASE = 'https://rounlimited.com';

/**
 * Every public, indexable page — and nothing else. Customer links (/estimate,
 * /i, /r, /my, /shared, /intake, /proposal), /admin and /api never go here.
 *
 * Adding a public page? Add it here too. /utilities and its six sub-pages were
 * live for three months without being listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Bump manually when page content or metadata meaningfully changes — a
  // lastmod that changes on every request teaches Google to ignore it.
  const lastModified = new Date('2026-11-15');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/commercial`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/grading`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/utilities`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/residential`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/services`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/process`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/our-story`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/licenses`, lastModified, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/join`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const utilityRoutes: MetadataRoute.Sitemap = UTILITY_SUB_SERVICES.map(s => ({
    url: `${BASE}/utilities/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.9,
  }));

  const divisionRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/services/roofing`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/services/electrical`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/services/plumbing`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/services/septic`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/services/repairs`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const subServiceRoutes: MetadataRoute.Sitemap = [
    ...ROOFING_SUB_SERVICES.map(s => ({ url: `${BASE}/services/roofing/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...ELECTRICAL_SUB_SERVICES.map(s => ({ url: `${BASE}/services/electrical/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...PLUMBING_SUB_SERVICES.map(s => ({ url: `${BASE}/services/plumbing/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...SEPTIC_SUB_SERVICES.map(s => ({ url: `${BASE}/services/septic/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...REPAIRS_SUB_SERVICES.map(s => ({ url: `${BASE}/services/repairs/${s.slug}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];

  // Town-and-service landing pages (src/lib/areas-data.ts) plus their hub.
  const areaRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/areas`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    ...AREA_PAGES.map(p => ({ url: `${BASE}${areaPath(p)}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];

  return [...staticRoutes, ...utilityRoutes, ...areaRoutes, ...divisionRoutes, ...subServiceRoutes];
}
