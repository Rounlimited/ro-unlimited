import Hero from '@/components/sections/Hero';
import DivisionCards from '@/components/sections/DivisionCards';
import WhyRO from '@/components/sections/WhyRO';
import ConstructionCTA from '@/components/sections/ConstructionCTA';
import SectionTransition from '@/components/animations/SectionTransition';

export default function HomePage() {
  return (
    <>
      <Hero />
      <SectionTransition label="FLOOR 01" sparks />
      <DivisionCards />
      <SectionTransition label="FLOOR 02" sparks />
      <WhyRO />
      <SectionTransition label="FLOOR 03" sparks />
      <ConstructionCTA />
    </>
  );
}
