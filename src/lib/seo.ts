import type { Metadata } from 'next';

/**
 * One place that builds page metadata for the public site, so every page gets
 * the full set: an absolute title, a description that fits a search result,
 * a canonical pointing at its own URL, and Open Graph + Twitter tags with an
 * image. (Next replaces the whole `openGraph` / `twitter` object when a child
 * layout defines one, so a page that set only title + url silently lost its
 * share image and inherited the homepage's Twitter title.)
 */
export const SITE_URL = 'https://rounlimited.com';
export const SITE_NAME = 'RO Unlimited';
export const LEGAL_NAME = 'RO Unlimited Construction & Development';
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const DEFAULT_OG_IMAGE = '/og-licenses.png';

export const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path === '/' ? '' : path}`);

/** Trim to a search-result-safe length on a word boundary. */
export function clip(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  // Prefer ending on a full sentence when one fits in a useful length.
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (stop >= 90) return cut.slice(0, stop + 1);
  return cut.slice(0, max - 1).replace(/[\s,;:—–-]+\S*$/, '') + '…';
}

type PageMetaInput = {
  /** Full title, WITHOUT the brand. The brand is appended here. */
  title: string;
  description: string;
  /** Path beginning with "/" ("/" for the homepage). */
  path: string;
  /** Path or absolute URL of the share image. */
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  /** Set false to leave the brand off (title already carries it). */
  brand?: boolean;
};

export function pageMeta({ title, description, path, image, imageAlt, keywords, brand = true }: PageMetaInput): Metadata {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
  const fullTitle = brand ? `${title} | ${SITE_NAME}` : title;
  const desc = clip(description);
  const img = abs(image || DEFAULT_OG_IMAGE);
  return {
    title: { absolute: fullTitle },
    description: desc,
    ...(keywords && keywords.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description: desc,
      images: [{ url: img, alt: imageAlt || title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [img],
    },
  };
}

/**
 * Title for a sub-service page. Keeps the trade in the title when the service
 * name alone does not say it ("Emergency Service" → "Emergency Service |
 * Septic | Upstate SC").
 */
export function subServiceTitle(title: string, tradeLabel: string, tradeStems: string[]): string {
  const lower = title.toLowerCase();
  const saysTrade = tradeStems.some((s) => lower.includes(s));
  return saysTrade ? `${title} | Greenville & Upstate SC` : `${title} | ${tradeLabel} | Upstate SC`;
}

/* ─── Structured data ─────────────────────────────────────── */

const AREA_STATES = [
  { '@type': 'State', name: 'South Carolina' },
  { '@type': 'State', name: 'Georgia' },
];

/** Reference to the one organisation node declared in the root layout. */
export const ORG_REF = { '@type': 'GeneralContractor', '@id': ORG_ID, name: LEGAL_NAME, url: SITE_URL };

export function serviceLd(opts: { name: string; description: string; path: string; serviceType?: string | string[]; image?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${abs(opts.path)}#service`,
    name: opts.name,
    description: clip(opts.description, 300),
    url: abs(opts.path),
    ...(opts.serviceType ? { serviceType: opts.serviceType } : {}),
    ...(opts.image ? { image: abs(opts.image) } : {}),
    provider: ORG_REF,
    areaServed: AREA_STATES,
  };
}

export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: t.path === '/' ? `${SITE_URL}/` : abs(t.path),
    })),
  };
}
