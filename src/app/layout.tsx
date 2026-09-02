import type { Metadata } from 'next';
import { Oswald, Barlow, JetBrains_Mono } from 'next/font/google';
import { COMPANY } from '@/lib/constants';
import GSAPProvider from '@/components/animations/GSAPProvider';
import ROLoader from '@/components/animations/ROLoader';
import SiteAnalytics from '@/components/analytics/SiteAnalytics';
import { Suspense } from 'react';
import '@/styles/globals.css';

const SITE_URL = 'https://rounlimited.com';

// Self-hosted via next/font — no render-blocking Google Fonts stylesheet.
const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-heading', display: 'swap' });
const barlow = Barlow({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-body', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title = keyword + geo + brand; the slogan never displaces the keyword here.
  // "From the Underground Up" lives in the meta description (CTR copy) and on
  // the page itself, where taglines belong.
  title: {
    default: 'Commercial General Contractor | Buildings, Site Work & Utilities | Greenville–Easley SC | RO Unlimited',
    template: `%s | ${COMPANY.name}`,
  },
  // Leads with the buildings. The underground is the reason RO is different,
  // not the thing RO is — an agent read the old copy and assumed dirt only.
  description: 'Commercial construction across SC, NC and GA — offices, retail, warehouses and ground-up builds. The grading, water, sewer and septic beneath them are ours as well, so one company carries the job from the first cut to the final walkthrough. Licensed general contractor, 25+ years, Easley SC.',
  applicationName: COMPANY.name,
  authors: [{ name: COMPANY.fullName, url: SITE_URL }],
  creator: COMPANY.fullName,
  publisher: COMPANY.fullName,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: COMPANY.name,
    title: `${COMPANY.fullName} | Commercial General Contractor`,
    description: 'Commercial buildings — with the site work and utilities beneath them handled by the same company. One contractor, first cut to final walkthrough.',
    images: [{ url: `${SITE_URL}/og-commercial.jpg`, width: 1200, height: 630, alt: `${COMPANY.fullName} — commercial construction` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: COMPANY.fullName,
    description: `Commercial buildings, and the site work and utilities beneath them. One licensed contractor across SC, NC & GA. ${COMPANY.experience} years.`,
    images: [`${SITE_URL}/og-commercial.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  '@id': `${SITE_URL}/#organization`,
  name: COMPANY.fullName,
  alternateName: COMPANY.name,
  url: SITE_URL,
  telephone: COMPANY.phone,
  email: COMPANY.email,
  description: `${COMPANY.experience} years of commercial construction and site development in ${COMPANY.serviceArea}.`,
  // Service-area business (no public street address yet) — keep this list in
  // sync with the service areas declared on the Google Business Profile.
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'SC',
    addressCountry: 'US',
  },
  areaServed: [
    { '@type': 'City', name: 'Greenville', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Spartanburg', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Anderson', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Greer', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Simpsonville', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Easley', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Seneca', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Clemson', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Travelers Rest', containedInPlace: { '@type': 'State', name: 'South Carolina' } },
    { '@type': 'City', name: 'Toccoa', containedInPlace: { '@type': 'State', name: 'Georgia' } },
    { '@type': 'City', name: 'Lavonia', containedInPlace: { '@type': 'State', name: 'Georgia' } },
    { '@type': 'City', name: 'Hartwell', containedInPlace: { '@type': 'State', name: 'Georgia' } },
    { '@type': 'City', name: 'Hendersonville', containedInPlace: { '@type': 'State', name: 'North Carolina' } },
    { '@type': 'City', name: 'Asheville', containedInPlace: { '@type': 'State', name: 'North Carolina' } },
  ],
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '07:00',
    closes: '18:00',
  }],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: COMPANY.phone,
    contactType: 'customer service',
    areaServed: ['US-SC', 'US-GA', 'US-NC'],
    availableLanguage: 'English',
  },
  sameAs: [COMPANY.facebook],
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  image: `${SITE_URL}/og-commercial.jpg`,
  // Ordered deliberately: what RO builds first, then how it gets built. Search
  // engines and AI summarisers read this list as what the company IS.
  knowsAbout: [
    'General Contracting', 'Commercial Construction',
    'Ground-Up Commercial Buildings', 'Design-Build Construction',
    'Site Development', 'Land Grading', 'Site Preparation',
    'Underground Utilities', 'Water Main Taps', 'Hot Taps', 'Water Line Installation',
    'Sanitary Sewer Installation', 'Storm Drainage', 'Commercial Septic Systems',
    'Grease Interceptors', 'Boring and Tunneling', 'Directional Boring',
    'Highway and Bridge Construction',
    'Roofing', 'Electrical Services', 'Plumbing',
    'Septic Systems', 'Drywall Repair', 'Deck Building', 'Fence Installation', 'Concrete Work',
  ],
  // The seven state license classifications RO holds (owner-confirmed 2026-08).
  // E-E-A-T: license specifics are prequalification data for GCs, not wallpaper.
  hasCredential: [
    // License numbers as printed on the Utility Division seal (owner's badge)
    { name: 'General Contractor — Building License', id: 'CLG 127704' },
    { name: 'Onsite Wastewater License', id: 'OSWW10837' },
    { name: 'Mechanical License', id: 'CLM119115' },
    { name: 'Boring & Tunneling License' },
    { name: 'Water & Sewer Lines License' },
    { name: 'Highway — Roads & Bridges License' },
    { name: 'Grading License' },
    { name: 'Specialty Concrete License' },
    { name: 'Specialty Masonry License' },
  ].map(({ name, id }: { name: string; id?: string }) => ({
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'license',
    name,
    ...(id ? { identifier: id } : {}),
  })),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${barlow.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B2A4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RO Admin" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body className="font-body antialiased">
        <GSAPProvider>
          <ROLoader>
            {children}
          </ROLoader>
        </GSAPProvider>
        <Suspense fallback={null}><SiteAnalytics /></Suspense>
      </body>
    </html>
  );
}
