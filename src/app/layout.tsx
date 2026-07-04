import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';
import GSAPProvider from '@/components/animations/GSAPProvider';
import ROLoader from '@/components/animations/ROLoader';
import '@/styles/globals.css';

const SITE_URL = 'https://rounlimited.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY.fullName} | ${COMPANY.serviceArea}`,
    template: `%s | ${COMPANY.name}`,
  },
  description: `${COMPANY.experience} years of commercial and residential construction in ${COMPANY.serviceArea}. Land grading, custom homes, commercial builds, roofing, electrical, plumbing, septic, and full-service repairs.`,
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
    title: `${COMPANY.fullName} | ${COMPANY.serviceArea}`,
    description: `${COMPANY.experience} years of construction across the tri-state. Custom homes, commercial builds, roofing, electrical, plumbing, septic, and repairs.`,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: COMPANY.fullName }],
  },
  twitter: {
    card: 'summary_large_image',
    title: COMPANY.fullName,
    description: `${COMPANY.experience} years of construction in the tri-state. Custom homes, commercial, roofing, electrical, plumbing, septic, repairs.`,
    images: [`${SITE_URL}/og-default.jpg`],
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
  description: `${COMPANY.experience} years of commercial and residential construction in ${COMPANY.serviceArea}.`,
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
  image: `${SITE_URL}/og-default.jpg`,
  knowsAbout: [
    'Residential Construction', 'Commercial Construction', 'Land Grading', 'Site Preparation',
    'Roofing', 'Electrical Services', 'Plumbing', 'Septic Systems', 'Drywall Repair',
    'Deck Building', 'Fence Installation', 'Concrete Work',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B2A4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RO Admin" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body className="font-body antialiased">
        <GSAPProvider>
          <ROLoader>
            {children}
          </ROLoader>
        </GSAPProvider>
      </body>
    </html>
  );
}
