'use client';

import { useState, useRef, useEffect } from 'react';

interface HeroVideoProps {
  videoUrl: string | null;
}

export default function HeroVideo({ videoUrl }: HeroVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleLoaded = () => setLoaded(true);

    // If already loaded (cached), set immediately
    if (video.readyState >= 3) {
      setLoaded(true);
      return;
    }

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
    };
  }, [videoUrl]);

  if (!videoUrl) return null;

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
