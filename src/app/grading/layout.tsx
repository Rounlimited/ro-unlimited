import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Land Grading & Site Prep — Greenville & Upstate SC',
  description: 'Land grading, excavation, and complete site preparation in Upstate SC by RO Unlimited. Foundation work, drainage solutions, lot clearing, erosion control. 25+ years experience. Call (864) 304-0139.',
  keywords: ['land grading Greenville SC', 'excavation Upstate SC', 'site preparation contractor', 'lot clearing SC', 'erosion control', 'foundation excavation'],
  alternates: { canonical: 'https://rounlimited.com/grading' },
  openGraph: {
    title: 'Land Grading & Site Prep — RO Unlimited',
    description: 'Excavation, grading, drainage, and full site prep across the Upstate. From raw land to ready-to-build.',
    url: 'https://rounlimited.com/grading',
    siteName: 'RO Unlimited',
    type: 'website',
  },
};

export default function GradingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
