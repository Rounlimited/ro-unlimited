import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Commercial Capabilities | ${COMPANY.name}`,
  description: `${COMPANY.experience} years of commercial construction across ${COMPANY.serviceAreaShort}. Hood systems, life safety, structural shell, and site development — from pad to CO.`,
};

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
