import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GSAPProvider from '@/components/animations/GSAPProvider';
import ProgressBar from '@/components/animations/ProgressBar';
import LoadingSequence from '@/components/animations/LoadingSequence';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: `${COMPANY.fullName} | ${COMPANY.serviceArea}`,
  description: `${COMPANY.experience} years of commercial and residential construction in ${COMPANY.serviceArea}. Land grading, custom homes, commercial builds, and full development services.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <GSAPProvider>
          <ProgressBar />
          <LoadingSequence>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </LoadingSequence>
        </GSAPProvider>
      </body>
    </html>
  );
}