import type { Metadata } from 'next';
import PortalShell from '@/components/portal/PortalShell';

export const metadata: Metadata = {
  title: 'Customer Portal — RO Unlimited',
  description: 'Sign in to follow your projects with RO Unlimited.',
  robots: { index: false, follow: false }, // customer area — never indexed
};

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
