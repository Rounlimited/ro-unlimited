'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/admin/AuthGuard';
import AppShell from '@/components/admin/AppShell';

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
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
