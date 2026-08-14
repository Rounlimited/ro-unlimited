import type { Metadata } from 'next';

// The hub page is a client component, so its metadata lives here. Without
// this, /utilities inherited the ROOT metadata — including a canonical of
// rounlimited.com, which told Google the division's money page was a
// duplicate of the homepage.
export const metadata: Metadata = {
  title: 'Underground Utilities — Water, Sewer, Storm & Septic | Greenville SC',
  description:
    'Licensed underground utility contractor in the Greenville–Easley area: water main taps and hot taps, ductile iron and C900 water lines, sanitary sewer, storm drainage, Tier 2 septic, and grease interceptors. Self-performed crews, licensed in SC, NC & GA.',
  alternates: { canonical: 'https://rounlimited.com/utilities' },
  openGraph: {
    title: 'RO Unlimited Utility Division — From the Underground Up',
    description:
      'Water main taps, sewer, storm drainage, Tier 2 septic, and grease interceptors — self-performed and licensed in SC, NC & GA.',
    url: 'https://rounlimited.com/utilities',
  },
};

export default function UtilitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
