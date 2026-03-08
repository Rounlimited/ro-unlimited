'use client';

import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hide site chrome (navbar, footer, progress bar, loading sequence)
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  return <>{children}</>;
}
