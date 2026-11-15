import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, breadcrumbLd } from '@/lib/seo';

const DESCRIPTION = 'RO Unlimited partners with trade professionals across South Carolina and Georgia: framers, electricians, plumbers and finishers. Apply to join the network.';

export const metadata: Metadata = pageMeta({
  title: 'Subcontractor & Trade Partner Network | SC & GA',
  description: DESCRIPTION,
  path: '/join',
});

const structuredData = [
  breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Join the RO Network', path: '/join' }]),
];

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={structuredData} onlyPath="/join" />
      {children}
    </>
  );
}
