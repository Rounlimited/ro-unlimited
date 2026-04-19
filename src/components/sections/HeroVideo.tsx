'use client';

import { useRef, useEffect } from 'react';

interface HeroVideoProps {
  videoUrl: string | null;
  onReady?: () => void; // fires 2s after video starts playing
}

/**
 * Hero background video.
 *
 * Strategy:
 * - Starts buffering immediately on mount (preload="auto") so video is
 *   ready during the ROLoader splash — no stutter on play.
 * - Does NOT autoplay. Waits for 'ro:site-ready' event before calling play().
 * - Fires onReady() shortly after play starts so Hero can build immediately.
 * - If no video, fires onReady immediately when site-ready fires.
 */
export default function HeroVideo({ videoUrl, onReady }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) {
      // No video — fire onReady when site is ready (or immediately if already ready)
      const fire = () => { if (!firedRef.current) { firedRef.current = true; onReady?.(); } };
      if ((window as any).__roSiteReady) { fire(); return; }
      window.addEventListener('ro:site-ready', fire, { once: true });
      return () => window.removeEventListener('ro:site-ready', fire);
    }

    const video = videoRef.current;

    // Kick off buffering NOW — browser downloads video bytes during the splash
    // even though we won't call play() until ro:site-ready fires.
    video.load();

    const startPlayback = () => {
      if (firedRef.current) return;
      video.play().catch(() => {});
      // Brief frame so video is visible, then kick off text build immediately
      setTimeout(() => {
        if (!firedRef.current) {
          firedRef.current = true;
          onReady?.();
        }
      }, 250);
    };

    const onSiteReady = () => {
      // If video is already buffered enough, play immediately
      if (video.readyState >= 3) {
        startPlayback();
      } else {
        // Wait for enough data then play
        video.addEventListener('canplay', startPlayback, { once: true });
      }
    };

    if ((window as any).__roSiteReady) {
      onSiteReady();
      return;
    }

    window.addEventListener('ro:site-ready', onSiteReady, { once: true });
    return () => window.removeEventListener('ro:site-ready', onSiteReady);
  }, [videoUrl, onReady]);

  if (!videoUrl) return null;

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
