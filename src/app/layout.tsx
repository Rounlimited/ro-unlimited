import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';
import GSAPProvider from '@/components/animations/GSAPProvider';
import ROLoader from '@/components/animations/ROLoader';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: `${COMPANY.fullName} | ${COMPANY.serviceArea}`,
  description: `${COMPANY.experience} years of commercial and residential construction in ${COMPANY.serviceArea}. Land grading, custom homes, commercial builds, and full development services.`,
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
