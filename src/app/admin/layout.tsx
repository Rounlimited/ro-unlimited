'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/admin/AuthGuard';
import AppShell from '@/components/admin/AppShell';
import PWAInstall from '@/components/admin/PWAInstall';
import OnboardingProvider, { useOnboarding } from '@/components/admin/OnboardingProvider';
import WalkthroughTours from '@/components/admin/WalkthroughTours';
import AiChatBubble from '@/components/admin/AiChatBubble';
import ActivityTracker from '@/components/admin/ActivityTracker';
import UserPreferencesProvider from '@/components/admin/UserPreferencesProvider';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { onboarding, updateOnboarding } = useOnboarding();
  const [activeTour, setActiveTour] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const tourId = (e as CustomEvent).detail;
      if (tourId) setActiveTour(tourId);
    };
    window.addEventListener('start-tour', handler);
    return () => window.removeEventListener('start-tour', handler);
  }, []);

  return (
    <>
      <AppShell>{children}</AppShell>
      <AiChatBubble />
      <ActivityTracker />
      <PWAInstall />
      <WalkthroughTours
        activeTour={activeTour}
        onTourComplete={async (tourId) => {
          setActiveTour(null);
          if (onboarding) {
            await updateOnboarding({
              tours_completed: { ...onboarding.tours_completed, [tourId]: true },
            });
          }
        }}
        onTourSkip={() => setActiveTour(null)}
      />
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login' || pathname?.startsWith('/admin/join');

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => { document.body.classList.remove('admin-mode'); };
  }, []);

  if (isLogin) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <UserPreferencesProvider>
        <OnboardingProvider>
          <AdminContent>{children}</AdminContent>
        </OnboardingProvider>
      </UserPreferencesProvider>
    </AuthGuard>
  );
}
