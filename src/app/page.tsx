import Hero from '@/components/sections/Hero';
import DivisionCards from '@/components/sections/DivisionCards';
import WhyRO from '@/components/sections/WhyRO';
import ConstructionCTA from '@/components/sections/ConstructionCTA';
import SectionTransition from '@/components/animations/SectionTransition';
import { getHeroVideo } from '@/lib/sanity/queries';
import { COMMERCIAL_HOME_CARDS } from '@/lib/constants';

export const revalidate = 60;

export default async function HomePage() {
  let heroVideoUrl: string | null = null;
  try {
    heroVideoUrl = await getHeroVideo();
  } catch (e) {
    console.log('Hero video fetch skipped:', (e as Error).message);
  }

  return (
    <>
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
      <SectionTransition label="FLOOR 01" sparks />
      <DivisionCards
        items={COMMERCIAL_HOME_CARDS}
        eyebrow="Commercial sectors"
        titleBeforeGold="Built for"
        titleGold="serious work"
        exploreLabel="Explore"
      />
      <SectionTransition label="FLOOR 02" sparks />
      <WhyRO />
      <SectionTransition label="FLOOR 03" sparks />
      <ConstructionCTA />
    </>
  );
}
