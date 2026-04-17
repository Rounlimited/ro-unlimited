import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact RO Unlimited — Get a Quote in Upstate SC',
  description: 'Contact RO Unlimited for residential, commercial, roofing, electrical, plumbing, septic, or general repair work in Upstate SC. Call (864) 304-0139 or request a quote online. Honest pricing, fast response.',
  alternates: { canonical: 'https://rounlimited.com/contact' },
  openGraph: {
    title: 'Contact RO Unlimited',
    description: 'Reach RO Unlimited for any construction, repair, or service work across Upstate SC, GA, and NC. Honest answers, fast quotes.',
    url: 'https://rounlimited.com/contact',
    siteName: 'RO Unlimited',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
