import type { MetadataRoute } from 'next';

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
    host: 'https://rounlimited.com',
  };
}
