import type { MetadataRoute } from 'next';

/**
 * Crawling rules. Only /admin, /api and shared-file links are blocked here.
 *
 * Customer pages (/estimate, /i, /r, /my, /intake, /proposal) are deliberately
 * NOT blocked: they carry a noindex header (next.config.js), and Google can
 * only obey a noindex on a page it is allowed to fetch.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/shared/'],
      },
    ],
    sitemap: 'https://rounlimited.com/sitemap.xml',
  };
}
