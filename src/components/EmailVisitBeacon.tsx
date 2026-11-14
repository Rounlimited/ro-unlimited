'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Credits website page views to the email that brought the visitor here.
 * Does nothing at all unless the visitor came through a tracked email link
 * (the ro_em cookie), so normal visitors make no extra request.
 */
export default function EmailVisitBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith('/admin')) return;
    if (!/(?:^|;\s*)ro_em=[a-f0-9]{24}/.test(document.cookie)) return;
    try {
      fetch('/api/t/p', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }), keepalive: true }).catch(() => {});
    } catch { /* never break the page */ }
  }, [path]);
  return null;
}
