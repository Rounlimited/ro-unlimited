import MobilePageFlip, { FlipSlide } from '@/components/animations/MobilePageFlip';
import Hero from '@/components/sections/Hero';
import DivisionCards from '@/components/sections/DivisionCards';
import WhyRO from '@/components/sections/WhyRO';
import ConstructionCTA from '@/components/sections/ConstructionCTA';
import SectionTransition from '@/components/animations/SectionTransition';
import { getHeroVideo } from '@/lib/sanity/queries';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  let heroVideoUrl: string | null = null;
  try {
    heroVideoUrl = await getHeroVideo();
  } catch (e) {
    // Sanity not configured yet or no video uploaded ��������� graceful fallback
    console.log('Hero video fetch skipped:', (e as Error).message);
  }

  return (
    <MobilePageFlip>
      <FlipSlide><Hero heroVideoUrl={heroVideoUrl} /></FlipSlide>
      <SectionTransition label="FLOOR 01" sparks className="hidden lg:block" />
      <FlipSlide><DivisionCards /></FlipSlide>
      <SectionTransition label="FLOOR 02" sparks className="hidden lg:block" />
      <FlipSlide><WhyRO /></FlipSlide>
      <SectionTransition label="FLOOR 03" sparks className="hidden lg:block" />
      <FlipSlide><ConstructionCTA /></FlipSlide>
    </MobilePageFlip>
  );
}


