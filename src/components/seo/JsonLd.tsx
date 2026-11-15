'use client';

import { usePathname } from 'next/navigation';

/**
 * Structured data, rendered into the first HTML response.
 *
 * `onlyPath` matters when this is used from a layout: a layout also wraps
 * every page beneath it, so without the check /services/roofing/metal-roofing
 * would carry the roofing hub's Service and breadcrumb as well as its own.
 */
export default function JsonLd({ data, onlyPath }: { data: object | object[]; onlyPath?: string }) {
  const pathname = usePathname();
  if (onlyPath && (pathname || '').replace(/\/$/, '') !== onlyPath.replace(/\/$/, '')) return null;
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // "<" is escaped so a stray "</script>" in copy can never close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
