import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Build Process — How We Take Projects from Start to Finish | RO Unlimited',
  description: 'See how RO Unlimited takes projects from raw land to finished product. Architectural design, planning, permitting, construction management, quality assurance, and final delivery.',
  alternates: { canonical: 'https://rounlimited.com/process' },
  openGraph: {
    title: 'The Build Process — RO Unlimited',
    description: 'Our full build process — every phase, every detail, from concept to final walkthrough.',
    url: 'https://rounlimited.com/process',
    siteName: 'RO Unlimited',
    type: 'website',
  },
};

export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
