import Hero from '@/components/sections/Hero';
import DivisionCards from '@/components/sections/DivisionCards';
import WhyRO from '@/components/sections/WhyRO';
import ConstructionCTA from '@/components/sections/ConstructionCTA';
import SectionTransition from '@/components/animations/SectionTransition';
import { getHeroVideo } from '@/lib/sanity/queries';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, SITE_URL, SITE_NAME, LEGAL_NAME, ORG_ID, WEBSITE_ID } from '@/lib/seo';

export const revalidate = 60;

// Title = keyword + place + brand. The slogan ("From the Underground Up")
// stays on the page itself, never in the title's keyword slot.
export const metadata: Metadata = pageMeta({
  title: 'Commercial General Contractor in Greenville, SC',
  description: 'Commercial general contractor based in Easley, SC. Ground-up buildings, site work and underground utilities across Upstate South Carolina and Northeast Georgia.',
  path: '/',
  image: '/og-licenses.png',
  imageAlt: `${LEGAL_NAME}: commercial general contractor, South Carolina and Georgia`,
});

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: LEGAL_NAME,
  inLanguage: 'en-US',
  publisher: { '@id': ORG_ID },
};

export default async function HomePage() {
  let heroVideoUrl: string | null = null;
  try {
    heroVideoUrl = await getHeroVideo();
  } catch (e) {
    console.log('Hero video fetch skipped:', (e as Error).message);
  }

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      {/*
        Preload the hero video during the splash screen so it's buffered
        and ready to play the instant ro:site-ready fires.
        Next.js injects this as <link rel="preload"> in <head>.
      */}
      {heroVideoUrl && (
        // eslint-disable-next-line @next/next/no-head-element
        <link
          rel="preload"
          as="video"
          href={heroVideoUrl}
          // @ts-expect-error — fetchpriority is valid HTML but not in React types yet
          fetchpriority="high"
        />
      )}

      <Hero heroVideoUrl={heroVideoUrl} />
      {/* LicenseBand pulled off the homepage 2026-10-24 (owner: "too much
          tech info, it won't keep customers on the site"). It lives on
          /licenses; the hero chip is the only homepage pointer. */}
      <SectionTransition label="FLOOR 01" sparks />
      <DivisionCards />
      <SectionTransition label="FLOOR 02" sparks />
      <WhyRO />
      <SectionTransition label="FLOOR 03" sparks />
      <ConstructionCTA />
    </>
  );
}
