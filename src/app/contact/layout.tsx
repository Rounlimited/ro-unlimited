import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Commercial RFP | ${COMPANY.name}`,
  description: `Submit a commercial construction RFP — ${COMPANY.fullName}. ${COMPANY.serviceAreaShort}.`,
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
