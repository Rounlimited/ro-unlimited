import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Projects | ${COMPANY.name}`,
  description: `Commercial and residential project portfolio — ${COMPANY.fullName}, ${COMPANY.serviceArea}.`,
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
