'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Site-wide analytics — the free third-party layer.
 *  - Vercel Web Analytics + Speed Insights: on for every page (privacy-safe,
 *    no cookies, no consent banner).
 *  - PostHog: page views, referrers, scroll depth, session replay and the
 *    named conversions (contact form, intake, phone tap). Activates only when
 *    NEXT_PUBLIC_POSTHOG_KEY is set, and never runs inside /admin — staff
 *    clicks would pollute the customer numbers.
 */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogReady: Promise<any> | null = null;
function loadPosthog() {
  if (!POSTHOG_KEY) return null;
  if (!posthogReady) {
    posthogReady = import('posthog-js').then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,           // we send our own on route change
        capture_pageleave: true,
        autocapture: true,
        session_recording: { maskAllInputs: true },
        persistence: 'localStorage+cookie',
      });
      return posthog;
    });
  }
  return posthogReady;
}

/** Fire a named conversion from anywhere on the public site. No-op if PostHog is off. */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  try { loadPosthog()?.then((ph) => ph.capture(name, props)); } catch { /* ignore */ }
}

export default function SiteAnalytics() {
  const pathname = usePathname();
  const search = useSearchParams();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin || !POSTHOG_KEY) return;
    const url = window.location.origin + pathname + (search?.toString() ? `?${search.toString()}` : '');
    loadPosthog()?.then((ph) => ph.capture('$pageview', { $current_url: url }));
  }, [pathname, search, isAdmin]);

  // Phone-number taps are the #1 conversion for a contractor site.
  useEffect(() => {
    if (isAdmin) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="tel:"], a[href^="mailto:"], a[href^="sms:"]') as HTMLAnchorElement | null;
      if (a) trackEvent(a.href.startsWith('tel:') ? 'phone_tap' : a.href.startsWith('sms:') ? 'sms_tap' : 'email_tap', { href: a.href, page: pathname });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, isAdmin]);

  return (
    <>
      <Analytics />
      {!isAdmin && <SpeedInsights />}
    </>
  );
}
