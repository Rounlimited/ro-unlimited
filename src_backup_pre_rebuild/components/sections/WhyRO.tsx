'use client';

import { useRef } from 'react';
import { Shield, Clock, Wrench, Award } from 'lucide-react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';
import BlueprintGrid from '@/components/animations/BlueprintGrid';

const REASONS = [
  { icon: Shield, title: '25+ Years Proven', description: 'Over two decades of solving complex construction challenges across commercial and residential projects.' },
  { icon: Wrench, title: 'Total Capability', description: 'Land grading to luxury finishes — one company handles every phase so nothing falls through the cracks.' },
  { icon: Clock, title: 'Still Standing', description: "Customers call us 20 years later because the work lasts. That's the kind of builder you want on your project." },
  { icon: Award, title: 'Problem Solvers', description: "We take on the complex jobs other contractors won't touch. Difficult sites, tight timelines, high standards." },
];

export default function WhyRO() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // ─── useGSAP: auto-cleanup, scoped to sectionRef ───
  useGSAP(() => {
    // "Different" text scales in
    if (titleRef.current) {
      const differentSpan = titleRef.current.querySelector('.different-text');
      if (differentSpan) {
        gsap.fromTo(differentSpan,
          { scale: 1.4, opacity: 0 },
          {
            scale: 1, opacity: 1,
            duration: 0.8,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }

    // Cards rise up with stagger
    if (cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative py-24 bg-ro-gray-900/30">
      <BlueprintGrid intensity="medium" animate={true} className="opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Why RO Unlimited</span>
          <h2 ref={titleRef} className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase mb-4">
            Built <span className="different-text gradient-text-gold inline-block">Different</span>
          </h2>
          <div className="mx-auto w-24 gold-line" />
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REASONS.map((reason) => (
            <div key={reason.title} className="group relative p-8 border border-ro-gray-800 hover:border-ro-gold/20 bg-ro-black/50 transition-all duration-500">
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-ro-gold/20 group-hover:bg-ro-gold/50 transition-colors" />
              <reason.icon size={28} className="text-ro-gold mb-4" />
              <h3 className="text-ro-white font-heading text-lg tracking-wider uppercase mb-3">{reason.title}</h3>
              <p className="text-ro-gray-500 text-sm leading-relaxed">{reason.description}</p>
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-ro-gold group-hover:w-full transition-all duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
