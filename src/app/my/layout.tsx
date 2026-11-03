import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Projects — RO Unlimited',
  description: 'Sign in to follow your projects with RO Unlimited.',
  robots: { index: false, follow: false }, // customer area — never indexed
};

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
