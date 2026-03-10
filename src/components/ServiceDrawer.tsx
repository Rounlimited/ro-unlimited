'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';
import { X, ArrowRight, Clock, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { ServiceDetail } from '@/lib/commercial-data';

interface ServiceDrawerProps {
  service: ServiceDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ServiceDrawer — cinematic slide-up bottom sheet (mobile) / side panel (desktop).
 * Opens with GSAP animation, locks body scroll, dismisses via overlay, X, or swipe.
 * Matches the Alpina B7 design language: black, gold, blueprint grid.
 */
export default function ServiceDrawer({ service, isOpen, onClose }: ServiceDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  // Open animation
  useEffect(() => {
    if (isOpen && service) {
      setVisible(true);
      document.body.style.overflow = 'hidden';

      if (reducedMotion) return;

      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      tl.fromTo(drawerRef.current,
        { y: '100%', opacity: 0.5 },
        { y: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' },
        0.1
      );
    }
  }, [isOpen, service, reducedMotion]);

  // Close animation
  const handleClose = () => {
    if (reducedMotion) {
      setVisible(false);
      document.body.style.overflow = '';
      onClose();
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        document.body.style.overflow = '';
        onClose();
      }
    });
    tl.to(drawerRef.current, { y: '100%', opacity: 0, duration: 0.35, ease: 'power2.in' });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.1);
  };

  // ESC key close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) handleClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  if (!visible || !service) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 150 }}>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Drawer panel — bottom sheet on mobile, right panel on desktop */}
      <div
        ref={drawerRef}
        className="absolute bottom-0 left-0 right-0 lg:left-auto lg:top-0 lg:w-[520px]
          max-h-[85vh] lg:max-h-full overflow-y-auto
          bg-[#0d0d0d] border-t border-ro-gold/20 lg:border-t-0 lg:border-l lg:border-ro-gold/20"
      >
        {/* Gold handle bar — mobile only */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-ro-gold/30" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border border-ro-gray-800 hover:border-ro-gold/30 bg-ro-black/50 transition-colors z-10"
          aria-label="Close"
        >
          <X size={18} className="text-ro-gray-400 hover:text-ro-gold transition-colors" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 lg:p-10 pt-8 lg:pt-12">
          {/* Blueprint grid background */}
          <div className="absolute inset-0 blueprint-overlay opacity-10 pointer-events-none" />

          <div className="relative z-10">
            {/* Service title */}
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase block mb-3">Service Detail</span>
            <h3 className="text-ro-white font-heading text-2xl sm:text-3xl tracking-tight uppercase leading-[0.95] mb-4">
              {service.title}
            </h3>
            <div className="w-16 h-[2px] bg-gradient-to-r from-ro-gold to-transparent mb-8" />

            {/* Overview */}
            <p className="text-ro-gray-300 text-sm sm:text-base leading-relaxed mb-8">{service.overview}</p>

            {/* What This Includes */}
            <div className="mb-8">
              <h4 className="text-ro-white font-heading text-sm tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-ro-gold" />
                What This Includes
              </h4>
              <div className="space-y-3">
                {service.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-ro-gold/60 mt-2 group-hover:bg-ro-gold transition-colors" />
                    <span className="text-ro-gray-400 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta info — target client + timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="p-4 border border-ro-gray-800/50 bg-ro-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={12} className="text-ro-gold" />
                  <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">Who This Is For</span>
                </div>
                <p className="text-ro-gray-400 text-xs sm:text-sm leading-relaxed">{service.targetClient}</p>
              </div>
              <div className="p-4 border border-ro-gray-800/50 bg-ro-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={12} className="text-ro-gold" />
                  <span className="text-ro-gold text-xs font-mono tracking-wider uppercase">Typical Timeline</span>
                </div>
                <p className="text-ro-gray-400 text-xs sm:text-sm leading-relaxed">{service.timeline}</p>
              </div>
            </div>

            {/* CTA */}
            <Link href="/contact"
              onClick={handleClose}
              className="group flex items-center justify-center gap-3 w-full px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300">
              {service.ctaText}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Bottom gold line */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-ro-gold/30 to-transparent mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
