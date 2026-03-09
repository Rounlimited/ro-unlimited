'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isPublicAdminRoute =
    pathname === '/admin/login' ||
    pathname?.startsWith('/admin/join') ||
    pathname?.startsWith('/admin/access');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // No session — only redirect if not on a public admin route
      if (!session && !isPublicAdminRoute) {
        router.push('/admin/login');
        return;
      }

      // Already signed in — redirect away from login only (not join/access, they handle their own redirects)
      if (session && pathname === '/admin/login') {
        router.push('/admin');
        return;
      }

      setUser(session?.user || null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicAdminRoute) {
        router.push('/admin/login');
      }
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase, isPublicAdminRoute]);

  if (loading && !isPublicAdminRoute) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
