'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GSAPProvider from '@/components/animations/GSAPProvider';
import ProgressBar from '@/components/animations/ProgressBar';
import LoadingSequence from '@/components/animations/LoadingSequence';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Admin routes render children directly — no site nav/footer
  if (isAdmin) {
    return <>{children}</>;
  }

  // Public site gets full chrome
  return (
    <GSAPProvider>
      <ProgressBar />
      <LoadingSequence>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </LoadingSequence>
    </GSAPProvider>
  );
}
